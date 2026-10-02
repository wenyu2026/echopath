/**
 * 决策地形 v2 引擎 —— 两阶段检索 + 路径聚类
 * ============================================
 * 与 v1（retrieve.ts）的区别：
 *
 *   v1  一个 Situation 去 36 个 Episode 里找最像的 3 个
 *   v2  先人找人，再节点找节点
 *        第一阶段  Profile + PriorPath   →  Person / LifeState（候选人物）
 *        第二阶段  Situation + RootFactors →  Decision Episode
 *        第三阶段  按 root_factors 聚类    →  2-4 条 PathArchetype
 *
 * ⚠️ 刻意不改 server/retrieval/retrieve.ts
 *   那是 Damn4lee 的责任区，现有六页在用。本文件**新增**，不碰它。
 *
 * ⚠️ 三条实测得出的设计约束（推翻任何一条都会让结果变假）
 *
 *   ① 聚类必须用 root_factors 的集合重叠，**不能用机制文本的 embedding**
 *      实测三条机制文本：
 *        鲁迅: 当已投入的路径与制度绑定的身份同时构成约束时…
 *        李安: 当已有投入形成特定能力积累，但制度性通道长期不开放时…
 *        村上: 当既有路径尚能维持生存且未彻底失效时…
 *      字符重叠高达 0.76–1.00（完全区分不开）；
 *      而 root_factors 的 Jaccard 是 0.25–0.67（能区分）。
 *
 *   ② 只聚出一种走法时**必须诚实说**，不许凑数
 *      返回 single_path_only: true + caveat，UI 明说「只找到一种明确的走法」。
 *
 *   ③ 人物后置
 *      路径卡上**不出现大头像、不把姓名当主视觉**，姓名只在 supporting_cases 里。
 */

import type { DecisionEpisode } from '../../src/types/episode.ts';
import type {
  LandscapeResponse,
  PathArchetype,
  PathArchetypeId,
  PersonalizedCost,
  RootFactor,
  SituationV2,
  SupportingCase,
} from '../../src/types/landscape.ts';
import { ROOT_FACTORS } from '../../src/types/landscape.ts';
import type { TaggedEpisode } from './data-source.ts';

/* ============================================================
   配置（可调，集中放这里便于答辩时解释）
   ============================================================ */

export const LANDSCAPE_CONFIG = {
  /** 第一阶段召回多少人物进入第二阶段 */
  person_recall: 8,
  /** 最终最多几条路径 */
  max_archetypes: 4,
  /**
   * 聚类阈值：两条案例的 root_factors Jaccard ≥ 此值即归为同一条路径。
   *
   * 0.34 是拍出来的起点值，不是科学结论。
   * 实测参考：鲁迅 vs 村上 = 0.25（应分开）；李安 vs 村上 = 0.67（应合并）。
   * 正式版应该用 20-30 个团队人工标注场景来调。
   */
  jaccard_threshold: 0.34,
  /** 一条路径至少要有几个案例支撑（少于这个数就不单独成路） */
  min_cases_per_archetype: 1,
} as const;

/** 走法原型的标题与描述 —— 这是**领域内容**，不该写死在前端 */
const ARCHETYPE_COPY: Record<PathArchetypeId, { title: string; one_line: string }> = {
  persist: {
    title: '守住已经建立的路径',
    one_line: '继续，不一定因为看不见别的路，也可能因为已经拥有的东西值得保护。',
  },
  explore_then_persist: {
    title: '先低成本试一次，再决定留下',
    one_line: '用一段真实的体验做排除法 —— 试过之后选择留下，和没试过就留下不是一回事。',
  },
  explore_then_switch: {
    title: '先低成本试一次，验证后再转向',
    one_line: '不押上全部筹码，先花一小段时间确认新方向真的可行。',
  },
  direct_switch: {
    title: '直接转向',
    one_line: '不做过渡，直接换到另一条路上。代价是最集中，决断也最明确。',
  },
  dual_track: {
    title: '两条轨并行',
    one_line: '不切断原来的路，同时维持新方向的投入。形式上离开、实质上没离开也算这一种。',
  },
  abandon: {
    title: '退出这条路径',
    one_line: '不只是换个方向，而是承认这条路的投入要止损。',
  },
  unknown: {
    title: '证据不足以判定走法',
    one_line: '现有材料无法确认他实际选择了哪一类做法。',
  },
};

/* ============================================================
   工具：根因素 Jaccard
   ============================================================ */

/**
 * 两个根因素集合的 Jaccard 相似度。
 *
 * ⚠️ 这是聚类的**唯一依据**（约束①）。
 *   不要改成「机制文本的余弦相似度」—— 实测那样区分不开。
 */
export function jaccard(a: RootFactor[], b: RootFactor[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** 把用户输入的根因素规范化（过滤词表外的值） */
export function normalizeRootFactors(raw: string[]): RootFactor[] {
  const valid = new Set<string>(ROOT_FACTORS);
  const out: RootFactor[] = [];
  for (const r of raw) {
    const s = String(r).trim();
    if (valid.has(s) && !out.includes(s as RootFactor)) out.push(s as RootFactor);
  }
  return out;
}

/* ============================================================
   第一阶段：人找人
   ============================================================ */

export interface PersonCandidate {
  personName: string;
  /** 该人物所有案例 */
  episodes: TaggedEpisode[];
  /** 人物级相似度 */
  score: number;
  /** 为什么算相似（可解释） */
  reasons: string[];
}

/** 用户来时路的文本（用于第一阶段召回） */
function profileText(s: SituationV2): string {
  return [
    `阶段：${s.stage}`,
    `岔路：${s.options.join('、')}`,
    `约束：${s.constraints.join('、')}`,
    `目标：${s.goals.join('、')}`,
    `根因素：${s.root_factors.join('、')}`,
  ].join('。');
}

/** 人物轨迹文本：把该人物的所有 case 拼起来 */
function personTrajectoryText(eps: TaggedEpisode[]): string {
  return eps
    .map((e) =>
      [
        `（${e.time.year} 年）`,
        `此前：${e.prior_path.join('；')}`,
        `抉择：${e.decision_state.dilemma}`,
        `约束：${e.decision_state.constraints.join('、')}`,
      ].join(''),
    )
    .join(' ');
}

/** 简单的中文字符 bigram 重叠 —— 与 dimensions.ts 的做法一致，不引额外依赖 */
function bigrams(s: string): Set<string> {
  const t = s.replace(/[\s，。、；：（）()【】「」…—\-]/g, '');
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2));
  return out;
}

function textSim(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * 第一阶段：从用户来时路召回结构相近的人物。
 *
 * ⚠️ 为什么需要这一阶段（而不是直接 Situation → Episode）
 *   避免「这个 Episode 文本很像，但人物此前的资源条件、路径投入完全不同」。
 *   典型反例：一个「已投入五年、家里指望他稳定」的人，
 *   和一个「刚毕业、无负担」的人，即使当下困境文本相似，也不该互相对照。
 */
export function recallPersons(situation: SituationV2, episodes: TaggedEpisode[]): PersonCandidate[] {
  // 按人物聚合
  const byPerson = new Map<string, TaggedEpisode[]>();
  for (const e of episodes) {
    const arr = byPerson.get(e.person.name) ?? [];
    arr.push(e);
    byPerson.set(e.person.name, arr);
  }

  const userText = profileText(situation);
  const userFactors = situation.root_factors;

  const candidates: PersonCandidate[] = [];
  for (const [name, eps] of byPerson) {
    const trajText = personTrajectoryText(eps);
    const semantic = textSim(userText, trajText);

    // 结构相似：用户根因素与该人物所有案例根因素并集的重叠
    const personFactors = new Set<RootFactor>();
    for (const e of eps) {
      for (const f of e.mechanism?.root_factors ?? []) personFactors.add(f);
    }
    const structural = jaccard(userFactors, [...personFactors]);

    // 可逆性对齐（低可逆性的处境不该和高可逆性的人物强比）
    const revPenalty = eps.some((e) => e.decision_state.reversibility === situation.reversibility)
      ? 0
      : 0.05;

    const score = 0.4 * semantic + 0.6 * structural - revPenalty;

    const reasons: string[] = [];
    const shared = [...personFactors].filter((f) => userFactors.includes(f));
    if (shared.length > 0) reasons.push(`都受制于：${shared.join('、')}`);
    if (eps.some((e) => e.time.stage.includes(situation.stage.slice(0, 2)))) {
      reasons.push('人生阶段接近');
    }

    candidates.push({ personName: name, episodes: eps, score, reasons });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, LANDSCAPE_CONFIG.person_recall);
}

/* ============================================================
   第二阶段 + 第三阶段：节点找节点 + 聚类
   ============================================================ */

/**
 * 把候选案例按 root_factors 聚成路径。
 *
 * 算法：贪心聚类（不用 K-Means —— 样本太小，无监督聚类会不稳定）
 *   1. 按与用户根因素的相似度降序排列候选案例
 *   2. 逐个看它能否并入已有簇（与簇内任一成员 Jaccard ≥ 阈值）
 *   3. 并进去，或自己开一个新簇
 *   4. 只保留案例数 ≥ min_cases_per_archetype 的簇
 */
export function clusterIntoArchetypes(
  candidates: TaggedEpisode[],
  userFactors: RootFactor[],
): Array<{ archetype: PathArchetypeId; cases: TaggedEpisode[] }> {
  const scored = candidates
    .map((e) => ({
      ep: e,
      rel: jaccard(userFactors, e.mechanism?.root_factors ?? []),
    }))
    .sort((a, b) => b.rel - a.rel);

  const clusters: Array<{ archetype: PathArchetypeId; cases: TaggedEpisode[]; factors: RootFactor[] }> = [];

  for (const { ep } of scored) {
    const f = ep.mechanism?.root_factors ?? [];
    const archetype = ep.mechanism?.archetype ?? 'unknown';

    // 找能并入的簇：同类走法 **且** 根因素足够重叠
    const target = clusters.find((c) => {
      if (c.archetype !== archetype) return false;
      return c.cases.some((other) => jaccard(f, other.mechanism?.root_factors ?? []) >= LANDSCAPE_CONFIG.jaccard_threshold);
    });

    if (target) {
      target.cases.push(ep);
      for (const x of f) if (!target.factors.includes(x)) target.factors.push(x);
    } else {
      clusters.push({ archetype, cases: [ep], factors: [...f] });
    }
  }

  return clusters
    .filter((c) => c.cases.length >= LANDSCAPE_CONFIG.min_cases_per_archetype)
    .sort((a, b) => b.cases.length - a.cases.length)
    .slice(0, LANDSCAPE_CONFIG.max_archetypes)
    .map((c) => ({ archetype: c.archetype, cases: c.cases }));
}

/* ============================================================
   代价生成
   ============================================================ */

/**
 * 从案例结果里推出「对用户而言的代价」，并尽量挂上用户原话。
 *
 * ⚠️ 这是产品的核心差异化：**代价必须能追到用户自己说过的话**。
 *   用户看到「因为你刚才说……」才会信；只说「这条路有风险」是废话。
 *
 * ⚠️ 第一版的坑：直接把 `outcomes.mid_term` 当代价，结果出现
 *   「后来获得跟随 Fischberg 进行博士研究的机会」—— 那是**收获**不是**代价**。
 *   教训：**结果链 ≠ 代价**。代价必须从「约束一直存在」或「结果里的负面部分」推，
 *   而结果链本身只用来做「后来发生了什么」（那是另一栏）。
 */
function isNegativeOutcome(text: string): boolean {
  // 只认明确的负面信号，不猜
  return /失败|落榜|未|没有|放弃|退出|止损|无望|紧张|消耗|遗憾|后悔|低于|缓慢|波动|被迫|再次转行|撑不过/.test(
    text,
  );
}

function buildCosts(
  cases: TaggedEpisode[],
  situation: SituationV2,
  userQuote?: string,
): PersonalizedCost[] {
  const costs: PersonalizedCost[] = [];

  // ① 首选：从结果链里挑**明确负面**的那一条，挂上用户原话
  //    （这才叫「对你而言的代价」—— 别人的一段负面经历 + 你在意的点）
  const negatives = cases
    .map((e) => e.outcomes.mid_term || e.outcomes.short_term)
    .filter((x) => typeof x === 'string' && isNegativeOutcome(x));

  if (userQuote && userQuote.trim().length > 0 && negatives.length > 0) {
    const q = userQuote.trim();
    // 挑与用户在意点最相关的那条负面结果
    const best = negatives
      .map((o) => ({ o, s: textSim(o, q) + textSim(o, situation.goals.join('')) }))
      .sort((a, b) => b.s - a.s)[0];

    costs.push({
      text: best.o,
      basis: { kind: 'user_quote', quote: q, note: '与用户明确表达过的在意点直接相关' },
    });
  }

  // ② 其次：约束会一直存在 —— 这是最稳的「代价」来源
  for (const e of cases) {
    const c = e.decision_state.constraints[0];
    if (!c) continue;
    const text = `即使选了这条路，「${c}」也不会消失`;
    if (costs.some((x) => x.text === text)) continue;
    costs.push({
      text,
      basis: { kind: 'structure', note: `来自案例 ${e.episode_id} 的约束条件` },
    });
    if (costs.length >= 3) break;
  }

  // ③ 兜底：真的没有就说不知道，不编
  if (costs.length === 0) {
    costs.push({
      text: '现有材料不足以判断这条路对你的具体代价。',
      basis: { kind: 'unknown', note: '候选案例的结果链不完整' },
    });
  }

  return costs.slice(0, 3);
}

/** 「这条路保护的是什么」—— 从案例的 goals + 没有付出的东西里推 */
function buildProtects(cases: TaggedEpisode[]): string[] {
  const out: string[] = [];
  for (const e of cases) {
    for (const g of e.decision_state.goals) {
      const t = `继续拥有「${g}」的可能`;
      if (!out.includes(t)) out.push(t);
    }
    if (out.length >= 3) break;
  }
  if (out.length === 0) out.push('现有材料未记录他保护了什么');
  return out.slice(0, 3);
}

function buildSupportingCases(cases: TaggedEpisode[]): SupportingCase[] {
  return cases.map((e) => ({
    episode_id: e.episode_id,
    display_name: e.person.name,
    year: e.time.year,
    // ⚠️ 只给「之后发生了什么」，绝不给「因为选了这个所以成功」
    outcome_hint: (e.outcomes.long_term || e.outcomes.mid_term || '').slice(0, 40),
  }));
}

/* ============================================================
   主入口
   ============================================================ */

export interface LandscapeInput {
  situation: SituationV2;
  /** 用户在访谈里说过的一句话 —— 用于把代价挂到他的话上 */
  user_quote?: string;
}

export function buildLandscape(
  input: LandscapeInput,
  source: { info: LandscapeResponse['data_source']; episodes: TaggedEpisode[] },
): LandscapeResponse {
  const t0 = Date.now();
  const situation: SituationV2 = {
    ...input.situation,
    root_factors: normalizeRootFactors(input.situation.root_factors as unknown as string[]),
  };

  // 第一阶段：人找人
  const persons = recallPersons(situation, source.episodes);

  // 第二阶段：只在这些人物的案例里找节点
  const candidateEpisodes = persons.flatMap((p) => p.episodes);

  // 第三阶段：聚类成路径
  const clusters = clusterIntoArchetypes(candidateEpisodes, situation.root_factors);

  const archetypes: PathArchetype[] = clusters.map(({ archetype, cases }) => {
    const copy = ARCHETYPE_COPY[archetype] ?? ARCHETYPE_COPY.unknown;
    return {
      id: archetype,
      title: copy.title,
      one_line: copy.one_line,
      protects: buildProtects(cases),
      costs: buildCosts(cases, situation, input.user_quote),
      supporting_cases: buildSupportingCases(cases),
      // 单条案例支撑时打标，让用户知道这条路的证据厚度
      caveat:
        cases.length === 1
          ? '这条路径目前只有 1 个案例支撑，参考价值有限。'
          : undefined,
    };
  });

  const singlePathOnly = archetypes.length <= 1;

  // 一句人话翻译 —— 把根因素串成「你真正在选什么」
  const mechanismReading =
    situation.root_factors.length > 0
      ? `你真正面对的，不只是「${situation.options[0] ?? situation.stage}」。` +
        `它更像是：在${situation.root_factors.slice(0, 2).join('与')}的约束下，` +
        `决定要不要承担${situation.root_factors.includes('转换成本') ? '转换成本' : '代价'}去换一个更匹配的长期方向。`
      : `你正处在「${situation.stage}」，面前有 ${situation.options.length} 条路。`;

  return {
    data_source: source.info,
    profile: {
      stage: situation.stage,
      root_factors: situation.root_factors,
      mechanism_reading: mechanismReading,
      constraints: situation.constraints,
      goals: situation.goals,
    },
    archetypes,
    single_path_only: singlePathOnly,
    meta: {
      persons_recalled: persons.length,
      episodes_matched: candidateEpisodes.length,
      archetypes_found: archetypes.length,
      elapsed_ms: Date.now() - t0,
      clustering: {
        method: 'root_factor_jaccard',
        threshold: LANDSCAPE_CONFIG.jaccard_threshold,
      },
    },
  };
}

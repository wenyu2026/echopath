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
  const t = s.replace(/[\s，。、；：（）()【】「」…—-]/gu, '');
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
 * 把候选案例聚成路径。
 *
 * ⚠️ 第二版重写了聚类逻辑。第一版的问题（实测数据）：
 *
 *   与用户根因素的 Jaccard 分布是**断崖式**的，没有中间地带：
 *     0.60  ← 10 条案例
 *     0.33  ← 10 条案例
 *   我原来把阈值设在 0.34，正好卡在断崖中间 —— 结果
 *     direct_switch 5 条 / explore_then_switch 2 条 / 其余各 1 条
 *   4 条路径里 3 条只有 1 个案例，看起来有厚度其实没有。
 *
 *   根因：我用**一个全局阈值**同时管两件事 ——
 *     ① 这条案例与「用户」像不像
 *     ② 两条案例彼此像不像
 *   这两件事不是一回事。abandon / persist 这类走法，
 *   它们内部成员彼此很像，但与「用户」的重叠天然就低
 *   （因为用户当前面对的不是它们那个张力），却被同一个阈值挡在外面。
 *
 *   修法：**先按走法分组，再在组内做连贯性检查**。
 *     ① 分组用 archetype（这是人工定义的强先验，比阈值可靠）
 *     ② 组内用「与组内众数的重叠」判断连贯性，而不是与用户的重叠
 *     ③ 与用户的重叠只用于**排序**（哪条路对用户更相关），不用于准入
 *
 *   这样每条路都能拿到它该有的全部案例，厚度如实反映数据。
 */
export function clusterIntoArchetypes(
  candidates: TaggedEpisode[],
  userFactors: RootFactor[],
): Array<{ archetype: PathArchetypeId; cases: TaggedEpisode[]; relevance: number }> {
  // ① 按 archetype 分组
  const groups = new Map<PathArchetypeId, TaggedEpisode[]>();
  for (const e of candidates) {
    const a = e.mechanism?.archetype ?? 'unknown';
    const arr = groups.get(a) ?? [];
    arr.push(e);
    groups.set(a, arr);
  }

  const result: Array<{ archetype: PathArchetypeId; cases: TaggedEpisode[]; relevance: number }> = [];

  for (const [archetype, eps] of groups) {
    if (archetype === 'unknown') continue;

    // ② 组内连贯性：算出「组内共识根因素」（出现 ≥50% 的）
    const freq = new Map<RootFactor, number>();
    for (const e of eps) {
      for (const f of new Set(e.mechanism?.root_factors ?? [])) {
        freq.set(f, (freq.get(f) ?? 0) + 1);
      }
    }
    const consensus = new Set(
      [...freq.entries()].filter(([, n]) => n / eps.length >= 0.5).map(([f]) => f),
    );

    // 保留与共识有交集的案例；组内只有 1-2 条时不筛（样本太小，筛了就没意义）
    const kept =
      eps.length <= 2
        ? eps
        : eps.filter((e) => (e.mechanism?.root_factors ?? []).some((f) => consensus.has(f)));

    const use = kept.length > 0 ? kept : eps;

    // ③ 与用户的相关度（只用于排序，不用于准入）
    const relevance =
      use.reduce((sum, e) => sum + jaccard(userFactors, e.mechanism?.root_factors ?? []), 0) / use.length;

    result.push({ archetype, cases: use, relevance });
  }

  return result
    .filter((g) => g.cases.length >= LANDSCAPE_CONFIG.min_cases_per_archetype)
    .sort((a, b) => b.cases.length - a.cases.length || b.relevance - a.relevance)
    .slice(0, LANDSCAPE_CONFIG.max_archetypes);
}

/* ============================================================
   代价生成
   ============================================================ */

/* ============================================================
   数据卫生：区分「人物结果」与「数据维护备注」
   ============================================================ */

/**
 * ⚠️ 实测：data/episodes.json 的 outcomes 里混着**数据维护备注**。
 *
 *   108 条 outcomes 里有 21 条（19%）不是人物结果，而是类似：
 *     「未知：本来源没有证明所有受影响员工实际获得安置。」
 *     「未知：所用大学简介未列中断后最初数年的个人收入与学业影响。」
 *     「不能据此推算未创业的结局。」
 *
 *   这些备注本身是**好东西** —— 它是数据团队在诚实地标注「我们查不到什么」，
 *   属于 unknowns 层，应该显示在证据抽屉里。
 *
 *   但它**不能当人物结果用**：把它放进路径卡的「代价」栏，
 *   用户看到的是「未知：本来源没有证明……」—— 完全读不通。
 *
 *   第一版我就踩了这个坑：加「只认负面词」的过滤，
 *   结果「未知：本来源没有证明」里的「没有」被判成负面，照样漏进来。
 *
 * ⚠️ 根本修法应该是把这些备注挪到独立字段（已反馈给数据 owner）。
 *   在数据改之前，引擎这边必须自己挡住，不能让脏数据流到 UI。
 */
const META_NOTE_PATTERNS = [
  /^未知[：:]/,
  /^注意[：:]/,
  /^说明[：:]/,
  /^注[：:]/,
  /本集没有/,
  /本来源没有/,
  /本来源未/, // 「本来源未列中断后……」
  /所用(来源|大学简介|资料)未/,
  /没有对照/,
  /没有系统评估/,
  /没有逐年披露/,
  /没有隔离/,
  /无法隔离/,
  /无法证明/,
  /不能证明/,
  /不能据此/,
  /不能从.{0,12}推断/,
  /未核实/,
  /不等于/,
];

/** 这条 outcomes 文本是「人物结果」还是「数据维护备注」？ */
export function isMetaNote(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return true;
  return META_NOTE_PATTERNS.some((re) => re.test(t));
}

/** 取一条真正的人物结果（跳过维护备注） */
function humanOutcome(e: TaggedEpisode, prefer: 'mid_term' | 'short_term' | 'long_term' = 'mid_term'): string | null {
  const order: Array<'short_term' | 'mid_term' | 'long_term'> =
    prefer === 'mid_term' ? ['mid_term', 'short_term', 'long_term'] : [prefer, 'mid_term', 'short_term'];
  for (const k of order) {
    const v = e.outcomes[k];
    if (typeof v === 'string' && v.trim() && !isMetaNote(v)) return v.trim();
  }
  return null;
}

/**
 * 从案例结果里推出「对用户而言的代价」，并尽量挂上用户原话。
 *
 * ⚠️ 这是产品的核心差异化：**代价必须能追到用户自己说过的话**。
 *   用户看到「因为你刚才说……」才会信；只说「这条路有风险」是废话。
 *
 * ⚠️ 两个已踩过的坑：
 *   ① 直接把 outcomes.mid_term 当代价 → 输出「后来获得跟随 X 进行博士研究的机会」（收获不是代价）
 *   ② 只按「负面词」过滤 → 「未知：本来源没有证明」里的「没有」被判成负面，照样漏进来
 *   现在：先挡维护备注（isMetaNote），再找明确负面的结果。
 */
function isNegativeOutcome(text: string): boolean {
  return /失败|落榜|未完成|放弃|退出|止损|无望|紧张|消耗|遗憾|后悔|低于|缓慢|波动|被迫|再次转行|撑不过|没有成为|没有完成|失去/.test(
    text,
  );
}

/**
 * 判断一条代价是否与用户原话**语义相关**。
 *
 * ⚠️ 走过的弯路：我一开始用「字符 bigram 重叠 ≥ 0.06」当判据，结果全被挡掉 ——
 *   「我不太怕晚毕业，我最怕的是再浪费几年」
 *   vs「第一次跨考落榜，毕业后进入一家小公司做测试」
 *   字面重叠只有 0.029，但**语义上明显相关**（都是「白走一趟」）。
 *
 *   字符级重合检测不了语义关联。改用**概念命中** ——
 *   人在意的事情往往落在少数几个概念上（时间、方向、钱、家庭……），
 *   代价文本里会以不同措辞再次出现这些概念。
 */
const CONCEPT_GROUPS: Array<{ name: string; words: RegExp }> = [
  { name: '时间/浪费', words: /晚|浪费|白走|几年|两年|一年|时间|耗|久|拖/ },
  { name: '方向/匹配', words: /方向|适合|对口|喜欢|兴趣|匹配|认可|意义/ },
  { name: '收入/经济', words: /收入|薪资|薪酬|钱|经济|工资|低|穷/ },
  { name: '家庭/期待', words: /家|父母|家人|期待|期望|解释/ },
  { name: '失败/重来', words: /失败|落榜|没|放弃|退回|重新|再来|转行|转岗/ },
  { name: '稳定/风险', words: /稳定|不稳|风险|断|波动|压力/ },
  { name: '能力/积累', words: /积累|技能|能力|基础|训练|证明/ },
  { name: '学历/资格', words: /学位|学历|资格|文凭|博士|研究生|毕业/ },
];

function conceptsOf(text: string): Set<string> {
  const out = new Set<string>();
  for (const g of CONCEPT_GROUPS) {
    if (g.words.test(text)) out.add(g.name);
  }
  return out;
}

/** 代价文本与用户原话是否共享至少一个概念 */
export function isRelevantToQuote(costText: string, quote: string): boolean {
  const a = conceptsOf(costText);
  const b = conceptsOf(quote);
  for (const x of a) if (b.has(x)) return true;
  return false;
}

function buildCosts(
  cases: TaggedEpisode[],
  situation: SituationV2,
  userQuote?: string,
): PersonalizedCost[] {
  const costs: PersonalizedCost[] = [];

  // ① 首选：从结果链里挑**明确负面**的那一条（先挡掉维护备注）
  const negatives = cases
    .map((e) => humanOutcome(e, 'mid_term'))
    .filter((x): x is string => x !== null && isNegativeOutcome(x));

  if (userQuote && userQuote.trim().length > 0) {
    const q = userQuote.trim();

    // ⚠️ 挂原话的前提是**语义真的相关**（概念命中，不是字符重叠）。
    //    不相关就不挂 —— 否则每条路径都挂同一句话，「因为你刚才说」就成套话了。
    const relevant = negatives.filter((o) => isRelevantToQuote(o, q));

    if (relevant.length > 0) {
      // 相关的中挑最短的 —— 最短通常最聚焦，也最好读
      const best = [...relevant].sort((a, b) => a.length - b.length)[0];
      costs.push({
        text: best,
        basis: { kind: 'user_quote', quote: q, note: '这条代价命中了你在意的那一类问题' },
      });
    }
    /**
     * ⚠️ 试过「放宽兜底」但**否决了**。
     *
     *   为了让更多路径挂上原话，我试过：候选里没有明确负面结果时，
     *   只要与用户原话共享概念就挂上。结果输出变成：
     *     ★【挂你原话】 仍继续学习，1969 年取得文凭。      ← 这是进展不是代价
     *     ★【挂你原话】 毕业后进入互联网公司做数据分析。    ← 这是结果不是代价
     *
     *   「代价」栏里写进展，比不写更糟 —— 用户会以为系统分不清好坏。
     *   宁可覆盖少，也不能让这一栏说出不是代价的东西。
     *
     *   → 只在「明确负面」的结果上挂原话。覆盖率低就低。
     */
  }

  // ② 其次：约束会一直存在 —— 这是最稳的「代价」来源
  for (const e of cases) {
    const c = e.decision_state.constraints.find((x) => typeof x === 'string' && x.trim().length > 0 && !isMetaNote(x));
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

/**
 * 「这条路保护的是什么」。
 *
 * ⚠️ 第一版是错的：只是把 case 的 goals 套了个模板 ——
 *     · 继续拥有「探索生物学」的可能
 *   读起来绕，而且那是**目标**不是**保护**。
 *
 * ⚠️ 第二版也有错：我把「用户的 constraints」也算进去了，
 *   结果 4 条路径的「保护」**一模一样** —— 因为输入相同。
 *   但不同路径保护的东西本来就该不同：
 *     「守住已投入的路径」保护的是已有的积累
 *     「先试探再转向」保护的是「不用一次押上全部」
 *
 *   所以：保护必须从**这条路本身的做法**推，不能从用户处境推。
 */
function buildProtects(cases: TaggedEpisode[], archetype: PathArchetypeId): string[] {
  /**
   * 走法 → 它保护了什么。
   * 这是**领域知识**：每种走法各有各的「不用失去」。
   */
  const BY_ARCHETYPE: Record<PathArchetypeId, string[]> = {
    persist: ['已有的积累继续算数', '生活与收入不必经历断档', '不用向任何人解释为什么改主意'],
    explore_then_persist: [
      '不用一次押上全部筹码',
      '在放弃之前先拿到真实信息',
      '即使最后留下，这也是「试过之后的选择」而不是「没敢试」',
    ],
    explore_then_switch: [
      '不用一次押上全部筹码',
      '在新方向上先拿到真实反馈再决定',
      '验证期内原有的退路仍然有效',
    ],
    direct_switch: ['不用在两条路之间长期消耗', '新方向的起步时间不会被拉长', '做决定的心理成本一次性结清'],
    dual_track: ['原有收入与身份不会立刻断掉', '新方向可以在低压下试错', '不必在信息不足时做二选一'],
    abandon: ['不用继续追加投入', '可以把资源转向别处', '止损线由自己设定，而不是被拖到最后'],
    unknown: ['现有材料不足以判断这条路保护了什么'],
  };

  // 先给该走法的固有保护
  const out: string[] = [...(BY_ARCHETYPE[archetype] ?? BY_ARCHETYPE.unknown)];

  // 再从**该路径案例自己的约束**里补一条更具体的（约束的另一面）
  const RULES: Array<{ match: RegExp; protect: string }> = [
    { match: /已投入|已修完|已积累|读了两年|五年学制|投入大/, protect: '已付出的时间不会白费' },
    { match: /重新积累|从零|跨领域|没有技术基础/, protect: '不用重新证明自己' },
    { match: /家里|家庭|父母|家人|期望/, protect: '不用向家里解释为什么改了主意' },
    { match: /保研|资格|门槛|选拔|学制|编制/, protect: '现有资格与名额继续有效' },
    { match: /收入|经济|薪资|薪酬|钱/, protect: '短期内收入不会掉下来' },
    { match: /毕业|延毕|时间/, protect: '毕业节奏不用往后推' },
  ];

  const pathConstraints = cases
    .flatMap((e) => e.decision_state.constraints)
    .filter((x) => typeof x === 'string' && x.trim() && !isMetaNote(x));

  for (const c of pathConstraints) {
    for (const r of RULES) {
      if (r.match.test(c) && !out.includes(r.protect)) {
        out.push(r.protect);
        return out.slice(0, 3);
      }
    }
  }

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
      protects: buildProtects(cases, archetype),
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

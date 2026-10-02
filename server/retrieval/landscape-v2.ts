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
  /**
   * ⚠️ 没有「固定返回 N 条」这回事。
   *
   *   实测反馈：「无论我说什么你都是四种解法」——
   *   因为原来写死了 `max_archetypes: 4`，
   *   而聚类又是「按 archetype 固定枚举分组」（一共 6 个桶），
   *   所以输出永远是那几个桶的前 4 名，跟用户说了什么无关。
   *
   *   改法：**这个用户实际聚出几种走法就给几种**。
   *   候选里只有 2 种就显示 2 种（诚实），有 5 种就显示 5 种。
   *   单条案例支撑的路径已经会打 caveat —— 厚度如实反映数据。
   *
   *   这个值是**安全上限**（防极端情况刷屏），不是「目标条数」。
   */
  safety_max_archetypes: 6,
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
/**
 * 走法原型 → 给用户看的标题与描述。
 *
 * ⚠️ 措辞改过一次。原来用的是「直接转向 / 先低成本试一次，验证后再转向」——
 *   实测反馈：「这是在跟测试者说话，不是跟一个正在纠结的人说话」。
 *
 *   这类词（转向、验证、低成本试探）是**我们内部的分析语言**，
 *   用户不会这么描述自己的处境。他现在心里想的是
 *   「要不要干脆辞了」而不是「是否执行 direct_switch」。
 *
 *   所以标题全部改成**用户会用来描述自己的说法**，
 *   并且第二人称 —— 读起来像有人在跟他讲话，不像系统在分类。
 */
const ARCHETYPE_COPY: Record<PathArchetypeId, { title: string; one_line: string }> = {
  persist: {
    title: '先不动，继续把手上的事做下去',
    one_line: '不是不敢动，而是掂量过之后觉得现在拥有的东西值得先保住。',
  },
  explore_then_persist: {
    title: '出去试一小段，试完决定留不留',
    one_line: '用一段真实的经历做排除法 —— 试过之后选择留下，和没试过就留下不是一回事。',
  },
  explore_then_switch: {
    title: '先小范围试水，确认行了再走',
    one_line: '不把全部筹码一次押上，先花一小段时间看看新方向到底怎么样。',
  },
  direct_switch: {
    title: '干脆一点，直接换个方向',
    one_line: '不做过渡，说走就走。代价来得最集中，但也最不留尾巴。',
  },
  dual_track: {
    title: '两边先都抓着',
    one_line: '原来的不断，新方向也在推进。哪怕形式上离开了、实际还在做，也算这一类。',
  },
  abandon: {
    title: '这条路不走了，止损',
    one_line: '不只是换个方向，而是承认之前投进去的要认赔。',
  },
  unknown: {
    title: '材料不足，看不出他当时怎么选的',
    one_line: '现有资料无法确认他实际走了哪条路。',
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

  /**
   * ⚠️ 这里是「无论说什么都是四种」的修复点。
   *
   *   原来：`.slice(0, max_archetypes)` —— 固定砍到 4 条，
   *        于是用户条件怎么变都是那 4 个桶。
   *
   *   现在分两步：
   *     ① **相关性门槛**：与用户根因素完全不沾边的路径直接不要
   *        （relevance 为 0 = 这条路的案例没有一个根因素和用户重合）
   *     ② 如果剩下太多（> safety），才按支撑案例数和相关性排序截断
   *
   *   结果：候选里有 2 种走法就显示 2 种，有 5 种就显示 5 种。
   */
  const scored = result
    .filter((g) => g.cases.length >= LANDSCAPE_CONFIG.min_cases_per_archetype)
    // ① 与用户毫无交集的路径不展示 —— 那不是「他的可能走法」
    .filter((g) => g.relevance > 0)
    .sort((a, b) => b.cases.length - a.cases.length || b.relevance - a.relevance);

  // ② 安全上限（而不是「目标条数」）
  return scored.slice(0, LANDSCAPE_CONFIG.safety_max_archetypes);
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

/**
 * 生成「对你而言的代价」。
 *
 * ⚠️ 重做过一次。第一版是**错的**，实测暴露：
 *
 *   用户背景：「干了十年技术，现在纠结要不要离开」
 *   代价栏却写着：
 *     ·「已投入医学学习」也不会消失
 *     ·「科学基础需要补齐」也不会消失
 *
 *   因为第一版直接从**案例自己的 constraints** 里抄 ——
 *   那些约束属于鲁迅、达尔文，不属于用户。
 *   **把别人的约束当成了你的代价。**
 *
 * ⚠️ 现在按「双来源」推（产品负责人拍板）：
 *
 *   ① **你会失去什么** ← 从**用户自己的约束/在意点**推
 *      你说了「老婆孩子热炕头」→ 代价是「家人现在的生活节奏会被打乱」
 *
 *   ② **那个人实际付出了什么** ← 从**案例的结果链**里挑明确负面的
 *      他那两年收入减半
 *
 *   两者并列，用户才能判断「他的代价对我成不成立」。
 */
/**
 * 生成「对你而言的代价」。
 *
 * ⚠️ 这是第三次改。前两版都错在「没用用户的信息」：
 *
 *   第一版：直接从**案例自己的 constraints** 抄
 *     → 用户是「干了十年技术的」，代价栏写着「已投入医学学习」
 *       **把别人的约束当成了你的代价**
 *
 *   第二版：从**用户自己的约束**推（对了），但
 *     · 命中率低 → 经常走兜底「现有材料不足以判断…」（卡片上出现空栏）
 *     · 完全不看 **fear** —— 而「最怕什么」才是决定**哪条代价最重**的信息
 *     · 案例结果那条只说「那人付出了什么」，没说「跟你可不可比」
 *
 *   现在（第三版）：
 *   ① 从用户约束推「你会失去什么」—— 规则扩了一倍，覆盖学生场景
 *   ② **用 fear 排序** —— 你最怕什么，「最重」标记就给谁
 *   ③ 案例结果那条**必须带可比性说明** —— 他放弃的是考研，你面对的是专业门槛，不完全一样
 */
function buildCosts(
  cases: TaggedEpisode[],
  situation: SituationV2,
  userQuote?: string,
): PersonalizedCost[] {
  const costs: PersonalizedCost[] = [];

  /* ---------- ① 你会失去什么（从用户自己的约束推） ---------- */

  /**
   * 约束 → 「失去什么」的翻译。
   *
   * ⚠️ 只认**用户自己说过**的（situation.constraints / goals / fear / 原话）。
   *   **绝不**碰案例的 constraints —— 那是第一版的错误来源。
   *
   * ⚠️ 规则覆盖两类场景：
   *   职场（原来那批）+ **学生**（原来完全没有，所以学生用户全走兜底）
   */
  const LOSS_RULES: Array<{ match: RegExp; loss: string }> = [
    // ── 职场 ──
    { match: /老婆|妻子|丈夫|孩子|热炕头|两地|分居/, loss: '家人现在的生活节奏会被打乱' },
    { match: /房贷|月供|贷款|养家/, loss: '收入的稳定性会先受冲击' },
    { match: /十年|多年|干了|资深|老员工/, loss: '这些年攒下的资历，换到新地方要重新证明' },
    { match: /社保|公积金|户口|看病|医疗|养老/, loss: '现有的保障衔接可能断档' },
    { match: /年龄|中年|四十|35/, loss: '换方向的可选范围比十年前窄' },
    // ── 学生（新增）──
    {
      match: /被调剂|调剂进来|不是自己选|爸妈让|家里让/,
      loss: '「这专业不是我选的」这件事，要自己消化掉',
    },
    {
      match: /已投入|读了两年|两年半|大三|大二|学制|五年/,
      loss: '已经读进去的这段时间，要接受它可能不作数',
    },
    {
      match: /家里|父母|家人|爸妈|期望/,
      loss: '家里对「稳定毕业」的期待，你要自己去交代',
    },
    { match: /成绩|绩点|排名|门槛|选拔|保研|资格/, loss: '现有的成绩与资格，换个方向要重新挣' },
    { match: /毕业|延毕|学制|时间/, loss: '毕业的节奏要往后推，同龄人先你一步' },
    // ── 通用 ──
    { match: /稳定|铁饭碗|编制|体制|国企|事业单位/, loss: '「稳定」这件事要从头再挣一遍' },
    { match: /半年|一年内|窗口|期限|来不及|拖两年/, loss: '留给你试错的时间很有限' },
    { match: /熟悉|习惯|舒适|环境|同学|同事/, loss: '熟悉的圈子和人际要重新建立' },
  ];

  const userText = [
    ...situation.constraints,
    ...situation.goals,
    situation.fear ?? '',
    situation.validation ?? '',
    situation.prior_path ?? '',
    userQuote ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const seen = new Set<string>();
  for (const r of LOSS_RULES) {
    if (costs.length >= 3) break;
    if (r.match.test(userText) && !seen.has(r.loss)) {
      seen.add(r.loss);
      costs.push({
        text: r.loss,
        basis: { kind: 'user_quote', quote: userQuote, note: '从你自己的情况推出' },
      });
    }
  }

  /* ---------- ② 那个人实际付出了什么（必须带可比性说明） ---------- */

  const negatives = cases
    .map((e) => ({ ep: e, outcome: humanOutcome(e, 'mid_term') }))
    .filter(
      (x): x is { ep: TaggedEpisode; outcome: string } =>
        x.outcome !== null && isNegativeOutcome(x.outcome),
    );

  if (negatives.length > 0 && costs.length < 3) {
    const best = [...negatives].sort((a, b) => a.outcome.length - b.outcome.length)[0];
    /**
     * ⚠️ 必须说清「跟你可不可比」。
     *
     *   实测反馈：卡片上写着「走过这条路的人，实际付出的是：
     *   放弃考研，毕业后进入一家工具软件公司做文档」——
     *   用户说「这个跟我没关系」。
     *
     *   对 —— 那是**那个人的**代价。对用户有用的不是这句话本身，
     *   而是「他付出的这一类，你会不会也付出」。
     *   所以要把它和用户自己的 fear / constraints 对照。
     */
    const shared = sharedFactorNote(best.ep, situation);
    costs.push({
      text: `有人走这条路，付出的是：${best.outcome}`,
      basis: {
        kind: 'structure',
        note: shared
          ? `${shared} —— 所以你面对的可能类似，但代价的形态不一样`
          : '这是他个人的代价，和你的处境不完全可比',
      },
    });
  }

  /* ---------- ③ 用 fear 排序：你最怕什么，「最重」就给谁 ---------- */

  /**
   * ⚠️ 这一步是**新增的**，也是「个性化」的关键。
   *
   *   原来「最重」标记永远是第一条 —— 不管第一条是什么。
   *   但「哪条代价对你最重」完全取决于**你最怕什么**：
   *     · 怕「拖两年才发现还是不喜欢」→ 时间类代价最重
   *     · 怕「家里失望」             → 关系类代价最重
   *     · 怕「白读了两年」           → 沉没成本类最重
   */
  if (situation.fear) {
    const f = situation.fear;
    const weightOf = (c: PersonalizedCost): number => {
      let w = 0;
      if (/时间|拖|晚|推|来不及|年纪|节奏/.test(f) && /时间|毕业|节奏|晚/.test(c.text)) w += 2;
      if (/家里|父母|家人|失望|交代/.test(f) && /家里|家人|交代|期待/.test(c.text)) w += 2;
      if (/白读|白费|浪费|不划算|沉没/.test(f) && /不作数|白费|重新证明|重新挣/.test(c.text)) w += 2;
      if (/不喜欢|不合适|错/.test(f) && /认可|喜欢|不适合/.test(c.text)) w += 1;
      return w;
    };
    const scored = costs.map((c, i) => ({ c, i, w: weightOf(c) }));
    const best = scored.reduce((a, b) => (b.w > a.w ? b : a));
    if (best.w > 0) {
      const [picked] = costs.splice(best.i, 1);
      costs.unshift(picked);
    }
  }

  /* ---------- ④ 兜底：不编 ---------- */

  if (costs.length === 0) {
    costs.push({
      text: '现有材料不足以判断这条路对你的具体代价。',
      basis: { kind: 'unknown', note: '既没从你的情况推出，案例结果链也不完整' },
    });
  }

  return costs.slice(0, 3);
}

/**
 * 判断「这条案例和用户共享哪个根因素」—— 用来给「那人付出的代价」加可比性说明。
 *
 * 为什么需要：只丢一句「他放弃考研去做了文档」，用户会觉得跟自己无关。
 * 说清「他也面对过同类约束」，这句才有参考价值。
 */
function sharedFactorNote(ep: TaggedEpisode, situation: SituationV2): string | null {
  const mine = new Set(situation.root_factors ?? []);
  const his = ep.mechanism?.root_factors ?? [];
  const shared = his.filter((f) => mine.has(f));
  if (shared.length === 0) return null;
  return `他也面对过「${shared.slice(0, 2).join('、')}」`;
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
/**
 * 「这条路保护的是什么」。
 *
 * ⚠️ 重做过一次。原来**整栏是硬编码的**：
 *
 *     const BY_ARCHETYPE = {
 *       direct_switch: ['不用在两条路之间长期消耗', '新方向的起步时间不会被拉长', ...],
 *     }
 *
 *   实测反馈：「你给我的走法能不能更符合我的个人情况」——
 *   因为不管你说了什么，点开「直接换方向」看到的永远是同样三句。
 *   后面那段「从案例约束补一条」几乎从不生效（案例约束大多是数据备注）。
 *
 * ✅ 现在：**先看用户自己说了什么，再决定这栏写什么。**
 *
 *   依据（按优先级）：
 *     ① 他明确说过的 fear / goals / constraints → 直接翻译成「这条路保护了什么」
 *     ② 该走法的固有保护 → 只作为补足，且优先挑跟他情况相关的
 *
 *   效果举例：
 *     他说「家里希望稳定毕业」+「想做自己认可的事」
 *     → persist 这条路保护的是：
 *        · 家里对「稳定毕业」的期待还能交代过去
 *        · 不用放弃已经读进去的这两年
 *        · 不用向任何人解释为什么改了主意
 */
function buildProtects(
  cases: TaggedEpisode[],
  archetype: PathArchetypeId,
  situation: SituationV2,
): string[] {
  /**
   * 走法 → 固有保护。
   * 这是**领域知识**，但现在只作为**补足**，不再独占整栏。
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
    direct_switch: [
      '不用在两条路之间长期消耗',
      '新方向的起步时间不会被拉长',
      '做决定的心理成本一次性结清',
    ],
    dual_track: ['原有收入与身份不会立刻断掉', '新方向可以在低压下试错', '不必在信息不足时做二选一'],
    abandon: ['不用继续追加投入', '可以把资源转向别处', '止损线由自己设定，而不是被拖到最后'],
    unknown: ['现有材料不足以判断这条路保护了什么'],
  };

  /** 用户自己说过的话，拼成一个池子用来匹配 */
  const userPool = [
    ...situation.constraints,
    ...situation.goals,
    situation.fear ?? '',
    situation.prior_path ?? '',
    situation.validation ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  /**
   * 用户情况 → 「这条路保护了什么」。
   *
   * ⚠️ 关键是**用他自己的措辞回指**，而不是换成我们的术语。
   *   他说「家里希望稳定毕业」→ 写「家里对『稳定毕业』的期待…」
   *   而不是写「社会支持系统不受影响」。
   */
  const MINE: Array<{ match: RegExp; protect: (kv: RegExpExecArray | null) => string }> = [
    {
      match: /家里|父母|家人|爸妈|期望/,
      protect: () => '家里对「稳稳当当」的期待，不用现在就摊牌',
    },
    {
      match: /被调剂|不是自己选/,
      protect: () => '不用马上承认「当初那个选择本就不是我要的」',
    },
    {
      match: /已投入|读了两年|两年半|大三|大二|这段时间/,
      protect: () => '已经读进去的这段时间，暂时不用被判作不算数',
    },
    {
      match: /认可|喜欢|热爱|意义|想做点/,
      protect: () => '不用一直做你不认可的事',
    },
    {
      match: /稳定|铁饭碗|编制|体制/,
      protect: () => '「稳定」这条底线还在',
    },
    {
      match: /时间|拖|来不及|晚|节奏/,
      protect: () => '时间上不会被动等到来不及',
    },
    {
      match: /成绩|绩点|门槛|保研|资格|选拔/,
      protect: () => '现有的成绩与资格还作数',
    },
    {
      match: /钱|收入|经济|养家|房贷/,
      protect: () => '短期收入不用断',
    },
    {
      match: /没做过|没系统学过|验证|试过/,
      protect: () => '不用在还没验证过的情况下就押上全部',
    },
  ];

  const out: string[] = [];

  // ① 先从**用户自己的情况**推 —— 最多两条
  for (const m of MINE) {
    if (out.length >= 2) break;
    const hit = m.match.exec(userPool);
    if (hit) {
      const text = m.protect(hit);
      if (!out.includes(text)) out.push(text);
    }
  }

  // ② 再用该走法的固有保护补足 —— 挑跟他情况沾边的放前面
  const inherent = BY_ARCHETYPE[archetype] ?? BY_ARCHETYPE.unknown;
  const relevantFirst = [...inherent].sort((a, b) => {
    const score = (s: string) => {
      let n = 0;
      if (/时间|节奏|晚/.test(userPool) && /时间|起步|消耗/.test(s)) n += 2;
      if (/投入|积累|读/.test(userPool) && /积累|算数|投入/.test(s)) n += 2;
      if (/家|父母|解释/.test(userPool) && /解释|身份|收入/.test(s)) n += 2;
      if (/试|验证/.test(userPool) && /试|验证|反馈|筹码/.test(s)) n += 2;
      return n;
    };
    return score(b) - score(a);
  });

  for (const s of relevantFirst) {
    if (out.length >= 3) break;
    if (!out.includes(s)) out.push(s);
  }

  // ③ 该走法的案例里如果有特别具体的约束，补一条（原来那段几乎不生效，保留但降级）
  if (out.length < 3) {
    const RULES: Array<{ match: RegExp; protect: string }> = [
      { match: /已投入|已修完|已积累|读了两年|五年学制|投入大/, protect: '已付出的时间不会白费' },
      { match: /家里|家庭|父母|家人|期望/, protect: '不用向家里解释为什么改了主意' },
      { match: /保研|资格|门槛|选拔|学制|编制/, protect: '现有资格与名额继续有效' },
    ];
    const pathConstraints = cases
      .flatMap((e) => e.decision_state.constraints)
      .filter((x) => typeof x === 'string' && x.trim() && !isMetaNote(x));
    for (const c of pathConstraints) {
      for (const r of RULES) {
        if (r.match.test(c) && !out.includes(r.protect)) {
          out.push(r.protect);
          break;
        }
      }
      if (out.length >= 3) break;
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
      protects: buildProtects(cases, archetype, situation),
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

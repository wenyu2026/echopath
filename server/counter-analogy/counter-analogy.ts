/**
 * Counter-Analogy（反类比）—— 「为什么不能照搬」（#15）。
 *
 * v1 为纯模板生成（零 LLM 调用）：每条差异都由结构字段对比得出并带依据，
 * 幻觉在构造上不可能发生。LLM 表述升级留作后续。
 *
 * 铁律（来自验收修订 2026-10-02）：
 * - 「案例没记录」绝不能写成「对方没有」——未知就是未知
 * - unknown 条目不计入「至少 2 条具体差异」的底线（防偷懒达标）
 * - era 类（模型外部知识）最多 1 条，必须显著标注 AI 类比
 * - 输出禁止「你应该」式结论（GUARD_PATTERN）
 */
import type { DecisionEpisode, Level, Situation } from '../../src/types/episode.ts';
import { differencePenalty, CONSTRAINT_CATEGORIES } from '../retrieval/dimensions.ts';

export type CounterAnalogyKind = 'structure' | 'evidence' | 'era' | 'unknown';

export interface CounterAnalogyItem {
  text: string;
  kind: CounterAnalogyKind;
  /** 依据：结构字段名或 source_id，保证可追溯 */
  basis: string;
  refs?: string[];
}

export interface CounterAnalogyResult {
  items: CounterAnalogyItem[];
  concreteCount: number;
  unknownCount: number;
}

const CATEGORY_ZH: Record<string, string> = {
  economic: '经济',
  time: '时间与沉没投入',
  threshold: '门槛与资格',
  family: '家庭',
  identity: '身份',
  era: '时代环境',
};

const CHOICE_ZH: Record<string, string> = {
  persist: '死磕原路',
  direct_switch: '直接转向',
  explore_then_switch: '先试再转',
  explore_then_persist: '试探后留下',
  abandon: '退出',
  dual_track: '双轨并行',
};

const LEVEL_ZH: Record<Level, string> = { low: '低', medium: '中', high: '高' };

/** 输出口径黑名单（验收第 5 条）。命中即视为实现 bug，测试里直接断言。 */
export const GUARD_PATTERN = /你应该|你最好|建议你(选择|选|放弃)|我推荐你|最优(选择|路线)|正确(的|)选择/;
/** 「案例没记录」不得写成「对方没有」——直接指名道姓的编造句式 */
const FABRICATION_PATTERN = /对方没有|人家没有|他没有|她没有/;

const EXPLORE_HINT = /辅修|双学位|试|先|业余|自学|实习|见习|gap|间隔/;

function hitCategories(text: string): Set<string> {
  const out = new Set<string>();
  for (const [cat, words] of Object.entries(CONSTRAINT_CATEGORIES)) {
    if (words.some((w) => text.includes(w))) out.add(cat);
  }
  return out;
}

/**
 * 案例侧「已记录」的判定范围：约束 + 来时路 + 困境 + 行动 + 证据。
 * 只要任何一个字段提到该类别，就算「案例有记录」，避免把「记录在 prior_path」误判成「对方没有」。
 */
function episodeRecordedText(ep: DecisionEpisode): string {
  return [
    ...ep.decision_state.constraints,
    ...ep.prior_path,
    ep.decision_state.dilemma,
    ...ep.choice.actions,
    ...ep.evidence.map((e) => e.claim),
  ].join('，');
}

export function buildCounterAnalogy(situation: Situation, ep: DecisionEpisode): CounterAnalogyResult {
  const items: CounterAnalogyItem[] = [];

  // ── 候选 1：用户有而案例未记录的约束类别（structure，最强）─────────
  const userText = situation.constraints.join('，');
  const userCats = hitCategories(userText);
  const epiCats = hitCategories(episodeRecordedText(ep));
  const missing = [...userCats].filter((c) => !epiCats.has(c));
  if (missing.length > 0) {
    const cat = missing[0];
    const examples = situation.constraints.filter((c) => (CONSTRAINT_CATEGORIES[cat] ?? []).some((w) => c.includes(w)));
    items.push({
      text: `【约束差异】你面对「${CATEGORY_ZH[cat] ?? cat}」类约束（${examples.join('、') || '见你的处境'}）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）`,
      kind: 'structure',
      basis: 'constraints 对比',
      refs: ['decision_state.constraints'],
    });
  }

  // ── 候选 2：试探路径的有无（structure）────────────────────────────
  const exploreOption = situation.options.find((o) => EXPLORE_HINT.test(o));
  const caseExplores = /试|先|业余|双轨|副/.test(ep.choice.actions.join()) || ['explore_then_switch', 'explore_then_persist', 'dual_track'].includes(ep.choice.type);
  if (exploreOption && !caseExplores) {
    items.push({
      text: `【路径差异】你的可选路径里有「${exploreOption}」这类低成本试探；案例里对方的实际动作是${ep.choice.actions.join('、')}，没有试探类动作的记录——这是「先验证再决定」与「${CHOICE_ZH[ep.choice.type] ?? ep.choice.type}」的结构差异（依据：options 与 choice.actions 对比）`,
      kind: 'structure',
      basis: 'options × choice.actions 对比',
      refs: ['options', 'choice.actions'],
    });
  }

  // ── 候选 3：可逆性错位（structure）───────────────────────────────
  const LEVEL_VALUE: Record<Level, number> = { low: 0, medium: 0.5, high: 1 };
  const gap = Math.abs(LEVEL_VALUE[situation.reversibility] - LEVEL_VALUE[ep.decision_state.reversibility]);
  if (gap >= 0.5) {
    const epiLow = ep.decision_state.reversibility === 'low';
    items.push({
      text: `【可逆性差异】你的选择可逆性为「${LEVEL_ZH[situation.reversibility]}」，对方当时评估为「${LEVEL_ZH[ep.decision_state.reversibility]}」——${epiLow ? '对方几乎没有退路，其代价结构比你的情形更重' : '对方保留了更多退路，其结果未必能平移到你身上'}（依据：reversibility 字段对比）`,
      kind: 'structure',
      basis: 'reversibility 字段对比',
      refs: ['decision_state.reversibility'],
    });
  }

  // structure 最多取 2 条（避免稀释重要性）
  const structure = items.filter((i) => i.kind === 'structure').slice(0, 2);
  const rest = items.filter((i) => i.kind !== 'structure');

  // ── 候选 4：时代制度差异（era = ai_inference，最多 1 条）──────────
  const era = 2026 - ep.time.year;
  // 领域措辞跟随案例本身（留学/在校 → 学业转向；否则 → 职业转换），不用用户处境套所有案例
  const caseAcademic = /学|留学|在校|读/.test(ep.time.stage + ep.prior_path.join('，'));
  if (era > 30 && differencePenalty(situation, ep) >= 0.4) {
    rest.push({
      text: `【⚠️ AI 类比·时代制度】案例发生在 ${ep.time.year} 年（约 ${era} 年前）：当时的${caseAcademic ? '学业转向' : '职业转换'}不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）`,
      kind: 'era',
      basis: 'ai_inference（模型外部知识）',
      refs: ['time.year'],
    });
  }

  // ── 候选 5：数据缺口（unknown，诚实兜底，不计入底线）─────────────
  const untraceable = situation.unknowns.filter((u) => !episodeRecordedText(ep).includes(u.slice(0, 2)));
  if (untraceable.length > 0) {
    rest.push({
      text: `【未知】无法比较「${untraceable[0]}」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）`,
      kind: 'unknown',
      basis: '数据缺失（episode 无对应字段）',
    });
  }

  // 排序：structure > era > unknown；总条数 ≤ 4
  const order: Record<CounterAnalogyKind, number> = { structure: 0, evidence: 1, era: 2, unknown: 3 };
  const merged = [...structure, ...rest].sort((a, b) => order[a.kind] - order[b.kind]).slice(0, 4);

  return {
    items: merged,
    concreteCount: merged.filter((i) => i.kind !== 'unknown').length,
    unknownCount: merged.filter((i) => i.kind === 'unknown').length,
  };
}

/** 输出口径检查：命中黑名单或编造句式一律报错（fail-loud，不静默放行） */
export function guardViolations(texts: string[]): string[] {
  const issues: string[] = [];
  for (const t of texts) {
    if (GUARD_PATTERN.test(t)) issues.push(`出现「你应该」式结论: ${t}`);
    if (FABRICATION_PATTERN.test(t)) issues.push(`把「没记录」写成「对方没有」: ${t}`);
  }
  return issues;
}

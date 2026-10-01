/**
 * 反类比候选生成（#15 第三部分）
 * ============================================
 * 依据：server/RULES-evidence-counter-analogy.md 第 2.2 节第 1 步。
 *
 * 设计要点：**代码先产候选，LLM 只做表述**。
 *   原因是 LLM 自由生成差异时极易编造（「对方当时也面临 XX 压力」这种
 *   看似合理但无据的话）。先由代码从结构字段里算出**可追溯的候选**，
 *   LLM 的职责被压缩成「把候选说成人话」，越权就丢弃。
 *
 * 每个候选都带 basis（依据）与 refs（字段名 / source_id），
 * 这样规则 2.3 的「锚定 A / 锚定 B」判定可以机械执行。
 */

import type { DecisionEpisode, Situation } from '../../src/types/episode.ts';
import type { WhyDifferentDetail } from '../../src/types/episode.ts';

/** 当前年份 —— 用于时代差判定。写成常量便于单测固定时间 */
export const CURRENT_YEAR = 2026;

/** 时代差阈值（规则文档 2.2-1：2026 − year > 30 才算显著不同） */
const ERA_GAP_YEARS = 30;

export type CandidateKind = WhyDifferentDetail['kind'];

export interface Candidate {
  /** 组装给 LLM 的候选描述 */
  hint: string;
  kind: CandidateKind;
  basis: string;
  refs: string[];
  /**
   * 重要性预分（规则 2.4 排序用）：
   * structure(3) > evidence(2) > era(1) > unknown(0)，同级按涉及字段数降序。
   */
  weight: number;
}

/* ============================================================
   一、约束差（structure）
   ============================================================ */

/**
 * 找出「用户有、案例没有」的约束类别。
 *
 * 为什么用类别而不是原文比对：用户说「可能延毕」，案例写「公费留学身份」，
 * 字符串根本不重叠，但语义上都属于「制度/学业成本」。所以先做关键词聚类，
 * 再比较类别集合。
 */
const CONSTRAINT_CLASSES: { cls: string; label: string; words: string[] }[] = [
  { cls: 'economy', label: '经济压力', words: ['经济', '钱', '收入', '学费', '负债', '债务', '负担', '养家'] },
  { cls: 'family', label: '家庭期望', words: ['家庭', '父母', '家人', '期望', '催', '反对', '支持'] },
  { cls: 'credential', label: '学历/制度门槛', words: ['学历', '学位', '文凭', '门槛', '资格', '成绩', '延毕', '转专业', '毕业'] },
  { cls: 'time', label: '时间窗口', words: ['时间', '年龄', '来得及', '太晚', '窗口', '期限'] },
  { cls: 'identity', label: '身份认同', words: ['身份', '公费', '编制', '户口', '社会评价', '舆论'] },
  { cls: 'resource', label: '资源/人脉', words: ['资源', '人脉', '渠道', '背景', '关系'] },
  { cls: 'health', label: '身体/心理', words: ['健康', '身体', '心理', '焦虑', '抑郁'] },
];

function classify(text: string): string[] {
  const hit: string[] = [];
  for (const c of CONSTRAINT_CLASSES) if (c.words.some((w) => text.includes(w))) hit.push(c.cls);
  return hit;
}

function classLabel(cls: string): string {
  return CONSTRAINT_CLASSES.find((c) => c.cls === cls)?.label ?? cls;
}

export function constraintCandidates(situation: Situation, episode: DecisionEpisode): Candidate[] {
  const userText = situation.constraints.join(' ');
  const caseText = episode.decision_state.constraints.join(' ');
  const userCls = new Set(classify(userText));
  const caseCls = new Set(classify(caseText));

  const out: Candidate[] = [];
  for (const cls of userCls) {
    if (caseCls.has(cls)) continue; // 两边都有 → 不构成差异
    // 找出用户侧的具体约束原文，作为 refs
    const refs = situation.constraints.filter((c) => classify(c).includes(cls));
    out.push({
      hint: `用户的约束里有「${refs[0] ?? classLabel(cls)}」，而该案例的 constraints 没有对应类别（${classLabel(cls)}）`,
      kind: 'structure',
      basis: 'constraints 对比',
      refs,
      weight: 3 + Math.min(refs.length, 2),
    });
  }

  // 反向：案例有而用户没有（也是差异，但重要性略低 —— 它意味着对方多了一层你没提的约束）
  for (const cls of caseCls) {
    if (userCls.has(cls)) continue;
    const refs = episode.decision_state.constraints.filter((c) => classify(c).includes(cls));
    out.push({
      hint: `该案例有「${refs[0] ?? classLabel(cls)}」这类约束，而用户的 constraints 里未提及（${classLabel(cls)}）`,
      kind: 'structure',
      basis: 'constraints 对比',
      refs,
      weight: 3,
    });
  }

  return out;
}

/* ============================================================
   二、可逆性 / 选项差（structure）
   ============================================================ */

const LEVEL_CN: Record<string, string> = { low: '低', medium: '中', high: '高' };

export function reversibilityCandidate(situation: Situation, episode: DecisionEpisode): Candidate[] {
  const a = situation.reversibility;
  const b = episode.decision_state.reversibility;
  if (a === b) return [];

  // 差异方向：用户更可逆还是更不可逆，措辞不同
  const userLess = { low: 0, medium: 1, high: 2 }[a] < { low: 0, medium: 1, high: 2 }[b];
  return [
    {
      hint: userLess
        ? `用户处境的可逆性（${LEVEL_CN[a]}）低于该案例（${LEVEL_CN[b]}）—— 试错空间更小`
        : `用户处境的可逆性（${LEVEL_CN[a]}）高于该案例（${LEVEL_CN[b]}）—— 试错空间更大`,
      kind: 'structure',
      basis: 'reversibility 对比',
      refs: [`situation.reversibility=${a}`, `episode.decision_state.reversibility=${b}`],
      weight: 4,
    },
  ];
}

export function optionsCandidate(situation: Situation, episode: DecisionEpisode): Candidate[] {
  const userOptions = situation.options.length;
  const caseActions = episode.choice.actions.length;
  // 选项数量差 ≥2 才算结构性差异，否则噪音太多
  if (Math.abs(userOptions - caseActions) < 2) return [];
  return [
    {
      hint: `用户列出的可选道路有 ${userOptions} 条，该案例实际执行的动作有 ${caseActions} 步 —— 决策粒度不同`,
      kind: 'structure',
      basis: 'options / choice.actions 对比',
      refs: ['situation.options', 'episode.choice.actions'],
      weight: 3,
    },
  ];
}

/* ============================================================
   三、时代差（era —— 属 AI 类比）
   ============================================================ */

export function eraCandidate(episode: DecisionEpisode): Candidate[] {
  const gap = CURRENT_YEAR - episode.time.year;
  if (gap <= ERA_GAP_YEARS) return [];
  return [
    {
      hint: `该案例发生在 ${episode.time.year} 年，距今 ${gap} 年 —— 当时的制度、行业门槛、信息环境与现在显著不同（需要你说明具体差在哪里）`,
      kind: 'era',
      basis: 'time.year 对比',
      refs: [`episode.time.year=${episode.time.year}`],
      weight: 1,
    },
  ];
}

/* ============================================================
   四、证据覆盖差（unknown）
   ============================================================ */

/**
 * 找出「用户明确说不知道、而案例数据也没记录」的维度。
 *
 * 规则 2.3 的锚定 A：差异可对应到具体结构字段值。
 * 这里两个字段都可指认（situation.unknowns 与案例的 evidence 覆盖），
 * 所以产出的候选用 kind=unknown 表达「无法判断」而不是编一条差异。
 */
export function unknownCandidates(situation: Situation, episode: DecisionEpisode): Candidate[] {
  // 案例数据能覆盖的关键词（来自 evidence claim 与 retrieval_tags）
  const covered = [...(episode.evidence ?? []).map((e) => e.claim), ...episode.retrieval_tags].join(' ');

  const out: Candidate[] = [];
  for (const u of situation.unknowns) {
    // 用户这条 unknown 里的关键词，案例数据完全没提到 → 无法判断
    const words = u.match(/[\u4e00-\u9fa5]{2,}/g) ?? [];
    if (words.length === 0) continue;
    const mentioned = words.some((w) => covered.includes(w));
    if (mentioned) continue;

    out.push({
      hint: `【未知】无法判断「${u}」是否构成差异：案例数据未记录该维度`,
      kind: 'unknown',
      basis: 'situation.unknowns 与案例证据覆盖对比',
      refs: [`situation.unknowns: ${u}`],
      weight: 0,
    });
  }
  return out;
}

/* ============================================================
   汇总
   ============================================================ */

/**
 * 一次性产出全部候选，并按规则 2.4 的优先级排序。
 *
 * ⚠️ era 类默认最多 1 条（规则文档第四节第 2 条）—— 它永远无法绑定 source，
 * 太多会让「像/不像」面板看起来像在编。
 */
export function buildCandidates(situation: Situation, episode: DecisionEpisode): Candidate[] {
  const all: Candidate[] = [
    ...constraintCandidates(situation, episode),
    ...reversibilityCandidate(situation, episode),
    ...optionsCandidate(situation, episode),
    ...eraCandidate(episode).slice(0, 1),
    ...unknownCandidates(situation, episode),
  ];

  return all.sort((a, b) => b.weight - a.weight);
}

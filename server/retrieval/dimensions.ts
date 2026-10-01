/**
 * 七维结构匹配（#14）
 * ============================================
 * 方案第 8 节要求：匹配靠结构相似，不是文本相似。
 * 这里把「阶段 / 来时路 / 困境 / 约束 / 目标 / 可逆性 / 差异惩罚」量化成 0-1 分。
 *
 * ⚠️ v2 改进（T5 之后，集成复盘）：修掉两个「空转维度」
 *   实测在 #13 的 36 条真实数据上：
 *     constraint_match 有 20/36（56%）的案例识别不出任何类别 → 固定给 0.5
 *     goal_match       有 29/36（81%）的案例识别不出任何类别 → 固定给 0.5
 *   也就是说七维里有 2 维（28.6% 的信号）根本没在工作，
 *   而「结构化匹配 7 个维度」正是本产品区别于文本相似的核心主张。
 *
 *   两处修复：
 *   ① 词典按真实数据扩充（补上投入回报 / 不确定性 / 发展受限 / 探索试错 / 稳健止损 / 完成既定 / 职业进阶）
 *   ② 类别识别不出时不再给固定 0.5，改用**字符级重叠**做语义兜底 ——
 *      即使词汇对不上，也不会让整个维度失去分辨力。
 */

import type { DecisionEpisode, Level, MatchDimensions, Situation } from '../../src/types/episode.ts';
import { cosine } from '../embedding/embed.ts';

/** 约束/目标按类别归并 —— 匹配的是"结构"而不是字面词 */
export const CONSTRAINT_CATEGORIES: Record<string, string[]> = {
  // —— v1 原有 ——
  economic: ['经济', '钱', '收入', '拮据', '债务', '资助', '供养', '积蓄', '存款', '学费', '花销', '费用', '现金', '经费', '穷', '收入来源', '养家'],
  time: ['时间', '投入', '年限', '两年', '三年', '一年', '延毕', '蛰伏', '沉没成本', '已投入', '重读', '补读', '耗时'],
  threshold: ['门槛', '成绩', '绩点', '考试', '竞争', '成功率', '难度', '资格', '学位', '录取', '申请', '考核'],
  family: ['家庭', '父母', '期望', '配偶', '家人', '婚姻', '亲情', '养育', '子女'],
  identity: ['身份', '公费', '编制', '户口', '应届', '签证', '体制', '资历'],
  era: ['时代', '环境', '制度', '行业', '当年', '彼时'],

  // —— v2 扩充：来自 36 条真实数据的未覆盖词汇 ——
  // 「投入回报」：已经付出但看不到回报，是转专业/转行最常见的结构性约束
  sunk_return: ['机会成本', '回报', '延迟', '回报延迟', '沉淀', '积累', '已有专业积累', '既有', '已有'],
  // 「不确定性」：新方向没验证过 —— 这是本产品最该识别出来的一类
  uncertainty: ['未验证', '尚待验证', '存疑', '不确定', '未确认', '未知', '不明确', '没把握', '风险未', '存疑'],
  // 「发展受限」：留在原路的天花板
  ceiling: ['受限', '晋升', '天花板', '瓶颈', '空间有限', '机会不足', '受制', '停滞'],
  // 「时间压力」：窗口在关闭
  deadline: ['来不及', '太晚', '窗口', '年龄', '期限', '最后', '错过', '紧迫'],
  // 「能力缺口」：跨过去要补的
  capability: ['能力', '基础', '跨领域', '重新积累', '补', '不熟悉', '欠缺'],
};

export const GOAL_CATEGORIES: Record<string, string[]> = {
  // —— v1 原有 ——
  interest: ['兴趣', '喜欢', '热爱', '想做', '热情', '表达', '创作'],
  growth: ['成长', '能力', '学习', '提升', '进步', '历练', '视野'],
  stability: ['稳定', '安全', '保障', '毕业', '安稳', '维持', '保持', '保留', '现金来源', '兜底'],
  income: ['收入', '薪资', '赚钱', '就业', '前景', '报酬', '回报', '变现'],
  impact: ['影响', '价值', '改变', '理想', '意义', '国民', '精神', '社会作用', '贡献'],

  // —— v2 扩充 ——
  // 「探索试错」：不押上全部，先试试
  explore: ['探索', '试探', '试做', '检验', '适配', '验证', '尝试', '试试', '小步'],
  // 「职业进阶」：想要更好的位置
  advance: ['执导', '晋升', '机会', '平台', '职位', '进阶', '担当', '主导'],
  // 「完成既定」：把已经开始的做完
  finish: ['完成', '遗留', '收尾', '拿证', '毕业', '兑现', '交代'],
  // 「自主性」：掌控自己的决定
  autonomy: ['自主', '控制', '不后悔', '选择权', '主导权', '自由'],
  // 「止损」：不再往坑里投
  cut_loss: ['止损', '限制', '追加', '退出', '抽身', '减少投入'],
};

export const STAGE_CLASSES: Record<string, string[]> = {
  school: ['大学', '学院', '专业', '学业', '在校', '留学', '大一', '大二', '大三', '大四', '研究生', '读书', '毕', '本科', '升学'],
  early_career: ['职业早期', '职业起步', '工作', '实习', '职场', '入职', '创业', '从业', '毕业后', '起步', '重返研究'],
  mid_career: ['中年', '管理', '资深', '转型期'],
};

export const DILEMMA_CLASSES: Record<string, string[]> = {
  persist_vs_switch: ['坚持', '转向', '换', '继续', '放弃', '止损', '离开', '留下', '深耕', '跳', '恢复', '重返'],
  stability_vs_risk: ['稳定', '冒险', '创业', '大厂', '小公司', '保守', '激进', '自主'],
  explore_vs_focus: ['探索', '专注', '试探', '收敛', '发散', '双轨', '并行'],
};

const LEVEL_VALUE: Record<Level, number> = { low: 0, medium: 0.5, high: 1 };

/** 类别识别不出时是否用字符级兜底（v2 新增）。设 false 可退回 v1 行为做对照 */
export const LEXICAL_FALLBACK = true;

export interface DimensionInput {
  situation: Situation;
  /** 用户原始叙述（含来时路），可缺省；缺省时 path_match 退化为总体相似度 */
  narrative?: string;
  narrativeVec?: number[];
  situationVec: number[];
  episode: DecisionEpisode;
  episodeRecallVec: number[];
  episodePathVec: number[];
}

export function scoreDimensions(input: DimensionInput): MatchDimensions {
  return {
    stage_match: stageMatch(input.situation.stage, input.episode.time.stage),
    path_match: pathMatch(input),
    dilemma_match: dilemmaMatch(input.situation, input.episode, input.situationVec, input.episodeRecallVec),
    constraint_match: categoryMatch(
      [...input.situation.constraints, ...(input.narrative ? categorizable(input.narrative) : [])].join('，'),
      input.episode.decision_state.constraints.join('，'),
      CONSTRAINT_CATEGORIES,
    ),
    goal_match: categoryMatch(input.situation.goals.join('，'), input.episode.decision_state.goals.join('，'), GOAL_CATEGORIES),
    reversibility_match: reversibilityMatch(input.situation.reversibility, input.episode.decision_state.reversibility),
    difference_penalty: differencePenalty(input.situation, input.episode),
  };
}

export function stageMatch(userStage: string, episodeStage: string): number {
  const u = classify(userStage, STAGE_CLASSES);
  const e = classify(episodeStage, STAGE_CLASSES);
  if (u && e && u === e) return 0.9;
  if (u && e) return u === 'school' && e === 'early_career' ? 0.6 : 0.4;
  return 0.5; // 分类不出来时给中性分，不惩罚
}

export function pathMatch(input: DimensionInput): number {
  const { narrativeVec, situationVec, episodePathVec, episodeRecallVec } = input;
  const userVec = narrativeVec ?? situationVec;
  const episodeVec = narrativeVec ? episodePathVec : episodeRecallVec;
  // 余弦对不同长度文本天然偏低，重标定到 0-1 区间（v1 校准，待真实数据调参）
  return clamp01((cosine(userVec, episodeVec) - 0.2) / 0.6);
}

export function dilemmaMatch(situation: Situation, episode: DecisionEpisode, situationVec: number[], episodeRecallVec: number[]): number {
  const u = classify(situation.dilemma, DILEMMA_CLASSES);
  const e = classify(episode.decision_state.dilemma, DILEMMA_CLASSES);
  const classScore = u && e ? (u === e ? 0.9 : 0.4) : 0.5;
  const simScore = clamp01((cosine(situationVec, episodeRecallVec) - 0.2) / 0.6);
  return clamp01(0.6 * classScore + 0.4 * simScore);
}

/**
 * 类别匹配。
 *
 * v2 改动：把「识别不出类别 → 固定 0.5」换成**字符级重叠兜底**。
 *
 * 为什么必须改：36 条真实数据里，56% 的 constraints 与 81% 的 goals
 * 落不进任何类别，于是这两个维度对绝大多数案例都返回同一个 0.5 ——
 * 维度存在但**没有分辨力**，等于七维里有两维是摆设。
 *
 * 兜底用 bigram 重叠率：词汇对不上时仍能捕捉「用词相近」的结构，
 * 并且明确低于「类别命中」的分数区间，不会喧宾夺主。
 */
export function categoryMatch(userText: string, episodeText: string, categories: Record<string, string[]>): number {
  const u = hitCategories(userText, categories);
  const e = hitCategories(episodeText, categories);

  // 双方都能识别 → 用 F1（v1 行为）
  if (u.size > 0 && e.size > 0) {
    const intersection = [...u].filter((c) => e.has(c));
    if (intersection.length === 0) return 0.15;
    const recall = intersection.length / u.size;
    const precision = intersection.length / e.size;
    return clamp01((2 * (recall * precision)) / (recall + precision));
  }

  // 至少一方识别不出 → v2 字符级兜底
  if (LEXICAL_FALLBACK) {
    const overlap = bigramOverlap(userText, episodeText);
    // 重叠率 0 给 0.25（比"明确类别冲突"的 0.15 略高：没识别出来 ≠ 冲突），
    // 重叠率 1 给 0.7（仍低于类别命中的上限，不越权）
    return clamp01(0.25 + 0.45 * overlap);
  }

  return 0.5; // v1 行为（对照用）
}

/** 字符 bigram 的 Dice 系数，用来在类别识别不出时仍保留一点分辨力 */
export function bigramOverlap(a: string, b: string): number {
  const grams = (s: string): Set<string> => {
    const clean = s.replace(/[，,、；;。.\s]/g, '');
    const out = new Set<string>();
    for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

export function reversibilityMatch(user: Level, episode: Level): number {
  return 1 - Math.abs(LEVEL_VALUE[user] - LEVEL_VALUE[episode]) / 2;
}

export function differencePenalty(situation: Situation, episode: DecisionEpisode): number {
  const era = 2026 - episode.time.year;
  let penalty = era > 100 ? 0.85 : era > 50 ? 0.7 : era > 30 ? 0.45 : 0.15;
  // 用户有而案例没有的约束类别 → 结构性差异，加重惩罚（这是反类比的伏笔）
  const userCats = hitCategories(situation.constraints.join('，'), CONSTRAINT_CATEGORIES);
  const epiCats = hitCategories(episode.decision_state.constraints.join('，'), CONSTRAINT_CATEGORIES);
  const onlyUser = [...userCats].filter((c) => !epiCats.has(c));
  penalty += Math.min(0.1 * onlyUser.length, 0.3);
  // 可逆性差也计入：越不可逆的选择，越不能照搬
  penalty += Math.abs(LEVEL_VALUE[situation.reversibility] - LEVEL_VALUE[episode.decision_state.reversibility]) * 0.1;
  return clamp01(penalty);
}

/* ============================================================
   排序与解释（#14 Episode Reranker）
   ⚠️ 这 4 个导出在 v2 重写 dimensions.ts 时被误删，导致
      retrieve.ts 报 `does not provide an export named 'DIMENSION_WEIGHTS'`
      整个后端起不来。补回。
   ============================================================ */

export const DIMENSION_WEIGHTS = {
  stage_match: 0.15,
  path_match: 0.2,
  dilemma_match: 0.25,
  constraint_match: 0.2,
  goal_match: 0.15,
  reversibility_match: 0.05,
} as const;

export const PENALTY_WEIGHT = 0.3;

export function totalScore(d: MatchDimensions): number {
  let s = 0;
  for (const [k, w] of Object.entries(DIMENSION_WEIGHTS)) {
    s += w * d[k as keyof typeof DIMENSION_WEIGHTS];
  }
  return s - PENALTY_WEIGHT * d.difference_penalty;
}

const LEVEL_ZH: Record<Level, string> = { low: '低', medium: '中', high: '高' };

const DILEMMA_CLASS_ZH: Record<string, string> = {
  persist_vs_switch: '坚持 vs 转向',
  stability_vs_risk: '稳定 vs 冒险',
  explore_vs_focus: '探索 vs 专注',
};

/** 生成"为什么像你"：取最高两个维度，给出可追溯到字段或类别的理由 */
export function explainSimilarity(situation: Situation, episode: DecisionEpisode, d: MatchDimensions): string[] {
  const u = classify(situation.dilemma, DILEMMA_CLASSES);
  const candidates: { dim: string; label: string; reason: string }[] = [
    { dim: 'dilemma_match', label: '困境结构', reason: `双方核心冲突同属「${u ? DILEMMA_CLASS_ZH[u] ?? u : '同构'}」型（对方当时的困境：${episode.decision_state.dilemma}）` },
    { dim: 'path_match', label: '来时路', reason: `此前的投入路径相似：对方曾 ${episode.prior_path[0] ?? '（无记录）'}` },
    { dim: 'goal_match', label: '目标', reason: `在意的目标有交集（对方的目标：${episode.decision_state.goals.join('、')}）` },
    // #13 的部分案例没有 time.age —— 没有就不提，不输出「? 岁」
    {
      dim: 'stage_match',
      label: '阶段',
      reason: `人生阶段接近（对方当时：${episode.time.stage}${
        typeof episode.time.age === 'number' ? `，${episode.time.age} 岁` : ''
      }）`,
    },
    { dim: 'reversibility_match', label: '可逆性', reason: `当时选择的可逆性与你相近（对方评估为「${LEVEL_ZH[episode.decision_state.reversibility]}」，你为「${LEVEL_ZH[situation.reversibility]}」）` },
    { dim: 'constraint_match', label: '约束', reason: `现实约束有重叠（对方的约束：${episode.decision_state.constraints.join('、')}）` },
  ];
  const sorted = candidates.slice().sort((a, b) => d[b.dim as keyof MatchDimensions] - d[a.dim as keyof MatchDimensions]);
  const strong = sorted.filter((c) => d[c.dim as keyof MatchDimensions] >= 0.55);
  return (strong.length >= 2 ? strong : sorted).slice(0, 2).map((c) => `【${c.label}】${c.reason}`);
}

function classify(text: string, classes: Record<string, string[]>): string | undefined {
  let best: { cls: string; hits: number } | undefined;
  for (const [cls, words] of Object.entries(classes)) {
    const hits = words.filter((w) => text.includes(w)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { cls, hits };
  }
  return best?.cls;
}

function hitCategories(text: string, categories: Record<string, string[]>): Set<string> {
  const out = new Set<string>();
  for (const [cat, words] of Object.entries(categories)) {
    if (words.some((w) => text.includes(w))) out.add(cat);
  }
  return out;
}

function categorizable(text: string): string[] {
  return [text];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

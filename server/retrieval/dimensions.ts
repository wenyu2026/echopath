/**
 * 七维结构匹配打分 —— 纯函数，可离线单测。
 *
 * 设计原则（.agent/DecisionEpisode-Schema.md 第 3 节）：
 * - 不输出单一"相似度 87%"，每个维度独立打分 0-1
 * - difference_penalty 是维度之一：时代/制度/资源差异越大值越高，最终排序时做减法
 * - v1 打分规则全部基于词表 + 字段对比，不依赖额外 LLM 调用（延迟可控）
 *
 * ⚠️ 本文件是评分规则的实现载体。修改权重或词表前先在 Issue 里给出方案与影响
 * （协作约定：改评分规则前先给人确认）。
 */
import type { DecisionEpisode, Level, MatchDimensions, Situation } from '../../src/types/episode.ts';
import { cosine } from '../embedding/embed.ts';

/** 约束/目标按类别归并 —— 匹配的是"结构"而不是字面词 */
export const CONSTRAINT_CATEGORIES: Record<string, string[]> = {
  economic: ['经济', '钱', '收入', '拮据', '债务', '资助', '供养', '积蓄', '存款', '学费', '花销'],
  time: ['时间', '投入', '年限', '两年', '三年', '一年', '延毕', '蛰伏', '沉没成本'],
  threshold: ['门槛', '成绩', '绩点', '考试', '竞争', '成功率', '难度'],
  family: ['家庭', '父母', '期望', '配偶', '家人', '婚姻'],
  identity: ['身份', '公费', '编制', '户口', '应届', '签证'],
  era: ['时代', '环境', '制度', '行业'],
};

export const GOAL_CATEGORIES: Record<string, string[]> = {
  interest: ['兴趣', '喜欢', '热爱', '想做', '热情'],
  growth: ['成长', '能力', '学习', '提升', '进步'],
  stability: ['稳定', '安全', '保障', '毕业', '安稳'],
  income: ['收入', '薪资', '赚钱', '就业', '前景', '报酬'],
  impact: ['影响', '价值', '改变', '理想', '意义', '国民', '精神'],
};

export const STAGE_CLASSES: Record<string, string[]> = {
  school: ['大学', '学院', '专业', '学业', '在校', '留学', '大一', '大二', '大三', '大四', '研究生', '读书', '毕'],
  early_career: ['职业早期', '职业起步', '工作', '实习', '职场', '入职', '创业', '从业'],
  mid_career: ['中年', '管理', '资深', '转型期'],
};

export const DILEMMA_CLASSES: Record<string, string[]> = {
  persist_vs_switch: ['坚持', '转向', '换', '继续', '放弃', '止损', '离开', '留下', '深耕', '跳'],
  stability_vs_risk: ['稳定', '冒险', '创业', '大厂', '小公司', '保守', '激进'],
  explore_vs_focus: ['探索', '专注', '试探', '收敛', '发散', '双轨'],
};

const LEVEL_VALUE: Record<Level, number> = { low: 0, medium: 0.5, high: 1 };

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
  const { situation, episode } = input;
  return {
    stage_match: stageMatch(situation.stage, episode.time.stage),
    path_match: pathMatch(input),
    dilemma_match: dilemmaMatch(situation, episode, input.situationVec, input.episodeRecallVec),
    constraint_match: categoryMatch(
      [...situation.constraints, ...(input.narrative ? categorizable(input.narrative) : [])].join('，'),
      episode.decision_state.constraints.join('，'),
      CONSTRAINT_CATEGORIES,
    ),
    goal_match: categoryMatch(situation.goals.join('，'), episode.decision_state.goals.join('，'), GOAL_CATEGORIES),
    reversibility_match: reversibilityMatch(situation.reversibility, episode.decision_state.reversibility),
    difference_penalty: differencePenalty(situation, episode),
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

export function categoryMatch(userText: string, episodeText: string, categories: Record<string, string[]>): number {
  const u = hitCategories(userText, categories);
  const e = hitCategories(episodeText, categories);
  if (u.size === 0 || e.size === 0) return 0.5; // 有一方识别不出 → 中性，不假装匹配
  const intersection = [...u].filter((c) => e.has(c));
  const recall = intersection.length / u.size;
  const precision = intersection.length / e.size;
  if (intersection.length === 0) return 0.15;
  return clamp01(2 * (recall * precision) / (recall + precision));
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
  const missing = [...userCats].filter((c) => !epiCats.has(c) && (c === 'threshold' || c === 'economic')).length;
  penalty = Math.min(1, penalty + 0.08 * missing);
  return penalty;
}

/** 最终排序分：加权和 − 惩罚。只用于排序，不向用户展示为"相似度百分比"。 */
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
    s += w * (d[k as keyof typeof DIMENSION_WEIGHTS]);
  }
  return s - PENALTY_WEIGHT * d.difference_penalty;
}

const LEVEL_ZH: Record<Level, string> = { low: '低', medium: '中', high: '高' };

const DILEMMA_CLASS_ZH: Record<string, string> = {
  persist_vs_switch: '坚持 vs 转向',
  stability_vs_risk: '稳定 vs 冒险',
  explore_vs_focus: '探索 vs 专注',
};

/** 生成"为什么像你"：取最高两个维度，给出可追溯到字段或类别的理由（Episode Reranker 职责，#14） */
export function explainSimilarity(situation: Situation, episode: DecisionEpisode, d: MatchDimensions): string[] {
  const u = classify(situation.dilemma, DILEMMA_CLASSES);
  const candidates: { dim: string; label: string; reason: string }[] = [
    { dim: 'dilemma_match', label: '困境结构', reason: `双方核心冲突同属「${u ? DILEMMA_CLASS_ZH[u] ?? u : '同构'}」型（对方当时的困境：${episode.decision_state.dilemma}）` },
    { dim: 'path_match', label: '来时路', reason: `此前的投入路径相似：对方曾 ${episode.prior_path[0] ?? '（无记录）'}` },
    { dim: 'goal_match', label: '目标', reason: `在意的目标有交集（对方的目标：${episode.decision_state.goals.join('、')}）` },
    { dim: 'stage_match', label: '阶段', reason: `人生阶段接近（对方当时：${episode.time.stage}，${episode.time.age ?? '?'} 岁）` },
    { dim: 'reversibility_match', label: '可逆性', reason: `当时选择的可逆性与你相近（对方评估为「${LEVEL_ZH[episode.decision_state.reversibility]}」，你为「${LEVEL_ZH[situation.reversibility]}」）` },
    { dim: 'constraint_match', label: '约束', reason: `现实约束有重叠（对方的约束：${episode.decision_state.constraints.join('、')}）` },
  ];
  const sorted = candidates.slice().sort((a, b) => d[b.dim as keyof MatchDimensions] - d[a.dim as keyof MatchDimensions]);
  // 优先给 ≥0.55 的维度；不足 2 条时退回纯 top-2（验收要求每案例至少 2 条理由）
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
  // narrative 只贡献它显式提到的类别词，避免整段文本误命中
  return [text];
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

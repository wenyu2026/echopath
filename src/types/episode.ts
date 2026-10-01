/**
 * Decision Episode 与 Situation 的类型契约
 * ============================================
 * 这是前端与 AI/后端共用的唯一类型来源。
 *
 * 修改本文件前请先读 .agent/DecisionEpisode-Schema.md
 * 任何字段变更都必须同步更新该文档，并在 Issue 里 @ 相关人。
 */

/* ============================================================
   一、Situation（用户侧：当前处境）
   ============================================================ */

/** 风险承受度 / 可逆性，只允许三个值 */
export type Level = 'low' | 'medium' | 'high';

/**
 * 用户当前处境的结构化表示。
 * 由 Situation Parser（glm-5 + json_schema 严格模式）产出。
 */
export interface Situation {
  /** 人生阶段，≤12 字 */
  stage: string;
  /** 核心冲突，必须是 "A vs B" 形式，≤18 字 */
  dilemma: string;
  /** 可选道路，2-5 项 */
  options: string[];
  /** 现实约束，2-6 项 */
  constraints: string[];
  /** 真正在意的目标，2-5 项 */
  goals: string[];
  /** 风险承受度 */
  risk: Level;
  /** 可逆性 */
  reversibility: Level;
  /** 尚不明确的信息，2-6 项 */
  unknowns: string[];
}

/* ============================================================
   二、Decision Episode（案例侧：人生决策事件）
   ============================================================ */

/**
 * 决策类型 —— 多样性选择器靠这个字段保证"三个案例走不同的路"。
 * 返回的 3 个案例中，此字段至少覆盖 2 种不同值。
 */
export type ChoiceType =
  | 'persist'              // 坚持原路
  | 'direct_switch'        // 直接转向
  | 'explore_then_switch'  // 先试探再转向
  | 'explore_then_persist' // 试探后确认留下
  | 'abandon'              // 放弃/退出
  | 'dual_track';          // 双轨并行

/**
 * 证据类型 —— 证据分层的核心。
 * ai_inference 绝不允许和史实混在一起展示。
 */
export type EvidenceType =
  | 'self_writing'   // 本人日记/书信/自述（可信度最高）
  | 'biography'      // 权威传记/学术研究
  | 'interview'      // 公开演讲/访谈
  | 'encyclopedia'   // 百科/公共数据库
  | 'ai_inference';  // ⚠️ AI 推断，必须显著标注

export interface Evidence {
  source_id: string;
  type: EvidenceType;
  /** 该来源支持的具体事实主张 */
  claim: string;
  /** 可选：原文引用片段 */
  quote?: string;
  /** 可选：来源链接或出处 */
  url?: string;
}

export interface EpisodePerson {
  name: string;
  birth_year?: number;
  /** 用于筛选的标签，如 ["文学","转向","青年"] */
  tags: string[];
}

export interface EpisodeTime {
  year: number;
  age?: number;
  /** 人生阶段，如 "留学期间" */
  stage: string;
}

export interface EpisodeDecisionState {
  dilemma: string;
  options: string[];
  constraints: string[];
  goals: string[];
  risk: Level;
  reversibility: Level;
}

export interface EpisodeChoice {
  type: ChoiceType;
  /** 实际做了什么（不是后人总结） */
  actions: string[];
}

/** 结果链 —— 必须分短/中/长期，不用"成功/失败"二元化 */
export interface EpisodeOutcomes {
  short_term: string;
  mid_term: string;
  long_term: string;
}

export interface EpisodeReflection {
  /** 本人后来如何评价（有出处才写） */
  self_comment?: string;
  /** 明确不确定的部分 */
  unknowns: string[];
}

/**
 * 一条完整的人生决策事件。
 * ⚠️ 数据单位是"某人在某阶段的一次决策"，不是"一个人"。
 */
export interface DecisionEpisode {
  episode_id: string;
  person: EpisodePerson;
  time: EpisodeTime;
  /** 做这次选择前，他已经经历了什么 */
  prior_path: string[];
  decision_state: EpisodeDecisionState;
  choice: EpisodeChoice;
  outcomes: EpisodeOutcomes;
  reflection: EpisodeReflection;
  evidence: Evidence[];
  /** 后续分叉：人生不是一次选择后结束 */
  next_episode_ids?: string[];
  /** 用于召回与筛选的标签 */
  retrieval_tags: string[];
}

/* ============================================================
   三、匹配结果（检索输出）
   ============================================================ */

/** 七个匹配维度的分数，0-1 */
export interface MatchDimensions {
  stage_match: number;
  path_match: number;
  dilemma_match: number;
  constraint_match: number;
  goal_match: number;
  reversibility_match: number;
  /** 差异惩罚：时代/制度/资源差异越大，此值越高 */
  difference_penalty: number;
}

/**
 * 反类比的一条结构化明细。
 *
 * 为什么需要它（CHANGE_REQUEST #17 已批准）：
 *   `why_different` 是给前端直接渲染的 string[]，但方案第 2.3 节要求
 *   「⚠️ AI 类比」与「【未知】」必须与普通差异**视觉区分**，纯文本行做不到。
 *   所以每条差异额外携带「依据类型」，前端可据此渲染不同样式。
 */
export interface WhyDifferentDetail {
  /** 给用户看的一句话（与 why_different[i] 一致） */
  text: string;
  /**
   * 差异类别：
   * - structure：结构字段差异（纯代码可比，如 constraints 对比）
   * - evidence：证据覆盖差异
   * - era：时代/制度差异 —— **属 AI 类比，前端必须显著标注**
   * - unknown：证据不足，无法判断
   */
  kind: 'structure' | 'evidence' | 'era' | 'unknown';
  /** 依据说明，如 "constraints 对比" / "LX-S3" / "模型外部知识" */
  basis: string;
  /** 引用的 source_id 或结构字段名 */
  refs?: string[];
}

/**
 * 一个案例的匹配结果。
 * ⚠️ 不输出单一"相似度 87%"，而是维度卡 + 像/不像的解释。
 */
export interface MatchResult {
  episode: DecisionEpisode;
  dimensions: MatchDimensions;
  /** 为什么像你（具体到结构，不是泛泛而谈） */
  why_similar: string[];
  /** 为什么不像你 —— 反类比，至少 2 条重要不可比因素 */
  why_different: string[];
  /**
   * 反类比的结构化明细（可选）。
   * `why_different` 由它序列化生成；前端可先只读 string[]，渐进迁移。
   */
  why_different_detail?: WhyDifferentDetail[];
  /** 该案例结论的可信度分层 */
  evidence_layers: {
    facts: string[];        // 史实
    self_claims: string[];  // 本人表述
    interpretations: string[]; // 后人解释
    ai_inferences: string[];   // ⚠️ AI 类比
    unknowns: string[];        // 未知/有争议
  };
}

/** 一次完整检索的返回 */
export interface RetrievalResponse {
  situation: Situation;
  /** 固定返回 3 个案例，且 choice.type 至少覆盖 2 种 */
  matches: MatchResult[];
  /** 本次检索的元信息，用于"检索过程可视化" */
  meta: {
    candidates_recalled: number;   // 候选召回数
    after_metadata_filter: number; // 元数据过滤后
    after_rerank: number;          // 重排后
    elapsed_ms: number;
  };
}

/**
 * trajectory-v0.1 契约常量
 * 来源：.agent/handoffs/agent-cards-v0.1/02-two-person-work-packages.md 第 3 节（实现起点）。
 * 词表复用 src/types/landscape.ts（ROOT_FACTORS / PathArchetypeId）与 src/types/episode.ts（ChoiceType）。
 * ⚠️ A 正式化公共类型后必须与它对齐；本文件只服务离线校验/导出，不是公共契约本体。
 */

export const SCHEMA_VERSION = '0.1';

export const DIMENSION_KEYS = [
  'life_stage',
  'prior_path',
  'path_investment',
  'economic_pressure',
  'family_responsibility',
  'resource_access',
  'goal_structure',
  'new_path_validation',
  'reversibility',
  'time_window',
];

export const LIFE_STAGE_VALUES = ['student', 'early_career', 'established', 'transition', 'other'];
export const PRIOR_PATH_LABELS = ['study', 'work', 'research', 'business', 'trial'];
export const TIER_LABELS = ['low', 'medium', 'high'];
export const RESOURCE_ACCESS_LABELS = [
  'funding', 'skills', 'credentials', 'mentor', 'institution', 'family_support', 'network',
];
export const GOAL_STRUCTURE_LABELS = ['stability', 'income', 'interest', 'autonomy', 'growth', 'impact', 'family'];
export const NEW_PATH_VALIDATION_VALUES = ['none', 'indirect', 'tried', 'sustained'];

/** 与 src/types/landscape.ts 保持一致的封闭词表 */
export const ROOT_FACTORS = [
  '沉没成本', '转换成本', '新路径验证不足', '长期方向匹配', '再次选错风险', '时间窗口',
  '经济压力', '家庭约束', '制度约束', '身份绑定', '机会成本', '社会支持',
];

export const PATH_ARCHETYPE_IDS = [
  'persist', 'explore_then_persist', 'explore_then_switch', 'direct_switch', 'dual_track', 'abandon', 'unknown',
];

/** 与 src/types/episode.ts 保持一致 */
export const CHOICE_TYPES = [
  'persist', 'direct_switch', 'explore_then_switch', 'explore_then_persist', 'abandon', 'dual_track',
];

export const PERSON_KINDS = ['fact', 'inference', 'retrospective'];
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];
export const TIME_SCOPES = ['point', 'interval', 'timeless'];
export const SNAPSHOT_KINDS = ['decision', 'state_change'];

/**
 * explicit_order 依据词表（v0.1，B 线建议，待 A 并入公共契约）。
 * 强→弱：logical_precondition（状态先于其终结/接受先于给予等解析性前提）
 *       > formal_episode_chain（正式库 episode 结构归位：prior_path / outcome 层 / next_episode_ids）
 *       > cross_source_consistency（多个独立来源互证）
 *       > source_narrative_order（单一事后来源的叙述顺序 —— 最弱类，必须人工裁决）
 */
export const ORDER_BASES = [
  'logical_precondition',
  'formal_episode_chain',
  'cross_source_consistency',
  'source_narrative_order',
];
/** 弱顺序证据类：只要有视图依赖它，就必须在视图上带 temporal_caveats */
export const WEAK_ORDER_BASES = ['source_narrative_order'];

export const ADJUDICATION_STATUSES = ['pending', 'confirmed', 'rejected'];

/** 分档维度：value 必须是 low/medium/high，且属于建模（kind 不得为 fact） */
export const TIER_DIMENSIONS = ['path_investment', 'economic_pressure', 'family_responsibility', 'reversibility'];

/** 每张卡的目标工作量（工作包 §2；达不到标 partial，禁止凑数） */
export const TARGETS = { facts: [15, 25], snapshots: [4, 6], events: [2, 3] };

export const TIMECHECK_RULE_VERSION = 'tc-0.1';

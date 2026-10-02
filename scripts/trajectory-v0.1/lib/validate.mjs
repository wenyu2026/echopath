/**
 * PersonCard v0.1 校验器（离线，无依赖，Node 内置模块）。
 *
 * 设计要点：
 * - 校验是「机器检查」，通过不代表人工审核；human_review.status=pending 一律保留。
 * - 引用必须闭合：fact→source、dimension→fact、snapshot→fact、event→episode_id（正式库存在性）。
 * - retrospective（回顾性解释）禁止进入任何决策前快照的 prior / 维度证据。
 * - 明确晚于决策的事实 = 硬错误；同年顺序不清 = 导出时被时间门槛排除（见 export.mjs）。
 * - 时间边界检查每次运行重新计算，不读任何硬编码的「已通过」标记。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  SCHEMA_VERSION, DIMENSION_KEYS, LIFE_STAGE_VALUES, PRIOR_PATH_LABELS, TIER_LABELS,
  RESOURCE_ACCESS_LABELS, GOAL_STRUCTURE_LABELS, NEW_PATH_VALIDATION_VALUES,
  ROOT_FACTORS, PATH_ARCHETYPE_IDS, CHOICE_TYPES, PERSON_KINDS, CONFIDENCE_LEVELS,
  TIME_SCOPES, SNAPSHOT_KINDS, TIER_DIMENSIONS, TARGETS,
  ORDER_BASES, WEAK_ORDER_BASES, ADJUDICATION_STATUSES,
} from './contract.mjs';

function err(msg) { return { level: 'error', message: msg }; }
function warn(msg) { return { level: 'warning', message: msg }; }

/** 校验年份区间：{start_year, end_year}，允许 null（未知）或整数（允许负数表示公元前） */
function checkYearInterval(interval, where, problems) {
  if (interval === null || interval === undefined) return;
  if (typeof interval !== 'object' || Array.isArray(interval)) {
    problems.push(err(`${where}: 年份区间必须是 {start_year, end_year} 或 null`));
    return;
  }
  for (const k of ['start_year', 'end_year']) {
    const v = interval[k];
    if (v !== null && v !== undefined && !Number.isInteger(v)) {
      problems.push(err(`${where}: ${k} 必须是整数或 null，实际 ${JSON.stringify(v)}`));
    }
  }
}

function checkConfidence(value, where, problems) {
  if (value === null || value === undefined) return;
  if (!CONFIDENCE_LEVELS.includes(value)) {
    problems.push(err(`${where}: confidence 必须是 high/medium/low 或 null，实际 ${JSON.stringify(value)}`));
  }
}

/**
 * 构建 ctx：读取正式库（只读）与来源登记，供校验与导出共用。
 * @param {string} repoRoot 仓库根目录
 * @param {string} registryPath 来源登记文件（默认 data/trajectory-v0.1/sources.json）
 */
export function buildCtx(repoRoot, registryPath = 'data/trajectory-v0.1/sources.json') {
  const root = resolve(repoRoot);
  const regAbs = join(root, registryPath);
  const registry = JSON.parse(readFileSync(regAbs, 'utf8'));
  const formalSourcesPath = join(root, 'data/sources.json');
  const formalEpisodesPath = join(root, 'data/episodes.json');
  const formalSources = JSON.parse(readFileSync(formalSourcesPath, 'utf8'));
  const formalEpisodes = JSON.parse(readFileSync(formalEpisodesPath, 'utf8'));
  const episodeIds = new Set((formalEpisodes.episodes ?? []).map((e) => e.episode_id));
  const formalSourceById = new Map((formalSources.sources ?? []).map((s) => [s.source_id, s]));
  return { root, registry, formalSourceById, episodeIds, registryPath };
}

/** 校验单张 PersonCard。返回 {errors, warnings, stats}；errors 非空即拒绝。 */
export function validateCard(card, ctx) {
  const problems = [];
  const p = problems;

  if (card.schema_version !== SCHEMA_VERSION) p.push(err(`schema_version 必须为 "${SCHEMA_VERSION}"，实际 ${JSON.stringify(card.schema_version)}`));
  if (card.artifact_type !== 'person_card') p.push(err(`artifact_type 必须为 "person_card"，实际 ${JSON.stringify(card.artifact_type)}`));
  if (typeof card.synthetic !== 'boolean') p.push(err('synthetic 标志必须为 boolean（测试素材必须标 synthetic）'));

  if (!card.person_id || typeof card.person_id !== 'string') p.push(err('缺少 person_id'));
  if (card.synthetic === true && !/^syn/i.test(card.person_id ?? '')) {
    p.push(err('synthetic 卡的人物 ID 必须以 SYN 前缀命名，避免混入正式人物'));
  }
  if (card.synthetic === false && /^syn/i.test(card.person_id ?? '')) {
    p.push(err('非 synthetic 卡不得使用 SYN 前缀人物 ID'));
  }

  // ---- 唯一 ID ----
  const factIds = new Set();
  for (const f of card.facts ?? []) {
    if (!f.fact_id) { p.push(err('存在缺少 fact_id 的事实')); continue; }
    if (factIds.has(f.fact_id)) p.push(err(`重复 fact_id: ${f.fact_id}`));
    factIds.add(f.fact_id);
  }
  const snapIds = new Set();
  for (const s of card.snapshots ?? []) {
    if (!s.snapshot_id) { p.push(err('存在缺少 snapshot_id 的快照')); continue; }
    if (snapIds.has(s.snapshot_id)) p.push(err(`重复 snapshot_id: ${s.snapshot_id}`));
    snapIds.add(s.snapshot_id);
  }
  const eventIds = new Set();
  for (const e of card.events ?? []) {
    if (!e.event_id) { p.push(err('存在缺少 event_id 的事件')); continue; }
    if (eventIds.has(e.event_id)) p.push(err(`重复 event_id: ${e.event_id}`));
    eventIds.add(e.event_id);
  }
  const mechIds = new Set();
  for (const m of card.mechanisms ?? []) {
    if (!m.mechanism_id) { p.push(err('存在缺少 mechanism_id 的机制')); continue; }
    if (mechIds.has(m.mechanism_id)) p.push(err(`重复 mechanism_id: ${m.mechanism_id}`));
    mechIds.add(m.mechanism_id);
  }

  // ---- 事实 ----
  const factById = new Map((card.facts ?? []).filter((f) => f.fact_id).map((f) => [f.fact_id, f]));
  for (const f of card.facts ?? []) {
    const where = `fact ${f.fact_id ?? '?'}`;
    if (!f.text || typeof f.text !== 'string') p.push(err(`${where}: 缺少 text`));
    checkYearInterval(f.occurred, `${where}.occurred`, p);
    if (!TIME_SCOPES.includes(f.time_scope)) p.push(err(`${where}: time_scope 必须是 ${TIME_SCOPES.join('/')}`));
    if (!PERSON_KINDS.includes(f.kind)) p.push(err(`${where}: kind 必须是 ${PERSON_KINDS.join('/')}`));
    checkConfidence(f.confidence, where, p);
    if (f.kind === 'retrospective' && f.confidence === null) {
      p.push(warn(`${where}: retrospective 事实建议标注 confidence（对其来源的支持程度）`));
    }
    if (f.time_scope === 'timeless' && (f.occurred?.start_year != null || f.occurred?.end_year != null)) {
      p.push(err(`${where}: time_scope=timeless 时 occurred 必须为全 null`));
    }
    if (f.time_scope !== 'timeless' && f.occurred?.start_year == null && f.occurred?.end_year == null && !f.notes?.includes('无出处')) {
      p.push(warn(`${where}: 发生区间全空，需要 notes 说明未知原因或提供 explicit_order 依据`));
    }
    if (!Array.isArray(f.source_refs) || f.source_refs.length === 0) {
      p.push(err(`${where}: 事实必须绑定至少一个来源`));
    } else {
      for (const r of f.source_refs) {
        if (!ctx.registry.sources?.[r.source_id]) {
          p.push(err(`${where}: 悬空来源引用 ${r.source_id}（不在登记 ${ctx.registryPath} 中）`));
        } else if (!r.locator || typeof r.locator !== 'string') {
          p.push(err(`${where}: 来源 ${r.source_id} 的 locator 必须非空（具体定位）`));
        }
      }
    }
  }

  // ---- 快照 ----
  const DECISION_DIM_RULES = {
    life_stage: (v, pr, where) => { if (!LIFE_STAGE_VALUES.includes(v)) pr.push(err(`${where}: life_stage 取值 ${JSON.stringify(v)} 不在词表`)); },
    prior_path: (v, pr, where) => {
      if (!Array.isArray(v) || v.length === 0) { pr.push(err(`${where}: prior_path 必须是非空标签数组或 null`)); return; }
      for (const t of v) if (!PRIOR_PATH_LABELS.includes(t)) pr.push(err(`${where}: prior_path 标签 ${JSON.stringify(t)} 不在词表`));
    },
    resource_access: (v, pr, where) => {
      if (!Array.isArray(v) || v.length === 0) { pr.push(err(`${where}: resource_access 必须是非空标签数组或 null`)); return; }
      for (const t of v) if (!RESOURCE_ACCESS_LABELS.includes(t)) pr.push(err(`${where}: resource_access 标签 ${JSON.stringify(t)} 不在词表`));
    },
    goal_structure: (v, pr, where) => {
      if (!Array.isArray(v) || v.length === 0) { pr.push(err(`${where}: goal_structure 必须是非空标签数组或 null`)); return; }
      for (const t of v) if (!GOAL_STRUCTURE_LABELS.includes(t)) pr.push(err(`${where}: goal_structure 标签 ${JSON.stringify(t)} 不在词表`));
    },
    new_path_validation: (v, pr, where) => { if (!NEW_PATH_VALIDATION_VALUES.includes(v)) pr.push(err(`${where}: new_path_validation 取值 ${JSON.stringify(v)} 不在词表`)); },
    time_window: (v, pr, where) => {
      if (typeof v !== 'object' || Array.isArray(v) || v === null) { pr.push(err(`${where}: time_window 必须是 {description, deadline_year}`)); return; }
      if (typeof v.description !== 'string' || !v.description) pr.push(err(`${where}: time_window.description 必须非空`));
      if (v.deadline_year !== null && !Number.isInteger(v.deadline_year)) pr.push(err(`${where}: time_window.deadline_year 必须是整数或 null`));
    },
  };
  for (const k of TIER_DIMENSIONS) {
    DECISION_DIM_RULES[k] = (v, pr, where) => { if (!TIER_LABELS.includes(v)) pr.push(err(`${where}: ${k} 取值 ${JSON.stringify(v)} 不在 ${TIER_LABELS.join('/')}`)); };
  }

  const orderedFactsBySnapshot = new Map();
  for (const s of card.snapshots ?? []) {
    const where = `snapshot ${s.snapshot_id ?? '?'}`;
    if (!SNAPSHOT_KINDS.includes(s.snapshot_kind)) p.push(err(`${where}: snapshot_kind 必须是 ${SNAPSHOT_KINDS.join('/')}`));
    checkYearInterval(s.node_time, `${where}.node_time`, p);
    if (s.snapshot_kind === 'decision') {
      if (!s.decision_time) p.push(err(`${where}: decision 快照必须提供 decision_time`));
      checkYearInterval(s.decision_time, `${where}.decision_time`, p);
      if (!s.episode_id) p.push(err(`${where}: decision 快照必须关联 episode_id（检索视图三元组之一）`));
      else if (!ctx.episodeIds.has(s.episode_id) && card.synthetic !== true) {
        p.push(err(`${where}: episode_id ${s.episode_id} 不在正式库 data/episodes.json（新事件先作为候选，不改写主库）`));
      }
    } else if (s.view_export !== false && s.decision_time == null) {
      p.push(warn(`${where}: 非决策快照默认不导出视图；如需导出必须显式声明并补 decision_time`));
    }

    // prior 引用闭合 + retrospective 排除 + 明确晚于决策的硬错误
    const ordered = new Set((s.prior_order_notes ?? []).map((n) => n.fact_id));
    orderedFactsBySnapshot.set(s.snapshot_id, ordered);
    const decStart = s.decision_time?.start_year ?? s.node_time?.start_year ?? null;
    const decEnd = s.decision_time?.end_year ?? s.node_time?.end_year ?? null;
    for (const fid of s.prior_fact_ids ?? []) {
      const f = factById.get(fid);
      if (!f) { p.push(err(`${where}: prior_fact_ids 悬空引用 ${fid}`)); continue; }
      if (f.kind === 'retrospective') p.push(err(`${where}: retrospective 事实 ${fid} 禁止进入决策前快照`));
      if (decStart != null && f.occurred?.start_year != null && f.occurred.start_year > decEnd) {
        p.push(err(`${where}: 事实 ${fid}（发生 ${f.occurred.start_year} 年起）明确晚于决策（${decEnd} 年），不得作为决策前事实`));
      }
    }
    for (const n of s.prior_order_notes ?? []) {
      if (!factById.has(n.fact_id)) p.push(err(`${where}: prior_order_notes 悬空引用 ${n.fact_id}`));
      else if (!(s.prior_fact_ids ?? []).includes(n.fact_id)) p.push(err(`${where}: explicit_order 的 ${n.fact_id} 不在 prior_fact_ids`));
      const eo = n.explicit_order;
      if (!eo?.justification || !Array.isArray(eo?.refs) || eo.refs.length === 0) {
        p.push(err(`${where}: ${n.fact_id} 的 explicit_order 必须带 justification 与至少一个引用`));
      } else {
        for (const r of eo.refs) {
          if (!ctx.registry.sources?.[r]) p.push(err(`${where}: explicit_order 引用未登记来源 ${r}`));
        }
        if (!ORDER_BASES.includes(eo.basis)) {
          p.push(err(`${where}: ${n.fact_id} 的 explicit_order.basis ${JSON.stringify(eo.basis)} 不在受控词表 ${ORDER_BASES.join('/')}`));
        }
        if (WEAK_ORDER_BASES.includes(eo.basis) && eo.basis_detail === undefined) {
          p.push(warn(`${where}: ${n.fact_id} 使用最弱顺序依据 source_narrative_order，建议补 basis_detail 说明边界`));
        }
        const adj = eo.human_adjudication;
        if (!adj || !ADJUDICATION_STATUSES.includes(adj.status)) {
          p.push(err(`${where}: ${n.fact_id} 的 explicit_order 必须带 human_adjudication（status: pending/confirmed/rejected）——顺序证据必须提交真人复核`));
        } else {
          if (adj.status === 'confirmed' && (!adj.by || !adj.on)) {
            p.push(err(`${where}: ${n.fact_id} 的顺序裁决为 confirmed 时必须留真人签字（by/on）`));
          }
          if (adj.status === 'rejected') {
            p.push(err(`${where}: ${n.fact_id} 的顺序依据已被真人驳回，必须将其移出 prior_fact_ids（可保留在卡时间线中）`));
          }
        }
      }
    }

    // 十维
    const dims = s.dimensions ?? {};
    for (const key of DIMENSION_KEYS) {
      const d = dims[key];
      if (!d) { p.push(err(`${where}: 缺少维度 ${key}`)); continue; }
      const dw = `${where}.${key}`;
      if (!PERSON_KINDS.includes(d.kind)) p.push(err(`${dw}: kind 必须是 ${PERSON_KINDS.join('/')}`));
      checkConfidence(d.confidence, dw, p);
      checkYearInterval(d.valid_time, `${dw}.valid_time`, p);
      if (d.value === null || d.value === undefined) {
        if (!d.unknown_reason || typeof d.unknown_reason !== 'string') {
          p.push(err(`${dw}: value=null 时必须给出 unknown_reason（不得用默认中等冒充未知）`));
        }
        if (d.confidence != null) p.push(err(`${dw}: 未知维度 confidence 必须为 null`));
        if (Array.isArray(d.evidence_refs) && d.evidence_refs.length > 0) {
          p.push(err(`${dw}: 未知维度不应携带 evidence_refs`));
        }
      } else {
        if (d.unknown_reason != null) p.push(err(`${dw}: 非空维度不应写 unknown_reason`));
        const refs = Array.isArray(d.evidence_refs) ? d.evidence_refs : null;
        if (!refs) p.push(err(`${dw}: evidence_refs 必须是数组`));
        const hasModelingBasis = typeof d.modeling_basis === 'string' && d.modeling_basis.length > 0;
        const absenceOk = key === 'new_path_validation' && d.value === 'none';
        if (refs && refs.length === 0 && !hasModelingBasis && !absenceOk) {
          p.push(err(`${dw}: 有值但没有任何证据引用（也没有 modeling_basis）；无证据的维度必须保持 null`));
        }
        for (const fid of refs ?? []) {
          const f = factById.get(fid);
          if (!f) { p.push(err(`${dw}: 证据引用悬空 ${fid}`)); continue; }
          if (f.kind === 'retrospective') p.push(err(`${dw}: 维度证据引用了 retrospective 事实 ${fid}，回顾性解释不得参与决策前状态`));
        }
        if (TIER_DIMENSIONS.includes(key)) {
          if (d.kind === 'fact') p.push(warn(`${dw}: 分档标签属于建模，kind=fact 可疑（通常应为 inference）`));
        }
        const rule = DECISION_DIM_RULES[key];
        if (rule) rule(d.value, p, dw);
      }
    }
  }

  // ---- 事件 ----
  for (const e of card.events ?? []) {
    const where = `event ${e.event_id ?? '?'}`;
    if (card.synthetic !== true) {
      if (!e.episode_id) p.push(err(`${where}: 必须引用正式 episode_id`));
      else if (!ctx.episodeIds.has(e.episode_id)) p.push(err(`${where}: episode_id ${e.episode_id} 不在正式库（新事件先作为候选）`));
    }
    if (!snapIds.has(e.snapshot_id)) p.push(err(`${where}: snapshot_id 悬空 ${e.snapshot_id}`));
    if (!CHOICE_TYPES.includes(e.choice?.type)) p.push(err(`${where}: choice.type ${JSON.stringify(e.choice?.type)} 不在词表`));
    for (const fid of [...(e.choice?.action_fact_ids ?? []), ...(e.outcome_fact_ids ?? [])]) {
      if (!factById.has(fid)) p.push(err(`${where}: 事实引用悬空 ${fid}`));
    }
    for (const fid of e.reflection?.retrospective_fact_ids ?? []) {
      const f = factById.get(fid);
      if (f && f.kind !== 'retrospective') p.push(err(`${where}: ${fid} 不是 retrospective，却列在 retrospective_fact_ids`));
    }
    if (!mechIds.has(e.mechanism_id)) p.push(err(`${where}: mechanism_id 悬空 ${e.mechanism_id}`));
  }

  // ---- 机制 ----
  for (const m of card.mechanisms ?? []) {
    const where = `mechanism ${m.mechanism_id ?? '?'}`;
    if (!PATH_ARCHETYPE_IDS.includes(m.archetype)) p.push(err(`${where}: archetype ${JSON.stringify(m.archetype)} 不在 src/types/landscape.ts 词表`));
    if (!Array.isArray(m.root_factors) || m.root_factors.length < 3 || m.root_factors.length > 6) {
      p.push(err(`${where}: root_factors 必须 3-6 个`));
    } else {
      for (const rf of m.root_factors) {
        if (!ROOT_FACTORS.includes(rf)) p.push(err(`${where}: root_factor ${JSON.stringify(rf)} 不在封闭词表`));
      }
    }
    if (!eventIds.has(m.event_id)) p.push(err(`${where}: event_id 悬空 ${m.event_id}`));
    if (m.kind !== 'inference') p.push(err(`${where}: 机制标注是建模，kind 必须为 inference`));
  }

  // ---- 来源登记与正式库交叉核对（只读正式库，不修改） ----
  for (const [sid, entry] of Object.entries(ctx.registry.sources ?? {})) {
    const formal = ctx.formalSourceById.get(sid);
    if (!formal) {
      if (!sid.startsWith('SYN-')) p.push(err(`登记中的来源 ${sid} 不在正式库 data/sources.json（新来源需先入库或由 A 协调）`));
      continue;
    }
    for (const k of ['title', 'publisher', 'url', 'type', 'locator']) {
      if (entry.base?.[k] !== undefined && entry.base[k] !== formal[k]) {
        p.push(err(`来源 ${sid} 的 base.${k} 与正式库不一致：登记=${JSON.stringify(entry.base[k])} 正式=${JSON.stringify(formal[k])}`));
      }
    }
  }

  // ---- 目标工作量（仅约束正式卡；synthetic 测试素材豁免。不足标 partial；禁止凑数） ----
  const stats = {
    facts: card.facts?.length ?? 0,
    snapshots: card.snapshots?.length ?? 0,
    events: card.events?.length ?? 0,
  };
  const within = (n, [lo, hi]) => n >= lo && n <= hi;
  if (card.synthetic !== true) {
    if (!within(stats.facts, TARGETS.facts) || !within(stats.snapshots, TARGETS.snapshots) || !within(stats.events, TARGETS.events)) {
      if (card.partial?.status !== true) {
        p.push(err(`工作量 ${JSON.stringify(stats)} 不足目标 ${JSON.stringify(TARGETS)} 且 partial.status != true；禁止为数量编造，请如实标注 partial 并说明资料缺口`));
      } else {
        p.push(warn(`工作量 ${JSON.stringify(stats)} 不足目标，已按 partial 交付（应说明资料缺口）`));
      }
    }
    if (card.partial?.status === true && !(Array.isArray(card.partial.gaps) && card.partial.gaps.length > 0)) {
      p.push(err('partial=true 时必须列出资料缺口（partial.gaps）'));
    }
  }

  // ---- 人工审核状态 ----
  const hr = card.review?.human_review;
  if (!hr || !['pending', 'approved'].includes(hr.status)) {
    p.push(err('review.human_review.status 必须是 pending 或 approved'));
  } else if (hr.status === 'approved') {
    if (!hr.reviewed_by || !hr.reviewed_on || !hr.scope) {
      p.push(err('approved 需要真人签字：reviewed_by / reviewed_on / scope 均不得为空（机器检查通过不自动升级为 approved）'));
    }
  }

  const errors = problems.filter((x) => x.level === 'error');
  const warnings = problems.filter((x) => x.level === 'warning');
  return { errors, warnings, stats };
}

/** 把校验结果格式化为可读文本 */
export function formatResult(result, label) {
  const lines = [];
  lines.push(`[${label}] errors=${result.errors.length} warnings=${result.warnings.length} stats=${JSON.stringify(result.stats)}`);
  for (const e of result.errors) lines.push(`  ERROR: ${e.message}`);
  for (const w of result.warnings) lines.push(`  WARN : ${w.message}`);
  return lines.join('\n');
}

/** 便捷入口：校验一个卡文件 */
export function validateCardFile(cardPath, repoRoot = process.cwd()) {
  const card = JSON.parse(readFileSync(resolve(cardPath), 'utf8'));
  const ctx = buildCtx(repoRoot);
  return { card, ...validateCard(card, ctx) };
}

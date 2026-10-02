/**
 * RetrievalView v0.1 导出器（离线、确定性）。
 *
 * - RetrievalView 是「决策前」数据：只含通过时间门槛的事实与维度。
 * - 时间门槛每次运行重新计算（interval 完全早于决策 / 同年需 explicit_order / 晚于决策已在校验层拒绝），
 *   结果写入 audit 文件供复核，不使用任何硬编码「已通过」。
 * - 相同输入重复导出产生逐字节一致的输出（无时间戳、稳定排序）；视图不嵌入运行时间。
 * - 只改未来结果/声望（决策后事实文本）不影响已导出视图 —— 由测试保证。
 * - prior_text 仅由通过时间检查的 prior_fact_ids 生成，不拼完整传记。
 */
import {
  SCHEMA_VERSION, DIMENSION_KEYS, TIMECHECK_RULE_VERSION,
} from './contract.mjs';

/** 事实相对某决策节点的准入判定。返回 {verdict: 'eligible'|'excluded', reason} */
export function temporalVerdict(fact, decisionTime, orderedFactIds) {
  if (fact.time_scope === 'timeless') return { verdict: 'eligible', reason: 'timeless' };
  const { start_year: ds, end_year: de } = decisionTime;
  const os = fact.occurred?.start_year ?? null;
  const oe = fact.occurred?.end_year ?? null;

  if (os != null && oe != null && os > de) {
    return { verdict: 'excluded', reason: `fact_after_decision(occurred ${os}–${oe} 晚于决策 ${ds}–${de})` };
  }
  if (oe != null && oe < ds) return { verdict: 'eligible', reason: `interval_before_decision(occurred end ${oe} < decision start ${ds})` };
  if (oe != null && os != null && oe <= de && os <= de) {
    // 与决策同年（或区间覆盖决策年）：需要引用支持的 explicit_order
    if (orderedFactIds.has(fact.fact_id)) return { verdict: 'eligible', reason: 'same_year_with_explicit_order' };
    return { verdict: 'excluded', reason: `same_year_without_explicit_order(occurred ${os}–${oe} 与决策 ${ds}–${de} 同年，顺序无引用支持)` };
  }
  // 区间未知（start 或 end 为 null）：无法证明早于决策，需 explicit_order
  if (orderedFactIds.has(fact.fact_id)) return { verdict: 'eligible', reason: 'unknown_interval_with_explicit_order' };
  return { verdict: 'excluded', reason: `unknown_interval_without_explicit_order(occurred ${JSON.stringify(fact.occurred)} 无法证明早于决策)` };
}

function factSortKey(fact, decisionTime) {
  const oe = fact.occurred?.end_year ?? decisionTime.start_year;
  const os = fact.occurred?.start_year ?? oe;
  const timelessFirst = fact.time_scope === 'timeless' ? 0 : 1;
  return [timelessFirst, oe ?? Number.MAX_SAFE_INTEGER, os ?? Number.MAX_SAFE_INTEGER, fact.fact_id];
}

/** 导出一张卡的全部决策前检索视图 + 时间审计。输入必须已通过 validateCard。 */
export function exportViews(card) {
  const factById = new Map((card.facts ?? []).map((f) => [f.fact_id, f]));
  const snapById = new Map((card.snapshots ?? []).map((s) => [s.snapshot_id, s]));
  const mechByEvent = new Map((card.mechanisms ?? []).map((m) => [m.event_id, m]));
  const reviewStatus = card.review?.human_review?.status === 'approved' ? 'approved' : 'pending';

  const views = [];
  const audit = {
    schema_version: SCHEMA_VERSION,
    artifact_type: 'temporal_check_audit',
    rule_version: TIMECHECK_RULE_VERSION,
    card_id: card.card_id,
    person_id: card.person_id,
    note: '本文件每次导出重新生成，记录可复核的逐事实判定；不作为「已通过」标记，人工仍须复核 explicit_order 条目。',
    checks: {},
  };

  for (const snap of card.snapshots ?? []) {
    if (snap.snapshot_kind !== 'decision') continue;
    const ordered = new Set((snap.prior_order_notes ?? []).map((n) => n.fact_id));
    const eligibleIds = [];
    const excluded = [];
    for (const fid of snap.prior_fact_ids ?? []) {
      const f = factById.get(fid);
      if (!f) continue; // 校验层已报错
      const v = temporalVerdict(f, snap.decision_time, ordered);
      if (v.verdict === 'eligible') eligibleIds.push(fid);
      else excluded.push({ fact_id: fid, reason: v.reason });
    }

    // prior_text：只用通过时间检查的事实，按时间排序拼接
    const eligibleFacts = eligibleIds.map((id) => factById.get(id));
    eligibleFacts.sort((a, b) => {
      const ka = factSortKey(a, snap.decision_time);
      const kb = factSortKey(b, snap.decision_time);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] < kb[i] ? -1 : 1;
      return 0;
    });
    const priorText = eligibleFacts.map((f) => f.text).join('\n');

    // 维度：证据引用过滤到时间合格事实；失去全部支撑且无 modeling_basis 的维度回到 null
    const dimensions = {};
    for (const key of DIMENSION_KEYS) {
      const d = snap.dimensions[key];
      const keptRefs = (d.evidence_refs ?? []).filter((id) => eligibleIds.includes(id));
      const hasModelingBasis = typeof d.modeling_basis === 'string' && d.modeling_basis.length > 0;
      const absenceOk = key === 'new_path_validation' && d.value === 'none';
      if (d.value != null && keptRefs.length === 0 && !hasModelingBasis && !absenceOk) {
        dimensions[key] = {
          value: null, raw_text: null, kind: d.kind, evidence_refs: [], confidence: null, valid_time: null,
          unknown_reason: '时间门槛排除全部支撑事实（导出时重新计算），按未知处理。',
        };
      } else {
        dimensions[key] = { ...d, evidence_refs: keptRefs };
      }
    }

    const evidenceRefs = [...new Set([
      ...eligibleIds,
      ...DIMENSION_KEYS.flatMap((k) => dimensions[k].evidence_refs ?? []),
    ])].sort();

    const coverage = {};
    for (const key of DIMENSION_KEYS) {
      const d = dimensions[key];
      const refs = d.evidence_refs?.length ?? 0;
      coverage[key] = d.value == null
        ? { status: 'unknown', evidence_refs: 0 }
        : refs > 0 ? { status: 'known', evidence_refs: refs } : { status: 'modeling_only', evidence_refs: 0 };
    }

    const mech = mechByEvent.get(snap.event_id);
    views.push({
      schema_version: SCHEMA_VERSION,
      artifact_type: 'retrieval_view',
      view_id: `view-0.1-${card.person_id}-${snap.snapshot_id}`,
      person_id: card.person_id,
      episode_id: snap.episode_id,
      snapshot_id: snap.snapshot_id,
      scenario: (card.events ?? []).find((e) => e.snapshot_id === snap.snapshot_id)?.scenario ?? null,
      decision_time: snap.decision_time,
      prior_fact_ids: eligibleIds,
      prior_text: priorText,
      dimensions,
      root_factors: mech ? mech.root_factors : [],
      mechanism_note: mech ? `archetype=${mech.archetype}（机制层标注，与 choice.type 分开；root_factors 与状态维度分档不互推）` : null,
      institutional_context: snap.institutional_context,
      evidence_refs: evidenceRefs,
      coverage,
      review_status: reviewStatus,
      synthetic: card.synthetic === true,
    });

    audit.checks[snap.snapshot_id] = {
      view_id: `view-0.1-${card.person_id}-${snap.snapshot_id}`,
      episode_id: snap.episode_id,
      decision_time: snap.decision_time,
      eligible: eligibleIds,
      excluded,
      eligible_count: eligibleIds.length,
    };
  }

  return { views, audit };
}

/**
 * Evidence Writer —— 证据分层（#15）。
 *
 * 规则来源：server/RULES-evidence-counter-analogy.md（v1 评审稿 + 验收修订）：
 * - 判定表纯代码映射，零 LLM 调用（零幻觉、零延迟）
 * - self_writing 一律 self_claims（保守，不升格）
 * - biography/encyclopedia/interview 的纯客观陈述 → facts；含解释性措辞 → interpretations（保守降级）
 * - outcomes 全部 → interpretations（数据侧 outcomes 无 source 绑定，宁可保守；待 #13 补 evidence_ref 后再分化）
 * - 每条必须以（来源）结尾：facts/self_claims 用 source_id，其余用字段名 —— 保证「抽查可追溯」可机械执行
 */
import type { DecisionEpisode, Evidence } from '../../src/types/episode.ts';

export type EvidenceLayers = {
  facts: string[];
  self_claims: string[];
  interpretations: string[];
  ai_inferences: string[];
  unknowns: string[];
};

/** 传记/研究类来源里出现这些词，说明是作者的解释而非事件本身 —— 整句降级到 interpretations */
const INTERPRETATION_WORDS = /塑造|反映|证明|导致|奠定|标志|被视为|堪称|被认为|说明|意味着|影响了|奠定了/;

export function writeEvidenceLayers(ep: DecisionEpisode): EvidenceLayers {
  const facts: string[] = [];
  const selfClaims: string[] = [];
  const interpretations: string[] = [];

  for (const ev of ep.evidence) {
    if (ev.type === 'ai_inference') continue; // 永不进 facts（验收第 3 条，单独断言）
    const item = `${ev.claim}（${ev.source_id}）`;
    if (ev.type === 'self_writing') {
      selfClaims.push(item);
      continue;
    }
    if (INTERPRETATION_WORDS.test(ev.claim)) {
      interpretations.push(`${ev.claim}（${ev.source_id}，${sourceLabel(ev)}观点）`);
    } else {
      facts.push(item);
    }
  }

  if (ep.reflection.self_comment) {
    selfClaims.push(`${ep.reflection.self_comment}（reflection.self_comment，本人自述）`);
  }

  // 结果链：数据侧无 per-outcome 来源绑定，全部保守归入「后人归纳」层
  interpretations.push(`${ep.outcomes.short_term}（outcomes.short_term）`);
  interpretations.push(`${ep.outcomes.mid_term}（outcomes.mid_term）`);
  interpretations.push(`${ep.outcomes.long_term}（outcomes.long_term）`);

  return {
    facts,
    self_claims: selfClaims,
    interpretations,
    ai_inferences: [], // 由 counter-analogy 的 era 类条目填入（见 retrieve.ts）
    unknowns: [...(ep.reflection.unknowns ?? [])],
  };
}

function sourceLabel(ev: Evidence): string {
  switch (ev.type) {
    case 'biography': return '传记作者';
    case 'interview': return '访谈整理';
    case 'encyclopedia': return '百科编纂';
    default: return '来源方';
  }
}

/** 验收自查：facts / self_claims 每条都必须带可追溯来源标记 */
export function traceabilityIssues(layers: EvidenceLayers): string[] {
  const issues: string[] = [];
  for (const [layer, items] of [['facts', layers.facts], ['self_claims', layers.self_claims]] as const) {
    for (const item of items) {
      if (!/（[^（）]+）\s*$/.test(item)) issues.push(`${layer} 缺来源标记: ${item}`);
    }
  }
  return issues;
}

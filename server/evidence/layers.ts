/**
 * 证据分层（#15 第一部分）
 * ============================================
 * 依据：server/RULES-evidence-counter-analogy.md 第 1.1 节「判定表」。
 *
 * 核心原则（规则文档 1.3）：
 *   常规映射**纯代码**，不调 LLM —— 保证零幻觉、零延迟成本。
 *   只有 1.2 提到的「biography 里混着事实与解释需要拆句」才调 LLM，
 *   那个场景在 layers-llm.ts 里，本文件保持纯函数。
 *
 * 铁律：**不编造**。某层没有内容就返回空数组，绝不用推测填充。
 */

import type { DecisionEpisode, Evidence } from '../../src/types/episode.ts';

export interface EvidenceLayers {
  facts: string[];
  self_claims: string[];
  interpretations: string[];
  ai_inferences: string[];
  unknowns: string[];
}

/** 来源类型 → 归入层（规则文档 1.1 前四行） */
const SOURCE_LAYER: Record<Evidence['type'], keyof EvidenceLayers> = {
  // 有独立于本人的来源支撑 → 史实
  biography: 'facts',
  encyclopedia: 'facts',
  interview: 'facts',
  // 本人写的，即使内容是客观事件也保留本人视角（保守规则，不升格为 facts）
  self_writing: 'self_claims',
  // 永不进 facts
  ai_inference: 'ai_inferences',
};

/**
 * 给条目附加来源标注。
 *
 * 规则文档 1.1 明确要求：facts / self_claims 条目**必须以 (source_id) 结尾**，
 * 这样验收第 2 条「抽查关键事实能追溯」可以机械执行（正则即可校验）。
 */
function withSource(claim: string, sourceId: string): string {
  const trimmed = claim.trim();
  if (!trimmed) return '';
  // 已经带了标注就不重复加
  if (trimmed.endsWith(`(${sourceId})`)) return trimmed;
  return `${trimmed} (${sourceId})`;
}

/**
 * 判断某一时期的结果是否有证据覆盖。
 *
 * 规则文档 1.1 对 outcomes.short_term 的要求：
 *   「若该案例 evidence 能覆盖该时期则进 facts，否则进 interpretations」。
 *
 * 怎么判断「覆盖」：数据 Schema 里 outcomes 没有 source 绑定（规则文档第四节
 * 第 1 条已指出这个缺口），所以这里用**保守判定** —— 只有当案例至少有 2 条
 * 非 AI 推断来源时，才认为短期结果有独立来源支撑。
 * 宁可进 interpretations，也不把没来源的内容说成史实。
 */
function hasIndependentCoverage(evidence: Evidence[]): boolean {
  return evidence.filter((e) => e.type !== 'ai_inference').length >= 2;
}

/**
 * 从一条 evidence claim 里拆出「事实句」与「解释句」。
 *
 * 规则文档 1.2：biography 的 claim 里混着事实与解释时，
 * 「拆不动就整体进 interpretations」—— 这里是**保守兜底**：
 * 只有能被明确句读切开、且事实句不含评价性词汇时才拆。
 *
 * 真正的 LLM 拆句在 layers-llm.ts；本函数只处理最明显的标点切分。
 */
const EVALUATIVE_WORDS = ['塑造', '推动', '影响', '标志', '体现', '奠定', '伟大', '杰出', '卓越', '悲剧', '遗憾'];

function splitFactAndInterpretation(claim: string): { fact?: string; interpretation?: string } {
  const trimmed = claim.trim();
  if (!trimmed) return {};

  const parts = trimmed.split(/[。；;]/).map((s) => s.trim()).filter(Boolean);

  // 单句：没有评价性词汇就是事实，有就整体进解释层。
  // （早期版本这里无条件返回 interpretation，导致「1906 年退学」这种
  //   纯客观陈述被误判为后人解释 —— 单测抓到了这个 bug。）
  if (parts.length < 2) {
    const evaluative = EVALUATIVE_WORDS.some((w) => trimmed.includes(w));
    return evaluative ? { interpretation: trimmed } : { fact: trimmed };
  }

  const facts: string[] = [];
  const interps: string[] = [];
  for (const p of parts) {
    if (EVALUATIVE_WORDS.some((w) => p.includes(w))) interps.push(p);
    else facts.push(p);
  }

  if (facts.length === 0) return { interpretation: trimmed };
  return {
    fact: facts.join('。'),
    interpretation: interps.length > 0 ? interps.join('。') : undefined,
  };
}

/**
 * 按判定表构建一个案例的证据分层。
 *
 * 纯函数：同样输入必得同样输出，便于单测与缓存。
 */
export function buildEvidenceLayers(episode: DecisionEpisode): EvidenceLayers {
  const layers: EvidenceLayers = {
    facts: [],
    self_claims: [],
    interpretations: [],
    ai_inferences: [],
    unknowns: [],
  };

  const evidence = episode.evidence ?? [];
  const independentlyCovered = hasIndependentCoverage(evidence);

  // ---- 1. evidence[] 逐条归档 ----
  for (const ev of evidence) {
    const target = SOURCE_LAYER[ev.type];
    if (!target) continue; // 未知类型不猜，直接跳过（宁缺勿错）

    // 规则文档 1.2：biography / interview 可能混着事实与解释 → 拆句
    if (target === 'facts') {
      const { fact, interpretation } = splitFactAndInterpretation(ev.claim);
      if (fact) layers.facts.push(withSource(fact, ev.source_id));
      if (interpretation) layers.interpretations.push(withSource(interpretation, ev.source_id));
    } else {
      layers[target].push(withSource(ev.claim, ev.source_id));
    }
  }

  // ---- 2. 本人后来如何评价 → self_claims（规则文档 1.1）----
  const selfComment = episode.reflection?.self_comment?.trim();
  if (selfComment) {
    // self_comment 没有独立 source_id，用字段名标注，保证可追溯
    layers.self_claims.push(`${selfComment} (reflection.self_comment)`);
  }

  // ---- 3. 结果链分层（规则文档 1.1 + 第三节）----
  //   短期：有独立来源覆盖 → facts，否则 interpretations
  //   中长期：一律 interpretations（「进入新文化阵营」「成为奠基人」是后人归纳）
  const outcomeField = (label: string) => `(outcomes.${label})`;
  const short = episode.outcomes?.short_term?.trim();
  if (short) {
    if (independentlyCovered) layers.facts.push(`${short} ${outcomeField('short_term')}`);
    else layers.interpretations.push(`${short} ${outcomeField('short_term')}`);
  }
  const mid = episode.outcomes?.mid_term?.trim();
  if (mid) layers.interpretations.push(`${mid} ${outcomeField('mid_term')}`);
  const long = episode.outcomes?.long_term?.trim();
  if (long) layers.interpretations.push(`${long} ${outcomeField('long_term')}`);

  // ---- 4. 本人明确说不确定的部分 → unknowns（原样透传）----
  const reflectionUnknowns = episode.reflection?.unknowns ?? [];
  for (const u of reflectionUnknowns) {
    const t = u.trim();
    if (t) layers.unknowns.push(`${t} (reflection.unknowns)`);
  }

  // 去重但保持顺序 —— 同一事实可能同时被 biography 与 self_writing 覆盖，
  // 规则文档 1.2 说这种情况 facts 收一条即可
  return {
    facts: dedupe(layers.facts),
    self_claims: dedupe(layers.self_claims),
    interpretations: dedupe(layers.interpretations),
    ai_inferences: dedupe(layers.ai_inferences),
    unknowns: dedupe(layers.unknowns),
  };
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    // 用「去掉来源标注后的正文」判重，避免同一句话因来源不同被收两次
    const key = it.replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/**
 * 自检：facts 与 self_claims 的每一条都必须以 (…) 结尾。
 *
 * 规则文档 1.1 要求这条可机械校验，所以把它做成运行时可调用的函数，
 * 在单测与 API 层都可复用（#17 集成层也能拿去做最终兜底）。
 */
export function assertTraceable(layers: EvidenceLayers): { ok: true } | { ok: false; offenders: string[] } {
  const offenders: string[] = [];
  for (const key of ['facts', 'self_claims'] as const) {
    for (const item of layers[key]) {
      if (!/\([^)]+\)\s*$/.test(item)) offenders.push(`[${key}] ${item}`);
    }
  }
  return offenders.length === 0 ? { ok: true } : { ok: false, offenders };
}

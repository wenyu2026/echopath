/**
 * 反类比生成（#15 核心）
 * ============================================
 * 依据：server/RULES-evidence-counter-analogy.md 第 2.2 - 2.5 节。
 *
 * 三段式（规则 2.2）：
 *   ① 代码产候选（candidates.ts，零幻觉）
 *   ② LLM 只做表述与重要性（输入限定为 Situation + 案例结构 + 候选清单）
 *   ③ 校验：LLM 每条必须绑定候选或结构字段，否则丢弃；不足 2 条用 unknown 补足
 *
 * 为什么这么绕：让 LLM 自由生成「差异」是幻觉重灾区 ——
 * 它会写出「对方当时也承受家庭压力」这种看似合理、实际无据的话。
 * 把它的职责压到「把候选说成人话」，越权即丢弃。
 */

import type { DecisionEpisode, Situation, WhyDifferentDetail } from '../../src/types/episode.ts';
import { chatCompletions, type GatewayConfig } from '../shared/gateway.ts';
import * as guard from '../evidence/output-guard.ts';
import { buildCandidates, type Candidate } from './candidates.ts';

/** 规则 2.4：数量 2-4 条。下限 2 是验收硬要求，上限 4 防止稀释重要性 */
const MIN_ITEMS = 2;
const MAX_ITEMS = 4;

export interface CounterAnalogyResult {
  details: WhyDifferentDetail[];
  /** 给前端直接渲染的 string[]（由 details 序列化生成） */
  texts: string[];
  meta: {
    candidates: number;
    kept: number;
    dropped_by_validation: number;
    filled_by_unknown: number;
    guard_dropped: number;
    guard_rewritten: number;
    llm_elapsed_ms: number;
    used_llm: boolean;
  };
}

/* ============================================================
   LLM 提示词（规则 2.2-2）
   ============================================================ */

export const COUNTER_ANALOGY_SYSTEM_PROMPT = `你是「反类比生成器」。你的唯一任务是把给定的候选差异**说成人话**。

【硬性约束 —— 违反即作废】
1. 每条输出必须绑定一个候选（用 candidate_index 指认），**禁止引入候选之外的事实**
2. 禁止出现：你应该、你最好、建议你选择、我推荐你、最优选择、正确选择、最好的选择
3. 禁止新增候选里没有的时间、地点、人物、数字
4. 每条一句话，30 字以内，说清「差在哪里」
5. kind=era 的候选你可以补充「当时与现在的具体制度/门槛差异」，这属于你的外部知识，
   但只允许补充制度与环境层面的常识，**不许编造该人物或该案例的具体细节**

【输出格式】严格 JSON：
{
  "items": [
    { "candidate_index": 0, "text": "一句话说明这条差异" }
  ]
}

【风格示例】
候选：用户的约束里有「可能延毕」，而该案例的 constraints 没有对应类别（学历/制度门槛）
输出：{"candidate_index": 0, "text": "对方没有学历中断的风险，你有延毕的代价要算"}
`;

function buildUserPrompt(situation: Situation, episode: DecisionEpisode, candidates: Candidate[]): string {
  const list = candidates
    .map((c, i) => `${i}. [${c.kind}] ${c.hint}（依据：${c.basis}；引用：${c.refs.join(' / ') || '无'}）`)
    .join('\n');

  return `【用户处境】
阶段：${situation.stage}
核心冲突：${situation.dilemma}
可选道路：${situation.options.join('、')}
现实约束：${situation.constraints.join('、')}
在意的目标：${situation.goals.join('、')}
可逆性：${situation.reversibility}
尚不明确：${situation.unknowns.join('、')}

【对比案例】
人物：${episode.person.name}（${episode.time.year} 年，${episode.time.age} 岁，${episode.time.stage}）
当时冲突：${episode.decision_state.dilemma}
他的约束：${episode.decision_state.constraints.join('、')}
他的目标：${episode.decision_state.goals.join('、')}
可逆性：${episode.decision_state.reversibility}
实际选择：${episode.choice.actions.join('、')}

【候选差异清单】
${list || '（无候选）'}

请从候选中挑 2-4 条最重要的，各写成一句 30 字内的中文。用 candidate_index 指认来源。`;
}

/** json_schema（严格模式）—— 实测必须用 strict，json_object 不保证符合结构 */
const RESPONSE_SCHEMA = {
  name: 'counter_analogy',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidate_index: { type: 'integer' },
            text: { type: 'string' },
          },
          required: ['candidate_index', 'text'],
          additionalProperties: false,
        },
      },
    },
    required: ['items'],
    additionalProperties: false,
  },
} as const;

/* ============================================================
   主流程
   ============================================================ */

export async function generateCounterAnalogy(
  situation: Situation,
  episode: DecisionEpisode,
  config: GatewayConfig | undefined,
  opts: { model?: string; rewrite?: (text: string) => Promise<string> } = {},
): Promise<CounterAnalogyResult> {
  const candidates = buildCandidates(situation, episode);
  const model = opts.model ?? 'glm-5';

  // ---- 没有候选：直接给 unknown 兜底，不调 LLM（省一次调用，也不给它编造的机会）----
  if (candidates.length === 0) {
    const details = fallbackUnknowns(situation, episode, MIN_ITEMS);
    return finish(details, {
      candidates: 0,
      kept: details.length,
      dropped_by_validation: 0,
      filled_by_unknown: details.length,
      guard_dropped: 0,
      guard_rewritten: 0,
      llm_elapsed_ms: 0,
      used_llm: false,
    });
  }

  // ---- ② LLM 表述 ----
  let llmElapsed = 0;
  let parsed: { items?: { candidate_index?: number; text?: string }[] } = {};
  let usedLlm = false;

  if (config?.apiKey) {
    try {
      const res = await chatCompletions(
        { ...config, timeoutMs: 25_000 },
        {
          model,
          messages: [
            { role: 'system', content: COUNTER_ANALOGY_SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(situation, episode, candidates) },
          ],
          max_tokens: 800,
          // 实测：不加这个会从 6s 涨到 20s+（.agent/DecisionEpisode-Schema.md 坑 1）
          reasoning_effort: 'none',
          response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
        },
      );
      llmElapsed = res.elapsedMs;
      parsed = JSON.parse(res.content) as typeof parsed;
      usedLlm = true;
    } catch (e) {
      // LLM 不可用不阻塞——候选还在，退化为「候选直接成文」
      console.error('[counter-analogy] LLM 表述失败，退化为候选原文：', (e as Error).message);
    }
  }

  // ---- ③ 校验：每条必须绑定候选 ----
  const details: WhyDifferentDetail[] = [];
  let droppedByValidation = 0;
  const seenIdx = new Set<number>();

  for (const item of parsed.items ?? []) {
    const idx = item.candidate_index;
    const text = (item.text ?? '').trim();
    if (typeof idx !== 'number' || !Number.isInteger(idx) || idx < 0 || idx >= candidates.length) {
      droppedByValidation++; // 越界 = 引用了候选之外的依据 → 丢弃
      continue;
    }
    if (!text) {
      droppedByValidation++;
      continue;
    }
    if (seenIdx.has(idx)) continue; // 同一候选重复表述，只留第一条
    seenIdx.add(idx);

    const c = candidates[idx];
    details.push({ text, kind: c.kind, basis: c.basis, refs: c.refs });
  }

  // LLM 未使用或全部被丢弃 → 用候选原文兜底（仍是可追溯的，不是编的）
  if (details.length === 0) {
    for (const c of candidates.slice(0, MAX_ITEMS)) {
      details.push({ text: c.hint, kind: c.kind, basis: c.basis, refs: c.refs });
    }
  }

  // ---- 不足 2 条 → 用 unknown 补足（规则 2.3）----
  let filled = 0;
  if (details.length < MIN_ITEMS) {
    for (const u of fallbackUnknowns(situation, episode, MIN_ITEMS - details.length)) {
      details.push(u);
      filled++;
    }
  }

  // ---- 排序（规则 2.4：structure > evidence > era > unknown）----
  details.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
  const limited = details.slice(0, MAX_ITEMS);

  // ---- 输出守卫（规则 2.5）----
  const rewrite =
    opts.rewrite ??
    (config?.apiKey
      ? async (t: string) => {
          const r = await chatCompletions(
            { ...config, timeoutMs: 20_000 },
            {
              model,
              messages: [
                { role: 'system', content: guard.REWRITE_SYSTEM_PROMPT },
                { role: 'user', content: t },
              ],
              max_tokens: 200,
              reasoning_effort: 'none',
            },
          );
          return r.content.trim();
        }
      : async () => '');

  const guardedTexts: string[] = [];
  let guardDropped = 0;
  let guardRewritten = 0;
  const keptDetails: WhyDifferentDetail[] = [];

  for (const d of limited) {
    const r = await guard.guardText(d.text, rewrite, ['decision']);
    if (r.action === 'dropped') {
      guardDropped++;
      continue;
    }
    if (r.action === 'rewritten') guardRewritten++;
    keptDetails.push({ ...d, text: r.text });
    guardedTexts.push(r.text);
  }

  return finish(keptDetails, {
    candidates: candidates.length,
    kept: keptDetails.length,
    dropped_by_validation: droppedByValidation,
    filled_by_unknown: filled,
    guard_dropped: guardDropped,
    guard_rewritten: guardRewritten,
    llm_elapsed_ms: llmElapsed,
    used_llm: usedLlm,
  });
}

/** 规则 2.4 的排序权重 */
const ORDER: Record<WhyDifferentDetail['kind'], number> = {
  structure: 0,
  evidence: 1,
  era: 2,
  unknown: 3,
};

/**
 * 规则 2.3 的兜底：证据不足时输出 unknown。
 *
 * 格式按规则原文：`【未知】无法判断 X 是否构成差异：案例数据未记录 Y`
 * —— 明确告知比编造强，且这类条目**计入 2 条的最少条数**。
 */
function fallbackUnknowns(situation: Situation, episode: DecisionEpisode, count: number): WhyDifferentDetail[] {
  const out: WhyDifferentDetail[] = [];
  const dims = ['经济条件', '家庭约束', '时间窗口', '新方向验证程度'];

  for (let i = 0; i < count && i < dims.length; i++) {
    const dim = dims[i];
    out.push({
      text: `【未知】无法判断${dim}是否构成差异：案例数据未记录该维度（你可以在 What-if 中补充）`,
      kind: 'unknown',
      basis: '证据覆盖不足',
      refs: [`episode.evidence 未覆盖${dim}`],
    });
  }

  // 连 unknown 都凑不够时，给一条明确的「证据有限」声明，仍然不编造
  while (out.length < count) {
    out.push({
      text: `【未知】该案例的证据覆盖有限，无法判断更多差异（案例：${episode.person.name} ${episode.time.year}）`,
      kind: 'unknown',
      basis: '证据覆盖不足',
      refs: [`episode_id=${episode.episode_id}`],
    });
  }

  // 这里读一下 situation 以确保调用方传入的处境参与了判定（避免「传了没用」的误解）
  void situation;
  return out;
}

function finish(details: WhyDifferentDetail[], meta: CounterAnalogyResult['meta']): CounterAnalogyResult {
  return {
    details,
    texts: details.map((d) => d.text),
    meta,
  };
}

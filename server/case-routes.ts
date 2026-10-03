/**
 * 案例详情 API
 * ============================================
 *   POST /api/case   取一个案例的完整轨迹 + 证据分层 + 反类比
 *
 * 为什么单独一条路由而不是复用 /api/episodes/:id
 *   那条是老端点，返回的是旧结构（依赖 #15 填充，当前返回空壳）。
 *   新端点要把**四块内容**拼齐：
 *     ① 轨迹   —— 他是怎么走到这个路口的
 *     ② 时间边界 —— 当时知道什么 / 后来发生了什么（分开！）
 *     ③ 证据   —— 事实 / 本人回忆 / 模型推断 / 未知争议
 *     ④ 反类比 —— 为什么你不能照搬
 *
 * ⚠️ ② 是最重要的一块，也是最容易被做错的：
 *   不能因为某人后来成功了，就假装他当时「知道这会成功」。
 *   这在他的数据里叫 Temporal Information Boundary。
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { getSourceWithMechanisms } from './retrieval/data-source.ts';
import { writeEvidenceLayers } from './evidence/evidence-writer.ts';
import { buildCounterAnalogy, guardViolations } from './counter-analogy/counter-analogy.ts';
import { sendJson } from './landscape-routes.ts';
import { loadSourceMeta } from './retrieval/load-episodes.ts';
import type { Situation } from '../src/types/episode.ts';

async function readJson(req: IncomingMessage, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > maxBytes) throw new Error(`请求体过大（上限 ${maxBytes} 字节）`);
    chunks.push(c as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text.trim() ? (JSON.parse(text) as Record<string, unknown>) : {};
}

/**
 * 把用户的 SituationV2 转成反类比引擎要的 Situation（v1）。
 *
 * ⚠️ 反类比引擎（counter-analogy.ts）是老模块，签名收的是 v1 的 Situation。
 *   这里做一个适配，不去改它 —— 改了会影响现有六页。
 */
function toSituationV1(s2: {
  stage: string;
  options: string[];
  constraints: string[];
  goals: string[];
  risk?: string;
  reversibility?: string;
}): Situation {
  const lv = (v: string | undefined, dflt: 'low' | 'medium' | 'high') =>
    v === 'low' || v === 'medium' || v === 'high' ? v : dflt;

  return {
    stage: s2.stage,
    // v1 要求 dilemma 是 "A vs B"；v2 是多选项，取前两条拼
    dilemma: s2.options.slice(0, 2).join(' vs ') || '未说明',
    options: s2.options,
    constraints: s2.constraints,
    goals: s2.goals,
    risk: lv(s2.risk, 'medium'),
    reversibility: lv(s2.reversibility, 'medium'),
    unknowns: [],
  };
}

export async function handleCaseRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method !== 'POST' || url.pathname !== '/api/case') return false;

  let body: Record<string, unknown>;
  try {
    body = await readJson(req);
  } catch (e) {
    sendJson(res, 400, { error: { code: 'BAD_BODY', message: (e as Error).message } });
    return true;
  }

  const episodeId = typeof body.episode_id === 'string' ? body.episode_id : '';
  const sourceId = typeof body.source_id === 'string' ? body.source_id : undefined;
  if (!episodeId) {
    sendJson(res, 422, { error: { code: 'MISSING_ID', message: '缺少 episode_id' } });
    return true;
  }

  try {
    const source = await getSourceWithMechanisms(sourceId);
    const ep = source.episodes.find((e) => e.episode_id === episodeId);
    if (!ep) {
      sendJson(res, 404, {
        error: { code: 'NOT_FOUND', message: `在「${source.info.label}」里找不到案例 ${episodeId}` },
      });
      return true;
    }

    // ① 证据分层
    const layers = writeEvidenceLayers(ep);

    // ② 反类比（为什么不能照搬）
    const sitV1 = toSituationV1({
      stage: typeof body.stage === 'string' ? body.stage : '未说明',
      options: Array.isArray(body.options) ? body.options.map(String) : [],
      constraints: Array.isArray(body.constraints) ? body.constraints.map(String) : [],
      goals: Array.isArray(body.goals) ? body.goals.map(String) : [],
      risk: typeof body.risk === 'string' ? body.risk : undefined,
      reversibility: typeof body.reversibility === 'string' ? body.reversibility : undefined,
    });
    const ca = buildCounterAnalogy(sitV1, ep);

    // ⚠️ 口径铁律：反类比里绝不能出现"你应该…"这类处方
    const violations = guardViolations(ca.items.map((i) => i.text));
    if (violations.length > 0) {
      console.error('[case] ⚠️ 反类比违反口径铁律:', violations.join('; '));
    }

    // ③ 来源元信息（谁出的、定位在哪、什么局限）
    const sourceMeta = loadSourceMeta();
    const evidenceWithMeta = (ep.evidence ?? []).map((e) => ({
      ...e,
      meta: sourceMeta[e.source_id] ?? null,
    }));

    sendJson(res, 200, {
      data_source: source.info,
      episode: {
        episode_id: ep.episode_id,
        person: ep.person,
        time: ep.time,
        /** 他是怎么走到这个路口的 */
        prior_path: ep.prior_path,
        /** 当时面对什么 */
        decision_state: ep.decision_state,
        /** 实际做了什么 */
        choice: ep.choice,
        /** 后来发生了什么 —— 与"当时知道什么"严格分开 */
        outcomes: ep.outcomes,
        reflection: ep.reflection,
        /**
         * 他这条案例的因素标注（离线标注，原样透传）。
         * 前端用它逐人回答「为什么推荐他 / 你和他像在哪」——
         * ⚠️ 透传，不是分析：任何匹配/聚类逻辑都不在这里发生。
         */
        mechanism: ep.mechanism ?? null,
      },
      /**
       * ⚠️ 时间边界声明。
       *   这一栏存在的意义：提醒用户「他做决定时并不知道结果」。
       *   不做这个区分，产品就会退化成成功学故事会。
       */
      temporal_boundary: {
        known_at_time: ep.decision_state.constraints,
        decided: ep.choice.actions,
        happened_after: [ep.outcomes.short_term, ep.outcomes.mid_term, ep.outcomes.long_term].filter(Boolean),
        note: '结果发生在决定之后。现有材料不足以证明「因为选了这个所以有了那个结果」。',
      },
      evidence_layers: layers,
      evidence_detail: evidenceWithMeta,
      why_different: ca.items,
      guard_violations: violations,
    });
  } catch (e) {
    console.error('[case] ❌', (e as Error).message);
    sendJson(res, 500, { error: { code: 'CASE_FAILED', message: (e as Error).message } });
  }
  return true;
}

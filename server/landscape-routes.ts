/**
 * 决策地形 v2 的 API 路由
 * ============================================
 * ⚠️ 为什么单独一个文件而不是加进 server/api.ts
 *   api.ts 是 Damn4lee 的责任区，现有六页在用。
 *   按 AGENTS.md 应该先发 CHANGE_REQUEST；但更简单的做法是
 *   **把新路由做成独立模块**，api.ts 只需一行转发。
 *   这样：零冲突、零等待，而且 api.ts 的 diff 只有 2 行。
 *
 * 路由：
 *   GET  /api/sources            列出可用数据源（前端开关用）
 *   POST /api/landscape          生成决策地形
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { getSourceWithMechanisms, listSources } from './retrieval/data-source.ts';
import { buildLandscape, normalizeRootFactors } from './retrieval/landscape-v2.ts';
import type { SituationV2 } from '../src/types/landscape.ts';
import { handleInterviewRoutes } from './interview/interview-routes.ts';
import { handleCaseRoutes } from './case-routes.ts';

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJsonBody(req: IncomingMessage, maxBytes = 64 * 1024): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > maxBytes) throw new Error(`请求体过大（上限 ${maxBytes} 字节）`);
    chunks.push(c as Buffer);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

/**
 * 校验用户输入的 SituationV2。
 *
 * ⚠️ 用**宽松**校验：v2 的输入可能来自
 *   ① 访谈页（完整）
 *   ② 用户在 P2 手工改过的处境（可能删到只剩 1 条）
 *   所以只检查「缺了会崩」的字段，不强制条数。
 */
function validateSituationV2(raw: unknown): SituationV2 {
  if (!raw || typeof raw !== 'object') throw new Error('缺少 situation');
  const s = raw as Record<string, unknown>;

  const stage = String(s.stage ?? '').trim();
  if (!stage) throw new Error('situation.stage 不能为空');

  const options = Array.isArray(s.options) ? s.options.map(String).filter(Boolean) : [];
  if (options.length === 0) throw new Error('situation.options 至少要有 1 条');

  const asStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.map(String).filter((x) => x.trim().length > 0) : [];

  const roots = normalizeRootFactors(asStrings(s.root_factors));

  const risk = ['low', 'medium', 'high'].includes(String(s.risk)) ? (s.risk as SituationV2['risk']) : 'medium';
  const rev = ['low', 'medium', 'high'].includes(String(s.reversibility))
    ? (s.reversibility as SituationV2['reversibility'])
    : 'medium';

  return {
    stage: stage.slice(0, 40),
    options,
    // ⚠️ 根因素为空是**允许**的（用户可以什么都不选），
    //    引擎会退化成「没有结构信号」，但不会崩。
    root_factors: roots,
    constraints: asStrings(s.constraints),
    goals: asStrings(s.goals),
    risk,
    reversibility: rev,
    unknowns: asStrings(s.unknowns),
  };
}

/**
 * 处理 /api/sources 与 /api/landscape。
 * 返回 true 表示已处理（调用方不用再往下走）。
 */
export async function handleLandscapeRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  apiKey = '',
): Promise<boolean> {
  // 访谈相关路由（独立文件，见 server/interview/interview-routes.ts）
  if (await handleInterviewRoutes(req, res, url, apiKey)) return true;

  // 案例详情（见 server/case-routes.ts）
  if (await handleCaseRoutes(req, res, url)) return true;

  // ---- 列出数据源 ----
  if (req.method === 'GET' && url.pathname === '/api/sources') {
    sendJson(res, 200, { sources: listSources() });
    return true;
  }

  // ---- 生成决策地形 ----
  if (req.method === 'POST' && url.pathname === '/api/landscape') {
    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      sendJson(res, 400, { error: { code: 'BAD_BODY', message: (e as Error).message } });
      return true;
    }

    let situation: SituationV2;
    try {
      situation = validateSituationV2(body.situation);
    } catch (e) {
      sendJson(res, 422, { error: { code: 'INVALID_SITUATION', message: (e as Error).message } });
      return true;
    }

    const sourceId = typeof body.source_id === 'string' ? body.source_id : undefined;
    const userQuote = typeof body.user_quote === 'string' ? body.user_quote : undefined;

    /**
     * ⚠️ 根因素为空时，用 LLM 从自然语言里推。
     *
     *   对话式访谈采到的是自然语言（「家人希望稳定就业，不支持折腾」），
     *   不是封闭词表的根因素 —— 前端传过来时 root_factors 是空的。
     *
     *   不补这一步的后果：根因素为空 → 聚类失去结构信号 →
     *   「AI 对你的理解」那一栏也是空的。
     *   （实测踩过：对话走完全程，结果页根因素区是空的。）
     */
    if (situation.root_factors.length === 0 && apiKey) {
      const parts = [
        situation.stage ? `阶段：${situation.stage}` : '',
        situation.options.length ? `岔路：${situation.options.join('、')}` : '',
        situation.constraints.length ? `约束：${situation.constraints.join('、')}` : '',
        situation.goals.length ? `目标：${situation.goals.join('、')}` : '',
        situation.unknowns.length ? `他在意的：${situation.unknowns.join('、')}` : '',
      ].filter(Boolean);

      if (parts.length > 0) {
        try {
          const { inferRootFactors } = await import('./interview/interview.ts');
          const r = await inferRootFactors(
            { apiKey },
            {
              turns: [],
              collected: { profile_text: parts.join('\n') },
              confidence: { profile_text: 1 },
              asked: [],
            },
          );
          const normalized = normalizeRootFactors(r.root_factors);
          if (normalized.length > 0) {
            situation = { ...situation, root_factors: normalized };
          }
        } catch (e) {
          // 推不出来**不能让它崩** —— 根因素为空引擎仍能跑（只是没有结构信号）
          console.error('[landscape] ⚠️ 根因素推断失败，降级为空:', (e as Error).message);
        }
      }
    }

    try {
      const t0 = Date.now();
      const source = await getSourceWithMechanisms(sourceId);
      const loadMs = Date.now() - t0;

      const result = buildLandscape({ situation, user_quote: userQuote }, source);

      sendJson(res, 200, {
        ...result,
        meta: { ...result.meta, load_ms: loadMs, total_ms: Date.now() - t0 },
      });
    } catch (e) {
      console.error('[landscape] ❌', (e as Error).message);
      sendJson(res, 500, { error: { code: 'LANDSCAPE_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  return false;
}

/**
 * 访谈 API 路由
 * ============================================
 *   POST /api/interview/start   开始一次访谈，返回第一个问题
 *   POST /api/interview/answer  提交回答，返回：抽取到的东西 + 下一个问题（或该总结了）
 *   POST /api/interview/finish  结束访谈，返回总结
 *
 * ⚠️ 无状态设计：整个 InterviewState 由前端持有并每次带回来。
 *   理由：① 后端不用建会话存储（Demo 不需要）② 用户刷新页面能续上
 *        ③ 便于调试（请求里能直接看到状态）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  askNextQuestion,
  extractFromAnswer,
  newInterviewState,
  shouldStop,
  summarize,
  type InterviewState,
} from '../interview/interview.ts';
// ⚠️ INTERVIEW_CONFIG 在前后端共用的规格文件里，不在 interview.ts
import { INTERVIEW_CONFIG } from '../../src/types/interview.ts';
import { sendJson } from '../landscape-routes.ts';

async function readJson(req: IncomingMessage, maxBytes = 128 * 1024): Promise<Record<string, unknown>> {
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

/** 从请求体里取出访谈状态（做基本校验，防止前端传坏数据） */
function readState(body: Record<string, unknown>): InterviewState {
  const raw = body.state as Partial<InterviewState> | undefined;
  if (!raw || typeof raw !== 'object') return newInterviewState();
  return {
    turns: Array.isArray(raw.turns) ? raw.turns : [],
    collected: (raw.collected && typeof raw.collected === 'object' ? raw.collected : {}) as Record<string, string>,
    confidence: (raw.confidence && typeof raw.confidence === 'object' ? raw.confidence : {}) as Record<string, number>,
    asked: Array.isArray(raw.asked) ? raw.asked : [],
  };
}

export async function handleInterviewRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  apiKey: string,
): Promise<boolean> {
  /* ---------------- 开始 ---------------- */
  if (req.method === 'POST' && url.pathname === '/api/interview/start') {
    if (!apiKey) {
      sendJson(res, 500, { error: { code: 'NO_KEY', message: '未配置 TOKENDANCE_API_KEY' } });
      return true;
    }
    const state = newInterviewState();
    try {
      const first = await askNextQuestion({ apiKey }, state);
      if (!first) {
        sendJson(res, 500, { error: { code: 'NO_QUESTION', message: '生成不出第一个问题' } });
        return true;
      }
      state.turns.push({ role: 'ai', text: first.question });
      state.asked.push(first.field);

      sendJson(res, 200, {
        state,
        message: first.question,
        asked_field: first.field,
        progress: { asked: state.asked.length, max: INTERVIEW_CONFIG.max_questions },
      });
    } catch (e) {
      console.error('[interview/start] ❌', (e as Error).message);
      sendJson(res, 502, { error: { code: 'LLM_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  /* ---------------- 回答 ---------------- */
  if (req.method === 'POST' && url.pathname === '/api/interview/answer') {
    if (!apiKey) {
      sendJson(res, 500, { error: { code: 'NO_KEY', message: '未配置 TOKENDANCE_API_KEY' } });
      return true;
    }
    let body: Record<string, unknown>;
    try {
      body = await readJson(req);
    } catch (e) {
      sendJson(res, 400, { error: { code: 'BAD_BODY', message: (e as Error).message } });
      return true;
    }

    const state = readState(body);
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
    if (!answer) {
      sendJson(res, 422, { error: { code: 'EMPTY_ANSWER', message: '回答不能为空' } });
      return true;
    }
    const askedField = typeof body.asked_field === 'string' ? body.asked_field : '';

    state.turns.push({ role: 'user', text: answer });

    try {
      // 1. 抽取
      const extracted = await extractFromAnswer({ apiKey }, state, answer, askedField);
      for (const u of extracted.updates) {
        // 只在新置信度更高时覆盖（避免后面模糊的话把前面明确的覆盖掉）
        const prev = state.confidence[u.field] ?? 0;
        if (u.confidence >= prev) {
          state.collected[u.field] = u.value;
          state.confidence[u.field] = u.confidence;
        }
      }

      // 2. 判断要不要停
      const decision = shouldStop(state);

      // 3. 若继续，问下一个
      let nextMessage: string | null = null;
      let nextField: string | null = null;
      if (!decision.stop) {
        const q = await askNextQuestion({ apiKey }, state);
        if (q) {
          nextMessage = q.question;
          nextField = q.field;
          state.asked.push(q.field);
          state.turns.push({ role: 'ai', text: q.question });
        }
      }

      sendJson(res, 200, {
        state,
        extracted: {
          updates: extracted.updates,
          memorable_quote: extracted.memorable_quote,
        },
        message: nextMessage,
        asked_field: nextField,
        done: nextMessage === null,
        stop_reason: decision.reason,
        progress: { asked: state.asked.length, max: INTERVIEW_CONFIG.max_questions },
      });
    } catch (e) {
      console.error('[interview/answer] ❌', (e as Error).message);
      sendJson(res, 502, { error: { code: 'LLM_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  /* ---------------- 结束并总结 ---------------- */
  if (req.method === 'POST' && url.pathname === '/api/interview/finish') {
    if (!apiKey) {
      sendJson(res, 500, { error: { code: 'NO_KEY', message: '未配置 TOKENDANCE_API_KEY' } });
      return true;
    }
    let body: Record<string, unknown>;
    try {
      body = await readJson(req);
    } catch (e) {
      sendJson(res, 400, { error: { code: 'BAD_BODY', message: (e as Error).message } });
      return true;
    }

    const state = readState(body);
    if (Object.keys(state.collected).length === 0) {
      sendJson(res, 422, { error: { code: 'NOTHING_COLLECTED', message: '还没有收集到任何信息' } });
      return true;
    }

    try {
      const result = await summarize({ apiKey }, state);
      sendJson(res, 200, { state, summary: result.summary, elapsed_ms: result.elapsedMs });
    } catch (e) {
      console.error('[interview/finish] ❌', (e as Error).message);
      sendJson(res, 502, { error: { code: 'LLM_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  return false;
}

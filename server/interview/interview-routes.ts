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
  generateHints,
  newInterviewState,
  planNextTurn,
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
    // ⚠️ progressMarks 必须带回来 —— 它跨请求累计，丢了就判断不出「原地打转」
    progressMarks: Array.isArray(raw.progressMarks) ? raw.progressMarks : [],
    // ⚠️ 追问线程 / 救援计数 / 跳过清单同理 —— 丢了的话「不要反复追问」会失效，
    //    用户每轮都会被重复救援同一个字段
    probeThread: (raw.probeThread && typeof raw.probeThread === 'object')
      ? (raw.probeThread as InterviewState['probeThread'])
      : null,
    rescued: (raw.rescued && typeof raw.rescued === 'object' ? raw.rescued : {}) as Record<string, number>,
    skipped: Array.isArray(raw.skipped) ? raw.skipped : [],
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
        // ⚠️ 不报「上限」—— 没有轮次上限，只有「信息够不够」（见 shouldStop）
        progress: { asked: state.asked.length, fields: Object.keys(state.collected).length },
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
      // 1. 抽取（含对话信号：concrete_event / stuck / skip_request / correction / hints）
      const extracted = await extractFromAnswer({ apiKey }, state, answer, askedField);
      for (const u of extracted.updates) {
        // 只在新置信度更高时覆盖（避免后面模糊的话把前面明确的覆盖掉）
        // ⚠️ 纠正（correction）也走这条路：纠正表述的置信度按提示词要求给 0.9+，自然覆盖旧值
        const prev = state.confidence[u.field] ?? 0;
        if (u.confidence >= prev) {
          state.collected[u.field] = u.value;
          state.confidence[u.field] = u.confidence;
        }
      }

      // 2. 规划下一轮（追问线程触发/推进/释放、救援、跳过 —— 会更新 state）
      //    ⚠️ 必须在停机判断**之前**：线程的触发与释放要反映进 shouldStop，
      //    否则"信息够了"会在追问线程刚要启动时把对话截停（经验 1 / 2 的程序级保障）
      const plan = planNextTurn(state, extracted.signals, askedField);

      // 3. 判断要不要停
      const decision = shouldStop(state);

      // 4. 若继续，按计划问下一个
      let nextMessage: string | null = null;
      let nextField: string | null = null;
      let mode = 'normal';
      let hints: string[] = [];
      if (!decision.stop) {
        const q = await askNextQuestion({ apiKey }, state, plan);
        if (q) {
          nextMessage = q.question;
          nextField = q.field;
          mode = q.mode;
          hints = q.hints;
          state.asked.push(q.field);
          state.turns.push({ role: 'ai', text: q.question });
        }
      }

      sendJson(res, 200, {
        state,
        extracted: {
          updates: extracted.updates,
          memorable_quote: extracted.memorable_quote,
          /** 对话信号原样透出 —— 调试台能看到"为什么这一步决定追问/跳过" */
          signals: extracted.signals,
        },
        message: nextMessage,
        asked_field: nextField,
        done: nextMessage === null,
        stop_reason: decision.reason,
        /** normal / probe_event / probe_impact / rescue —— 调试台和前端提示条用 */
        mode,
        /** 回忆入口（可能为空）。前端只拿它做"帮你回忆"的可点击提示，不自动提交 */
        hints,
        // ⚠️ 不报「上限」—— 没有轮次上限，只有「信息够不够」（见 shouldStop）
        progress: { asked: state.asked.length, fields: Object.keys(state.collected).length },
      });
    } catch (e) {
      console.error('[interview/answer] ❌', (e as Error).message);
      sendJson(res, 502, { error: { code: 'LLM_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  /* ---------------- 「帮我回忆」—— 动态回忆入口（不算一轮访谈回答） ---------------- */
  if (req.method === 'POST' && url.pathname === '/api/interview/hints') {
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
    const askedField = typeof body.asked_field === 'string' ? body.asked_field : '';
    const previousHints = Array.isArray(body.previous_hints)
      ? body.previous_hints.map(String).slice(0, 6)
      : [];
    try {
      const r = await generateHints({ apiKey }, state, askedField, previousHints);
      // ⚠️ 刻意不回传 state —— 生成提示**不能**改动访谈状态，更不能计为一轮回答
      sendJson(res, 200, { hints: r.hints, elapsed_ms: r.elapsedMs });
    } catch (e) {
      console.error('[interview/hints] ❌', (e as Error).message);
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
      sendJson(res, 200, {
        state,
        summary: result.summary,
        // ⚠️ 前端靠这个决定「去不去检索」—— 无迷茫时不找人
        no_dilemma: result.no_dilemma,
        elapsed_ms: result.elapsedMs,
      });
    } catch (e) {
      console.error('[interview/finish] ❌', (e as Error).message);
      sendJson(res, 502, { error: { code: 'LLM_FAILED', message: (e as Error).message } });
    }
    return true;
  }

  return false;
}

/**
 * 对话式访谈的状态
 * ============================================
 * ⚠️ 状态由**前端持有**，每次请求带回去。
 *   后端是无状态的 —— 这样刷新页面能续上，也便于调试。
 *
 * 流程：
 *   start →  ask（第一个问题）
 *   loop →  answer（提交回答）→ 抽到东西 + 下一个问题
 *   stop →  finish（总结）
 *   then →  landscape（拿总结去检索）
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LandscapeResponse, SituationV2 } from '../types/landscape';

const SESSION_KEY = 'echopath.chat.v1';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  /** AI 消息附带：这一轮在问什么方向 */
  field?: string;
  /** 这一轮抽到了什么（用于右侧面板高亮） */
  extracted?: Array<{ field: string; value: string; confidence: number }>;
  /** 记下的用户原话 */
  quote?: string;
}

export interface InterviewStateWire {
  turns: Array<{ role: 'ai' | 'user'; text: string }>;
  collected: Record<string, string>;
  confidence: Record<string, number>;
  asked: string[];
}

export interface ChatPhase {
  kind: 'idle' | 'asking' | 'confirming' | 'searching' | 'done' | 'error';
  error?: string;
}

let seq = 0;
const uid = () => `m${++seq}`;

export function useChatInterview() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<InterviewStateWire | null>(null);
  const [askedField, setAskedField] = useState<string>('');
  const [phase, setPhase] = useState<ChatPhase>({ kind: 'idle' });
  const [summary, setSummary] = useState<string>('');
  const [landscape, setLandscape] = useState<LandscapeResponse | null>(null);
  const [progress, setProgress] = useState({ asked: 0, max: 8 });

  /** 最后一次真正说过的话（原话），用于把「代价」挂到它上面 */
  const bestQuote = useRef<string>('');
  const booted = useRef(false);

  const postJson = useCallback(async <T,>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* 保持空对象 */
    }
    if (!res.ok) {
      const j = json as { error?: { message?: string } };
      throw new Error(j.error?.message ?? `HTTP ${res.status}`);
    }
    return json as T;
  }, []);

  /* ---------------- 开始 ---------------- */
  const start = useCallback(async () => {
    setPhase({ kind: 'asking' });
    setMessages([]);
    setSummary('');
    setLandscape(null);
    bestQuote.current = '';
    try {
      const r = await postJson<{
        state: InterviewStateWire;
        message: string;
        asked_field: string;
        progress: { asked: number; max: number };
      }>('/api/interview/start', {});
      setState(r.state);
      setAskedField(r.asked_field);
      setProgress(r.progress);
      setMessages([{ id: uid(), role: 'ai', text: r.message, field: r.asked_field }]);
      setPhase({ kind: 'idle' });
    } catch (e) {
      setPhase({ kind: 'error', error: (e as Error).message });
    }
  }, [postJson]);

  /* ---------------- 提交回答 ---------------- */
  const answer = useCallback(
    async (text: string) => {
      if (!state || !text.trim()) return;
      setMessages((m) => [...m, { id: uid(), role: 'user', text }]);
      setPhase({ kind: 'asking' });

      try {
        const r = await postJson<{
          state: InterviewStateWire;
          extracted: { updates: Array<{ field: string; value: string; confidence: number }>; memorable_quote: string };
          message: string | null;
          asked_field: string | null;
          done: boolean;
          stop_reason: string;
          progress: { asked: number; max: number };
        }>('/api/interview/answer', { state, answer: text, asked_field: askedField });

        setState(r.state);
        setProgress(r.progress);

        // 记住最好的一句原话（有新的就替换）
        if (r.extracted.memorable_quote) bestQuote.current = r.extracted.memorable_quote;

        // 给刚才那条用户消息补上「抽到了什么」
        setMessages((m) => {
          const copy = [...m];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === 'user') {
              copy[i] = {
                ...copy[i],
                extracted: r.extracted.updates,
                quote: r.extracted.memorable_quote || undefined,
              };
              break;
            }
          }
          // 追加 AI 的下一个问题
          if (r.message) {
            copy.push({ id: uid(), role: 'ai', text: r.message, field: r.asked_field ?? undefined });
          }
          return copy;
        });

        if (r.asked_field) setAskedField(r.asked_field);

        // 问完了 → 自动进总结
        if (r.done) {
          await doFinish(r.state);
        } else {
          setPhase({ kind: 'idle' });
        }
      } catch (e) {
        setPhase({ kind: 'error', error: (e as Error).message });
      }
    },
    // doFinish 在下面定义，用 ref 避免循环依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, askedField, postJson],
  );

  /* ---------------- 总结 ---------------- */
  const doFinish = useCallback(
    async (s: InterviewStateWire) => {
      setPhase({ kind: 'confirming' });
      try {
        const r = await postJson<{ summary: string; state: InterviewStateWire }>('/api/interview/finish', {
          state: s,
        });
        setSummary(r.summary);
        setState(r.state);
        setMessages((m) => [...m, { id: uid(), role: 'ai', text: r.summary, field: 'summary' }]);
        setPhase({ kind: 'confirming' });
      } catch (e) {
        setPhase({ kind: 'error', error: (e as Error).message });
      }
    },
    [postJson],
  );

  /* ---------------- 去检索 ---------------- */
  const search = useCallback(
    async (sourceId: string) => {
      if (!state) return;
      setPhase({ kind: 'searching' });

      // 把访谈采到的字段拼成 SituationV2
      const c = state.collected;
      const splitList = (v: string | undefined): string[] =>
        (v ?? '')
          .split(/[，,、；;/]/)
          .map((x) => x.trim())
          .filter((x) => x.length > 0 && x.length < 40);

      const situation: SituationV2 = {
        stage: c.stage ?? '未说明',
        options: splitList(c.dilemma).length > 0 ? splitList(c.dilemma) : ['继续现在这条路', '换一条路'],
        // ⚠️ 根因素由后端从 constraints/goals/fear 推 —— 这里先留空，
        //    后端 landscape 路由会做 normalize（空数组不会崩）
        root_factors: [],
        constraints: [...splitList(c.constraints), ...splitList(c.prior_path)],
        goals: [...splitList(c.goals), ...splitList(c.validation)],
        risk: 'medium',
        reversibility: (c.reversibility_attitude ?? '').includes('接受')
          ? 'high'
          : (c.reversibility_attitude ?? '').includes('不')
            ? 'low'
            : 'medium',
        unknowns: c.fear ? [`最怕：${c.fear}`] : [],
      };

      try {
        const r = await postJson<LandscapeResponse>('/api/landscape', {
          situation,
          user_quote: bestQuote.current,
          source_id: sourceId,
        });
        setLandscape(r);
        setPhase({ kind: 'done' });
      } catch (e) {
        setPhase({ kind: 'error', error: (e as Error).message });
      }
    },
    [state, postJson],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setState(null);
    setSummary('');
    setLandscape(null);
    setAskedField('');
    setPhase({ kind: 'idle' });
    bestQuote.current = '';
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* 忽略 */
    }
  }, []);

  /** 用户中途喊停：直接去总结 */
  const finishNow = useCallback(async () => {
    if (!state) return;
    if (bestQuote.current === '') bestQuote.current = '';
    await doFinish(state);
  }, [state, doFinish]);

  // 自动开场（只在挂载时一次）
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void start();
  }, [start]);

  return {
    messages,
    state,
    phase,
    summary,
    landscape,
    progress,
    /** 用户说过的、最能体现他在意什么的那句话 */
    bestQuote: bestQuote.current,
    answer,
    finishNow,
    search,
    reset,
    start,
  };
}

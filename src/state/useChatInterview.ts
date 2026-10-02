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
  /**
   * ⚠️ 这一轮之前的状态快照 —— 「改这句」要用。
   *
   *   实测反馈：「我回答问题的时候回答错误的话，没办法回退到上一个对话，只能重开」。
   *   聊了 10 轮，一句打错就全废，这不能接受。
   *
   *   所以每条用户消息都存下**它发出前**的完整 state，
   *   点「改这句」就回滚到这个快照，然后按新内容重走一遍。
   */
  stateBefore?: InterviewStateWire;
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
  /** 后端判断出「当前没有面临选择」—— UI 据此不显示「去找人」按钮 */
  const [noDilemma, setNoDilemma] = useState(false);
  const [landscape, setLandscape] = useState<LandscapeResponse | null>(null);
  // ⚠️ 不显示「上限」—— 没有轮次上限，只有「信息够不够」
  const [progress, setProgress] = useState({ asked: 0, fields: 0 });

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
        progress: { asked: number; fields: number };
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
    async (text: string, overrideState?: InterviewStateWire) => {
      const base = overrideState ?? state;
      if (!base || !text.trim()) return;

      // ⚠️ 存下「这条回答发出前」的 state —— 「改这句」要回滚到这里
      const snapshotBefore: InterviewStateWire = JSON.parse(JSON.stringify(base));

      setMessages((m) => [...m, { id: uid(), role: 'user', text, stateBefore: snapshotBefore }]);
      setPhase({ kind: 'asking' });

      try {
        const r = await postJson<{
          state: InterviewStateWire;
          extracted: { updates: Array<{ field: string; value: string; confidence: number }>; memorable_quote: string };
          message: string | null;
          asked_field: string | null;
          done: boolean;
          stop_reason: string;
          progress: { asked: number; fields: number };
        }>('/api/interview/answer', { state: base, answer: text, asked_field: askedField });

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
        const r = await postJson<{
          summary: string;
          state: InterviewStateWire;
          /** ⚠️ 后端判断出「这个人当前没有面临选择」—— 此时不该去检索 */
          no_dilemma?: boolean;
        }>('/api/interview/finish', { state: s });
        setSummary(r.summary);
        setState(r.state);
        setMessages((m) => [...m, { id: uid(), role: 'ai', text: r.summary, field: 'summary' }]);

        /**
         * ⚠️ 没有迷茫 → **不进确认流程，也不去找人**。
         *
         *   实测踩到：用户明确说「我对这个方向很满意呀」，
         *   系统照样给他匹配了 4 条「别人走过的路」——
         *   那等于在暗示「你该重新考虑」，而产品的主张恰恰是
         *   「不替你判断该不该变」。
         *
         *   所以这里直接进 done，UI 只显示总结 + 一个说明。
         */
        if (r.no_dilemma) {
          setNoDilemma(true);
          setPhase({ kind: 'done' });
          return;
        }

        setNoDilemma(false);
        setPhase({ kind: 'confirming' });
      } catch (e) {
        setPhase({ kind: 'error', error: (e as Error).message });
      }
    },
    [postJson],
  );

  /* ---------------- 总结阶段说「哪里不对」 ---------------- */

  /**
   * ⚠️ 实测反馈：「你问我理解的对吗，我完全没有回答的余地呀」。
   *
   * 原来只有两个出口：全部同意（去找人）或全部推翻（重来）。
   * 想说「大体对，但第三点理解错了」时无路可走。
   *
   * 做法：把用户的更正当成**一条新的补充**发下去 ——
   * 走后端同一条 answer 链路，抽取器会把它并进已有字段，
   * 然后 AI 会基于新信息继续追问或重新总结。
   */
  const correctSummary = useCallback(
    async (text: string) => {
      // 回到「聊」的状态，把更正当作一条普通回答提交
      setPhase({ kind: 'idle' });
      await answer(text);
    },
    [answer],
  );

  /* ---------------- 改某一句：回滚到那之前，用新内容重走 ---------------- */

  /**
   * ⚠️ 实测反馈：「回答错误的话，没办法回退到上一个对话，只能重开」。
   *   聊了 10 轮，一句打错就全废 —— 所以要有这个。
   *
   * 做法：找到那条消息，用它的 `stateBefore` 快照恢复，
   *      把**它和它之后的**所有消息都丢掉，再用新内容重发一遍。
   *
   * 为什么不是「就地编辑」：那一条之后的所有轮次都是基于旧回答的，
   * 留着会造成状态不一致（右侧面板显示的是新答案，但后续追问还是按旧的来的）。
   */
  const rewindTo = useCallback(
    async (messageId: string, newText: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx < 0) return;
      const target = messages[idx];
      if (target.role !== 'user' || !target.stateBefore) return;

      // ① 回滚 state 到这条消息之前
      const back = JSON.parse(JSON.stringify(target.stateBefore)) as InterviewStateWire;
      setState(back);
      setProgress({ asked: back.asked.length, fields: Object.keys(back.collected).length });
      setNoDilemma(false);
      setSummary('');
      setLandscape(null);

      // ② 丢掉这条及其后所有消息，并回滚「问的是哪个字段」
      const keep = messages.slice(0, idx);
      setMessages(keep);

      // askedField 要恢复成「这条消息之前 AI 问的那个方向」
      // —— 往前找最近的 AI 消息
      let prevField = '';
      for (let i = idx - 1; i >= 0; i--) {
        const f = keep[i].field;
        if (keep[i].role === 'ai' && f) {
          prevField = f;
          break;
        }
      }
      setAskedField(prevField);

      // ③ 用新内容重发
      await answer(newText, back);
    },
    [messages, answer],
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
        constraints: splitList(c.constraints),
        goals: splitList(c.goals),
        // ⚠️ 这两个原来被塞进 constraints/goals 里凑数 ——
        //    结果「被调剂进材料科学」被当成了"约束条件"。
        //    它们是背景，不是条件，所以单独传。
        prior_path: c.prior_path,
        validation: c.validation,
        /**
         * ⚠️ fear 原来被塞进 unknowns（`最怕：xxx`），
         *    然后**后端没有任何地方读它**（全仓库 grep `fear` = 0 次）。
         *    但「最怕什么」是给代价排序最关键的信息 —— 单独传。
         */
        fear: c.fear,
        risk: 'medium',
        reversibility: (c.reversibility_attitude ?? '').includes('接受')
          ? 'high'
          : (c.reversibility_attitude ?? '').includes('不')
            ? 'low'
            : 'medium',
        unknowns: [],
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
    setNoDilemma(false);
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
    noDilemma,
    landscape,
    progress,
    /** 用户说过的、最能体现他在意什么的那句话 */
    bestQuote: bestQuote.current,
    answer,
    correctSummary,
    rewindTo,
    finishNow,
    search,
    reset,
    start,
  };
}

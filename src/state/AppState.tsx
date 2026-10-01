/**
 * 全局状态
 * ============================================
 * 六个页面共享访客的输入与检索结果。
 *
 * 数据来源有两级（T5 集成）：
 *   1. 真实后端：POST /api/situation → POST /api/retrieve
 *   2. 离线兜底：后端不可用时降级到打包进前端的 demo 缓存
 *
 * 为什么要有第二级：方案验收清单明确要求「断网/API 错误时有缓存的 Demo 数据，
 * 保证上台可演示」。演示当天现场网络不可控，这一层不能省。
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Situation, RetrievalResponse } from '../types/episode';
import { mockRetrieval, mockSituation } from '../data/mock';
import { demoCache, pickScenario } from '../data/demoCache';

/** 后端地址：默认同源 /api，可用 VITE_API_BASE 覆盖 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

/** 单次请求超时（毫秒）—— 演示时不能无限等 */
const REQUEST_TIMEOUT_MS = 30_000;

type RunMode = 'live' | 'offline';

type Journey = Record<string, string>;

type Ctx = {
  journey: Journey;
  setJourneyAnswer: (id: string, value: string) => void;

  situation: Situation | null;
  setSituation: (s: Situation) => void;

  result: RetrievalResponse | null;

  /** P1 → P2：把自然语言回答交给后端解析成结构化处境。返回 false 表示不该继续往下走 */
  loadingSituation: boolean;
  buildSituation: () => Promise<boolean>;

  /** P2 → P3：用（可能被用户改过的）处境去检索 */
  loadingRetrieval: boolean;
  runRetrieval: () => Promise<void>;

  /**
   * What-if 用：用一个「假设处境」重算，**不改动全局状态**。
   * 后端不可用时返回 null（What-if 需要实时重算，不能拿快照糊弄）。
   */
  retrieveWith: (hypothetical: Situation) => Promise<RetrievalResponse | null>;

  /** 本次数据来自真实后端还是离线缓存 */
  mode: RunMode;
  /** 降级原因（给 UI 显示提示） */
  offlineReason: string | null;

  /**
   * 输入不在产品范围内时的说明（后端 422 OUT_OF_SCOPE）。
   * 与「接口失败」区分开：这是**明确的业务答复**，要给引导而不是报错。
   */
  outOfScope: { reason: string; hint: string } | null;
  clearOutOfScope: () => void;

  reachable: number;
  setReachable: (n: number) => void;

  reset: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

/* ============================================================
   会话持久化（演示保护）
   ------------------------------------------------------------
   为什么需要：演示时误按 F5、或演示中途切页面刷新，
   原来所有状态都在内存里 → 直接归零，要在评委面前重走一遍流程。
   写进 sessionStorage 后刷新可恢复，关掉标签页则自动清空
   （不污染下一次演示）。
   ============================================================ */

const SESSION_KEY = 'echopath.session.v1';

interface Persisted {
  journey: Journey;
  situation: Situation | null;
  result: RetrievalResponse | null;
  reachable: number;
  /** 也要持久化：刷新后如果丢掉这句，页面会把缓存数据当成实时结果（不诚实） */
  mode?: RunMode;
  offlineReason?: string | null;
}

/**
 * 恢复旧会话时的防御性清理。
 *
 * 为什么需要：后端在解析阶段已经会去掉叠词（「止损止损」→「止损」），
 * 但**已经存进 sessionStorage 的旧数据不会自动变干净** ——
 * 用户刷新后加载的是旧快照，脏数据照样显示出来。
 *
 * ⚠️ 第二次实测教训：第一版只处理「整串重复」（ABAB → AB）和「空格分隔重复」，
 *   结果**页面上仍然显示「止损止损」** —— 因为那句长这样：
 *     【目标】在意的目标有具体交集：「止损止损」（对方的目标：…）
 *   重复发生在**句子中间**，不是整串。所以必须能处理任意位置的相邻重复词。
 *
 * 策略：从长到短滑动窗口，发现「窗口与紧邻下一个窗口完全相同」就删掉一份。
 * 保守清理：不改写、不替换，只删明显重复的那一份。
 */
/** 中文里合法的叠词 —— 这些不能被当成"手滑重复"删掉 */
const LEGIT_REDUPLICATION = new Set([
  '好好', '慢慢', '渐渐', '刚刚', '常常', '天天', '年年', '人人', '个个', '种种',
  '件件', '处处', '时时', '偏偏', '明明', '白白', '偷偷', '悄悄', '轻轻', '深深',
  '远远', '多多', '高高', '低低', '大大', '小小', '长长', '短短', '快快', '早早',
  '紧紧', '松松', '牢牢', '稳稳', '静静', '亲亲', '少少',
]);

function dedupeAdjacent(input: string): string {
  if (!input) return input;
  if (LEGIT_REDUPLICATION.has(input.trim())) return input;
  let s = input;

  // 1) 整串重复（最简单的情况）
  if (s.length % 2 === 0) {
    const h = s.length / 2;
    if (s.slice(0, h) === s.slice(h)) return s.slice(0, h);
  }

  // 2) 任意位置的相邻重复词：长窗口优先，避免先删短窗口把正常词切坏
  for (let len = 6; len >= 2; len--) {
    let i = 0;
    let guard = 0;
    while (i + len * 2 <= s.length && guard++ < 1000) {
      const a = s.slice(i, i + len);
      const b = s.slice(i + len, i + len * 2);
      // 只认「含实词」的重复，避免把连续标点/空白也合并掉
      if (a === b && /[\u4e00-\u9fa5A-Za-z0-9]/.test(a)) {
        s = s.slice(0, i) + a + s.slice(i + len * 2);
        // 不前进：可能连着重复好几份
      } else {
        i++;
      }
    }
  }

  // 3) 空格分隔的重复词
  const parts = s.split(/\s+/);
  if (parts.length >= 2 && parts.every((p) => p === parts[0])) return parts[0];

  return s;
}

function sanitizeSituation(s: Situation | null): Situation | null {
  if (!s) return s;
  const clean = (arr: string[] | undefined) => (Array.isArray(arr) ? arr.map((x) => dedupeAdjacent(String(x).trim())) : arr);
  return {
    ...s,
    stage: s.stage ? dedupeAdjacent(s.stage.trim()) : s.stage,
    dilemma: s.dilemma ? dedupeAdjacent(s.dilemma.trim()) : s.dilemma,
    options: clean(s.options) as string[],
    constraints: clean(s.constraints) as string[],
    goals: clean(s.goals) as string[],
    unknowns: clean(s.unknowns) as string[],
  };
}

/**
 * 恢复旧会话时也要清检索结果。
 *
 * ⚠️ 补漏：上一版只清了 situation，结果**页面上仍然显示「止损止损」**。
 *   原因：那句在 result.matches[].why_similar 里 —— 是旧后端生成的缓存文本。
 *   同一类问题我只覆盖了一半，所以这里补齐。
 *
 * 只处理「像 / 不像」的理由文本（它们是给用户直接读的），
 * 以及每个案例自己的 person / constraints 等展示字段。
 */
function sanitizeResult(r: RetrievalResponse | null): RetrievalResponse | null {
  if (!r || !Array.isArray(r.matches)) return r;
  const cleanList = (arr: unknown) =>
    Array.isArray(arr) ? arr.map((x) => dedupeAdjacent(String(x).trim())) : arr;

  return {
    ...r,
    situation: sanitizeSituation(r.situation) as Situation,
    matches: r.matches.map((m) => ({
      ...m,
      why_similar: cleanList(m.why_similar) as string[],
      why_different: cleanList(m.why_different) as string[],
      // 案例内部的展示字段也可能带脏数据（AI 生成时同样会吐叠词）
      episode: m.episode
        ? {
            ...m.episode,
            person: m.episode.person
              ? {
                  ...m.episode.person,
                  name: dedupeAdjacent(String(m.episode.person.name ?? '').trim()),
                }
              : m.episode.person,
            decision_state: m.episode.decision_state
              ? {
                  ...m.episode.decision_state,
                  constraints: cleanList(m.episode.decision_state.constraints) as string[],
                  goals: cleanList(m.episode.decision_state.goals) as string[],
                }
              : m.episode.decision_state,
          }
        : m.episode,
    })),
  };
}

function loadSession(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    // 基本形状校验：坏数据宁可丢弃，也不要让页面崩在评委面前
    if (typeof p !== 'object' || p === null) return null;
    if (p.journey && typeof p.journey !== 'object') return null;
    if (p.result && !Array.isArray(p.result.matches)) return null;
    return {
      journey: p.journey ?? {},
      situation: sanitizeSituation(p.situation ?? null),
      result: sanitizeResult(p.result ?? null),
      reachable: typeof p.reachable === 'number' ? p.reachable : 0,
      mode: p.mode === 'offline' ? 'offline' : 'live',
      offlineReason: p.offlineReason ?? null,
    };
  } catch {
    return null;
  }
}

function saveSession(p: Persisted): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p));
  } catch {
    // 隐私模式 / 配额满 —— 存不下就算了，不能因此让功能不可用
  }
}

/** 把 P1 的问答拼成后端要的 raw_input */
function buildNarrative(journey: Journey): string {
  return Object.values(journey)
    .map((v) => v.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * 输入超范围时后端返回 422 OUT_OF_SCOPE。
 * 这不是「接口挂了」，而是**明确的业务答复** ——
 * 所以绝不能走离线兜底（那会拿别人的处境糊弄用户）。
 */
export class OutOfScopeError extends Error {
  hint: string;
  constructor(reason: string, hint: string) {
    super(reason);
    this.name = 'OutOfScopeError';
    this.hint = hint;
  }
}

async function postJson<T>(path: string, payload: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // 422 且带 OUT_OF_SCOPE → 抛专门的错误，让 UI 给引导而不是报"失败"
      if (res.status === 422 && text.includes('OUT_OF_SCOPE')) {
        try {
          const j = JSON.parse(text) as { error?: { message?: string; hint?: string } };
          throw new OutOfScopeError(j.error?.message ?? '输入不在本产品的范围内', j.error?.hint ?? '');
        } catch (e) {
          if (e instanceof OutOfScopeError) throw e;
        }
      }
      throw new Error(`HTTP ${res.status}${text ? `：${text.slice(0, 120)}` : ''}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // 首次挂载时恢复上次会话（刷新不丢进度）。
  // ⚠️ 必须包成内联箭头函数：直接传 loadSession 会让 React Compiler
  //    跳过这个组件的优化（oxlint use-memo 警告）。
  const restored = useMemo(() => loadSession(), []);

  const [journey, setJourney] = useState<Journey>(restored?.journey ?? {});
  const [situation, setSituation] = useState<Situation | null>(restored?.situation ?? null);
  const [result, setResult] = useState<RetrievalResponse | null>(restored?.result ?? null);
  const [loadingSituation, setLoadingSituation] = useState(false);
  const [loadingRetrieval, setLoadingRetrieval] = useState(false);
  const [mode, setMode] = useState<RunMode>(restored?.mode ?? 'live');
  const [offlineReason, setOfflineReason] = useState<string | null>(restored?.offlineReason ?? null);
  const [outOfScope, setOutOfScope] = useState<{ reason: string; hint: string } | null>(null);
  const [reachable, setReachable] = useState(restored?.reachable ?? 0);

  // 任何状态变化都同步到 sessionStorage
  useEffect(() => {
    saveSession({ journey, situation, result, reachable, mode, offlineReason });
  }, [journey, situation, result, reachable, mode, offlineReason]);

  const value = useMemo<Ctx>(() => {
    /**
     * 统一的降级：记录原因，返回离线数据。
     *
     * v2：按用户实际填的内容挑场景，而不是一律给场景 1。
     * 演示问题 2/3 时断网，如果显示场景 1 的结果，
     * 「输入」和「结果」对不上，看上去像系统串了 —— 比没有数据更糟。
     */
    function fallback(reason: string, pick: 'situation' | 'retrieval'): void {
      console.error(`[offline fallback] ${reason}`);
      setMode('offline');
      setOfflineReason(reason);

      const scenario = pickScenario(buildNarrative(journey));
      console.error(`[offline fallback] 命中场景 ${scenario.id}：${scenario.name}`);

      if (pick === 'situation') {
        setSituation(structuredClone(scenario.situation ?? demoCache.situation ?? mockSituation));
      } else {
        setResult(structuredClone(scenario.retrieval ?? demoCache.retrieval ?? mockRetrieval));
      }
    }

    return {
      journey,
      setJourneyAnswer: (id, v) => setJourney((prev) => ({ ...prev, [id]: v })),

      situation,
      setSituation,

      result,

      loadingSituation,
      async buildSituation(): Promise<boolean> {
        setLoadingSituation(true);
        setOutOfScope(null);
        const narrative = buildNarrative(journey);
        try {
          const res = await postJson<{ situation: Situation }>('/api/situation', {
            raw_input: narrative || '我想换个方向，但不确定该不该换。',
          });
          setSituation(res.situation);
          setMode('live');
          setOfflineReason(null);
          return true;
        } catch (e) {
          // ⚠️ 超出范围是**明确的业务答复**，不能走离线兜底 ——
          //    拿别人的处境糊弄用户比看到错误提示糟糕得多。
          if (e instanceof OutOfScopeError) {
            setOutOfScope({ reason: e.message, hint: e.hint });
            return false;
          }
          // 接口不可用 → 降级到快照，流程照常往下走
          fallback(`解析接口不可用（${(e as Error).message.slice(0, 60)}）`, 'situation');
          return true;
        } finally {
          setLoadingSituation(false);
        }
      },

      loadingRetrieval,
      async runRetrieval() {
        setLoadingRetrieval(true);
        try {
          const current = situation ?? mockSituation;
          const res = await postJson<RetrievalResponse>('/api/retrieve', {
            situation: current,
            narrative: buildNarrative(journey),
          });
          setResult(res);
          setMode('live');
          setOfflineReason(null);
        } catch (e) {
          fallback(`检索接口不可用（${(e as Error).message.slice(0, 60)}）`, 'retrieval');
        } finally {
          setLoadingRetrieval(false);
        }
      },

      /**
       * What-if 专用：故意**不走降级**。
       * 理由：降级会返回一份固定的快照，那么「改条件 → 结果变化」就成了假的 ——
       * 而 What-if 的全部意义就在于证明这个变化是真的。
       * 所以后端不可用时直接返回 null，由 UI 明说「离线模式下无法演示 What-if」。
       */
      async retrieveWith(hypothetical: Situation) {
        try {
          return await postJson<RetrievalResponse>('/api/retrieve', {
            situation: hypothetical,
            narrative: buildNarrative(journey),
          });
        } catch (e) {
          console.error('[what-if] 重算失败：', (e as Error).message);
          return null;
        }
      },

      mode,
      offlineReason,

      outOfScope,
      clearOutOfScope: () => setOutOfScope(null),

      reachable,
      setReachable,

      reset() {
        setJourney({});
        setSituation(null);
        setResult(null);
        setReachable(0);
        setMode('live');
        setOfflineReason(null);
        // 主动重开时清掉持久化，避免下次打开又看到上一个人的处境
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* 忽略 */
        }
      },
    };
  }, [journey, situation, result, loadingSituation, loadingRetrieval, mode, offlineReason, reachable, outOfScope]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内使用');
  return ctx;
}

export { mockSituation };

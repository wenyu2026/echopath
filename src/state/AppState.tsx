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

  /** P1 → P2：把自然语言回答交给后端解析成结构化处境 */
  loadingSituation: boolean;
  buildSituation: () => Promise<void>;

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
      situation: p.situation ?? null,
      result: p.result ?? null,
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
      throw new Error(`HTTP ${res.status}${text ? `：${text.slice(0, 120)}` : ''}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // 首次挂载时恢复上次会话（刷新不丢进度）
  const restored = useMemo(loadSession, []);

  const [journey, setJourney] = useState<Journey>(restored?.journey ?? {});
  const [situation, setSituation] = useState<Situation | null>(restored?.situation ?? null);
  const [result, setResult] = useState<RetrievalResponse | null>(restored?.result ?? null);
  const [loadingSituation, setLoadingSituation] = useState(false);
  const [loadingRetrieval, setLoadingRetrieval] = useState(false);
  const [mode, setMode] = useState<RunMode>(restored?.mode ?? 'live');
  const [offlineReason, setOfflineReason] = useState<string | null>(restored?.offlineReason ?? null);
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
      async buildSituation() {
        setLoadingSituation(true);
        const narrative = buildNarrative(journey);
        try {
          const res = await postJson<{ situation: Situation }>('/api/situation', {
            raw_input: narrative || '我想换个方向，但不确定该不该换。',
          });
          setSituation(res.situation);
          setMode('live');
          setOfflineReason(null);
        } catch (e) {
          fallback(`解析接口不可用（${(e as Error).message.slice(0, 60)}）`, 'situation');
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
  }, [journey, situation, result, loadingSituation, loadingRetrieval, mode, offlineReason, reachable]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内使用');
  return ctx;
}

export { mockSituation };

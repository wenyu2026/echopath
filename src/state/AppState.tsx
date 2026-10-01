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

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Situation, RetrievalResponse } from '../types/episode';
import { mockRetrieval, mockSituation } from '../data/mock';
import { demoCache } from '../data/demoCache';

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

  /** 本次数据来自真实后端还是离线缓存 */
  mode: RunMode;
  /** 降级原因（给 UI 显示提示） */
  offlineReason: string | null;

  reachable: number;
  setReachable: (n: number) => void;

  reset: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

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
  const [journey, setJourney] = useState<Journey>({});
  const [situation, setSituation] = useState<Situation | null>(null);
  const [result, setResult] = useState<RetrievalResponse | null>(null);
  const [loadingSituation, setLoadingSituation] = useState(false);
  const [loadingRetrieval, setLoadingRetrieval] = useState(false);
  const [mode, setMode] = useState<RunMode>('live');
  const [offlineReason, setOfflineReason] = useState<string | null>(null);
  const [reachable, setReachable] = useState(0);

  const value = useMemo<Ctx>(() => {
    /** 统一的降级：记录原因，返回离线数据 */
    function fallback(reason: string, pick: 'situation' | 'retrieval'): void {
      console.error(`[offline fallback] ${reason}`);
      setMode('offline');
      setOfflineReason(reason);
      if (pick === 'situation') {
        setSituation(structuredClone(demoCache.situation ?? mockSituation));
      } else {
        setResult(structuredClone(demoCache.retrieval ?? mockRetrieval));
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

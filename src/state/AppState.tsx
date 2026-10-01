/**
 * 全局状态
 * ============================================
 * 六个页面共享访客的输入与检索结果。
 *
 * 后端（#14）就绪前用 mock 数据；就绪后只需把 buildSituation / runRetrieval
 * 换成真实调用，页面组件不用改。
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Situation, RetrievalResponse } from '../types/episode';
import { mockRetrieval, mockSituation } from '../data/mock';

type Journey = Record<string, string>;

type Ctx = {
  /** P1 收集的原始回答 */
  journey: Journey;
  setJourneyAnswer: (id: string, value: string) => void;

  /** P2 的结构化处境（可被用户编辑） */
  situation: Situation | null;
  setSituation: (s: Situation) => void;

  /** 检索结果 */
  result: RetrievalResponse | null;
  /** 是否正在"检索" */
  loading: boolean;
  /** 触发检索（当前为本地 mock，后端就绪后改成 fetch） */
  runRetrieval: () => Promise<void>;

  /** 已解锁到第几步（0-5） */
  reachable: number;
  setReachable: (n: number) => void;

  reset: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

/** 模拟后端延迟，让流程有真实感 */
const FAKE_LATENCY_MS = 900;

export function AppProvider({ children }: { children: ReactNode }) {
  const [journey, setJourney] = useState<Journey>({});
  const [situation, setSituation] = useState<Situation | null>(null);
  const [result, setResult] = useState<RetrievalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reachable, setReachable] = useState(0);

  const value = useMemo<Ctx>(() => {
    return {
      journey,
      setJourneyAnswer: (id, v) => setJourney((prev) => ({ ...prev, [id]: v })),

      situation,
      setSituation,

      result,
      loading,

      async runRetrieval() {
        setLoading(true);
        try {
          // === 后端接口就绪后替换这里 ===
          // const res = await fetch('/api/retrieve', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ journey, situation }),
          // });
          // setResult(await res.json());
          await new Promise((r) => setTimeout(r, FAKE_LATENCY_MS));
          const next: RetrievalResponse = structuredClone(mockRetrieval);
          if (situation) next.situation = situation;
          setResult(next);
          // ==============================
        } finally {
          setLoading(false);
        }
      },

      reachable,
      setReachable,

      reset() {
        setJourney({});
        setSituation(null);
        setResult(null);
        setReachable(0);
      },
    };
  }, [journey, situation, result, loading, reachable]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内使用');
  return ctx;
}

export { mockSituation };

/**
 * 决策地形 v2 的状态
 * ============================================
 * ⚠️ 刻意**不复用 AppState.tsx**
 *   那个 context 是现有六页共用的（P1→P6 的会话状态、离线兜底、sessionStorage）。
 *   决策地形是**独立的一条流程**，混进去会让两边都难改。
 *   所以这里自带一个小 hook，只管自己的请求。
 *
 * ⚠️ 但**数据源选择要记住** —— 用户切换后刷新页面不该跳回去。
 *   用 localStorage 存（跨标签页也生效），键名带版本防冲突。
 */

import { useCallback, useEffect, useState } from 'react';
import type { LandscapeResponse, SituationV2 } from '../types/landscape';

const SOURCE_KEY = 'echopath.landscape.source.v1';

export interface SourceOption {
  id: string;
  label: string;
}

export interface LandscapeState {
  sources: SourceOption[];
  sourceId: string;
  setSourceId: (id: string) => void;
  data: LandscapeResponse | null;
  loading: boolean;
  error: string | null;
  /** 上一次请求用的输入，用于「重新生成」 */
  lastInput: { situation: SituationV2; userQuote?: string } | null;
  run: (situation: SituationV2, userQuote?: string) => Promise<void>;
}

function readStoredSource(): string {
  try {
    return localStorage.getItem(SOURCE_KEY) ?? 'historical';
  } catch {
    // 隐私模式下 localStorage 可能不可用
    return 'historical';
  }
}

export function useLandscape(): LandscapeState {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [sourceId, setSourceIdState] = useState<string>(readStoredSource);
  const [data, setData] = useState<LandscapeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<LandscapeState['lastInput']>(null);

  // 拉数据源列表
  useEffect(() => {
    let cancelled = false;
    fetch('/api/sources')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: { sources?: SourceOption[] }) => {
        if (!cancelled && Array.isArray(j.sources)) {
          setSources(j.sources);
          // 存的那个源如果不存在了（改了配置），回退到第一个
          if (!j.sources.some((s) => s.id === readStoredSource()) && j.sources[0]) {
            setSourceIdState(j.sources[0].id);
          }
        }
      })
      .catch(() => {
        // 后端没起时不报错 —— 页面上给提示就好
        if (!cancelled) setSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSourceId = useCallback((id: string) => {
    setSourceIdState(id);
    try {
      localStorage.setItem(SOURCE_KEY, id);
    } catch {
      /* 忽略 */
    }
  }, []);

  const run = useCallback(
    async (situation: SituationV2, userQuote?: string) => {
      setLoading(true);
      setError(null);
      setLastInput({ situation, userQuote });
      try {
        const res = await fetch('/api/landscape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ situation, user_quote: userQuote, source_id: sourceId }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let msg = `HTTP ${res.status}`;
          try {
            const j = JSON.parse(text) as { error?: { message?: string } };
            if (j.error?.message) msg = j.error.message;
          } catch {
            /* 保持默认 */
          }
          throw new Error(msg);
        }
        setData((await res.json()) as LandscapeResponse);
      } catch (e) {
        setError((e as Error).message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [sourceId],
  );

  /**
   * 切换数据源后**自动重跑**（如果已经有结果）。
   * ⚠️ 这是演示的核心体验：点一下开关，同一段输入立刻换一套结果。
   *    如果切换后还要用户再点一次「生成」，那一拍就没劲了。
   */
  useEffect(() => {
    if (lastInput && data && data.data_source.id !== sourceId) {
      void run(lastInput.situation, lastInput.userQuote);
    }
    // 只在 sourceId 变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId]);

  return { sources, sourceId, setSourceId, data, loading, error, lastInput, run };
}

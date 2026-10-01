/**
 * 多样性选择器 —— 返回的 3 个案例 choice.type 至少覆盖 2 种不同值。
 * 硬要求来自 .agent/DecisionEpisode-Schema.md 第 2 节与 Demo 验收清单。
 */
import type { DecisionEpisode } from '../../src/types/episode.ts';

export interface Ranked {
  episode: DecisionEpisode;
  total: number;
}

export function selectDiverse(ranked: Ranked[], k = 3): { picked: Ranked[]; forcedDiversity: boolean } {
  if (ranked.length <= k) return { picked: ranked, forcedDiversity: false };

  const pool = [...ranked].sort((a, b) => b.total - a.total);
  const picked: Ranked[] = [pool.shift()!];

  const distinctTypes = () => new Set(picked.map((p) => p.episode.choice.type)).size;

  // 第二个名额：若已选类型垄断，强制选不同 choice.type 的最高分者
  if (pool.length > 0) {
    const nextBest = pool[0];
    const alt = pool.find((c) => c.episode.choice.type !== picked[0].episode.choice.type);
    const chosen = distinctTypes() < 2 && alt ? alt : nextBest;
    picked.push(pool.splice(pool.indexOf(chosen), 1)[0]);
  }
  // 其余名额按分填满
  while (picked.length < k && pool.length > 0) {
    picked.push(pool.shift()!);
  }
  return { picked, forcedDiversity: distinctTypes() < 2 && ranked.length >= 2 };
}

/**
 * 元数据软过滤：阶段明显不兼容则剔除，但候选不足以填满 k 个时保留全部并标记。
 * （软过滤而非硬过滤：种子库只有 3 条时，硬过滤会让演示直接空结果。）
 */
export function metadataFilter(
  episodes: DecisionEpisode[],
  stageClassOf: (stage: string) => string | undefined,
  userStageClass: string | undefined,
  k: number,
): { kept: DecisionEpisode[]; dropped: number } {
  if (!userStageClass) return { kept: episodes, dropped: 0 };
  const compatible = episodes.filter((e) => {
    const c = stageClassOf(e.time.stage);
    return c === undefined || c === userStageClass;
  });
  if (compatible.length >= k) return { kept: compatible, dropped: episodes.length - compatible.length };
  return { kept: episodes, dropped: 0 };
}

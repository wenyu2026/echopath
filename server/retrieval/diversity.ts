/**
 * 多样性选择器 —— 返回的 3 个案例 choice.type 至少覆盖 2 种不同值。
 * 硬要求来自 .agent/DecisionEpisode-Schema.md 第 2 节与 Demo 验收清单。
 *
 * ⚠️ v2 修复（集成复盘发现两个问题）：
 *   ① **同一个人可能被选两次**。数据里有同一人物的多个决策事件
 *      （鲁迅 3 条、詹姆斯·戴森 2 条…），原实现只按分数取，
 *      于是出现过「詹姆斯·戴森 / 詹姆斯·戴森」这种结果 ——
 *      对「三条不同的人生道路」这个产品主张是致命的。
 *   ② **多样性只保证了第 2 个名额**。第 3 个名额纯按分填，
 *      在 3 种 choice.type 都可用时仍可能退回重复类型。
 *      现在改成：名额够时优先取不同类型，不够才按分填。
 */
import type { DecisionEpisode } from '../../src/types/episode.ts';

export interface Ranked {
  episode: DecisionEpisode;
  total: number;
}

/** 同一人物只留一条 —— 取分最高的那条 */
function dedupeByPerson(ranked: Ranked[]): Ranked[] {
  const seen = new Set<string>();
  const out: Ranked[] = [];
  for (const r of ranked) {
    const key = r.episode.person.name;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

export function selectDiverse(ranked: Ranked[], k = 3): { picked: Ranked[]; forcedDiversity: boolean } {
  // 先按人去掉重复，再谈多样性
  const unique = dedupeByPerson([...ranked].sort((a, b) => b.total - a.total));

  if (unique.length <= k) {
    return { picked: unique, forcedDiversity: false };
  }

  const pool = [...unique];
  const picked: Ranked[] = [];
  const usedTypes = new Set<string>();

  // 逐名额贪心：优先取「类型没出现过」的最高分者；
  // 若所有剩余候选的类型都出现过，才退回纯按分取（保证不会空名额）。
  while (picked.length < k && pool.length > 0) {
    const fresh = pool.find((c) => !usedTypes.has(c.episode.choice.type));
    const chosen = fresh ?? pool[0];
    picked.push(chosen);
    usedTypes.add(chosen.episode.choice.type);
    pool.splice(pool.indexOf(chosen), 1);
  }

  const distinct = new Set(picked.map((p) => p.episode.choice.type)).size;
  return { picked, forcedDiversity: distinct < 2 && unique.length >= 2 };
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

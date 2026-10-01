/**
 * 案例数据加载 —— 只读 data/episodes.json（fu6868 的责任区，本模块绝不写它）。
 * 数据未就绪时 (#13) 本文件允许 3 条种子样例先跑通链路（#14 验收第 5 条）。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DecisionEpisode } from '../../src/types/episode.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_PATH = join(here, '..', '..', 'data', 'episodes.json');

export function loadEpisodes(path = DATA_PATH): DecisionEpisode[] {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as { episodes?: DecisionEpisode[] } | DecisionEpisode[];
  const episodes = Array.isArray(raw) ? raw : (raw.episodes ?? []);
  if (episodes.length === 0) throw new Error(`案例库为空: ${path}`);
  const ids = new Set<string>();
  for (const ep of episodes) {
    if (!ep.episode_id) throw new Error('存在缺失 episode_id 的案例');
    if (ids.has(ep.episode_id)) throw new Error(`episode_id 重复: ${ep.episode_id}`);
    ids.add(ep.episode_id);
    if (!Array.isArray(ep.evidence) || ep.evidence.length === 0) {
      throw new Error(`案例 ${ep.episode_id} 的 evidence 为空 —— 数据红线（每条案例必须有证据）`);
    }
  }
  return episodes;
}

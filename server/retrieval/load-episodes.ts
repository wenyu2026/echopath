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
export const SOURCES_PATH = join(here, '..', '..', 'data', 'sources.json');

/**
 * 来源的核查元信息。
 *
 * ⚠️ 为什么要单独加载：sources.json 里有 title / publisher / locator /
 *   accessed_on / limitations —— 这些**正是让证据可核查的东西**，
 *   但 episode 的 evidence 只带 source_id 和 url，前端根本拿不到。
 *   结果抽屉里只能显示「LX-SENDAI + 一个链接」，
 *   而用户需要的是「东北大学史料馆《鲁迅的仙台留学》，定位到"赴日与仙台入学"」。
 */
export interface SourceMeta {
  source_id: string;
  title?: string;
  publisher?: string;
  url?: string;
  locator?: string;
  accessed_on?: string;
  limitations?: string;
  /** 原始来源类型（biography / self_writing / …），用于交叉核对 */
  type?: string;
  access_method?: string;
  local_path?: string;
}

/** 读 sources.json，返回 source_id → 元信息 的映射。读不到就返回空表（不阻塞主流程） */
export function loadSourceMeta(path = SOURCES_PATH): Record<string, SourceMeta> {
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { sources?: SourceMeta[] } | SourceMeta[];
    const list = Array.isArray(raw) ? raw : (raw.sources ?? []);
    const map: Record<string, SourceMeta> = {};
    for (const s of list) {
      if (s?.source_id) map[s.source_id] = s;
    }
    return map;
  } catch (e) {
    console.error('[load-episodes] ⚠️ sources.json 读取失败，证据抽屉将缺少出版信息:', (e as Error).message);
    return {};
  }
}

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

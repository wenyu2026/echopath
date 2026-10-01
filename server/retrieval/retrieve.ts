/**
 * 检索链路编排 —— Situation → RetrievalResponse（#14 的核心）。
 *
 * 流程（.agent/DecisionEpisode-Schema.md 第 3 节 + 方案第 8 节）：
 *   embedding 召回 → 元数据软过滤 → 七维结构重排 → choice.type 多样性采样 → top 3
 *
 * 说明：why_different 与 evidence_layers 的完整填充属于 #15（阶段二），
 * 这里先给出契约要求的空结构与可立即追溯的 unknowns，保证前端形状稳定。
 */
import type { DecisionEpisode, MatchResult, Situation } from '../../src/types/episode.ts';
import { cosine, type Embedder } from '../embedding/embed.ts';
import { writeEvidenceLayers } from '../evidence/evidence-writer.ts';
import { buildCounterAnalogy, guardViolations, type CounterAnalogyItem } from '../counter-analogy/counter-analogy.ts';
import {
  DIMENSION_WEIGHTS,
  explainSimilarity,
  scoreDimensions,
  totalScore,
  STAGE_CLASSES,
  type DimensionInput,
} from './dimensions.ts';
import { metadataFilter, selectDiverse } from './diversity.ts';

/** MatchResult + #15 阶段二新增的可选结构化字段（CHANGE_REQUEST 见 #17，获批后并入正式 types） */
export interface MatchResultExtended extends MatchResult {
  why_different_detail?: CounterAnalogyItem[];
}

/**
 * meta 的扩展字段（检索过程可视化需要，方案第 13 节）。
 * 已并入 #17 的 CHANGE_REQUEST，types 契约正式化前先在此声明，不改动 wenyu2026 的文件。
 * （Node 原生类型剥离不支持 interface extends 索引类型，这里平铺声明保持与契约一致。）
 */
export interface RetrievalMetaExtended {
  candidates_recalled: number;
  after_metadata_filter: number;
  after_rerank: number;
  elapsed_ms: number;
  dropped_by_metadata: number;
  forced_diversity: boolean;
  weights: typeof DIMENSION_WEIGHTS;
}

export interface RetrievalResponseExtended {
  situation: Situation;
  matches: MatchResult[];
  meta: RetrievalMetaExtended;
}

export interface EpisodeIndexEntry {
  episode: DecisionEpisode;
  recallVec: number[];
  pathVec: number[];
}

export interface RetrieveDeps {
  embedder: Embedder;
  episodes: DecisionEpisode[];
  /** 预计算的案例向量（启动时建好；mock 模式下即席计算） */
  index?: EpisodeIndexEntry[];
}

/**
 * 稳定哈希：同一字符串永远得到同一个数。
 * 用它打散展示顺序 —— 与分数无关，但可复现（同一处境每次顺序一致）。
 */
function stableHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function recallTextOf(ep: DecisionEpisode): string {
  return `来时路：${ep.prior_path.join('，')}。困境：${ep.decision_state.dilemma}。约束：${ep.decision_state.constraints.join('，')}。标签：${ep.retrieval_tags.join('，')}`;
}

export function situationRecallText(s: Situation): string {
  return `困境：${s.dilemma}。约束：${s.constraints.join('，')}。目标：${s.goals.join('，')}。阶段：${s.stage}`;
}

export async function buildEpisodeIndex(deps: RetrieveDeps): Promise<EpisodeIndexEntry[]> {
  const texts = deps.episodes.map(recallTextOf);
  const pathTexts = deps.episodes.map((e) => e.prior_path.join('，'));
  const [recallVecs, pathVecs] = await Promise.all([deps.embedder.embed(texts), deps.embedder.embed(pathTexts)]);
  return deps.episodes.map((episode, i) => ({ episode, recallVec: recallVecs[i], pathVec: pathVecs[i] }));
}

export interface RetrieveOptions {
  /** 用户原始叙述（含来时路）。前端只改 Situation 时可以不带。 */
  narrative?: string;
  /** 召回后保留的候选数（默认取全部候选进入重排，数据少时不截断） */
  recallK?: number;
}

export async function retrieve(situation: Situation, opts: RetrieveOptions, deps: RetrieveDeps): Promise<RetrievalResponseExtended> {
  const t0 = Date.now();
  const index = deps.index ?? (await buildEpisodeIndex(deps));

  // 1. 召回：用户文本向量化，与案例召回向量算余弦
  const [narrativeVecs, situationVecs] = await Promise.all([
    opts.narrative ? deps.embedder.embed([opts.narrative]) : Promise.resolve(undefined),
    deps.embedder.embed([situationRecallText(situation)]),
  ]);
  const situationVec = situationVecs[0];
  const narrativeVec = narrativeVecs?.[0];

  const withSim = index
    .map((entry) => ({ entry, sim: cosine(situationVec, entry.recallVec) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, opts.recallK ?? index.length);

  // 2. 元数据软过滤（阶段不兼容的剔除，候选不足时保留）
  const stageClassOf = (stage: string) => {
    for (const [cls, words] of Object.entries(STAGE_CLASSES)) if (words.some((w) => stage.includes(w))) return cls;
    return undefined;
  };
  const { kept, dropped } = metadataFilter(
    withSim.map((x) => x.entry.episode),
    stageClassOf,
    stageClassOf(situation.stage),
    3,
  );
  const keptEntries = kept.map((ep) => withSim.find((x) => x.entry.episode === ep)!);

  // 3. 七维结构重排
  const scored = keptEntries.map(({ entry }) => {
    const input: DimensionInput = {
      situation,
      narrative: opts.narrative,
      narrativeVec,
      situationVec,
      episode: entry.episode,
      episodeRecallVec: entry.recallVec,
      episodePathVec: entry.pathVec,
    };
    const dimensions = scoreDimensions(input);
    return { episode: entry.episode, dimensions, total: totalScore(dimensions) };
  });
  scored.sort((a, b) => b.total - a.total);

  // 4. 多样性采样：choice.type 至少 2 种
  const { picked, forcedDiversity } = selectDiverse(scored, 3);
  if (forcedDiversity) {
    console.error('[retrieval] ⚠️ 候选中 choice.type 不足 2 种，按分数返回');
  }

  /**
   * ⚠️ 打散展示顺序：不让「分数最高的那条」永远排在第一位。
   *
   * 为什么：前端把三条路标成 路径 A / B / C，A 在最上面、配色最靠前。
   * 而 picked 是按分数降序的，实测三个场景里 A **永远是**最高分那条 ——
   * 页面嘴上说「不是排名，也不是推荐」，版式却在排。
   *
   * 变换方式：按 episode_id 的稳定哈希排序。
   *   · 确定性 —— 同一处境每次跑结果一样，方便演示与复现
   *   · 与分数无关 —— A 不再系统性地是"最好的那条"
   * 分数本身不丢，仍随 dimensions 一起返回，需要时随时能看。
   */
  const displayOrder = [...picked].sort((a, b) => {
    const ha = stableHash(a.episode.episode_id);
    const hb = stableHash(b.episode.episode_id);
    return ha - hb || a.episode.episode_id.localeCompare(b.episode.episode_id);
  });

  // 5. 组装 MatchResult：证据分层（#15，纯代码判定表）+ 反类比（#15，模板生成）
  const matches: MatchResultExtended[] = displayOrder.map(({ episode, dimensions }) => {
    const layers = writeEvidenceLayers(episode);
    const ca = buildCounterAnalogy(situation, episode);
    const violations = guardViolations(ca.items.map((i) => i.text));
    if (violations.length > 0) {
      throw new Error(`反类比输出违反口径铁律: ${violations.join('; ')}`);
    }
    layers.ai_inferences = ca.items.filter((i) => i.kind === 'era').map((i) => i.text);
    return {
      episode,
      dimensions,
      why_similar: explainSimilarity(situation, episode, dimensions),
      why_different: ca.items.map((i) => i.text),
      why_different_detail: ca.items,
      evidence_layers: layers,
    };
  });

  return {
    situation,
    matches,
    meta: {
      candidates_recalled: index.length,
      after_metadata_filter: keptEntries.length,
      after_rerank: picked.length,
      dropped_by_metadata: dropped,
      forced_diversity: forcedDiversity,
      elapsed_ms: Date.now() - t0,
      weights: DIMENSION_WEIGHTS,
    },
  };
}

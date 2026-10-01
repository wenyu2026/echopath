/**
 * Embedding 客户端 —— qwen3.7-text-embedding（实测 1024 维，约 0.4s）。
 *
 * MVP 不用向量库（.agent/DecisionEpisode-Schema.md 第 6 节）：
 * 数据只有几十条，内存算余弦即可。Embedder 接口可注入：
 * - realEmbedder：真实网关调用
 * - mockEmbedder：确定性伪向量（字符 bigram 哈希），离线单测用，无语义但可复现
 *
 * ⚠️ 集成修复（#17）：网关的 embedding 接口**单次批量上限 20 条**，
 *    实测 36 条会被拒：`batch size is invalid, it should not be larger than 20`。
 *    这个问题只在数据从 3 条涨到 36 条后才暴露 —— 分别在两个分支上各自都正常，
 *    合起来才炸。所以这里必须分批。
 */

/** 网关实测的批量上限（留 1 条余量，避免边界抖动） */
const MAX_EMBED_BATCH = 20;

export interface Embedder {
  readonly kind: 'real' | 'mock';
  readonly dim: number;
  embed(texts: string[]): Promise<number[][]>;
}

export function realEmbedder(config: { apiKey: string; baseUrl?: string; model?: string; timeoutMs?: number }): Embedder {
  let cachedDim = 0;
  return {
    kind: 'real',
    get dim() { return cachedDim; },
    async embed(texts: string[]) {
      if (texts.length === 0) return [];
      const { embeddings } = await import('../shared/gateway.ts');

      // 分批：单批超过上限会被网关拒绝
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += MAX_EMBED_BATCH) {
        const batch = texts.slice(i, i + MAX_EMBED_BATCH);
        const { vectors, elapsedMs } = await embeddings(
          { apiKey: config.apiKey, baseUrl: config.baseUrl, timeoutMs: config.timeoutMs },
          config.model ?? 'qwen3.7-text-embedding',
          batch,
        );
        cachedDim = vectors[0]?.length ?? cachedDim;
        console.error(
          `[embedding] 第 ${Math.floor(i / MAX_EMBED_BATCH) + 1} 批：${batch.length} 条，${vectors[0]?.length ?? '?'} 维，${elapsedMs}ms`,
        );
        out.push(...vectors);
      }

      if (out.length !== texts.length) {
        throw new Error(`embedding 分批结果数量不匹配：请求 ${texts.length}，返回 ${out.length}`);
      }
      return out;
    },
  };
}

/** 确定性 mock 向量：字符 bigram 哈希到固定维度再 L2 归一化。共享字越多，余弦越高。 */
export function mockEmbedder(dim = 96): Embedder {
  return {
    kind: 'mock',
    dim,
    async embed(texts: string[]) {
      return texts.map((t) => hashVector(t, dim));
    },
  };
}

function hashVector(text: string, dim: number): number[] {
  const vec = new Array<number>(dim).fill(0);
  const chars = [...text];
  for (let i = 0; i < chars.length - 1; i++) {
    const gram = chars[i] + chars[i + 1];
    const h = fnv1a(gram);
    vec[h % dim] += 1;
    vec[(h >>> 7) % dim] += 0.5; // 降低碰撞影响
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

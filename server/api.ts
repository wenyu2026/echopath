/**
 * EchoPath API（阶段一：检索链路）
 * ============================================
 * 零依赖 HTTP 服务（Node 24 原生 TS，node --env-file=.env server/api.ts）。
 *
 * 路由：
 *   GET  /api/health          存活检查
 *   POST /api/situation       { raw_input } → Situation（Situation Parser）
 *   POST /api/retrieve        { situation, narrative? } → RetrievalResponse
 *   POST /api/consult         { raw_input } → 全链路（parse + retrieve），Demo 主入口
 *   GET  /api/episodes/:id    案例详情
 *   GET  /api/demo/:n         断网兜底：预生成的 Demo 缓存响应（#17 硬检查）
 *
 * 依赖 #15（阶段二）填充 why_different / evidence_layers，当前返回空结构 + unknowns。
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Situation } from '../src/types/episode.ts';
import { parseSituation, OutOfScopeError } from './parser/situation-parser.ts';
import { validateSituationShape } from './shared/situation-contract.ts';
import { mockEmbedder, realEmbedder } from './embedding/embed.ts';
import { loadEpisodes } from './retrieval/load-episodes.ts';
import { buildEpisodeIndex, retrieve, type RetrieveDeps } from './retrieval/retrieve.ts';
import { handleLandscapeRoutes } from './landscape-routes.ts';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const API_KEY = process.env.TOKENDANCE_API_KEY ?? '';

if (!API_KEY) {
  console.error('[api] ⚠️ 未设置 TOKENDANCE_API_KEY：/api/situation 与 /api/consult 会失败；/api/retrieve 可用 mock 向量');
}

function makeDeps(): RetrieveDeps {
  const embedder = API_KEY
    ? realEmbedder({ apiKey: API_KEY })
    : mockEmbedder();
  const deps: RetrieveDeps = { embedder, episodes: loadEpisodes() };
  return deps;
}

let depsPromise: Promise<RetrieveDeps> | undefined;
function deps(): Promise<RetrieveDeps> {
  if (!depsPromise) {
    depsPromise = (async () => {
      const d = makeDeps();
      const t0 = Date.now();
      d.index = await buildEpisodeIndex(d);
      console.error(`[api] 案例索引就绪：${d.episodes.length} 条，耗时 ${Date.now() - t0}ms`);
      return d;
    })();
  }
  return depsPromise;
}

interface ParsedBody {
  raw_input?: string;
  situation?: Situation;
  narrative?: string;
}

function json(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

/** 请求体上限。超了返回 413 而不是把连接掐掉 */
export const MAX_BODY_BYTES = 64 * 1024;

class BodyTooLarge extends Error {
  constructor() {
    super(`请求体超过 ${Math.round(MAX_BODY_BYTES / 1024)}KB`);
    this.name = 'BodyTooLarge';
  }
}

function readBody(req: IncomingMessage, limit = MAX_BODY_BYTES): Promise<ParsedBody> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let aborted = false;
    const chunks: Buffer[] = [];

    req.on('data', (c: Buffer) => {
      if (aborted) return;
      size += c.length;
      if (size > limit) {
        // ⚠️ 健壮性修复：原来是 reject() + req.destroy()。
        //    destroy() 会把连接直接掐掉，客户端看到的是「连接被重置」（curl 里是 000），
        //    而不是一个能读懂的 413 —— 排查时完全不知道发生了什么。
        //    改成：停止读取、保留连接，让上层回一个明确的 413。
        aborted = true;
        reject(new BodyTooLarge());
        return;
      }
      chunks.push(c);
    });

    req.on('end', () => {
      if (aborted) return;
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as ParsedBody);
      } catch {
        reject(new Error('请求体不是合法 JSON'));
      }
    });

    req.on('error', reject);
  });
}

const DEMO_CACHE_DIR = join(here, 'fixtures');

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const route = `${req.method} ${url.pathname}`;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    // 决策地形 v2 的路由（独立模块，见 server/landscape-routes.ts）
    if (await handleLandscapeRoutes(req, res, url)) return;

    if (route === 'GET /api/health') {
      json(res, 200, { ok: true, ts: new Date().toISOString(), key_configured: Boolean(API_KEY) });
      return;
    }

    if (route === 'POST /api/situation') {
      const body = await readBody(req);
      if (!body.raw_input?.trim()) throw new Error('缺少 raw_input');
      if (!API_KEY) throw new Error('未配置 TOKENDANCE_API_KEY，无法调用 Situation Parser');
      const result = await parseSituation({ apiKey: API_KEY }, body.raw_input);
      json(res, 200, { situation: result.situation, meta: { elapsed_ms: result.elapsedMs, total_tokens: result.totalTokens, attempts: result.attempts } });
      return;
    }

    if (route === 'POST /api/retrieve') {
      const body = await readBody(req);
      if (!body.situation) throw new Error('缺少 situation');

      // ⚠️ 健壮性修复：原来直接把 body.situation 丢给 retrieve()，
      //    缺字段时会在深处抛 `Cannot read properties of undefined`，返回 500 且信息没用。
      //
      //    这里用**宽松校验**（validateSituationShape），不是严格的 validateSituation：
      //    后者是为 Situation Parser 的输出写的（LLM schema 保证条数），
      //    而这条路由收到的是**用户在 P2 手动改过的处境** —— 用户可以删到只剩 1 条约束。
      //    拿严格规则卡会把编辑功能和 What-if 一起搞坏。
      const v = validateSituationShape(body.situation);
      if (!v.ok) {
        json(res, 400, {
          error: {
            code: 'INVALID_SITUATION',
            message: `situation 不合法：${v.issues.map((i) => `${i.field} ${i.message}`).join('；')}`,
            issues: v.issues,
          },
        });
        return;
      }

      const d = await deps();
      const response = await retrieve(v.situation, { narrative: body.narrative }, d);
      json(res, 200, response);
      return;
    }

    if (route === 'POST /api/consult') {
      const body = await readBody(req);
      if (!body.raw_input?.trim()) throw new Error('缺少 raw_input');
      if (!API_KEY) throw new Error('未配置 TOKENDANCE_API_KEY，无法调用 Situation Parser');
      const d = await deps();
      const parsed = await parseSituation({ apiKey: API_KEY }, body.raw_input);
      const response = await retrieve(parsed.situation, { narrative: body.raw_input }, d);
      json(res, 200, {
        situation: parsed.situation,
        ...response,
        meta: { ...response.meta, parser_elapsed_ms: parsed.elapsedMs, parser_tokens: parsed.totalTokens },
      });
      return;
    }

    const episodeMatch = url.pathname.match(/^\/api\/episodes\/([\w-]+)$/);
    if (req.method === 'GET' && episodeMatch) {
      const d = await deps();
      const ep = d.episodes.find((e) => e.episode_id === episodeMatch[1]);
      if (!ep) {
        json(res, 404, { error: { code: 'EPISODE_NOT_FOUND', message: `没有案例 ${episodeMatch[1]}` } });
        return;
      }
      json(res, 200, ep);
      return;
    }

    const demoMatch = url.pathname.match(/^\/api\/demo\/([123])$/);
    if (req.method === 'GET' && demoMatch) {
      const cachePath = join(DEMO_CACHE_DIR, `demo-cache-${demoMatch[1]}.json`);
      if (!existsSync(cachePath)) {
        json(res, 404, { error: { code: 'DEMO_CACHE_MISSING', message: `缓存未生成：${cachePath}（联调时运行一次 /api/consult 后保存）` } });
        return;
      }
      json(res, 200, JSON.parse(readFileSync(cachePath, 'utf8')));
      return;
    }

    json(res, 404, { error: { code: 'NOT_FOUND', message: `未知路由 ${route}` } });
  } catch (e) {
    const err = e as Error;
    console.error(`[api] ${route} 失败:`, err.message);

    // 把几类可预期的客户端错误映射成合适的状态码 —— 全都回 500
    // 会让调用方以为是服务端炸了，排查方向直接跑偏
    if (err instanceof BodyTooLarge) {
      json(res, 413, { error: { code: 'BODY_TOO_LARGE', message: err.message } });
      return;
    }
    // 输入不在产品范围内 —— 单独一个错误码，前端要给出明确的引导，
    // 而不是笼统的「解析失败」
    if (err instanceof OutOfScopeError) {
      json(res, 422, {
        error: {
          code: 'OUT_OF_SCOPE',
          message: err.detail.reason,
          hint: err.detail.hint,
        },
      });
      return;
    }
    const msg = err.message ?? '';
    if (msg.includes('缺少 ') || msg.includes('不是合法 JSON')) {
      json(res, 400, { error: { code: 'BAD_REQUEST', message: msg } });
      return;
    }
    json(res, 500, { error: { code: 'INTERNAL', message: msg } });
  }
}

const server = createServer((req, res) => {
  handle(req, res).catch((e) => {
    console.error('[api] 未处理异常:', e);
    json(res, 500, { error: { code: 'INTERNAL', message: '服务器内部错误' } });
  });
});

server.listen(PORT, () => {
  console.error(`[api] EchoPath 检索链路已启动: http://localhost:${PORT}（key_configured=${Boolean(API_KEY)}）`);

  // 启动后立刻预热索引。
  //
  // 为什么：索引是懒加载的，第一次调用才建。实测服务刚起时第一次
  // /api/retrieve 要 2.6s，之后就降到 0.16s。
  // 演示时你刚 npm start 就上台，第一次点 What-if 正好撞上这 2.6 秒 ——
  // 观众看到的是"卡住了"。预热后这段时间被挪到启动阶段（那时没人在看）。
  void deps()
    .then((d) => console.error(`[api] 预热完成：${d.episodes.length} 条案例已就绪，可以开始演示`))
    .catch((e) => console.error('[api] ⚠️ 预热失败（不影响启动，首次请求会重试）:', (e as Error).message));
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    console.error(`[api] 收到 ${sig}，关闭服务`);
    server.close(() => process.exit(0));
  });
}

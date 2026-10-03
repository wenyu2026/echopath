/**
 * EchoPath 云端部署入口（单进程 / 单端口）
 * ============================================
 * 为什么需要这个文件：
 *   本地跑法是「后端 3100 + 前端 7200」两个进程、两个端口。
 *   但 PaaS（Render / Railway / Fly.io / Zeabur 等）通常只给一个端口、
 *   只允许一个 Web 进程，所以这里把两件事合到一个进程里：
 *
 *     ① 静态托管 frontend/  （index.html / app.js / styles.css）
 *     ② 直接挂载后端 API    （复用 server/api.ts 的 HTTP handler 逻辑）
 *
 * 环境变量（云端在平台面板里配，不要提交 .env）：
 *   PORT                由平台注入，本地缺省 3000
 *   TOKENDANCE_API_KEY  必填，否则 AI 访谈不可用
 *
 * 本地自测：
 *   node --env-file=.env deploy/server.ts
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, '..');
const FRONTEND_DIR = join(REPO_ROOT, 'frontend');

const PORT = Number(process.env.PORT ?? 3000);
// 关键：必须监听 0.0.0.0，否则平台健康检查连不上
const HOST = process.env.HOST ?? '0.0.0.0';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

/**
 * 后端 handler：api.ts 导出的是同一个 createServer 回调，
 * 这里直接复用，避免复制业务逻辑导致两边不一致。
 */
type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
let apiHandler: Handler | undefined;

async function getApiHandler(): Promise<Handler> {
  if (!apiHandler) {
    const mod = await import('../server/api.ts');
    // api.ts 默认导出一个可供复用的请求处理器
    apiHandler = (mod.default ?? mod.handleRequest) as Handler;
    if (typeof apiHandler !== 'function') {
      throw new Error('server/api.ts 没有导出可复用的请求处理器（default/handleRequest）');
    }
  }
  return apiHandler;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  // ---- API 交给后端 ----
  if (url.pathname.startsWith('/api/')) {
    try {
      const handler = await getApiHandler();
      await handler(req, res);
    } catch (e) {
      console.error('[deploy] API 处理失败:', (e as Error).message);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: { code: 'API_FAILED', message: (e as Error).message } }));
      }
    }
    return;
  }

  // ---- 静态文件 ----
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (p === '' || p === '.') p = 'index.html';
  const file = join(FRONTEND_DIR, p);

  // 防目录穿越
  if (!file.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }

  try {
    const buf = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[deploy] EchoPath 已启动: http://${HOST}:${PORT}`);
  console.log(`[deploy] 静态目录: ${FRONTEND_DIR}`);
  console.log(`[deploy] Key 配置: ${process.env.TOKENDANCE_API_KEY ? '已配置' : '未配置（AI 访谈不可用）'}`);
});

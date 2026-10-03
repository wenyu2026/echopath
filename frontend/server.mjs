#!/usr/bin/env node
/**
 * EchoPath Demo 预览服务器（零依赖）
 * ============================================
 * ① 静态托管本目录（index.html / styles.css / app.js）
 * ② 把 /api/* 代理到 EchoPath 后端（默认 http://localhost:3000）
 *
 * 用法：npm run dev [-- --port 7100 --host 127.0.0.1]
 * 环境变量：ECHOPATH_API 可改代理目标（如 http://localhost:3100）
 */
import { createServer, request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const API_TARGET = process.env.ECHOPATH_API || 'http://localhost:3000';

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
}
const PORT = Number(arg('port', process.env.PORT || 7100));
const HOST = arg('host', '127.0.0.1');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${HOST}:${PORT}`);

  /* /api/* → 代理到后端 */
  if (url.pathname.startsWith('/api/')) {
    const target = new URL(url.pathname + url.search, API_TARGET);
    const proxy = request(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (pr) => {
      res.writeHead(pr.statusCode ?? 502, pr.headers);
      pr.pipe(res);
    });
    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: { code: 'BACKEND_DOWN', message: `代理失败：后端没在 ${API_TARGET} 听着（在 xuejun-hackathon 里 npm run server）` } }));
    });
    req.pipe(proxy);
    return;
  }

  /* 静态文件 */
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  if (p === '' || p === '.') p = 'index.html';
  const file = join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  readFile(file)
    .then((buf) => {
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
      res.end(buf);
    })
    .catch(() => { res.writeHead(404); res.end('Not Found'); });
});

server.listen(PORT, HOST, () => {
  console.log(`[echopath-demo] http://${HOST}:${PORT}  （/api → ${API_TARGET}）`);
});

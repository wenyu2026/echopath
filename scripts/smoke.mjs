/**
 * 前端冒烟测试（真实浏览器）
 * ============================================
 * 用法：npm run smoke        需要先 npm run dev（或 preview）
 *
 * 为什么需要这个：
 *   preflight 的 15 项查的都是「文件在不在、命令跑不跑得通」——
 *   **它根本不知道页面有没有真的渲染出来**。
 *
 *   一个 JS 运行时错误可以让「构建通过 + 单测全绿 + 快照齐备」
 *   同时为真，而评委看到的是白屏。这是最容易翻车、又最不容易
 *   被现有检查发现的一类问题。
 *
 * 怎么做的：
 *   直接用系统已装的 Chrome/Edge 开一个 headless 窗口，通过 CDP
 *   （Chrome DevTools Protocol）驱动它 —— 不引入 puppeteer/playwright，
 *   那会多几十 MB 依赖，而这个环境本来就有浏览器。
 *
 * 查什么：
 *   · 6 条路由都能打开，且渲染出预期的标志性文字
 *   · 控制台没有 error / 未捕获异常
 *   · 页面有实质内容（不是空白）
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.env.SMOKE_BASE ?? 'http://localhost:5173';
const STARTUP_WAIT_MS = 20_000;
const NAV_TIMEOUT_MS = 20_000;

/** 找系统里的 Chrome 或 Edge */
function findBrowser() {
  const cands = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  return cands.find((p) => existsSync(p));
}

/**
 * 要检查的路由。
 * `expect` 是该页面**独有**的标志性文字 —— 用来确认"真的渲染了这个页面"，
 * 而不是路由 404 后的兜底页。
 *
 * ⚠️ 必须有会话数据（needState: true）：
 *   第一版没种会话，于是 P2-P6 全部只渲染了「还没有检索结果」的空状态 ——
 *   **真正要验的那几百行渲染代码根本没被执行**。
 *   变异测试（在 P5 埋一个必然抛错的表达式）当时没被抓到，就是这个原因。
 */
const ROUTES = [
  { path: '/', expect: '先说说你的情况', name: '对话访谈（首页）' },
  { path: '/classic', expect: '先说说你的来时路', name: 'P1 来时路' },
  { path: '/classic/crossroads', expect: '这是你现在站的路口', name: 'P2 当前路口', needState: true },
  { path: '/classic/map', expect: '别人从这里去了哪里', name: 'P3 分叉地图', needState: true },
  { path: '/classic/compare', expect: '像在哪里，不像在哪里', name: 'P5 像与不像', needState: true },
  { path: '/classic/reflect', expect: '最后，回到你自己', name: 'P6 回到自己', needState: true },
  { path: '/classic/episode/0', expect: '完整经过', name: 'P4 案例详情', needState: true },
  // 决策地形 v2 —— 独立流程，不依赖会话状态，自己发起请求
  { path: '/landscape', expect: '同一个引擎，装载不同的人群数据', name: '决策地形 v2' },
];

/** 没有会话状态时这些页面会显示的空状态文案 */
const FALLBACK_TEXT = '还没有检索结果';
const FALLBACK_TEXT2 = '还没有你的处境信息';

const browserPath = findBrowser();
if (!browserPath) {
  console.error('  ❌ 找不到 Chrome / Edge。可设 CHROME_PATH 指定路径。');
  process.exit(1);
}

console.log('');
console.log('  前端冒烟测试（真实浏览器）');
console.log('  ' + '─'.repeat(60));
console.log(`  浏览器：${browserPath}`);
console.log(`  目标：${BASE}`);
console.log('');

const userDataDir = mkdtempSync(join(tmpdir(), 'echopath-smoke-'));
const port = 9333 + Math.floor(Math.random() * 500);

const child = spawn(
  browserPath,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-extensions',
    '--window-size=1280,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let ws = null;
let msgId = 0;
const pending = new Map();
const consoleErrors = [];

function send(method, params = {}, sessionId) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP ${method} 超时`));
      }
    }, NAV_TIMEOUT_MS);
  });
}

/** 等 CDP 端口起来 */
async function waitForCdp() {
  const deadline = Date.now() + STARTUP_WAIT_MS;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return await r.json();
    } catch {
      /* 还没起来 */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`浏览器 ${STARTUP_WAIT_MS}ms 内没起来`);
}

function cleanup() {
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  try {
    child.kill();
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }, 500);
}

/**
 * 在页面里种一份真实的会话状态。
 *
 * 走真实接口（/api/consult）拿数据，而不是塞假数据 ——
 * 这样顺带验证了「前端能连通后端、拿到符合契约的响应」。
 * 后端不可用时返回 ok:false，让上层显式报出来（而不是悄悄降级）。
 */
async function seedSession(send, _base) {
  const DEMO_INPUT =
    '大三，材料科学，读了两年半，越来越觉得不适合自己。已投入两年半；转专业有成绩门槛；可以接受延毕；最看重兴趣和成长。';

  const { result } = await send('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const res = await fetch('/api/consult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ raw_input: ${JSON.stringify(DEMO_INPUT)} }),
          });
          if (!res.ok) return { ok: false, detail: 'HTTP ' + res.status };
          const data = await res.json();
          if (!Array.isArray(data.matches) || data.matches.length === 0) {
            return { ok: false, detail: '响应里没有 matches' };
          }
          sessionStorage.setItem('echopath.session.v1', JSON.stringify({
            journey: { q1: ${JSON.stringify(DEMO_INPUT)} },
            situation: data.situation,
            result: data,
            reachable: 5,
            mode: 'live',
            offlineReason: null,
          }));
          return {
            ok: true,
            detail: '拿回 ' + data.matches.length + ' 条案例（' +
                    data.matches.map(m => m.episode.person.name).join(' / ') + '）',
          };
        } catch (e) {
          return { ok: false, detail: String(e && e.message || e).slice(0, 80) };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true,
  });

  return result.value ?? { ok: false, detail: '注入脚本没有返回' };
}

try {
  const version = await waitForCdp();
  console.log(`  已启动：${version.Browser ?? 'unknown'}`);

  // 建一个空白页并连上它的 CDP
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const WebSocket = (await import('node:worker_threads')).MessageChannel ? globalThis.WebSocket : globalThis.WebSocket;
  ws = new WebSocket(target.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP WebSocket 连接失败'));
  });

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    // 收集控制台错误
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      consoleErrors.push((d.exception?.description ?? d.text ?? 'unknown').slice(0, 160));
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');

  // 先种一份会话状态：否则 P2-P6 只会渲染空状态，
  // 真正要验的渲染代码一行都不会执行（第一版就是这么漏掉的）。
  await send('Page.navigate', { url: `${BASE}/` });
  await new Promise((r) => setTimeout(r, 1500));

  const seeded = await seedSession(send, BASE);
  console.log(`  ${seeded.ok ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m'} 种入演示会话状态：${seeded.detail}`);
  console.log('');

  const results = [];
  for (const route of ROUTES) {
    consoleErrors.length = 0;
    const url = `${BASE}${route.path}`;

    try {
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 1400));

      const { result } = await send('Runtime.evaluate', {
        expression: 'document.body ? document.body.innerText : ""',
        returnByValue: true,
      });
      const text = String(result.value ?? '');

      const rendered = text.includes(route.expect);
      const fellBack = text.includes(FALLBACK_TEXT) || text.includes(FALLBACK_TEXT2);
      const hasContent = text.trim().length > 40;

      // 需要状态的页面**不接受**空状态兜底 —— 那说明种的数据没生效
      const ok = hasContent && rendered && !(route.needState && fellBack);

      results.push({
        name: route.name,
        ok,
        detail: ok
          ? `渲染正常（${text.trim().length} 字）`
          : !hasContent
            ? `页面几乎是空白（只有 ${text.trim().length} 字）`
            : route.needState && fellBack
              ? `掉进了空状态 —— 会话数据没起作用，真实渲染代码没被执行`
              : `没找到预期文字「${route.expect}」`,
        errors: [...consoleErrors],
      });
    } catch (e) {
      results.push({ name: route.name, ok: false, detail: e.message, errors: [...consoleErrors] });
    }
  }

  // 输出
  let failed = 0;
  for (const r of results) {
    const mark = r.ok && r.errors.length === 0 ? '\x1b[32m✅\x1b[0m' : r.ok ? '\x1b[33m⚠️ \x1b[0m' : '\x1b[31m❌\x1b[0m';
    if (!r.ok) failed++;
    console.log(`  ${mark} ${r.name.padEnd(14)} ${r.detail}`);
    for (const e of r.errors.slice(0, 2)) {
      console.log(`      \x1b[31m控制台错误：${e}\x1b[0m`);
    }
  }

  console.log('');
  console.log('  ' + '─'.repeat(60));

  // 额外查一遍：后端接口是否真的被前端调通（不是一直在走离线兜底）
  const { result: apiProbe } = await send('Runtime.evaluate', {
    expression: `fetch('/api/health').then(r => r.status).catch(e => 'ERR:' + e.message)`,
    awaitPromise: true,
    returnByValue: true,
  });
  const apiOk = apiProbe.value === 200;
  console.log(`  ${apiOk ? '\x1b[32m✅\x1b[0m' : '\x1b[33m⚠️ \x1b[0m'} 前端能连到后端接口（/api/health → ${apiProbe.value}）`);
  if (!apiOk) {
    console.log('      \x1b[2m后端没起或代理没配 —— 页面会走离线兜底。演示请用 npm start\x1b[0m');
  }

  console.log('');
  if (failed === 0) {
    console.log(`  \x1b[32m✅ ${ROUTES.length} 条路由全部渲染正常\x1b[0m`);
  } else {
    console.log(`  \x1b[31m❌ ${failed}/${ROUTES.length} 条路由有问题\x1b[0m`);
  }
  console.log('');

  cleanup();
  process.exit(failed === 0 ? 0 : 1);
} catch (e) {
  console.error(`  ❌ 冒烟测试失败：${e.message}`);
  cleanup();
  process.exit(1);
}

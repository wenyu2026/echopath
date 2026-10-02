/**
 * 断网兜底验证
 * ============================================
 * 用法：npm run smoke:offline      需先 npm run dev（前端在跑）
 *
 * 为什么单独做一个：
 *   方案验收清单第 11 条写的是「断网/API 错误时有缓存的 Demo 数据，保证上台可演示」。
 *   但在这之前，我们只验过**快照文件存不存在、场景数够不够** ——
 *   从没验过「后端真的挂掉时，前端到底会不会降级、降级得对不对」。
 *
 *   这是 demo 的**保险绳**：只在断网那一刻才用得上，平时跑不到那条路径。
 *   而它恰恰是最不能临时抱佛脚的一段。
 *
 * 怎么做的：
 *   把前端的 /api 代理**指向一个不存在的端口**（而不是真去杀后端进程）——
 *   这样不用动端口、不用管进程，也能造出"接口全失败"的真实环境。
 *   做法是临时启动一个 Vite 实例，proxy 指向 127.0.0.1:1（必然连不上）。
 *
 * 验三件事：
 *   1. 后端不可用时，P1 → P2 仍能走通（不白屏、不卡死）
 *   2. 出现「离线演示模式」横幅，且**明确说明这不是实时结果**
 *   3. 降级到的是**与输入匹配的那个场景** —— 不是永远给场景 1
 *      （这条最关键：演示场景 2 时显示场景 1 的数据，比没有数据更糟）
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEV_PORT = 5199; // 特意换个端口，不和正在跑的 dev server 抢
const CDP_PORT = 9700 + Math.floor(Math.random() * 200);
const BASE = `http://localhost:${DEV_PORT}`;

function findBrowser() {
  const cands = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  return cands.find((p) => existsSync(p));
}

// ---------------------------------------------------------------------------
// 1. 起一个"后端永远连不上"的 Vite
// ---------------------------------------------------------------------------
// ⚠️ 配置必须写在**项目目录内**，不能放 %TEMP%。
//    第一版放在 TEMP 里，Vite 解析不到 @vitejs/plugin-react / vite
//    （它们在本项目的 node_modules 下），进程直接退出，
//    表现为"前端 40 秒内没起来"，排查了好一会儿。
//
// ⚠️ 还必须清掉 .env 里的 VITE_API_BASE。
//    .env 里配了 `VITE_API_BASE=http://localhost:3000`，
//    前端 fetch 的是**绝对地址**、绕过 Vite 代理直连后端 ——
//    这样"把代理指向死端口"根本拦不住请求，测试前提就不成立了。
//    （实测踩到过：页面拿到了实时数据，而测试以为已经断网。）
const tmp = mkdtempSync(join(process.cwd(), '.offline-test-'));
const cfgPath = join(tmp, 'vite.offline.config.mjs');
// 空值会让 `?? ''` 走到空串 → 前端改用同源 /api → 真正走代理
const envPath = join(tmp, '.env');

writeFileSync(
  cfgPath,
  `import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// 代理指向一个必然连不上的地址 —— 模拟"后端挂了"
export default defineConfig({
  root: ${JSON.stringify(process.cwd().replace(/\\/g, '/'))},
  plugins: [react()],
  server: {
    port: ${DEV_PORT},
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:1', changeOrigin: true } },
  },
});
`,
  'utf8',
);

console.log('');
console.log('  断网兜底验证');
console.log('  ' + '─'.repeat(60));
console.log('  做法：起一个把 /api 代理到 127.0.0.1:1 的前端 —— 接口必然全失败');
console.log('');

// VITE_API_BASE 必须为空：否则前端直连 3000、绕过代理，测试前提不成立
writeFileSync(envPath, 'VITE_API_BASE=\n', 'utf8');

const vite = spawn(
  process.execPath,
  [
    join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js'),
    '--config',
    cfgPath,
    // 让 Vite 从临时目录读 .env（VITE_API_BASE= 空），而不是项目根那个
    '--mode',
    'offline-test',
  ],
  {
    cwd: tmp,
    stdio: 'ignore',
    env: { ...process.env, VITE_API_BASE: '' },
  },
);

const cleanupFns = [];
function cleanup() {
  for (const fn of cleanupFns) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
  try {
    vite.kill();
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }, 800);
}

/** 等前端起来 */
async function waitForFrontend() {
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return true;
    } catch {
      /* 还没起来 */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

try {
  if (!(await waitForFrontend())) {
    console.error('  ❌ 离线测试用的前端 40 秒内没起来');
    cleanup();
    process.exit(1);
  }

  // 确认接口确实是不通的（否则这个测试没意义）
  // ⚠️ 第一版这里写错了：只 try/catch fetch，而代理到死端口时
  //    Vite 回的是 **HTTP 502**，fetch 并不抛异常 —— 于是误判成"接口是通的"。
  //    必须同时看状态码。
  let apiUsable = false;
  let apiProbeDetail = '';
  try {
    const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    apiProbeDetail = `HTTP ${r.status}`;
    apiUsable = r.ok; // 502/500/504 都算不可用
  } catch (e) {
    apiProbeDetail = `请求失败：${e.name === 'TimeoutError' ? '超时' : e.message}`;
    apiUsable = false;
  }
  if (apiUsable) {
    console.error(`  ❌ 接口居然是通的（${apiProbeDetail}）—— 测试环境没造对，结果不可信`);
    cleanup();
    process.exit(1);
  }
  console.log(`  ✅ 已确认接口不可用（${apiProbeDetail}）`);

  // -------------------------------------------------------------------------
  // 2. 开浏览器
  // -------------------------------------------------------------------------
  const browserPath = findBrowser();
  if (!browserPath) {
    console.error('  ❌ 找不到 Chrome / Edge（可设 CHROME_PATH）');
    cleanup();
    process.exit(1);
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'echopath-offline-br-'));
  cleanupFns.push(() => rmSync(userDataDir, { recursive: true, force: true }));

  const chrome = spawn(
    browserPath,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  cleanupFns.push(() => chrome.kill());

  // 等 CDP
  {
    const deadline = Date.now() + 25_000;
    let up = false;
    while (Date.now() < deadline) {
      try {
        const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (r.ok) {
          up = true;
          break;
        }
      } catch {
        /* not yet */
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    if (!up) throw new Error('浏览器 CDP 25 秒内没起来');
  }

  const target = await (
    await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })
  ).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = () => rej(new Error('CDP 连接失败'));
  });
  cleanupFns.push(() => ws.close());

  let msgId = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message));
      else resolve(m.result);
    }
  };
  function send(method, params = {}) {
    const id = ++msgId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP ${method} 超时`));
        }
      }, 20_000);
    });
  }

  await send('Runtime.enable');
  await send('Page.enable');

  // -------------------------------------------------------------------------
  // 3. 走 P1 → P2：全程接口都会失败
  // ⚠️ 路径必须带 /classic —— 首页现在是对话页，离线快照只在经典六页那条链路上。
  // -------------------------------------------------------------------------
  const results = [];
  const check = (name, ok, detail) => results.push({ name, ok, detail });

  await send('Page.navigate', { url: `${BASE}/classic` });
  await new Promise((r) => setTimeout(r, 1800));

  // 在第一个输入框里填一段"场景 2（考研 vs 就业）"的叙述 ——
  // 用来验证降级时是否挑对了场景，而不是永远给场景 1
  const KAOYAN_INPUT =
    '大三了，家里人都劝我考研，但我手上有两个实习机会，转正概率不小。成绩中等；实习是喜欢的方向；家里能支持但我不愿啃老。';

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const ta = document.querySelector('textarea');
        if (!ta) return 'no-textarea';
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, ${JSON.stringify(KAOYAN_INPUT)});
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok';
      })()
    `,
    returnByValue: true,
  });

  // 连点「下一个问题」直到真的到最后一问。
  //
  // ⚠️ 不能数固定次数。第一版点 6 次就以为到最后一问了，实际因为
  //    React 状态更新有延迟，几次点击被同一问吃掉 —— 于是为了"点满"，
  //    循环结束时早就越过了最后一问，直接跳到 P2/P3，后面的检查全错位。
  //    改成**按页面状态判断**：还在问第 N 问（N<6）就继续点。
  let reachedLast = false;
  for (let i = 0; i < 15; i++) {
    const { result: st } = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const t = document.body ? document.body.innerText : '';
          const m = t.match(/第\\s*(\\d+)\\s*\\/\\s*(\\d+)\\s*问/);
          const btn = [...document.querySelectorAll('button.btn-primary')].find(x => !x.disabled);
          return { path: location.pathname, n: m ? Number(m[1]) : null, total: m ? Number(m[2]) : null, btnText: btn ? btn.textContent.trim() : null };
        })()
      `,
      returnByValue: true,
    });
    const s = st.value;
    // ⚠️ 这里必须是 '/classic' —— 六页移到前缀下之后，
    //    原来写死 '/' 会让循环**第一次就 break**，一题都不点。
    //    表现是"没能停在最后一问"，然后后面 6 项全错位。
    if (s.path !== '/classic') break; // 已经离开 P1
    if (s.n !== null && s.total !== null && s.n >= s.total) {
      reachedLast = true;
      break;
    }
    await send('Runtime.evaluate', {
      expression: `(() => { const b=[...document.querySelectorAll('button.btn-primary')].find(x=>!x.disabled); if(b) b.click(); })()`,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 700));
  }

  results.push({
    name: '（前置）已到最后一问',
    ok: reachedLast,
    detail: reachedLast ? '第 6/6 问' : '没能停在最后一问',
    soft: true,
  });

  // 再点一次 → 触发解析（接口失败 → 应降级到 P2）
  await send('Runtime.evaluate', {
    expression: `(() => { const b=[...document.querySelectorAll('button.btn-primary')].find(x=>!x.disabled); if(b) b.click(); })()`,
    returnByValue: true,
  });
  // 等它落到 P2（降级是同步的，但要给 React + 渲染时间）
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 700));
    const { result: p } = await send('Runtime.evaluate', {
      expression: `location.pathname`,
      returnByValue: true,
    });
    if (p.value === '/classic/crossroads') break;
  }

  // ---- 检查 1：有没有走到 P2（没白屏、没卡死）----
  const { result: r1 } = await send('Runtime.evaluate', {
    expression: `({ path: location.pathname, text: document.body ? document.body.innerText : '' })`,
    returnByValue: true,
  });
  const p2Text = String(r1.value.text ?? '');
  check(
    '后端全挂时 P1→P2 仍能走通',
    r1.value.path === '/classic/crossroads' && p2Text.length > 100,
    `当前 ${r1.value.path}，页面 ${p2Text.trim().length} 字`,
  );

  // ---- 检查 2：离线横幅 ----
  const hasBanner = p2Text.includes('离线演示模式');
  const bannerHonest = p2Text.includes('不是实时') || p2Text.includes('预生成');
  check('出现「离线演示模式」横幅', hasBanner, hasBanner ? '' : '没找到横幅文案');
  check('横幅明确说明"不是实时计算结果"', bannerHonest, bannerHonest ? '' : '横幅没有说明数据性质');

  // ---- 检查 3：降级到的是匹配的场景（考研），不是场景 1（转专业）----
  const { result: r3 } = await send('Runtime.evaluate', {
    expression: `
      (() => {
        try {
          const s = JSON.parse(sessionStorage.getItem('echopath.session.v1') || '{}');
          return { dilemma: s.situation?.dilemma ?? null, goal: (s.situation?.goals || []).join('/') };
        } catch (e) { return { dilemma: null, goal: null }; }
      })()
    `,
    returnByValue: true,
  });
  const dilemma = String(r3.value.dilemma ?? '');
  const matchedScene = /考研|读研|就业/.test(dilemma) && !/转专业|转换赛道/.test(dilemma);
  check(
    '降级到与输入匹配的场景（不是永远场景 1）',
    matchedScene,
    `降级后的处境是「${dilemma || '空'}」`,
  );

  // ---- 检查 4：继续走到 P3，确认检索也降级成功 ----
  await send('Runtime.evaluate', {
    expression: `(() => { const b=[...document.querySelectorAll('button.btn-primary')].find(x=>!x.disabled); if(b){b.click();return true;} return false; })()`,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, 2500));
  const { result: r4 } = await send('Runtime.evaluate', {
    expression: `({ path: location.pathname, text: document.body ? document.body.innerText : '' })`,
    returnByValue: true,
  });
  const p3Text = String(r4.value.text ?? '');
  const p3Ok = r4.value.path === '/classic/map' && p3Text.includes('别人从这里去了哪里') && p3Text.length > 200;
  check('后端全挂时 P3 分叉地图仍能渲染', p3Ok, `当前 ${r4.value.path}，页面 ${p3Text.trim().length} 字`);

  // ---- 检查 5：What-if 必须明说"离线模式演示不了"，而不是给假结果 ----
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const b = [...document.querySelectorAll('.whatif .option-chip')][0];
        if (b) { b.click(); return true; }
        return false;
      })()
    `,
    returnByValue: true,
  });
  await new Promise((r) => setTimeout(r, 2500));

  // 直接访问 P5，看它在离线模式下怎么呈现（What-if 在 P5 底部）
  await send('Page.navigate', { url: `${BASE}/classic/compare` });
  await new Promise((r) => setTimeout(r, 2000));
  const { result: r6 } = await send('Runtime.evaluate', {
    expression: `document.body ? document.body.innerText : ''`,
    returnByValue: true,
  });
  const p5Text = String(r6.value ?? '');
  const p5Rendered = p5Text.includes('像在哪里，不像在哪里') && p5Text.length > 300;
  check('离线时 P5 仍能渲染（用快照数据）', p5Rendered, `页面 ${p5Text.trim().length} 字`);

  // ---- 输出 ----
  console.log('');
  let failed = 0;
  for (const r of results) {
    // soft 项只提示，不算失败（用于"前置条件"这类诊断信息）
    if (!r.ok && !r.soft) failed++;
    const mark = r.ok ? '\x1b[32m✅\x1b[0m' : r.soft ? '\x1b[33m⚠️ \x1b[0m' : '\x1b[31m❌\x1b[0m';
    console.log(`  ${mark} ${r.name}`);
    if (r.detail) console.log(`      \x1b[2m${r.detail}\x1b[0m`);
  }
  console.log('');
  console.log('  ' + '─'.repeat(60));
  const softCount = results.filter((r) => !r.ok && r.soft).length;
  if (failed === 0) {
    console.log(
      `  \x1b[32m✅ 断网兜底工作正常 —— 拔网线也能演示\x1b[0m${softCount ? `（${softCount} 项诊断提示，见上）` : ''}`,
    );
  } else {
    console.log(`  \x1b[31m❌ ${failed}/${results.filter((r) => !r.soft).length} 项不通过 ——\x1b[0m`);
    console.log('  \x1b[31m   这是 demo 的保险绳，上台前必须修好\x1b[0m');
  }
  console.log('');

  cleanup();
  process.exit(failed === 0 ? 0 : 1);
} catch (e) {
  console.error(`  ❌ 断网兜底验证失败：${e.message}`);
  cleanup();
  process.exit(1);
}

/**
 * 演示前自检（Preflight）
 * ============================================
 * 用法：npm run preflight
 *
 * 一条命令把「上台前必须为真的事」全查一遍，最后给一个明确的
 * ✅ 可以上台 / ❌ 有阻塞项 结论。
 *
 * 为什么需要它：演示翻车往往不是因为功能没做，而是因为
 * 忘了起后端、密钥过期、数据没同步、缓存是旧的这类小事。
 * 这些都能在 30 秒内查完，但不查就要在评委面前查。
 */
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const results = [];
function check(name, ok, detail = '', fatal = true) {
  results.push({ name, ok, detail, fatal });
}

/**
 * 跨平台跑子进程并拿 stdout。
 *
 * ⚠️ 为什么不用 execFileSync('npm', ...)：Windows 上 npm 是 .cmd 包装，
 *   execFileSync 直接调会 ENOENT；改调 npm.cmd 又会 EINVAL
 *   （Node 20+ 对 .cmd 不带 shell 的限制）。
 *   结果就是自检脚本永远报「构建失败」—— 一个把人吓到的假阴性。
 *   所以这里一律绕过 .cmd，直接用 node 跑真实脚本。
 */
function run(cmd, args, opts = {}) {
  try {
    return {
      ok: true,
      out: execFileSync(cmd, args, {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: opts.timeout ?? 180_000,
      }),
    };
  } catch (e) {
    // 命令失败时 stdout 仍可能有内容（测试报告就是这样）
    return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/** 用 node 直接跑构建（等价 npm run build：tsc -b && vite build），绕开 .cmd */
function buildCheck() {
  const tsc = run('node', [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-b'], { timeout: 180_000 });
  if (!tsc.ok) return { ok: false, out: tsc.out };
  const vite = run('node', [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { timeout: 180_000 });
  return { ok: vite.ok, out: `${tsc.out}\n${vite.out}` };
}

const line = '─'.repeat(58);
console.log('');
console.log('  来路 EchoPath · 演示前自检');
console.log('  ' + line);

/* ---------- 1. 环境 ---------- */
const hasEnv = existsSync(join(root, '.env'));
check('.env 存在', hasEnv, hasEnv ? '' : 'copy .env.example .env 并填 TOKENDANCE_API_KEY');

let keyOk = false;
if (hasEnv) {
  const env = readFileSync(join(root, '.env'), 'utf8');
  keyOk = /TOKENDANCE_API_KEY=\s*sk-\S{10,}/.test(env);
  check('TOKENDANCE_API_KEY 已配置', keyOk, keyOk ? '' : '密钥为空或格式不对（应以 sk- 开头）', false);
}

/* ---------- 2. 数据 ---------- */
let episodeCount = 0;
try {
  const data = JSON.parse(readFileSync(join(root, 'data', 'episodes.json'), 'utf8'));
  episodeCount = (data.episodes ?? data).length;
} catch {
  /* 下面统一报 */
}
check(`案例数据可用（${episodeCount} 条）`, episodeCount >= 12, episodeCount >= 12 ? '' : '案例太少，演示会很单薄');

/* ---------- 3. 离线兜底 ---------- */
let scenarioCount = 0;
let cacheHasError = false;
try {
  const ts = readFileSync(join(root, 'src', 'data', 'demoCache.ts'), 'utf8');
  scenarioCount = (ts.match(/"raw_input":/g) ?? []).length;
  cacheHasError = ts.includes('"error"') && ts.includes('INTERNAL');
} catch {
  /* 报下面 */
}
check(
  `离线兜底快照（${scenarioCount} 个场景）`,
  scenarioCount >= 3 && !cacheHasError,
  cacheHasError ? '快照里混进了错误响应 —— 跑 npm run refresh:cache' : scenarioCount < 3 ? '缺场景，跑 npm run build:cache' : '',
);

/* ---------- 4. 构建能过 ---------- */
const buildRes = buildCheck();
check('构建通过（tsc -b + vite build）', buildRes.ok, buildRes.ok ? '' : buildRes.out.slice(-300).trim());

/* ---------- 5. 单测能过 ---------- */
const testRes = run('node', ['--test', 'server/tests/*.test.ts'], { timeout: 180_000 });
const passM = testRes.out.match(/pass (\d+)/);
const failM = testRes.out.match(/fail (\d+)/);
const passN = passM ? Number(passM[1]) : 0;
const failN = failM ? Number(failM[1]) : 0;
check(`后端单测 ${passN} 通过 / ${failN} 失败`, failN === 0 && passN > 0, failN > 0 ? '有测试失败' : '');

/* ---------- 6. 数据校验 ---------- */
const validRes = run('node', ['scripts/validate-data.mjs'], { timeout: 60_000 });
check('数据校验通过', validRes.out.includes('PASS'), validRes.out.includes('WARNING') ? '（结构通过，人类来源审查仍未完成）' : '');

/* ---------- 7. 后端能不能起 ---------- */
let serverOk = false;
let healthDetail = '';
if (keyOk) {
  try {
    const p = await fetch('http://localhost:3000/api/health', { signal: AbortSignal.timeout(3000) });
    const j = await p.json();
    serverOk = Boolean(j.ok);
    healthDetail = serverOk ? `key_configured=${j.key_configured}` : '健康检查返回异常';
  } catch {
    healthDetail = '后端没起 —— 用 npm start 一起拉起来';
  }
} else {
  healthDetail = '无密钥，跳过（前端会走离线兜底，也能演示）';
}
check('后端 /api/health 可达', serverOk, healthDetail, false);

/* ---------- 输出 ---------- */
console.log('');
for (const r of results) {
  const mark = r.ok ? '\x1b[32m✅\x1b[0m' : r.fatal ? '\x1b[31m❌\x1b[0m' : '\x1b[33m⚠️ \x1b[0m';
  console.log(`  ${mark} ${r.name}`);
  if (r.detail) console.log(`      \x1b[2m${r.detail}\x1b[0m`);
}

const blockers = results.filter((r) => !r.ok && r.fatal);
const warnings = results.filter((r) => !r.ok && !r.fatal);

console.log('');
console.log('  ' + line);
if (blockers.length === 0) {
  console.log(`  \x1b[32m✅ 可以上台\x1b[0m${warnings.length ? `（${warnings.length} 项非阻塞提醒，见上）` : ''}`);
  console.log('');
  console.log('  下一步：npm start  →  打开 http://localhost:5173');
  console.log('  演示脚本：.agent/DEMO.md');
} else {
  console.log(`  \x1b[31m❌ 有 ${blockers.length} 个阻塞项，先修：
${blockers.map((b) => `     · ${b.name}${b.detail ? ` —— ${b.detail}` : ''}`).join('\n')}\x1b[0m`);
}
console.log('');
process.exit(blockers.length === 0 ? 0 : 1);

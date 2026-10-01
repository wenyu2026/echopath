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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, relative } from 'node:path';

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

/** 扫描时要跳过的目录（多处复用，放模块级） */
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.vite']);
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

/* ---------- 4. 离线快照是否比逻辑代码旧 / 三份是否一致 ---------- */
// 踩过两次：
//  ① 改了 dimensions.ts 的维度算法后忘了重生成快照 →
//     「实时」与「离线」两条路径给出不同分数，评委一对比就露馅。
//  ② refresh 中途某个 demo 失败 → fixture 目录里留下「一半新、一半旧」，
//     而按 mtime 只看最新那个会误判成"是新的"。
//     混着两代数据的快照比全旧更危险，因为看不出来。
{
  const watch = [
    join(root, 'server', 'retrieval', 'dimensions.ts'),
    join(root, 'server', 'retrieval', 'diversity.ts'),
    join(root, 'server', 'counter-analogy', 'counter-analogy.ts'),
    join(root, 'server', 'evidence', 'evidence-writer.ts'),
    join(root, 'data', 'episodes.json'),
  ];
  const inputs = JSON.parse(readFileSync(join(root, 'server', 'fixtures', 'demo-inputs.json'), 'utf8'));
  const fixturePaths = inputs.demos.map((d) => join(root, 'server', 'fixtures', `demo-cache-${d.id}.json`));
  const cacheTs = join(root, 'src', 'data', 'demoCache.ts');

  // 4a) 三份 fixture 的 mtime 是否一致（生成过就算跨秒，容差 5 秒）
  let spread = 0;
  const existing = fixturePaths.filter((f) => existsSync(f));
  if (existing.length >= 2) {
    const times = existing.map((f) => statSync(f).mtimeMs);
    spread = Math.max(...times) - Math.min(...times);
  }
  check(
    '三份离线快照是同一批生成的',
    spread <= 5000,
    spread > 5000
      ? `三份 fixture 时间差 ${Math.round(spread / 1000)}s —— 可能上次 refresh 中途失败了，跑 npm run refresh:cache 重来`
      : '',
  );

  // 4b) 快照是否比逻辑代码旧
  let stale = '';
  if (existsSync(cacheTs)) {
    const cacheTime = statSync(cacheTs).mtimeMs;
    for (const f of watch) {
      if (existsSync(f) && statSync(f).mtimeMs > cacheTime) {
        stale = `${basename(f)} 比快照新`;
        break;
      }
    }
  }
  check(
    '离线快照不比逻辑代码旧',
    !stale,
    stale ? `${stale} —— 跑 npm run refresh:cache 重新生成（需后端在跑）` : '',
  );
}

/* ---------- 5. 来源链接完整性（离线检查，不发网络请求） ---------- */
// 只查「引用是否悬空」——真发请求的链接体检是 npm run check:sources，
// 那个要几十秒，不适合放进 30 秒自检。
{
  let dangling = 0;
  let noUrl = 0;
  let total = 0;
  try {
    const srcs = JSON.parse(readFileSync(join(root, 'data', 'sources.json'), 'utf8'));
    const list = Array.isArray(srcs) ? srcs : srcs.sources;
    const ids = new Map(list.map((s) => [s.source_id, s.url]));
    for (const s of list) if (!s.url) noUrl++;

    const eps = JSON.parse(readFileSync(join(root, 'data', 'episodes.json'), 'utf8'));
    const arr = Array.isArray(eps) ? eps : eps.episodes;
    // 归一化：null / undefined / '' 视为同一个「无 url」——
    // 否则 AI 推断类的 evidence（两侧都没有 url）会被误报成不一致
    const norm = (u) => (u == null ? '' : String(u).trim());
    for (const e of arr) {
      for (const ev of e.evidence ?? []) {
        total++;
        if (!ev.source_id) continue;
        if (!ids.has(ev.source_id)) dangling++;
        else if (norm(ids.get(ev.source_id)) !== norm(ev.url)) dangling++;
      }
    }
  } catch {
    dangling = -1;
  }

  check(
    `来源引用完整（${total} 条 evidence）`,
    dangling === 0,
    dangling === -1
      ? '读取 data/sources.json 或 data/episodes.json 失败'
      : dangling > 0
        ? `有 ${dangling} 条 evidence 的 source_id 或 url 与 sources.json 不一致 —— 跑 npm run validate:data 看详情`
        : noUrl > 0
          ? `（有 ${noUrl} 条来源没有 url，属正常：AI 推断类不需要）`
          : '',
  );
}

/* ---------- 6. 中文文件有没有被写成乱码 ---------- */
// 踩过一次：用 PowerShell 的 Get-Content -Raw（按 GBK 读）+ WriteAllText（按 UTF-8 写）
// 改中文 Markdown，整份文件变成「楠屾敹鎶ュ憡」这种乱码，而且**已经提交进去了**。
// 这类损坏是静默的：文件仍是合法 UTF-8，工具不报错，只有人看才发现。
// 所以在自检里加一道扫描。
{
  const MARKERS = ['锛', '鐨', '涓€', '鏄', '鍜', '锟斤拷', '鎴戜', '鏂囦', '鈥', '楠屾'];
  const SCAN_EXT = ['.md', '.ts', '.tsx', '.mjs', '.json', '.html', '.css'];
  // 本文件自己含这些特征字符（就是上面这行字面量）—— 必须跳过，否则自检永远不过
  const SELF = relative(root, fileURLToPath(import.meta.url)).replace(/\\/g, '/');
  const offenders = [];

  const walk = (dir, depth = 0) => {
    if (depth > 6) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), depth + 1);
        continue;
      }
      if (!SCAN_EXT.some((x) => e.name.endsWith(x))) continue;
      const p = join(dir, e.name);
      const rel = relative(root, p).replace(/\\/g, '/');
      if (rel === SELF) continue; // 跳过自己（含特征字符字面量）
      let text;
      try {
        text = readFileSync(p, 'utf8');
      } catch {
        offenders.push(`${rel}（不是合法 UTF-8）`);
        continue;
      }
      const hits = MARKERS.reduce((n, m) => n + text.split(m).length - 1, 0);
      if (hits >= 3) offenders.push(`${rel}（${hits} 处乱码特征）`);
    }
  };
  walk(root);

  check(
    '中文文件未出现乱码',
    offenders.length === 0,
    offenders.length > 0
      ? `疑似被 PowerShell 按 GBK 读写毁掉：${offenders.slice(0, 3).join(' / ')} —— 从 git 恢复或重写`
      : '',
  );
}

/* ---------- 7. 文案红线：不得出现「替用户做决定」的表述 ---------- */
// 这是产品最核心的伦理主张（方案第 17 节），也是最容易被后人无意破坏的一条 ——
// 比如随手加了句「建议你先做低成本验证」。
// 后端已有 output-guard 在生成时拦截，这里查的是**写死在前端代码里的文案**。
{
  const BAD = ['你应该', '你最好', '建议你', '我推荐你', '最优选择', '正确选择', '最好的选择'];
  const hits = [];
  const walkDir = (dir, depth = 0) => {
    if (depth > 6) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walkDir(p, depth + 1);
        continue;
      }
      if (!/\.(tsx?|md)$/.test(e.name)) continue;
      let text;
      try {
        text = readFileSync(p, 'utf8');
      } catch {
        continue;
      }
      text.split('\n').forEach((line, i) => {
        const s = line.trim();
        // 注释里写「本页绝不出现你应该选择 X」是说明，不算违规
        if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*') || s.startsWith('#')) return;
        for (const b of BAD) {
          if (line.includes(b)) hits.push(`${relative(root, p)}:${i + 1} 「${b}」`);
        }
      });
    }
  };
  walkDir(join(root, 'src'));

  check(
    '文案红线：无处方指令（你应该/建议你…）',
    hits.length === 0,
    hits.length > 0
      ? `产品主张「不替用户做决定」，这些文案违反了：${hits.slice(0, 3).join(' / ')}`
      : '',
  );
}

/* ---------- 8. README 里写的命令必须真实存在 ---------- */
// 踩过一次：README 的快速开始写的是 `npm run dev`，而它**只启前端、不带后端**，
// 照做的人会得到"接口全失败、走离线兜底"的奇怪状态。
// 文档过期比没文档更坑 —— 没文档人会问，过期文档人会照做。
{
  let issues = [];
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const scripts = new Set(Object.keys(pkg.scripts ?? {}));
    const readme = readFileSync(join(root, 'README.md'), 'utf8');

    // ⚠️ 字符类必须含 `-`：脚本名里常有连字符（refresh:cache / validate:data）。
    //    第一版写成 [a-z:]+，于是 "preflight-typo" 会被截成 "preflight" ——
    //    变异测试时漏报了，加 `-` 之后才抓得住。
    const NAME = '[a-z][a-z:-]*';
    const usedRun = new Set([...readme.matchAll(new RegExp(`npm run (${NAME})`, 'g'))].map((m) => m[1]));
    const usedDirect = new Set([...readme.matchAll(/npm (start|test)\b/g)].map((m) => m[1]));

    for (const s of usedRun) {
      if (!scripts.has(s)) issues.push(`README 写了 npm run ${s}，但 package.json 里没有`);
    }
    for (const s of usedDirect) {
      if (!scripts.has(s)) issues.push(`README 写了 npm ${s}，但 package.json 里没有`);
    }

    // 反向：实现了但完全没写进 README 的（preview 属于边缘，跳过）
    const documented = new Set([...usedRun, ...usedDirect]);
    for (const s of scripts) {
      if (s !== 'preview' && !documented.has(s)) {
        issues.push(`package.json 有 ${s} 但 README 没提`);
      }
    }
  } catch (e) {
    issues = [`读取 package.json 或 README 失败：${e.message}`];
  }

  check('README 里的命令与 package.json 一致', issues.length === 0, issues.slice(0, 3).join(' / '));
}

/* ---------- 8b. README 里写的自检项数要与实际一致 ---------- */
// 我写完这项检查后自己就踩了一次：README 写「16 项」，实际是 17 项。
// 数字对不上的说明文档在慢慢腐烂 —— 顺手一起查。
{
  let detail = '';
  try {
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    const m = readme.match(/上台前自检\*\*（(\d+)\s*项/);
    const declared = m ? Number(m[1]) : null;
    // 此刻 results 里已有 10 项，本项是第 11 项；后面还有 注册后未跑的几项。
    // 与其自己算，不如数脚本里的 check( 调用总数 —— 那是唯一事实来源。
    const selfSrc = readFileSync(join(root, 'scripts', 'preflight.mjs'), 'utf8');
    const totalChecks = (selfSrc.match(/^\s*check\(/gm) ?? []).length;
    if (declared !== null && declared !== totalChecks) {
      detail = `README 写「${declared} 项」，脚本里实际有 ${totalChecks} 项`;
    }
  } catch {
    /* README 读不到就算了，上面那条已经会报 */
  }
  check('README 的自检项数与实际一致', detail === '', detail);
}

/* ---------- 9. 静态资源不能还留着脚手架自带的痕迹 ---------- */
// 踩过两次：
//   ① public/favicon.svg 一直是 create-vite 自带的紫色 logo（#863bff）
//   ② public/icons.svg 是脚手架带来的社交图标（bluesky 等），5031 字节，**无人引用**
// 这类残留小，但属于典型的「没做完」信号 —— 而且会随构建一起发出去。
{
  const problems = [];

  // 9a. favicon 有没有被换掉
  const favPath = join(root, 'public', 'favicon.svg');
  if (!existsSync(favPath)) {
    problems.push('没有 public/favicon.svg（标签页会 404）');
  } else {
    const svg = readFileSync(favPath, 'utf8');
    const SCAFFOLD_MARKERS = ['863bff', '41d1ff', 'bd34fe'];
    for (const m of SCAFFOLD_MARKERS) {
      if (svg.toLowerCase().includes(m)) {
        problems.push(`favicon 还是脚手架自带的图标（含 #${m}）`);
        break;
      }
    }
    if (svg.length > 6000) {
      problems.push(`favicon 有 ${Math.round(svg.length / 1024)}KB —— 多半是脚手架那个复杂 logo`);
    }
  }

  // 9b. public/ 下有没有无人引用的死文件
  let pubFiles = [];
  try {
    pubFiles = readdirSync(join(root, 'public'), { withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    /* public/ 不存在就算了 */
  }
  if (pubFiles.length > 0) {
    const srcText = (() => {
      let all = readFileSync(join(root, 'index.html'), 'utf8');
      const collect = (dir, depth = 0) => {
        if (depth > 5) return;
        let entries;
        try {
          entries = readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          const p = join(dir, e.name);
          if (e.isDirectory()) {
            if (!SKIP_DIRS.has(e.name)) collect(p, depth + 1);
          } else if (/\.(tsx?|html)$/.test(e.name)) {
            all += readFileSync(p, 'utf8');
          }
        }
      };
      collect(join(root, 'src'));
      return all;
    })();

    for (const f of pubFiles) {
      if (!srcText.includes(f)) problems.push(`public/${f} 无人引用（死文件，会随构建发出去）`);
    }
  }

  check('静态资源无脚手架残留 / 死文件', problems.length === 0, problems.join(' / '));
}

/* ---------- 10. 构建能过 ---------- */const buildRes = buildCheck();
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
// 注意：validator 只要出现 ERROR 就是失败；有 WARNING 仍算通过（只是提醒人工审查未完成）
const validOk = validRes.out.includes('PASS') && !validRes.out.includes('ERROR');
check(
  '数据校验通过',
  validOk,
  !validOk
    ? validRes.out.split('\n').filter((l) => l.includes('ERROR')).slice(0, 3).join(' / ')
    : validRes.out.includes('WARNING')
      ? '（结构通过；人类来源审查仍未完成，见 data/REVIEW.md）'
      : '',
);

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

/* ---------- 10. 前端能不能真的渲染出来（真实浏览器） ---------- */
// ⚠️ 这是 preflight 之前最大的盲区：
//   前面那些检查查的都是「文件在不在、命令跑不跑得通」——
//   **它们根本不知道页面有没有渲染**。
//   一个 JS 运行时错误可以让「构建通过 + 单测全绿 + 快照齐备」同时为真，
//   而评委看到的是白屏。
//
// 只在**后端在跑**时才做（冒烟要调 /api/consult 种真实数据）。
// 后端没起的话前端本来就走离线兜底，此时冒烟测的是另一条路径，容易误报。
if (serverOk) {
  const smoke = run('node', ['scripts/smoke.mjs'], { timeout: 150_000 });
  const lines = smoke.out
    .split('\n')
    .filter((l) => /路由|种入|❌/.test(l))
    .slice(-4)
    .map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').trim())
    .join(' / ');
  check('前端 6 条路由渲染正常（真实浏览器）', smoke.ok, smoke.ok ? '' : lines.slice(0, 320));
} else {
  check('前端 6 条路由渲染正常（真实浏览器）', true, '后端没起，跳过（冒烟需要后端提供真实数据）', false);
}

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

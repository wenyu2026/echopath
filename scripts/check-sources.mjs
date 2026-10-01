/**
 * 来源链接体检（给人类审查减负）
 * ============================================
 * 用法：npm run check:sources   （可选加 --fast 只查 head 请求）
 *
 * 为什么做这个：
 *   data/REVIEW.md 写着「人类审核尚未完成」，这是项目最大的剩余风险 ——
 *   评委点开某个来源发现打不开或对不上，可信度会崩。
 *
 *   我（AI）**不能**代替人确认「claim 与来源内容一致」——那需要人读。
 *   但有一类问题机器能查，而且恰好是最容易当场出丑的：
 *     · 链接 404 / 域名挂了 / 被墙
 *     · 重定向到无关页面
 *     · 超时
 *   把这类问题先排掉，人的审查就只需要盯「内容对不对」，工作量小很多。
 *
 * 注意：GitHub 在本机要走 Clash 代理，但**外部来源站点不应该走代理**
 * （有些学术站点走代理反而更慢或失败）。这里用 Node 原生 fetch，
 * 走系统代理设置。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const FAST = process.argv.includes('--fast');
const TIMEOUT_MS = FAST ? 8000 : 15000;
const CONCURRENCY = 6;

const sources = JSON.parse(readFileSync(join(root, 'data', 'sources.json'), 'utf8'));
const list = Array.isArray(sources) ? sources : sources.sources;

console.log('');
console.log('  来源链接体检');
console.log('  ' + '─'.repeat(62));
console.log(`  共 ${list.length} 条来源，并发 ${CONCURRENCY}，超时 ${TIMEOUT_MS / 1000}s`);
console.log('');

/**
 * 浏览器 UA —— 必须带。
 *
 * 实测教训：用自定义 UA 时 dyson.com 返回 403，换成浏览器 UA 就是 200。
 * 也就是说 403 里混着「反爬虫」和「真的挂了」两种情况，
 * 不区分就会**误报**，把好链接报成坏的 —— 那比不查还糟，
 * 会让人去"修"根本没坏的东西。
 */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * 已知会拒绝自动化访问的域名。
 *
 * 为什么要有这个清单：这些域名无论用 curl、node fetch 还是无头浏览器
 * 都拿不到内容（Akamai 之类），**工具无法判断链接是否真的还能用**。
 * 如果每次都把它们报成 ❌，跑几次之后就没人看这份报告了 ——
 * 那才是真正的损失。
 *
 * 所以单独归为 🔒「需人工用普通浏览器确认」，
 * 并且这个清单要写明「为什么在这里」，不能变成藏问题的黑名单。
 */
const KNOWN_BOT_WALLS = new Map([
  ['investors.zoom.us', 'Akamai 反爬：curl / node fetch / 无头浏览器全部被拒（403 或超时）'],
  ['news.stanford.edu', '对非浏览器请求返回 403'],
  ['www.princeton.edu', '对非浏览器请求返回 403'],
  ['www.inc.com', '对非浏览器请求返回 403'],
  ['www.dyson.com', '对自定义 UA 返回 403（换浏览器 UA 可过）'],
  ['www.blackstone.com', '对非浏览器请求返回 403'],
]);

function hostOf(u) {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
}

/** 逐个检查，返回状态 */
async function checkOne(s) {
  const url = s.url;
  const id = s.source_id ?? '(无 id)';
  if (!url) {
    return { id, url: '', status: 'NO_URL', detail: '这条来源没有 url 字段' };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    let res = await fetch(url, {
      method: FAST ? 'HEAD' : 'GET',
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml,*/*' },
    });

    // 有些站点不支持 HEAD（405/501），或对 HEAD 更严格 → 用 GET 重试
    if (res.status === 405 || res.status === 501 || res.status === 403) {
      res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: ctrl.signal,
        headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      });
    }

    const ms = Date.now() - t0;
    if (res.ok) {
      return { id, url, status: 'OK', detail: `${res.status} ${ms}ms` };
    }
    // 403 单独标注：可能是反爬，真浏览器能打开，不一定是我们链接错了
    if (res.status === 403) {
      return { id, url, status: 'BLOCKED', detail: `HTTP 403（${KNOWN_BOT_WALLS.get(hostOf(url)) ?? '可能是反爬'}）${ms}ms` };
    }
    return { id, url, status: 'BAD', detail: `HTTP ${res.status} ${ms}ms` };
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = e.name === 'AbortError' ? `超时 >${TIMEOUT_MS / 1000}s` : e.message.slice(0, 60);
    // 已知反爬域名上的失败 → 归为「无法自动核查」，不算我们的链接坏了
    const wall = KNOWN_BOT_WALLS.get(hostOf(url));
    if (wall) {
      return { id, url, status: 'BLOCKED', detail: `${msg}（${wall}）` };
    }
    return { id, url, status: 'FAIL', detail: `${msg} ${ms}ms` };
  } finally {
    clearTimeout(timer);
  }
}

/** 分批并发 */
async function runAll() {
  const results = [];
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const done = await Promise.all(batch.map(checkOne));
    results.push(...done);
    for (const r of done) {
      const mark =
        r.status === 'OK' ? '\x1b[32m✅\x1b[0m'
        : r.status === 'BLOCKED' ? '\x1b[33m🔒\x1b[0m'
        : r.status === 'NO_URL' ? '\x1b[33m⚠️ \x1b[0m'
        : '\x1b[31m❌\x1b[0m';
      console.log(`  ${mark} ${r.id.padEnd(16)} ${r.detail}`);
      if (r.status !== 'OK' && r.url) console.log(`      \x1b[2m${r.url}\x1b[0m`);
    }
  }
  return results;
}

const results = await runAll();

const ok = results.filter((r) => r.status === 'OK').length;
const blocked = results.filter((r) => r.status === 'BLOCKED');
const noUrl = results.filter((r) => r.status === 'NO_URL').length;
// 只有真的坏（404/超时/域名挂）才算失败；403 单独列，让人用浏览器确认
const bad = results.filter((r) => r.status === 'BAD' || r.status === 'FAIL');

console.log('');
console.log('  ' + '─'.repeat(62));
console.log(`  ✅ 可达 ${ok}　🔒 疑似反爬 ${blocked.length}　⚠️ 无链接 ${noUrl}　❌ 确认有问题 ${bad.length}`);
console.log('');

if (bad.length > 0) {
  console.log('  ❌ 必须修的来源（链接确实打不开）：');
  for (const b of bad) console.log(`    · ${b.id} —— ${b.detail}\n      ${b.url}`);
  console.log('');
}

if (blocked.length > 0) {
  console.log('  🔒 疑似反爬（**请用浏览器点一次确认**）：');
  for (const b of blocked) console.log(`    · ${b.id} —— ${b.detail}\n      ${b.url}`);
  console.log('');
  console.log('     实测经验：dyson.com 用自定义 UA 返回 403，换浏览器 UA 就是 200。');
  console.log('     所以这一组大概率是好链接，但要人点一次才算数。');
  console.log('');
}

console.log('  ⚠️ 这里只查了「链接能不能打开」。');
console.log('     「来源内容是否支持那条 claim」仍然需要人读 ——');
console.log('     那一步没有工具能替代，见 data/REVIEW.md。');
console.log('');

process.exit(bad.length > 0 ? 1 : 0);

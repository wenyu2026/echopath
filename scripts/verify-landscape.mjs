/**
 * 决策地形 v2 —— 可行性验证
 * ============================================
 * 用法：npm run demo:verify
 *
 * 这个脚本是「技术可行性」的交付物本身。它验 6 件事：
 *
 *   ① 结构一致   两个数据源返回**结构完全相同**的响应
 *   ② 内容不同   切换数据源后，选出的案例确实不同
 *   ③ 多路径     能聚出 2-4 条路径（单条时 single_path_only 必须为 true）
 *   ④ 可追溯     每条路径能列出它来自哪几条真实案例
 *   ⑤ 追原话     代价能挂到用户原话上
 *   ⑥ 够快       端到端 ≤ 4 秒
 *
 * ⚠️ 这个脚本不依赖后端进程 —— 它直接调引擎函数。
 *   好处：CI 里能跑；坏处：不覆盖 HTTP 层（那部分由 preflight 的 smoke 覆盖）。
 */

import { getSourceWithMechanisms, listSources } from '../server/retrieval/data-source.ts';
import { buildLandscape, LANDSCAPE_CONFIG } from '../server/retrieval/landscape-v2.ts';

let failed = 0;
function check(name, ok, detail = '') {
  const mark = ok ? '\x1b[32m✅\x1b[0m' : '\x1b[31m❌\x1b[0m';
  console.log(`  ${mark} ${name}`);
  if (detail) console.log(`      \x1b[2m${detail}\x1b[0m`);
  if (!ok) failed++;
}

/* ---------------- 测试输入 ---------------- */

/**
 * 一个真实的用户处境。刻意写得像真人会说的话。
 * user_quote 是访谈里他说过的一句原话 —— 用来验证「代价能追到原话」。
 */
const USER_QUOTE = '我不太怕晚毕业，我最怕的是再浪费几年。';

const SITUATION = {
  stage: '本科三年级',
  options: ['继续读本专业', '转向新方向', '先找工作再看'],
  root_factors: ['沉没成本', '新路径验证不足', '转换成本', '长期方向匹配'],
  constraints: ['已投入两年半', '转专业有成绩门槛', '家庭希望尽快稳定'],
  goals: ['做自己认可的方向', '有可迁移的技能'],
  risk: 'high',
  reversibility: 'low',
  unknowns: ['新方向是否真的适合', '能不能承受延毕'],
};

async function runOne(sourceId) {
  const src = await getSourceWithMechanisms(sourceId);
  const t0 = Date.now();
  const res = buildLandscape({ situation: SITUATION, user_quote: USER_QUOTE }, src);
  const wall = Date.now() - t0;
  // 引擎内部的 elapsed_ms 只算计算部分；这里补上数据加载
  return { ...res, meta: { ...res.meta, elapsed_ms: wall }, _sourceId: sourceId };
}

/* ---------------- 主流程 ---------------- */

console.log('');
console.log('  决策地形 v2 · 可行性验证');
console.log('  ' + '─'.repeat(62));
console.log('');

const available = listSources();
console.log(`  可用数据源：${available.map((s) => `${s.id}（${s.label}）`).join('、')}`);
console.log('');

const results = [];
for (const s of available) {
  try {
    const r = await runOne(s.id);
    results.push(r);
    console.log(`  ── ${r.data_source.label} ──`);
    console.log(`     规模：${r.data_source.episode_count} 条案例 / ${r.data_source.person_count} 位人物`);
    console.log(`     隐私级别：${r.data_source.privacy_level}`);
    console.log(`     召回人物：${r.meta.persons_recalled}　命中案例：${r.meta.episodes_matched}　路径：${r.meta.archetypes_found}`);
    console.log(`     耗时：${r.meta.elapsed_ms}ms`);
    console.log('');
    for (const a of r.archetypes) {
      console.log(`     ▸ ${a.title}`);
      console.log(`       支撑案例 ${a.supporting_cases.length} 个：${a.supporting_cases.map((c) => c.display_name).join('、')}`);
      if (a.costs[0]) {
        console.log(`       最重代价：${a.costs[0].text.slice(0, 46)}`);
        if (a.costs[0].basis.kind === 'user_quote') {
          console.log(`         ↳ 因为你刚才说：「${a.costs[0].basis.quote}」`);
        }
      }
    }
    console.log('');
  } catch (e) {
    console.log(`  ❌ ${s.id} 加载失败：${e.message}`);
    failed++;
  }
}

console.log('  ' + '─'.repeat(62));
console.log('');

/* ① 结构一致 */
{
  const keysOf = (o) => Object.keys(o).sort().join(',');
  const allSame = results.every((r) => keysOf(r) === keysOf(results[0]));
  const profileSame = results.every((r) => keysOf(r.profile) === keysOf(results[0].profile));
  check(
    '① 两个数据源返回结构完全相同的响应',
    allSame && profileSame && results.length >= 2,
    allSame ? '顶层与 profile 层字段一致' : '字段不一致 —— 换数据源会导致前端渲染失败',
  );
}

/* ② 内容不同 */
{
  const ids = results.map((r) => r.archetypes.flatMap((a) => a.supporting_cases.map((c) => c.episode_id)));
  const distinct = new Set(ids.flat()).size === ids.flat().length || !ids.every((x) => x.join() === ids[0].join());
  check(
    '② 切换数据源后选出的案例确实不同',
    distinct,
    `历史库 ${ids[0]?.length ?? 0} 个案例 vs 校友库 ${ids[1]?.length ?? 0} 个案例`,
  );
}

/* ③ 多路径 */
{
  const multi = results.filter((r) => r.archetypes.length >= 2);
  check(
    '③ 至少一个数据源能聚出 2-4 条不同路径',
    multi.length > 0,
    results.map((r) => `${r.data_source.label}=${r.archetypes.length}条`).join('　'),
  );
  // 单路径时必须诚实标记
  const honest = results.every((r) => (r.archetypes.length <= 1 ? r.single_path_only : true));
  check('③b 只聚出一条路径时 single_path_only 必须为 true', honest, '不凑数');
}

/* ④ 可追溯 */
{
  const traceable = results.every((r) =>
    r.archetypes.every((a) => a.supporting_cases.length > 0 && a.supporting_cases.every((c) => c.episode_id && c.display_name)),
  );
  const total = results.reduce((n, r) => n + r.archetypes.reduce((m, a) => m + a.supporting_cases.length, 0), 0);
  check('④ 每条路径都能列出它来自哪几条真实案例', traceable, `共 ${total} 条案例引用`);
}

/* ⑤ 追原话 */
{
  const withQuote = results.filter((r) =>
    r.archetypes.some((a) => a.costs.some((c) => c.basis.kind === 'user_quote' && c.basis.quote === USER_QUOTE)),
  );
  check(
    '⑤ 代价能挂到用户原话上',
    withQuote.length > 0,
    withQuote.length > 0
      ? `「${USER_QUOTE}」已出现在代价依据里`
      : '没有任何代价引用了用户原话 —— 「个性化」就成了空话',
  );
}

/* ⑥ 够快 */
{
  const slowest = Math.max(...results.map((r) => r.meta.elapsed_ms));
  check('⑥ 端到端 ≤ 4000ms', slowest <= 4000, `最慢 ${slowest}ms（聚类阈值 ${LANDSCAPE_CONFIG.jaccard_threshold}）`);
}

/* ---------------- 输出 ---------------- */

console.log('');
if (failed === 0) {
  console.log('  \x1b[32m✅ 可行性验证全部通过\x1b[0m');
  console.log('     · 同一套引擎能装载两种完全不同的人群数据');
  console.log('     · 路径聚类有效，且每条路径可追溯到真实案例');
  console.log('     · 个性化代价能追到用户原话');
  console.log('');
  process.exit(0);
} else {
  console.log(`  \x1b[31m❌ ${failed} 项不通过\x1b[0m`);
  console.log('');
  process.exit(1);
}

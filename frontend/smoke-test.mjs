#!/usr/bin/env node
/**
 * EchoPath 全链路冒烟测试（真实 LLM，需要 .env 配好 TOKENDANCE_API_KEY）
 * ======================================================================
 * 链路: health → interview/start → answer ×3 → finish → sources → landscape → case
 *
 * 用法:
 *   1. 起后端（注意：本机 3000 被 new-api 占用，必须用别的端口）
 *      cd xuejun-hackathon
 *      set PORT=3100 && npm run server
 *   2. 跑本脚本
 *      node smoke-test.mjs            （默认打 http://localhost:3100）
 *      node smoke-test.mjs http://localhost:3000
 *
 * 退出码: 0 = 全过, 1 = 有 FAIL
 */
const BASE = process.argv[2] || 'http://localhost:3100';
const t0 = Date.now();
let pass = 0, fail = 0;

function ok(name, cond, detail = '') {
  const mark = cond ? 'PASS' : 'FAIL';
  cond ? pass++ : fail++;
  console.log(`[${mark}] ${name}${detail ? ' — ' + detail : ''}`);
}
const cut = (v, n = 110) => { const s = typeof v === 'string' ? v : JSON.stringify(v); return s && s.length > n ? s.slice(0, n) + '…' : s; };

async function call(method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });
  let json = null;
  try { json = await r.json(); } catch { /* non-json */ }
  return { status: r.status, body: json };
}

/* ---------- 0. health ---------- */
{
  const { status, body } = await call('GET', '/api/health');
  ok('health', status === 200 && body?.ok === true, `key_configured=${body?.key_configured}`);
  if (!body?.key_configured) { console.log('KEY 未配置，访谈链路无法测，提前退出'); process.exit(1); }
}

/* ---------- 1. interview/start ---------- */
let state, asked;
{
  const { status, body } = await call('POST', '/api/interview/start');
  ok('interview/start', status === 200 && typeof body?.message === 'string', cut(body?.message));
  state = body?.state; asked = body?.asked_field;
}

/* ---------- 2. answer ×3 ---------- */
const answers = [
  '我在大厂做后端开发三年了，最近拿到一个创业公司技术负责人的 offer，纠结要不要去。',
  '创业公司做 AI 教育，方向我认可，但薪资降 30%，而且要带团队，我没管过人。家里人希望我稳定，觉得大厂好歹是个铁饭碗。',
  '我最怕的是五年后发现自己只是在修 bug，没有成长。但如果创业失败了，35 岁再回大厂就难了。',
];
for (let i = 0; i < answers.length; i++) {
  const { status, body } = await call('POST', '/api/interview/answer', { state, answer: answers[i], asked_field: asked });
  const upd = (body?.extracted?.updates ?? []).map(u => `${u.field}@${u.confidence}`).join(',');
  ok(`answer#${i + 1}`, status === 200 && body?.state, `fields=${body?.progress?.fields} done=${body?.done} 抽取: ${cut(upd, 90)}`);
  if (body?.extracted?.memorable_quote) console.log(`       memorable_quote: ${cut(body.extracted.memorable_quote, 90)}`);
  state = body?.state ?? state; asked = body?.asked_field ?? asked;
  if (body?.done) { console.log(`       (后端判断信息够了, stop_reason=${body?.stop_reason})`); break; }
}

/* ---------- 3. finish ---------- */
{
  const { status, body } = await call('POST', '/api/interview/finish', { state });
  ok('interview/finish', status === 200 && body?.summary, `no_dilemma=${body?.no_dilemma} elapsed=${body?.elapsed_ms}ms`);
  console.log('       summary:', cut(body?.summary, 220));
}
console.log('       collected:', cut(state?.collected, 260));

/* ---------- 4. sources ---------- */
let sources = [];
{
  const { status, body } = await call('GET', '/api/sources');
  sources = body?.sources ?? [];
  ok('sources', status === 200 && sources.length > 0, sources.map(s => `${s.source_id ?? s.id}(${s.episode_count ?? '?'}条)`).join(' '));
}

/* ---------- 5. landscape（root_factors 留空 → 顺带测 inferRootFactors 兜底路径） ---------- */
let landscape = null;
{
  const situation = {
    stage: state?.collected?.stage || '职业转型',
    options: ['留在大厂继续深耕', '去创业公司做技术负责人'],
    constraints: ['家人希望稳定', '薪资降 30%'],
    goals: ['长期成长空间', '带团队的经验'],
    root_factors: [],
    risk: 'medium', reversibility: 'medium',
    unknowns: ['创业公司现金流能撑多久'],
  };
  const { status, body } = await call('POST', '/api/landscape', { situation, user_quote: '我最怕的是五年后发现自己只是在修 bug' });
  landscape = body;
  const paths = body?.paths ?? body?.archetypes ?? [];
  ok('landscape', status === 200 && paths.length > 0, `路径数=${paths.length} keys=${Object.keys(body ?? {}).slice(0, 10).join(',')}`);
  if (body?.mechanism_reading) console.log('       mechanism_reading:', cut(body.mechanism_reading, 140));
  if (body?.caveat) console.log('       caveat:', cut(body.caveat, 120));
}

/* ---------- 6. case（从 landscape 结果里抓一个 episode_id） ---------- */
{
  const blob = JSON.stringify(landscape ?? {});
  const epId = blob.match(/"episode_id"\s*:\s*"([^"]+)"/)?.[1];
  const srcId = blob.match(/"source_id"\s*:\s*"([^"]+)"/)?.[1];
  if (epId) {
    const { status, body } = await call('POST', '/api/case', {
      episode_id: epId, source_id: srcId ?? undefined,
      stage: '职业转型', options: ['留在大厂', '去创业公司'], constraints: ['家人希望稳定'], goals: ['成长'], risk: 'medium',
    });
    const ep = body?.episode;
    const person = typeof ep?.person === 'object' ? ep?.person?.name : ep?.person;
    ok('case', status === 200 && ep, `案例=${person ?? '?'} 时间边界=${body?.temporal_boundary ? '有' : '?'} keys=${Object.keys(body ?? {}).slice(0, 10).join(',')}`);
  } else {
    ok('case', false, '拿不到 episode_id（landscape 响应结构变了？）');
  }
}

console.log(`\n==== 结果: ${pass} PASS / ${fail} FAIL，总耗时 ${Date.now() - t0}ms ====`);
process.exit(fail ? 1 : 0);

/**
 * 访谈引导性验收脚本 —— 四个虚构场景（真实 LLM）
 * A 只说"我大三，觉得专业不适合自己" → 必须追问一件具体的事（mode=probe_event），不许跳话题
 * B 回答"不知道" → 降难度 + 回忆入口（hints 非空）+ 允许跳过（mode=rescue）
 * C 一次给大量信息 → 多字段一次抽到，下一问不得重复已答内容
 * D 纠正前文 → 状态更新为新值，且不重复追问
 * 然后 finish → summary 正常（后续页面链路不受影响）
 */
const BASE = process.argv[2] || 'http://localhost:3100';
const post = async (path, body) => {
  const r = await fetch(BASE + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}), signal: AbortSignal.timeout(120_000),
  });
  return { status: r.status, body: await r.json() };
};
const show = (tag, r) => {
  const b = r.body;
  console.log(`\n──── ${tag} [${r.status}] mode=${b.mode ?? '-'} asked=${b.asked_field ?? '-'} stop=${b.stop_reason ?? '-'} hints=${JSON.stringify(b.hints ?? [])}`);
  console.log(`AI: ${b.message ?? b.summary ?? '(done)'}`);
  return b;
};

/* ───────── A ───────── */
let r = await post('/api/interview/start');
let st = show('A0 start', r);
let state = st.state, asked = st.asked_field;

// 找到 stage 问题的回答（第一个问题可能是 stage）；直接给身份 + 迷茫感受
r = await post('/api/interview/answer', { state, answer: '我大三，觉得专业不适合自己', asked_field: asked });
st = show('A1 迷茫感受', r);
state = st.state; asked = st.asked_field;
console.log(`     抽取: ${JSON.stringify(st.extracted?.updates ?? [])}`);
console.log(`     信号: ${JSON.stringify(st.extracted?.signals ?? {})}`);
if (st.mode !== 'probe_event') { console.log('❌ A1 预期 probe_event（追问具体的事），实际 ' + st.mode); process.exitCode = 1; }
else console.log('✅ A1 命中追问线程：没有跳话题，先问具体的事');

/* ───────── B ───────── */
r = await post('/api/interview/answer', { state, answer: '不知道，想不起来', asked_field: asked });
st = show('B1 说不知道', r);
state = st.state; asked = st.asked_field;
if (st.mode !== 'rescue' || !(st.hints ?? []).length) { console.log('❌ B1 预期 rescue + hints，实际 ' + st.mode + ' hints=' + JSON.stringify(st.hints)); process.exitCode = 1; }
else console.log('✅ B1 降难度救援：给了回忆入口，且问句允许跳过');

/* ───────── C：一次给大量信息 ───────── */
r = await post('/api/interview/answer', {
  state, asked_field: asked,
  answer: '嗯……要说的话，可能是有一次小组作业吧，我全程一点都不想碰，拖到 deadline 前一晚才熬夜赶完，交完心里特别空。其实我平时喜欢摄影，给摄影社拍过好几场活动，还接过一次约拍赚了一千多块。不过家里希望我把专业读完别折腾，我也怕自己是一时兴起。反正最怕的就是几年后发现自己还是不喜欢现在这条路，那这几年就白读了。',
});
st = show('C1 一次性大量信息', r);
state = st.state; asked = st.asked_field;
const fieldsGot = (st.extracted?.updates ?? []).map(u => u.field);
console.log(`     一次抽到 ${fieldsGot.length} 个字段: ${fieldsGot.join(', ')}`);
console.log(`     信号: ${JSON.stringify(st.extracted?.signals ?? {})}`);
if (fieldsGot.length < 3) { console.log('❌ C1 预期一次抽出 ≥3 个字段'); process.exitCode = 1; }
else console.log('✅ C1 大信息量一次抽全');

/* ───────── D：纠正前文 ───────── */
const constraintsBefore = state.collected['constraints'];
r = await post('/api/interview/answer', {
  state, asked_field: asked,
  answer: '等一下，更正一下，刚才说家里希望我别折腾其实说错了，家里其实没意见，是我自己担心摄影这条路收入不稳定，经济上撑不住。',
});
st = show('D1 纠正前文', r);
state = st.state; asked = st.asked_field;
console.log(`     constraints 前: ${constraintsBefore}`);
console.log(`     constraints 后: ${state.collected['constraints']}`);
console.log(`     correction 信号: ${st.extracted?.signals?.correction}`);
const corrOk = st.extracted?.signals?.correction === true || (constraintsBefore !== state.collected['constraints']);
if (!corrOk) { console.log('❌ D1 纠正未被处理'); process.exitCode = 1; }
else console.log('✅ D1 纠正被理解并更新（或明确识别为纠正）');

/* ───────── E：继续走到总结 ───────── */
let rounds = 0;
while (!st.done && rounds < 8) {
  r = await post('/api/interview/answer', { state, asked_field: asked, answer: '这个我说不好，先跳过。' });
  st = show(`E+${rounds + 1} 跳过/推进`, r);
  state = st.state; asked = st.asked_field;
  if (st.mode === 'normal' || st.mode === undefined) rounds++;
  if (st.stop_reason === 'no_progress') break;
}
console.log(`\n═══ 访谈结束: done=${st.done} stop=${st.stop_reason ?? 'manual'} 已采集 ${Object.keys(state.collected).length} 字段 ═══`);

r = await post('/api/interview/finish', { state });
console.log(`\n──── finish [${r.status}] no_dilemma=${r.body.no_dilemma}`);
console.log(`总结: ${r.body.summary}`);
console.log(`\n最终采集: ${JSON.stringify(state.collected, null, 1)}`);
console.log(`跳过保留为未知: ${JSON.stringify(state.skipped ?? [])}`);

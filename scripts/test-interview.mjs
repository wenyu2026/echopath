/**
 * 访谈流程的端到端验证（临时脚本）
 * 模拟一个真实用户走完整场访谈，看每一步抽到了什么。
 */
const BASE = 'http://localhost:3000';

/** 模拟用户的回答（刻意写得像真人说话，含空话） */
const ANSWERS = [
  '大三吧，材料科学与工程，读了两年半了',
  '也不是不喜欢，就是越学越觉得不对劲，说不上来。我在想要不要转到计算机那边去',
  '其实我大二就开始自学编程了，但没什么系统，就跟着网课写了几行代码。要说真正的项目，没有',
  '我其实不太怕晚毕业，多读一年也没关系，我最怕的是选错了方向，再过几年才发现还是不喜欢',
  '家里希望我毕业找个稳定工作就行，不太支持我折腾。钱的话我自己的奖学金够用',
  '我挺想做点自己认可的东西，不想只是为了混个文凭',
  '如果转过去发现更不合适，那我可能就认了，先工作几年再说',
  '想清楚了',
];

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}：${JSON.stringify(json).slice(0, 200)}`);
  return json;
}

const W = '─'.repeat(66);
console.log('');
console.log('  访谈流程端到端验证');
console.log(W);

// 开始
let r = await post('/api/interview/start', {});
let state = r.state;
console.log('');
console.log('  【AI】' + r.message);
console.log(`        （问的方向：${r.asked_field}）`);

let i = 0;
while (!r.done && i < ANSWERS.length) {
  const answer = ANSWERS[i++];
  console.log('');
  console.log('  【我】' + answer);
  console.log('');

  r = await post('/api/interview/answer', { state, answer, asked_field: r.asked_field });
  state = r.state;

  // 展示这一轮抽到了什么
  for (const u of r.extracted.updates) {
    const c = u.confidence >= 0.85 ? '高' : u.confidence >= 0.6 ? '中' : '低';
    console.log(`        ✓ 抽到 ${u.field}：「${u.value}」（置信${c} ${u.confidence.toFixed(2)}）`);
  }
  if (r.extracted.memorable_quote) {
    console.log(`        ★ 记住原话：「${r.extracted.memorable_quote}」`);
  }

  if (r.message) {
    console.log(`  【AI】${r.message}`);
    console.log(`        （问的方向：${r.asked_field}｜进度 ${r.progress.asked}/${r.progress.max}）`);
  } else {
    console.log(`  【AI】（问完了，原因：${r.stop_reason}｜共问 ${r.progress.asked} 轮）`);
  }
}

// 总结
console.log('');
console.log(W);
console.log('  【总结】');
const fin = await post('/api/interview/finish', { state });
console.log('  ' + fin.summary.replace(/\n/g, '\n  '));

console.log('');
console.log(W);
console.log('  最终采集到的字段：');
for (const [k, v] of Object.entries(state.collected)) {
  const conf = state.confidence[k]?.toFixed(2) ?? '?';
  console.log(`    ${k.padEnd(22)} ${String(v).slice(0, 40).padEnd(42)} (${conf})`);
}
const asked = state.asked;
console.log('');
console.log(`  问了 ${asked.length} 轮：${asked.join(' → ')}`);
console.log('');

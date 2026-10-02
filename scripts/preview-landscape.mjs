/**
 * 把引擎输出打印成人能读的样子（临时查看用）
 */
import { getSourceWithMechanisms, listSources } from '../server/retrieval/data-source.ts';
import { buildLandscape } from '../server/retrieval/landscape-v2.ts';

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

const W = '═'.repeat(70);

for (const s of listSources()) {
  const src = await getSourceWithMechanisms(s.id);
  const r = buildLandscape({ situation: SITUATION, user_quote: USER_QUOTE }, src);

  console.log('');
  console.log(W);
  console.log(`  【数据源】${r.data_source.label}`);
  console.log(`  ${r.data_source.description.slice(0, 60)}`);
  console.log(`  ${r.data_source.episode_count} 条案例 / ${r.data_source.person_count} 位人物　隐私级别：${r.data_source.privacy_level}`);
  console.log(W);

  console.log('');
  console.log('  ── 第二屏 · AI 对你的理解 ──');
  console.log('');
  console.log(`  阶段：${r.profile.stage}`);
  console.log(`  根因素：${r.profile.root_factors.join(' · ')}`);
  console.log('');
  console.log(`  ${r.profile.mechanism_reading}`);
  console.log('');

  console.log('  ── 第三屏 · 决策地形 ──');
  console.log('');
  console.log(`  共 ${r.archetypes.length} 条路径${r.single_path_only ? '（只找到一种，已诚实标记）' : ''}`);
  console.log('');

  r.archetypes.forEach((a, i) => {
    console.log(`  ┌${'─'.repeat(64)}`);
    console.log(`  │ ${i + 1}. ${a.title}`);
    console.log(`  │    ${a.one_line}`);
    console.log('  │');
    console.log('  │  这条路保护的是：');
    for (const p of a.protects) console.log(`  │    · ${p}`);
    console.log('  │');
    console.log('  │  对你可能最重的代价：');
    a.costs.forEach((c, j) => {
      const tag = c.basis.kind === 'user_quote' ? '【挂你原话】' : c.basis.kind === 'structure' ? '【结构性】' : '【未知】';
      console.log(`  │   ${j === 0 ? '★' : ' '} ${tag} ${c.text.slice(0, 52)}`);
      if (c.basis.quote) {
        console.log(`  │       ↳ 因为你刚才说：「${c.basis.quote}」`);
      }
    });
    console.log('  │');
    console.log(`  │  来自 ${a.supporting_cases.length} 个真实案例：`);
    for (const c of a.supporting_cases) {
      const hint = c.outcome_hint ? ` → ${c.outcome_hint.slice(0, 34)}` : '';
      console.log(`  │    · ${c.display_name}（${c.year}）${hint}`);
    }
    if (a.caveat) console.log(`  │  ⚠️ ${a.caveat}`);
    console.log(`  └${'─'.repeat(64)}`);
    console.log('');
  });

  console.log('  ── meta ──');
  console.log(`  ${JSON.stringify(r.meta)}`);
  console.log('');
}

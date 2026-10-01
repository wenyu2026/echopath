import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readDataset, validateDataset } from '../scripts/validate-data.mjs';

const fixture = readDataset(fileURLToPath(new URL('./episodes.json', import.meta.url)));
const check = values => validateDataset(...values, { milestone: values[2].release_stage });
const reject = (name, mutate, expected) => test(name, () => {
  const values = structuredClone(fixture);
  mutate(...values);
  const result = check(values);
  assert.ok(result.errors.some(e => expected.test(e)), result.errors.join('\n'));
});

test('published dataset passes structural and provenance checks', () => assert.deepEqual(check(fixture).errors, []));
test('invalid root returns diagnostics without throwing', () => {
  for (const value of [null, {}, 7, 'invalid']) assert.ok(validateDataset(value, null, null).errors.length);
});
test('array envelope remains supported', () => assert.deepEqual(check([fixture[0].episodes, ...fixture.slice(1)]).errors, []));
reject('null episode is diagnosed', d => { d.episodes[0] = null; }, /事件必须是对象/);
reject('null evidence is diagnosed', d => { d.episodes[0].evidence[0] = null; }, /evidence 条目/);
reject('wrong scalar type is rejected', d => { d.episodes[0].outcomes.short_term = 42; }, /outcomes.short_term/);
reject('invalid choice type is rejected', d => { d.episodes[0].choice.type = 'win'; }, /choice.type/);
reject('duplicate episode ID is rejected', d => { d.episodes[1].episode_id = d.episodes[0].episode_id; }, /episode_id 重复/);
reject('missing source registry entry is rejected', (d, s) => { s.sources.shift(); }, /不可追溯/);
reject('missing URL is rejected', d => { delete d.episodes[0].evidence[0].url; }, /URL/);
reject('javascript URL is rejected even when registry agrees', (d, s) => {
  const ev = d.episodes[0].evidence[0];
  ev.url = 'javascript:alert(1)';
  s.sources.find(x => x.source_id === ev.source_id).url = ev.url;
}, /URL/);
reject('AI source cannot become factual evidence by relabeling', d => {
  d.episodes[0].evidence.at(-1).type = 'biography';
}, /证据类型与来源索引冲突/);
reject('all AI evidence is rejected', d => {
  d.episodes[0].evidence = d.episodes[0].evidence.filter(e => e.type === 'ai_inference');
}, /至少需要一条真实来源/);
reject('missing fact provenance is rejected', (d, s, r) => { delete r.episodes[0].field_sources['time.year']; }, /关键事实 time.year/);
reject('AI inference cannot support an action as fact', (d, s, r) => { r.episodes[0].field_sources['choice.actions.0'] = ['MODEL-V1']; }, /非 AI 来源/);
reject('unmarked unknown outcome is rejected', d => { d.episodes[0].outcomes.long_term = '未知：资料不足。'; }, /未知说明/);
reject('missing inference layer is rejected', d => { d.episodes[0].evidence.pop(); }, /ai_inference/);
reject('dangling next episode is rejected', d => { d.episodes[0].next_episode_ids = ['not_real']; }, /悬空引用/);
reject('self-cycle in episode graph is rejected', d => { d.episodes[0].next_episode_ids = [d.episodes[0].episode_id]; }, /年份更晚/);
reject('age inconsistent with dates is rejected', d => { d.episodes[0].person.birth_year = 1881; d.episodes[0].time.age = 99; }, /age 与/);
reject('negative keywords alone do not satisfy coverage', (d, s, r) => {
  for (const row of r.episodes) row.negative_case = 'none';
}, /缺少负面案例/);
reject('negative classifications need a sourced outcome', (d, s, r) => {
  r.episodes.find(x => x.negative_case === '坚持但长期受损').negative_outcome_fields = ['outcomes.made_up'];
}, /负面分类须绑定/);
reject('four choice types are enforced', d => { for (const ep of d.episodes) ep.choice.type = 'direct_switch'; }, /至少覆盖四种/);
reject('missing demo direction is rejected', (d, s, r) => { for (const row of r.episodes) row.demo_questions = ['转专业']; }, /缺少 Demo 方向/);
reject('human signoff cannot be claimed without reviewer', (d, s, r) => { r.episodes[0].human_review = 'approved'; }, /须记录审查者/);
test('final minimum cannot silently fall back to 12', () => {
  const [d, s, r] = structuredClone(fixture);
  d.episodes = d.episodes.slice(0, 12);
  r.release_stage = 'final';
  assert.ok(validateDataset(d, s, r).errors.some(e => /案例数量不足/.test(e)));
});

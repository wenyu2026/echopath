/**
 * 阶段二验收测试：证据分层 + 反类比（#15 验收标准的机械化部分）。
 * 运行：node --test "server/tests/*.test.ts"
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Situation } from '../../src/types/episode.ts';
import { loadEpisodes } from '../retrieval/load-episodes.ts';
import { writeEvidenceLayers, traceabilityIssues } from '../evidence/evidence-writer.ts';
import { buildCounterAnalogy, guardViolations, GUARD_PATTERN } from '../counter-analogy/counter-analogy.ts';
import { retrieve, type RetrieveDeps } from '../retrieval/retrieve.ts';
import { mockEmbedder } from '../embedding/embed.ts';

const DEMO_SITUATION: Situation = {
  stage: '大二专业迷茫期',
  dilemma: '继续沉没 vs 重新开始',
  options: ['立即转专业', '辅修双学位', '考研换方向', '硬着头皮读完'],
  constraints: ['已投入两年沉没成本', '新方向仅了解两个月', '家庭期望别太高', '接受延毕'],
  goals: ['追求兴趣', '个人成长', '顺利毕业'],
  risk: 'medium',
  reversibility: 'medium',
  unknowns: ['新方向的真实能力匹配度', '转专业的具体难度与成本'],
};

test('证据分层：facts 每条带 source_id，self_writing 不进 facts', () => {
  const [luXun] = loadEpisodes().filter((e) => e.episode_id.startsWith('lu_xun'));

  // ⚠️ 集成修复（#17）：原测试硬编码了 source_id 'LX-S3'，但 #19 合并后
  //    fu6868 重写了数据，鲁迅案例的 source_id 变成了 LX-SENDAI / LX-TOHOKU / …
  //    所以这里改成「从数据里取真实的 source_id」，不再依赖具体命名。
  const bioIds = luXun.evidence.filter((e) => e.type === 'biography').map((e) => e.source_id);
  const selfIds = luXun.evidence.filter((e) => e.type === 'self_writing').map((e) => e.source_id);
  assert.ok(bioIds.length > 0, '该案例应有 biography 来源');
  assert.ok(selfIds.length > 0, '该案例应有 self_writing 来源');

  const layers = writeEvidenceLayers(luXun);

  assert.ok(
    bioIds.some((id) => layers.facts.some((f) => f.includes(id))),
    `biography 来源应进 facts（可选 id：${bioIds.join(' / ')}）`,
  );
  assert.ok(
    selfIds.some((id) => layers.self_claims.some((s) => s.includes(id))),
    `self_writing 应进 self_claims（可选 id：${selfIds.join(' / ')}）`,
  );

  // 每条 facts / self_claims 都必须挂来源（不限定前缀，只要带括号标注）
  assert.ok(
    layers.facts.every((f) => /[（(][^）)]+[）)]\s*$/.test(f)),
    `facts 每条必须挂 source_id：${layers.facts.filter((f) => !/[（(][^）)]+[）)]\s*$/.test(f)).join(' | ')}`,
  );

  // self_writing 的内容不得混进 facts
  assert.ok(
    !selfIds.some((id) => layers.facts.some((f) => f.includes(id))),
    'self_writing 来源不得出现在 facts 层',
  );

  assert.equal(traceabilityIssues(layers).length, 0, '可追溯性机械检查通过');
});

test('证据分层：outcomes 全部进 interpretations（数据侧无来源绑定，保守规则）', () => {
  const episodes = loadEpisodes();
  for (const ep of episodes) {
    const layers = writeEvidenceLayers(ep);
    const joined = layers.interpretations.join('|');
    assert.ok(joined.includes(ep.outcomes.long_term), `${ep.episode_id} 长期结果应在 interpretations`);
    assert.ok(!layers.facts.some((f) => f.includes('outcomes')), 'outcomes 不得以 facts 身份出现');
  }
});

test('反类比：鲁迅案例 ≥2 条具体差异，unknown 不计入底线', () => {
  const [luXun] = loadEpisodes().filter((e) => e.episode_id.startsWith('lu_xun'));
  const ca = buildCounterAnalogy(DEMO_SITUATION, luXun);
  assert.ok(ca.concreteCount >= 2, `具体差异应 ≥2，实际 ${ca.concreteCount}（${ca.items.map((i) => i.kind)}）`);
  const eraCount = ca.items.filter((i) => i.kind === 'era').length;
  assert.ok(eraCount <= 1, 'era 类最多 1 条');
  for (const item of ca.items) {
    assert.ok(item.basis.length > 0, '每条必须带依据');
    assert.equal(GUARD_PATTERN.test(item.text), false, '不得出现「你应该」式结论');
  }
});

test('口径铁律：生成文案不出现「对方没有」式编造句式与「你应该」式结论', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const deps: RetrieveDeps = { embedder, episodes };
  const response = await retrieve(DEMO_SITUATION, {}, deps);
  const allTexts: string[] = [];
  for (const m of response.matches) {
    allTexts.push(...m.why_different, ...m.why_similar, ...m.evidence_layers.ai_inferences);
  }
  assert.deepEqual(guardViolations(allTexts), [], `口径违规: ${guardViolations(allTexts)}`);
});

test('ai_inferences 的内容绝不出现在 facts 层（验收第 3 条）', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const response = await retrieve(DEMO_SITUATION, {}, { embedder, episodes });
  for (const m of response.matches) {
    for (const ai of m.evidence_layers.ai_inferences) {
      assert.ok(!m.evidence_layers.facts.includes(ai), 'ai_inference 混入 facts');
      assert.ok(ai.includes('AI 类比'), 'era 条目必须显著标注');
    }
  }
});

test('全链路装配：每个案例 why_different ≥2 且带 detail，evidence_layers 五层齐全', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const response = await retrieve(DEMO_SITUATION, {}, { embedder, episodes });
  assert.equal(response.matches.length, 3);
  for (const m of response.matches) {
    assert.ok(m.why_different.length >= 2, `${m.episode.episode_id} 反类比不足 2 条`);
    assert.ok(m.why_different_detail && m.why_different_detail.length === m.why_different.length);
    for (const layer of ['facts', 'self_claims', 'interpretations', 'ai_inferences', 'unknowns'] as const) {
      assert.ok(Array.isArray(m.evidence_layers[layer]));
    }
    assert.ok(m.evidence_layers.interpretations.length >= 3, '结果链三层应已入 interpretations');
  }
});

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
  const layers = writeEvidenceLayers(luXun);
  assert.ok(layers.facts.some((f) => f.includes('LX-S3')), 'biography 来源应进 facts');
  assert.ok(layers.facts.every((f) => f.includes('（LX')), 'facts 每条必须挂 source_id');
  assert.ok(layers.self_claims.some((s) => s.includes('LX-S1')), 'self_writing 进 self_claims');
  assert.ok(layers.facts.every((f) => !f.includes('自述')), 'self_writing 内容不得混入 facts');
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

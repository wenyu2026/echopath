/**
 * 检索链路离线单测 —— 全部使用 mock 向量与种子案例，不需要网络与密钥。
 * 运行：node --test server/tests/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { Situation } from '../../src/types/episode.ts';
import { mockEmbedder, cosine } from '../embedding/embed.ts';
import { scoreDimensions, totalScore, differencePenalty, categoryMatch, CONSTRAINT_CATEGORIES, GOAL_CATEGORIES } from '../retrieval/dimensions.ts';
import { selectDiverse } from '../retrieval/diversity.ts';
import { validateSituation } from '../shared/situation-contract.ts';
import { loadEpisodes } from '../retrieval/load-episodes.ts';
import { buildEpisodeIndex, retrieve, recallTextOf } from '../retrieval/retrieve.ts';

const DEMO_SITUATION: Situation = {
  stage: '大二专业迷茫期',
  dilemma: '继续沉没 vs 重新开始',
  options: ['立即转专业', '辅修双学位', '考研换方向', '硬着头皮读完'],
  constraints: ['已投入两年沉没成本', '新方向仅了解两个月', '家庭期望别太高', '接受延毕'],
  goals: ['追求兴趣', '个人成长', '顺利毕业'],
  risk: 'medium',
  reversibility: 'medium',
  unknowns: ['新方向的长期真实适应性', '转专业的具体难度与成本'],
};

const NARRATIVE =
  '我已经学了这个专业两年，但越来越觉得不适合自己。我对另一个方向很感兴趣，但现在换是不是太晚？已投入两年；新方向只了解两个月；可以接受延毕；家庭期望别太高；最看重兴趣与成长。';

test('cosine：同向为 1，零向量为 0', () => {
  assert.ok(Math.abs(cosine([1, 0, 2], [2, 0, 4]) - 1) < 1e-9);
  assert.equal(cosine([0, 0, 0], [1, 2, 3]), 0);
});

test('mock 向量确定性：同文本两次一致，共享字多的文本相似度更高', async () => {
  const e = mockEmbedder(96);
  const [a1, a2, b] = await e.embed(['转专业沉没成本', '转专业沉没成本', '今天天气不错适合遛弯']);
  assert.deepEqual(a1, a2);
  assert.ok(cosine(a1, a2) === 1);
  assert.ok(cosine(a1, b) < 0.5);
});

test('constraint_match：门槛类约束缺失时应显著低于中性分', () => {
  // 用户有 threshold 类约束（成绩门槛），鲁迅案例 constraints 里没有
  const low = categoryMatch('转专业有成绩门槛，可能延毕', '公费留学身份，家庭期望，时代环境', CONSTRAINT_CATEGORIES);
  assert.ok(low <= 0.5, `threshold 缺失时得分应 ≤ 0.5，实际 ${low}`);
  const both = categoryMatch('家庭期望，经济压力', '家庭期望，经济依赖配偶收入', CONSTRAINT_CATEGORIES);
  assert.ok(both > low, '双方共有类别时应高于缺失情形');
});

test('difference_penalty：年代越远惩罚越高，缺失约束类别加重惩罚', () => {
  const episodes = loadEpisodes();
  const luXun = episodes.find((e) => e.episode_id.startsWith('lu_xun'))!;
  const murakami = episodes.find((e) => e.episode_id.startsWith('murakami'))!;
  const pLuXun = differencePenalty(DEMO_SITUATION, luXun);
  const pMurakami = differencePenalty(DEMO_SITUATION, murakami);
  assert.ok(pLuXun > pMurakami, `1906 年惩罚(${pLuXun}) 应高于 1978 年(${pMurakami})`);
  assert.ok(pLuXun <= 1 && pMurakami >= 0);
});

test('goal_match：目标类别交集越多分越高，无交集给低分', () => {
  // 有交集：兴趣/成长 vs 兴趣/成长
  const overlap = categoryMatch('追求兴趣，个人成长', '对写作产生兴趣，希望自我成长', GOAL_CATEGORIES);
  assert.ok(overlap > 0.3, `有交集应 > 0.3，实际 ${overlap}`);
  // 无交集：用户要兴趣成长，鲁迅的目标是「改变国民精神」（impact 类）——低分是正确行为
  const disjoint = categoryMatch('追求兴趣，个人成长', '改变国民精神，找到真正价值', GOAL_CATEGORIES);
  assert.ok(disjoint < 0.5, `无交集应 < 0.5，实际 ${disjoint}`);
});

test('七维打分：全部落在 0-1，排序分随惩罚下降', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const [sVec] = await embedder.embed([recallTextOf(episodes[0])]);
  const [pathVec] = await embedder.embed([NARRATIVE]);
  for (const ep of episodes) {
    const d = scoreDimensions({
      situation: DEMO_SITUATION,
      narrative: NARRATIVE,
      narrativeVec: pathVec,
      situationVec: sVec,
      episode: ep,
      episodeRecallVec: (await embedder.embed([recallTextOf(ep)]))[0],
      episodePathVec: (await embedder.embed([ep.prior_path.join('，')]))[0],
    });
    for (const [k, v] of Object.entries(d)) {
      assert.ok(v >= 0 && v <= 1, `${k}=${v} 越界`);
    }
    assert.ok(totalScore(d) <= 1);
  }
});

test('validateSituation：超长 dilemma 与非法枚举必须被拦下', () => {
  const bad = validateSituation({
    ...DEMO_SITUATION,
    dilemma: '我在纠结要不要坚持本专业还是转向一个新的方向这实在是太长了',
    risk: '很高',
  });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.ok(bad.issues.some((i) => i.field === 'dilemma'));
    assert.ok(bad.issues.some((i) => i.field === 'risk'));
  }
  const good = validateSituation(DEMO_SITUATION);
  assert.equal(good.ok, true);
});

test('selectDiverse：top3 全部 persist 时仍强制选出第 2 种 choice.type', () => {
  const episodes = loadEpisodes();
  const mk = (ep: (typeof episodes)[number], total: number) => ({ episode: ep, total });
  const allPersist = [
    mk(episodes[0], 0.9),
    mk({ ...episodes[1], choice: { ...episodes[1].choice, type: 'persist' as const } }, 0.85),
    mk({ ...episodes[2], choice: { ...episodes[2].choice, type: 'persist' as const } }, 0.8),
    mk({ ...episodes[2], choice: { type: 'dual_track' as const, actions: [] } }, 0.6),
  ];
  const { picked } = selectDiverse(allPersist, 3);
  assert.ok(new Set(picked.map((p) => p.episode.choice.type)).size >= 2, '多样性硬要求被满足');
  // 最高分者必须入选
  assert.equal(picked[0].total, 0.9);
});

test('离线全链路 retrieve：3 案例、≥2 种 choice.type、meta 计数正确、evidence_layers 形状完整', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const deps = { embedder, episodes };
  const response = await retrieve(DEMO_SITUATION, { narrative: NARRATIVE }, deps);
  assert.equal(response.matches.length, 3);
  assert.ok(new Set(response.matches.map((m) => m.episode.choice.type)).size >= 2, 'choice.type 至少 2 种');
  assert.equal(response.meta.candidates_recalled, episodes.length);
  assert.equal(response.meta.after_rerank, 3);
  for (const m of response.matches) {
    assert.ok(m.why_similar.length >= 2, '每个案例至少 2 条相似理由');
    assert.ok(Array.isArray(m.why_different));
    for (const layer of ['facts', 'self_claims', 'interpretations', 'ai_inferences', 'unknowns'] as const) {
      assert.ok(Array.isArray(m.evidence_layers[layer]), `evidence_layers.${layer} 必须是数组`);
    }
    assert.ok(m.episode.outcomes.short_term && m.episode.outcomes.mid_term && m.episode.outcomes.long_term, '短中长期结果齐全');
  }
  // 维度卡数值有效性
  for (const m of response.matches) {
    for (const [k, v] of Object.entries(m.dimensions)) assert.ok(v >= 0 && v <= 1, `${k} 越界`);
  }
});

test('buildEpisodeIndex 与 retrieve 一致性：索引向量维数稳定', async () => {
  const episodes = loadEpisodes();
  const embedder = mockEmbedder(96);
  const index = await buildEpisodeIndex({ embedder, episodes });
  assert.equal(index.length, episodes.length);
  for (const entry of index) {
    assert.equal(entry.recallVec.length, 96);
    assert.equal(entry.pathVec.length, 96);
  }
});

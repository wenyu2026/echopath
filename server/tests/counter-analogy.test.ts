/**
 * #15 反类比 + 证据分层 单测
 * ============================================
 * 全部离线，不需要网络与密钥（LLM 步骤用注入的 rewrite 桩）。
 * 运行：node --test server/tests/
 *
 * 覆盖 server/RULES-evidence-counter-analogy.md 的每条硬要求。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import type { DecisionEpisode, Situation } from '../../src/types/episode.ts';
import { buildEvidenceLayers, assertTraceable } from '../evidence/layers.ts';
import { findViolations, isClean, guardText, guardList } from '../evidence/output-guard.ts';
import { buildCandidates, eraCandidate, constraintCandidates, CURRENT_YEAR } from '../counter-analogy/candidates.ts';
import { generateCounterAnalogy } from '../counter-analogy/generate.ts';
import { loadEpisodes } from '../retrieval/load-episodes.ts';

/* ============================================================
   测试夹具
   ============================================================ */

const SITUATION: Situation = {
  stage: '大二迷茫期',
  dilemma: '坚持本专业 vs 转向新方向',
  options: ['继续读完', '申请转专业', '辅修双学位', '跨专业考研'],
  constraints: ['已投入两年', '转专业有成绩门槛', '可能延毕', '家庭期望'],
  goals: ['做感兴趣的事', '减少内耗'],
  risk: 'medium',
  reversibility: 'medium',
  unknowns: ['新方向的能力匹配度', '转专业成功率'],
};

/** 一个字段齐全的假案例，避免依赖真实数据 */
const EPISODE: DecisionEpisode = {
  episode_id: 'test_ep_1',
  person: { name: '测试人物', birth_year: 1900, tags: ['转向', '青年'] },
  time: { year: 1906, age: 25, stage: '留学期间' },
  prior_path: ['已投入两年', '对新方向产生兴趣'],
  decision_state: {
    dilemma: '继续 vs 转向',
    options: ['继续', '转向'],
    constraints: ['公费身份', '时代环境'],
    goals: ['找到价值'],
    risk: 'high',
    reversibility: 'low',
  },
  choice: { type: 'direct_switch', actions: ['退学', '转向写作'] },
  outcomes: {
    short_term: '短期结果描述',
    mid_term: '中期结果描述',
    long_term: '长期结果描述',
  },
  reflection: {
    self_comment: '本人后来的评价',
    unknowns: ['当时心理活动无记录'],
  },
  evidence: [
    { source_id: 'T-S1', type: 'biography', claim: '1906 年退学' },
    { source_id: 'T-S2', type: 'self_writing', claim: '自述转向动机' },
  ],
  retrieval_tags: ['沉没成本', '换方向'],
};

/* ============================================================
   一、证据分层（规则 1.1）
   ============================================================ */

test('分层：biography → facts，self_writing → self_claims，ai_inference → ai_inferences', () => {
  const ep: DecisionEpisode = {
    ...EPISODE,
    evidence: [
      { source_id: 'A1', type: 'biography', claim: '1906 年退学' },
      { source_id: 'A2', type: 'self_writing', claim: '自述转向动机' },
      { source_id: 'A3', type: 'ai_inference', claim: '结构相似的类比' },
    ],
  };
  const L = buildEvidenceLayers(ep);

  assert.ok(L.facts.some((f) => f.includes('1906 年退学')), 'facts 应含传记事实');
  assert.ok(L.self_claims.some((s) => s.includes('自述转向动机')), 'self_claims 应含本人表述');
  assert.ok(L.ai_inferences.some((a) => a.includes('结构相似的类比')), 'AI 推断应单独成层');

  // 规则 1.1 铁律：ai_inference 永不进 facts
  assert.ok(!L.facts.some((f) => f.includes('结构相似的类比')), '⚠️ AI 推断不得出现在 facts');
});

test('分层：facts / self_claims 每条都必须可追溯到来源（规则 1.1 机械可校验）', () => {
  const L = buildEvidenceLayers(EPISODE);
  const r = assertTraceable(L);
  assert.ok(r.ok, `存在无法追溯的条目：${r.ok ? '' : r.offenders.join(' | ')}`);
  assert.ok(L.facts.length > 0, 'facts 不应为空');
  assert.ok(L.self_claims.length > 0, 'self_claims 不应为空');
});

test('分层：reflection.self_comment → self_claims，unknowns → unknowns', () => {
  const L = buildEvidenceLayers(EPISODE);
  assert.ok(L.self_claims.some((s) => s.includes('本人后来的评价')), '本人评价应进 self_claims');
  assert.ok(L.unknowns.some((u) => u.includes('当时心理活动无记录')), 'unknowns 应原样透传');
});

test('分层：中长期结果进 interpretations，不用「成功/失败」二元化', () => {
  const L = buildEvidenceLayers(EPISODE);
  assert.ok(L.interpretations.some((i) => i.includes('中期结果描述')), '中期结果应进 interpretations');
  assert.ok(L.interpretations.some((i) => i.includes('长期结果描述')), '长期结果应进 interpretations');

  const banned = ['成功', '失败', '赢家'];
  for (const layer of [L.facts, L.interpretations, L.self_claims]) {
    for (const item of layer) {
      for (const b of banned) {
        assert.ok(!item.includes(b), `结果链不应出现「${b}」：${item}`);
      }
    }
  }
});

test('分层：某层无内容时返回空数组，绝不编造（规则 1.2）', () => {
  const ep: DecisionEpisode = {
    ...EPISODE,
    evidence: [{ source_id: 'B1', type: 'biography', claim: '唯一一条事实' }],
    reflection: { unknowns: [] },
  };
  const L = buildEvidenceLayers(ep);
  assert.equal(L.ai_inferences.length, 0, 'ai_inferences 应为空而不是编一条');
  assert.equal(L.unknowns.length, 0, 'unknowns 应为空而不是编一条');
});

/* ============================================================
   二、输出守卫（规则 2.5）
   ============================================================ */

test('守卫：命中「你应该」类黑名单', () => {
  assert.ok(!isClean('你应该先做低成本验证'));
  assert.ok(!isClean('我推荐你选择辅修'));
  assert.ok(!isClean('这是最优选择'));
  assert.ok(isClean('先做低成本验证的人，保留了收回决定的余地'), '正常陈述不应误伤');
});

test('守卫：命中「成功/失败」类黑名单（仅查结果链时）', () => {
  const t = '他后来取得了成功';
  assert.ok(isClean(t, ['decision']), 'decision 类不应拦这句');
  assert.ok(!isClean(t, ['outcome']), 'outcome 类应该拦这句');
});

test('守卫：改写后仍违规 → 丢弃该句', async () => {
  // 桩：改写函数故意返回仍然违规的句子
  const r = await guardText('你应该转专业', async () => '你应该考虑转专业');
  assert.equal(r.action, 'dropped');
  assert.equal(r.text, '');
});

test('守卫：改写成功 → 保留改写后的句子', async () => {
  const r = await guardText('你应该先做低成本验证', async () => '先做低成本验证的人，保留了随时收回的余地');
  assert.equal(r.action, 'rewritten');
  assert.ok(isClean(r.text));
});

test('守卫：批量处理会过滤掉丢弃项', async () => {
  const r = await guardList(
    ['正常的一句差异', '你应该立刻转专业'],
    async () => '', // 改写失败 → 丢弃
  );
  assert.equal(r.items.length, 1);
  assert.equal(r.dropped.length, 1);
});

/* ============================================================
   三、候选生成（规则 2.2-1）
   ============================================================ */

test('候选：用户有而案例没有的约束类别应成为 structure 候选', () => {
  const cands = constraintCandidates(SITUATION, EPISODE);
  assert.ok(cands.length > 0, '应产出约束差异候选');
  assert.ok(
    cands.every((c) => c.kind === 'structure'),
    '约束差都应是 structure 类',
  );
  assert.ok(
    cands.every((c) => c.refs.length > 0),
    '每个候选必须带 refs（规则 2.3 锚定 A 依赖它）',
  );
});

test('候选：时代差超过 30 年才产出 era 候选', () => {
  const old = eraCandidate({ ...EPISODE, time: { ...EPISODE.time, year: 1906 } });
  assert.equal(old.length, 1, '1906 距今 > 30 年，应产出 era 候选');
  assert.equal(old[0].kind, 'era');

  const recent = eraCandidate({ ...EPISODE, time: { ...EPISODE.time, year: CURRENT_YEAR - 5 } });
  assert.equal(recent.length, 0, '距今 5 年不应产出 era 候选');
});

test('候选：era 类最多 1 条（规则文档第四节）', () => {
  const all = buildCandidates(SITUATION, EPISODE);
  assert.ok(all.filter((c) => c.kind === 'era').length <= 1, 'era 候选不得多于 1 条');
});

test('候选：按重要性排序 structure 优先（规则 2.4）', () => {
  const all = buildCandidates(SITUATION, EPISODE);
  const order: Record<string, number> = { structure: 0, evidence: 1, era: 2, unknown: 3 };
  for (let i = 1; i < all.length; i++) {
    assert.ok(
      order[all[i - 1].kind] <= order[all[i].kind],
      `排序错误：${all[i - 1].kind} 不应排在 ${all[i].kind} 前`,
    );
  }
});

/* ============================================================
   四、反类比生成（规则 2.2-3 / 2.3）
   ============================================================ */

test('生成：无 API Key 时退化为代码候选成文，仍产出 ≥2 条', async () => {
  const r = await generateCounterAnalogy(SITUATION, EPISODE, undefined);
  assert.ok(r.details.length >= 2, `应至少 2 条，实际 ${r.details.length}`);
  assert.ok(r.texts.length === r.details.length, 'texts 与 details 应一一对应');
  assert.equal(r.meta.used_llm, false, '无 key 时不应调用 LLM');
});

test('生成：每条都要带 kind / basis / refs（前端分层渲染依赖）', async () => {
  const r = await generateCounterAnalogy(SITUATION, EPISODE, undefined);
  for (const d of r.details) {
    assert.ok(['structure', 'evidence', 'era', 'unknown'].includes(d.kind), `kind 非法：${d.kind}`);
    assert.ok(d.basis, 'basis 不能为空');
    assert.ok(Array.isArray(d.refs), 'refs 应为数组');
    assert.ok(d.text.trim().length > 0, 'text 不能为空');
  }
});

test('生成：输出不含「你应该」类指令（验收第 5 条）', async () => {
  const r = await generateCounterAnalogy(SITUATION, EPISODE, undefined);
  for (const t of r.texts) {
    const v = findViolations(t, ['decision']);
    assert.equal(v.length, 0, `输出含决策指令「${v[0]?.label}」：${t}`);
  }
});

test('生成：候选为空时用 unknown 兜底，且仍满足 ≥2 条（规则 2.3）', async () => {
  // 构造一个「处处相同」的案例：约束类别一致、可逆性一致、选项数接近、年代接近
  const same: DecisionEpisode = {
    ...EPISODE,
    time: { ...EPISODE.time, year: CURRENT_YEAR - 1 },
    decision_state: {
      ...EPISODE.decision_state,
      constraints: ['已投入两年', '转专业有成绩门槛', '可能延毕', '家庭期望'],
      reversibility: 'medium',
    },
    choice: { type: 'direct_switch', actions: ['a', 'b', 'c', 'd'] },
    retrieval_tags: [...SITUATION.unknowns, 'x'],
    evidence: [{ source_id: 'S1', type: 'biography', claim: '已提及能力匹配度与转专业成功率' }],
  };

  const cands = buildCandidates(SITUATION, same);
  const r = await generateCounterAnalogy(SITUATION, same, undefined);

  assert.ok(r.details.length >= 2, `应至少 2 条，实际 ${r.details.length}`);
  if (cands.length === 0) {
    assert.ok(
      r.details.every((d) => d.kind === 'unknown'),
      '无候选时应全部是 unknown',
    );
    assert.ok(r.meta.filled_by_unknown >= 2, 'unknown 兜底数应 ≥ 2');
  }
});

/* ============================================================
   五、真实数据冒烟（确保规则在 36 条数据上不炸）
   ============================================================ */

test('冒烟：对全部真实案例跑分层与候选，均不含违规输出', async () => {
  const episodes = loadEpisodes();
  // 本分支基于 #14，data/ 里可能只有种子样例（3 条）；
  // fu6868 的 36 条在 #19，合并后自然变多 —— 所以只要求非空，不写死 12。
  assert.ok(episodes.length >= 3, `案例数应 ≥3，实际 ${episodes.length}`);

  for (const ep of episodes) {
    const L = buildEvidenceLayers(ep);
    const tr = assertTraceable(L);
    assert.ok(tr.ok, `${ep.episode_id} 分层不可追溯：${tr.ok ? '' : tr.offenders.join(' | ')}`);

    const r = await generateCounterAnalogy(SITUATION, ep, undefined);
    assert.ok(r.details.length >= 2, `${ep.episode_id} 反类比不足 2 条`);
    for (const t of r.texts) {
      assert.equal(findViolations(t, ['decision']).length, 0, `${ep.episode_id} 输出违规：${t}`);
    }
  }
});

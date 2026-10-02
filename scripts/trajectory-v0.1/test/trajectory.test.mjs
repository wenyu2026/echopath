/**
 * trajectory-v0.1 校验器/导出器/流水线 测试套件
 * 运行：node --test scripts/trajectory-v0.1/test/
 *
 * 正式卡测试只读仓库文件；流水线测试在系统临时目录建最小仓库副本，不写工作区。
 * 测试素材全部标 synthetic（见 data/trajectory-v0.1/fixtures/）。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync, cpSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { buildCtx, validateCard, validateCardFile } from '../lib/validate.mjs';
import { exportViews } from '../lib/export.mjs';
import { runPipeline, atomicWriteJson } from '../lib/pipeline.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const REAL_CARD = join(REPO, 'data/trajectory-v0.1/cards/lu-xun.card.json');
const FIXTURE_CARD = join(REPO, 'data/trajectory-v0.1/fixtures/synthetic-person.card.json');
const FIXTURE_REGISTRY = 'data/trajectory-v0.1/fixtures/synthetic-sources.json';

const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));
const serialize = (o) => JSON.stringify(o, null, 2) + '\n';

const realCtx = () => buildCtx(REPO);
const fixtureCtx = (root = REPO) => buildCtx(root, FIXTURE_REGISTRY);

function errorsOf(result, substr) {
  const hits = result.errors.filter((e) => e.message.includes(substr));
  assert.ok(hits.length > 0, `期望出现包含「${substr}」的 error，实际 errors=${JSON.stringify(result.errors)}`);
  return hits;
}

/** 在临时目录组装最小仓库（正式数据只读拷贝 + fixture 卡与登记） */
function makeTempRepo() {
  const root = mkdtempSync(join(tmpdir(), 'traj-v01-test-'));
  mkdirSync(join(root, 'data'), { recursive: true });
  cpSync(join(REPO, 'data/sources.json'), join(root, 'data/sources.json'));
  cpSync(join(REPO, 'data/episodes.json'), join(root, 'data/episodes.json'));
  mkdirSync(join(root, 'data/trajectory-v0.1'), { recursive: true });
  cpSync(join(REPO, FIXTURE_REGISTRY), join(root, 'data/trajectory-v0.1/sources.json'));
  mkdirSync(join(root, 'data/trajectory-v0.1/cards'), { recursive: true });
  cpSync(FIXTURE_CARD, join(root, 'data/trajectory-v0.1/cards/synthetic-person.card.json'));
  return root;
}

// ---------- 1. 正式卡（鲁迅）：合法单卡通过校验并可导出 ----------
test('正式卡通过机器校验（版本/ID/引用闭合由校验器保证）', () => {
  const { errors, warnings, stats } = validateCardFile(REAL_CARD, REPO);
  assert.deepEqual(errors, []);
  assert.deepEqual(warnings, []);
  assert.equal(stats.facts, 15);
  assert.equal(stats.snapshots, 4);
  assert.equal(stats.events, 3);
});

test('正式卡导出 3 个决策前视图，全部 review_status=pending', () => {
  const card = load(REAL_CARD);
  const { views, audit } = exportViews(card);
  assert.equal(views.length, 3);
  const bySnap = new Map(views.map((v) => [v.snapshot_id, v]));
  assert.deepEqual([...bySnap.keys()].sort(), ['snap-lx-1902', 'snap-lx-1906', 'snap-lx-1918']);
  for (const v of views) {
    assert.equal(v.artifact_type, 'retrieval_view');
    assert.equal(v.review_status, 'pending', '机器检查通过不改变 pending');
    assert.ok(v.episode_id && v.person_id && v.snapshot_id);
    // 十维齐全
    assert.equal(Object.keys(v.dimensions).length, 10);
    // 引用闭合：视图内 evidence_refs 都能追溯到卡内事实
    for (const fid of v.evidence_refs) assert.ok(card.facts.some((f) => f.fact_id === fid), `悬空 ${fid}`);
  }
  // 时间审计可复核：1906 视图含同年事实 f-lx-004（靠 explicit_order）
  assert.ok(audit.checks['snap-lx-1906'].eligible.includes('f-lx-004'));
  // retrospective 事实（f-lx-007）不出现在任何视图
  for (const v of views) assert.ok(!v.prior_fact_ids.includes('f-lx-007'));
});

// ---------- 2. 悬空引用 / 重复 ID ----------
test('悬空来源引用被拒绝', () => {
  const card = load(FIXTURE_CARD);
  card.facts[1].source_refs[0].source_id = 'SYN-SRC-NOTEXIST';
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, '悬空来源引用');
});

test('重复 ID 被拒绝', () => {
  const card = load(FIXTURE_CARD);
  card.facts[1].fact_id = card.facts[0].fact_id;
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, '重复 fact_id');
});

test('维度证据引用悬空事实被拒绝', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].dimensions.life_stage.evidence_refs.push('sf-999');
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, 'sf-999');
});

// ---------- 3. 未知与证据纪律 ----------
test('有值但无证据且无 modeling_basis 的维度被拒绝（无证据必须保持 null）', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].dimensions.economic_pressure = {
    value: 'medium', raw_text: null, kind: 'inference', evidence_refs: [],
    confidence: 'medium', valid_time: null, unknown_reason: null,
  };
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, '无证据的维度必须保持 null');
});

test('未知维度缺 unknown_reason 被拒绝；缺证据但带 modeling_basis 的建模维度允许', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].dimensions.economic_pressure.unknown_reason = null;
  const r1 = validateCard(card, fixtureCtx());
  errorsOf(r1, 'unknown_reason');

  const ok = load(FIXTURE_CARD); // goal_structure/reversibility/time_window 为 modeling_basis 通过
  const r2 = validateCard(ok, fixtureCtx());
  assert.deepEqual(r2.errors, []);
});

test('retrospective 冒充决策前事实被拒绝（维度证据与 prior 两条路都堵死）', () => {
  const base = load(FIXTURE_CARD);
  const viaDimension = clone(base);
  viaDimension.snapshots[0].dimensions.new_path_validation = {
    value: 'tried', raw_text: '（synthetic）引用回忆录', kind: 'inference',
    evidence_refs: ['sf-005'], confidence: 'medium',
    valid_time: { start_year: 1905, end_year: 1907 }, unknown_reason: null,
  };
  const r1 = validateCard(viaDimension, fixtureCtx());
  errorsOf(r1, 'retrospective');

  const viaPrior = clone(base);
  viaPrior.snapshots[0].prior_fact_ids.push('sf-005');
  const r2 = validateCard(viaPrior, fixtureCtx());
  errorsOf(r2, 'retrospective');
});

test('分档标签标 kind=fact 会被警告（分档属于建模）', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].dimensions.path_investment.kind = 'fact';
  const r = validateCard(card, fixtureCtx());
  assert.ok(r.warnings.some((w) => w.message.includes('分档标签属于建模')));
  assert.deepEqual(r.errors, []);
});

// ---------- 4. 时间边界 ----------
test('注入明确晚于决策的事实 → 校验失败', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].prior_fact_ids.push('sf-004'); // 1915 > 决策 1912
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, '明确晚于决策');
});

test('同年顺序不清的事实不通过时间门槛（被导出排除，不进 prior_text）', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].prior_fact_ids.push('sf-006'); // 1912 决策同年，无 explicit_order
  const r = validateCard(card, fixtureCtx());
  assert.deepEqual(r.errors, [], '同年事实不是硬错误，而是被时间门槛排除');

  const { views, audit } = exportViews(card);
  const v = views[0];
  assert.ok(!v.prior_fact_ids.includes('sf-006'));
  assert.ok(!v.prior_text.includes('决定转学'));
  const excluded = audit.checks['SYN-S-1912'].excluded.find((x) => x.fact_id === 'sf-006');
  assert.ok(excluded && excluded.reason.includes('same_year_without_explicit_order'));
});

test('只改未来结果或声望，导出的决策前视图不变', () => {
  const base = load(FIXTURE_CARD);
  const mutated = clone(base);
  mutated.facts.find((f) => f.fact_id === 'sf-004').text = '（synthetic）1915 年获得乙地职位，并于 1920 年声名远扬。';
  const a = exportViews(base);
  const b = exportViews(mutated);
  assert.equal(serialize(a.views), serialize(b.views), '视图字节一致');
  assert.equal(serialize(a.audit), serialize(b.audit), '时间审计一致');
});

test('正式卡：改 1918—1922 年结果链（f-lx-012）不影响三个决策前视图', () => {
  const base = load(REAL_CARD);
  const mutated = clone(base);
  mutated.facts.find((f) => f.fact_id === 'f-lx-012').text = '（虚构改动）1918—1922 年创作的十四篇小说后来收入《呐喊》，并获后世盛名。';
  assert.equal(serialize(exportViews(base).views), serialize(exportViews(mutated).views));
});

test('后来发表的可靠资料支持早年事实，不因出版晚被错误排除', () => {
  const card = load(FIXTURE_CARD); // sf-003 发生 1905–1907，来源 1990 年成书
  const { views, audit } = exportViews(card);
  assert.ok(views[0].prior_fact_ids.includes('sf-003'));
  const rec = audit.checks['SYN-S-1912'].eligible;
  assert.ok(rec.includes('sf-003'), '发生时间早于决策即合格，与资料形成时间无关');
});

// ---------- 4b. 顺序证据纪律（QA 弱扣件加固：受控依据 + 人工裁决 + 视图显式标注） ----------
test('视图显式暴露顺序依赖事实：temporal_caveats / order_dependent_fact_ids / has_pending_order_review', () => {
  const card = load(REAL_CARD);
  const { views } = exportViews(card);
  const v1918 = views.find((v) => v.snapshot_id === 'snap-lx-1918');
  assert.deepEqual(v1918.order_dependent_fact_ids, ['f-lx-008'], '1918 视图中仅 f-lx-008 靠顺序依据进门');
  assert.equal(v1918.temporal_caveats.length, 1);
  assert.equal(v1918.temporal_caveats[0].basis, 'formal_episode_chain');
  assert.equal(v1918.temporal_caveats[0].human_adjudication, 'pending');
  assert.equal(v1918.has_pending_order_review, true, '未裁决的顺序证据必须显式标记');
  // 鲁迅 1902/1906 的顺序依据是解析性前提，同样待人工裁决
  assert.equal(views.find((v) => v.snapshot_id === 'snap-lx-1906').has_pending_order_review, true);
});

test('explicit_order 缺 human_adjudication 被拒绝（顺序证据必须提交真人复核）', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].prior_fact_ids.push('sf-006'); // 1912 同年
  card.snapshots[0].prior_order_notes.push({
    fact_id: 'sf-006',
    explicit_order: { justification: '（synthetic）', refs: ['SYN-SRC-SELF'], basis: 'logical_precondition' },
  });
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, 'human_adjudication');
});

test('confirmed 裁决缺真人签字被拒绝', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].prior_fact_ids.push('sf-006');
  card.snapshots[0].prior_order_notes.push({
    fact_id: 'sf-006',
    explicit_order: {
      justification: '（synthetic）', refs: ['SYN-SRC-SELF'], basis: 'logical_precondition',
      human_adjudication: { status: 'confirmed', by: null, on: null },
    },
  });
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, 'approved 需要真人签字'.slice(0, 0) + '真人签字');
});

test('basis 不在受控词表被拒绝', () => {
  const card = load(FIXTURE_CARD);
  card.snapshots[0].prior_fact_ids.push('sf-006');
  card.snapshots[0].prior_order_notes.push({
    fact_id: 'sf-006',
    explicit_order: {
      justification: '（synthetic）', refs: ['SYN-SRC-SELF'], basis: '我觉得顺序没问题',
      human_adjudication: { status: 'pending' },
    },
  });
  const r = validateCard(card, fixtureCtx());
  errorsOf(r, '受控词表');
});

test('被真人驳回的顺序事实：校验器要求移出 prior，导出器强制排除', () => {
  const card = load(REAL_CARD);
  const note = card.snapshots.find((s) => s.snapshot_id === 'snap-lx-1918')
    .prior_order_notes.find((n) => n.fact_id === 'f-lx-008');
  note.explicit_order.human_adjudication.status = 'rejected';
  note.explicit_order.human_adjudication.by = 'reviewer-a';
  note.explicit_order.human_adjudication.on = '2026-10-03';
  const r = validateCard(card, realCtx());
  errorsOf(r, '驳回');

  const { views } = exportViews(card);
  const v1918 = views.find((v) => v.snapshot_id === 'snap-lx-1918');
  assert.ok(!v1918.prior_fact_ids.includes('f-lx-008'), '驳回后不得进入决策前视图');
  // 仅靠 f-lx-008 支撑的维度回到 null（new_path_validation；resource_access 的另一引用 f-lx-009 亦被同年门槛排除）
  assert.equal(v1918.dimensions.new_path_validation.value, null);
  assert.ok(v1918.dimensions.new_path_validation.unknown_reason.includes('时间门槛'));
  assert.equal(v1918.dimensions.resource_access.value, null);
  assert.equal(v1918.has_pending_order_review, false);
});

// ---------- 4c. 防因果倒置回归（QA 2026-10-02：f-al-003 曾把「1990 获奖」倒灌进决策前视图） ----------
test('李安 1990 决策前视图不得剧透获奖结果（投稿是因，获奖是果）', () => {
  const card = load(join(REPO, 'data/trajectory-v0.1/cards/ang-lee.card.json'));
  const { views } = exportViews(card);
  const v1990 = views.find((v) => v.view_id === 'view-0.1-ang_lee-snap-al-1990');
  assert.ok(v1990, '存在 snap-al-1990 视图');
  // 处境必须在：六年间隙作为决策前提保留（“六年间项目屡…”同时覆盖“屡未成行/屡屡未能成行”两种表述）
  assert.ok(v1990.prior_text.includes('六年间项目屡'), `prior_text 应保留六年未成行处境，实际=${v1990.prior_text}`);
  // 结果严禁倒灌：投稿决策之前不得出现获奖
  assert.ok(!v1990.prior_text.includes('获奖'), 'prior_text 不得出现「获奖」——未来结果倒灌');
  assert.ok(!v1990.prior_fact_ids.includes('f-al-008'), 'f-al-008（获奖，结果层）不得进入 prior_fact_ids');
  // 维度文字同样不得剧透
  for (const [key, d] of Object.entries(v1990.dimensions)) {
    const s = JSON.stringify(d);
    assert.ok(!s.includes('获奖'), `维度 ${key} 不得提及获奖`);
  }
  // 已提交的视图文件必须与从卡重导出一致（改卡未重跑流水线会被此处抓住）
  const committedViews = load(join(REPO, 'data/trajectory-v0.1/retrieval-views/card-ang_lee-v0.1.views.json'));
  const committed = committedViews.views.find((v) => v.view_id === 'view-0.1-ang_lee-snap-al-1990');
  assert.deepEqual(committed, v1990, '已提交视图与卡重导出不一致——请重跑 run-pipeline.mjs');
  // 获奖事实应挂在两次事件的 outcome 层（1984 mid_term 与 1990 short_term）
  const ev1984 = card.events.find((e) => e.event_id === 'ev-al-1984');
  const ev1990 = card.events.find((e) => e.event_id === 'ev-al-1990');
  assert.ok(ev1984.outcome_fact_ids.includes('f-al-008'));
  assert.ok(ev1990.outcome_fact_ids.includes('f-al-008'));
});

// ---------- 5. 确定性与检查点 ----------
test('固定输入重复导出逐字节一致（纯函数与流水线两层）', () => {
  const card = load(REAL_CARD);
  const a = exportViews(card);
  const b = exportViews(card);
  assert.equal(serialize(a.views), serialize(b.views));
  assert.equal(serialize(a.audit), serialize(b.audit));

  const root = makeTempRepo();
  try {
    runPipeline(join(root, 'data/trajectory-v0.1/cards/synthetic-person.card.json'), root);
    const f1 = readFileSync(join(root, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json'), 'utf8');
    runPipeline(join(root, 'data/trajectory-v0.1/cards/synthetic-person.card.json'), root, { force: true });
    const f2 = readFileSync(join(root, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json'), 'utf8');
    assert.equal(f1, f2, '两次完整流水线导出一致');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('中断检查点可恢复：write 阶段失败不落盘，重跑完成后输出与干净运行一致', () => {
  const rootFail = makeTempRepo();
  const rootClean = makeTempRepo();
  const cardIn = (root) => join(root, 'data/trajectory-v0.1/cards/synthetic-person.card.json');
  try {
    assert.throws(() => runPipeline(cardIn(rootFail), rootFail, { failAt: 'write' }), /注入失败/);
    const viewsFile = join(rootFail, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json');
    assert.ok(!existsSync(viewsFile), '失败输出未写入视图文件');
    assert.ok(!existsSync(join(rootFail, 'data/trajectory-v0.1/manifest.json')), '失败运行未产生可用 manifest');
    // 最近成功检查点（export）已保存
    assert.ok(existsSync(join(rootFail, 'data/trajectory-v0.1/pipeline/state/card-SYN-P-1-v0.1/export.json')));

    runPipeline(cardIn(rootFail), rootFail); // 从检查点恢复
    runPipeline(cardIn(rootClean), rootClean);
    const recovered = readFileSync(join(rootFail, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json'), 'utf8');
    const clean = readFileSync(join(rootClean, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json'), 'utf8');
    assert.equal(recovered, clean, '恢复后的导出与干净运行一致');
  } finally {
    rmSync(rootFail, { recursive: true, force: true });
    rmSync(rootClean, { recursive: true, force: true });
  }
});

test('校验失败的卡不产生任何可用输出（失败不进 manifest）', () => {
  const root = makeTempRepo();
  try {
    const p = join(root, 'data/trajectory-v0.1/cards/synthetic-person.card.json');
    const card = load(p);
    card.facts[1].source_refs[0].source_id = 'SYN-SRC-NOTEXIST';
    writeFileSync(p, serialize(card));
    assert.throws(() => runPipeline(p, root), /校验失败/);
    assert.ok(!existsSync(join(root, 'data/trajectory-v0.1/retrieval-views/card-SYN-P-1-v0.1.views.json')));
    assert.ok(!existsSync(join(root, 'data/trajectory-v0.1/manifest.json')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------- 6. 审核状态 ----------
test('机器检查通过但缺真人签字的卡保持 pending；approved 缺签字被拒绝', () => {
  const card = load(FIXTURE_CARD);
  const { views } = exportViews(card);
  assert.ok(views.every((v) => v.review_status === 'pending'));

  const bad = clone(card);
  bad.review.human_review.status = 'approved';
  const r = validateCard(bad, fixtureCtx());
  errorsOf(r, 'approved 需要真人签字');
});

// ---------- 7. 场景覆盖与 partial 报告 ----------
test('manifest 报告三场景覆盖与第二候选缺口（不以文件数代替质量）', async () => {
  const { buildManifest } = await import('../lib/pipeline.mjs');
  const card = load(REAL_CARD);
  const { views } = exportViews(card);
  const manifest = buildManifest(REPO, [
    { card, result: { errors: [], warnings: [], stats: { facts: 15, snapshots: 4, events: 3 } }, views, file: 'data/trajectory-v0.1/cards/lu-xun.card.json' },
  ]);
  assert.equal(manifest.cards.length, 1);
  for (const s of ['转专业', '考研还是就业', '大厂还是小公司/创业']) {
    const sc = manifest.scenario_coverage[s];
    assert.ok(sc, `场景 ${s} 有覆盖记录`);
    assert.equal(sc.second_candidate_pending, true, '每场景第二候选 pending 如实报告');
  }
  assert.ok(manifest.module_partial_note.includes('不以文件数代替质量'));
});

test('工作量不足且未标 partial 的正式卡被拒绝；标 partial 且列缺口可通过', () => {
  // 用真实卡裁剪成最小正式卡（保持引用闭合），触发工作量规则
  const card = load(REAL_CARD);
  const keep = ['f-lx-000', 'f-lx-001', 'f-lx-002'];
  card.facts = card.facts.filter((f) => keep.includes(f.fact_id));
  card.snapshots = card.snapshots.filter((s) => s.snapshot_id === 'snap-lx-1902');
  card.events = card.events.filter((e) => e.event_id === 'ev-lx-1902');
  card.events[0].outcome_fact_ids = [];
  card.mechanisms = card.mechanisms.filter((m) => m.mechanism_id === 'mech-lx-1902');

  const r1 = validateCard(card, realCtx());
  errorsOf(r1, 'partial');

  card.partial = { status: true, gaps: ['（测试）裁剪后仅 3 条事实，其余因资料缺口未收录'] };
  const r2 = validateCard(card, realCtx());
  assert.deepEqual(r2.errors, []);
  assert.ok(r2.warnings.some((w) => w.message.includes('partial')));
});

// ---------- 8. 原子写 ----------
test('atomicWriteJson：目标保持原状（先临时文件再替换）', () => {
  const root = makeTempRepo();
  try {
    const f = join(root, 'atomic-test.json');
    atomicWriteJson(f, { v: 1 });
    assert.equal(JSON.parse(readFileSync(f, 'utf8')).v, 1);
    atomicWriteJson(f, { v: 2 });
    assert.equal(JSON.parse(readFileSync(f, 'utf8')).v, 2);
    assert.ok(!existsSync(`${f}.tmp`), '不残留临时文件');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

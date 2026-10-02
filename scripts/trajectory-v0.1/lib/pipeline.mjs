/**
 * 离线制作流水线（阶段二最小实现）：
 *   load → validate → export → write → manifest
 *
 * - 每阶段产出检查点（先写临时文件再替换；失败不把半成品标成完成）。
 * - 中断后重跑：输入哈希未变的已完成阶段直接复用，从最近成功阶段继续。
 * - 固定输入重复执行产生确定一致的导出（视图无时间戳）。
 * - 测试可用 opts.failAt 在指定阶段前注入失败，验证「失败输出不进入可用 manifest」。
 *
 * 全离线运行：不读取任何 key，不访问网络。模型抽取见 prompts/（人工核对后经 import-facts.mjs 进入草稿）。
 */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, relative, posix } from 'node:path';
import { buildCtx, validateCard } from './validate.mjs';
import { exportViews } from './export.mjs';

export const STAGES = ['load', 'validate', 'export', 'write', 'manifest'];

function sha256(obj) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

/** 原子写 JSON：先写 .tmp 再 rename，失败时目标文件保持原状 */
export function atomicWriteJson(absPath, data) {
  const tmp = `${absPath}.tmp`;
  mkdirSync(join(absPath, '..'), { recursive: true });
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  renameSync(tmp, absPath);
}

function toPosix(p) {
  return p.split('\\').join('/');
}

/** 扫描 cards 目录下所有卡（不含 fixtures），逐卡校验并构建 manifest 与场景覆盖报告 */
export function buildManifest(repoRoot, cardResults) {
  const cards = [];
  const fixtures = [];
  const scenarioMap = new Map();
  for (const r of cardResults) {
    if (r.card.synthetic === true) {
      fixtures.push({ card_id: r.card.card_id, file: r.file, note: 'synthetic 测试素材，不进入正式候选与排名' });
      continue;
    }
    const perScenario = {};
    let orderDependentCount = 0;
    let pendingOrderReviews = 0;
    for (const v of r.views ?? []) {
      if (!v.scenario) continue;
      (perScenario[v.scenario] ??= []).push(v.episode_id);
      const bucket = scenarioMap.get(v.scenario) ?? { candidates: new Set(), persons: new Set() };
      bucket.candidates.add(v.episode_id);
      bucket.persons.add(v.person_id);
      scenarioMap.set(v.scenario, bucket);
    }
    for (const v of r.views ?? []) {
      orderDependentCount += (v.order_dependent_fact_ids ?? []).length;
      if (v.has_pending_order_review) pendingOrderReviews += 1;
    }
    cards.push({
      card_id: r.card.card_id,
      person_id: r.card.person_id,
      card_file: r.file,
      stats: r.result.stats,
      scenarios: [...new Set((r.views ?? []).map((v) => v.scenario).filter(Boolean))],
      per_scenario_episodes: perScenario,
      views_file: r.views_file ?? null,
      audit_file: r.audit_file ?? null,
      order_dependent_facts: orderDependentCount,
      views_with_pending_order_review: pendingOrderReviews,
      machine_check: {
        status: r.result.errors.length === 0 ? 'pass' : 'fail',
        errors: r.result.errors.length,
        warnings: r.result.warnings.map((w) => w.message),
        command: `node scripts/trajectory-v0.1/validate-card.mjs ${r.file}`,
      },
      human_review: r.card.review?.human_review?.status ?? 'pending',
      partial: r.card.partial ?? { status: false, gaps: [] },
    });
  }
  const scenarioCoverage = {};
  for (const [scenario, bucket] of [...scenarioMap.entries()].sort()) {
    scenarioCoverage[scenario] = {
      candidates: [...bucket.candidates].sort(),
      persons: [...bucket.persons].sort(),
      second_candidate_pending: bucket.candidates.size < 2,
    };
  }
  for (const s of ['转专业', '考研还是就业', '大厂还是小公司/创业']) {
    if (!scenarioCoverage[s]) {
      scenarioCoverage[s] = { candidates: [], persons: [], second_candidate_pending: true, gap: '本场景暂无已导出视图' };
    }
  }
  return {
    schema_version: '0.1',
    artifact_type: 'trajectory_manifest',
    contract: '.agent/handoffs/agent-cards-v0.1/02-two-person-work-packages.md §3（v0.1）',
    experiment: 'trajectory-v0.1 隔离试验数据源：不进入正式排名，不混合旧评分；正式 episodes/sources/review/mechanisms 未改动',
    cards,
    test_fixtures: fixtures,
    scenario_coverage: scenarioCoverage,
    module_partial_note:
      '六卡目标未完成前，每场景第二候选为 pending；覆盖报告以视图为单位，不以文件数代替质量。',
    order_discipline:
      'order_dependent_facts 计入靠 explicit_order 才进入决策前视图的事实数；views_with_pending_order_review > 0 表示该卡存在未经真人裁决的顺序证据，不得用于正式排名。',
    review_discipline: 'manifest 中 human_review 为卡片自报状态；机器校验通过不改变其 pending；approved 需真人与范围，见各卡 review 块与审查清单。',
  };
}

/**
 * 运行流水线。
 * @returns {{ok: true, stages: string[]}} 或抛出错误（校验失败 / 注入失败）
 */
export function runPipeline(cardPath, repoRoot = process.cwd(), opts = {}) {
  const root = resolve(repoRoot);
  const cardAbs = resolve(cardPath);
  const card = JSON.parse(readFileSync(cardAbs, 'utf8'));
  const cardId = card.card_id;
  const stateDir = join(root, 'data/trajectory-v0.1/pipeline/state', cardId);
  mkdirSync(stateDir, { recursive: true });
  const cp = (name) => join(stateDir, `${name}.json`);

  const cardHash = sha256(card);
  const done = new Set();
  if (opts.force !== true) {
    for (const s of STAGES) {
      const f = cp(s);
      if (existsSync(f)) {
        const c = JSON.parse(readFileSync(f, 'utf8'));
        if (c._card_hash === cardHash) done.add(s);
      }
    }
  } else {
    for (const s of STAGES) if (existsSync(cp(s))) unlinkSync(cp(s));
  }

  const stage = (name, compute) => {
    if (opts.failAt === name) throw new Error(`[injected] 在阶段 ${name} 前注入失败（测试用）`);
    if (done.has(name)) return JSON.parse(readFileSync(cp(name), 'utf8'))._payload;
    const payload = compute();
    atomicWriteJson(cp(name), { _card_hash: cardHash, _stage: name, _payload: payload });
    return payload;
  };

  const rel = (abs) => toPosix(relative(root, abs));

  // 1. load
  stage('load', () => ({ card_file: rel(cardAbs), card_hash: cardHash }));

  // 2. validate
  const ctx = buildCtx(root);
  const result = stage('validate', () => {
    const r = validateCard(card, ctx);
    if (r.errors.length > 0) {
      const e = new Error(`校验失败（${r.errors.length} 个错误）:\n` + r.errors.map((x) => `  ERROR: ${x.message}`).join('\n'));
      e.validation = r;
      throw e;
    }
    return { errors: r.errors, warnings: r.warnings, stats: r.stats };
  });

  // 3. export
  const { views, audit } = stage('export', () => {
    const out = exportViews(card);
    if (out.views.length === 0) throw new Error('导出结果为空：没有任何决策快照可导出视图');
    return out;
  });

  // 4. write（原子：视图 + 审计）
  const written = stage('write', () => {
    const viewsFile = join(root, 'data/trajectory-v0.1/retrieval-views', `${cardId}.views.json`);
    const auditFile = join(root, 'data/trajectory-v0.1/audits', `${cardId}.temporal-audit.json`);
    atomicWriteJson(viewsFile, {
      schema_version: '0.1',
      artifact_type: 'retrieval_views',
      card_id: cardId,
      person_id: card.person_id,
      views,
    });
    atomicWriteJson(auditFile, audit);
    return { views_file: rel(viewsFile), audit_file: rel(auditFile) };
  });

  // 5. manifest：扫描全部卡（含本轮结果），原子更新
  stage('manifest', () => {
    const cardsDir = join(root, 'data/trajectory-v0.1/cards');
    const results = [];
    for (const f of existsSync(cardsDir) ? cardsCardFiles(cardsDir) : []) {
      const c = JSON.parse(readFileSync(f, 'utf8'));
      const isSelf = f === cardAbs;
      const r = isSelf
        ? { card, result: { errors: [], warnings: result.warnings, stats: result.stats }, views, ...written, file: rel(f) }
        : { card: c, result: validateCard(c, ctx), views: readViewsIfExists(root, c.card_id), file: rel(f) };
      results.push(r);
    }
    const manifest = buildManifest(root, results);
    atomicWriteJson(join(root, 'data/trajectory-v0.1/manifest.json'), manifest);
    return { cards: manifest.cards.length };
  });

  return { ok: true, card_id: cardId, stats: result.stats, warnings: result.warnings, ...written };
}

function cardsCardFiles(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.card.json') && !f.endsWith('.tmp'))
    .sort()
    .map((f) => join(dir, f));
}

function readViewsIfExists(root, cardId) {
  const f = join(root, 'data/trajectory-v0.1/retrieval-views', `${cardId}.views.json`);
  if (!existsSync(f)) return [];
  return JSON.parse(readFileSync(f, 'utf8')).views ?? [];
}

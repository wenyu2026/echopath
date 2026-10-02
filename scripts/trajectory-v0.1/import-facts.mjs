#!/usr/bin/env node
/**
 * 无密钥人工录入 / 已有事实导入路径（全离线）：
 *   node scripts/trajectory-v0.1/import-facts.mjs <facts-draft.json>
 *
 * 输入 JSON 形如：
 * {
 *   "target_person_id": "lu_xun",
 *   "source_note": "人工摘录自《XX》第X章（须给出具体定位；来源需先在 sources.json 登记）",
 *   "facts": [
 *     { "text": "...", "occurred": {"start_year": 1906, "end_year": 1906},
 *       "kind": "fact", "confidence": "medium",
 *       "source_refs": [{"source_id": "LX-PREFACE", "locator": "..."}],
 *       "notes": "..." }
 *   ]
 * }
 *
 * 行为：校验每条事实的结构与引用闭合，分配稳定 ID（f-<人物前缀>-<序号>，从现有最大序号+1，
 * 已存在相同 text 的事实跳过 —— 不重复编号、不重排），输出可直接合并进卡片 facts 的草稿到 stdout。
 * 模型抽取结果必须先经人工核对再走本入口；本脚本不调用任何模型。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildCtx } from './lib/validate.mjs';

const target = process.argv[2];
if (!target) {
  console.error('用法: node scripts/trajectory-v0.1/import-facts.mjs <facts-draft.json>');
  process.exit(2);
}

const draft = JSON.parse(readFileSync(resolve(target), 'utf8'));
const ctx = buildCtx(process.cwd());

// 从登记与既有卡推断人物前缀（如 lu_xun → lx）
const prefix = String(draft.target_person_id ?? '')
  .split('_')
  .map((w) => w[0])
  .join('')
  .slice(0, 4) || 'x';

const problems = [];
const imported = [];
let next = 1;

// 既有卡中已存在的同文事实跳过（稳定 ID：不为重复内容新编号）
const existingCards = [];
try {
  const { readdirSync } = await import('node:fs');
  const dir = resolve('data/trajectory-v0.1/cards');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.card.json')).sort()) {
    existingCards.push(JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
  }
} catch { /* cards 目录不存在时忽略 */ }
const existingTexts = new Set(existingCards.flatMap((c) => (c.facts ?? []).map((f) => f.text)));
const existingIds = new Set(existingCards.flatMap((c) => (c.facts ?? []).map((f) => f.fact_id)));
for (const id of existingIds) {
  const m = /^f-(.+?)-(\d+)$/.exec(id);
  if (m && m[1] === prefix) next = Math.max(next, Number(m[2]) + 1);
}

for (const [i, f] of (draft.facts ?? []).entries()) {
  const where = `facts[${i}]`;
  if (!f.text) { problems.push(`${where}: 缺少 text`); continue; }
  if (!f.occurred || typeof f.occurred !== 'object') { problems.push(`${where}: 缺少 occurred 年份区间`); continue; }
  if (!['fact', 'inference', 'retrospective'].includes(f.kind)) { problems.push(`${where}: kind 非法`); continue; }
  if (!['high', 'medium', 'low'].includes(f.confidence)) { problems.push(`${where}: confidence 必须明确标注`); continue; }
  if (!Array.isArray(f.source_refs) || f.source_refs.length === 0) { problems.push(`${where}: 必须绑定来源与定位`); continue; }
  for (const r of f.source_refs) {
    if (!ctx.registry.sources?.[r.source_id]) problems.push(`${where}: 来源 ${r.source_id} 未登记（先更新 data/trajectory-v0.1/sources.json 并同步正式库）`);
    else if (!r.locator) problems.push(`${where}: 来源 ${r.source_id} 缺 locator`);
  }
}

// 全有或全无：任何一条有问题就整批拒绝，避免半批导入造成 ID 断层
if (problems.length) {
  console.error(`导入被拒绝（${problems.length} 个问题）:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

for (const f of draft.facts ?? []) {
  if (existingTexts.has(f.text)) continue; // 同文事实跳过：不重复编号、不重排
  const fact_id = `f-${prefix}-${String(next).padStart(3, '0')}`;
  next += 1;
  imported.push({
    fact_id,
    time_scope: f.occurred.start_year === null && f.occurred.end_year === null
      ? 'interval'
      : (f.occurred.start_year === f.occurred.end_year ? 'point' : 'interval'),
    ...f,
    notes: f.notes ?? draft.source_note ?? '',
  });
}

console.log(JSON.stringify({
  schema_version: '0.1',
  artifact_type: 'facts_import_draft',
  target_person_id: draft.target_person_id,
  imported_count: imported.length,
  skipped_duplicates: (draft.facts ?? []).length - imported.length,
  review_note: '导入草稿仍需人工核对原文定位后，手工并入卡片 facts 并重跑流水线；本步骤不产生任何「已审核」状态。',
  facts: imported,
}, null, 2));

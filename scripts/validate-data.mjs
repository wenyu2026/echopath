#!/usr/bin/env node
/**
 * Decision Episode 数据校验
 * ============================================
 * 用法：
 *   npm run validate:data                    # 校验 data/episodes.json
 *   node scripts/validate-data.mjs <file>    # 校验指定文件
 *
 * 依据：.agent/DecisionEpisode-Schema.md
 * 数据负责人（#13）提交前必须跑通本脚本。
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = process.argv[2]
  ? resolve(process.argv[2])
  : join(__dirname, '..', 'data', 'episodes.json');

const CHOICE_TYPES = [
  'persist', 'direct_switch', 'explore_then_switch',
  'explore_then_persist', 'abandon', 'dual_track',
];
const EVIDENCE_TYPES = [
  'self_writing', 'biography', 'interview', 'encyclopedia', 'ai_inference',
];
const LEVELS = ['low', 'medium', 'high'];

const errors = [];
const warnings = [];

function fail(id, msg) { errors.push(`[${id}] ${msg}`); }
function warn(id, msg) { warnings.push(`[${id}] ${msg}`); }

function checkStringArray(id, field, arr, min, max) {
  if (!Array.isArray(arr)) { fail(id, `${field} 必须是数组`); return; }
  if (arr.length < min || arr.length > max) {
    fail(id, `${field} 应有 ${min}-${max} 项，实际 ${arr.length} 项`);
  }
  arr.forEach((v, i) => {
    if (typeof v !== 'string' || !v.trim()) fail(id, `${field}[${i}] 必须是非空字符串`);
  });
}

// ---------- 读取 ----------
let raw;
try {
  raw = JSON.parse(readFileSync(DATA, 'utf8'));
} catch (e) {
  console.error(`❌ 无法解析 ${DATA}\n   ${e.message}`);
  process.exit(1);
}

const episodes = Array.isArray(raw) ? raw : raw.episodes;
if (!Array.isArray(episodes)) {
  console.error('❌ 数据格式错误：应为数组，或含 episodes 数组的对象');
  process.exit(1);
}

console.log(`\n校验 ${episodes.length} 条 Decision Episode ...\n`);

// ---------- 逐条校验 ----------
const seenIds = new Set();
const choiceTypeCount = {};

for (const ep of episodes) {
  const id = ep.episode_id || '(缺少 episode_id)';

  // 唯一性
  if (!ep.episode_id) fail(id, '缺少 episode_id');
  else if (seenIds.has(ep.episode_id)) fail(id, 'episode_id 重复');
  else seenIds.add(ep.episode_id);

  // person
  if (!ep.person?.name) fail(id, '缺少 person.name');
  if (!Array.isArray(ep.person?.tags) || ep.person.tags.length === 0) {
    fail(id, 'person.tags 必须是非空数组');
  }

  // time
  if (typeof ep.time?.year !== 'number') fail(id, '缺少 time.year（数字）');
  if (!ep.time?.stage) fail(id, '缺少 time.stage');

  // prior_path
  checkStringArray(id, 'prior_path', ep.prior_path, 1, 10);

  // decision_state
  const ds = ep.decision_state;
  if (!ds) fail(id, '缺少 decision_state');
  else {
    if (!ds.dilemma) fail(id, '缺少 decision_state.dilemma');
    if (!String(ds.dilemma).includes('vs')) {
      warn(id, `decision_state.dilemma 建议写成 "A vs B" 形式`);
    }
    checkStringArray(id, 'decision_state.options', ds.options, 2, 5);
    checkStringArray(id, 'decision_state.constraints', ds.constraints, 2, 6);
    checkStringArray(id, 'decision_state.goals', ds.goals, 2, 5);
    if (!LEVELS.includes(ds.risk)) fail(id, `decision_state.risk 必须是 ${LEVELS.join('/')}`);
    if (!LEVELS.includes(ds.reversibility)) fail(id, `decision_state.reversibility 必须是 ${LEVELS.join('/')}`);
  }

  // choice
  if (!ep.choice) fail(id, '缺少 choice');
  else {
    if (!CHOICE_TYPES.includes(ep.choice.type)) {
      fail(id, `choice.type "${ep.choice.type}" 不在枚举内：${CHOICE_TYPES.join(', ')}`);
    } else {
      choiceTypeCount[ep.choice.type] = (choiceTypeCount[ep.choice.type] || 0) + 1;
    }
    checkStringArray(id, 'choice.actions', ep.choice.actions, 1, 10);
  }

  // outcomes（短/中/长期都要有）
  const oc = ep.outcomes;
  if (!oc) fail(id, '缺少 outcomes');
  else {
    for (const k of ['short_term', 'mid_term', 'long_term']) {
      if (!oc[k]) fail(id, `缺少 outcomes.${k}（必须分短/中/长期）`);
    }
  }

  // reflection
  if (!ep.reflection) fail(id, '缺少 reflection');
  else checkStringArray(id, 'reflection.unknowns', ep.reflection.unknowns, 0, 10);

  // evidence —— 最关键
  if (!Array.isArray(ep.evidence) || ep.evidence.length === 0) {
    fail(id, '缺少 evidence（每条案例必须至少 1 个来源）');
  } else {
    ep.evidence.forEach((ev, i) => {
      if (!ev.source_id) fail(id, `evidence[${i}] 缺少 source_id`);
      if (!EVIDENCE_TYPES.includes(ev.type)) {
        fail(id, `evidence[${i}].type "${ev.type}" 不在枚举内`);
      }
      if (!ev.claim) fail(id, `evidence[${i}] 缺少 claim`);
    });
    if (!ep.evidence.some((e) => e.type !== 'ai_inference')) {
      fail(id, 'evidence 全是 ai_inference —— 至少要有 1 条真实来源');
    }
  }

  // retrieval_tags
  checkStringArray(id, 'retrieval_tags', ep.retrieval_tags, 1, 12);
}

// ---------- 全局校验 ----------
const typesUsed = Object.keys(choiceTypeCount);

console.log('choice.type 分布：');
for (const [t, c] of Object.entries(choiceTypeCount)) {
  console.log(`   ${t.padEnd(22)} ${c} 条`);
}

if (typesUsed.length < 2) {
  fail('GLOBAL', `choice.type 只用了 ${typesUsed.length} 种，多样性不足（演示要求至少覆盖 2 种）`);
}
if (episodes.length >= 12 && typesUsed.length < 4) {
  warn('GLOBAL', `已有 ${episodes.length} 条，但 choice.type 只覆盖 ${typesUsed.length} 种，建议扩到 4 种以上`);
}

// 结果分布检查（防幸存者偏差）
const tags = episodes.flatMap((e) => e.retrieval_tags || []);
const hasNegative = tags.some((t) => /受损|失败|不适合|放弃/.test(t));
if (episodes.length >= 12 && !hasNegative) {
  warn('GLOBAL', '未发现"负面结果"案例，注意幸存者偏差（方案要求覆盖失败/长期受损）');
}

// ---------- 输出 ----------
console.log('');
if (warnings.length) {
  console.log(`⚠️  ${warnings.length} 条警告：`);
  warnings.forEach((w) => console.log(`   ${w}`));
  console.log('');
}

if (errors.length) {
  console.log(`❌ ${errors.length} 个错误：`);
  errors.forEach((e) => console.log(`   ${e}`));
  console.log('');
  process.exit(1);
}

console.log(`✅ 校验通过：${episodes.length} 条案例，choice.type 覆盖 ${typesUsed.length} 种\n`);

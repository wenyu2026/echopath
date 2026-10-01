#!/usr/bin/env node
// Offline checks verify structure and references, not historical truth.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHOICES = ['persist', 'direct_switch', 'explore_then_switch', 'explore_then_persist', 'abandon', 'dual_track'];
const EVIDENCE = ['self_writing', 'biography', 'interview', 'encyclopedia', 'ai_inference'];
const THEMES = ['转专业', '考研还是就业', '大厂还是小公司/创业'];
const NEGATIVES = ['坚持但长期受损', '转向后不适合'];
const INFERRED = ['decision_state', 'choice.type', 'time.stage', 'person.tags', 'retrieval_tags'];
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const string = v => typeof v === 'string' && v.trim().length > 0;
const list = v => Array.isArray(v) ? v : [];
const at = (v, path) => path.split('.').reduce((x, key) => x?.[key], v);
const url = value => {
  if (!string(value)) return false;
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) && u.hostname.includes('.') && !u.username && !u.password &&
      !['example.com', 'example.org', 'example.net'].includes(u.hostname);
  } catch { return false; }
};
const date = v => string(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;

export function validateDataset(raw, sourceFile, reviewFile, { milestone = 'final' } = {}) {
  const errors = [], warnings = [];
  const fail = (id, msg) => errors.push(`[${id}] ${msg}`);
  const nonempty = (id, field, v) => { if (!string(v)) fail(id, `${field} 必须是非空字符串`); };
  const strings = (id, field, v, min = 1, max = 100) => {
    if (!Array.isArray(v) || v.length < min || v.length > max || v.some(x => !string(x))) fail(id, `${field} 必须是 ${min}–${max} 项非空字符串数组`);
  };
  if (!['initial', 'final'].includes(milestone)) fail('GLOBAL', 'milestone 必须为 initial/final');
  const episodes = Array.isArray(raw) ? raw : raw?.episodes;
  if (!Array.isArray(episodes)) return { errors: ['[GLOBAL] episodes 必须是数组'], warnings, counts: {} };
  if (episodes.length < (milestone === 'initial' ? 12 : 36)) fail('GLOBAL', `${milestone} 阶段案例数量不足`);
  if (episodes.length > 60) warnings.push('超过本次 36–60 条范围，请复核。');
  const registry = new Map();
  if (!Array.isArray(sourceFile?.sources)) fail('SOURCES', '缺少 sources 数组');
  for (const s of list(sourceFile?.sources)) {
    if (!object(s)) { fail('SOURCES', '来源必须是对象'); continue; }
    const id = s.source_id;
    nonempty('SOURCES', 'source_id', id);
    if (registry.has(id)) fail(id, 'source_id 重复');
    registry.set(id, s);
    for (const key of ['title', 'publisher', 'locator', 'limitations']) nonempty(id, key, s[key]);
    if (!EVIDENCE.includes(s.type)) fail(id, '来源类型不合法');
    if (!date(s.accessed_on)) fail(id, 'accessed_on 必须是有效日期');
    if (!['page', 'search_index', 'local'].includes(s.access_method)) fail(id, '缺少访问方式');
    if (s.type !== 'ai_inference') {
      if (!url(s.url)) fail(id, '史料必须有 HTTP(S) URL');
      if (s.access_method === 'local') fail(id, '外部史料不能标为 local');
    } else if (!string(s.local_path) && !url(s.url)) fail(id, '推断规则也须可追溯');
  }
  if (!Array.isArray(reviewFile?.episodes)) fail('REVIEW', '缺少逐条复核记录');
  if (reviewFile?.release_stage !== milestone) fail('REVIEW', 'release_stage 与校验阶段不符');
  if (!['pending', 'approved'].includes(reviewFile?.human_review)) fail('REVIEW', '须记录人类审查状态');
  const reviews = new Map();
  for (const r of list(reviewFile?.episodes)) {
    if (!object(r)) { fail('REVIEW', '复核记录必须是对象'); continue; }
    if (reviews.has(r.episode_id)) fail(r.episode_id, '复核记录重复');
    reviews.set(r.episode_id, r);
  }
  const ids = new Map(), choiceCounts = {};
  const themeCounts = Object.fromEntries(THEMES.map(x => [x, 0]));
  const negativeCounts = Object.fromEntries(NEGATIVES.map(x => [x, 0]));
  for (const ep of episodes) {
    if (!object(ep)) { fail('EPISODE', '事件必须是对象'); continue; }
    const id = ep.episode_id;
    nonempty('EPISODE', 'episode_id', id);
    if (ids.has(id)) fail(id, 'episode_id 重复');
    ids.set(id, ep);
    for (const field of ['person', 'time', 'decision_state', 'choice', 'outcomes', 'reflection']) if (!object(ep[field])) fail(id, `${field} 必须是对象`);
    nonempty(id, 'person.name', ep.person?.name);
    strings(id, 'person.tags', ep.person?.tags, 1, 12);
    const year = ep.time?.year;
    if (!Number.isInteger(year) || year < 1 || year > new Date().getUTCFullYear()) fail(id, 'time.year 必须是有效历史年份');
    if (ep.person?.birth_year !== undefined && (!Number.isInteger(ep.person.birth_year) || ep.person.birth_year < 1 || ep.person.birth_year > year)) fail(id, 'birth_year 与事件年份不一致');
    if (ep.time?.age !== undefined && (!Number.isInteger(ep.time.age) || ep.time.age < 0 || ep.time.age > 125 ||
      (Number.isInteger(ep.person?.birth_year) && ![year - ep.person.birth_year, year - ep.person.birth_year - 1].includes(ep.time.age)))) fail(id, 'age 与出生/事件年份不一致');
    nonempty(id, 'time.stage', ep.time?.stage);
    strings(id, 'prior_path', ep.prior_path, 1, 10);
    const ds = ep.decision_state;
    nonempty(id, 'decision_state.dilemma', ds?.dilemma);
    if (string(ds?.dilemma) && !ds.dilemma.includes(' vs ')) fail(id, 'dilemma 须包含 A vs B');
    strings(id, 'decision_state.options', ds?.options, 2, 5);
    strings(id, 'decision_state.constraints', ds?.constraints, 2, 6);
    strings(id, 'decision_state.goals', ds?.goals, 2, 5);
    for (const key of ['risk', 'reversibility']) if (!['low', 'medium', 'high'].includes(ds?.[key])) fail(id, `${key} 枚举不合法`);
    if (!CHOICES.includes(ep.choice?.type)) fail(id, 'choice.type 枚举不合法');
    else choiceCounts[ep.choice.type] = (choiceCounts[ep.choice.type] || 0) + 1;
    strings(id, 'choice.actions', ep.choice?.actions, 1, 10);
    for (const key of ['short_term', 'mid_term', 'long_term']) nonempty(id, `outcomes.${key}`, ep.outcomes?.[key]);
    strings(id, 'reflection.unknowns', ep.reflection?.unknowns, 1, 10);
    if (ep.reflection?.self_comment !== undefined) nonempty(id, 'reflection.self_comment', ep.reflection.self_comment);
    strings(id, 'retrieval_tags', ep.retrieval_tags, 1, 12);
    if (ep.next_episode_ids !== undefined) strings(id, 'next_episode_ids', ep.next_episode_ids, 0, 10);
    if (!Array.isArray(ep.evidence) || !ep.evidence.length) fail(id, 'evidence 不能为空');
    const realIds = new Set();
    let hasInference = false;
    for (const ev of list(ep.evidence)) {
      if (!object(ev)) { fail(id, 'evidence 条目必须是对象'); continue; }
      nonempty(id, 'evidence.source_id', ev.source_id);
      nonempty(id, 'evidence.claim', ev.claim);
      if (ev.quote !== undefined) nonempty(id, 'evidence.quote', ev.quote);
      if (!EVIDENCE.includes(ev.type)) fail(id, 'evidence.type 枚举不合法');
      const source = registry.get(ev.source_id);
      if (!source) fail(id, `source_id ${ev.source_id} 不可追溯`);
      else if (source.type !== ev.type) fail(id, `${ev.source_id} 证据类型与来源索引冲突`);
      if (ev.type !== 'ai_inference') {
        if (!url(ev.url) || ev.url !== source?.url) fail(id, `${ev.source_id} URL 缺失或与来源索引不一致`);
        if (source && source.type !== 'ai_inference' && EVIDENCE.includes(source.type)) realIds.add(ev.source_id);
      } else hasInference = true;
    }
    if (!realIds.size) fail(id, '至少需要一条真实来源');
    if (!hasInference) fail(id, '处境建模必须有 ai_inference 证据标识');
    const r = reviews.get(id);
    if (!r) { fail(id, '缺少复核记录'); continue; }
    if (r.source_review !== 'ai_source_checked') fail(id, '缺少来源核对状态');
    if (!['pending', 'approved'].includes(r.human_review)) fail(id, '人类审查状态不合法');
    if (r.human_review === 'approved' && (!string(r.reviewed_by) || !date(r.reviewed_on))) fail(id, '人类审查通过须记录审查者与日期');
    nonempty(id, 'analogy_boundary', r.analogy_boundary);
    strings(id, 'demo_questions', r.demo_questions, 1, 3);
    for (const theme of new Set(list(r.demo_questions))) {
      if (!THEMES.includes(theme)) fail(id, '未知 Demo 方向');
      else { themeCounts[theme]++; if (!list(ep.retrieval_tags).includes(theme)) fail(id, 'Demo 方向须写入检索标签'); }
    }
    if (!['none', ...NEGATIVES].includes(r.negative_case)) fail(id, '负面案例分类不合法');
    if (NEGATIVES.includes(r.negative_case)) {
      negativeCounts[r.negative_case]++;
      nonempty(id, 'negative_basis', r.negative_basis);
      if (!list(ep.retrieval_tags).includes(r.negative_case)) fail(id, '负面类型须显式标记');
      if (r.negative_case === '坚持但长期受损' && ep.choice?.type !== 'persist') fail(id, '长期坚持受损须对应 persist');
      if (r.negative_case === '转向后不适合' && !['direct_switch', 'explore_then_switch'].includes(ep.choice?.type)) fail(id, '转向不适合须对应转向选择');
      if (r.negative_case === '坚持但长期受损' && string(ep.outcomes?.long_term) && ep.outcomes.long_term.startsWith('未知')) fail(id, '长期受损须有可追溯的长期结果');
    }
    const bindings = object(r.field_sources) ? r.field_sources : {};
    if (!object(r.field_sources)) fail(id, 'field_sources 必须是对象');
    strings(id, 'unknown_fields', r.unknown_fields, 0);
    strings(id, 'inference_fields', r.inference_fields, 1);
    for (const field of INFERRED) if (!list(r.inference_fields).includes(field)) fail(id, `${field} 必须标记为推断`);
    for (const field of list(r.inference_fields)) if (typeof field === 'string' && at(ep, field) === undefined) fail(id, `推断路径 ${field} 不存在`);
    const required = ['person.name', 'time.year', ...list(ep.prior_path).map((_, i) => `prior_path.${i}`), ...list(ep.choice?.actions).map((_, i) => `choice.actions.${i}`)];
    for (const field of ['person.birth_year', 'time.age', 'reflection.self_comment']) if (at(ep, field) !== undefined) required.push(field);
    for (const key of ['short_term', 'mid_term', 'long_term']) {
      const field = `outcomes.${key}`, value = ep.outcomes?.[key];
      if (string(value) && value.startsWith('未知')) {
        if (!list(r.unknown_fields).includes(field) || !list(ep.reflection?.unknowns).includes(value)) fail(id, `${field} 的未知说明须同步记录`);
      } else required.push(field);
    }
    for (const field of required) if (!Array.isArray(bindings[field]) || !bindings[field].length) fail(id, `关键事实 ${field} 未绑定来源`);
    for (const [field, sourceIds] of Object.entries(bindings)) {
      if (at(ep, field) === undefined) fail(id, `事实路径 ${field} 不存在`);
      if (INFERRED.some(x => field === x || field.startsWith(x + '.'))) fail(id, `建模字段 ${field} 不能标为史实`);
      strings(id, `${field} 的来源`, sourceIds);
      for (const sid of list(sourceIds)) if (!realIds.has(sid)) fail(id, `${field} 来源须是本条 evidence 中的非 AI 来源`);
    }
    for (const field of list(r.unknown_fields)) {
      const value = typeof field === 'string' ? at(ep, field) : undefined;
      if (!string(value) || !value.startsWith('未知') || bindings[field]) fail(id, `未知字段 ${field} 不得冒充已证实事实`);
    }
    if (ep.reflection?.self_comment !== undefined && !list(bindings['reflection.self_comment']).some(sid => ['self_writing', 'interview'].includes(registry.get(sid)?.type))) fail(id, '本人评价须有自述或访谈支持');
  }
  for (const [id, ep] of ids) for (const next of list(ep.next_episode_ids)) {
    const target = ids.get(next);
    if (!target) fail(id, `next_episode_ids 悬空引用 ${next}`);
    else if (target.person?.name !== ep.person?.name || target.time?.year <= ep.time?.year) fail(id, '后续事件须属于同一人且年份更晚');
  }
  for (const id of reviews.keys()) if (!ids.has(id)) fail(id, '复核记录没有对应事件');
  if (Object.keys(choiceCounts).length < 4) fail('GLOBAL', '选择类型至少覆盖四种');
  for (const [theme, count] of Object.entries(themeCounts)) if (!count) fail('GLOBAL', `缺少 Demo 方向：${theme}`);
  for (const [negative, count] of Object.entries(negativeCounts)) if (!count) fail('GLOBAL', `缺少负面案例：${negative}`);
  if (reviewFile?.human_review === 'approved' && [...reviews.values()].some(r => r.human_review !== 'approved')) fail('REVIEW', '汇总审查状态不能提前标为通过');
  if (reviewFile?.human_review === 'pending') warnings.push('人类来源审查尚未完成；结构校验通过不等于史实获人类确认。');
  return { errors, warnings, counts: { episodes: episodes.length, people: new Set(episodes.filter(object).map(ep => ep.person?.name)).size, choices: choiceCounts, themes: themeCounts, negatives: negativeCounts } };
}

export function readDataset(file) {
  const read = name => JSON.parse(readFileSync(name, 'utf8').replace(/^\uFEFF/, ''));
  return [read(file), read(join(dirname(file), 'sources.json')), read(join(dirname(file), 'review.json'))];
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    let milestone = 'final', file;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--milestone') milestone = args[++i];
      else if (!args[i].startsWith('-') && !file) file = resolve(args[i]);
      else throw new Error(`未知参数：${args[i]}`);
    }
    if (!['initial', 'final'].includes(milestone)) throw new Error('--milestone 必须为 initial/final');
    file ??= join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'episodes.json');
    const result = validateDataset(...readDataset(file), { milestone });
    console.log(JSON.stringify(result.counts, null, 2));
    result.warnings.forEach(w => console.warn(`WARNING: ${w}`));
    result.errors.forEach(e => console.error(`ERROR: ${e}`));
    if (result.errors.length) process.exitCode = 1;
    else console.log(`PASS: ${result.counts.episodes} 条；来源与结构校验通过。`);
  } catch (error) { console.error(`ERROR: ${error.message}`); process.exitCode = 1; }
}

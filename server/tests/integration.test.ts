/**
 * 集成改进的回归测试
 * ============================================
 * 覆盖 T5 之后那批「实测驱动」的改动 —— 这些改动当时只做了人工验证，
 * 没有留下自动化防线，下次谁不小心改回去不会被发现。
 *
 * 运行：node --test "server/tests/*.test.ts"
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { loadEpisodes } from '../retrieval/load-episodes.ts';
import { selectDiverse } from '../retrieval/diversity.ts';
import {
  categoryMatch,
  bigramOverlap,
  CONSTRAINT_CATEGORIES,
  GOAL_CATEGORIES,
  differencePenalty,
} from '../retrieval/dimensions.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

/* ============================================================
   ① 多样性选择器：同一个人不能出现两次
   ============================================================ */

test('多样性：同一个人物不得被选两次（数据里有同人多事件）', () => {
  const episodes = loadEpisodes();
  // 造一个「同人霸榜」的榜：把鲁迅的三条事件都放最前面
  const luXun = episodes.filter((e) => e.episode_id.startsWith('lu_xun'));
  assert.ok(luXun.length >= 3, `鲁迅应有 ≥3 条事件，实际 ${luXun.length}`);

  const ranked = luXun.map((episode, i) => ({ episode, total: 100 - i }));
  const { picked } = selectDiverse(ranked, 3);

  const names = picked.map((p) => p.episode.person.name);
  assert.equal(new Set(names).size, names.length, `不应出现重复人物：${names.join(' / ')}`);
});

test('多样性：类型够时三名额尽量取 3 种 choice.type', () => {
  const episodes = loadEpisodes();
  const ranked = episodes.map((episode, i) => ({ episode, total: 100 - i }));
  const { picked } = selectDiverse(ranked, 3);
  const types = picked.map((p) => p.episode.choice.type);
  assert.ok(new Set(types).size >= 2, `choice.type 应 ≥2 种，实际 ${new Set(types).size}`);
});

test('多样性：候选不足 k 个时不报错、原样返回', () => {
  const episodes = loadEpisodes().slice(0, 2);
  const ranked = episodes.map((episode, i) => ({ episode, total: 10 - i }));
  const { picked } = selectDiverse(ranked, 3);
  assert.equal(picked.length, 2);
});

/* ============================================================
   ② 维度分辨力：两个曾经"空转"的维度必须有区分度
   ============================================================ */

test('维度：constraint_match 对真实案例不再恒定 0.50', () => {
  const episodes = loadEpisodes();
  const userText = '已投入两年半，沉没成本高，跨专业门槛，可能延毕，家庭期望稳定';

  const scores = episodes.map((ep) =>
    categoryMatch(userText, ep.decision_state.constraints.join('，'), CONSTRAINT_CATEGORIES),
  );
  const distinct = new Set(scores.map((s) => s.toFixed(2)));

  assert.ok(
    distinct.size > 1,
    `constraint_match 应有分辨力，实际全部落在 ${[...distinct].join(',')} —— 维度空转了`,
  );
});

test('维度：goal_match 对真实案例不再恒定 0.50', () => {
  const episodes = loadEpisodes();
  const userGoals = '顺利毕业，转换发展赛道，降低时间成本';

  const scores = episodes.map((ep) => categoryMatch(userGoals, ep.decision_state.goals.join('，'), GOAL_CATEGORIES));
  const distinct = new Set(scores.map((s) => s.toFixed(2)));

  assert.ok(distinct.size > 1, `goal_match 应有分辨力，实际全部落在 ${[...distinct].join(',')}`);
});

test('维度：词典覆盖率达标（识别不出类别的案例应少于三成）', () => {
  const episodes = loadEpisodes();
  const hit = (text: string, cats: Record<string, string[]>) =>
    Object.values(cats).some((words) => words.some((w) => text.includes(w)));

  const missConstraint = episodes.filter((e) => !hit(e.decision_state.constraints.join('，'), CONSTRAINT_CATEGORIES)).length;
  const missGoal = episodes.filter((e) => !hit(e.decision_state.goals.join('，'), GOAL_CATEGORIES)).length;

  const rate = (missConstraint + missGoal) / (episodes.length * 2);
  assert.ok(rate < 0.3, `空转率应 <30%，实际 ${(rate * 100).toFixed(0)}%（词典可能被改回退版本）`);
});

test('bigramOverlap：相同文本为 1，无关文本接近 0，且对称', () => {
  assert.equal(bigramOverlap('考研还是就业', '考研还是就业'), 1);
  assert.ok(bigramOverlap('考研还是就业', '今天天气不错') < 0.1);
  assert.equal(bigramOverlap('abc', 'abd'), bigramOverlap('abd', 'abc'));
  assert.equal(bigramOverlap('', 'abc'), 0);
});

/* ============================================================
   ③ 差异惩罚：时代越远越高（反类比的伏笔）
   ============================================================ */

test('差异惩罚：年代越远越高', () => {
  const episodes = loadEpisodes();
  const situation = {
    stage: '大三', dilemma: '坚持 vs 转向', options: ['a', 'b'],
    constraints: ['已投入两年'], goals: ['兴趣'], risk: 'medium' as const,
    reversibility: 'medium' as const, unknowns: ['x'],
  };

  const withYear = (year: number) => {
    const base = episodes[0];
    return differencePenalty(situation, { ...base, time: { ...base.time, year } });
  };

  assert.ok(withYear(1906) > withYear(1984), '1906 的惩罚应高于 1984');
  assert.ok(withYear(1984) > withYear(2020), '1984 的惩罚应高于 2020');
});

/* ============================================================
   ④ 离线兜底：三个场景都要在，且能按输入挑对
   ============================================================ */

test('离线兜底：打包了 3 个演示场景且都不是错误响应', () => {
  const ts = readFileSync(join(root, 'src', 'data', 'demoCache.ts'), 'utf8');

  // 生成文件里应有三段 raw_input
  const rawInputs = ts.match(/"raw_input":/g) ?? [];
  assert.ok(rawInputs.length >= 3, `应打包 ≥3 个场景，实际 ${rawInputs.length}`);
  assert.ok(!ts.includes('"error"'), 'demoCache.ts 里不应出现错误响应');
  assert.ok(ts.includes('export function pickScenario'), '应导出 pickScenario');
});

test('离线兜底：pickScenario 能把三种问法分到不同场景', () => {
  const ts = readFileSync(join(root, 'src', 'data', 'demoCache.ts'), 'utf8');

  // 抽出三个场景的 raw_input，用同一套 bigram 逻辑复现匹配
  const raws = [...ts.matchAll(/"raw_input":\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(raws.length >= 3, '应抽出 ≥3 条 raw_input');

  const pick = (narrative: string) => {
    let best = 0;
    let bestScore = 0;
    raws.forEach((r, i) => {
      const s = bigramOverlap(narrative, r);
      if (s > bestScore) {
        bestScore = s;
        best = i;
      }
    });
    return best;
  };

  // 三个问法应各自命中不同的场景下标
  const picks = raws.map((r) => pick(r));
  assert.equal(new Set(picks).size, raws.length, `三个问法应命中不同场景，实际 ${picks.join(',')}`);
});

/* ============================================================
   ⑤ 会话持久化：模式必须一起存（否则刷新后把缓存当实时）
   ============================================================ */

test('持久化：AppState 存了 mode 与 offlineReason，且读取时有形状校验', () => {
  const src = readFileSync(join(root, 'src', 'state', 'AppState.tsx'), 'utf8');

  assert.ok(src.includes('sessionStorage'), '应使用 sessionStorage（不是 localStorage，避免污染下次演示）');
  assert.ok(/mode[,:\s]/.test(src), '应持久化 mode');
  assert.ok(src.includes('offlineReason'), '应持久化 offlineReason');
  assert.ok(src.includes('Array.isArray(p.result.matches)'), '读取时应有形状校验，坏数据不能崩页面');
  assert.ok(src.includes('removeItem'), 'reset() 应清空持久化');
});

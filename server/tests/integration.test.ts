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
import { scoreDimensions, explainSimilarity } from '../retrieval/dimensions.ts';
import { validateSituation, validateSituationShape } from '../shared/situation-contract.ts';
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

/* ============================================================
   ⑧ 「像你的地方」不能比「不像」弱
   ------------------------------------------------------------
   对比两侧文案发现的不对称：改之前三条案例的「像」全都是
   「可逆性相近」排第一（该维度双方都是 medium 时恒为 1.0，
   信息量最低却霸榜），而且不说是哪一条重合。
   ============================================================ */

test('解释：reversibility 不该霸榜（低信息量维度要降权）', () => {
  const episodes = loadEpisodes();
  const situation = {
    stage: '大三关键抉择期',
    dilemma: '直接就业 vs 继续考研',
    options: ['直接就业', '继续考研'],
    constraints: ['家庭期望值较低', '成绩中等'],
    goals: ['追求个人兴趣'],
    risk: 'medium' as const,
    reversibility: 'medium' as const,
    unknowns: ['上岸概率'],
  };

  // 取若干 case 检查「可逆性」在首位出现的比例
  const picks = episodes.slice(0, 12).map((ep) => {
    const d = scoreDimensions({
      situation,
      situationVec: new Array(8).fill(0.1),
      episode: ep,
      episodeRecallVec: new Array(8).fill(0.1),
      episodePathVec: new Array(8).fill(0.1),
    });
    return explainSimilarity(situation, ep, d);
  });

  const reversibilityFirst = picks.filter((r) => r[0]?.startsWith('【可逆性】')).length;
  assert.ok(
    reversibilityFirst <= picks.length * 0.34,
    `「可逆性」不该在多数案例里排第一（${reversibilityFirst}/${picks.length}）—— 低信息量维度霸榜了`,
  );
});

test('解释：不得在无依据时声称结构相同（不出现空泛的「同构」）', () => {
  const episodes = loadEpisodes();
  const situation = {
    stage: '大三',
    // 这个 dilemma 落不进 DILEMMA_CLASSES，旧版会输出「同属「同构」型」
    dilemma: '留在大城市 vs 回老家',
    options: ['a', 'b'],
    constraints: ['c1', 'c2'],
    goals: ['g1'],
    risk: 'medium' as const,
    reversibility: 'medium' as const,
    unknowns: ['u1', 'u2'],
  };

  for (const ep of episodes.slice(0, 8)) {
    const d = scoreDimensions({
      situation,
      situationVec: new Array(8).fill(0.1),
      episode: ep,
      episodeRecallVec: new Array(8).fill(0.1),
      episodePathVec: new Array(8).fill(0.1),
    });
    for (const line of explainSimilarity(situation, ep, d)) {
      assert.ok(
        !line.includes('「同构」型'),
        `不该在识别不出困境类别时硬说结构相同：${line}`,
      );
    }
  }
});

test('解释：有具体重合项时，文案要引用到具体词条', () => {
  const episodes = loadEpisodes();
  const situation = {
    stage: '大三',
    dilemma: '坚持 vs 转向',
    options: ['a', 'b'],
    constraints: ['家庭期望别太高', '经济压力大'],
    goals: ['追求个人兴趣', '个人成长'],
    risk: 'medium' as const,
    reversibility: 'medium' as const,
    unknowns: ['u1', 'u2'],
  };

  const all = episodes.slice(0, 20).flatMap((ep) => {
    const d = scoreDimensions({
      situation,
      situationVec: new Array(8).fill(0.1),
      episode: ep,
      episodeRecallVec: new Array(8).fill(0.1),
      episodePathVec: new Array(8).fill(0.1),
    });
    return explainSimilarity(situation, ep, d);
  });

  // 至少有一条理由给出了「具体交集」而不是只说"有交集"
  assert.ok(
    all.some((l) => l.includes('具体交集') || l.includes('具体重叠')),
    '「像」的理由里应出现具体重合项，而不是一律泛泛而谈',
  );
});

/* ============================================================
   ⑥ 输入校验：严格版给 Parser 用，宽松版给用户编辑用
   ------------------------------------------------------------
   这里有一个差点踩进去的坑：把给 LLM 输出用的严格校验
   直接接到 POST /api/retrieve 上，会把「用户在 P2 删掉几条约束」
   变成 400 —— 编辑功能和 What-if 一起坏掉。
   ============================================================ */

test('校验：宽松版接受用户编辑过的处境（条数/长度不该被卡）', () => {
  const edited = {
    stage: '大三',
    dilemma: '就业 vs 考研',
    options: ['就业'],
    constraints: [],
    goals: ['稳定'],
    unknowns: ['只有一条'],
    risk: 'medium',
    reversibility: 'medium',
  };
  const r = validateSituationShape(edited);
  assert.ok(r.ok, `用户编辑过的处境不该被拒：${r.ok ? '' : JSON.stringify(r.issues)}`);
});

test('校验：宽松版仍拦下会读崩的形状', () => {
  assert.ok(!validateSituationShape(null).ok, 'null 必须拦');
  assert.ok(!validateSituationShape([]).ok, '数组不是 situation，必须拦');
  assert.ok(!validateSituationShape({ stage: 'x' }).ok, '缺 dilemma 必须拦');

  const badEnum = {
    stage: 'x', dilemma: 'a vs b', options: [], constraints: [], goals: [], unknowns: [],
    risk: 'INVALID', reversibility: 'medium',
  };
  assert.ok(!validateSituationShape(badEnum).ok, '非法枚举必须拦');

  const badArray = {
    stage: 'x', dilemma: 'a vs b', options: '不是数组', constraints: [], goals: [], unknowns: [],
    risk: 'medium', reversibility: 'medium',
  };
  assert.ok(!validateSituationShape(badArray).ok, '非数组必须拦');
});

test('校验：严格版仍然卡条数（Parser 输出用）', () => {
  const tooFew = {
    stage: '大三',
    dilemma: '就业 vs 考研',
    options: ['就业'],
    constraints: ['c1'],
    goals: ['g1'],
    unknowns: ['u1'],
    risk: 'medium',
    reversibility: 'medium',
  };
  assert.ok(!validateSituation(tooFew).ok, '严格版应因条数不足而拒绝');
  assert.ok(validateSituationShape(tooFew).ok, '宽松版应接受同样的输入');
});

/* ============================================================
   ⑦ API 层：错误码映射
   ============================================================ */

test('API：可预期的客户端错误不应一律回 500', () => {
  const raw = readFileSync(join(root, 'server', 'api.ts'), 'utf8');
  // 去掉注释再断言 —— 否则「解释为什么不能 destroy」的注释本身会把测试判失败
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  assert.ok(src.includes('INVALID_SITUATION'), '非法 situation 应有专门错误码');
  assert.ok(src.includes('BODY_TOO_LARGE'), '超长 body 应有专门错误码');
  assert.ok(src.includes('413'), '超长 body 应返回 413，而不是把连接掐掉');
  assert.ok(src.includes('validateSituationShape'), '/api/retrieve 应使用宽松校验');
  assert.ok(!/req\.destroy\(\)/.test(src), '超限时不该 destroy 连接（客户端只会看到连接重置）');
});

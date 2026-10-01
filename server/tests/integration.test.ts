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

import { loadEpisodes, loadSourceMeta } from '../retrieval/load-episodes.ts';
import { selectDiverse } from '../retrieval/diversity.ts';
import { scoreDimensions, explainSimilarity } from '../retrieval/dimensions.ts';
import { validateSituation, validateSituationShape } from '../shared/situation-contract.ts';
import { normalizeSituationFields, detectOutOfScope } from '../parser/situation-parser.ts';
import { getJourneyQuestions, detectJourneyStage } from '../../src/data/mock.ts';
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

test('多样性：形状不全的条目不得抛错（实测 acceptance.ts 会传这种）', () => {
  // 我加的去重读了 person.name，而旧实现只读 choice.type ——
  // 于是 acceptance.ts 里 episode 为 undefined 的条目一跑就崩。
  // 这是自己引入的回归，用测试钉住。
  const shapeVariants = [
    [{ episode: undefined, total: 5 }],
    [{ episode: { person: undefined }, total: 4 }],
    [{ episode: { person: { name: '' } }, total: 3 }],
    [{ episode: { person: { name: 'A' } }, total: 2 }],
    [],
  ] as unknown as { episode: never; total: number }[][];

  for (const ranked of shapeVariants) {
    assert.doesNotThrow(
      () => selectDiverse(ranked as never, 3),
      `形状不全的候选不该抛错：${JSON.stringify(ranked)}`,
    );
  }

  // 空数组要返回空，不能崩
  const empty = selectDiverse([], 3);
  assert.deepEqual(empty.picked, []);
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
   ㉑ 解析模型选择：它占了整条链路 87% 的等待
   ------------------------------------------------------------
   实测（同提示词 + json_schema，三个场景各 3 轮共 9 次）：
     glm-5                9/9  平均 4.1s  中位 4.0s  最慢 5.4s
     deepseek-v4.1-flash  9/9  平均 2.3s  中位 2.2s  最慢 2.8s
   所以默认用后者，但**必须能被环境变量覆盖**（现场出问题要能一键回退）。
   ============================================================ */

test('解析模型：必须是可配置的常量，不能写死在调用处', () => {
  const src = readFileSync(join(root, 'server', 'parser', 'situation-parser.ts'), 'utf8');

  assert.ok(/export const SITUATION_MODEL/.test(src), '应导出 SITUATION_MODEL 常量');
  assert.ok(
    /process\.env\.SITUATION_MODEL/.test(src),
    '必须支持环境变量覆盖 —— 现场模型出问题时要能一键回退',
  );
  assert.ok(
    /model:\s*SITUATION_MODEL/.test(src),
    'chatCompletions 调用处应使用该常量，而不是写死模型名',
  );
  assert.ok(
    !/model:\s*'glm-5'/.test(src),
    '不应再写死 glm-5（实测比 deepseek-v4.1-flash 慢 44%）',
  );
});

test('解析模型：应记录踩过的坑，免得后人重复试', () => {
  const src = readFileSync(join(root, 'server', 'parser', 'situation-parser.ts'), 'utf8');
  // 这些是实测不可用的模型，注释里应写明原因
  for (const m of ['glm-5.3-flashx', 'glm-4.5-air', 'step-3.7-flash']) {
    assert.ok(src.includes(m), `应记录 ${m} 不可用的原因，避免后人重复踩`);
  }
});

/* ============================================================
   ⑳ 证据抽屉要能显示「谁出的、哪一段、什么局限」
   ------------------------------------------------------------
   实测发现 sources.json 里有 publisher / locator / accessed_on / limitations ——
   这些**正是让证据可核查的东西**，但 episode.evidence 只带 source_id + url，
   前端根本拿不到。于是抽屉里只能显示「LX-SENDAI + 一个链接」。
   改后能显示「澎湃转载楚尘文化《李安访谈录》· 定位到格伦·肯尼访谈」。
   ============================================================ */

test('来源元信息：sources.json 能加载成 source_id → 出版信息 的映射', () => {
  const meta = loadSourceMeta();
  const ids = Object.keys(meta);
  assert.ok(ids.length >= 30, `应加载到 ≥30 条来源，实际 ${ids.length}`);

  // 抽查字段完整性 —— 缺了这些就没法核查
  const sample = meta[ids[0]];
  assert.ok(sample.publisher, '应有 publisher（谁出的）');
  assert.ok(sample.title !== undefined, '应有 title');
  assert.ok(sample.locator, '应有 locator（定位到哪一段）');
  assert.ok(sample.limitations, '应有 limitations（已知局限）');
});

test('来源元信息：每条 evidence 都能在 sources.json 里找到对应元信息', () => {
  const episodes = loadEpisodes();
  const meta = loadSourceMeta();
  let missing = 0;
  for (const e of episodes) {
    for (const ev of e.evidence ?? []) {
      if (!meta[ev.source_id]) missing++;
    }
  }
  assert.equal(missing, 0, `有 ${missing} 条 evidence 的 source_id 在 sources.json 里找不到`);
});

test('来源元信息：检索响应必须带上 source_meta（否则前端无从显示）', async () => {
  const src = readFileSync(join(root, 'server', 'retrieval', 'retrieve.ts'), 'utf8');
  assert.ok(/source_meta/.test(src), 'retrieve 的返回值里应有 source_meta');

  const types = readFileSync(join(root, 'src', 'types', 'episode.ts'), 'utf8');
  assert.ok(/source_meta\??:/.test(types), '契约里应有 source_meta 字段');
  assert.ok(/interface SourceMeta/.test(types), '应有 SourceMeta 类型');
});

test('来源元信息：抽屉要渲染出版信息与局限，而不只是编号', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceDrawer.tsx'), 'utf8');
  assert.ok(/sourceMeta/.test(src), '抽屉应接收 sourceMeta');
  assert.ok(/publisher/.test(src) && /locator/.test(src), '应渲染 publisher 与 locator');
  assert.ok(/limitations/.test(src), '应渲染已知局限 —— 这是诚实性的关键一块');
});

/* ============================================================
   ⑲ 用户什么都没写时，不能把系统编的内容说成"你的回答"
   ------------------------------------------------------------
   实测：全跳过 6 问时，后端仍会从一句兜底文案
   （「我想换个方向，但不确定该不该换。」）编出完整处境卡：
     阶段=方向抉择期 / 冲突=维持现状 vs 更换方向 / 约束=已有沉没成本…
   而 P2 写着「我们从你的回答里抽出了这些结构」——
   把系统编的内容算在用户头上。
   ============================================================ */

test('诚实性：全跳过时必须说明那是通用起点，不是"从你的回答里抽的"', () => {
  const p2 = readFileSync(join(root, 'src', 'pages', 'P2Crossroads.tsx'), 'utf8');
  const state = readFileSync(join(root, 'src', 'state', 'AppState.tsx'), 'utf8');

  assert.ok(
    /situationFromUserInput/.test(state),
    'AppState 必须记录"用户到底写没写过内容"',
  );
  assert.ok(
    /hasUserInput\s*=\s*narrative\.trim\(\)\.length\s*>\s*0/.test(state),
    '应从 narrative 是否为空推出 hasUserInput',
  );
  assert.ok(
    /raw_input:\s*hasUserInput\s*\?\s*narrative/.test(state),
    '没有用户输入时不应把兜底文案当作"他的回答"直接发出去',
  );
  assert.ok(
    /situationFromUserInput\s*\?/.test(p2),
    'P2 必须按"有没有用户输入"分两种措辞',
  );
  assert.ok(
    /通用起点|不是从你的话里读出来的/.test(p2),
    '全跳过时要明说是通用起点，不能说成从用户回答里抽的',
  );
});

test('诚实性：有用户输入时仍保留原来的措辞（不要因噎废食）', () => {
  const p2 = readFileSync(join(root, 'src', 'pages', 'P2Crossroads.tsx'), 'utf8');
  assert.ok(
    /我们从你的回答里抽出了这些结构/.test(p2),
    '有输入时这句话是对的，应保留',
  );
});

/* ============================================================
   ⑱ 「看证据来源（N）」的 N 不能把 AI 推断算进去
   ------------------------------------------------------------
   原来按钮写的是 ep.evidence.length，但每条案例的 evidence 里
   都有 1 条 ai_inference —— 于是按钮显示「看证据来源（3）」，
   点进去只有 2 条能点开。
   点开发现少一条，比一开始就写对更伤可信度。
   ============================================================ */

test('证据计数：AI 推断不能算作「来源」', () => {
  const src = readFileSync(join(root, 'src', 'pages', 'P4Episode.tsx'), 'utf8');

  assert.ok(
    /sourceCount/.test(src),
    '应单独算外部来源数，而不是直接用 evidence.length',
  );
  assert.ok(
    /type\s*!==\s*'ai_inference'/.test(src),
    'sourceCount 必须排除 ai_inference',
  );
  assert.ok(
    !/看证据来源（\{ep\.evidence\.length\}\)/.test(src),
    '不应再用 evidence.length 当来源数（会把 AI 推断算进去）',
  );
});

test('证据计数：抽屉要单独说明 AI 推断有几条', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceDrawer.tsx'), 'utf8');

  assert.ok(/aiCount/.test(src), '抽屉应接收 AI 推断条数并单独说明');
  assert.ok(
    /不是来源|只是说明哪些字段是建模/.test(src),
    '要讲清 AI 推断不是来源，而是"哪些字段是建模的"',
  );
});

test('证据数据：每条案例确实都有 AI 推断条目（这正是不该混入计数的原因）', () => {
  const episodes = loadEpisodes();
  for (const e of episodes) {
    const ai = e.evidence.filter((x) => x.type === 'ai_inference').length;
    assert.ok(ai >= 1, `${e.episode_id} 应有 AI 推断条目（说明字段是建模的）`);
    const real = e.evidence.filter((x) => x.type !== 'ai_inference').length;
    assert.ok(real >= 1, `${e.episode_id} 应至少有一条真实外部来源`);
  }
});

/* ============================================================
   ⑰ 三条路的展示顺序不能是排名
   ------------------------------------------------------------
   前端把三条标成 路径 A / B / C，A 在最上面、配色最靠前。
   而 picked 是按分数降序的 —— 实测三个场景里 A **永远是**最高分那条。
   页面嘴上说「不是排名，也不是推荐」，版式却在排。
   ============================================================ */

test('展示顺序：路径 A 不该永远是最高分（版式在暗示排名）', async () => {
  const episodes = loadEpisodes();
  const { retrieve, buildEpisodeIndex } = await import('../retrieval/retrieve.ts');
  const { mockEmbedder } = await import('../embedding/embed.ts');

  const deps = { embedder: mockEmbedder(), episodes };
  await buildEpisodeIndex(deps);

  const situations = [
    { stage: '大三', dilemma: '坚持 vs 转向', options: ['a', 'b'], constraints: ['已投入两年', '门槛高'], goals: ['兴趣', '成长'], risk: 'medium' as const, reversibility: 'medium' as const, unknowns: ['x', 'y'] },
    { stage: '工作五年', dilemma: '稳定 vs 冒险', options: ['留下', '跳槽'], constraints: ['存款不多', '无家庭负担'], goals: ['成长', '收入'], risk: 'high' as const, reversibility: 'low' as const, unknowns: ['适配度', '前景'] },
    { stage: '中年', dilemma: '探索 vs 专注', options: ['继续', '转向'], constraints: ['要顾家', '机会成本'], goals: ['意义', '稳定'], risk: 'medium' as const, reversibility: 'medium' as const, unknowns: ['方向', '可行性'] },
  ];

  const topPositions: number[] = [];
  for (const s of situations) {
    const r = await retrieve(s, {}, deps as never);
    // 复算总分，找出最高分在第几位
    const w: Record<string, number> = {
      stage_match: 0.15, path_match: 0.2, dilemma_match: 0.25,
      constraint_match: 0.2, goal_match: 0.15, reversibility_match: 0.05,
    };
    const totals = r.matches.map((m) => {
      const d = m.dimensions as unknown as Record<string, number>;
      return Object.entries(w).reduce((acc, [k, ww]) => acc + ww * d[k], 0) - 0.3 * d.difference_penalty;
    });
    topPositions.push(totals.indexOf(Math.max(...totals)));
  }

  // 三种处境里，最高分不该永远落在同一个位置
  assert.ok(
    new Set(topPositions).size > 1,
    `最高分在所有处境里都落在第 ${topPositions[0] + 1} 位 —— 展示顺序其实是个排名，`
      + `而页面声称「不是排名」。打散逻辑可能失效了。`,
  );
});

test('展示顺序：打散必须确定性（同一输入每次顺序一致）', async () => {
  const episodes = loadEpisodes();
  const { retrieve, buildEpisodeIndex } = await import('../retrieval/retrieve.ts');
  const { mockEmbedder } = await import('../embedding/embed.ts');

  const deps = { embedder: mockEmbedder(), episodes };
  await buildEpisodeIndex(deps);

  const s = {
    stage: '大三', dilemma: '坚持 vs 转向', options: ['a', 'b'],
    constraints: ['已投入两年', '门槛高'], goals: ['兴趣', '成长'],
    risk: 'medium' as const, reversibility: 'medium' as const, unknowns: ['x', 'y'],
  };

  const a = await retrieve(s, {}, deps as never);
  const b = await retrieve(s, {}, deps as never);
  assert.deepEqual(
    a.matches.map((m) => m.episode.episode_id),
    b.matches.map((m) => m.episode.episode_id),
    '同一处境两次检索的顺序必须一致 —— 否则演示无法复现',
  );
});

/* ============================================================
   ⑯ 维度卡的「差异惩罚」方向必须和其他六维一致
   ------------------------------------------------------------
   前六维：分数越高越像 → 条越长 = 越好
   差异惩罚：分数越高越不像 → 原来也用同样的条长表达

   结果扫一眼会读出「差异惩罚 90%，很高，很好」—— 完全反了。
   而这条恰恰是「不能照搬」的核心指标。
   ============================================================ */

test('维度卡：差异惩罚必须翻转，保证「条越长越好」方向统一', () => {
  const src = readFileSync(join(root, 'src', 'components', 'DimensionCard.tsx'), 'utf8');

  assert.ok(/invert:\s*true/.test(src), '差异惩罚应标记为需要翻转');
  assert.ok(
    /invert\s*\?\s*1\s*-\s*raw/.test(src),
    '应把差异惩罚翻转成「可迁移性」再画条（1 - raw）',
  );
  assert.ok(src.includes('可迁移性'), '标签应写成可迁移性，而不是继续叫「差异惩罚」让人误解方向');
  assert.ok(
    /条越长越好|所有条都是越长越好/.test(src),
    '必须有一句说明让读者知道所有条同向，否则翻转本身反而让人困惑',
  );
});

test('维度卡：高惩罚时要说清「不能照搬的是结果，不是做法」', () => {
  const src = readFileSync(join(root, 'src', 'components', 'DimensionCard.tsx'), 'utf8');
  assert.ok(
    /参考它的\*\*做法\*\*|别照搬/.test(src),
    '高惩罚的解释应区分「做法可参考」与「结果不能照搬」——这是产品核心主张',
  );
});

/* ============================================================
   ⑮ 界面上的耗时不能少报
   ------------------------------------------------------------
   实测：P3 的检索过程条原来只显示 meta.elapsed_ms（检索那一段，298ms），
   而用户实际等了 2.6s（解析 2336ms + 检索 298ms）—— 少了 8.8 倍。
   页面顶部还写着「我们不隐藏过程」，最显眼的数字却在藏 90% 的时间。
   ============================================================ */

test('耗时展示：必须把解析时间算进去，不能只报检索那一段', () => {
  const src = readFileSync(join(root, 'src', 'pages', 'P3ForkMap.tsx'), 'utf8');

  assert.ok(
    /parser_elapsed_ms/.test(src),
    'P3 必须读 parser_elapsed_ms —— 否则只显示检索耗时，少报近一个数量级',
  );
  assert.ok(
    /totalSeconds|合计|本次耗时/.test(src),
    '应展示「用户实际等待」的合计耗时，而不是单个阶段',
  );
  // 不应再出现只报 meta.elapsed_ms 的旧写法
  assert.ok(
    !/耗时\s*\{\(meta\.elapsed_ms/.test(src),
    '不应保留「耗时 = 仅 elapsed_ms」的旧写法',
  );
});

test('耗时展示：后端确实回了 parser_elapsed_ms（否则前端无从计算）', () => {
  const src = readFileSync(join(root, 'server', 'api.ts'), 'utf8');
  assert.ok(
    /parser_elapsed_ms/.test(src),
    '/api/consult 必须返回 parser_elapsed_ms，前端才能报出真实总耗时',
  );
});

/* ============================================================
   ⑭ 超出产品范围的输入要明确拒答
   ------------------------------------------------------------
   实测最尴尬的情形：喂「今天中午吃什么好呢，食堂人太多了」，
   模型照样吐结构化处境（阶段=午餐决策 / 冲突=忍受拥挤 vs 另寻出路），
   然后匹配出三位历史人物「对照」这顿午饭。
   评委随手打句玩笑话，看到的是系统一本正经地胡编 —— 比拒答难看得多。
   ============================================================ */

test('超范围：日常消费/天气/订票类输入必须拒答', () => {
  const shouldReject = [
    '今天中午吃什么好呢，食堂人太多了',
    '买哪个手机好',
    '今天天气怎么样',
    '帮我订一张票',
    '。。。',
    '烦',
  ];
  for (const t of shouldReject) {
    const r = detectOutOfScope(t);
    assert.ok(r, `应判为超范围但放行了：${t}`);
    assert.ok(r.reason.length > 0, '应给出原因');
    assert.ok(r.hint.length > 0, '应给出引导');
  }
});

test('超范围：真实处境必须放行（宁可少拦，不要误拦）', () => {
  const shouldPass = [
    '大三，材料科学，读了两年半，越来越觉得不适合自己',
    '工作五年了，在一家小公司做产品，看不到晋升路径',
    '想转行但不知道往哪转',
    '很迷茫',       // 三字但确实是人生状态的表达
    '四十岁了还在做同样的工作',
  ];
  for (const t of shouldPass) {
    assert.equal(detectOutOfScope(t), null, `不该拦下真实处境：${t}`);
  }
});

test('超范围：拒答信息要能指导用户改写，而不是只说「失败」', () => {
  const r = detectOutOfScope('今天中午吃什么');
  assert.ok(r, '应拒答');
  assert.ok(/不是人生抉择|日常消费/.test(r.reason), `原因要具体：${r.reason}`);
  assert.ok(r.hint.length >= 10, `引导要够用：${r.hint}`);
});

/* ============================================================
   ⑬ P1 的引导问题不能只有校园版
   ------------------------------------------------------------
   产品自己准备的第三个演示场景是「大厂还是小厂/创业」—— 一个职场处境。
   但六问的 placeholder 全是校园场景（「专业课 + 实验室打杂」
   「转专业要降级一年」）。
   评委试那个场景时会看到一堆只在大学里成立的问题，
   立刻露出「这套东西只做过学生」的马脚。
   ============================================================ */

test('P1 问题：按处境切换措辞（校园 / 职场 / 中性）', () => {
  const school = getJourneyQuestions('大二，专业是材料科学');
  const career = getJourneyQuestions('工作五年，在一家小公司做产品');
  const general = getJourneyQuestions('');

  assert.equal(school.length, 6, '六问');
  assert.equal(career.length, 6, '六问');
  assert.equal(general.length, 6, '六问');

  // 校园版与职场版的第二问必须不同 —— 这是「只在大学里成立」最明显的那句
  assert.notEqual(
    school[1].label,
    career[1].label,
    '校园版和职场版的第二问不该一模一样',
  );
  assert.ok(
    /两年|专业课|竞赛|实验室/.test(school[1].label + school[1].placeholder),
    '校园版应含校园语汇',
  );
  assert.ok(
    !/两年|专业课|竞赛|实验室/.test(career[1].label + career[1].placeholder),
    `职场版不该出现校园语汇：${career[1].label} / ${career[1].placeholder}`,
  );
  assert.ok(
    !/两年|专业课|竞赛|实验室/.test(general[1].label + general[1].placeholder),
    '中性版也不该出现校园语汇',
  );
});

test('P1 问题：判不出处境时退回中性措辞，不假装知道', () => {
  const s = detectJourneyStage('');
  assert.equal(s, 'general', '空输入应归为中性，而不是默认校园');

  // 各类关键词都要能判对
  assert.equal(detectJourneyStage('大三'), 'school');
  assert.equal(detectJourneyStage('在读研究生'), 'school');
  assert.equal(detectJourneyStage('工作五年'), 'career');
  assert.equal(detectJourneyStage('想转行'), 'career');
  assert.equal(detectJourneyStage('三十岁出头'), 'general');
});

test('P1 问题：切换后 id 保持一致（否则已填答案会对不上）', () => {
  const school = getJourneyQuestions('大二');
  const career = getJourneyQuestions('工作五年');
  assert.deepEqual(
    school.map((q) => q.id),
    career.map((q) => q.id),
    '两套问题的 id 必须一致 —— 否则用户切回上一问时答案会丢',
  );
});

/* ============================================================
   ⑫ 分叉地图的「过去」不能是写死的占位词
   ------------------------------------------------------------
   走查发现：无论用户输入什么故事，地图上都显示同样的
   「入学 / 投入 / 动摇」—— 连"换工作"这种跟入学无关的处境也显示「入学」。
   而地图是整个 demo 视觉上最显眼的东西，
   写死的标签等于告诉评委「这张图是装饰，不是数据」。
   ============================================================ */

test('分叉地图：过去节点必须从数据推出，不得写死入学/投入', () => {
  const src = readFileSync(join(root, 'src', 'components', 'ForkMap.tsx'), 'utf8');

  // 不得再出现写死的三个节点
  assert.ok(
    !/label:\s*'入学'/.test(src) && !/label:\s*'投入'/.test(src),
    '「入学 / 投入」是写死的占位词，必须改成从 situation 与案例数据推出',
  );
  assert.ok(src.includes('buildPastNodes'), '应有推导过去节点的函数');
  assert.ok(src.includes('situation'), 'ForkMap 应接收 situation 才能反映用户自己的处境');
  assert.ok(src.includes('prior_path'), '中段节点应来自匹配案例的来时路，而不是凭空写');
});

test('分叉地图：不同处境应得到不同的起点标签（逻辑层验证）', () => {
  const src = readFileSync(join(root, 'src', 'components', 'ForkMap.tsx'), 'utf8');

  // 起点标签必须读 situation.stage（而不是常量）
  assert.ok(
    /situation\?\.stage|situation\.stage/.test(src),
    '起点标签必须来自 situation.stage，否则不同处境会显示同一个词',
  );

  // 中段必须从 prior_path 抽词，且要求「多个案例共有」才有代表性
  assert.ok(/commonPriorPathWord/.test(src), '应有从案例来时路抽共有词的函数');
  assert.ok(
    /n\s*>=\s*2/.test(src),
    '中段词应要求至少 2 个案例共有 —— 只出现在一个案例里的词不具代表性',
  );

  // 末段固定为「动摇」：能走到检索这一步，对所有处境都成立
  assert.ok(/动摇/.test(src), '末段节点应保留「动摇」');
});

test('分叉地图：末段「动摇」对所有处境都成立（保留是刻意的）', () => {
  const src = readFileSync(join(root, 'src', 'components', 'ForkMap.tsx'), 'utf8');
  // 明确记录：其余两个节点数据驱动，只有末段是常量，且理由写在注释里
  assert.ok(
    /本身就是动摇了|对所有处境都成立/.test(src),
    '常量节点必须写明为什么可以常量，否则后人会以为又漏了',
  );
});

/* ============================================================
   ⑪ 证据抽屉必须是「真的能点开验证」
   ------------------------------------------------------------
   抽屉的整个承诺是「每个关键事实都能追溯到具体来源」，
   但原来只显示 source_id（如 LX-SENDAI）—— 用户根本无从验证。
   数据里本来就有 url，只是没渲染。
   ============================================================ */

test('证据抽屉：必须把 evidence.url 渲染成可点击外链', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceDrawer.tsx'), 'utf8');

  assert.ok(src.includes('href={e.url}'), '有 url 的证据必须渲染成链接');
  assert.ok(src.includes('target="_blank"'), '外链应新窗口打开（演示时不能把页面顶掉）');
  assert.ok(/rel="[^"]*noreferrer/.test(src), '外链应带 rel=noreferrer（安全与隐私）');
  assert.ok(src.includes('打开原文'), '链接文案要让评委一眼看出能点');
});

test('证据抽屉：AI 推断不能给出假链接，要说明为什么没有', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceDrawer.tsx'), 'utf8');

  assert.ok(src.includes('ai_inference'), '应识别 AI 推断类型');
  assert.ok(
    src.includes('无外部来源') || src.includes('AI 建模产物'),
    'AI 推断应明确说明「没有外部来源」，而不是留空白让人以为漏了',
  );
});

test('证据数据：至少一半的来源带可点击 url（保证抽屉不是空壳）', () => {
  const episodes = loadEpisodes();
  let total = 0;
  let withUrl = 0;
  for (const e of episodes) {
    for (const ev of e.evidence ?? []) {
      total++;
      if (ev.url) withUrl++;
    }
  }
  assert.ok(total > 0, '应有多条 evidence');
  // AI 推断类天然没有 url（36 条里约 1/3），所以门槛设在 40%
  assert.ok(
    withUrl / total >= 0.4,
    `带 url 的证据比例过低（${withUrl}/${total}）—— 证据抽屉会变成点不动的空壳`,
  );
});

/* ============================================================
   ⑩ 证据分层不能与时间轴重复
   ------------------------------------------------------------
   走查发现 P4 一屏之内同样的文字出现两遍：
   outcomes 在时间轴展示过、又在 interpretations 层列一次；
   reflection.unknowns 更是 3/3 完全重复。
   分层区的价值是交代「哪部分有来源」，不是复述正文。
   ============================================================ */

test('证据分层：已被时间轴展示过的层必须走汇总，不再逐条重复', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceLayers.tsx'), 'utf8');

  assert.ok(
    /SHOWN_ABOVE[\s\S]{0,80}'interpretations'/.test(src),
    'interpretations 层应被标记为"已在时间轴展示"',
  );
  assert.ok(
    /SHOWN_ABOVE[\s\S]{0,80}'unknowns'/.test(src),
    'unknowns 层应被标记为"已在时间轴展示"',
  );
  assert.ok(src.includes('layer-summary'), '应有汇总行代替逐条重复');
  assert.ok(
    /detailed\s*=\s*LAYER_META\.filter/.test(src),
    '应有 detailed / summarized 的拆分逻辑',
  );
});

test('证据分层：真正的新信息（带来源的史实/本人表述/AI 类比）仍要完整列出', () => {
  const src = readFileSync(join(root, 'src', 'components', 'EvidenceLayers.tsx'), 'utf8');

  // facts / self_claims / ai_inferences 不得进入汇总集合
  const block = src.slice(src.indexOf('const SHOWN_ABOVE'));
  for (const k of ['facts', 'self_claims', 'ai_inferences']) {
    assert.ok(
      !new RegExp(`SHOWN_ABOVE[^;]*'${k}'`, 's').test(block),
      `${k} 属于新信息，不能走汇总（否则等于把来源信息藏起来）`,
    );
  }
});

/* ============================================================
   ⑨ 模型输出的小瑕疵要在显示前清掉
   ------------------------------------------------------------
   实测见到过 goals 里出现「止损止损」这种叠词。不影响程序正确性，
   但会直接显示给用户 —— 在「把别人的经历讲清楚」的产品里显得很廉价。
   ============================================================ */

test('净化：去掉相邻重复词，但不改写其他内容', () => {
  const out = normalizeSituationFields({
    stage: '大三',
    dilemma: '坚持 vs 转向',
    options: ['止损止损', '继续读完', '正常选项'],
    constraints: ['家庭 家庭'],
    goals: ['探索新方向'],
    unknowns: ['上岸概率', '止损止损'],
    risk: 'medium',
    reversibility: 'medium',
  }) as Record<string, unknown>;

  assert.deepEqual(out.options, ['止损', '继续读完', '正常选项'], '叠词应被去掉，其他选项不能动');
  assert.deepEqual(out.constraints, ['家庭'], '空格分隔的重复词也应去掉');
  assert.deepEqual(out.goals, ['探索新方向'], '正常内容必须原样保留');
  assert.deepEqual(out.unknowns, ['上岸概率', '止损'], '叠词处理应覆盖 unknowns');
  assert.equal(out.stage, '大三');
});

test('净化：不误伤正常的多字词与短语', () => {
  const out = normalizeSituationFields({
    stage: '大三',
    dilemma: '直接就业 vs 继续考研',
    options: ['继续深造本专业', '跨专业考研'],
    constraints: ['已投入两年半时间'],
    goals: ['顺利毕业'],
    unknowns: ['考研上岸概率'],
    risk: 'medium',
    reversibility: 'medium',
  }) as Record<string, unknown>;

  assert.deepEqual(out.options, ['继续深造本专业', '跨专业考研'], '「深造」这类词不该被误判为叠词');
  assert.deepEqual(out.constraints, ['已投入两年半时间']);
});

/**
 * ⚠️ 两次实测教训，都写进测试：
 *   第一版只处理「整串重复」和「空格分隔重复」，
 *   但真正出问题的形态是**句子中间的重复词**：
 *     【目标】在意的目标有具体交集：「止损止损」（…）
 *   结果清理上线后页面上照样显示「止损止损」。
 */
test('净化：句子中间的重复词也要清掉（不只是整串重复）', () => {
  const midSentence = '【目标】在意的目标有具体交集：「止损止损」（对方的目标：限制追加投入）';
  const out = normalizeSituationFields({
    stage: 'x',
    dilemma: 'a vs b',
    options: [],
    constraints: [],
    goals: [midSentence],
    unknowns: [],
    risk: 'medium',
    reversibility: 'medium',
  }) as Record<string, unknown>;

  const got = (out.goals as string[])[0];
  assert.ok(!got.includes('止损止损'), `句中间的重复没被清掉：${got}`);
  assert.ok(got.includes('「止损」'), `应保留一份：${got}`);
});

test('净化：合法的中文叠词不能被误删（好好/慢慢/偏偏）', () => {
  const legit = ['好好想想', '慢慢来', '偏偏', '渐渐清楚'];
  const out = normalizeSituationFields({
    stage: 'x',
    dilemma: 'a vs b',
    options: legit,
    constraints: [],
    goals: [],
    unknowns: [],
    risk: 'medium',
    reversibility: 'medium',
  }) as Record<string, unknown>;

  assert.deepEqual(out.options, legit, '「好好」「慢慢」「偏偏」是正常词，删了反而错');
});

test('净化：三连重复也要收敛成一份', () => {
  const out = normalizeSituationFields({
    stage: 'x',
    dilemma: 'a vs b',
    options: ['止损止损止损'],
    constraints: [],
    goals: [],
    unknowns: [],
    risk: 'medium',
    reversibility: 'medium',
  }) as Record<string, unknown>;

  assert.deepEqual(out.options, ['止损'], '三连重复应收敛成一份');
});

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

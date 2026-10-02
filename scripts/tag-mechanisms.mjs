/**
 * 给案例打「决策机制」标签
 * ============================================
 * 用法：npm run tag:mechanisms          读 data/episodes.json → 写 data/mechanisms.json
 *       npm run tag:mechanisms -- --force   已标过的也重标
 *
 * 为什么单独做一个脚本，而不是在运行时让模型现算：
 *   机制标注是**离线一次性**的工作，产出可复现、可人工复核、可进 git。
 *   运行时现算会：① 慢 ② 不稳定（同一案例两次跑出不同标签）③ 无法提前审。
 *
 * ⚠️ 三条设计约束（都有实测依据，别推翻）：
 *
 *   ① archetype 是**新增字段**，不覆盖 episode.choice.type。
 *      实测：把 choice.type 当标准答案喂给模型，6 条里改了 4 条 ——
 *      但检查后确认模型更准（鲁迅/乔布斯判为「双轨」符合史实）。
 *      两者回答不同问题：choice.type 记"做了什么"，archetype 记"在权衡什么"。
 *
 *   ② root_factors 必须落在封闭词表内。
 *      不封闭的话模型会自由发挥，跨人物的集合重叠就无从计算，聚类直接失效。
 *      本脚本**校验不合词表就报错**，不静默放过。
 *
 *   ③ 必须可复现。temperature=0，同样输入两次跑结果应一致。
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ROOT_FACTORS } from '../src/types/landscape.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const EPISODES = process.env.EPISODES_PATH ?? join(root, 'data', 'episodes.json');
const OUT = join(root, 'data', 'mechanisms.json');

const MODEL = process.env.MECHANISM_MODEL ?? 'deepseek-v4.1-flash';
const CONCURRENCY = Number(process.env.MECHANISM_CONCURRENCY ?? 4);
const FORCE = process.argv.includes('--force');

/* ---------------- 词表校验 ---------------- */

const VALID = new Set(ROOT_FACTORS);

/** 模型偶尔会写近义词，先做一次规范化；仍不在词表内就抛错 */
const ALIASES = {
  沉没成本: ['已投入成本', '投入成本', '既得投入', '沉没投入'],
  转换成本: ['切换成本', '转轨成本', '转移成本'],
  新路径验证不足: ['新方向验证不足', '验证不足', '方向验证不足', '新路径未验证'],
  长期方向匹配: ['方向匹配', '长期匹配', '方向契合度'],
  再次选错风险: ['二次选错风险', '再次失误风险', '选错风险'],
  时间窗口: ['机会窗口', '时间窗', '时序窗口'],
  经济压力: ['财务压力', '经济约束', '资金压力'],
  家庭约束: ['家庭期待', '家庭期望', '家庭责任', '家庭压力'],
  制度约束: ['制度性约束', '体制约束', '学制约束', '制度门槛'],
  身份绑定: ['身份绑定约束', '公费身份', '身份契约'],
  机会成本: ['机会成本损失'],
  社会支持: ['人际支持', '组织支持', '社会网络支持'],
};

function normalizeFactor(raw) {
  const s = String(raw).trim();
  if (VALID.has(s)) return s;
  for (const [canonical, alts] of Object.entries(ALIASES)) {
    if (alts.includes(s)) return canonical;
  }
  return null; // 不在词表内
}

/* ---------------- 词表（喂给模型） ---------------- */

const SCHEMA = {
  name: 'mechanism',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      archetype: {
        type: 'string',
        enum: [
          'persist',
          'explore_then_persist',
          'explore_then_switch',
          'direct_switch',
          'dual_track',
          'abandon',
          'unknown',
        ],
      },
      root_factors: { type: 'array', items: { type: 'string' } },
      mechanism_short: { type: 'string' },
    },
    required: ['archetype', 'root_factors', 'mechanism_short'],
    additionalProperties: false,
  },
};

function systemPrompt() {
  return [
    '你在给一个「人生决策事件」打结构化标签。只输出 JSON。',
    '',
    '【archetype】从这些里选最贴切的一个：',
    '  persist               守住已投入的路径',
    '  explore_then_persist  先低成本试探，验证后决定守住',
    '  explore_then_switch   先低成本试探，验证后转向',
    '  direct_switch         直接转向',
    '  dual_track            两条轨并行（退而不离、边做边试）',
    '  abandon               退出/放弃该路径',
    '  unknown               证据不足以判定',
    '',
    '⚠️ 特别注意 dual_track：如果当事人「形式上离开了原路径，但实质上仍然保持投入」',
    '   （例如退学但继续旁听、离职但继续做原领域的项目），应判为 dual_track，',
    '   而不是 direct_switch 或 abandon。',
    '',
    '【root_factors】必须**严格从这个词表里选**，不要写近义词：',
    '  ' + ROOT_FACTORS.join(' / '),
    '',
    '⚠️⚠️ 选词规则（很容易做错，务必读）：',
    '  1. 选 **3-4 个**，不要多选。',
    '  2. 每个因素必须是**这次决策里真正起作用的张力**，',
    '     而不是「这个人整体上具有的属性」。',
    '  3. 【最重要的排除规则】不要选那些「几乎所有人生决策都成立」的通用因素。',
    '     反面例子：「长期方向匹配」—— 任何重大决策都关乎长期方向。',
    '     如果你给 90% 以上的案例都选它，它就没有区分度，聚类会失效。',
    '     问自己：**如果把这个因素去掉，这次决策的性质会变吗？**',
    '     不会变就不要选。',
    '  4. 优先选那些能把「这次决策」和「别的决策」区分开的因素。',
    '',
    '【mechanism_short】不超过 20 字，概括他在权衡什么，或做了什么取舍。',
    '  ⚠️ 不得出现具体职业名、专业名、学科名、机构名（否则无法跨时代比较）。',
    '  ⚠️⚠️ **不要套用固定句式**。实测发现模型爱写「在已投入路径与未验证向往间权衡」，',
    '     36 条里 21 条都这么写 —— 那样这行字就完全没用了。',
    '     必须针对**这一条案例的具体处境**写，让读者一眼看出它和别的案例不同。',
    '  ✅ 好例子（各不相同）：「低成本试探后确认原方向更匹配」',
    '                        「为兑现家庭期待而先保住学位」',
    '                        「放弃身份契约换取表达自由」',
    '  ❌ 坏例子：「在已投入路径与未验证向往间权衡」← 套模板，放哪条都成立',
    '  ❌ 坏例子：「纠结要不要从医学转文学」← 出现了具体专业',
    '  ❌ 坏例子：「恐惧 vs 勇敢」← 心理化，不是决策结构',
    '  ❌ 坏例子：「稳定 vs 成长」← 过于空泛',
  ].join('\n');
}

function userPrompt(ep) {
  const parts = [
    `# 决策事件：${ep.episode_id}`,
    `人物：${ep.person?.name ?? '未知'}（${ep.time?.year ?? '?'} 年）`,
    '',
    '## 走到这里之前，他已经经历了什么',
    ...(ep.prior_path ?? []).map((p) => `- ${p}`),
    '',
    '## 此刻的处境',
    `- 冲突：${ep.decision_state?.dilemma ?? ''}`,
    `- 可选道路：${(ep.decision_state?.options ?? []).join(' / ')}`,
    `- 现实约束：${(ep.decision_state?.constraints ?? []).join(' / ')}`,
    `- 在意的目标：${(ep.decision_state?.goals ?? []).join(' / ')}`,
    `- 可逆性：${ep.decision_state?.reversibility ?? '?'}`,
    '',
    '## 他实际做了什么',
    ...(ep.choice?.actions ?? []).map((a) => `- ${a}`),
    '',
    '## 后来发生了什么',
    `- 短期：${ep.outcomes?.short_term ?? ''}`,
    `- 中期：${ep.outcomes?.mid_term ?? ''}`,
    `- 长期：${ep.outcomes?.long_term ?? ''}`,
  ];
  if (ep.reflection?.self_comment) {
    parts.push('', '## 他本人后来说', ep.reflection.self_comment);
  }
  return parts.join('\n');
}

/* ---------------- LLM 调用 ---------------- */

async function callModel(ep) {
  const res = await fetch(`${process.env.TOKENDANCE_BASE ?? 'https://tokendance.space/gateway/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TOKENDANCE_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: userPrompt(ep) },
      ],
      max_tokens: 600,
      temperature: 0,
      reasoning_effort: 'none',
      response_format: { type: 'json_schema', json_schema: SCHEMA },
    }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}：${(await res.text()).slice(0, 160)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? '';
  if (content.length < 20) {
    throw new Error(`返回空 content（completion_tokens=${json.usage?.completion_tokens}）`);
  }
  return JSON.parse(content);
}

/* ---------------- 主流程 ---------------- */

const raw = JSON.parse(readFileSync(EPISODES, 'utf8'));
const episodes = Array.isArray(raw) ? raw : (raw.episodes ?? []);
if (episodes.length === 0) {
  console.error('  ❌ data/episodes.json 里没有案例');
  process.exit(1);
}

let existing = {};
if (existsSync(OUT) && !FORCE) {
  existing = JSON.parse(readFileSync(OUT, 'utf8')).mechanisms ?? {};
}

const todo = episodes.filter((e) => !existing[e.episode_id]);
if (todo.length === 0) {
  console.log(`  ✅ ${episodes.length} 条都已标注（加 --force 可重标）`);
  process.exit(0);
}

console.log('');
console.log('  给案例打「决策机制」标签');
console.log('  ' + '─'.repeat(60));
console.log(`  模型：${MODEL}　并发：${CONCURRENCY}`);
console.log(`  待标注：${todo.length} / ${episodes.length} 条`);
console.log('');

const results = { ...existing };
const failures = [];
let done = 0;

async function worker(queue) {
  while (queue.length > 0) {
    const ep = queue.shift();
    if (!ep) break;
    try {
      const out = await callModel(ep);

      // 词表校验 —— 不合就报错，不静默放过（约束②）
      const normalized = [];
      const rejected = [];
      for (const f of out.root_factors ?? []) {
        const canon = normalizeFactor(f);
        if (canon) {
          if (!normalized.includes(canon)) normalized.push(canon);
        } else {
          rejected.push(f);
        }
      }
      if (rejected.length > 0) {
        throw new Error(`root_factors 含词表外的值：${rejected.join('、')}`);
      }
      if (normalized.length < 3) {
        throw new Error(`root_factors 只有 ${normalized.length} 个（要求 ≥3）`);
      }

      const mech = String(out.mechanism_short ?? '').trim();
      if (mech.length === 0) throw new Error('mechanism_short 为空');
      if (mech.length > 30) throw new Error(`mechanism_short 过长（${mech.length} 字）`);

      results[ep.episode_id] = {
        archetype: out.archetype,
        root_factors: normalized,
        mechanism_short: mech,
        // ⚠️ 刻意不覆盖 choice.type —— 两者回答不同问题（约束①）
        choice_type_original: ep.choice?.type,
        tagged_by: MODEL,
        tagged_at: new Date().toISOString().slice(0, 10),
      };

      done++;
      const drift =
        ep.choice?.type !== out.archetype && out.archetype !== 'unknown'
          ? `  ⚠️ 与 choice.type(${ep.choice?.type}) 判定不同`
          : '';
      console.log(
        `  [${String(done).padStart(2)}/${todo.length}] ${(ep.person?.name ?? ep.episode_id).padEnd(16)} ` +
          `${out.archetype.padEnd(20)} ${mech.slice(0, 22)}${drift}`,
      );
    } catch (e) {
      failures.push({ id: ep.episode_id, error: e.message });
      console.log(`  [--] ${ep.episode_id}  ❌ ${e.message.slice(0, 70)}`);
    }
  }
}

const queue = [...todo];
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker(queue)));

/* ---------------- 落盘 ---------------- */

const payload = {
  _note:
    '由 scripts/tag-mechanisms.mjs 生成。archetype 是**新增字段**，不覆盖 episode.choice.type —— ' +
    '两者回答不同问题：choice.type 记「做了什么」，archetype 记「在权衡什么」（实测依据见该脚本注释）。',
  _model: MODEL,
  _generated_at: new Date().toISOString(),
  mechanisms: results,
};

writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log('');
console.log('  ' + '─'.repeat(60));
console.log(`  ✅ 已写入 data/mechanisms.json（${Object.keys(results).length} 条）`);

if (failures.length > 0) {
  console.log('');
  console.log(`  ⚠️ ${failures.length} 条失败：`);
  for (const f of failures) console.log(`    ${f.id}：${f.error}`);
  process.exit(1);
}

/* ---------------- 分布报告 ---------------- */

const dist = {};
for (const m of Object.values(results)) {
  dist[m.archetype] = (dist[m.archetype] ?? 0) + 1;
}
console.log('');
console.log('  走法原型分布：');
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(22)} ${String(v).padStart(2)}  ${'█'.repeat(v)}`);
}

/* ---------------- 质量检查 ---------------- */

// ⚠️ 这两个检查是补上来的 —— 第一版跑完后才发现问题，说明「跑完不检查」会翻车。
let qualityProblems = [];

// 检查 A：mechanism_short 不能大量重复
//   第一版 36 条里 21 条是同一句话「在已投入路径与未验证向往间权衡」，
//   等于这行字完全没信息量。
const mechCount = {};
for (const m of Object.values(results)) {
  mechCount[m.mechanism_short] = (mechCount[m.mechanism_short] ?? 0) + 1;
}
const uniqueMech = Object.keys(mechCount).length;
const totalMech = Object.values(results).length;
const dupRatio = 1 - uniqueMech / totalMech;
const worst = Object.entries(mechCount).sort((a, b) => b[1] - a[1])[0];
console.log('');
console.log(`  表述多样性：${uniqueMech}/${totalMech} 种不同（重复率 ${(dupRatio * 100).toFixed(0)}%）`);
if (dupRatio > 0.4) {
  qualityProblems.push(
    `mechanism_short 重复率过高（${(dupRatio * 100).toFixed(0)}%）。` +
      `出现最多的：「${worst[0]}」× ${worst[1]} 条。` +
      `这行字失去了区分度，请加强提示词的「不要套模板」约束后重跑。`,
  );
}

// 检查 B：根因素不能有「几乎人人都命中」的
//   第一版「长期方向匹配」出现 35/36 = 97%，这种因素没有区分度，
//   会把它当成聚类依据时把所有案例聚成一坨。
const factorCount = {};
for (const m of Object.values(results)) {
  for (const f of m.root_factors) factorCount[f] = (factorCount[f] ?? 0) + 1;
}
console.log('');
console.log('  根因素使用频次（越接近 100% 越没用）：');
for (const [k, v] of Object.entries(factorCount).sort((a, b) => b[1] - a[1])) {
  const pct = (v / totalMech) * 100;
  const warn = pct >= 85 ? '  ⚠️ 无区分度' : '';
  console.log(`    ${k.padEnd(16)} ${String(v).padStart(2)}  ${pct.toFixed(0).padStart(3)}%  ${'█'.repeat(v)}${warn}`);
}
const ubiquits = Object.entries(factorCount).filter(([, v]) => v / totalMech >= 0.85);
if (ubiquits.length > 0) {
  qualityProblems.push(
    `这些根因素几乎人人命中、无区分度：${ubiquits.map(([k, v]) => `${k}(${(v / totalMech * 100).toFixed(0)}%)`).join('、')}。` +
      `聚类时它们会把所有案例聚成一坨。`,
  );
}

if (qualityProblems.length > 0) {
  console.log('');
  console.log('  ' + '─'.repeat(60));
  console.log('  ❌ 质量问题（结果已写出，但不能直接用）：');
  for (const p of qualityProblems) console.log(`    · ${p}`);
  console.log('');
  process.exit(2);
}

console.log('');
console.log('  ✅ 质量检查通过');
console.log('');

/**
 * 数据源注册表 —— 「模板」的关键抽象
 * ============================================
 * 引擎通过这个模块拿到案例，**它不认识「历史人物」这个概念**。
 *
 *   历史人物库  ─┐
 *   校友库      ─┼→  同一个 DataSource 接口  →  同一套引擎
 *   员工库      ─┤
 *   机构私有库  ─┘
 *
 * ⚠️ 这是产品定位的核心：
 *   历史名人数据只是**无法获得大量真实数据时的演示替身**。
 *   真正要交付的是「引擎 + Schema」，数据源可整套替换。
 *
 * ⚠️ 刻意不修改 server/retrieval/load-episodes.ts
 *   那个文件是 Damn4lee 的责任区，现有六页在用。
 *   本模块**新增**，只做包装，不碰原文件。
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DecisionEpisode } from '../../src/types/episode.ts';
import type {
  DataSource,
  DataSourceInfo,
  MechanismTag,
  PrivacyLevel,
  SourceType,
} from '../../src/types/landscape.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const EPISODES_PATH = join(root, 'data', 'episodes.json');
const MECHANISMS_PATH = join(root, 'data', 'mechanisms.json');
const ALUMNI_PATH = join(root, 'data', 'alumni-demo.ts');

/** 带机制标注的案例 */
export type TaggedEpisode = DecisionEpisode & { mechanism?: MechanismTag };

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

function loadMechanisms(): Record<string, MechanismTag> {
  const raw = readJson<{ mechanisms?: Record<string, MechanismTag> }>(MECHANISMS_PATH);
  return raw?.mechanisms ?? {};
}

/* ============================================================
   历史人物库
   ============================================================ */

function makeHistoricalSource(): DataSource {
  const raw = JSON.parse(readFileSync(EPISODES_PATH, 'utf8')) as
    | { episodes?: DecisionEpisode[] }
    | DecisionEpisode[];
  const episodes = Array.isArray(raw) ? raw : (raw.episodes ?? []);
  const mech = loadMechanisms();

  const tagged: TaggedEpisode[] = episodes.map((e) => ({
    ...e,
    mechanism: mech[e.episode_id],
  }));

  const info: DataSourceInfo = {
    id: 'historical',
    label: '历史人物库',
    source_type: 'historical_public' satisfies SourceType,
    privacy_level: 'public' satisfies PrivacyLevel,
    description: '公开史料中可核实的真实人生决策事件。人物名气与时代差异较大，请看「为什么不能照搬」。',
    episode_count: tagged.length,
    person_count: new Set(tagged.map((e) => e.person.name)).size,
  };

  return { info, episodes: tagged };
}

/* ============================================================
   校友库（演示数据）
   ============================================================ */

/**
 * ⚠️ 校友数据放在 .ts 里而不是 .json，是为了能在文件内写注释说明
 *   「这是虚构数据」「真实部署时数据从哪来」—— 防止后人误以为是真数据。
 *
 *   读 .ts 需要动态 import（Node 25 原生支持），所以做成 async。
 */
async function makeAlumniSource(): Promise<DataSource> {
  if (!existsSync(ALUMNI_PATH)) {
    throw new Error(`找不到 ${ALUMNI_PATH}`);
  }
  // ⚠️ Windows 上绝对路径必须转成 file:// URL，否则 ESM loader 报
  //    "Only URLs with a scheme in: file, data, and node are supported"。
  const { pathToFileURL } = await import('node:url');
  const mod = (await import(pathToFileURL(ALUMNI_PATH).href)) as {
    ALUMNI_EPISODES: DecisionEpisode[];
    ALUMNI_META: { disclaimer: string };
  };
  const mech = loadMechanisms();

  const tagged: TaggedEpisode[] = mod.ALUMNI_EPISODES.map((e) => ({
    ...e,
    mechanism: mech[e.episode_id],
  }));

  const info: DataSourceInfo = {
    id: 'alumni',
    label: '校友库（演示数据）',
    source_type: 'alumni' satisfies SourceType,
    privacy_level: 'deidentified' satisfies PrivacyLevel,
    description: mod.ALUMNI_META.disclaimer,
    episode_count: tagged.length,
    person_count: new Set(tagged.map((e) => e.person.name)).size,
  };

  return { info, episodes: tagged };
}

/* ============================================================
   注册表
   ============================================================ */

const KNOWN_SOURCES: Record<string, () => Promise<DataSource> | DataSource> = {
  historical: makeHistoricalSource,
  alumni: makeAlumniSource,
};

export const DEFAULT_SOURCE_ID = 'historical';

/** 列出所有可用数据源（不加载内容，只给元信息供前端做开关） */
export function listSources(): Array<{ id: string; label: string }> {
  return [
    { id: 'historical', label: '历史人物库' },
    { id: 'alumni', label: '校友库（演示数据）' },
  ];
}

/** 按 id 取数据源；id 不存在时回退到默认源并打印警告 */
export async function getSource(id?: string): Promise<DataSource> {
  const wanted = id ?? DEFAULT_SOURCE_ID;
  const factory = KNOWN_SOURCES[wanted];
  if (!factory) {
    console.error(`[data-source] ⚠️ 未知数据源「${wanted}」，回退到 ${DEFAULT_SOURCE_ID}`);
    return await KNOWN_SOURCES[DEFAULT_SOURCE_ID]();
  }
  return await factory();
}

/**
 * 校友库的机制标注。
 *
 * ⚠️ 校友数据是新造的，mechanisms.json 里没有它们 —— 必须现标。
 *   这里**不在请求时调 LLM**（会让响应变慢且不稳定），
 *   而是在启动时做一次内存缓存，结果也落盘到 data/mechanisms-alumni.json。
 *
 *   如果落盘文件不存在，就先用一份**手工规则**兜底：
 *   校友数据的 choice.type 已经是我们自己设计的，与 archetype 一一对应，
 *   root_factors 则由下面的关键词表推出。
 *   这样 Demo 不依赖 LLM 就能跑，且结果稳定可复现。
 */
export function alumniMechanismFallback(ep: DecisionEpisode): MechanismTag {
  // 校友数据的 choice.type 是我们自己设计的，直接映射到 archetype
  const archetype = ep.choice.type as MechanismTag['archetype'];

  // 从 constraints/goals 里推 root_factors（关键词匹配，确定性）
  const text = [
    ...(ep.decision_state.constraints ?? []),
    ...(ep.decision_state.goals ?? []),
    ep.decision_state.dilemma ?? '',
    ...(ep.prior_path ?? []),
  ].join(' ');

  const RULES: Array<[string, string[]]> = [
    ['沉没成本', ['已投入', '已修完', '已积累', '已读', '读了两年', '投入大', '五年学制']],
    ['转换成本', ['重新积累', '从零', '重新学', '需重新']],
    ['新路径验证不足', ['没有', '自学', '只做过', '只接触', '没有系统学', '没有其他专业']],
    ['长期方向匹配', ['兴趣', '方向', '喜欢', '认可', '想做']],
    ['再次选错风险', ['再选错', '再次', '再一次']],
    ['时间窗口', ['尽快', '窗口', '期限', '时间']],
    ['经济压力', ['收入', '经济', '薪资', '薪酬', '钱', '低薪']],
    ['家庭约束', ['家里', '家庭', '父母', '家人']],
    ['制度约束', ['保研', '学制', '编制', '资格', '考公', '门槛']],
    ['身份绑定', ['名额', '身份', '资格']],
    ['机会成本', ['放弃', '拒绝', '拒掉', '舍', '错过']],
    ['社会支持', ['导师', '同学', '团队', '朋友', '支持']],
  ];

  const factors: string[] = [];
  for (const [factor, keywords] of RULES) {
    if (keywords.some((k) => text.includes(k))) factors.push(factor);
  }
  // 兜底：至少 3 个
  for (const f of ['转换成本', '长期方向匹配', '时间窗口']) {
    if (factors.length >= 3) break;
    if (!factors.includes(f)) factors.push(f);
  }

  // mechanism_short：用 dilemma 压缩，保证各不相同
  const dilemma = (ep.decision_state.dilemma ?? '').replace(/\s/g, '');
  const short =
    dilemma.length <= 20
      ? dilemma.replace(' vs ', '还是')
      : dilemma.slice(0, 19) + '…';

  return {
    archetype,
    root_factors: factors.slice(0, 4) as MechanismTag['root_factors'],
    mechanism_short: short,
    tagged_by: 'rule-fallback',
    tagged_at: new Date().toISOString().slice(0, 10),
  };
}

/** 取数据源，并保证每条案例都有 mechanism（校友库用规则兜底） */
export async function getSourceWithMechanisms(id?: string): Promise<DataSource> {
  const src = await getSource(id);
  return {
    ...src,
    episodes: src.episodes.map((e) => ({
      ...e,
      mechanism: e.mechanism ?? alumniMechanismFallback(e),
    })),
  };
}

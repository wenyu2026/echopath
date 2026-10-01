/**
 * 生成前端离线兜底数据（T5 集成）
 * ============================================
 * 从 server/fixtures/demo-cache-{1,2,3}.json 生成 src/data/demoCache.ts。
 *
 * ⚠️ v2 改进：三个演示场景**全都**打包进前端。
 *   之前只打包了场景 1，于是断网时改做场景 2/3 的演示，
 *   页面会显示场景 1 的数据 —— 输入和结果对不上，
 *   比没有数据更糟（评委会以为系统串了）。
 *   现在按用户输入与三个场景的问法做字符重叠匹配，选最接近的那份。
 *
 * 什么时候要重新跑：
 *   · 数据（data/episodes.json）变了
 *   · 反类比/证据分层逻辑变了
 *   · 演示前想刷新一份最新快照
 *
 * 用法：
 *   npm run build:cache      用已有 fixture 生成
 *   npm run refresh:cache    先请求 API 刷新 fixture，再生成
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fixtures = join(root, 'server', 'fixtures');
const out = join(root, 'src', 'data', 'demoCache.ts');

const fromApi = process.argv.includes('--from-api');
const apiBase = process.env.API_BASE ?? 'http://localhost:3000';

const inputs = JSON.parse(readFileSync(join(fixtures, 'demo-inputs.json'), 'utf8'));

if (fromApi) {
  for (const d of inputs.demos) {
    process.stdout.write(`  请求 demo${d.id} … `);
    const res = await fetch(`${apiBase}/api/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_input: d.raw_input }),
    });
    if (!res.ok) {
      console.log(`❌ HTTP ${res.status}`);
      process.exit(1);
    }
    const data = await res.json();
    if (data.error) {
      console.log(`❌ ${data.error.message}`);
      process.exit(1);
    }
    writeFileSync(join(fixtures, `demo-cache-${d.id}.json`), JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${data.matches?.length ?? 0} 条案例`);
  }
}

/** 收集所有存在的场景 */
const scenarios = [];
for (const d of inputs.demos) {
  const file = join(fixtures, `demo-cache-${d.id}.json`);
  if (!existsSync(file)) {
    console.log(`  ⚠️ 缺少 demo-cache-${d.id}.json，跳过场景 ${d.id}`);
    continue;
  }
  const cache = JSON.parse(readFileSync(file, 'utf8'));
  if (cache.error) {
    console.log(`  ⚠️ demo-cache-${d.id}.json 是错误响应，跳过`);
    continue;
  }
  scenarios.push({
    id: d.id,
    name: d.name,
    raw_input: d.raw_input,
    situation: cache.situation,
    retrieval: cache,
  });
}

if (scenarios.length === 0) {
  console.error('  ❌ 一个可用场景都没有，无法生成');
  process.exit(1);
}

const header = `/**
 * 离线兜底数据
 * ============================================
 * 由 server/fixtures/demo-cache-*.json 生成，**不要手改**。
 * 重新生成：npm run build:cache（或 npm run refresh:cache 先刷新再生成）
 *
 * 为什么打包进前端：方案验收清单要求「断网/API 错误时有缓存的 Demo 数据，
 * 保证上台可演示」。演示当天网络不可控，这一层不能省。
 *
 * 为什么放多份：只放一份的话，断网时演示场景 2/3 会显示场景 1 的结果 ——
 * 输入和结果对不上比没有数据更糟（看上去像系统串了）。
 * pickScenario() 按字符重叠挑最接近的那份。
 */

import type { RetrievalResponse, Situation } from '../types/episode';

export interface CachedScenario {
  id: number;
  name: string;
  /** 该场景的原始输入，用于与用户实际填写的内容做匹配 */
  raw_input: string;
  situation?: Situation;
  retrieval?: RetrievalResponse;
}

/** 演示场景的完整快照 */
export const demoScenarios: CachedScenario[] = `;

const footer = `;

/** 字符 bigram 重叠率 —— 词汇对不上时也能判断"问的是不是同一类事" */
function bigramOverlap(a: string, b: string): number {
  const grams = (s: string): Set<string> => {
    const clean = s.replace(/[\\s，,。.、；;：:！!？?—\\-]/g, '');
    const set = new Set<string>();
    for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2));
    return set;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

/**
 * 按用户实际填写的内容挑最接近的演示快照。
 *
 * 刻意做得保守：重叠率低于 0.05 就退回第 1 个场景，
 * 而不是硬凑一个不太像的 —— 显示不相关的数据比显示"通用演示数据"更容易被误读。
 */
export function pickScenario(narrative: string): CachedScenario {
  if (!narrative?.trim() || demoScenarios.length === 0) return demoScenarios[0];
  let best = demoScenarios[0];
  let bestScore = 0;
  for (const s of demoScenarios) {
    const score = bigramOverlap(narrative, s.raw_input);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore < 0.05 ? demoScenarios[0] : best;
}

/** 默认场景（场景 1），兼容不关心匹配的调用方 */
export const demoCache = {
  situation: demoScenarios[0]?.situation,
  retrieval: demoScenarios[0]?.retrieval,
};
`;

writeFileSync(out, `${header}${JSON.stringify(scenarios, null, 2)};\n${footer}`, 'utf8');

const cases = scenarios.reduce((n, s) => n + (s.retrieval?.matches?.length ?? 0), 0);
const wd = scenarios.reduce(
  (n, s) => n + (s.retrieval?.matches ?? []).reduce((m, x) => m + (x.why_different?.length ?? 0), 0),
  0,
);
console.log(`✅ 已生成 src/data/demoCache.ts`);
console.log(`   ${scenarios.length} 个场景 / ${cases} 条案例 / ${wd} 条反类比`);

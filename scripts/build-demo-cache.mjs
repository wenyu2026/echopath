/**
 * 生成前端离线兜底数据（T5 集成）
 * ============================================
 * 从 server/fixtures/demo-cache-1.json 生成 src/data/demoCache.ts。
 *
 * 什么时候要重新跑：
 *   · 数据（data/episodes.json）变了
 *   · 反类比/证据分层逻辑变了
 *   · 演示前想刷新一份最新快照
 *
 * 用法：npm run build:cache      （需要 API 已在 :3000 运行，或直接用已有 fixture）
 *      node scripts/build-demo-cache.mjs --from-api   先请求 API 刷新 fixture 再生成
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fixture = join(root, 'server', 'fixtures', 'demo-cache-1.json');
const out = join(root, 'src', 'data', 'demoCache.ts');

const fromApi = process.argv.includes('--from-api');
const apiBase = process.env.API_BASE ?? 'http://localhost:3000';

if (fromApi) {
  const inputs = JSON.parse(readFileSync(join(root, 'server', 'fixtures', 'demo-inputs.json'), 'utf8'));
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
    const target = join(root, 'server', 'fixtures', `demo-cache-${d.id}.json`);
    writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${data.matches?.length ?? 0} 条案例`);
  }
}

const cache = JSON.parse(readFileSync(fixture, 'utf8'));

const header = `/**
 * 离线兜底数据（T5 集成）
 * ============================================
 * 由 server/fixtures/demo-cache-1.json 生成，**不要手改**。
 * 重新生成：npm run build:cache
 *
 * 为什么打包进前端：方案验收清单要求「断网/API 错误时有缓存的 Demo 数据，
 * 保证上台可演示」。演示当天网络不可控，这一层不能省。
 */

import type { RetrievalResponse, Situation } from '../types/episode';

/** 演示问题 1（要不要转专业）的完整检索结果快照 */
export const demoCache: {
  situation?: Situation;
  retrieval?: RetrievalResponse;
} = `;

writeFileSync(out, `${header}${JSON.stringify({ situation: cache.situation, retrieval: cache }, null, 2)};\n`, 'utf8');

console.log(`✅ 已生成 src/data/demoCache.ts`);
console.log(`   案例 ${cache.matches?.length ?? 0} 条，反类比 ${(cache.matches ?? []).reduce((n, m) => n + (m.why_different?.length ?? 0), 0)} 条`);

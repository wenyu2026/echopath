/**
 * 人工核查清单生成器
 * ============================================
 * 用法：npm run review:sheet
 *
 * 输出：data/REVIEW-CHECKLIST.md
 *
 * 为什么做这个：
 *   data/REVIEW.md 写着「人类审核尚未完成」，这是项目最大的剩余风险。
 *   但「去审一下来源」这种任务太模糊了 —— 没人知道从哪开始、什么时候算完。
 *
 *   这个脚本把 37 条来源 / 63 条 claim 摊成一张可打勾的表：
 *     · 每条来源给出链接、机构、支撑的 claim
 *     · 留出「已核 / 有出入 / 打不开」三栏
 *     · 标出已知打不开或需人工确认的（从 check:sources 的结果来）
 *   人只需要照着点、照着打勾，工作量和进度都可量化。
 *
 * ⚠️ 工具只能生成清单，**不能替人判断「claim 是否被来源支持」**。
 *    这一步必须人读原文，脚本不假装能做。
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const sources = JSON.parse(readFileSync(join(root, 'data', 'sources.json'), 'utf8'));
const srcList = Array.isArray(sources) ? sources : sources.sources;
const episodes = JSON.parse(readFileSync(join(root, 'data', 'episodes.json'), 'utf8'));
const epList = Array.isArray(episodes) ? episodes : episodes.episodes;

/** source_id → 它支撑的 (人物, claim) 列表 */
const supported = new Map();
for (const e of epList) {
  for (const ev of e.evidence ?? []) {
    if (ev.type === 'ai_inference') continue; // AI 推断不需要外部来源
    if (!supported.has(ev.source_id)) supported.set(ev.source_id, []);
    supported.get(ev.source_id).push({
      person: e.person?.name ?? '（未知人物）',
      episodeId: e.episode_id,
      claim: ev.claim,
    });
  }
}

/** 已知无法自动核查的（与 check-sources.mjs 的 KNOWN_BOT_WALLS 保持一致） */
const BOT_WALLED = new Set([
  'investors.zoom.us',
  'news.stanford.edu',
  'www.princeton.edu',
  'www.inc.com',
  'www.dyson.com',
  'www.blackstone.com',
]);
const hostOf = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
};

const reviewed = [];
const unreviewed = [];
for (const s of srcList) {
  if (s.type === 'ai_inference') continue;
  (s.locator || s.url ? reviewed : unreviewed).push(s);
}

const totalSources = srcList.filter((s) => s.type !== 'ai_inference').length;
const totalClaims = [...supported.values()].reduce((n, v) => n + v.length, 0);

const lines = [];
lines.push('# 来源人工核查清单');
lines.push('');
lines.push('> **这份文件是给人用的，不是给 AI 用的。**');
lines.push('> 生成命令：`npm run review:sheet`　｜　每次改数据后重新生成。');
lines.push('');
lines.push('## 怎么用');
lines.push('');
lines.push('1. 从上往下逐条点开链接');
lines.push('2. 对照「这条来源支撑的 claim」，判断**原文是否真的支持这句话**');
lines.push('3. 在每条的 `结论` 行里改成下面三个之一：');
lines.push('   - `- [x] 已核` —— 原文确实支持');
lines.push('   - `- [!] 有出入` —— 原文和 claim 对不上（**必须在下面写清出入在哪**）');
lines.push('   - `- [~] 打不开` —— 链接失效或需要特殊访问');
lines.push('4. 全部核完后，把 `data/REVIEW.md` 顶部的「人类审核尚未完成」改成实际状态');
lines.push('');
lines.push(`## 进度`);
lines.push('');
lines.push(`- 需要核查的来源：**${totalSources}** 条（不含 AI 推断类）`);
lines.push(`- 这些来源支撑的 claim：**${totalClaims}** 条`);
lines.push(`- 平均每条来源 ${(totalClaims / Math.max(totalSources, 1)).toFixed(1)} 条 claim`);
lines.push('');
lines.push('> ⚠️ 自动工具只能查「链接能不能打开」（`npm run check:sources`）。');
lines.push('> **「原文是否支持这句话」只能人读** —— 这份清单就是为了让那一步尽量快。');
lines.push('');
lines.push('---');
lines.push('');

let idx = 0;
for (const s of srcList) {
  if (s.type === 'ai_inference') continue;
  idx++;
  const claims = supported.get(s.source_id) ?? [];
  const host = hostOf(s.url);
  const walled = BOT_WALLED.has(host);

  lines.push(`### ${idx}. \`${s.source_id}\`　${s.title ?? '（无标题）'}`);
  lines.push('');
  lines.push(`- **机构**：${s.publisher ?? '（未填）'}`);
  lines.push(`- **链接**：${s.url ? `<${s.url}>` : '⚠️ **这条没有链接**'}`);
  if (walled) {
    lines.push(`- **⚠️ 自动工具打不开**：该域名有反爬，必须用普通浏览器点一次`);
  }
  lines.push(`- **文献定位**：${s.locator ?? '（未填）'}`);
  lines.push(`- **已知局限**：${s.limitations ?? '（未填）'}`);
  lines.push('');
  if (claims.length === 0) {
    lines.push('**这条来源目前没有被任何 evidence 引用** —— 可能是历史遗留，可考虑删除。');
  } else {
    lines.push(`**这条来源支撑的 claim（${claims.length} 条）：**`);
    lines.push('');
    for (const c of claims) {
      lines.push(`- [ ] 「${c.claim}」　*（${c.person} / ${c.episodeId}）*`);
    }
  }
  lines.push('');
  lines.push('```');
  lines.push('# 结论（改成下面之一，并写清理由）');
  lines.push('#   - [x] 已核 —— 原文确实支持');
  lines.push('#   - [!] 有出入 —— 出入在哪：');
  lines.push('#   - [~] 打不开 —— 情况：');
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('');
}

lines.push('## 核完之后');
lines.push('');
lines.push('把这份文件里的打勾情况汇总到 `data/REVIEW.md`，并更新那句');
lines.push('「人类审核尚未完成」。二者的关系：');
lines.push('');
lines.push('- `data/REVIEW.md` —— 审查**结论**与整体判断（给人看的状态）');
lines.push('- `data/REVIEW-CHECKLIST.md` —— 逐条的**工作底稿**（给人用的表格）');
lines.push('');

const out = join(root, 'data', 'REVIEW-CHECKLIST.md');
writeFileSync(out, lines.join('\n'), 'utf8');

console.log('');
console.log('  ✅ 已生成 data/REVIEW-CHECKLIST.md');
console.log(`     ${totalSources} 条来源，${totalClaims} 条 claim 待人工核查`);
console.log('');
console.log('  ⚠️ 这个脚本只生成清单。');
console.log('     「原文是否支持这句话」必须人读 —— 工具不假装能做。');
console.log('');

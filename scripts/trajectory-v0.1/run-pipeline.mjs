#!/usr/bin/env node
/**
 * 运行单卡制作流水线（校验 → 时间审计 → 导出视图 → 更新 manifest）：
 *   node scripts/trajectory-v0.1/run-pipeline.mjs data/trajectory-v0.1/cards/lu-xun.card.json
 * 选项：
 *   --force     忽略已有检查点，从头重跑
 *   --fail-at <stage>  在指定阶段前注入失败（仅测试用：load/validate/export/write/manifest）
 * 中断恢复：重跑同一命令即可从最近成功阶段继续；相同输入产生相同导出。
 */
import { runPipeline } from './lib/pipeline.mjs';

const args = process.argv.slice(2);
const cardPath = args.find((a) => !a.startsWith('--'));
const failAtIdx = args.indexOf('--fail-at');
const failAt = failAtIdx >= 0 ? args[failAtIdx + 1] : undefined;
const force = args.includes('--force');

if (!cardPath) {
  console.error('用法: node scripts/trajectory-v0.1/run-pipeline.mjs <card.json> [--force] [--fail-at <stage>]');
  process.exit(2);
}

try {
  const out = runPipeline(cardPath, process.cwd(), { failAt, force });
  console.log(`OK 卡 ${out.card_id} 流水线完成`);
  console.log(`  统计: ${JSON.stringify(out.stats)}`);
  console.log(`  视图: ${out.views_file}`);
  console.log(`  时间审计: ${out.audit_file}`);
  if (out.warnings?.length) {
    console.log('  Warnings:');
    for (const w of out.warnings) console.log(`   - ${w.message}`);
  }
} catch (e) {
  console.error(`FAILED: ${e.message}`);
  process.exit(1);
}

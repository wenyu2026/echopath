#!/usr/bin/env node
/**
 * 校验一张 PersonCard（离线，无依赖）：
 *   node scripts/trajectory-v0.1/validate-card.mjs data/trajectory-v0.1/cards/lu-xun.card.json
 * 退出码：0=通过（可能有 warning），1=存在 error。
 * 机器校验通过不代表人工审核；人工状态见卡内 review.human_review。
 */
import { validateCardFile, formatResult } from './lib/validate.mjs';

const target = process.argv[2];
if (!target) {
  console.error('用法: node scripts/trajectory-v0.1/validate-card.mjs <card.json>');
  process.exit(2);
}
try {
  const { card, ...result } = validateCardFile(target);
  console.log(formatResult(result, card.card_id ?? target));
  process.exit(result.errors.length > 0 ? 1 : 0);
} catch (e) {
  console.error(`无法校验 ${target}: ${e.message}`);
  process.exit(2);
}

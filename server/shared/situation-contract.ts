/**
 * Situation 运行时校验 —— 字段约束与 .agent/DecisionEpisode-Schema.md 第 1 节一一对应。
 *
 * 为什么不用 json_schema 保证一切：实测坑 4 —— 严格模式能锁类型和枚举，
 * 锁不住长度（dilemma 可能输出整段话）。所以网关侧 schema + 本地长度校验双保险，
 * 校验失败触发一次带错误反馈的重试，仍失败则显式报错。
 */
import type { Situation } from '../../src/types/episode.ts';

export interface ValidationIssue {
  field: string;
  message: string;
}

const LEVELS = ['low', 'medium', 'high'] as const;

export function validateSituation(value: unknown): { ok: true; situation: Situation } | { ok: false; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  if (typeof value !== 'object' || value === null) {
    return { ok: false, issues: [{ field: '(root)', message: '不是对象' }] };
  }
  const v = value as Record<string, unknown>;

  if (typeof v.stage !== 'string' || !v.stage.trim()) issues.push({ field: 'stage', message: '缺失或非字符串' });
  else if (v.stage.length > 12) issues.push({ field: 'stage', message: `超过 12 字（${(v.stage as string).length}）` });

  if (typeof v.dilemma !== 'string' || !v.dilemma.trim()) {
    issues.push({ field: 'dilemma', message: '缺失或非字符串' });
  } else {
    if (v.dilemma.length > 18) issues.push({ field: 'dilemma', message: `超过 18 字（${(v.dilemma as string).length}）` });
    if (!v.dilemma.includes(' vs ')) issues.push({ field: 'dilemma', message: '不符合 "A vs B" 形式' });
  }

  checkStringArray(v.options, 'options', 2, 5, 12, issues);
  checkStringArray(v.constraints, 'constraints', 2, 6, 14, issues);
  checkStringArray(v.goals, 'goals', 2, 5, 10, issues);
  checkStringArray(v.unknowns, 'unknowns', 2, 6, 18, issues);

  for (const f of ['risk', 'reversibility'] as const) {
    if (!LEVELS.includes(v[f] as (typeof LEVELS)[number])) {
      issues.push({ field: f, message: `必须是 low/medium/high，实际 ${(v[f] as string)?.slice(0, 20) ?? String(v[f])}` });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, situation: v as unknown as Situation };
}

function checkStringArray(arr: unknown, field: string, min: number, max: number, maxLen: number, issues: ValidationIssue[]): void {
  if (!Array.isArray(arr)) {
    issues.push({ field, message: '必须是字符串数组' });
    return;
  }
  if (arr.length < min || arr.length > max) {
    issues.push({ field, message: `应有 ${min}-${max} 项，实际 ${arr.length} 项` });
  }
  arr.forEach((item, i) => {
    if (typeof item !== 'string' || !item.trim()) issues.push({ field: `${field}[${i}]`, message: '必须是非空字符串' });
    else if (item.length > maxLen) issues.push({ field: `${field}[${i}]`, message: `超过 ${maxLen} 字（${item.length}）：${item.slice(0, 15)}…` });
  });
}

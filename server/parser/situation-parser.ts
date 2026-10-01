/**
 * Situation Parser —— 用户自然语言 → 结构化 Situation。
 *
 * 配置遵循 .agent/DecisionEpisode-Schema.md 第 5 节（已实测）：
 * glm-5 + reasoning_effort:'none' + json_schema strict。
 * 校验失败时带错误反馈重试一次；仍失败则抛错（不静默放行，避免下游渲染崩）。
 */
import type { Situation } from '../../src/types/episode.ts';
import { chatCompletions, type GatewayConfig } from '../shared/gateway.ts';
import { validateSituation } from '../shared/situation-contract.ts';

export const SITUATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    stage: { type: 'string', description: '人生阶段，不超过12字' },
    dilemma: { type: 'string', description: '必须 A vs B 形式，不超过18字' },
    options: { type: 'array', items: { type: 'string' }, description: '2-5项，每项不超过12字' },
    constraints: { type: 'array', items: { type: 'string' }, description: '2-6项，每项不超过14字' },
    goals: { type: 'array', items: { type: 'string' }, description: '2-5项，每项不超过10字' },
    risk: { type: 'string', enum: ['low', 'medium', 'high'] },
    reversibility: { type: 'string', enum: ['low', 'medium', 'high'] },
    unknowns: { type: 'array', items: { type: 'string' }, description: '2-6项，每项不超过18字' },
  },
  required: ['stage', 'dilemma', 'options', 'constraints', 'goals', 'risk', 'reversibility', 'unknowns'],
  additionalProperties: false,
} as const;

export const SITUATION_SYSTEM_PROMPT = `你是「处境结构化解析器」。把用户的处境转成严格 JSON。

字段长度硬约束：
- stage: 不超过 12 字
- dilemma: 必须是 "A vs B" 形式，不超过 18 字
- options: 2-5 项，每项不超过 12 字
- constraints: 2-6 项，每项不超过 14 字
- goals: 2-5 项，每项不超过 10 字
- risk / reversibility: 只能是 low / medium / high
- unknowns: 2-6 项，每项不超过 18 字

所有字段值必须精炼，禁止写完整句子或解释性文字。
用户没有提到的信息不要编造，放进 unknowns。

示例（严格照此风格）：
{
  "stage": "大二/大三",
  "dilemma": "坚持本专业 vs 转向新方向",
  "options": ["继续读完", "申请转专业", "辅修双学位"],
  "constraints": ["已投入两年", "转专业有成绩门槛"],
  "goals": ["做感兴趣的事", "减少内耗"],
  "risk": "medium",
  "reversibility": "medium",
  "unknowns": ["新方向能力匹配度", "转专业成功率"]
}`;

/** 剥掉模型偶尔加的 ```json 围栏，提取首个平衡的 JSON 对象 */
export function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  if (start === -1) throw new Error('输出中未找到 JSON 对象');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(candidate.slice(start, i + 1));
    }
  }
  throw new Error('JSON 对象未闭合');
}

export interface ParseResult {
  situation: Situation;
  elapsedMs: number;
  totalTokens: number;
  attempts: number;
}

export async function parseSituation(config: GatewayConfig, rawInput: string): Promise<ParseResult> {
  let lastIssues: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const userContent =
      attempt === 1
        ? rawInput
        : `${rawInput}\n\n注意：你上一次的输出违反了字段约束，具体问题：\n${lastIssues.map((s) => `- ${s}`).join('\n')}\n请严格按约束重新输出。`;
    const result = await chatCompletions(config, {
      model: 'glm-5',
      reasoning_effort: 'none',
      max_tokens: 800,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'situation', strict: true, schema: SITUATION_JSON_SCHEMA },
      },
      messages: [
        { role: 'system', content: SITUATION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });
    const parsed = extractJsonObject(result.content);
    const check = validateSituation(parsed);
    if (check.ok) {
      return { situation: check.situation, elapsedMs: result.elapsedMs, totalTokens: result.totalTokens, attempts: attempt };
    }
    lastIssues = check.issues.map((i) => `${i.field}: ${i.message}`);
    console.error(`[parser] 第 ${attempt} 次输出未通过校验: ${lastIssues.join('; ')}`);
  }
  throw new Error(`Situation Parser 两次输出均未通过校验: ${lastIssues.join('; ')}`);
}

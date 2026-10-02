/**
 * 访谈引擎 —— 决定「下一个该问什么」
 * ============================================
 * 这是对话式产品的核心。它要解决一个问题：
 *
 *   用户说「我大三学材料，觉得不适合自己」——
 *   **这句话的信息量几乎为零**。真正决定匹配结果的是：
 *     他怕的是什么？在意的什么？已经试过什么？
 *   而这些只能**问出来**。
 *
 * ⚠️ 为什么不用固定问卷
 *   固定问卷会问大量与当前决策无关的信息。
 *   同样说「我想转专业」的两个人，该被问的第 3 题完全不同 ——
 *   这才是「AI 在起作用」的证明。
 *
 * ⚠️ 但也不用「让模型自由发挥」
 *   实测过：让模型自由决定问什么，它会来回问同几个方向，而且问不到要害。
 *   所以用**可解释的启发式**决定「问哪个字段」，
 *   模型只负责「把这个字段问得自然」。
 *
 *   这与方案第 264 节的原则一致：
 *     「Interview Agent 不是会聊天，而是知道下一题值得问什么」
 */

import type { GatewayConfig } from '../shared/gateway.ts';
import { chatCompletions } from '../shared/gateway.ts';
import { FIELDS, INTERVIEW_CONFIG, type FieldSpec } from '../../src/types/interview.ts';

/* ============================================================
   访谈状态
   ============================================================ */

/** 一条对话消息 */
export interface Turn {
  role: 'ai' | 'user';
  text: string;
}

/** 已采集到的信息（键 → 值） */
export type Collected = Record<string, string>;

export interface InterviewState {
  turns: Turn[];
  collected: Collected;
  /** 每个字段的置信度 0-1 */
  confidence: Record<string, number>;
  /** 问过哪些字段（避免重复问） */
  asked: string[];
}

export function newInterviewState(): InterviewState {
  return { turns: [], collected: {}, confidence: {}, asked: [] };
}

/* ============================================================
   决定下一个问什么
   ============================================================ */

// ⚠️ 不要在这里再定义 INTERVIEW_CONFIG —— 它已经在 src/types/interview.ts 里，
//    那是前后端共用的规格文件。这里只 import，不重复定义（重复会直接 SyntaxError）。

/**
 * 算某个字段「还值不值得问」。
 *
 * 公式：Priority = (1 − Confidence) × Relevance ÷ Burden
 *
 * ⚠️ 用除法而不是减法来惩罚高负担：
 *   负担是乘法效应 —— 一个很难答的问题，即使很重要，
 *   如果连续问两个，用户会跑掉。除法让负担的影响更陡。
 *
 * ⚠️ 关于「问过还要不要再问」——第一版这里是错的。
 *
 *   第一版：`if (state.asked.includes(f.key)) return 0;`
 *   实测踩到：问了 goals「你图它什么」，用户答的却是 fear
 *   （「我最怕的是选错了方向…」）。抽取器只抽用户真说了的，所以 goals 空着。
 *   但系统把 goals 记成「已问过」，**再也不问了** —— 最后 goals 完全没采集到。
 *
 *   教训：**问了 ≠ 答了**。
 *   修法：允许重问，但重问要**打折**（最多再问一次），
 *   因为反复问同一个字段比漏掉更烦人。
 */
const MAX_ASKS_PER_FIELD = 2;

export function priorityOf(f: FieldSpec, state: InterviewState): number {
  if (!f.askable) return 0;

  const askCount = state.asked.filter((k) => k === f.key).length;
  if (askCount >= MAX_ASKS_PER_FIELD) return 0;

  const conf = state.confidence[f.key] ?? 0;
  // 如果已经问过一次但没抽到东西，说明这个问法没问出来 —— 换个角度重问，
  // 但要打折（×0.6），避免它一直缠着同一个点不放。
  const repeatPenalty = askCount === 1 ? 0.6 : 1;

  return ((1 - conf) * f.relevance * repeatPenalty) / Math.max(f.burden, 0.05);
}

/** 挑出下一个最值得问的字段 */
export function nextField(state: InterviewState): FieldSpec | null {
  const scored = FIELDS.map((f) => ({ f, p: priorityOf(f, state) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p);
  return scored[0]?.f ?? null;
}

/** 这个字段是不是「重问」（要换一种问法） */
export function isReAsk(state: InterviewState, key: string): boolean {
  return state.asked.includes(key);
}

/** 算出「已采集信息的平均置信度」（只算重要字段） */
export function averageConfidence(state: InterviewState): number {
  const important = FIELDS.filter((f) => f.relevance >= 0.8);
  if (important.length === 0) return 0;
  const sum = important.reduce((s, f) => s + (state.confidence[f.key] ?? 0), 0);
  return sum / important.length;
}

/** 现在该不该停止追问了 */
export function shouldStop(state: InterviewState): { stop: boolean; reason: string } {
  const askedCount = state.asked.length;

  if (askedCount >= INTERVIEW_CONFIG.max_questions) {
    return { stop: true, reason: 'reached_max' };
  }

  if (askedCount < INTERVIEW_CONFIG.min_questions) {
    return { stop: false, reason: 'below_min' };
  }

  const avg = averageConfidence(state);
  const top = FIELDS.map((f) => priorityOf(f, state)).reduce((a, b) => Math.max(a, b), 0);

  if (avg >= INTERVIEW_CONFIG.confidence_threshold && top < INTERVIEW_CONFIG.priority_threshold * 4) {
    return { stop: true, reason: 'enough_info' };
  }

  // 没有可问的字段了（都问过或都不可问）
  if (nextField(state) === null) {
    return { stop: true, reason: 'no_more_fields' };
  }

  return { stop: false, reason: 'continue' };
}

/* ============================================================
   让模型把字段问得自然
   ============================================================ */

const ASK_SYSTEM_PROMPT = `你在做一次**人生决策访谈**。你的任务不是给建议，而是把对方的处境问清楚。

⚠️ 最重要的原则：
- **一次只问一个问题**。
- 语气像朋友聊天，不像问卷。不要用「请描述」「请说明」这种公文腔。
- 可以先用半句话回应他刚才说的（表示你在听），再问下一句。
- 不要评论他的选择好不好，不要给建议，不要说「我理解你的感受」这种空话。
- 总长度不超过 60 字。

⚠️ 追问的方向由系统指定（见「这一轮要问清楚什么」），
   你要做的是把这个方向**问得自然**，而不是自己换一个方向问。
   如果对方上一条回答很含糊，可以就着那个含糊点追问，但不要偏离指定方向。

⚠️ 特别注意：如果对方说「我很迷茫」「不知道怎么办」这类空话，
   不要接受它当作回答 —— 要追问出**具体**在什么之间纠结。`;

export interface AskResult {
  question: string;
  field: string;
  elapsedMs: number;
}

/** 生成下一个问题 */
export async function askNextQuestion(
  config: GatewayConfig,
  state: InterviewState,
): Promise<AskResult | null> {
  const field = nextField(state);
  if (field === null) return null;

  const history = state.turns
    .slice(-6) // 只带最近 6 条，省 token 也避免模型被早期内容带偏
    .map((t) => `${t.role === 'ai' ? '你' : '对方'}：${t.text}`)
    .join('\n');

  const known = FIELDS.filter((f) => state.collected[f.key])
    .map((f) => `- ${f.label}：${state.collected[f.key]}`)
    .join('\n');

  // ⚠️ 重问时必须换角度，否则用户会觉得「你刚才不是问过了吗」
  const reAskNote = isReAsk(state, field.key)
    ? `\n⚠️ 这个方向你之前问过一次，但对方没正面回答。\n   这次**必须换一个角度问** —— 从具体的例子、场景或对比切入，不要重复上次的问法。`
    : '';

  const userContent = [
    history ? `【刚才的对话】\n${history}` : '【刚才的对话】\n（还没有开始，这是第一个问题）',
    '',
    known ? `【已经了解到的】\n${known}` : '【已经了解到的】\n（还没有）',
    '',
    `【这一轮要问清楚什么】${field.label}`,
    `【具体的追问意图】${field.intent}${reAskNote}`,
    '',
    '请输出你的下一句话（只输出这句话本身，不要加引号）。',
  ].join('\n');

  const t0 = Date.now();
  const result = await chatCompletions(config, {
    model: process.env.INTERVIEW_MODEL ?? 'deepseek-v4.1-flash',
    reasoning_effort: 'none',
    max_tokens: 200,
    temperature: 0.7,
    messages: [
      { role: 'system', content: ASK_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const question = result.content.trim().replace(/^["「『]|["」』]$/g, '');
  if (!question) return null;

  return { question, field: field.key, elapsedMs: Date.now() - t0 };
}

/* ============================================================
   从用户的回答里抽取结构化信息
   ============================================================ */

const EXTRACT_SCHEMA = {
  name: 'extract',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      updates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            /** 提炼后的一句话（不是原话照抄，要压缩） */
            value: { type: 'string' },
            confidence: { type: 'number' },
          },
          required: ['field', 'value', 'confidence'],
          additionalProperties: false,
        },
      },
      /** 用户这条回答里，有没有值得原样保留的「他本人的话」 */
      memorable_quote: { type: 'string' },
    },
    required: ['updates', 'memorable_quote'],
    additionalProperties: false,
  },
};

const EXTRACT_SYSTEM_PROMPT = `你在从用户的一段回答里抽取结构化信息。

⚠️ 只抽取他**真的说了**的内容，不要推断、不要补全。
   如果这一轮他什么都没透露，updates 就返回空数组。

⚠️ confidence 要诚实：
   他明确直说的 → 0.9-1.0
   话里有暗示、需要理解 → 0.5-0.7
   只是沾边 → 0.3 以下

⚠️ value 要**压缩成短语**（不超过 20 字），不要照抄整句。
   比如他说「我其实不太怕晚毕业，多读一年也没关系，我最怕的是选错了方向，
   再过几年才发现还是不喜欢」→
     fear: 「再浪费几年才发现方向还是不对」（confidence 0.95）
     reversibility_attitude: 「可以接受延毕」（confidence 0.9）

⚠️ memorable_quote：如果他的话里有一句**特别能体现他在意什么**的句子，
   原样摘出来（保留他的措辞）。没有就用空字符串。`;

export interface ExtractResult {
  updates: Array<{ field: string; value: string; confidence: number }>;
  memorable_quote: string;
  elapsedMs: number;
}

/** 从用户回答里抽取结构化信息 */
export async function extractFromAnswer(
  config: GatewayConfig,
  _state: InterviewState,
  answer: string,
  askedField: string,
): Promise<ExtractResult> {
  const fieldList = FIELDS.map((f) => `${f.key}（${f.label}）`).join('、');

  const userContent = [
    `【刚才问的方向】${askedField}`,
    `【用户的回答】${answer}`,
    '',
    `【可用的字段】${fieldList}`,
  ].join('\n');

  const t0 = Date.now();
  const result = await chatCompletions(config, {
    model: process.env.EXTRACT_MODEL ?? 'deepseek-v4.1-flash',
    reasoning_effort: 'none',
    max_tokens: 500,
    temperature: 0,
    response_format: { type: 'json_schema', json_schema: EXTRACT_SCHEMA },
    messages: [
      { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const parsed = JSON.parse(result.content) as {
    updates: Array<{ field: string; value: string; confidence: number }>;
    memorable_quote: string;
  };

  const validKeys = new Set(FIELDS.map((f) => f.key));
  return {
    updates: (parsed.updates ?? []).filter((u) => validKeys.has(u.field)),
    memorable_quote: parsed.memorable_quote ?? '',
    elapsedMs: Date.now() - t0,
  };
}

/* ============================================================
   把访谈采到的自然语言映射到封闭词表的根因素
   ============================================================ */

const FACTOR_SCHEMA = {
  name: 'factors',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      root_factors: { type: 'array', items: { type: 'string' } },
    },
    required: ['root_factors'],
    additionalProperties: false,
  },
};

const FACTOR_SYSTEM_PROMPT = `你在把一段自然语言的处境描述，映射到**固定的根因素词表**上。

⚠️ 必须严格从这个词表里选，不要写近义词、不要自己造词：
  沉没成本 / 转换成本 / 新路径验证不足 / 长期方向匹配 / 再次选错风险 /
  时间窗口 / 经济压力 / 家庭约束 / 制度约束 / 身份绑定 / 机会成本 / 社会支持

⚠️ 选 **3-5 个**，不要全选。

⚠️ 选那些**这次处境里真正起作用的张力**，而不是「这个人整体上具有的属性」。
   反面例子：「长期方向匹配」—— 任何人生决策都关乎长期方向。
   问自己：如果把这个因素去掉，这次处境的**性质**会变吗？不会变就不要选。

⚠️ 要能从描述里找到依据。找不到依据的因素不要选。`;

/**
 * 从访谈采集到的字段推出根因素。
 *
 * ⚠️ 为什么必须用 LLM 而不是关键词匹配
 *   访谈采到的是自然语言（「家人希望稳定就业，不支持折腾」），
 *   而根因素是封闭词表（「家庭约束」）。
 *   两者之间的映射**不是词面关系** ——
 *   「不支持折腾」「家里希望考编」「父母觉得不稳定」都该映射到「家庭约束」，
 *   关键词表列不全，换个说法就漏。
 *
 * ⚠️ 这一步不能省。
 *   省了的话 root_factors 是空的 → 聚类失去结构信号 →
 *   「AI 对你的理解」那一栏也是空的，用户看不到自己的处境被抽象成了什么。
 *   （实测踩过：对话走完全程，结果页的根因素区是空的。）
 */
export async function inferRootFactors(
  config: GatewayConfig,
  state: InterviewState,
): Promise<{ root_factors: string[]; elapsedMs: number }> {
  /**
   * ⚠️ 两种输入都要支持：
   *   ① 访谈采到的结构化字段（key 在 FIELDS 里）
   *   ② 一段自由文本（key 不在 FIELDS 里，比如 profile_text）
   *   第一版只认 ①，结果从检索侧传自由文本时**推出来是空的**。
   */
  const knownKeys = new Set(FIELDS.map((f) => f.key));
  const lines = Object.entries(state.collected)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => {
      const label = knownKeys.has(k) ? (FIELDS.find((f) => f.key === k)?.label ?? k) : '';
      return label ? `${label}：${v}` : String(v);
    });

  const known = lines.join('\n');
  if (!known.trim()) return { root_factors: [], elapsedMs: 0 };

  const t0 = Date.now();
  const result = await chatCompletions(config, {
    model: process.env.FACTOR_MODEL ?? 'deepseek-v4.1-flash',
    reasoning_effort: 'none',
    max_tokens: 300,
    temperature: 0,
    response_format: { type: 'json_schema', json_schema: FACTOR_SCHEMA },
    messages: [
      { role: 'system', content: FACTOR_SYSTEM_PROMPT },
      { role: 'user', content: known },
    ],
  });

  const parsed = JSON.parse(result.content) as { root_factors: string[] };
  return { root_factors: parsed.root_factors ?? [], elapsedMs: Date.now() - t0 };
}

/* ============================================================
   总结
   ============================================================ */

const SUMMARY_SYSTEM_PROMPT = `你在把一次访谈的收获讲回给用户听，**让他确认你理解得对不对**。

要求：
- 用「我理解下来」这样的口吻，不要用「根据您的描述」。
- 先讲**迷茫点**（他到底在什么之间纠结），再讲约束和他在意的。
- 2-4 句话，不超过 120 字。
- 最后必须以一句确认收尾，比如「我理解得对吗？」「哪里不对你直接改」。
- ⚠️ 不要给建议，不要评价他的选择。
- ⚠️ 不要编造他没说过的内容。没问到的就不提。`;

export interface SummaryResult {
  summary: string;
  elapsedMs: number;
}

export async function summarize(
  config: GatewayConfig,
  state: InterviewState,
): Promise<SummaryResult> {
  const known = FIELDS.filter((f) => state.collected[f.key])
    .map((f) => `${f.label}：${state.collected[f.key]}`)
    .join('\n');

  const t0 = Date.now();
  const result = await chatCompletions(config, {
    model: process.env.SUMMARY_MODEL ?? 'deepseek-v4.1-flash',
    reasoning_effort: 'none',
    max_tokens: 300,
    temperature: 0.4,
    messages: [
      { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: `【访谈收集到的内容】\n${known}` },
    ],
  });

  return { summary: result.content.trim(), elapsedMs: Date.now() - t0 };
}

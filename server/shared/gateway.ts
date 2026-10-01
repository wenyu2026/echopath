/**
 * TokenDance 网关客户端 —— 所有 AI 调用的唯一出口。
 *
 * 已实测的硬规则（见 .agent/DecisionEpisode-Schema.md 第 4-5 节）：
 * - glm-5 必须带 reasoning_effort:'none'，否则 22.7s（加了约 3-6s）
 * - 结构化输出必须用 json_schema strict，不能用 json_object
 * - 禁用 glm-5.3-flash（content 为空，输出全在 reasoning_content）
 */

export interface GatewayConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatPayload {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  reasoning_effort?: 'none' | 'low' | 'medium' | 'high';
  response_format?: {
    type: 'json_schema';
    json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
  };
  temperature?: number;
}

export interface ChatResult {
  content: string;
  totalTokens: number;
  elapsedMs: number;
  model: string;
}

export class GatewayError extends Error {
  status: number | undefined;
  body: string | undefined;

  constructor(message: string, status: number | undefined, body: string | undefined) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.body = body;
  }
}

export async function chatCompletions(config: GatewayConfig, payload: ChatPayload): Promise<ChatResult> {
  const baseUrl = config.baseUrl ?? 'https://tokendance.space/gateway/v1';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      throw new GatewayError(`网关返回 HTTP ${res.status}`, res.status, body);
    }
    const data = (await res.json()) as {
      model?: string;
      usage?: { total_tokens?: number };
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) {
      // 实测坑 2：glm-5.3-flash 会返回空 content，必须在服务端显式失败而不是把空串传下去
      throw new GatewayError('网关返回了空 content（检查模型名是否为 glm-5.3-flash 等已知问题模型）', res.status, JSON.stringify(data).slice(0, 500));
    }
    return {
      content,
      totalTokens: data.usage?.total_tokens ?? 0,
      elapsedMs: Date.now() - t0,
      model: data.model ?? payload.model,
    };
  } catch (e) {
    if (e instanceof GatewayError) throw e;
    if ((e as Error).name === 'AbortError') throw new GatewayError(`网关调用超时（>${config.timeoutMs ?? 30_000}ms）`, undefined, undefined);
    throw new GatewayError(`网关调用失败: ${(e as Error).message}`, undefined, undefined);
  } finally {
    clearTimeout(timer);
  }
}

export async function embeddings(config: GatewayConfig, model: string, input: string[]): Promise<{ vectors: number[][]; elapsedMs: number }> {
  const baseUrl = config.baseUrl ?? 'https://tokendance.space/gateway/v1';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => undefined);
      throw new GatewayError(`embedding 网关返回 HTTP ${res.status}`, res.status, body);
    }
    const data = (await res.json()) as { data?: { embedding: number[] }[] };
    const vectors = (data.data ?? []).map((d) => d.embedding);
    if (vectors.length !== input.length) {
      throw new GatewayError(`embedding 返回数量不匹配：请求 ${input.length}，返回 ${vectors.length}`, undefined, undefined);
    }
    return { vectors, elapsedMs: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

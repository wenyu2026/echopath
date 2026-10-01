/**
 * 技术栈对比原型 —— Node 版（零依赖，node --env-file=.env server/_bench/proto-node.mjs）
 * 调用配置照抄 .agent/DecisionEpisode-Schema.md 第 5 节（已实测验证）。
 */
const GATEWAY = 'https://tokendance.space/gateway/v1';
const KEY = process.env.TOKENDANCE_API_KEY;
if (!KEY) { console.error('NO KEY'); process.exit(1); }

const DEMO_INPUT = `我已经学了这个专业两年，但越来越觉得不适合自己。我对另一个方向很感兴趣，但现在换是不是太晚？
补充信息：已投入两年；新方向只了解两个月；可以接受延毕；家庭期望别太高；最看重兴趣与成长。`;

const SYSTEM_PROMPT = `你是「处境结构化解析器」。把用户的处境转成严格 JSON。
字段长度硬约束：stage ≤12字；dilemma 必须 "A vs B" 形式 ≤18字；options 2-5项每项≤12字；
constraints 2-6项每项≤14字；goals 2-5项每项≤10字；risk/reversibility 只能 low/medium/high；
unknowns 2-6项每项≤18字。所有字段值必须精炼，禁止写完整句子。`;

const situationSchema = {
  type: 'object',
  properties: {
    stage: { type: 'string' },
    dilemma: { type: 'string', description: '必须 A vs B 形式，不超过18字' },
    options: { type: 'array', items: { type: 'string' } },
    constraints: { type: 'array', items: { type: 'string' } },
    goals: { type: 'array', items: { type: 'string' } },
    risk: { type: 'string', enum: ['low', 'medium', 'high'] },
    reversibility: { type: 'string', enum: ['low', 'medium', 'high'] },
    unknowns: { type: 'array', items: { type: 'string' } },
  },
  required: ['stage', 'dilemma', 'options', 'constraints', 'goals', 'risk', 'reversibility', 'unknowns'],
  additionalProperties: false,
};

async function parseSituation() {
  const t0 = Date.now();
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'glm-5',
      reasoning_effort: 'none',
      max_tokens: 800,
      response_format: { type: 'json_schema', json_schema: { name: 'situation', strict: true, schema: situationSchema } },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: DEMO_INPUT },
      ],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const elapsed = Date.now() - t0;
  const content = data.choices?.[0]?.message?.content ?? '';
  return { elapsed, content, usage: data.usage };
}

for (let i = 1; i <= 3; i++) {
  try {
    const { elapsed, content, usage } = await parseSituation();
    console.log(`--- run ${i}: ${elapsed}ms, total_tokens=${usage?.total_tokens} ---`);
    console.log(content);
  } catch (e) {
    console.error(`run ${i} FAILED:`, e.message);
  }
}

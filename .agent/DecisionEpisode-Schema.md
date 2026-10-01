# Decision Episode Schema 与字段规范

> **本文件是数据与 AI 两端的唯一契约。**
> 数据（B）按它造案例，AI（C）按它做抽取与检索，前端（D）按它渲染。
> 最后更新：2026-10-02　｜　**全部参数已实测验证**

---

## 0. 两套 Schema，别搞混

| | 用户侧 | 案例侧 |
|---|---|---|
| 名称 | **Situation**（当前处境） | **Decision Episode**（决策事件） |
| 来源 | 用户输入，AI 抽取 | 人工整理的历史/真实案例 |
| 数量 | 每次 1 个 | 库里有 36–60 个 |
| 作用 | 被拿去和案例库匹配 | 被检索出来展示 |

**匹配就是：拿 1 个 Situation，去 36–60 个 Episode 里找最像的 3 个。**

---

## 1. Situation Schema（用户侧）

```json
{
  "stage": "大二/大三",
  "dilemma": "坚持本专业 vs 转向新方向",
  "options": ["继续读完", "申请转专业", "辅修双学位", "跨专业考研"],
  "constraints": ["已投入两年", "转专业有成绩门槛", "可能延毕", "家庭期望"],
  "goals": ["做感兴趣的事", "减少内耗", "顺利毕业"],
  "risk": "medium",
  "reversibility": "medium",
  "unknowns": ["新方向的能力匹配度", "转专业成功率", "新方向就业前景"]
}
```

### 字段约束（**必须遵守，否则前端渲染会崩**）

| 字段 | 类型 | 约束 |
|---|---|---|
| `stage` | string | ≤ 12 字 |
| `dilemma` | string | **必须 "A vs B" 形式**，≤ 18 字 |
| `options` | string[] | 2–5 项，每项 ≤ 12 字 |
| `constraints` | string[] | 2–6 项，每项 ≤ 14 字 |
| `goals` | string[] | 2–5 项，每项 ≤ 10 字 |
| `risk` | enum | **只能** `low` / `medium` / `high` |
| `reversibility` | enum | **只能** `low` / `medium` / `high` |
| `unknowns` | string[] | 2–6 项，每项 ≤ 18 字 |

---

## 2. Episode Schema（案例侧）

```json
{
  "episode_id": "lu_xun_1904_medicine_to_literature",
  "person": {
    "name": "鲁迅",
    "birth_year": 1881,
    "tags": ["文学", "转向", "青年"]
  },
  "time": {
    "year": 1904,
    "age": 23,
    "stage": "留学期间"
  },
  "prior_path": [
    "已在矿路学堂毕业",
    "公费赴日学医两年",
    "目睹国人精神麻木"
  ],
  "decision_state": {
    "dilemma": "继续学医 vs 转向文艺",
    "options": ["继续学医", "弃医从文", "先完成学业再转"],
    "constraints": ["公费留学身份", "家庭期望", "时代环境"],
    "goals": ["改变国民精神", "找到真正价值"],
    "risk": "high",
    "reversibility": "low"
  },
  "choice": {
    "type": "direct_switch",
    "actions": ["放弃医学", "开始翻译与写作"]
  },
  "outcomes": {
    "short_term": "失去医学文凭，经济拮据",
    "mid_term": "进入新文化阵营，站稳脚跟",
    "long_term": "成为中国现代文学奠基人"
  },
  "reflection": {
    "self_comment": "本人后来的评价（有出处才写）",
    "unknowns": ["当时具体心理活动无直接记录"]
  },
  "evidence": [
    {"source_id": "S1", "type": "biography", "claim": "1904 年决定弃医从文"},
    {"source_id": "S2", "type": "self_writing", "claim": "《呐喊》自序中的自述"}
  ],
  "retrieval_tags": ["沉没成本", "换方向", "高不确定性", "理想驱动"]
}
```

### `choice.type` 枚举（**多样性选择器靠它**）

| 值 | 含义 |
|---|---|
| `persist` | 坚持原路 |
| `direct_switch` | 直接转向 |
| `explore_then_switch` | 先试探再转向 |
| `explore_then_persist` | 试探后确认留下 |
| `abandon` | 放弃/退出 |
| `dual_track` | 双轨并行 |

> ⚠️ **多样性硬要求**：返回的 3 个案例中，`choice.type` **至少覆盖 2 种不同值**。
> 这是 Demo 验收清单里明确要求的。

### `evidence.type` 枚举（**证据分层靠它**）

| 值 | 含义 | 可信度 |
|---|---|---|
| `self_writing` | 本人日记/书信/自述 | 最高（但可能有自我包装） |
| `biography` | 权威传记/学术研究 | 高 |
| `interview` | 公开演讲/访谈 | 中高 |
| `encyclopedia` | 百科/公共数据库 | 中（细节不足） |
| `ai_inference` | AI 推断 | ⚠️ **必须标注，不能当史实** |

> 🚫 **铁律**：`ai_inference` 的内容**绝不允许**和史实混在一起输出。
> 方案第 13 节要求「事实、解释、未知分层」。

---

## 3. 七个匹配维度（检索的核心）

**不要输出「相似度 87%」**，要输出维度卡。

| 维度 | 含义 | MVP 实现 |
|---|---|---|
| `stage_match` | 年龄/教育/职业阶段 | metadata filter |
| `path_match` | 来时路（投入、失败、转换次数） | LLM + embedding |
| `dilemma_match` | 困境结构（坚持/转向、稳定/冒险） | 标签 + embedding |
| `constraint_match` | 时间、经济、家庭、地域 | 结构字段加权 |
| `goal_match` | 真正在意的是兴趣/收益/影响力/稳定 | LLM 抽取 |
| `reversibility_match` | 选择能否撤回 | 规则字段 |
| `difference_penalty` | 时代/制度/资源差异太大时**降权** | Counter-analogy |

### 前端展示形式（建议）

```
阶段相似      ████████░░  高
来时路相似    ███████░░░  高
困境结构      █████████░  高
约束条件      ███░░░░░░░  低
目标相似      ████████░░  高
可逆性        ██████░░░░  中
⚠️ 差异惩罚    █████████░  时代背景显著不同
```

**最后一行自然引出「为什么不能照搬」** —— 这是产品的核心记忆点。

---

## 4. 🔴 实测踩过的坑（务必避开）

### 坑 1：默认推理链会让延迟暴涨 3.7 倍

| 配置 | 耗时 | 推理 token |
|---|---|---|
| `glm-5` 默认 | **22.7s** | 1384 |
| `glm-5` + `reasoning_effort: "none"` | **6.0s** | 0 ✅ |

**必须在请求里加 `reasoning_effort: "none"`**，否则演示时会卡到 20 秒以上。

> 实测平均 6.0s，最慢 6.6s（要求 <30s，余量充足）。

### 坑 2：`glm-5.3-flash` 的 content 是空的

实测：22.3s，`content=0字`，2235 字全跑进 `reasoning_content`。

**看起来像成功，实际拿到空字符串。** 如果用它，前端会显示空白。

**别用这个模型做结构化抽取。**

### 坑 3：`response_format: json_object` 只保证语法，不保证符合 Schema

实测发现模型会自作主张：

| 字段 | 期望 | 实际 |
|---|---|---|
| `risk` | `"medium"` | ❌ 一长句话 |
| `options` | `["坚持","转向"]` | ❌ 变成带 `pros`/`cons` 的对象数组 |
| `constraints[3]` | 正常 | ❌ 引号嵌套把内容搞坏 |

**必须用 `json_schema` 严格模式**（见下）。

### 坑 4：严格模式仍管不住「啰嗦」

`json_schema` 能锁住**类型和枚举**（`risk` 正确返回 `"low"`），但**锁不住长度** ——
`dilemma` 仍可能输出一整段话而不是「A vs B」。

**应对**：在 schema 的 `description` 里写死约束，并在 system prompt 里给**示例**。

---

## 5. ✅ 验证过的调用配置（照抄即可）

### Situation Parser

```javascript
const res = await fetch('https://tokendance.space/gateway/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.TOKENDANCE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'glm-5',
    reasoning_effort: 'none',          // ⚠️ 关键：不加会慢 3.7 倍
    max_tokens: 800,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'situation',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            stage:         { type: 'string' },
            dilemma:       { type: 'string', description: '必须 A vs B 形式，不超过18字' },
            options:       { type: 'array', items: { type: 'string' } },
            constraints:   { type: 'array', items: { type: 'string' } },
            goals:         { type: 'array', items: { type: 'string' } },
            risk:          { type: 'string', enum: ['low', 'medium', 'high'] },
            reversibility: { type: 'string', enum: ['low', 'medium', 'high'] },
            unknowns:      { type: 'array', items: { type: 'string' } },
          },
          required: ['stage','dilemma','options','constraints','goals','risk','reversibility','unknowns'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userInput },
    ],
  }),
});
```

### System Prompt（建议版本）

```
你是「处境结构化解析器」。把用户的处境转成严格 JSON。

字段长度硬约束：
- stage: 不超过 12 字
- dilemma: 必须是 "A vs B" 形式，不超过 18 字
- options: 2-5 项，每项不超过 12 字
- constraints: 2-6 项，每项不超过 14 字
- goals: 2-5 项，每项不超过 10 字
- risk / reversibility: 只能是 low / medium / high
- unknowns: 2-6 项，每项不超过 18 字

所有字段值必须精炼，禁止写完整句子或解释性文字。

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
}
```

### Embedding（向量召回）

```javascript
POST https://tokendance.space/gateway/v1/embeddings
{
  "model": "qwen3.7-text-embedding",
  "input": ["待编码文本"]
}
```

- ✅ 实测：**1024 维，0.4 秒**
- 用量：约 32 tokens / 句

---

## 6. ⚡ MVP 简化：不需要向量库

方案里写了 Chroma / pgvector，但**数据只有 36–60 条**：

```
36 条 × 1024 维 × 4 字节 ≈ 147 KB
```

**直接放内存里算余弦相似度即可**，一次全量比较 < 1ms。

**省掉**：向量库、索引构建、服务部署。
**保留**：embedding API（负责把文本变向量）。

> 这是 MVP 阶段最值得做的一处简化。等数据上千条再考虑向量库。

---

## 7. 数据质量红线（B 角色必读）

| 红线 | 说明 |
|---|---|
| **不许只选成功者** | 必须覆盖「坚持但长期受损」「转向后并不适合」等 |
| **每个关键事实绑 source_id** | 抽查时能追溯 |
| **AI 推断必须标注** | 用 `ai_inference`，不许伪装成史实 |
| **未知要写进 unknowns** | 不确定的东西明确标出来，比编造强 |
| **宁少勿滥** | 40 条扎实 > 1000 条自动切碎的片段 |

---

## 相关文档

- 原始方案：[`EchoPath方案-原文提取.md`](EchoPath方案-原文提取.md)
- AI 接入：[`AI接入方案.md`](AI接入方案.md)
- 协作规则：[`../AGENTS.md`](../AGENTS.md)

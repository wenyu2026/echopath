# AI 接入方案 —— TokenDance

> 所有 AI 功能统一走 TokenDance 网关。本文是**唯一**的 AI 接入依据。
> 最后更新：2026-10-01　｜　已实测验证：Key 有效、文本可用、视觉可用

---

## 1. 接入参数（照抄即可）

| 项目 | 值 |
|---|---|
| **Base URL** | `https://tokendance.space/gateway/v1` |
| **对话端点** | `POST /gateway/v1/chat/completions` |
| **模型目录** | `GET https://tokendance.space/gateway/v1/models`（**无需鉴权**） |
| **鉴权头** | `Authorization: Bearer <TOKENDANCE_API_KEY>` |
| **兼容性** | ✅ 兼容 OpenAI SDK（改 baseURL 即可） |

### 环境变量

```bash
TOKENDANCE_API_KEY=sk-xxxxxxxx
```

**⚠️ 不要硬编码到源码里。**

---

## 2. 快速接入（OpenAI SDK）

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TOKENDANCE_API_KEY,
  baseURL: 'https://tokendance.space/gateway/v1',
});

const res = await client.chat.completions.create({
  model: 'glm-5',
  messages: [{ role: 'user', content: '你好' }],
});
console.log(res.choices[0].message.content);
```

```python
from openai import OpenAI
client = OpenAI(api_key=os.environ["TOKENDANCE_API_KEY"],
                base_url="https://tokendance.space/gateway/v1")
```

### ⚠️ Windows 调试注意

**Windows PowerShell 里用 `curl` 传 JSON 会丢引号**（实测踩过：模型名被传空，报 `模型不存在: ""`）。

**用 Node/Python SDK 不会有这个问题。** 如果非要用 curl 调试，把 JSON 写进文件再用 `--data-binary "@file.json"`。

---

## 3. 模型选型表

> 全部来自实时目录 `GET /gateway/v1/models`（共 107 个模型）。
> **以实时结果为准，不要根据模型名猜能力。**

| 用途 | 推荐模型 ID | 上下文 | 说明 |
|---|---|---|---|
| **题目/试卷识别** | `qwen3-vl-plus` | 256K | 视觉最强，图片直接输入 ✅ 已实测 |
| **文档结构化解析** | `glm-ocr` | 128K | PDF/图片 → 结构化 Markdown，0.9B |
| **文字定位提取** | `qwen3.5-ocr` | 64K | 专攻文本定位、关键信息抽取 |
| **知识点归类** | `glm-5` | 200K | ✅ 已实测，带推理链 |
| **生成同类新题** | `qwen3.7-max` | **1M** | 长题目不吃力 |
| **快速轻量任务** | `glm-5.3-flash` | **1M** | 便宜快速 |
| **知识点语义检索** | `qwen3.7-text-embedding` | — | `openai:embeddings` 协议 |
| **联网搜题/教材** | `bocha:web-search` | — | 内置搜索，不用自己实现 |

### 已实测确认可用的模型

| 模型 | 实测结果 |
|---|---|
| `glm-5` | ✅ 正常，返回含 `reasoning_content` 推理链 |
| `qwen3-vl-plus` | ✅ 1.2s 识别图片文字 |

---

## 4. 🔥 架构建议：错题本的三段式

```
用户拍照上传
     ↓
【第 1 段】识别       qwen3-vl-plus  →  题目文字
     ↓
【第 2 段】归类       glm-5          →  知识点标签（结构化 JSON）
     ↓
【第 3 段】出题       qwen3.7-max    →  同知识点新题
```

### 建议改用结构化输出

归类那一步**不要让模型自由发挥**，要求它输出固定 JSON：

```javascript
const res = await client.chat.completions.create({
  model: 'glm-5',
  messages: [{
    role: 'system',
    content: '你是数学题知识点分类器。只输出 JSON，不要任何解释文字。'
  }, {
    role: 'user',
    content: `把这道题归类，输出格式：
{"subject":"数学","topic":"一元一次方程","difficulty":2,"knowledge_points":["移项","合并同类项"]}

题目：${questionText}`
  }],
});
```

**理由**：自由文本没法直接入库，前端也没法渲染。**结构化输出是这类应用能不能跑通的关键。**

### 分层建议

| 层 | 职责 | 调用什么 |
|---|---|---|
| 前端 | 上传、展示、错题本 UI | 不直接调 AI |
| 后端 | 转发、存库、拼提示词 | **持有 API Key** |
| AI 层 | 识别 / 归类 / 出题 | 三个函数，各自独立可测 |

**⚠️ 前端绝对不要直接调 TokenDance** —— Key 会暴露在浏览器里。

---

## 5. ⚠️ 数学识别的已知风险

**实测发现**：图里写的 `(a+b)^2`，模型识别成 `(a + b) × 2` —— **上标丢失**。

**这不是 TokenDance 的问题，是所有视觉模型的共性难点。** 应对方式：

| 做法 | 说明 |
|---|---|
| **提示词里明确要求** | "数学公式请用 LaTeX 输出，注意上下标" |
| **让模型自检** | 第二遍问它"这道题里有没有指数/分数/根号？" |
| **保留原图** | 前端同时显示原图和识别结果，让用户能核对 |
| **允许人工修正** | 识别结果可编辑，改完再入库 |

**建议**：识别结果**默认展示给用户确认**，而不是直接入库。这既解决准确性问题，也是产品体验的一部分。

---

## 6. 🔒 安全规范（重要）

| 规则 | 说明 |
|---|---|
| 🚫 **Key 绝不进仓库** | `.env` 已被 `.gitignore` 挡住，**但别用 `git add -f` 绕过** |
| 🚫 **前端不许有 Key** | 浏览器里的一切都能被看到 |
| 🚫 **不要贴到聊天/截图/Issue** | 一旦泄露，**立刻去控制台吊销重建** |
| ✅ **用环境变量** | `process.env.TOKENDANCE_API_KEY` |
| ✅ **提供 `.env.example`** | 只写变量名，不写值 |

### 提交前自检

```bash
git diff --cached | grep -i "sk-"      # 有输出 = 你泄漏了 Key，立刻撤回
```

---

## 7. 网络：TokenDance 不走代理

**实测对比：**

| 目标 | 直连 | 走 Clash 代理 |
|---|---|---|
| `tokendance.space` | ✅ **1.0s** | ✅ 1.1s |
| `github.com` | ❌ 超时 | ✅ 必须走 |

**结论：**

```
GitHub      → 必须走 Clash 代理
TokenDance  → 直连即可，不要套代理
```

**如果队友习惯性给所有请求加代理，TokenDance 反而可能变慢。** 不需要。

---

## 8. 额度与异常处理

| 情况 | 处理 |
|---|---|
| **余额不足** | 引导充值后重试；TokenDance 会返回 `TokenDance-Recovery-Action` 响应头 |
| **鉴权失败 401** | Key 错误或已吊销 → 重新创建 |
| **模型不存在** | 模型 ID 拼错 → 查 `GET /gateway/v1/models` |
| **限流 429** | 参考 [rate-limits 文档](https://tokendance.space/docs/rate-limits)，做退避重试 |
| **首选模型不可用** | 有[模型降级](https://tokendance.space/docs/model-fallbacks)机制，可配备选 |

**建议**：所有 AI 调用都包一层 try/catch + 重试，**别让一次 API 失败搞挂整个页面**。

---

## 9. 参考文档

| 文档 | 地址 |
|---|---|
| 文档索引 | https://tokendance.space/llms.txt |
| 完整文档 | https://tokendance.space/llms-full.txt |
| 多协议总览 | https://tokendance.space/docs/multi-protocol.md |
| 快速开始 | https://tokendance.space/docs/quickstart.md |
| API Key 管理 | https://tokendance.space/docs/api-keys.md |
| 限流 | https://tokendance.space/docs/rate-limits.md |
| 模型降级 | https://tokendance.space/docs/model-fallbacks.md |
| 供应商路由 | https://tokendance.space/docs/provider-routing.md |

**模型能力以实时目录为准**：
```bash
curl https://tokendance.space/gateway/v1/models
```

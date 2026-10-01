# 来路 EchoPath

> 学军黑客松 2026 · 赛道一 Echo · 未来·回响
>
> **用 AI 帮你找到「和你走到过相似人生节点的人」，提前看见他们不同选择后走向了哪里。**

---

## 一句话说清

**不是预测你的未来，而是把别人已经走过的未来提前给你看。**

用户不是来问「我该不该转专业」，而是来理解：像我这样的人，曾经有人坚持、有人转向、
有人先试探再转向；这些选择分别付出了什么代价、带来了什么可能结果，我能不能接受。

**产品最终服务的不是「答案」，而是「认知地图」。**

---

## ⚠️ 这不是聊天机器人（评委最会挑战的点）

| # | 机制 | 和聊天机器人的区别 |
|---|---|---|
| 1 | **检索单位是「决策事件」，不是「人物」** | 不模拟「鲁迅会怎么说」，而是检索「某人 23 岁那次具体选择」 |
| 2 | **结构化匹配，不是文本相似** | 7 个维度打分，不是「语义像」 |
| 3 | **强制反类比** | 主动说「**为什么你不能照搬**」 |
| 4 | **证据分层** | 史实/本人表述/后人解释/AI 类比/**未知** 分层 |
| 5 | **多分叉** | 不给一个答案，给不同选择方向的真实后果 |

**第 3 条是最强记忆点** —— 聊天机器人永远不会主动说「你不能照搬」。

---

## 快速开始

```bash
# 1. 克隆（私有仓库，需要权限）
git clone git@github.com:wenyu2026/xuejun-hackathon.git
cd xuejun-hackathon

# 2. 装依赖（已配腾讯云源，约 45 秒）
npm install

# 3. 配置环境变量
copy .env.example .env      # Windows
# 然后编辑 .env，填入 TOKENDANCE_API_KEY（向队长索取）

# 4. 启动
npm run dev                 # 打开 http://localhost:5173
```

---

## ⚠️ 本赛场的两个特殊约束

### 1. GitHub 必须走代理

直连 GitHub 不通（实测卡 75 秒后失败）。**必须先配**：

```bash
git config --global http.https://github.com.proxy http://127.0.0.1:7890
```

### 2. TokenDance 不要走代理

实测：直连 1.0s，走代理 1.1s。**它不需要代理。**

---

## 任务分工（4 人 + 集成）

| Issue | 角色 | 内容 | 负责人 |
|---|---|---|---|
| **#13** | **B 数据** | Decision Episode 数据集（**关键路径**） | fu6868 |
| **#14** | **C AI/后端** | Situation Parser + 检索链路 | Damn4lee |
| **#15** | **C AI/后端** | 反类比 + 证据分层 | Damn4lee |
| **#16** | **D 前端** | 六页面 + 人生分叉地图 | bo200712 |
| **#17** | **A 产品/集成** | Demo 剧本 + 全链路 + 兜底 | wenyu2026 |

**⚠️ #13 是最大的瓶颈** —— 没有数据，前端再漂亮、AI 再花哨，演示都是空的。

---

## 项目结构

```
├── src/
│   ├── types/episode.ts      # 🔴 类型契约（前后端共用，已定稿）
│   ├── pages/                # P1–P6 六页面（#16）
│   ├── components/           # 组件（#16）
│   └── ai/                   # AI 模块
├── server/                   # 后端（#14 #15）
│   ├── parser/               # Situation Parser
│   ├── retrieval/            # 向量召回 + 结构重排
│   ├── counter-analogy/      # 反类比
│   └── evidence/             # 证据分层
├── data/                     # Decision Episode 数据集（#13）
│   └── episodes.json
├── scripts/                  # 协作工具
└── .agent/                   # 协作元数据
    ├── DecisionEpisode-Schema.md   # 🔴 数据契约（必读）
    ├── EchoPath方案-原文提取.md     # 原始方案
    ├── AI接入方案.md               # TokenDance 接入
    ├── 队友必读.md                 # 完整上手
    └── claims/                     # 责任区（一人一份）
```

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（5173） |
| `npm run build` | 构建（含 TS 类型检查） |
| `npm run lint` | 代码检查 |
| `.\scripts\status.ps1` | 看全队进度 |

---

## 🔴 技术要点（已实测，照抄即可）

### 调用 LLM 必须加 `reasoning_effort: 'none'`

| 配置 | 耗时 |
|---|---|
| `glm-5` 默认 | **22.7s** |
| `glm-5` + `reasoning_effort:'none'` | **6.0s** ✅ |

**不加会在演示时卡 20 秒以上。**

### 必须用 `json_schema` 严格模式

`response_format: json_object` **只保证语法合法，不保证符合 Schema**
（实测 `risk` 会返回长句子而不是 `"medium"`）。

### 不需要向量库

数据只有 36–60 条，直接内存算余弦相似度（<1ms）。省掉 Chroma/pgvector。

**详细参数与踩坑记录**：[`.agent/DecisionEpisode-Schema.md`](.agent/DecisionEpisode-Schema.md)

---

## AI 模型选型（已实测）

| 用途 | 模型 | 实测 |
|---|---|---|
| 处境结构化 | `glm-5` + `reasoning_effort:none` | ✅ 6.0s，8 字段齐全 |
| 向量召回 | `qwen3.7-text-embedding` | ✅ 1024 维，0.4s |
| 备选快速模型 | `deepseek-v4-flash` | ✅ 6.3s |

**⚠️ 别用 `glm-5.3-flash`** —— 实测 content 为空，输出全跑 reasoning 里。

---

## 协作必读

**开工前必须完整读 [`AGENTS.md`](AGENTS.md)** —— 全队唯一事实来源。

三条铁律：
1. **锁文件只有一个人能提交**（集成者）
2. **说"完成"之前必须查 Issue**
3. **AI 不许 merge，人点头才合**

**数据与 AI 的契约**：[`.agent/DecisionEpisode-Schema.md`](.agent/DecisionEpisode-Schema.md)

---

## 🔒 安全

- 🚫 `.env` **绝不提交**（`.gitignore` 已挡）
- 🚫 API Key 不许硬编码、不许贴 Issue、不许放前端
- ✅ 提交前自检：`git diff --cached | findstr "sk-"`

---

## 遇到问题

| 现象 | 解决 |
|---|---|
| 打不开 github.com | 配代理 |
| `Repository not found` | 私有仓库 + 没带身份 → 用 SSH 或自己的 token |
| `curl 35` / 超时 | 网络抖动，**直接重跑** |
| 中文乱码 | PowerShell 加 `-Encoding UTF8` |
| LLM 响应很慢（20s+） | 检查有没有加 `reasoning_effort:'none'` |

**完整排错手册**：[`.agent/队友必读.md`](.agent/队友必读.md) 第 9 节

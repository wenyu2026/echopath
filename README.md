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

# 4. 一条命令拉起前后端
npm start                   # 打开 http://localhost:5173
```

**上台前先跑一次自检**（30 秒，给明确的「可以上台 / 阻塞项」）：

```bash
npm run preflight
```

> ⚠️ 只跑 `npm run dev` 会**只启前端、不带后端**，接口全部走离线兜底。
> 演示请用 `npm start`。

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

## 任务分工（4 人 + 集成）—— 五张任务卡已全部完成合并

| Issue | 角色 | 内容 | 负责人 | 状态 |
|---|---|---|---|---|
| **#13** | **B 数据** | Decision Episode 数据集 | fu6868 | ✅ 已合并（PR #19） |
| **#14** | **C AI/后端** | Situation Parser + 检索链路 | Damn4lee | ✅ 已合并 |
| **#15** | **C AI/后端** | 反类比 + 证据分层 | Damn4lee | ✅ 已合并 |
| **#16** | **D 前端** | 六页面 + 人生分叉地图 | bo200712 | ✅ 已合并 |
| **#17** | **A 产品/集成** | Demo 剧本 + 全链路 + 兜底 | wenyu2026 | ✅ 已合并（PR #23） |

> 数据集起步时 #13 是最大的瓶颈 —— 现在它仍然是质量上限：数据规模与来源审查见 `data/README.md`。

---

## 项目结构

```
├── src/
│   ├── types/episode.ts      # 🔴 类型契约（前后端共用，已定稿）
│   ├── pages/                # P1–P6 六页面（#16）
│   ├── components/           # 组件（#16）
│   ├── state/AppState.tsx    # 全局状态（含离线降级、sessionStorage 恢复）
│   └── data/demoCache.ts     # 三个演示场景的离线兜底快照
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

### 演示 / 日常

| 命令 | 作用 |
|---|---|
| **`npm start`** | **一条命令拉起前后端**（后端 :3000 + 前端 :5173）—— 演示用这个 |
| **`npm run preflight`** | **上台前自检**（20 项，约 2 分钟），给明确的「可以上台 / 阻塞项」 |
| **`npm run smoke`** | **前端冒烟**（真实 Chrome 打开 8 条路由，验证真的渲染出来了、控制台无报错） |
| **`npm run smoke:offline`** | **断网兜底验证**（造一个接口必然失败的实例，验「拔网线也能演示」是不是真的） |
| **`npm run demo:verify`** | **决策地形可行性验证**（验「换数据源、同一套引擎」是否成立） |
| **`npm run tag:mechanisms`** | 给案例打「决策机制」标签（离线跑，产出进 git） |
| `npm run dev` | 只启前端（5173）。**不带后端**，接口会走离线兜底 |
| `npm run server` | 只启后端（3000） |
| `npm run build` | 构建（含 TS 类型检查） |
| `npm test` | 后端单测（71 项，全部离线，不需要密钥） |
| `npm run lint` | 代码检查 |

### 数据与验证

| 命令 | 作用 |
|---|---|
| `npm run validate:data` | 校验 `data/episodes.json` 的结构与来源引用 |
| **`npm run check:sources`** | **来源链接体检** —— 查 37 条来源的链接是否还能打开 |
| **`npm run review:sheet`** | 生成**人工核查清单**（`data/REVIEW-CHECKLIST.md`），把"去审来源"变成可打勾的表格 |
| `npm run refresh:cache` | 重新生成离线兜底快照（需后端在跑） |
| `npm run build:cache` | 用现有 fixture 生成快照（不请求后端） |
| `.\scripts\status.ps1` | 看全队进度 |

> **改完 `data/` 或 `server/` 里的检索/反类比逻辑，记得跑 `npm run refresh:cache`** ——
> 否则离线快照会和实时结果不一致，`npm run preflight` 会报出来。

---

## 演示相关的两个关键设计

### What-if：证明「结构匹配而非文本匹配」

P5 底部可以「改一个条件，看匹配怎么变」。这不是玩具 —— 它是**证明匹配发生在结构层**的唯一硬手段：

> 文本相似度**不会**因为你「假设我不怕延毕」而改变；结构匹配**会**。

实测：同一段输入文字，改一个约束条件 → 选出来的三个人整个换了。

**它刻意不走离线降级**：降级返回固定快照，「改条件→结果变化」就成了假的。

### 离线兜底：拔网线也能演示

三个演示场景的快照打包进前端。断网或接口失败时自动降级，
顶部显示黄色「离线演示模式」横幅，并**明确说明这不是实时计算结果**。

`pickScenario()` 会按用户实际填写的内容挑最接近的那份快照 ——
否则演示场景 2 时显示场景 1 的数据，输入和结果对不上，比没有数据更糟。

**离线模式无法演示 What-if**（它需要实时重算），此时会明说而不是假装。

---

## 🔴 技术要点（已实测，照抄即可）

### 调用 LLM 必须加 `reasoning_effort: 'none'`

| 配置 | 耗时 |
|---|---|
| `glm-5` 默认 | **22.7s** |
| `glm-5` + `reasoning_effort:'none'` | **6.0s** ✅ |

**不加会在演示时卡 20 秒以上。**

### 解析模型已换成 `deepseek-v4.1-flash`

同一提示词 + `json_schema`，三个演示场景各跑 3 轮（共 9 次）：

| 模型 | 成功 | 平均 | 中位 | 最慢 |
|---|---|---|---|---|
| `glm-5` | 9/9 | 4.1s | 4.0s | 5.4s |
| **`deepseek-v4.1-flash`** | **9/9** | **2.3s** | **2.2s** | **2.8s** |

解析占了整条链路 **87%** 的等待（检索只要 0.16–0.4s），所以这 1.8 秒直接决定体感。

**可回退**：`SITUATION_MODEL=glm-5 npm run server`

**实测不可用的模型**（别重复试）：`glm-5.3-flashx`（关不掉思考）、`glm-4.5-air`（只支持 stream）、
`glm-5.3` / `step-3.7-flash`（空 content）、`qwen3.5-flash`（要求提示词含 "json"）、`minimax-m3`（14.4s + 非法 JSON）

### 必须用 `json_schema` 严格模式

`response_format: json_object` **只保证语法合法，不保证符合 Schema**
（实测 `risk` 会返回长句子而不是 `"medium"`）。

### 不需要向量库

数据只有 36–60 条，直接内存算余弦相似度（<1ms）。省掉 Chroma/pgvector。

### embedding 接口单次批量上限 20 条

实测 36 条会被拒：`batch size is invalid, it should not be larger than 20`。
`server/embedding/embed.ts` 已做分批 —— **别再改回一次性全发**。

**详细参数与踩坑记录**：[`.agent/DecisionEpisode-Schema.md`](.agent/DecisionEpisode-Schema.md)

---

## AI 模型选型（已实测）

| 用途 | 模型 | 实测 |
|---|---|---|
| 处境结构化（**默认**） | `deepseek-v4.1-flash` | ✅ 2.3s，9/9 成功（见上文对比） |
| 处境结构化（回退） | `SITUATION_MODEL=glm-5` + `reasoning_effort:none` | ✅ 6.0s，8 字段齐全 |
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

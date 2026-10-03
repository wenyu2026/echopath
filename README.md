# EchoPath · 来路

> 让前人的来路，成为后来者看向未来的回响。

「人生决策参考」产品：AI 访谈把你的处境讲清楚 → 在真实人物/校友数据里找出**结构相似的人**，看他们实际走了哪些路 → 深读真实案例（严格区分「当时知道」和「后来发生」，逐人说明"为什么给你看他"）→ 回到自己，形成一份可撤回的下一步验证计划。

**不是预测你的未来，而是让你看见别人已经走过的未来。**

---

## 快速开始（Windows）

**唯一前提：装 Node.js 24**（或 ≥ 23.6）。没装就去 https://nodejs.org 下 LTS 版，一路下一步。
**不需要 `npm install`** —— 这个项目运行时零第三方依赖。

### 第 1 步：克隆仓库

```bat
git clone https://github.com/wenyu2026/echopath.git
cd echopath
```

也可以直接点 GitHub 页面右上角 **Code → Download ZIP** 解压。

### 第 2 步：配置 Key（⚠️ 克隆下来没有 .env，必须手动建一次）

仓库里**不含** `.env`（密钥不入库）。请自己创建一份：

```bat
copy .env.example .env
```

然后用记事本打开 `.env`，把这一行填上你的 Key：

```
TOKENDANCE_API_KEY=你的Key
```

Key 在 https://tokendance.space/keys 创建（**创建后只显示一次**，记得立刻保存）。

> **没有 Key 也能跑完整流程**：后端会正常启动，访谈会提示"未配 Key"，
> 但「后端连接设置 → 用示例处境看决策地形 → 案例深读」这条链路完全可用，
> 除访谈外的所有页面都能体验。想直接体验就跳过本步。
>
> 说明：不填 Key 时，如果你手写的处境**没带根因素**，地形会是空的
> （根因素要靠模型从自然语言推断）。从「后端连接设置 → 用示例处境」进去是
> 带根因素的，能看到完整地形。填上 Key 则任意处境都能正常分析。

### 第 3 步：启动后端

**双击仓库根目录的 `start-backend.bat`**（注意：在**根目录**，不是子文件夹）。

看到这样的输出就成功了 —— **不要关这个黑窗口**：

```
[api] EchoPath 检索链路已启动: http://localhost:3100（key_configured=true）
[api] 案例索引就绪：36 条
[api] 预热完成：36 条案例已就绪，可以开始演示
```

### 第 4 步：启动前端

**双击 `frontend\start-frontend.bat`** —— 会自动打开浏览器 http://localhost:7200/

想停掉：把两个黑窗口关掉（或按 Ctrl+C）。

> **顺序很重要**：先开后端，再开前端。前端只是个静态服务器，它把 `/api/*` 转发到后端的 3100。

---

## Mac / Linux

在**仓库根目录**开两个终端：

```bash
# 窗口一：后端
PORT=3100 node --env-file=.env server/api.ts

# 窗口二：前端
cd frontend && ECHOPATH_API=http://localhost:3100 node server.mjs --port 7200
```

> 若还没建 `.env`，把窗口一改成（用空环境跑，跳过 Key）：
> `PORT=3100 node server/api.ts`

---

## 🔑 关于 AI Key

- AI 功能（访谈、根因素推断、案例标注）走 **TokenDance 网关**，默认模型 `deepseek-v4.1-flash`。
- **AI 调用消耗的是你自己 Key 的额度**。跑挂了多半是额度用尽（网关返回 HTTP 402）。
- 想换模型：在 `.env` 里设 `INTERVIEW_MODEL` / `EXTRACT_MODEL` / `SUMMARY_MODEL` 等（留空则用默认）。

---

## 里面有什么

| 目录 | 是什么 |
|---|---|
| `server/` | 后端（Node/TypeScript，零运行时依赖）：访谈引擎（带追问纪律）、决策地形 v2（人找人 → 因素聚类）、案例深读、动态回忆入口 |
| `data/` | 数据 = **36 条历史人物轨迹 + 20 条脱敏校友**，含 schema 校验与来源审查清单 |
| `frontend/` | 六页产品界面（纯 HTML/CSS/JS，零依赖），含 API 调试台、导出导入 |
| `scripts/` | 数据校验、来源可达性检查、验收脚本 |
| `design-docs/` | 设计共识、逐轮交接记录 |
| `src/` | 前端类型定义（`src/types/**` 被后端引用）+ 早期 React 版界面（保留，未使用） |

### 产品能力

- **访谈引导**：说"迷茫/不适合"会被追问到具体的事（不跳话题）；说"不知道"会降难度给回忆入口、可跳过；一次讲多件事一轮抽全、不重复问；说错可纠正；「帮我回忆」按你的语境动态出题
- **来路图**：主路径只放经历与转折，约束/目标/担忧是旁注；点节点看自己的原话、就地纠正；未定的未来画成空心问号
- **决策地形**：每条分支都标明来历（"匹配到 N 位和你根因素相近的人，其中 M 位走了这条"）；悬停预览 / 点击固定选中 / 键盘可达
- **真实案例**：每个人名下标注「与你的共同因素」；详情页逐人回答"为什么给你看他 / 你俩像在哪 / 不像在哪（不能照搬）/ 可以借鉴什么 / 还有什么不知道"；时间边界、证据分层、来源可展开
- **回到自己**：四步行动记录（回看→取舍→未知→可编辑行动卡），保存到浏览器本地、刷新不丢
- **分享**：便签底部「导出记录」把整次探索存成 JSON 发给别人，对方「导入」即可看到你的完整来路

---

## 验收命令（可选，跑访谈类检查需要 Key 有额度）

确认后端已在 3100 运行后：

```bat
REM 全链路冒烟：9 项（访谈 start/answer/finish → 数据源 → 决策地形 → 案例深读）
cd frontend
node smoke-test.mjs http://localhost:3100

REM 访谈引导四场景：迷茫追问 / 不知道救援 / 大信息量 / 纠正
cd ..\scripts
node test-interview-guidance.mjs http://localhost:3100
```

两个脚本**退出码 0 = 全过**。

---

## 常见问题

| 现象 | 处理 |
|---|---|
| `node: .env: not found` | 克隆下来没有 `.env`，执行 `copy .env.example .env`（见第 2 步） |
| 双击 `start-backend.bat` 找不到 | 它在**仓库根目录**，不在子文件夹里 |
| 端口被占用（EADDRINUSE） | 换端口：改 `start-backend.bat` 和 `frontend\start-frontend.bat` 里的 3100/7200 为别的数字（两处要一致） |
| 浏览器能开但访谈说"没配 Key" | `.env` 的 Key 为空或失效，填一条新 Key 后重启后端 |
| 访谈提示"AI 额度用完了（HTTP 402）" | Key 额度耗尽，换 Key 或充值 |
| 页面打不开 http://localhost:7200 | 前端的黑窗口还开着吗？**先开后端再开前端** |
| 页面能开但提示"后端没在听" | 后端没起来，或端口不是 3100。检查后端的黑窗口 |
| Node 版本报错 | 需要 Node ≥ 23.6（推荐 24）：https://nodejs.org |

---

## 接口一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 存活 + Key 配置状态 |
| POST | `/api/interview/start` · `answer` · `finish` | 无状态访谈；`answer` 带 `mode`（追问/救援）与 `hints` |
| POST | `/api/interview/hints` | 「帮我回忆」动态入口 |
| GET | `/api/sources` | 数据源列表 |
| POST | `/api/landscape` | 决策地形（请求体 `situation` + `source_id`；含每条分支的聚类来历） |
| POST | `/api/case` | 案例深读（含 `mechanism` 因素标注，供页面回答"为什么给他看"） |

---

## 协作约定

多人协作规则见 [`AGENTS.md`](./AGENTS.md)：Issue 派活 → Branch 隔离 → PR 集成 → 人类 merge。
AI 不参与 merge 决定。

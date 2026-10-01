# AI 错题本

> 学军黑客松 2026 · 赛道一 Echo
>
> 拍照上传错题 → AI 自动识别 → 归类知识点 → 生成同类练习

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
# 然后编辑 .env，填入 TOKENDANCE_API_KEY

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

> 把 `7890` 换成你自己的 Clash 端口。只影响 GitHub，国内站点不受影响。

### 2. TokenDance 不要走代理

实测：直连 1.0s，走代理 1.1s。**它不需要代理**，习惯性加代理反而可能变慢。

---

## 项目结构

```
├── src/                    # 前端（#8）
│   ├── pages/              # 页面
│   ├── components/         # 组件
│   └── ai/                 # AI 模块（#10 #11）
│       ├── client.ts       # TokenDance 客户端
│       ├── types.ts        # 共用类型
│       ├── recognize.ts    # 识别 + 归类（#10）
│       └── generate.ts     # 生成同类新题（#11）
├── server/                 # 后端 API（#9）
├── scripts/                # 协作工具
│   ├── status.ps1          # 全队任务视图
│   └── dup-check.ps1       # 建 Issue 前查重
├── .agent/                 # 协作元数据
│   ├── claims/             # 责任区（一人一份）
│   ├── AI接入方案.md        # TokenDance 接入依据
│   └── 队友必读.md          # 完整上手指南
└── AGENTS.md               # 🔴 全队协作规则（唯一事实来源）
```

---

## 常用命令

| 命令 | 作用 |
|---|---|
| `npm run dev` | 启动开发服务器（5173） |
| `npm run build` | 构建（含 TS 类型检查） |
| `npm run lint` | 代码检查 |
| `npm run preview` | 预览构建产物 |

---

## 协作必读

**开工前必须完整读 [`AGENTS.md`](AGENTS.md)** —— 那是全队唯一事实来源。

三条最重要的铁律：

1. **锁文件只有一个人能提交**（集成者）→ 否则 PR 会一直冲突
2. **说"完成"之前必须查 Issue** → 否则 AI 会互相等到死
3. **AI 不许 merge，人点头才合** → 否则 main 会烂

**看全队进度：**

```powershell
.\scripts\status.ps1
```

**派活前查重：**

```powershell
.\scripts\dup-check.ps1 -Keyword "登录"
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite 8 + React 19 + TypeScript 6 |
| 后端 | Node/Express 或 Python/FastAPI（#9 决定）+ SQLite |
| AI | [TokenDance](https://tokendance.space) 多模型网关 |

### AI 模型选型（已实测可用）

| 用途 | 模型 |
|---|---|
| 题目识别 | `qwen3-vl-plus` |
| 知识点归类 | `glm-5` |
| 生成新题 | `qwen3-7-max` |
| 语义检索 | `qwen3.7-text-embedding` |

详见 [`.agent/AI接入方案.md`](.agent/AI接入方案.md)

---

## 🔒 安全

- 🚫 `.env` **绝不提交**（`.gitignore` 已挡，别用 `git add -f` 绕过）
- 🚫 API Key 不许硬编码、不许贴到 Issue、不许放前端
- ✅ 提交前自检：`git diff --cached | findstr "sk-"`（有输出 = 泄漏了）

---

## 遇到问题

| 现象 | 解决 |
|---|---|
| 打不开 github.com | 配代理（见上） |
| `Repository not found` | 私有仓库 + 没带身份 → 用 SSH 或自己的 token |
| `curl 35` / 超时 | 网络抖动，**直接重跑** |
| 中文乱码 | PowerShell 加 `-Encoding UTF8` |

**完整排错手册**：[`.agent/队友必读.md`](.agent/队友必读.md) 第 9 节

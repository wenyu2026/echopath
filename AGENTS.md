# AGENTS.md — 全队 AI 统一协作规则

> **本文件是唯一事实来源。**
> 所有 Claude / Codex / Gemini 开工前必须完整读一遍。
> 读完第一件事：去你被分配的 Issue 里发 `CHECKIN`。

版本：v1.0　｜　适用：学军黑客松 2026　｜　成员：4 人（member-a / b / c / d）

---

## 0. 一句话说清

**GitHub 是唯一协作总线。**

```
Issue 派活  →  Branch 隔离  →  PR 集成  →  人来 merge
```

不引入任何额外服务。所有沟通留在 Issue 评论和 PR 里，**不要用聊天窗口传技术决定**——
聊天记录会丢，Issue 不会。

---

## 1. 开工前必做（强制，不许跳过）

1. 完整读本文件
2. 读你被分配的 Issue（任务、验收标准、依赖）
3. 读 `.agent/claims/` 下**所有人**的责任区文件，确认你要改的文件归谁
4. 在 Issue 里发 `CHECKIN`

**第 3 步最容易被跳过，也最容易出事**——不看清责任区就动手，必踩别人地盘。

---

## 2. ⚠️ 四个强制检查节点

AI 不会自动被 GitHub 消息唤醒。**唯一可靠的补偿办法是把检查写成硬性动作。**

在以下 4 个节点，**必须先跑这两条命令**，再继续任何工作：

```bash
# ① 主通道：谁被阻塞了（即时可靠，实测 1.4s）
gh issue list --label "agent:blocked" --state open

# ② 辅助通道：有没有人 @ 我（⚠️ 有约 5 秒索引延迟）
gh issue list --search "mentions:@me" --state open
```

| 节点 | 说明 |
|---|---|
| ① 开始任何任务前 | 确认没人正在等你 / 没新指派 |
| ② 每次 commit 前 | 确认依赖方没变更接口 |
| ③ 提 PR 前 | 确认没有重复劳动 |
| ④ **说 DONE 之前** | **最关键** |

> ### 🚫 铁律：没检查过 Issue / PR，禁止声称完成。
> 说 `DONE` 之前不查，等于把队友永久挂起。

### ⚠️ 两条通道的实测特性（别踩）

| 通道 | 实测结果 |
|---|---|
| **Labels 过滤** | ✅ **即时可靠**（1.4s），协议的**主通道** |
| `mentions:@me` | ⚠️ **有约 5 秒索引延迟**。刚发的提及可能查不到，**别据此断定"没人找我"** |
| `review-requested:@me` | ❌ **已废弃，不要用**。GitHub 不允许给自己的 PR 设 reviewer，全队共用账号时**永远返回空**，会造成"没人要我 review"的假象 |

**推论**：**待办与阻塞一律用 Label 表达，不依赖 @提及。**
@提及只是礼貌通知，**不是可靠信号**。

---

## 3. 消息格式（写在 Issue 评论里）

固定用这 5 个词**全大写**开头。格式统一，人才扫得快，AI 才解析得准。

### CHECKIN — 领取任务

```
CHECKIN
负责人：member-a
分支：member-a/<简述>
计划：<2-3 句，说清怎么做>
预计：<大概什么时候能有初版>
```

### BLOCKED — 卡住了

**必须写全三项，缺一项等于没说。**

```
BLOCKED
等谁：@member-b
等什么：<具体到接口名 / 字段 / 文件路径，别写"等你那边好">
我还能做：<不依赖对方的部分；真的没有就写"无">
```

> 写"我还能做"是为了**不让整条流水线停摆**。即使只写"我去补文档"也比空着强。

### HANDOFF — 交接给别人

```
HANDOFF → @member-c
已完成：<具体到文件 / 函数>
你继续：<具体到要做什么>
注意：<我踩过的坑，别再踩>
```

### DONE — 完成

```
DONE
分支：member-a/xxx
PR：#<编号>
验收：<怎么验证，给出可复制执行的命令或步骤>
影响文件：<文件列表>
```

### REVIEW — 请求审查

```
REVIEW
PR：#<编号>
Review 给：member-b
改动摘要：<具体>
需重点看：<具体文件 / 逻辑，别写"都看看">
```

> ⚠️ **不要依赖 GitHub 的 reviewer 功能**（实测：全队共用账号时它永远为空）。
> 需要谁 review，就**在这里写清名字 + 给 PR 打上 `agent:review` 标签**，
> 并让对应的人 `gh pr list --label agent:review` 来认领。

---

## 4. 区域划分（互不重叠）

| 成员 | 负责路径 |
|---|---|
| **member-a** | `frontend/**`　`src/components/**` |
| **member-b** | `backend/**`　`src/api/**` |
| **member-c** | `model/**`　`inference/**` |
| **member-d** | `shared/**`　`deploy/**` |

**改动别人地盘 = 必须先在 Issue 发 `CHANGE_REQUEST`，等对方回 `OK` 再动手。**

```
CHANGE_REQUEST → @member-b
想改：backend/routes/user.ts
原因：<为什么必须改>
改法：<具体改什么>
```

> 区域是**约定**，不是锁。目的不是禁止跨界，而是**跨界前先打声招呼**。

---

## 5. 🔥 根文件规则（最容易炸的地方）

下面这些文件**不属于任何人的区域**，是冲突重灾区，单独定规矩：

| 文件 | 唯一 owner |
|---|---|
| `package-lock.json` | **只有 member-d 能提交** |
| `package.json` | 谁加依赖谁改，PR 里注明 |
| `src/main.tsx` | 同一时间只许一人改 |
| `vite.config.ts` / `tsconfig.json` | member-d |
| `.env.example` | 谁加变量谁改 |

### 🚫 锁文件铁律

**除了 member-d，任何人都不准提交 `package-lock.json`。**

你在自己分支跑完 `npm install` 后，**只提交 `package.json`，把锁文件的改动丢掉**：

```bash
# 推荐做法：完全不生成锁文件
npm install --no-save <包名>       # 临时试用
npm pkg set dependencies.<包名>=<版本>   # 改 package.json

# 已生成锁文件了？丢弃它
git checkout -- package-lock.json
```

**为什么要这么严：**
> 锁文件是机器生成的，几百行 diff **人眼根本看不出对错**。
> 三方各自生成一份 → 必然冲突 → 强行 merge → **玄学 bug**（本地能跑、别人跑不了）。
> 让**一个产者**统一生成一次，是唯一能根治的办法。

**member-d 的职责**：定期在 main 上跑 `npm install --package-lock-only` 并提交，
保证锁文件始终与 `package.json` 一致。

---

## 6. 分支与提交

**分支命名**
```
member-a/<简述>     如 member-a/login-page
member-b/<简述>     如 member-b/user-api
member-c/实验性分支可用 exp/ 前缀
```

**铁律**
- 🚫 **禁止直接 push `main` / `master`**
- 🚫 **禁止 `git push --force` 到共享分支**（自己未合并的私有分支可以）
- commit 信息用英文动词开头：`feat:` `fix:` `docs:` `chore:` `refactor:`

```
feat: 增加登录页表单校验
fix: 修复用户接口的空指针
docs: 补充 API 说明
```

---

## 7. PR 规则

- 🚫 **AI 不许自己 merge。** 必须由**人类**点 merge。
- PR 描述必须填模板（`.github/PULL_REQUEST_TEMPLATE.md`）
- 🚫 PR 里**禁止出现 `package-lock.json`**（除非你是 member-d）
- 提 PR 后在对应 Issue 发 `REVIEW`
- PR 尽量小：**一个 PR 只做一件事**，超过 400 行考虑拆

---

## 8. 提交身份

已全局配好，**别改**：

```
user.name  = wenyu2026
user.email = 290060464+wenyu2026@users.noreply.github.com
```

> 用 noreply 邮箱的原因：真实邮箱绑在另一个 GitHub 账号上，
> 直接用它会导致**贡献算错人**，且泄露邮箱。

### 🚨 当前限制：全队共用同一个 GitHub 账号

现状：GitHub 上**只有 `wenyu2026` 一个账号**，4 个人（含各自的 AI）都通过它操作。
这带来三个**无法靠配置绕过**的限制：

| 限制 | 后果 |
|---|---|
| `@wenyu2026` 无法区分是谁 | **不能靠 @提及 指派任务** |
| 不能给自己 PR 设 reviewer | `review-requested:@me` **永远为空** |
| 4 人共用同一份 gh 凭据 | GitHub 上的操作**无法追溯到具体是谁** |

**应对方式（已内建到本协议）：**

1. **身份靠文字声明，不靠 GitHub 账号**
   每个成员在自己电脑的仓库里执行一次（**只影响本机，不提交**）：
   ```bash
   git config user.name "member-a"
   ```
   这样 commit 的**作者名**能区分人（邮箱保持统一的 noreply 不变，贡献仍算对账号）。

2. **待办靠 Label，不靠 @提及**（见第 2 节）
   `agent:blocked` / `agent:review` / `agent:handoff` / `agent:done`

3. **Issue 里写清「Review 给：member-x」**，并用标签让人来认领。

> **有办法根治**：给 3 位队友各建 GitHub 账号，加为仓库协作者。
> 之后 @提及、reviewer、贡献图都会正常工作。
> 需要的话让我来配 —— 但**不建也能跑**，上面 3 条已足够。

---

## 9. 环境铁律（赛场特有，务必遵守）

| 事项 | 规则 |
|---|---|
| **GitHub 访问** | **必须走 Clash 代理（127.0.0.1:7890）**，直连必失败（实测 21s 超时） |
| 代理配置 | 已写入 git 全局配置，只对 github 域名生效，Gitee 仍直连 |
| **Clash 挂了怎么办** | GitHub 立刻不通。先检查 7890 端口是否在监听 |
| npm 源 | 腾讯云（项目 `.npmrc` 已配，克隆后自动生效） |
| `.env` 与密钥 | 🚫 **永不提交**（`.gitignore` 已挡，别用 `-f` 绕过） |
| 不要选的方案 | 需要 Docker / 本地原生编译 / Java / .NET 的 —— 环境里没有 |

**代理不通时的自检命令：**
```powershell
Get-NetTCPConnection -State Listen -LocalPort 7890   # 有输出 = Clash 在跑
```

---

## 10. 三条最重要的铁律（记不住别的，记这三条）

1. **锁文件只有一个人能提交** → 不守这条，PR 会一直冲突
2. **说 DONE 之前必须查 Issue / PR** → 不守这条，AI 会互相等到死
3. **AI 不许 merge，人点头才合** → 不守这条，main 会烂

---

## 11. 🔒 怎么保证不做重复劳动（三道闸门）

「合并任务」不是最后做一次的动作，而是**三个连续闸门**，每道挡一类重复：

| 闸门 | 时机 | 挡什么 | 工具 |
|---|---|---|---|
| ① **建 Issue 前查重** | 派活时 | 两人拿同一个任务 | `scripts/dup-check.ps1` |
| ② **开工前 CHECKIN** | 领活时 | 同时开工同一件事 | 发 CHECKIN + 打 `member-x` 标签 |
| ③ **PR 时查重** | 合代码时 | 写了两份重复代码 | 人工 review + `dup-check` 搜旧 Issue |

### 工具 1：全队任务视图（开工前必看）

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\status.ps1
```

一眼看清：**谁在做什么、谁卡住了、哪些还没人领**。
末尾会专门列出「还没人认领的任务」—— **想接活先看这里，别自己新开一个。**

### 工具 2：建 Issue 前查重（派活前必跑）

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dup-check.ps1 -Keyword "登录"
```

同时搜 open 和 closed。**closed 也要搜**，因为「已经做完的事」最容易被重复做一遍 ——
尤其是工具函数、接口、配置这类容易各写一份的东西。

### 🔴 成员身份靠 Label，不靠 assignee

**重要**：全队共用一个 GitHub 账号（见第 8 节），`--assignee` 无法区分成员。
所以**每个任务必须打上 `member-a/b/c/d` 标签**：

```bash
gh issue create --title "..." --label "task" --label "member-a"
```

看板脚本正是靠这个标签识别负责人的。不打标签 = 显示「未认领」= 别人不知道你在做。

### 🚫 最容易重复的四类东西（重点防）

| 类型 | 例子 | 防法 |
|---|---|---|
| **工具函数** | 日期格式化、请求封装、校验 | **先搜** `dup-check.ps1 -Keyword "utils"`，有就复用 |
| **接口定义** | `User`、`ApiResponse` 类型 | 归 `shared/**`，**由 member-d 统一维护** |
| **配置** | vite / tsconfig / env | 唯一 owner 制（见第 5 节） |
| **同一个页面/功能** | 两个人都写登录页 | CHECKIN 先到先得 |

**发现别人在做同一件事，立即停下并发 `BLOCKED`**，说明"这事 member-x 在做，我改做别的"——
**不要闷头做完再对比**，那是纯浪费。

### 合并流程（代码层面）

```bash
git checkout main
git pull                                    # 1. 先同步，避免基于旧代码
git merge member-a/xxx                      # 2. 合并
# 3. 有冲突 → 停在 Issue 发 BLOCKED，别硬resolve
npm run build                               # 4. 合并后必须验证能构建
git push
```

**合并后一定要重新构建/跑一次** —— 两个分支各自能跑，合起来不一定能跑，
这是集成阶段最常见的翻车点。

---

## 附：本协议自身的修改

改 `AGENTS.md` 时**必须同步更新 `GEMINI.md` 里的哈希**（那里有说明），否则 PR 打回。

原因：不同 AI 读不同文件，一旦两份规则不一致，就会**各按各的干**——
这是多 AI 协作最阴的失败模式。

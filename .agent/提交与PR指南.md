# 提交与 PR 指南（队友照做）

> 做完 Issue 后，按这个流程提交。**大约 3 分钟。**
> 记住一条：**你不 merge，只有队长能 merge。**

---

## 完整流程

```
① 同步最新代码
② 建自己的分支
③ 干活 + 提交
④ 推送
⑤ 开 PR
⑥ 在 Issue 里发 DONE
```

---

## ① 同步最新代码（每次开工前必做）

```bash
git checkout master
git pull
```

> ⚠️ 不 pull 就建分支 → 你会基于旧代码开发 → 后面必然冲突。

---

## ② 建自己的分支

**分支名格式：`<你的用户名>/<简述>`**

```bash
git checkout -b bo200712/notebook-pages
```

| 谁 | 分支名前缀 | 例子 |
|---|---|---|
| bo200712 | `bo200712/` | `bo200712/notebook-pages` |
| Damn4lee | `Damn4lee/` | `Damn4lee/retrieval-chain` |
| fu6868 | `fu6868/` | `fu6868/episodes-12` |
| wenyu2026 | `wenyu2026/` | `wenyu2026/integration` |

> 🚫 **绝对不要直接推 master。**

---

## ③ 干活 + 提交

写完代码后：

```bash
# 看看改了哪些文件
git status

# 确认没混进不该提交的东西
git status --short | findstr "package-lock .env"

# 暂存
git add -A

# 提交（信息用英文动词开头）
git commit -m "feat: 实现六页面与人生分叉地图"
```

### 🚫 提交前必须检查两件事

| 检查 | 命令 | 如果中招 |
|---|---|---|
| **有没有 `package-lock.json`** | `git status --short \| findstr package-lock` | `git checkout -- package-lock.json` |
| **有没有 `.env`** | `git status --short \| findstr .env` | `git checkout -- .env` |

> 锁文件只有 **wenyu2026** 能提交。别人提交了会在 PR 里被打回。

### commit 信息格式

```
feat: 增加新功能
fix: 修复 bug
docs: 改文档
chore: 杂项
refactor: 重构
```

---

## ④ 推送

```bash
git push -u origin bo200712/notebook-pages
```

**如果卡住或报 `curl 35` / `timed out`** → **直接重跑**。这是网络抖动，Git 不会传坏数据。

---

## ⑤ 开 PR

### 方式 A：命令行（推荐）

```bash
gh pr create --title "feat: 实现六页面与人生分叉地图" --body-file .github/PULL_REQUEST_TEMPLATE.md
```

然后**手动填模板里的内容**（改了啥、怎么验证）。

### 方式 B：网页

推送后终端会打印一个链接，类似：

```
remote: Create a pull request for 'bo200712/notebook-pages' on GitHub by visiting:
remote:      https://github.com/wenyu2026/echopath/pull/new/bo200712/notebook-pages
```

**点它** → 网页会自动加载 PR 模板 → 填完点 Create。

### PR 里必须写清

| 字段 | 写什么 |
|---|---|
| 关联 Issue | `Closes #16` |
| 改了什么 | 具体到文件和行为 |
| **怎么验证** | **给出可复制执行的步骤** ← 最重要 |
| 影响文件 | 列出改动文件 |

> **写不出可执行的验证步骤 = 这活儿其实没做完。**

---

## ⑥ 在 Issue 里发 DONE

**回到你的 Issue**，发一条评论：

```
DONE
分支：bo200712/notebook-pages
PR：#18
验收：npm run dev → 打开 /notebook → 能看到三条路径的分叉地图
影响文件：src/pages/Notebook.tsx, src/components/ForkMap.tsx
```

**如果还需要别人 review**，再发一条：

```
REVIEW
PR：#18
Review 给：Damn4lee
改动摘要：新增分叉地图组件，用 SVG 画三条路径
需重点看：ForkMap.tsx 里的路径计算逻辑
```

---

## ⚠️ 提交前最后一道检查

```bash
npm run build
```

**必须通过。** 构建不过的 PR 会被直接打回。

---

## 🚫 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 直接推 master | 破坏主干 | 建自己的分支 |
| 提交 `package-lock.json` | PR 被打回 | 丢弃它 |
| 提交 `.env` | **密钥泄漏！** | 丢弃它，并立刻告诉队长 |
| 没 pull 就建分支 | 后面冲突 | 先 `git checkout master && git pull` |
| 构建不过就提 PR | 被打回 | 先 `npm run build` |
| 一个 PR 塞很多改动 | 没法 review | 一个 PR 只做一件事 |
| **自己 merge** | **违反协议** | **等队长点 merge** |

---

## 你的任务到这里就结束了

**剩下的交给队长：**
1. 他 review 你的 PR
2. 他点 merge
3. 你的代码进入主干

**你不需要做任何 merge 操作。**

---

## 卡住了怎么办

在 Issue 里发：

```
BLOCKED
等谁：@Damn4lee
等什么：需要 /api/retrieve 接口返回 Situation 的 JSON 格式
我还能做：先把页面骨架搭好，接口好了直接接
```

**必须写全三项。** 写「我还能做」是为了不让整条流水线停摆。

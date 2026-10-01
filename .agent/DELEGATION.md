<#
  注意：这是 Markdown 文档，不是脚本。
  下方的提示词块可以直接整段复制给你的 AI。
#>

# 队友 AI 部署提示词

> 使用方法：把下面【提示词】整段复制给你自己的 AI。
> 复制前把 `<你的用户名>` 和 `<你的区域>` 换成实际值。

---

## 【提示词】直接复制

```
你要加入一个 4 人黑客松团队，协作通过 GitHub 进行。

【你的身份】
GitHub 用户名：<你的用户名>
你的区域：<你的区域>
（区域含义见 AGENTS.md 第 4 节；不确定就问队长）

【第一步：了解环境】
本机访问 GitHub 必须走 Clash 代理（127.0.0.1:7890）。
如果 git 命令卡住或超时，先执行这条确认代理还活着：
    Get-NetTCPConnection -State Listen -LocalPort 7890
没有输出 = Clash 挂了，立刻告诉我，不要反复重试。
网络抖动（curl 35 / connection reset / timed out）直接重跑即可，Git 不会传坏数据。

【第二步：设置你的提交身份】
在仓库目录执行一次（换成你自己的，这只影响本机）：
    git config user.name "<你的用户名>"
    git config user.email "<你注册GitHub的邮箱>"
这样提交记录才能正确算到你头上。

【第三步：读规则（必做，不许跳过）】
完整读一遍仓库根目录的 AGENTS.md。
那是全队唯一事实来源，包含：
  - 区域划分（你能改哪些目录）
  - 5 种消息格式（CHECKIN/BLOCKED/HANDOFF/DONE/REVIEW）
  - 根文件与锁文件规则（最容易炸的地方）
  - 四个强制检查节点
读完后，去我被分配的 Issue 里发 CHECKIN。

【第四步：硬规则】
1. 不许直接 push main，用分支 <你的用户名>/<简述>
2. 不许自己 merge PR，必须由人类决定
3. 不许提交 package-lock.json
4. 说"完成"之前，必须先跑：
      gh issue list --label "agent:blocked" --state open
      gh issue list --assignee "@me" --state open
   （mentions 有约 5 秒索引延迟，查不到不代表没人找你）
5. 改别人区域之前，先在 Issue 发 CHANGE_REQUEST 并等待 OK
6. 不许提交 .env 或任何密钥

【第五步：工作方式】
- 每完成一个阶段就在 Issue 里发对应格式的消息，不要闷头做完才说
- 卡住了立刻发 BLOCKED，必须写清"等谁/等什么/我还能做什么"
- 不确定的事先问队长，不要自己猜着改架构
- 保持 PR 小：一个 PR 只做一件事
- 提交信息用英文动词开头：feat: / fix: / docs: / chore:

现在开始：先读 AGENTS.md，然后告诉我你读到了什么、你要做什么。
```

---

## 给队长的说明（你自己看）

队友 AI 读完规则后，你要做的事：

1. **建 Issue 派活** —— 用 `.github/ISSUE_TEMPLATE/task.yml` 模板
   写清 Owner / 验收标准 / 影响文件 / 依赖
2. **把 Issue 编号告诉对方**，让它的 AI 去发 `CHECKIN`
3. **盯 Label，不用盯人**：
   ```bash
   gh issue list --label "agent:blocked" --state open   # 谁卡住了 ← 要你介入
   gh pr list --label "agent:review"                    # 等谁 review
   ```
4. **只有你能 merge PR** —— 协议里唯一必须由人做的事

---

## ⚠️ 一个必须知道的限制

协议里所有「必须查 Issue」的规则，**AI 都可能忘记执行** ——
因为它没有自动唤醒机制，GitHub 上的新消息不会主动推给它。

**你的角色就是兜底。** 发现某个 AI 闷头干太久没吭声，
直接问它一句：

> 「你发 CHECKIN 了吗？看过 blocked 列表吗？」

**这比任何自动化都管用。** 尤其在黑客松这种时间紧、人一直在场的场景。

---

## 常见问题

| 现象 | 解决 |
|---|---|
| AI 说读不到 AGENTS.md | 确认在仓库目录下，且已 `git pull` 到最新 |
| `git clone` 卡住 | 查 Clash 是否在跑（7890 端口） |
| push 报 `curl 35` | 网络抖动，直接重跑 |
| AI 不知道自己区域 | 在 Issue 里明确写 Owner，或直接告诉它 |
| AI 说"没人找我" | 提醒它 mentions 有索引延迟，且要看 blocked 标签 |

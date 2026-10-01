<!--
  提交 PR 前请填完本模板。
  AI 不许自己 merge —— merge 由人类决定（见 AGENTS.md 第 7 节）。
-->

## 关联 Issue

Closes #

## 改了什么

<!-- 具体到文件和行为，别写"实现了功能" -->

## 怎么验证

<!--
  给出别人能直接复制执行的步骤，这是 Review 的前提。
  写不出可执行验证 = 这活儿其实没做完。
-->

```bash

```

## 影响文件

<!-- 列出改动文件；若涉及根文件（package.json / src/main.tsx / vite.config.ts）请标出 -->

- 

## 自检（全部必须勾选）

- [ ] 我**没有**提交 `package-lock.json`（除非我是 wenyu2026）
- [ ] 提交前跑过 `gh issue list --label "agent:blocked" --state open`
- [ ] 提交前跑过 `gh issue list --search "mentions:@me" --state open`
- [ ] 没碰别人责任区，或已在 Issue 发过 `CHANGE_REQUEST` 并得到 `OK`
- [ ] 没提交 `.env` 或任何密钥
- [ ] 一个 PR 只做一件事，未混入无关改动
- [ ] 已给本 PR 打上 `agent:review` 标签，并在 Issue 写明「Review 给：@某人」

> ⚠️ **不要用** GitHub 的 reviewer 功能。实测全队共用账号时
> `review-requested:@me` **永远返回空**，会造成"没人要我 review"的假象。

## 需要 Review 重点看什么

<!-- 指出你最没把握的地方，别写"都看看" -->

- 

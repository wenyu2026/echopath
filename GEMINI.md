<!--
  本文件是薄包装，不独立维护。
  唯一事实来源：./AGENTS.md
-->

# GEMINI.md

**所有协作规则以 [`./AGENTS.md`](./AGENTS.md) 为唯一事实来源。**

本文件不包含独立规则，仅作指路。

👉 **请先完整阅读 [`./AGENTS.md`](./AGENTS.md)，再开始任何工作。**
读完后，去你被分配的 Issue 里发 `CHECKIN`。

---

## 为什么要这个文件

Claude Code 与 Codex CLI 读 `AGENTS.md`，Gemini CLI 读 `GEMINI.md`。
为让三种 AI 遵守**同一套规则**，此处不复制内容，只做指向。

> 本机（Windows，开发者模式未开启）**无法创建符号链接**，实测报「此操作需要管理员权限」，
> 因此不能用 symlink 方案，只能用本薄包装 + 下方哈希校验。

---

## ⚠️ 同步校验（改 AGENTS.md 必看）

修改 `AGENTS.md` 后，**必须**重新计算哈希并更新下面这一行，否则 PR 打回。

```
AGENTS.md sha256 前 8 位：c8d4a380
```

**计算命令：**

```powershell
(Get-FileHash .\AGENTS.md -Algorithm SHA256).Hash.Substring(0,8).ToLower()
```

**为什么要这一步：**
> 一旦 `AGENTS.md` 改了而这里没更新，就说明两份规则可能不一致，
> 不同 AI 会各按各的干 —— 这是多 AI 协作最阴的失败模式。
> 这个哈希不需要精确到逐字节，它只是一个**"我记得检查过"的凭证**。

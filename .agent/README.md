# .agent/ — 协作元数据

本目录存放**协作协议本身的运行时状态**，不是产品代码。

```
.agent/
  README.md          ← 本文件
  DELEGATION.md      ← 给队友 AI 的部署提示词（直接复制粘贴）
  claims/
    bo200712.md      ← 一人一份，各写各的责任区
    Damn4lee.md
    fu6868.md
    wenyu2026.md
```

## 为什么不放一个总表

最初的设想是 `CLAIMS.md` 一张总表列出所有责任区。**改成一人一文件，原因是：**

> 总表是**单文件**。四个人同时更新自己的责任区 = 四个人同时改同一个文件
> = 又制造了一个新的冲突源。

这跟 `AGENTS.md` 第 5 节要解决的锁文件问题是**同一类错误**，
只是换了个位置。拆成一人一份就根除了。

## 怎么查全局责任区

```bash
# 看所有人正在干什么
cat .agent/claims/*.md

# 只找谁占用了某个根文件
grep -r "package.json" .agent/claims/

# 找出所有登记在案的根文件占用
grep -rn "我占用的根文件" .agent/claims/
```

## 规则

- **只改自己那一份**，别人的别动
- 占用了根文件（`package.json` / `src/main.tsx` / `vite.config.ts`）**必须登记**
- 任务完成或交接后**及时更新**，否则别人会误判你在占用

## 相关文档

- 规则总纲：[`../AGENTS.md`](../AGENTS.md)
- Gemini 入口：[`../GEMINI.md`](../GEMINI.md)

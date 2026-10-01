# wenyu2026 责任区

**角色**：A 产品/叙事 + 集成（队长）
**区域**：`src/main.tsx`　`src/types/**`　根配置文件
**任务**：Issue #17 —— Demo 剧本 + 全链路 + 兜底

| 字段 | 内容 |
|---|---|
| 当前任务 | #17 集成 + 演示 |
| 正在进行 | 等 #13–#16 完成 |
| 我占用的根文件 | `package.json`、`package-lock.json`、`vite.config.ts`、`tsconfig*.json` |
| 最近更新 | 2026-10-02 |

---

## ⚠️ 本区额外职责：根文件与锁文件

wenyu2026 是**根文件的唯一 owner**，也是**锁文件的唯一产者**。

| 文件 | 职责 |
|---|---|
| `package-lock.json` | **只有我能提交**。定期跑 `npm install --package-lock-only` 并提交 |
| `vite.config.ts` / `tsconfig*.json` | 唯一 owner |
| `src/main.tsx` | 同一时间只许一人改 |
| `src/types/**` | 类型契约，只有我能改 |
| `package.json` | 别人改依赖时我在 PR 里把关 |

**发现别人 PR 里带了 `package-lock.json` → 直接打回。**

---

## 队长额外职责

1. **盯 fu6868 的数据进度** —— 它是关键路径，拖了全盘皆输
2. **只有我能 merge PR** —— 协议里唯一必须由人做的事
3. **每天问一次**：「你发 CHECKIN 了吗？看过 blocked 列表吗？」

## 相关文档

- 数据契约：[`../DecisionEpisode-Schema.md`](../DecisionEpisode-Schema.md)
- Demo 剧本：[`../DEMO.md`](../DEMO.md)
- 协作规则：[`../../AGENTS.md`](../../AGENTS.md)
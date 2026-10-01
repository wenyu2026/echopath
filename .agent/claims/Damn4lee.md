# Damn4lee 责任区

**角色**：C AI/后端
**区域**：`server/**`　`src/ai/**`
**任务**：Issue #14（检索链路）+ #15（反类比 + 证据分层）

| 字段 | 内容 |
|---|---|
| 当前任务 | #14 检索链路 / #15 反类比 |
| 正在进行 | 待开始 |
| 我占用的根文件 | — |
| 最近更新 | 2026-10-02 |

---

## 🔴 两条救命的技术要点（实测）

**1. 调用 LLM 必须加 `reasoning_effort: 'none'`**

| 配置 | 耗时 |
|---|---|
| `glm-5` 默认 | **22.7s** |
| 加了 `reasoning_effort:'none'` | **6.0s** ✅ |

不加会在演示时卡 20 秒以上。

**2. 必须用 `json_schema` 严格模式**

`response_format: json_object` 只保证语法合法，**不保证符合 Schema**
（实测 `risk` 会返回长句子而不是 `"medium"`）。

**3. 别用 `glm-5.3-flash`** —— 实测 content 为空，输出全跑 reasoning 里。

**4. 不需要向量库** —— 36-60 条数据直接内存算余弦相似度（<1ms）。

## 相关文档

- 数据契约与完整调用配置：[`../DecisionEpisode-Schema.md`](../DecisionEpisode-Schema.md)
- AI 接入参数：[`../AI接入方案.md`](../AI接入方案.md)
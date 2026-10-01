# Damn4lee 责任区

**角色**：C AI/后端
**区域**：`server/**`　`src/ai/**`
**任务**：Issue #14（检索链路）+ #15（反类比 + 证据分层）

| 字段 | 内容 |
|---|---|
| 当前任务 | #14 检索链路（DONE_LOCAL）→ #15 反类比（规则文档待审） |
| 正在进行 | 分支 `Damn4lee/t2-retrieval`：阶段一已实现并验证；待审核 `server/RULES-evidence-counter-analogy.md` 后开工阶段二 |
| 我占用的根文件 | — |
| 最近更新 | 2026-10-02 |

## 技术栈决定（2026-10-02 实测对比后）

**Node/TS（Node 24 原生跑 TS，零第三方依赖）**。对比记录：`server/_bench/BENCH-RESULT.md`。
规避的 strip-only 限制：不用 constructor 参数属性、不用 `interface extends T['field']`。

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
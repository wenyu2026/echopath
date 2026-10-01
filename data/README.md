# Decision Episode 数据集

> 这是**全项目最关键的资产**。数据不到位，前端再漂亮、AI 再花哨，演示都是空的。

---

## ⚠️ 关于当前的 3 条种子数据

`episodes.json` 里的 3 条（鲁迅 / 李安 / 村上春树）是**模板样例**，作用是：

1. 给数据负责人（#13）一个**格式与颗粒度的参照**
2. 让 AI/后端（#14）能**立刻开始开发**，不用等数据

**🚨 但这 3 条必须经过核实才能用于演示：**

| 要做的事 | 说明 |
|---|---|
| **核实每个 `source_id`** | 确认该书/该访谈/该传记**真实存在**，且确实支持 `claim` |
| **核实时间线与事实** | 年份、年龄、事件顺序 |
| **补充 `unknowns`** | 凡是不确定的一律写进去，**比编造强** |
| **不要照抄** | 样例只示范结构，内容要你自己查证 |

> **这不是形式主义。** 方案第 17 节把「幻觉」和「人物神化」列为明确风险。
> 如果评委点开证据抽屉发现来源是编的，整个项目的可信度就崩了。

---

## 校验

```bash
npm run validate:data
```

提交前**必须跑通**。它会检查：

- 字段齐全、类型正确
- 枚举合法（`risk` / `reversibility` / `choice.type` / `evidence.type`）
- 数组长度符合约束
- `evidence` 非空，且**至少 1 条真实来源**（不能全是 `ai_inference`）
- `episode_id` 唯一
- **`choice.type` 至少覆盖 2 种**（演示硬要求）

也会给出警告：

- `choice.type` 种类偏少
- 未发现负面结果案例（**幸存者偏差**）

---

## 目标规模

| 阶段 | 条数 | 说明 |
|---|---|---|
| **今晚** | **12 条** | 最低可用 |
| 第二天中午 | 24 条 | |
| **最终** | **36–60 条** | 目标 |

> **宁可 12 条扎实的，不要 60 条凑数的。**

---

## 必须覆盖的方向

### 3 个 Demo 问题

1. 要不要转专业（沉没成本 vs 兴趣）
2. 考研还是就业（延迟收益 vs 即时确定）
3. 大厂还是小公司/创业（稳定 vs 成长空间）

### 必须覆盖不同结果（不许只选成功者）

| 结果类型 | 对应 `choice.type` 倾向 |
|---|---|
| 坚持得到回报 | `persist` |
| **坚持但长期受损** | `persist` |
| 转向后找到新路 | `direct_switch` |
| **转向后发现并不适合** | `direct_switch` |
| 先试探再转向 | `explore_then_switch` |
| 试探后确认留下 | `explore_then_persist` |
| 双轨并行 | `dual_track` |

**加粗的两类是防幸存者偏差的关键**，必须各至少 1 条。

---

## 数据质量红线

| 红线 | 说明 |
|---|---|
| 每个关键事实绑 `source_id` | 抽查时能追溯 |
| AI 推断必须标 `ai_inference` | **不许伪装成史实** |
| 不确定的写进 `unknowns` | 明确标出比编造强 |
| `choice.type` 要多样 | 多样性选择器依赖它 |
| **不写「上帝视角」** | 只写「当时他知道什么」，不用后来结果倒推 |

---

## 提速做法

**不要纯手工写 36 条 —— 会耗掉一整晚。**

推荐流程：

```
1. 选定 10-20 位人物（史料完整、公开可验证）
        ↓
2. 用 AI 起草（喂传记/史料 → 生成 Episode 草稿）
        ↓
3. 人工校验（时间线、事实、evidence 是否真实存在）
        ↓
4. npm run validate:data 校验
```

**校验环节不可省。** AI 起草的草稿很容易把「后人推测」写成「史实」。

---

## 结构参考

完整字段定义见 [`.agent/DecisionEpisode-Schema.md`](../.agent/DecisionEpisode-Schema.md)。

```json
{
  "episode_id": "唯一标识",
  "person": { "name": "姓名", "birth_year": 1900, "tags": ["标签"] },
  "time": { "year": 1923, "age": 23, "stage": "职业早期" },
  "prior_path": ["做这次选择前已经历什么"],
  "decision_state": {
    "dilemma": "A vs B",
    "options": ["可选道路"],
    "constraints": ["现实约束"],
    "goals": ["真正在意的目标"],
    "risk": "low | medium | high",
    "reversibility": "low | medium | high"
  },
  "choice": { "type": "枚举值", "actions": ["实际做了什么"] },
  "outcomes": {
    "short_term": "短期结果",
    "mid_term": "中期结果",
    "long_term": "长期结果"
  },
  "reflection": { "self_comment": "本人评价", "unknowns": ["不确定的"] },
  "evidence": [
    { "source_id": "S1", "type": "biography", "claim": "该来源支持的事实" }
  ],
  "retrieval_tags": ["用于召回的标签"]
}
```

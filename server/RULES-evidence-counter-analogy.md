# 规则文档：证据分层 + 反类比（#15 实施规则）

> **状态：v1 已实现（纯模板/判定表，零 LLM）。修订记录见文末。**
> 目的：把「未知信息处理」和「输出口径」写成可执行规则，避免模型把没有证据的内容写成事实。
> 依据：Issue #15、`.agent/DecisionEpisode-Schema.md`、方案附录 B（模型只能在「解释」「重组」层发挥）。

---

## 一、证据分层（evidence_layers）映射规则

### 1.1 判定表（机械规则优先，LLM 只做兜底分类）

| 来源 | 归入层 | 理由 |
|---|---|---|
| `evidence[]` 中 `type ∈ {biography, encyclopedia, interview}` 的 `claim` | **facts** | 有独立于本人的来源支撑 |
| `evidence[]` 中 `type = self_writing` 的 `claim` | **self_claims** | 本人写的，即使内容是客观事件也保留本人视角（保守规则） |
| `evidence[]` 中 `type = ai_inference` 的 `claim` | **ai_inferences** | 永不进 facts |
| `reflection.self_comment` | **self_claims** | 本人后来的评价 |
| `reflection.unknowns`、Situation 的 `unknowns` | **unknowns** | 原样透传 |
| `outcomes.short_term` | **interpretations**（v1 保守） | 数据侧 outcomes 无来源绑定；等 #13 加 `evidence_ref` 后再分化到 facts |
| `outcomes.mid_term` / `long_term` | **interpretations** | 「进入新文化阵营」「成为奠基人」是后人归纳与评价 |
| 反类比模块产出的每一条 | **ai_inferences**（kind=era）或 why_different 对应层 | 见第二节 |

每条 facts / self_claims 条目**必须以 `(source_id)` 结尾**；outcomes 与反类比产物没有 source_id，用 `(字段名)` 或 `(ai_inference)` 结尾 —— 保证验收第 2 条「抽查关键事实能追溯」可机械执行。

### 1.2 边界用例（判定表覆盖不了的）

| 用例 | 规则 |
|---|---|
| 同一事实既有 self_writing 又有 biography（如「1906 年退学」：LX-S3 biography 独立支撑） | facts 收一条（biography 版本）；self_writing 版本若措辞含动机/情绪，另收 self_claims |
| self_writing 的 claim 是纯客观陈述且无第二来源 | 留在 self_claims，**不升格为 facts**（宁可分层保守，不许偷偷升格） |
| biography 的 claim 里混着事实与解释（「退学后陷入贫困，这塑造了他的批判性」） | LLM 拆句：事实句 → facts（挂该 source_id），解释句 → interpretations（挂该 source_id，标注「传记作者观点」）；拆不动就整体进 interpretations |
| `disputed_claims`（Schema 预留但数据未用） | 一律 unknowns，并保留争议原文 |
| 案例某层为空 | 输出空数组，**不编造内容填充** |

### 1.3 LLM 参与度

- 常规映射（判定表 1.1）**纯代码**，不调 LLM —— 保证零幻觉、零延迟成本。
- 仅 1.2 的「拆句」场景调 LLM（glm-5，json_schema strict，输入限定为该条 claim 原文），且系统提示词明确：**只能移动层级、只能引用原文词句，禁止补写**。
- LLM 输出复核：拆出的「事实句」若在原文中找不到 ≥4 个连续公共字符，判为改写，丢弃并整句进 interpretations。

---

## 二、反类比（Counter-Analogy）规则

### 2.1 条目结构

- `why_different`: string[]（现有契约）——给前端直接渲染的一句中文。
- `why_different_detail`: 结构化明细（CHANGE_REQUEST 已发 #17，等 wenyu2026 OK）：

```ts
{
  text: string;                                   // 与 why_different[i] 一致
  kind: 'structure' | 'evidence' | 'era' | 'unknown';
  // structure=结构字段差异（纯代码可比） / evidence=证据覆盖差异
  // era=时代制度差异（属 ai_inference） / unknown=证据不足
  basis: string;                                  // 如 "constraints 对比" / "LX-S3" / "模型外部知识"
  refs?: string[];                                // source_id 或结构字段名
}
```

### 2.2 生成流程（混合式：代码产候选 → LLM 只做表述与重要性）

1. **代码候选**（零幻觉，全部可追溯到字段）：
   - constraints 类别差：用户有而案例没有（门槛/经济/家庭…）→ kind=structure
   - options/可逆性差异：用户选项集与案例 action 集的结构差 → kind=structure
   - 阶段/时代差：`2026 − time.year > 30` → kind=era（候选，进 LLM 表述）
   - 证据覆盖差：用户 unknowns 中案例数据也无记录的维度 → kind=unknown（候选）
2. **LLM 步骤**：输入 = Situation + 案例（含结构字段）+ 代码候选清单；要求输出 2-4 条，每条必须绑定候选或字段，**禁止引入候选之外的事实**；对 era 类候选给出「当时制度/门槛与现在的差异」表述（此为模型外部知识，标 ai_inference）。
3. **校验**：LLM 输出中每条的 basis 若既不在候选清单也不在结构字段名列表 → 丢弃；丢弃后不足 2 条 → 用 unknown 条目补足（见 2.3）。

### 2.3 unknown 判定（铁律：证据不足必须输出 unknown）

一条差异若**不能同时满足**以下两个条件之一，降级为 unknown：
- 锚定 A：差异可对应到 Situation / Episode 的具体结构字段值（如「用户 constraints 含『可能延毕』，案例 constraints 无对应项」）；
- 锚定 B：差异可引用某条 evidence claim 的原文。

unknown 条目格式：`【未知】无法比较「X」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」…`。unknown 条目**不计入 2 条的最少条数**（2026-10-02 验收修订，原稿为计入：防止用两条 unknown 就凑齐「至少 2 条具体差异」的验收；具体差异不足时宁可少于 2 条并如实说明）。unknown 条目额外输出，`kind=unknown` 与 `kind=era` 在前端必须有视觉区分（前端 #16）。

### 2.4 数量与排序

- 数量：**2-4 条**。下限 2 是验收硬要求；上限 4 防止稀释「重要性」。
- 排序（重要性 = 具体性 × 对用户决策的影响）：
  1. structure（有具体字段锚点，直接影响用户选项的代价评估）
  2. evidence（影响可信度的差异）
  3. era（背景性，辅助理解）
  4. unknown（兜底诚实）
  同级内按「涉及字段数」降序。

### 2.5 「你应该」禁令（验收第 5 条）

- 反类比与所有生成文案的输出层做机械校验：黑名单正则 `你应该|你最好|建议你(选择|选|放弃)|我推荐你|最优(选择|路线)|正确(的|)选择`。
- 命中 → 用 glm-5 重写一次（提示词：改为「代价/结果」视角，不给行动指令）；再命中 → 直接删除该句。
- 该校验在 `server/evidence/` 的输出管线统一做（#17 集成层可复用同一函数做最终兜底）。

---

## 三、结果链（验收第 4 条）

- 数据侧已有 `outcomes.short/mid/long`，结果链模块**透传 + 分层标注**（1.1 判定表），不重写、不概括为成功/失败。
- 附加要求：结果链不出现「成功」「失败」「赢家」字样（机械校验同 2.5）。

---

## 四、待你拍板/协调的事项

| # | 事项 | 建议 |
|---|---|---|
| 1 | `outcomes` 在数据 Schema 中无 source 绑定 —— 中长期结果按规则进 interpretations，「抽查可追溯」验收口径限定为「evidence 与 facts/self_claims 层」 | 给 fu6868 提建议：未来给 outcomes 加 `evidence_ref`（可选字段，不改现有结构），届时 short_term 可分化到 facts |
| 2 | era 类反类比依赖模型外部知识，永远无法绑定 source | 按 2.3 归 ai_inference 并显著标注；上限 1 条（已实现） |
| 3 | `why_different_detail` 的 CHANGE_REQUEST 尚未获批 | 实现已带 `why_different_detail` 字段（可选），前端 #16 可完全忽略；获批后并入正式 types 即可，无返工 |
| 4 | LLM 拆句（1.2）与 LLM 表述（2.2-2）暂未启用 | v1 用「解释性关键词降级」替代拆句、用模板替代表述（零幻觉零延迟）；作为升级路径保留，接入前需重新评估延迟预算 |

---

## 修订记录

- **2026-10-02 验收修订（依产品负责人验收发现）**：
  1. §2.3 unknown 条目改为**不计入** 2 条底线（原稿：计入）——防止用 unknown 凑数达标；
  2. §1.1 outcomes 全部保守归 interpretations（原稿：short_term 有证据覆盖时可进 facts）——数据侧无 per-outcome 来源绑定前不假装可追溯；
  3. §2.2 v1 为纯模板生成（原稿：代码候选 + LLM 表述）——幻灯在构造上不可能发生，LLM 表述留作升级；
  4. 新增口径黑名单 `对方没有|他没有|她没有`（把「没记录」写成「对方没有」= 实现级 bug，测试断言拦截）。

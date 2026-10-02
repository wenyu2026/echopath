# 人工审查清单 · card-lu_xun-v0.1（v0.1）

> **必须由人完成，AI 不得代签。** 逐项核对后在卡内 `review.human_review` 填 `status: "approved"` 并写 `reviewed_by / reviewed_on / scope`；未完成保持 `pending`。
> 方法：对照 sources.json 的 URL/定位打开原文，逐条核对。机器校验结果（validate-card / 审计文件）只证明结构一致，不证明史实。

## 0. 来源层（5 个登记来源）

| 来源 | 核对项 | 结果 |
|---|---|---|
| LX-TOHOKU（东北大学史料馆） | 链接可达；「赴日与仙台入学、第二学年退学」定位存在 | ☐ |
| LX-SENDAI（东北大学英文页） | 链接可达；"studied in Sendai from 1904 to 1906" 在页 | ☐ |
| LX-PREFACE（《呐喊》自序 1922） | 维基文库文本；落款 1922；相关段落可定位 | ☐ |
| LX-SELECT（《自选集》自序 1932） | 文本存在；「开手于一九一八」原句在 | ☐ |
| LX-MUSEUM（上海鲁迅纪念馆） | 深链 404 已知；确认站点内是否有替代展览页并更新 locator | ☐ |

## 1. 关键事实（15 条，重点 8 条）

| fact_id | 主张 | 重点核对 | 结果 |
|---|---|---|---|
| f-lx-001 | 南京矿路学堂完成，至 1902 | 完成年份 1902 的出处表述 | ☐ |
| f-lx-002 | 1902 年公费赴日 | 「公费」二字是否有直接出处（若仅有「留学」需降级或改述） | ☐ |
| f-lx-003 | 1904 入仙台医专 | 年份 | ☐ |
| f-lx-004 | 仙台在学 1904—1906 | 区间两端 | ☐ |
| f-lx-005 | 第二学年离校，医学未完成 | 「未完成」（未卒业）表述 | ☐ |
| f-lx-008 | 筹办《新生》未成（据后来自述） | 原文确有此叙述；确认无年份出处；单一自述来源已标 medium | ☐ |
| f-lx-010 | 1918 开始小说创作（1932 自述） | 原句「我做小说，是开手于一九一八年」 | ☐ |
| f-lx-012 | 十四篇小说收入《呐喊》 | 数目「十四篇」；来源 404 后的替代定位 | ☐ |

其余：f-lx-000（身份）、f-lx-006（离开仙台）、f-lx-007（retrospective，确认其不进视图）、f-lx-009（受劝）、f-lx-011（狂人日记）、f-lx-013（续写多篇）、f-lx-014（自序 1922）。☐

## 2. explicit_order（须人工裁决是否成立；受控依据词表 + human_adjudication 见 weak-order-evidence.md）

| 快照 | fact | 顺序主张 | 依据（basis） | 裁决 |
|---|---|---|---|---|
| snap-lx-1902 | f-lx-001 | 完成学业先于毕业后去向决策 | logical_precondition | ☐ 认可 ☐ 驳回 |
| snap-lx-1906 | f-lx-004 | 在学先于离校 | logical_precondition | ☐ 认可 ☐ 驳回 |
| snap-lx-1918 | f-lx-008 | 筹刊失败先于 1918 投稿决策 | **formal_episode_chain（QA 质询项：原依据「自序叙述顺序」已降为辅助；主要依据为 1906 outcome 层 + 1918 prior_path + episode 链，但最终同源 1922 自述，仍属本卡最弱证据）** | ☐ 认可 ☐ 驳回 |

> 若驳回 f-lx-008：重跑 `node scripts/trajectory-v0.1/run-pipeline.mjs data/trajectory-v0.1/cards/lu-xun.card.json`，
> snap-lx-1918 视图中 new_path_validation / resource_access 将自动回到 null。

## 3. 匹配维度抽查（三视图）

| 维度 | 1902 | 1906 | 1918 | 重点 |
|---|---|---|---|---|
| life_stage | transition | student | null | 1918 的 null 是否认可（1906—1918 缺口） |
| path_investment | medium | high | medium | 锚点是否符合 §3 锚点表 |
| economic_pressure | null | null | null | 确认「不默认中等」的处理 |
| new_path_validation | none | none | tried | 1906「自序回顾不算决策前验证」的判定 |
| reversibility | medium | low | medium | 均来自正式 decision_state 建模（modeling_basis） |
| time_window | 建模 | null | null | null 的理由是否成立 |

## 4. 审查范围声明（签字时填写）

```text
reviewed_by:（真人姓名/GitHub 账号）
reviewed_on:（日期）
scope:（如：全部 15 事实 + 3 条 explicit_order + 3 视图十维）
结论:（approved / 维持 pending 并列问题）
```

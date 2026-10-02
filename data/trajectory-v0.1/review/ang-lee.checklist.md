# 人工审查清单 · card-ang_lee-v0.1（v0.1）

> 必须由人完成；逐项核对后在卡内 `review.human_review` 填 approved 并写 reviewed_by/on/scope。顺序依赖事实的裁决见 [weak-order-evidence.md](weak-order-evidence.md)（本卡 2 条）。

## 来源（2 个）

- ☐ AL-NYU（NYU Tisch 页）：1984 MFA 表述在页
- ☐ AL-INTERVIEW（澎湃转载访谈）：「毕业后六年」「1990 年剧本比赛」「推手」表述在文；确认访谈未声称「六年无正式工作」

## 关键事实（9 条，重点 5 条）

| fact | 主张 | 核对 | 结果 |
|---|---|---|---|
| f-al-001 | 1984 年 NYU 电影 MFA | 年份 | ☐ |
| f-al-003 | 约六年间项目屡屡未能成行（**纯决策前处境，不含获奖**——QA 修复后拆分） | 「约六年」的口径与正式库修订（不得扩大为六年无工作） | ☐ |
| f-al-005 | 1990 投台湾剧本赛 | 事件 | ☐ |
| f-al-008 | 1990 两部剧本获奖（**结果层**：投稿之果，确认未进 snap-al-1990 prior） | 因果方向：投稿是因、获奖是果 | ☐ |
| f-al-006 | 获《推手》拍摄机会 | 「机会」表述（NYU 页首片年份 1990 与访谈 1991 的差异已在 notes 说明） | ☐ |

其余：f-al-000（身份）、f-al-002（起初未获执导）、f-al-004（继续写剧本）、f-al-007（后续多部长片）。☐

## 因果倒置回归检查（QA 2026-10-02）

- ☐ `view-0.1-ang_lee-snap-al-1990` 的 prior_text 含「六年间项目屡」且**不含「获奖」**
- ☐ snap-al-1990 各维度 raw_text/anchor_note 无「获奖」字样
- ☐ f-al-008 同时挂在 ev-al-1984（mid_term 结果）与 ev-al-1990（short_term 结果）的 outcome_fact_ids

## 维度抽查

| 维度 | 1984 | 1990 | 重点 |
|---|---|---|---|
| economic_pressure | null | null | 确认「家庭收支未核实、修订已删除无出处断言」的处理 |
| path_investment | high | high | MFA=多年度训练锚点 |
| new_path_validation | none | tried | 1990 的 tried 指「原渠道六年负向体验」 |
| time_window | null | null | 不虚构比赛 deadline |

## 签字

```text
reviewed_by: / reviewed_on: / scope: / 结论:
```

# trajectory-v0.1 · 工作线 B 交接（Damn4lee）

> 离线人物轨迹卡制作模块。本目录是 B 的实现交接与变更建议；契约见
> `.agent/handoffs/agent-cards-v0.1/02-two-person-work-packages.md` §3。

## 文档索引

| 文件 | 内容 |
|---|---|
| [b0-candidates-audit.md](b0-candidates-audit.md) | 阶段一审计：三场景候选、首卡选择依据、缺口、接口差异 |
| [handoff-2026-10-02-b1-first-card.md](handoff-2026-10-02-b1-first-card.md) | B1 首卡交接记录（命令、结果、pending、下一步） |
| [CHECKIN-draft.md](CHECKIN-draft.md) | 给协调人直接发布的 CHECKIN 文本（B 线尚无对应 Issue） |

## A 如何接入（5 分钟）

```bash
# 1. 校验并查看首卡（离线，无依赖）
node scripts/trajectory-v0.1/validate-card.mjs data/trajectory-v0.1/cards/lu-xun.card.json

# 2. 读取在线侧要用的检索视图（3 个决策前节点，逐条对应正式 episode_id）
#    data/trajectory-v0.1/retrieval-views/card-lu_xun-v0.1.views.json
#    每条 view：view_id / person_id / episode_id / snapshot_id / decision_time /
#              prior_fact_ids / prior_text / dimensions(十维) / root_factors /
#              institutional_context / evidence_refs / coverage / review_status

# 3. 跑 B 的测试（21 项，全部离线）
node --test scripts/trajectory-v0.1/test/trajectory.test.mjs

# 4. 覆盖与缺口报告
#    data/trajectory-v0.1/manifest.json
```

## A 需要裁决的事

1. §3 契约的 4 处实现差异（见 b0-audit §5：scenario / none 语义 / modeling_basis / 附加字段）。
2. 视图 `review_status=pending` 的试验用法是否接受（未审核视图只能进隔离试验数据源）。
3. 时间审计文件的复核定式：`audits/*.temporal-audit.json` 的 explicit_order 条目需人工复核（清单已列）。
4. 扩卡顺序确认（b0-audit §3 建议：李安 → 村上 → 达尔文/格登）。

## 边界承诺（已执行）

- 只新增 `data/trajectory-v0.1/`、`scripts/trajectory-v0.1/`、`.agent/handoffs/trajectory-v0.1/` 三个目录；未改 src/server/正式数据/validator/根配置/锁文件。
- 无新增依赖；脚本只用 Node 内置模块，全离线可跑，不读任何 key。

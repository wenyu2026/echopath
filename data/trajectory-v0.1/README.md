# trajectory-v0.1 · 离线人物轨迹卡（试验数据源）

> 工作线 B（Damn4lee）的隔离模块。契约：`.agent/handoffs/agent-cards-v0.1/02-two-person-work-packages.md` §3（v0.1）。
> **不进入正式排名，不混合旧评分**；正式 `data/episodes.json / sources.json / review.json / mechanisms.json` 与原 validator 未改动。

## 目录

```
cards/                  PersonCard（每卡一文件；lu-xun.card.json 为首张样卡）
sources.json            来源登记：卡片级定位、资料形成时间、用途（主数据仍在正式 sources.json，交叉核对）
schema/                 PersonCard / RetrievalView v0.1 JSON Schema（文档性；可执行权威在 scripts/trajectory-v0.1/lib/）
retrieval-views/        导出的决策前视图（生成物，提交入库供 A 直接读取）
audits/                 时间边界检查审计（每次导出重新生成，逐事实可复核）
manifest.json           试验 manifest：卡片清单、场景覆盖、partial 缺口、审核状态
review/                 人工审查清单（逐事实/逐维度；AI 不代签）
fixtures/               synthetic 测试素材（SYN- 前缀；不进正式候选）
pipeline/state/         流水线检查点（可恢复；不含时间戳，导出确定性不受影响）
```

## 使用

```bash
# 校验一张卡（离线）
node scripts/trajectory-v0.1/validate-card.mjs data/trajectory-v0.1/cards/lu-xun.card.json

# 流水线：校验 → 时间审计 → 导出视图 → 更新 manifest（离线）
node scripts/trajectory-v0.1/run-pipeline.mjs data/trajectory-v0.1/cards/lu-xun.card.json

# 测试（21 项正反例）
node --test scripts/trajectory-v0.1/test/trajectory.test.mjs
```

中断后重跑同一命令即从最近成功检查点继续；固定输入重复导出逐字节一致。

## 数据纪律（摘要）

- 每个维度 `value/raw_text/kind/evidence_refs/confidence/valid_time/unknown_reason`；未知 `value=null, confidence=null`，必须写 unknown_reason，**不填默认中等**。
- 分档（low/medium/high）是建模标签，kind=inference；原文与证据保留在 `raw_text` 与事实引用里。
- `retrospective`（人物后来的自我解释）禁止进入决策前快照与视图。
- 时间边界按**事实发生区间**判断：完全早于决策才合格；同年或区间未知需引用支持的 `explicit_order`；明确晚于决策 = 校验失败。资料形成时间另存（sources.json `formed_time`），出版晚不作为排除依据。
- 机制 `archetype/root_factors` 复用 `src/types/landscape.ts` 词表，与 `choice.type` 分开，不相互覆盖。
- 机器校验通过 ≠ 人工审核；缺真人签字一律 pending。

## 当前状态

- **六张卡全部交付**：鲁迅（15 事实/4 快照/3 事件，三场景全覆盖）+ 李安、村上春树、达尔文、考里科、乔布斯（均如实标 partial 并列资料缺口）。合计 19 个决策前检索视图。
- 三场景各 ≥2 个可参考候选（manifest.json scenario_coverage：转专业 4、考研就业 4、大厂小厂 6），second_candidate_pending 全部 false。
- 走法覆盖：persist（李安 1984、考里科 1995）、dual_track（村上 1978、乔布斯 1972/1985）、abandon（乔布斯 1972）、direct_switch、explore_then_switch；explore_then_persist 在机制层（鲁迅 1902）。
- **QA 加固（2026-10-02）**：explicit_order 全部改用受控依据词表（logical_precondition > formal_episode_chain > cross_source_consistency > source_narrative_order）并带 human_adjudication；顺序依赖事实在视图中单列 temporal_caveats，has_pending_order_review=true 的视图不得进正式排名。全部 11 条顺序依赖事实待真人裁决（review/weak-order-evidence.md）。
- 机器校验全部通过；**人工审核全部 pending**（AI 不代签）。

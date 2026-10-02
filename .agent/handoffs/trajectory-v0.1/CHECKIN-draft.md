# CHECKIN 草稿（已执行 · 存档）

> **2026-10-02 更新**：经协调人授权（「按当前六卡+修复状态请求交付」），B 线 Issue 已由执行人自建：
> **Issue #32**（含 CHECKIN 与 DONE 评论），交付 PR 为 **#33**（目标 wenyu2026/landscape-demo，agent:review，Review 给 @wenyu2026）。
> 以下为当时准备的草稿原文，留作记录。

> B 线（trajectory-cards）目前没有对应 Issue。按约定不冒用他人身份领任务，
> 以下文本供协调人（A）建 Issue 后直接粘贴为 Damn4lee 的 CHECKIN 评论；
> Issue 建议标题：「[B线·离线人物轨迹卡] 首卡 + 离线校验/导出链路（B0–B2）」。

```text
CHECKIN
负责人：Damn4lee
分支：Damn4lee/trajectory-cards-v01（自 fu6868/agent-card-handoff @ 2af6b0c 切出）
计划：按 .agent/handoffs/agent-cards-v0.1/02-two-person-work-packages.md 工作线 B 执行。
  拟改路径（仅三个隔离目录）：data/trajectory-v0.1/**、scripts/trajectory-v0.1/**、.agent/handoffs/trajectory-v0.1/**。
  不会修改：src/**、server/**、data/episodes.json、sources.json、review.json、mechanisms.json、
    data/validate-data.test.mjs、scripts/validate-data.mjs、根配置、package-lock.json、原 S1 脚本。
  契约版本：PersonCard / RetrievalView v0.1（工作包 §3）；A 正式化公共类型后对齐。
  依赖：B1 导出后 A 做一次在线读取验证；A1 类型冻结后 B 同步校验器。
  风险：首卡事实数在下限（15）；explicit_order 三条需人工裁决；S1 材料缺失只影响 B4 对照。
  与 #28 的边界：#28 是正式库扩容（fu6868），本模块全部产物在 trajectory-v0.1 试验数据源内，
    不写正式数据，不冒称 #28 进度。
预计：首卡+校验/导出/测试已可交付（小步提交）；六卡扩展开 A 确认接口差异后进行。
```

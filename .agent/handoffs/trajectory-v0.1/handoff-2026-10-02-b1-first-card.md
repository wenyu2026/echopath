# B1 交接记录 · 首张端到端人物卡（2026-10-02）

```text
工作线 / 负责人：B / Damn4lee（账号 Damn4lee，原 C AI/后端；本模块经工作包 §2 授权，未动他人责任区）
分支 / 提交：Damn4lee/trajectory-cards-v01（基线 fu6868/agent-card-handoff @ 2af6b0c）/ 见 git log
契约版本：PersonCard / RetrievalView v0.1（工作包 §3 文字契约；A 正式化后对齐）
```

## 本次产物与文件

| 文件 | 说明 |
|---|---|
| `data/trajectory-v0.1/cards/lu-xun.card.json` | 首卡（鲁迅）：15 事实 / 4 快照（含 1 中间状态）/ 3 事件 / 3 机制 / 4 条 explicit_order / 5 条 card unknowns |
| `data/trajectory-v0.1/sources.json` | 来源登记：5 个正式来源的卡片级定位 + formed_time；与正式库交叉核对 |
| `data/trajectory-v0.1/schema/*.schema.json` | PersonCard / RetrievalView v0.1 JSON Schema（文档性） |
| `data/trajectory-v0.1/retrieval-views/card-lu_xun-v0.1.views.json` | 3 个决策前视图（1902/1906/1918），A 可直接读取 |
| `data/trajectory-v0.1/audits/card-lu_xun-v0.1.temporal-audit.json` | 时间边界审计（逐事实判定，可复核） |
| `data/trajectory-v0.1/manifest.json` | 试验 manifest + 三场景覆盖报告（第二候选 pending 如实标记） |
| `data/trajectory-v0.1/review/lu-xun.checklist.md` | 人工审查清单（逐事实/explicit_order/维度） |
| `data/trajectory-v0.1/fixtures/` | synthetic 测试素材（卡 + 独立来源登记） |
| `data/trajectory-v0.1/README.md` | 数据模块说明 |
| `scripts/trajectory-v0.1/lib/contract.mjs` | 契约常量（词表复用 src/types/landscape.ts） |
| `scripts/trajectory-v0.1/lib/validate.mjs` | 校验器：引用闭合 / 重复 ID / 十维与词表 / 未知纪律 / retrospective 排除 / 晚于决策硬错误 / partial / 审核状态 |
| `scripts/trajectory-v0.1/lib/export.mjs` | 导出器：时间门槛（tc-0.1）+ 视图生成 + coverage；确定性 |
| `scripts/trajectory-v0.1/lib/pipeline.mjs` | 流水线：load→validate→export→write→manifest；检查点（临时文件+替换）；失败不落盘 |
| `scripts/trajectory-v0.1/validate-card.mjs` `run-pipeline.mjs` | CLI |
| `scripts/trajectory-v0.1/import-facts.mjs` | 无密钥人工录入/已有事实导入（稳定 ID：现有最大序号+1，同文跳过） |
| `scripts/trajectory-v0.1/prompts/fact-extraction.md` | 抽取提示词模板 v0.1 |
| `scripts/trajectory-v0.1/test/trajectory.test.mjs` | 21 项正反例测试 |
| `.agent/handoffs/trajectory-v0.1/` | 本目录（审计/交接/CHECKIN） |

## 已实现功能（对照工作包 B0–B2）

- **B0 审计**：三场景候选、来源可用性、缺口与接口差异（b0-candidates-audit.md）。
- **B1 单卡**：鲁迅卡端到端（来源→事实→时间线→决策前状态→机制→检索视图）；正式 episode_id 原样引用；未改主库。
- **B2 工具（最小可用）**：校验器、导出器、检查点流水线、无密钥导入路径、提示词模板。阶段二的模型抽取执行环节未接入在线网关（当前无需要——首卡全部事实来自正式库已核材料）；接入时复用仓库网关配置，不硬编码 key。

## 实际执行的命令与结果（本机 Node v24.14.0，全部离线）

| 命令 | 结果 |
|---|---|
| `node scripts/trajectory-v0.1/validate-card.mjs data/trajectory-v0.1/cards/lu-xun.card.json` | PASS：errors=0 warnings=0，stats {facts:15, snapshots:4, events:3} |
| `node scripts/trajectory-v0.1/run-pipeline.mjs data/trajectory-v0.1/cards/lu-xun.card.json --force` | OK：生成 3 视图 + 时间审计 + manifest |
| `node --test scripts/trajectory-v0.1/test/trajectory.test.mjs` | 21/21 通过（含：悬空引用/重复 ID/无证据维度/retrospective 排除/晚于决策拒绝/同年门槛/改未来不变/后发资料不误杀/导出一致/检查点恢复/失败不进 manifest/pending 保持） |
| `node scripts/trajectory-v0.1/import-facts.mjs scripts/trajectory-v0.1/examples/facts-import-demo.json` | OK：同文跳过 1 条、新事实获稳定 ID f-lx-015；未登记来源整批拒绝（已验） |
| `node scripts/validate-data.mjs`（仓库既有，只读运行） | PASS：36 条；未改动（确认无副作用） |
| `node --test data/validate-data.test.mjs`（仓库既有） | 26/26 通过 |
| `npm test` / `npm run build` | **未运行**：worktree 无 node_modules 且本模块不触任何被测/构建路径；按约定在线集成部分由 A 执行（npm run preflight 在线部分、浏览器演示同理） |

## 卡片与来源审核状态

- 机器校验：**pass**（见 manifest.cards[0].machine_check）。
- 人工审核：**pending**（无真人签字；清单 data/trajectory-v0.1/review/lu-xun.checklist.md，AI 不代签）。
- 3 条 explicit_order 提交人工裁决（1902 毕业→决策、1906 在学→离校、1918 筹刊失败→投稿，依据分别为前提关系×2、自序叙述顺序×1）。

## 证据缺口与 pending 项

1. 事实数 15 为目标下限；1906—1918 状态、出生年无出处（卡 unknowns 已列）。
2. LX-MUSEUM 深链 404，十四篇小说定位仅站点首页（已降 confidence=medium）。
3. S1 对照材料未上传——B4 记录缺口（需 S1 人物清单/事实来源定位表/决策节点定义），不阻塞 B1。
4. 每场景第二候选 pending（扩卡阶段）。
5. 接口差异 4 处待 A 裁决（b0-audit §5）。

## 是否改变公共接口

否。未改 src/types、server、正式数据与原 validator；所有新增字段都在 data/trajectory-v0.1 产物内，A 正式化时可裁定去留。

## 需要另一方（A）做什么

1. 读 `retrieval-views/card-lu_xun-v0.1.views.json`，用任一在线匹配原型跑一次「决策前视图 → 路径」读取验证（B1 成功标准）。
2. 对 4 处接口差异给出裁决；A1 类型冻结后 B 同步校验器与导出器。
3. 安排真人按清单完成首卡审查（或明确本阶段不审）。
4. 确认 PR 目标分支（默认 wenyu2026/landscape-demo）后再 push/PR。

## 下一步与最近成功检查点

- 最近成功检查点：`data/trajectory-v0.1/pipeline/state/card-lu_xun-v0.1/manifest.json`（阶段五全过）。
- 下一个检查点：B2 补全（模型抽取阶段接网关的执行器 + 多卡批量流水线）→ B3 扩卡（建议顺序：李安 → 村上 → 达尔文/格登），每张先过校验再入 manifest；S1 材料到位后做 B4 对照。

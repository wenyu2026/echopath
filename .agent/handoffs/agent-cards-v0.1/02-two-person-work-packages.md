# 两人工作包、接口约定与集成顺序

日期：2026-10-02；基线：wenyu2026/landscape-demo @ 727a997。

本文是本轮交接的共同约定，代码尚未实现。工作线 A/B 不等于 AGENTS.md 的旧四人角色；另一人的 GitHub 账号尚未指定，不冒认其账号或代其领取任务。

## 1. 留在你这一边：工作线 A

| 编号 | 工作 | 交付 | 依赖 |
|---|---|---|---|
| A1 | 维护公共契约与字段字典 | UserState / PersonCard / RetrievalView v0.1 的共同类型、测试样例 | 先按本文；跨区由原 owner 协调 |
| A2 | 动态访谈 | 有来源的状态、矛盾/跳过/重问、确认与纠正 | A1；可先用约定假数据 |
| A3 | 匹配与路径 | 只用决策前视图，全量比较，人物→节点，分数+覆盖率，原聚类保留 | A1、B1 单卡导出 |
| A4 | 页面功能可靠性 | 确认、刷新恢复、重试、忽略旧响应、离线入口 | A2/A3；不做视觉改版 |
| A5 | 集成与验收 | 18 个情景、快照更新、全链路、公共契约与 null 兼容 | B 提交卡片与证据样例 |

在线实现涉及 server、src/state、src/pages/components 与共享类型，不能当作原数据责任区的默认扩权。由用户统筹既有 owner 的修改/审查，不要求 B 顺手修改这些区域。

## 2. 整块交出去：工作线 B

| 编号 | 工作 | 必须交付 | 成功标准 |
|---|---|---|---|
| B0 | 资料与接口审计 | 候选清单、来源可用性、字段缺口、拟修改范围 | 能区分已有事实/建模/未知 |
| B1 | 一张端到端卡 | 来源、事实、快照、事件引用、机制、检索视图、校验报告 | A 能读取同一份 JSON 并跑一次匹配 |
| B2 | 离线制作工具 | 输入验证、分阶段检查点、稳定 ID、导出器、校验器 | 重跑一致，中断可恢复，失败不生成可发布结果 |
| B3 | 六张卡 | 三场景各至少两个候选，逐字段引用与人工待审清单 | 允许 partial，不凑事实数量、不冒充审核 |
| B4 | S1 对照 | 1–2 张对照或明确材料缺口报告 | 与正式排名隔离；无本地原稿不阻塞 B1 |
| B5 | 交接 | 运行命令、测试结果、限制、文件清单、复现步骤 | A 不需要阅读聊天即可接入 |

B 的拟新增工作目录（实现前先查是否已存在/已有人占用）：

- `data/trajectory-v0.1/`：卡片、sources、检索视图、schema、manifest、测试 fixtures；测试数据明确标为 synthetic，不进入正式候选。
- `scripts/trajectory-v0.1/`：离线抽取/校验/导出与测试；默认不新增依赖，直接沿用当前 Node/TS 能力。
- `.agent/handoffs/trajectory-v0.1/`：B 的实现交接与变更建议。

B 不修改正式 episodes/sources/review/mechanisms、原 validator、src、server、根配置、锁文件或原 S1 构建脚本。需要这些改动时交给 A 协调 owner。新正式 Episode 先产出候选，不私自入库。

## 3. 两边必须使用的接口约定

### 版本、身份与时间

- 顶层 `schema_version: "0.1"`；产物另有 `artifact_type`，值为 user_state、person_card 或 retrieval_view。
- 人物、事件、快照、事实、来源 ID 稳定；正式 episode_id 原样复用。每条 view 对应一个 person_id + episode_id + snapshot_id，不能是一份全生平文本。
- 日期保存可比较的年份区间 `{start_year, end_year}`，未知为 null，允许公元前年份。只有年份时不能假定同年事件的先后；同年事实要有引用支持的 explicit_order，缺顺序则不进入该决策前视图。
- 时间边界由事实的发生区间和显式顺序证明，不用出版日期代替。来源发布日期另存，不参与简单的“必须早于决策”筛选。
- 缺失 result 用 null 的正式契约变更由 A 协调；B 的新视图不依赖结果参与匹配。

### 维度与信息性质

十个固定键：life_stage、prior_path、path_investment、economic_pressure、family_responsibility、resource_access、goal_structure、new_path_validation、reversibility、time_window。

每个维度保存 `value`、`raw_text`、`kind`、`evidence_refs`、`confidence`、`valid_time`、`unknown_reason`。未知：value=null，confidence=null，必须有 unknown_reason；不写“中等”代替未知。

| 字段 | value 的 v0.1 形式 |
|---|---|
| life_stage | student / early_career / established / transition / other，或 null |
| prior_path | 受控标签数组（如 study、work、research、business、trial），或 null；具体经历另存 prior_fact_ids |
| path_investment | low / medium / high，或 null |
| economic_pressure | low / medium / high，或 null |
| family_responsibility | low / medium / high，或 null |
| resource_access | 标签数组（funding、skills、credentials、mentor、institution、family_support、network），或 null |
| goal_structure | 标签数组（stability、income、interest、autonomy、growth、impact、family），或 null |
| new_path_validation | none / indirect / tried / sustained，或 null |
| reversibility | low / medium / high，或 null |
| time_window | `{description, deadline_year: number|null}`，或 null |

三档是建模标签，不是史实本体；原文与证据必须保留。初始锚点：投入 high 表示多年度专业训练/长期事业绑定，medium 为已有持续尝试但仍有退出空间，low 为刚开始；经济压力 high 表示有明确的近期基本生活/债务/供养压力，medium 为明确的过渡期限制，low 为有证据的缓冲；责任 high 为明确主要供养/照护，medium 为明确部分责任，low 为明确较少责任，未知家庭信息不能标 low；可逆性按有无明确返回通道、重建代价和资格限制判断，无材料则 null。B 不将古人的制度直接等同于现代学校/雇佣制度。

人物 kind 使用 fact / inference / retrospective；用户 kind 使用 self_report / inference / confirmed_inference。人物的分档判断通常为 inference，即使支持它的原子事实可靠。用户推断在确认前不进入可靠匹配。confidence 为 high / medium / low 的证据支持程度，不是历史真相概率。人物 retrospective 不进入决策前匹配。

机制的 archetype 和 root_factors 必须复用当前 `src/types/landscape.ts` 的现有词表；不另创冲突枚举，不覆盖 choice.type。

### RetrievalView 最小字段

`schema_version, artifact_type, view_id, person_id, episode_id, snapshot_id, decision_time, prior_fact_ids, prior_text, dimensions, root_factors, institutional_context, evidence_refs, coverage, review_status`。

- prior_text 仅由已通过时间检查的 prior_fact_ids 生成；不可拼完整传记、未来结果、后来荣誉。
- 维度引用可追溯到事实与具体来源定位，未解析引用必须报错。
- coverage 记录已知字段及证据情况，不由卡片制作方替在线系统计算用户相关分数。
- review_status 如实 pending / approved；approved 需要真人、时间、审核范围。机器校验通过不自动改成 approved。
- 未人工审核的产物可供隔离试验验证，但必须显式标识；不能以 Gold/已核验身份进入正式发布。

### 改动协议

这些是实现起点，不是已经生成的运行时类型。A 将约定正式化为公共类型/Schema 和一份正常、一份未知、一份时间违规样例，B 同步自己的读写校验。B 可先按本文准备资料和导出草稿；在 A/B 对同一份样例确认前，不批量生成六张。

修订只由 A 汇总成新的明确版本，并同时更新样例、生产方和消费者。禁止双方分别解释同一个字段；不能用“JSON 能解析”替代契约验收。

## 4. 分支、提交与联调

1. 文档获取分支为 `fu6868/agent-card-handoff`。A/B 都从包含该交接包的已知基线建立自己的分支，不共同修改文档分支。
2. 先完成 A1 与 B1，双方用同一个文件跑通读取和匹配，再继续 B2/B3 与 A2/A3。
3. 原有演示功能修复与新人物卡实验分开；新链路通过独立数据源接入，不静默混合旧评分。
4. 每次提交前、提 PR 前、宣称完成前，检查 blocked、mentions、当前 Issue/PR；无 gh 可用时使用等价 GitHub API。对齐已有 #28 的扩容任务，另起实验模块不冒称 #28 完成。
5. 按文件逐项暂存，提交前看 diff；不上传 env、密钥、LOCAL_AI.md、未经整理的 S1 原稿或本地模型日志。package-lock.json 仍仅由原 owner 提交。
6. PR 目标为本轮约定的演示集成分支，描述写清证据、命令、失败项和跨区依赖；人类 merge，不强推共享分支。

## 5. 验收与每日交接

B 离线验收必须包含：版本/引用检查、稳定 ID、缺材料保留未知、同年顺序不确定不通过、未来事实注入拒绝、改未来 outcome 不改变 prior view、重复导出一致、检查点中断恢复。还要检查 schema 通过而语义未审的状态保持 pending。

A 增加在线匹配、纠正与恢复测试，使用每场景六个情景（共十八个），其中十二个调试、六个封存验收。B 提供人物与事件的可参考集合、来源和不可比因素，由 A 汇总预期；不得拿未来成败制定“正确选择”。

每个交接至少填写：

```text
工作线 / 负责人 / 分支 / 提交：
契约版本：
本次产物与文件：
实际执行的命令、结果与未运行原因：
证据缺口与 pending 项：
是否改变公共接口：
需要另一方做什么：
下一步与最近成功检查点：
```

离线期间保存本地设计、检查点和 Git commit，联网再 push；本地记忆各工作线单独维护，A 汇总。任何只在聊天中出现的接口决定都需补到共享记录。

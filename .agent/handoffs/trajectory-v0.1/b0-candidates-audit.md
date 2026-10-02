# B0 · 资料与接口审计（阶段一）

负责人：Damn4lee（工作线 B）｜日期：2026-10-02｜契约：agent-cards v0.1（工作包 §3）
基线：fu6868/agent-card-handoff @ 2af6b0c；正式库 36 episodes / 18 人 / 36 外部来源 + 1 建模说明。

## 1. 三场景正式候选（人物 × episode × 来源可用性）

按 `retrieval_tags` 归场景；「来源状态」指 data/sources.json 的 locator 粒度与已知局限。

### 转专业（9 条事件 / 7 人）

| episode_id | 人物 | 走法(choice/archetype) | 来源状态 |
|---|---|---|---|
| lu_xun_1906_medicine_to_literature | 鲁迅 | direct_switch/direct_switch | 优（机构页+自序；人工核对记录在 data/README.md 种子修订） |
| darwin_1825_medicine_trial | 达尔文 | direct_switch/explore_then_switch | 良 |
| darwin_1828_cambridge | 达尔文 | direct_switch/direct_switch | 良 |
| jobs_1972_reed_dropout | 乔布斯 | abandon/dual_track | 良 |
| nusslein_1962_test_medicine | 纽斯莱因-福尔哈德 | explore_then_persist | 良 |
| nusslein_1964_biochemistry | 纽斯莱因-福尔哈德 | direct_switch | 良 |
| ramakrishnan_1976_biology_training | 拉马克里希南 | direct_switch/explore_then_persist | 良 |
| gurdon_1953_zoology | 格登 | direct_switch | 良 |
| gurdon_1960_caltech_offer | 格登 | direct_switch/explore_then_switch | 良 |

### 考研还是就业（11 条 / 8 人）

| episode_id | 人物 | 走法 | 来源状态 |
|---|---|---|---|
| lu_xun_1902_study_japan | 鲁迅 | direct_switch/explore_then_persist | 优 |
| ang_lee_1984_six_years_persist | 李安 | persist/persist | 优（NYU+访谈，种子修订记录） |
| may_1974_pause_phd / may_2006_resume_phd | 布赖恩·梅 | direct_switch/dual_track；dual_track/dual_track | 良 |
| kariko_1995_persist_cost | 考里科 | persist/persist | 良 |
| darwin_1831_beagle | 达尔文 | explore_then_switch/direct_switch | 良 |
| ramakrishnan_1978_yale_postdoc | 拉马克里希南 | explore_then_switch/direct_switch | 良 |
| arnold_1981_phd / arnold_1987_caltech_faculty | 阿诺德 | direct_switch；explore_then_switch | 良 |
| einstein_1902_patent_and_research / einstein_1909_academic_post | 爱因斯坦 | dual_track；direct_switch | 良 |

### 大厂还是小公司/创业（16 条 / 12 人）

| episode_id | 人物 | 走法 | 来源状态 |
|---|---|---|---|
| lu_xun_1918_write_new_youth | 鲁迅 | explore_then_switch/explore_then_persist | 优（自序叙述链完整） |
| murakami_1978_bar_and_writing / murakami_1981_fulltime_writing | 村上春树 | dual_track；explore_then_switch | 优（本人文章，种子修订记录） |
| ang_lee_1990_script_competition | 李安 | explore_then_switch | 优 |
| bezos_1994_leave_finance | 贝索斯 | direct_switch | 良 |
| jobs_1985_restart | 乔布斯 | direct_switch/dual_track | 良 |
| kariko_2013_biontech | 考里科 | direct_switch | 良 |
| ramakrishnan_1999_lmb | 拉马克里希南 | direct_switch | 良 |
| dyson_2014_ev_entry / dyson_2019_abandon_ev | 戴森 | dual_track；abandon | 良（含负面结果） |
| butterfield_2012_close_glitch / butterfield_2013_slack_pivot | 巴特菲尔德 | abandon；explore_then_switch | 良（含失败止损） |
| yuan_2011_zoom | 袁征 | direct_switch | 良 |
| blakely_2000_spanx | 布莱克利 | explore_then_switch/dual_track | 良 |
| kafka_1908_insurance_and_writing / kafka_1923_berlin | 卡夫卡 | dual_track；direct_switch | 良 |

## 2. 首卡选择：鲁迅（card-lu_xun-v0.1）

依据：
1. **一卡跨三场景**：1902（考研就业）/ 1906（转专业）/ 1918（大厂小厂/创业）均为正式 episode，事件互不相同，无凑数复用；样卡一次即可验证全部三场景的视图导出。
2. **正式库核对最充分**：1906 是三条种子之一，data/README.md 记录了人工核验与「删除无出处经济困难/家庭紧张断言」的修订——这正是新契约「未知保持 null」需要的历史依据。
3. **来源链完整**：机构来源（东北大学史料馆/东北大学）+ 本人自述（两篇自序）+ 纪念馆条目，5 个登记来源均有 locator；两篇自序相隔 10 年可互校。
4. **时间边界练习齐全**：同年事实（1902 毕业/1906 在学）、未知区间事实（筹办《新生》）、retrospective（自序动机）、后世资料支持早年事实（1932 自述证 1918 事件）——四类门槛分支都有真实样本。

已知代价：事实总数 15 条（目标区间下限）；1906—1918 十二年生活状态为正式库缺口，1918 快照的 life_stage/economic_pressure 等保持 null。

## 3. 扩卡建议（六卡 = 首卡 + 3 人）

| 建议 | 人物 | 覆盖 |
|---|---|---|
| 卡 2 | 李安 | 考研就业（1984 persist）+ 大厂小厂（1990） |
| 卡 3 | 村上春树 | 大厂小厂（1978 双轨 / 1981 专职） |
| 卡 4 | 达尔文 或 格登 | 转专业（1825/1828 或 1953/1960） |

原则：优先扩场景与走法覆盖（abandon/persist 走法目前样卡未覆盖，戴森/巴特菲尔德/考里科可补负面与坚持受损路径）；保留真实代价与未知；每张先过校验再入 manifest。

## 4. 缺口清单（需要 A / 数据 owner 补充）

1. **S1 对照材料缺失**：本地 S1 目录未随交接上传。需要：S1 人物清单、223 事实的来源定位表、61 决策节点定义（可分享部分）。在补齐前 B4 只记录缺口，不凭记忆重建。
2. **LX-MUSEUM 深链 404**：需替代展览页定位（已记入卡 unknowns 与审查清单）。
3. **鲁迅 1906—1918 状态**：如需 1918 快照更完整（职业/经济），需先为正式库补可靠来源（教育部任职等须出处，不据常识写入）。
4. **出生年**：正式库 person 无 birth_year 出处；卡片 birth_year=null。
5. **正式 episode 与新版维度字段对应**：A1 正式化 UserState/公共类型后，B 同步对齐（当前实现按工作包 §3 文字契约）。

## 5. 接口差异记录（实现中发现，需 A 确认）

1. 工作包 §3 未定义 `scenario` 是否进视图——本实现加为视图字段（来自 event.scenario），便于覆盖报告；A 正式化时可删可留。
2. `new_path_validation: "none"` 与「有值必须有证据」规则冲突：本实现把 none 视为缺失性判断，允许无引用但要求 raw_text 说明依据。
3. 正式库建模字段（decision_state.goals/reversibility 等）无原子事实可引：本实现加 `modeling_basis` 字段承接（值来自 review.json inference_fields 的建模层），避免「为凑证据而伪造引用」。
4. 视图新增 `mechanism_note` 与 `synthetic` 字段（说明性/隔离标记），可由 A 裁定去留。

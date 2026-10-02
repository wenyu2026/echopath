# B3 交接记录 · 六卡扩展 + QA 弱证据加固（2026-10-02）

```text
工作线 / 负责人：B / Damn4lee
分支 / 提交：Damn4lee/trajectory-cards-v01 / 见 git log（B1 首卡为 5080595）
契约版本：PersonCard / RetrievalView v0.1 + QA 加固扩展（b0-audit §5b，待 A 并入）
触发：QA 质询 f-lx-008 顺序依据（「拿 1922 年自述叙述顺序定性客观事件」）→ 用户指示回正式库重推导并完成剩余卡片。
```

## B3.1 修复记录 · 李安 1990 视图因果倒置（QA 第二轮，同日）

**问题**（A 端质检发现，定性准确）：`f-al-003` 文本为「约六年间项目屡未成行；至 1990 年两部剧本在比赛中获奖」，整体进入 snap-al-1990 的 prior_fact_ids——投稿是决策行动（因），获奖是评选结果（果），导致 1990 决策前视图出现「未投先获奖」的时间穿越。

**修复**：
1. `f-al-003` 改为纯决策前处境：「据访谈，MFA 毕业后约六年间项目屡屡未能成行，未能获得长片执导机会。」notes 记录修复缘由。
2. 新增结果层事实 `f-al-008`「1990 年，两部剧本在台湾比赛中获奖」（{1990,1990}，AL-INTERVIEW），**禁止进入 snap-al-1990 prior**；同时挂入 ev-al-1984（mid_term 结果）与 ev-al-1990（short_term 结果）的 outcome_fact_ids——两处归位均来自正式库原始字段。
3. explicit_order 说明重写：只论证「六年未果」作为投稿决策的前提，区间终点 1990 由决策年与 episode 链约束，不再以「获奖年」解释。
4. 来源登记：AL-INTERVIEW.used_by_facts 补 f-al-008。**未**按质检指引把它加进 AL-NYU——正式库 field_sources 记 1990 short_term 的来源即 AL-INTERVIEW，且 AL-NYU 的 limitations 明言其年份口径未被采用；登记表不得虚标来源绑定。
5. 回归测试：新增「李安 1990 决策前视图不得剧透获奖结果」——断言 prior_text 保留六年处境、**严格不含「获奖」**、f-al-008 不在 prior_fact_ids、六个维度文字无获奖、**已提交视图文件与从卡重导出逐字节一致**（防改卡不重跑）、f-al-008 挂双事件 outcome 层。

**修复后验证**：validate-card 0 错误（9 事实）；run-pipeline --force 重新生成视图/审计/manifest；测试 27/27；`node --test data/validate-data.test.mjs` 26/26；修复后 snap-al-1990 的 prior_text 实测不含「获奖」。

## 一、QA 弱扣件处置（f-lx-008）

1. **回正式库重推导**：f-lx-008 的 occurred 从 `{null,null}` 收紧为 `{start_year: 1906, end_year: null}`——依据是正式库把该事件记为 lu_xun_1906 的 outcomes.mid_term（决策后结果层，故不早于 1906），不是来自记忆。
2. **顺序依据升级**：explicit_order 从 `source_narrative_order`（自序叙述顺序）改为 `formal_episode_chain`（1906 outcome 层 + 1918 prior_path.0「此前筹办《新生》未能出版」+ next_episode_ids 1906→1918 链），叙述顺序降为辅助。**残余风险如实保留**：三处归位最终同源 1922 年自述，故仍是本卡最弱时间证据，human_adjudication=pending 强制真人复核；若驳回，导出器自动把它挡出视图，new_path_validation / resource_access 自动回 null。
3. **同类排查**：全部六卡共 11 条顺序依赖事实逐条复核，只保留两类依据——解析性前提（状态先于终结，如入学→退学）与 formal_episode_chain；**没有任何一条再以纯叙述顺序放行**（weak-order-evidence.md 有全表）。
4. **机制化**（防止复发）：受控 basis 词表 + human_adjudication 必填 + rejected 强制排除 + 视图 temporal_caveats/order_dependent_fact_ids/has_pending_order_review 显式标注 + manifest 计数；26/26 测试覆盖全部新规则。

## 二、六卡清单（全部机器校验 pass；人工审核 pending）

| 卡 | 人物 | 事实/快照/事件 | 场景 | 走法（choice/archetype） | partial |
|---|---|---|---|---|---|
| lu-xun | 鲁迅 | 15/4/3 | 三场景全 | direct_switch；direct_switch；explore_then_switch | 否（事实数在下限） |
| ang-lee | 李安 | 9/2/2 | 考研就业+大厂小厂 | persist；explore_then_switch | 是（缺口已列） |
| murakami | 村上春树 | 10/3/2 | 大厂小厂 | dual_track；explore_then_switch | 是 |
| darwin | 达尔文 | 12/4/3 | 转专业×2+考研就业 | direct_switch×2；explore_then_switch | 是 |
| kariko | 考里科 | 10/3/2 | 考研就业+大厂小厂 | persist；direct_switch | 是 |
| jobs | 乔布斯 | 12/2/2 | 转专业+大厂小厂 | abandon；direct_switch | 是 |

- 场景覆盖（manifest.json）：转专业 4 候选 / 考研就业 4 / 大厂小厂 6，second_candidate_pending 全部 false。
- 时间门槛产物：19 个决策前检索视图 + 逐事实时间审计（audits/）。
- 视图全部 `review_status=pending` 且 `has_pending_order_review=true`——**仅供隔离试验，不得进正式排名**，直至真人完成 weak-order-evidence.md 的 11 条裁决与各卡清单审查。

## 三、实际执行的命令与结果（Node v24.14.0，全部离线）

| 命令 | 结果 |
|---|---|
| `node scripts/trajectory-v0.1/validate-card.mjs data/trajectory-v0.1/cards/<六卡各一张>` | 六卡全部 errors=0（部分卡带 partial 提示 warning，为设计行为） |
| `node scripts/trajectory-v0.1/run-pipeline.mjs data/trajectory-v0.1/cards/<六卡各一张> --force` | 六卡全部 OK，生成 19 视图 + 审计 + manifest |
| `node --test scripts/trajectory-v0.1/test/trajectory.test.mjs` | 26/26 通过（新增 5 个顺序纪律用例） |
| `node scripts/validate-data.mjs` / `node --test data/validate-data.test.mjs` | PASS / 26 通过（正式库零改动复验） |
| `npm test` / `npm run build` | 未运行（原因同 B1：无 node_modules、不触及其路径，由 A 集成时执行） |

## 四、证据缺口与 pending 项

1. **11 条顺序依赖事实待真人裁决**（weak-order-evidence.md），尤其 B 类 5 条（formal_episode_chain，最终同源单一来源）。
2. 李安/村上/考里科/乔布斯事实数 8–12 < 目标 15–25，均 partial 并列明所需新来源（家庭经济、间隔期经历、年份细节），须先入正式库。
3. 达尔文 1825 视图 prior 仅身份事实（决策前经历无记载）——覆盖报告如实显示，是产品上「覆盖不足→少给参考」的天然测试样例。
4. S1 对照材料仍缺（B4 未启动）。
5. A 尚未裁决 §5/§5b 共 8 项接口事项；A1 类型冻结后 B 同步。

## 五、需要 A 做什么

1. 完成或安排 weak-order-evidence.md 11 条裁决 + 六卡清单审查（或明确本阶段不审，保持 pending）。
2. 对 §5b 契约扩展表态（建议并入 v0.2）。
3. 读取 19 个视图做在线匹配联调（注意 has_pending_order_review=true 的隔离约束）。
4. 确认 PR 目标与推送时机。

## 六、下一个检查点

真人裁决回填 → 各卡 human_adjudication 状态更新 → 重跑流水线（视图自动消化裁决结果）→ S1 材料到位后做 B4 对照。

## 附录 · 覆盖盘点（QA 第二轮要求：检查仓库中尚未制卡的数据）

正式库 36 条 episode，六卡已覆盖 **14 条 / 6 人**，且 6 位人物均为**完整覆盖**（每人名下所有正式 episode 都已进卡，无半人遗漏）。**尚未制卡：22 条 / 12 人**：

| 人物 | 未制卡 episode（年份 / 场景 / 走法） |
|---|---|
| 杰夫·贝索斯 | bezos_1994_leave_finance（1994 / 大厂小厂 / direct_switch） |
| 布赖恩·梅 | may_1974_pause_phd（1974 / 考研就业 / direct_switch）；may_2006_resume_phd（2006 / 考研就业 / dual_track） |
| 詹姆斯·戴森 | dyson_2019_abandon_ev（2019 / 大厂小厂 / abandon，项目止损）；dyson_2014_ev_entry（2014 / 大厂小厂 / direct_switch） |
| 纽斯莱因-福尔哈德 | nusslein_1962_test_medicine（1962 / 转专业 / explore_then_persist）；nusslein_1964_biochemistry（1964 / 转专业 / direct_switch） |
| 拉马克里希南 | ramakrishnan_1976_biology_training（1976 / 转专业）；ramakrishnan_1978_yale_postdoc（1978 / 考研就业）；ramakrishnan_1999_lmb（1999 / 大厂小厂） |
| 弗朗西丝·阿诺德 | arnold_1981_phd（1981 / 考研就业）；arnold_1987_caltech_faculty（1987 / 考研就业） |
| 约翰·格登 | gurdon_1953_zoology（1953 / 转专业，文转理）；gurdon_1960_caltech_offer（1960 / 转专业） |
| 斯图尔特·巴特菲尔德 | butterfield_2012_close_glitch（2012 / 大厂小厂 / abandon，失败止损）；butterfield_2013_slack_pivot（2013 / 大厂小厂 / explore_then_switch） |
| 袁征 | yuan_2011_zoom（2011 / 大厂小厂 / direct_switch） |
| 萨拉·布莱克利 | blakely_2000_spanx（2000 / 大厂小厂 / explore_then_switch） |
| 弗兰茨·卡夫卡 | kafka_1908_insurance_and_writing（1908 / 大厂小厂 / dual_track）；kafka_1923_berlin（1923 / 大厂小厂 / direct_switch） |
| 阿尔伯特·爱因斯坦 | einstein_1902_patent_and_research（1902 / 考研就业 / dual_track）；einstein_1909_academic_post（1909 / 考研就业 / direct_switch） |

**说明**：六卡目标是工作包约定的 v0.1 范围（三场景各 ≥2 候选），已达成；上表 12 人是超出约定的扩展池。若用户要求扩制，B 的优先建议（按走法/情境缺口）：巴特菲尔德（创业失败止损→pivot，abandon+explore_then_switch）、卡夫卡（职场内 dual_track，与村上的自雇双轨互补）、爱因斯坦（考研就业的双轨等待）、布赖恩·梅（暂停/恢复博士的对称对）、格登（文转理）。扩制前建议先补 A 对 §5b 的契约裁决，避免 12 人批量复制未定契约。

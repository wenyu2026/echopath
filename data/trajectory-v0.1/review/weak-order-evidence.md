# 弱时间证据专项清单（QA 2026-10-02 后新增 · 必须真人逐条裁决）

> 背景：QA 质询指出「拿 1922 年单一自述的叙述顺序给客观事件做顺序定性」是最薄弱扣件。
> 处置：契约已加固——explicit_order 一律使用受控依据词表
> （logical_precondition > formal_episode_chain > cross_source_consistency > source_narrative_order），
> 每条带 `human_adjudication`；视图导出时顺序依赖事实单列 `temporal_caveats`，
> `has_pending_order_review=true` 的视图不得用于正式排名。
> **下表是全部顺序依赖事实，真人逐条勾选后回填到各卡 explicit_order.human_adjudication（status/by/on）。**

## A. 解析性前提类（logical_precondition —— 状态先于其终结/接受先于给予，证据较强）

| 卡 | 快照 | 事实 | 前提关系 | 裁决 |
|---|---|---|---|---|
| lu_xun | snap-1902 | f-lx-001（南京学堂完成，1902） | 毕业先于毕业后去向决策 | ☐ confirmed ☐ rejected |
| lu_xun | snap-1906 | f-lx-004（仙台在学 1904—1906） | 在学先于离校 | ☐ confirmed ☐ rejected |
| lu_xun | snap-1831？无 | —— | —— | —— |
| ang_lee | snap-1984 | f-al-001（MFA 1984） | 毕业先于毕业后决策 | ☐ confirmed ☐ rejected |
| murakami | snap-1978 | f-hm-001（经营中） | 在营先于经营去向决策 | ☐ confirmed ☐ rejected |
| darwin | snap-1831 | f-cd-006（剑桥学业完成） | 完成学业先于毕业后探索 | ☐ confirmed ☐ rejected |
| darwin | snap-1831 | f-cd-007（收到邀请） | 收到先于接受 | ☐ confirmed ☐ rejected |
| kariko | snap-1995 | f-kk-001（宾大在职） | 在职先于去留决策 | ☐ confirmed ☐ rejected |
| jobs | snap-1972 | f-sj-001（1972 秋入学） | 入学先于退学 | ☐ confirmed ☐ rejected |

## B. formal_episode_chain 类（正式库 episode 结构归位；最终同源单一来源 —— 本批最弱，QA 针对类）

| 卡 | 快照 | 事实 | 结构依据 | 残余风险 | 裁决 |
|---|---|---|---|---|---|
| lu_xun | snap-1918 | f-lx-008（筹办《新生》未成，start=1906） | 1906 episode outcomes.mid_term + 1918 prior_path.0 + next_episode_ids 链 | 全部归位最终同源 1922 自述；若回忆时序有误，「新生失败在 1918 投稿决策前」仍可能成立（1918 episode prior_path 独立记载），但需人认可该 prior_path 归位的可靠性 | ☐ confirmed ☐ rejected |
| ang_lee | snap-1990 | f-al-003（六年未成行，1984—1990） | 1990 episode prior_path.0 + 1984→1990 episode 链 | 同源单一访谈 | ☐ confirmed ☐ rejected |
| murakami | snap-1981 | f-hm-007（已完成两部小说，1978—1981） | 1981 episode prior_path.0 + 1978→1981 episode 链 | 同源 2015 自述节选 | ☐ confirmed ☐ rejected |
| kariko | snap-2013 | f-kk-006（多年研究+合作成果，至 2013） | 2013 episode prior_path.0 + 1995→2013 链 | 较强：有 1995/1997/2005/2009 带年份中间事实收束 | ☐ confirmed ☐ rejected |
| jobs | snap-1985 | f-sj-007（创办 Apple 至三十岁离开） | 1985 episode prior_path.0 + 1972→1985 链 | 「创办在先」为表述内蕴含 | ☐ confirmed ☐ rejected |

## C. 驳回后果提示

任一 B 类事实被驳回：导出器自动把它挡在决策前视图外，仅由它支撑的维度自动回到
null（unknown_reason=「时间门槛排除全部支撑事实」），视图 `has_pending_order_review` 转为 false，
manifest 的 `order_dependent_facts` 相应减少——不需要改代码，重跑
`node scripts/trajectory-v0.1/run-pipeline.mjs <card>` 即可。

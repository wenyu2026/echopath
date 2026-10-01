/**
 * 离线兜底数据（T5 集成）
 * ============================================
 * 由 server/fixtures/demo-cache-1.json 生成，**不要手改**。
 * 重新生成：npm run build:cache
 *
 * 为什么打包进前端：方案验收清单要求「断网/API 错误时有缓存的 Demo 数据，
 * 保证上台可演示」。演示当天网络不可控，这一层不能省。
 */

import type { RetrievalResponse, Situation } from '../types/episode';

/** 演示问题 1（要不要转专业）的完整检索结果快照 */
export const demoCache: {
  situation?: Situation;
  retrieval?: RetrievalResponse;
} = {
  "situation": {
    "constraints": [
      "已投入两年沉没成本",
      "新方向仅了解两个月",
      "家庭期望值别太高",
      "可接受延毕"
    ],
    "dilemma": "坚持原专业 vs 转向新方向",
    "goals": [
      "满足兴趣",
      "个人成长"
    ],
    "options": [
      "继续读完原专业",
      "申请转专业",
      "辅修或双学位"
    ],
    "reversibility": "medium",
    "risk": "medium",
    "stage": "大三/大四",
    "unknowns": [
      "新方向真实能力匹配度",
      "转专业具体门槛与成功率"
    ]
  },
  "retrieval": {
    "situation": {
      "constraints": [
        "已投入两年沉没成本",
        "新方向仅了解两个月",
        "家庭期望值别太高",
        "可接受延毕"
      ],
      "dilemma": "坚持原专业 vs 转向新方向",
      "goals": [
        "满足兴趣",
        "个人成长"
      ],
      "options": [
        "继续读完原专业",
        "申请转专业",
        "辅修或双学位"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "大三/大四",
      "unknowns": [
        "新方向真实能力匹配度",
        "转专业具体门槛与成功率"
      ]
    },
    "matches": [
      {
        "episode": {
          "episode_id": "may_2006_resume_phd",
          "person": {
            "name": "布赖恩·梅",
            "tags": [
              "考研还是就业",
              "重返研究"
            ]
          },
          "time": {
            "year": 2006,
            "stage": "重返研究"
          },
          "prior_path": [
            "博士研究已中断约三十年；仍从事音乐。"
          ],
          "decision_state": {
            "dilemma": "继续仅做音乐 vs 恢复博士研究",
            "options": [
              "继续仅做音乐",
              "恢复博士研究"
            ],
            "constraints": [
              "需补读多年文献",
              "既有工作仍在继续"
            ],
            "goals": [
              "完成遗留研究",
              "保持音乐活动"
            ],
            "risk": "medium",
            "reversibility": "medium"
          },
          "choice": {
            "type": "dual_track",
            "actions": [
              "2006 年恢复博士研究，整理旧资料并补读文献。"
            ]
          },
          "outcomes": {
            "short_term": "2007 年提交论文并取得博士学位。",
            "mid_term": "未知：所用来源没有系统评估取得学位后数年的机会成本。",
            "long_term": "未知：不能从取得博士学位推断长远收入、幸福或研究影响。"
          },
          "reflection": {
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士恢复依赖原课题仍有价值和学校具体安排，不等同于重新参加统考。",
              "未核实本人对这次选择的直接评价；不补写励志语录。",
              "未知：所用来源没有系统评估取得学位后数年的机会成本。",
              "未知：不能从取得博士学位推断长远收入、幸福或研究影响。"
            ]
          },
          "evidence": [
            {
              "source_id": "BM-LJMU",
              "type": "biography",
              "claim": "2006 恢复和 2007 完成。",
              "url": "https://www.ljmu.ac.uk/about-us/bicentenary/our-people/brian-may/brian-may-profile"
            },
            {
              "source_id": "BM-IMPERIAL",
              "type": "biography",
              "claim": "旧研究材料、文献补读及论文提交。",
              "url": "https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/"
            },
            {
              "source_id": "MODEL-V1",
              "type": "ai_inference",
              "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士恢复依赖原课题仍有价值和学校具体安排，不等同于重新参加统考。"
            }
          ],
          "retrieval_tags": [
            "考研还是就业",
            "dual_track"
          ]
        },
        "dimensions": {
          "stage_match": 0.5,
          "path_match": 0.34182600399804086,
          "dilemma_match": 0.7981532060539982,
          "constraint_match": 0.5,
          "goal_match": 0.5,
          "reversibility_match": 1,
          "difference_penalty": 0.15
        },
        "why_similar": [
          "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
          "【困境结构】双方核心冲突同属「坚持 vs 转向」型（对方当时的困境：继续仅做音乐 vs 恢复博士研究）"
        ],
        "why_different": [
          "【约束差异】你面对「时间与沉没投入」类约束（已投入两年沉没成本、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
          "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
        ],
        "why_different_detail": [
          {
            "text": "【约束差异】你面对「时间与沉没投入」类约束（已投入两年沉没成本、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "kind": "structure",
            "basis": "constraints 对比",
            "refs": [
              "decision_state.constraints"
            ]
          },
          {
            "text": "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
            "kind": "unknown",
            "basis": "数据缺失（episode 无对应字段）"
          }
        ],
        "evidence_layers": {
          "facts": [
            "2006 恢复和 2007 完成。（BM-LJMU）",
            "旧研究材料、文献补读及论文提交。（BM-IMPERIAL）"
          ],
          "self_claims": [],
          "interpretations": [
            "2007 年提交论文并取得博士学位。（outcomes.short_term）",
            "未知：所用来源没有系统评估取得学位后数年的机会成本。（outcomes.mid_term）",
            "未知：不能从取得博士学位推断长远收入、幸福或研究影响。（outcomes.long_term）"
          ],
          "ai_inferences": [],
          "unknowns": [
            "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
            "博士恢复依赖原课题仍有价值和学校具体安排，不等同于重新参加统考。",
            "未核实本人对这次选择的直接评价；不补写励志语录。",
            "未知：所用来源没有系统评估取得学位后数年的机会成本。",
            "未知：不能从取得博士学位推断长远收入、幸福或研究影响。"
          ]
        }
      },
      {
        "episode": {
          "episode_id": "kariko_2013_biontech",
          "person": {
            "name": "卡塔琳·考里科",
            "tags": [
              "大厂还是小公司/创业",
              "学术转产业"
            ]
          },
          "time": {
            "year": 2013,
            "stage": "学术转产业"
          },
          "prior_path": [
            "多年从事 mRNA 研究，已有与 Weissman 的合作成果。"
          ],
          "decision_state": {
            "dilemma": "继续原学术岗位 vs 加入生物技术公司",
            "options": [
              "继续原学术岗位",
              "加入生物技术公司"
            ],
            "constraints": [
              "研究转化需团队",
              "工作地点发生变化"
            ],
            "goals": [
              "推进技术应用",
              "扩大研究协作"
            ],
            "risk": "medium",
            "reversibility": "medium"
          },
          "choice": {
            "type": "direct_switch",
            "actions": [
              "2013 年加入 BioNTech。"
            ]
          },
          "outcomes": {
            "short_term": "进入公司研发团队；2014 年有联合论文发表。",
            "mid_term": "未知：所用声明没有完整披露加入后数年的个人职位与生活成本。",
            "long_term": "2022 年搬回宾夕法尼亚与家人生活，改任外部顾问。"
          },
          "reflection": {
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "这是有长期专业成果的学术转产业案例，不等于应届生大小公司薪酬选择。",
              "未核实本人对这次选择的直接评价；不补写励志语录。",
              "未知：所用声明没有完整披露加入后数年的个人职位与生活成本。"
            ]
          },
          "evidence": [
            {
              "source_id": "KK-ROCK",
              "type": "biography",
              "claim": "入职前研究与合作背景。",
              "url": "https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/"
            },
            {
              "source_id": "KK-BION",
              "type": "biography",
              "claim": "2013 入职、2014 论文、2022 外部顾问。",
              "url": "https://www.biontech.com/int/en/home/mediaroom/news/statements/2023/10/statement-katalin-kariko-and-drew-weissman-awarded-nobel-prize.html"
            },
            {
              "source_id": "MODEL-V1",
              "type": "ai_inference",
              "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。这是有长期专业成果的学术转产业案例，不等于应届生大小公司薪酬选择。"
            }
          ],
          "retrieval_tags": [
            "大厂还是小公司/创业",
            "direct_switch"
          ]
        },
        "dimensions": {
          "stage_match": 0.5,
          "path_match": 0.1009381255272456,
          "dilemma_match": 0.70204516580633,
          "constraint_match": 0.5,
          "goal_match": 0.5,
          "reversibility_match": 1,
          "difference_penalty": 0.15
        },
        "why_similar": [
          "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
          "【困境结构】双方核心冲突同属「坚持 vs 转向」型（对方当时的困境：继续原学术岗位 vs 加入生物技术公司）"
        ],
        "why_different": [
          "【约束差异】你面对「时间与沉没投入」类约束（已投入两年沉没成本、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
          "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是2013 年加入 BioNTech。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
          "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
        ],
        "why_different_detail": [
          {
            "text": "【约束差异】你面对「时间与沉没投入」类约束（已投入两年沉没成本、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "kind": "structure",
            "basis": "constraints 对比",
            "refs": [
              "decision_state.constraints"
            ]
          },
          {
            "text": "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是2013 年加入 BioNTech。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "kind": "structure",
            "basis": "options × choice.actions 对比",
            "refs": [
              "options",
              "choice.actions"
            ]
          },
          {
            "text": "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
            "kind": "unknown",
            "basis": "数据缺失（episode 无对应字段）"
          }
        ],
        "evidence_layers": {
          "facts": [
            "入职前研究与合作背景。（KK-ROCK）",
            "2013 入职、2014 论文、2022 外部顾问。（KK-BION）"
          ],
          "self_claims": [],
          "interpretations": [
            "进入公司研发团队；2014 年有联合论文发表。（outcomes.short_term）",
            "未知：所用声明没有完整披露加入后数年的个人职位与生活成本。（outcomes.mid_term）",
            "2022 年搬回宾夕法尼亚与家人生活，改任外部顾问。（outcomes.long_term）"
          ],
          "ai_inferences": [],
          "unknowns": [
            "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
            "这是有长期专业成果的学术转产业案例，不等于应届生大小公司薪酬选择。",
            "未核实本人对这次选择的直接评价；不补写励志语录。",
            "未知：所用声明没有完整披露加入后数年的个人职位与生活成本。"
          ]
        }
      },
      {
        "episode": {
          "episode_id": "ang_lee_1984_six_years_persist",
          "person": {
            "name": "李安",
            "tags": [
              "考研还是就业",
              "毕业后起步"
            ]
          },
          "time": {
            "year": 1984,
            "stage": "毕业后起步"
          },
          "prior_path": [
            "1984 年获得纽约大学电影制作硕士学位。"
          ],
          "decision_state": {
            "dilemma": "继续电影创作 vs 转入其他工作",
            "options": [
              "继续电影创作",
              "转入其他工作"
            ],
            "constraints": [
              "首部长片机会不足",
              "创作回报延迟"
            ],
            "goals": [
              "争取执导机会",
              "维持创作积累"
            ],
            "risk": "high",
            "reversibility": "medium"
          },
          "choice": {
            "type": "persist",
            "actions": [
              "继续写剧本并寻找电影制作机会。"
            ]
          },
          "outcomes": {
            "short_term": "毕业后起初未能获得长片执导机会。",
            "mid_term": "据访谈，约六年间项目屡未成行；1990 年两部剧本在比赛中获奖。",
            "long_term": "《推手》后继续执导多部长片，纽约大学履历列有后来的获奖作品。"
          },
          "reflection": {
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "这是研究生毕业后的职业进入困境，只能类比继续投入训练与进入就业市场，不能代替考研录取/回报比较。",
              "六年内全部就业记录和家庭收支未核实；删除“六年无正式工作”的断言。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          },
          "evidence": [
            {
              "source_id": "AL-NYU",
              "type": "biography",
              "claim": "1984 年电影 MFA；后续导演履历。",
              "url": "https://tisch.nyu.edu/giving/the-tisch-gala/tisch-gala-2024/ang-lee.html"
            },
            {
              "source_id": "AL-INTERVIEW",
              "type": "interview",
              "claim": "毕业后六年筹片、1990 年比赛和随后拍片。",
              "url": "https://m.thepaper.cn/newsDetail_forward_27605082"
            },
            {
              "source_id": "MODEL-V1",
              "type": "ai_inference",
              "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。这是研究生毕业后的职业进入困境，只能类比继续投入训练与进入就业市场，不能代替考研录取/回报比较。"
            }
          ],
          "retrieval_tags": [
            "考研还是就业",
            "persist"
          ],
          "next_episode_ids": [
            "ang_lee_1990_script_competition"
          ]
        },
        "dimensions": {
          "stage_match": 0.9,
          "path_match": 0.16445549224217473,
          "dilemma_match": 0.7248440175008853,
          "constraint_match": 0.5,
          "goal_match": 0.5,
          "reversibility_match": 1,
          "difference_penalty": 0.45
        },
        "why_similar": [
          "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
          "【阶段】人生阶段接近（对方当时：毕业后起步，? 岁）"
        ],
        "why_different": [
          "【约束差异】你面对「家庭」类约束（家庭期望值别太高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
          "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
          "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
          "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
        ],
        "why_different_detail": [
          {
            "text": "【约束差异】你面对「家庭」类约束（家庭期望值别太高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "kind": "structure",
            "basis": "constraints 对比",
            "refs": [
              "decision_state.constraints"
            ]
          },
          {
            "text": "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "kind": "structure",
            "basis": "options × choice.actions 对比",
            "refs": [
              "options",
              "choice.actions"
            ]
          },
          {
            "text": "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "kind": "era",
            "basis": "ai_inference（模型外部知识）",
            "refs": [
              "time.year"
            ]
          },
          {
            "text": "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
            "kind": "unknown",
            "basis": "数据缺失（episode 无对应字段）"
          }
        ],
        "evidence_layers": {
          "facts": [
            "1984 年电影 MFA；后续导演履历。（AL-NYU）",
            "毕业后六年筹片、1990 年比赛和随后拍片。（AL-INTERVIEW）"
          ],
          "self_claims": [],
          "interpretations": [
            "毕业后起初未能获得长片执导机会。（outcomes.short_term）",
            "据访谈，约六年间项目屡未成行；1990 年两部剧本在比赛中获奖。（outcomes.mid_term）",
            "《推手》后继续执导多部长片，纽约大学履历列有后来的获奖作品。（outcomes.long_term）"
          ],
          "ai_inferences": [
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
          ],
          "unknowns": [
            "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
            "这是研究生毕业后的职业进入困境，只能类比继续投入训练与进入就业市场，不能代替考研录取/回报比较。",
            "六年内全部就业记录和家庭收支未核实；删除“六年无正式工作”的断言。",
            "未核实本人对这次选择的直接评价；不补写励志语录。"
          ]
        }
      }
    ],
    "meta": {
      "candidates_recalled": 36,
      "after_metadata_filter": 32,
      "after_rerank": 3,
      "dropped_by_metadata": 4,
      "forced_diversity": false,
      "elapsed_ms": 328,
      "weights": {
        "stage_match": 0.15,
        "path_match": 0.2,
        "dilemma_match": 0.25,
        "constraint_match": 0.2,
        "goal_match": 0.15,
        "reversibility_match": 0.05
      },
      "parser_elapsed_ms": 3463,
      "parser_tokens": 479
    }
  }
};

/**
 * 离线兜底数据
 * ============================================
 * 由 server/fixtures/demo-cache-*.json 生成，**不要手改**。
 * 重新生成：npm run build:cache（或 npm run refresh:cache 先刷新再生成）
 *
 * 为什么打包进前端：方案验收清单要求「断网/API 错误时有缓存的 Demo 数据，
 * 保证上台可演示」。演示当天网络不可控，这一层不能省。
 *
 * 为什么放多份：只放一份的话，断网时演示场景 2/3 会显示场景 1 的结果 ——
 * 输入和结果对不上比没有数据更糟（看上去像系统串了）。
 * pickScenario() 按字符重叠挑最接近的那份。
 */

import type { RetrievalResponse, Situation } from '../types/episode';

export interface CachedScenario {
  id: number;
  name: string;
  /** 该场景的原始输入，用于与用户实际填写的内容做匹配 */
  raw_input: string;
  situation?: Situation;
  retrieval?: RetrievalResponse;
}

/** 演示场景的完整快照 */
export const demoScenarios: CachedScenario[] = [
  {
    "id": 1,
    "name": "要不要转专业（沉没成本 vs 兴趣）",
    "raw_input": "我已经学了这个专业两年，但越来越觉得不适合自己。我对另一个方向很感兴趣，但现在换是不是太晚？补充：已投入两年；新方向只了解两个月；可以接受延毕；家庭期望别太高；最看重兴趣与成长。",
    "situation": {
      "constraints": [
        "已投入两年沉没成本",
        "新方向仅了解两个月",
        "家庭期望值不高"
      ],
      "dilemma": "沉没成本 vs 新兴趣",
      "goals": [
        "追求兴趣",
        "个人成长"
      ],
      "options": [
        "继续读完本专业",
        "申请转专业",
        "跨专业考研或辅修"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "大二/大三阶段",
      "unknowns": [
        "新方向能力匹配度",
        "转专业具体门槛与成功率"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "已投入两年沉没成本",
          "新方向仅了解两个月",
          "家庭期望值不高"
        ],
        "dilemma": "沉没成本 vs 新兴趣",
        "goals": [
          "追求兴趣",
          "个人成长"
        ],
        "options": [
          "继续读完本专业",
          "申请转专业",
          "跨专业考研或辅修"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "大二/大三阶段",
        "unknowns": [
          "新方向能力匹配度",
          "转专业具体门槛与成功率"
        ]
      },
      "matches": [
        {
          "episode": {
            "episode_id": "ramakrishnan_1976_biology_training",
            "person": {
              "name": "文卡特拉曼·拉马克里希南",
              "tags": [
                "转专业",
                "博士后转学科"
              ]
            },
            "time": {
              "year": 1976,
              "stage": "博士后转学科"
            },
            "prior_path": [
              "已完成物理学博士。"
            ],
            "decision_state": {
              "dilemma": "直接找研究岗位 vs 补读生物课程",
              "options": [
                "直接找研究岗位",
                "补读生物课程"
              ],
              "constraints": [
                "缺少生物学基础",
                "已有家庭责任"
              ],
              "goals": [
                "补齐新领域训练",
                "寻找研究兴趣"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "direct_switch",
              "actions": [
                "进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。"
              ]
            },
            "outcomes": {
              "short_term": "重新接受跨学科基础训练。",
              "mid_term": "两年后进入 Yale 从事博士后研究，没有再完成第二个博士。",
              "long_term": "后来持续从事核糖体研究；不能证明所有跨学科者都需要同样路径。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "博士后的知识与资助条件不同于本科转专业；不是普通转学手续。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "VR-AUTO",
                "type": "self_writing",
                "claim": "1976 转生物训练，随后 Yale 博后。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/"
              },
              {
                "source_id": "VR-BIO",
                "type": "biography",
                "claim": "1976 物理博士、两年生物训练及后续研究。",
                "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士后的知识与资助条件不同于本科转专业；不是普通转学手续。"
              }
            ],
            "retrieval_tags": [
              "转专业",
              "direct_switch"
            ],
            "next_episode_ids": [
              "ramakrishnan_1978_yale_postdoc"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.12647376335332575,
            "dilemma_match": 0.45869628794074435,
            "constraint_match": 0.5714285714285715,
            "goal_match": 0.6666666666666666,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【目标】在意的目标有交集（对方的目标：补齐新领域训练、寻找研究兴趣）"
          ],
          "why_different": [
            "【路径差异】你的可选路径里有「跨专业考研或辅修」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【路径差异】你的可选路径里有「跨专业考研或辅修」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "1976 物理博士、两年生物训练及后续研究。（VR-BIO）"
            ],
            "self_claims": [
              "1976 转生物训练，随后 Yale 博后。（VR-AUTO）"
            ],
            "interpretations": [
              "重新接受跨学科基础训练。（outcomes.short_term）",
              "两年后进入 Yale 从事博士后研究，没有再完成第二个博士。（outcomes.mid_term）",
              "后来持续从事核糖体研究；不能证明所有跨学科者都需要同样路径。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士后的知识与资助条件不同于本科转专业；不是普通转学手续。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          }
        },
        {
          "episode": {
            "episode_id": "murakami_1978_bar_and_writing",
            "person": {
              "name": "村上春树",
              "tags": [
                "大厂还是小公司/创业",
                "经营与创作"
              ]
            },
            "time": {
              "year": 1978,
              "stage": "经营与创作"
            },
            "prior_path": [
              "与妻子经营爵士酒吧。"
            ],
            "decision_state": {
              "dilemma": "维持经营 vs 营业外写作",
              "options": [
                "维持经营",
                "营业外写作"
              ],
              "constraints": [
                "店务占用时间",
                "文学能力尚待验证"
              ],
              "goals": [
                "保持现金来源",
                "试做新的创作"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "dual_track",
              "actions": [
                "在继续经营酒吧期间开始写小说。"
              ]
            },
            "outcomes": {
              "short_term": "利用营业结束后的时间完成第一部小说。",
              "mid_term": "1979 年首作获新人奖；1981 年卖店转为专职写作。",
              "long_term": "此后写作《寻羊冒险记》；首轮尝试不是预先排定的三年转型计划。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "小店经营与创作副业可类比双轨试验，既有店铺及伴侣协作不同于普通职员条件。",
                "首作带来的收入及具体离店日期未知。"
              ],
              "self_comment": "他在回忆中把 1978 年的一场棒球赛视为开始写小说的契机。"
            },
            "evidence": [
              {
                "source_id": "HM-SELF",
                "type": "self_writing",
                "claim": "1978 开始写作、1979 首作获奖，之后卖店及继续创作。",
                "url": "https://lithub.com/haruki-murakami-the-moment-i-became-a-novelist/"
              },
              {
                "source_id": "HM-1981",
                "type": "biography",
                "claim": "卖店转向职业写作的年份为 1981 年。",
                "url": "https://www.bibliotecasalaborsa.it/ragazzi/profiles/profile-dd3b04"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。小店经营与创作副业可类比双轨试验，既有店铺及伴侣协作不同于普通职员条件。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "dual_track"
            ],
            "next_episode_ids": [
              "murakami_1981_fulltime_writing"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.007870535726332006,
            "dilemma_match": 0.4176816720868031,
            "constraint_match": 0.5714285714285715,
            "goal_match": 0.4,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【约束】现实约束有重叠（对方的约束：店务占用时间、文学能力尚待验证）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家庭期望值不高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的职业转换不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家庭期望值不高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的职业转换不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "卖店转向职业写作的年份为 1981 年。（HM-1981）"
            ],
            "self_claims": [
              "1978 开始写作、1979 首作获奖，之后卖店及继续创作。（HM-SELF）",
              "他在回忆中把 1978 年的一场棒球赛视为开始写小说的契机。（reflection.self_comment，本人自述）"
            ],
            "interpretations": [
              "利用营业结束后的时间完成第一部小说。（outcomes.short_term）",
              "1979 年首作获新人奖；1981 年卖店转为专职写作。（outcomes.mid_term）",
              "此后写作《寻羊冒险记》；首轮尝试不是预先排定的三年转型计划。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的职业转换不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "小店经营与创作副业可类比双轨试验，既有店铺及伴侣协作不同于普通职员条件。",
              "首作带来的收入及具体离店日期未知。"
            ]
          }
        },
        {
          "episode": {
            "episode_id": "arnold_1987_caltech_faculty",
            "person": {
              "name": "弗朗西丝·阿诺德",
              "tags": [
                "考研还是就业",
                "博士后结束"
              ]
            },
            "time": {
              "year": 1987,
              "stage": "博士后结束"
            },
            "prior_path": [
              "完成博士及博士后训练，逐渐倾向学术工作。"
            ],
            "decision_state": {
              "dilemma": "进入产业职位 vs 转为独立教职",
              "options": [
                "进入产业职位",
                "转为独立教职"
              ],
              "constraints": [
                "需独立建立课题",
                "岗位选择具有地域差异"
              ],
              "goals": [
                "保持研究自主",
                "保留产业联系"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "explore_then_switch",
              "actions": [
                "1987 年进入 Caltech 教师队伍。"
              ]
            },
            "outcomes": {
              "short_term": "由训练岗位进入独立学术职位。",
              "mid_term": "未知：本集未单独核实其起步数年的经费、教学与生活负担。",
              "long_term": "2018 年以诺贝尔奖得主身份回顾研究历程；奖项不能代替职业成本评价。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。",
                "未核实本人对这次选择的直接评价；不补写励志语录。",
                "未知：本集未单独核实其起步数年的经费、教学与生活负担。"
              ]
            },
            "evidence": [
              {
                "source_id": "FA-AUTO",
                "type": "self_writing",
                "claim": "博士后经历、1987 教职及获奖时的自述。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。"
              }
            ],
            "retrieval_tags": [
              "考研还是就业",
              "explore_then_switch"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.45578966442317803,
            "dilemma_match": 0.4652031550413553,
            "constraint_match": 0.25,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【阶段】人生阶段接近（对方当时：博士后结束）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家庭期望值不高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家庭期望值不高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [],
            "self_claims": [
              "博士后经历、1987 教职及获奖时的自述。（FA-AUTO）"
            ],
            "interpretations": [
              "由训练岗位进入独立学术职位。（outcomes.short_term）",
              "未知：本集未单独核实其起步数年的经费、教学与生活负担。（outcomes.mid_term）",
              "2018 年以诺贝尔奖得主身份回顾研究历程；奖项不能代替职业成本评价。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。",
              "未核实本人对这次选择的直接评价；不补写励志语录。",
              "未知：本集未单独核实其起步数年的经费、教学与生活负担。"
            ]
          }
        }
      ],
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 180,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2247,
        "parser_tokens": 488
      }
    }
  },
  {
    "id": 2,
    "name": "考研还是就业（延迟收益 vs 即时确定）",
    "raw_input": "大三了，家里人都劝我考研，说学历高点以后好走。但我手上有两个实习机会，转正概率不小。我担心考研三年出来还不如现在积累的工作经验，又怕不考研以后天花板太低。补充：成绩中等，考研把握一般；实习是喜欢的方向；家里能支持我读研，但我有点不好意思继续花家里的钱。",
    "situation": {
      "constraints": [
        "大三关键节点",
        "考研把握一般",
        "家庭经济支持",
        "心理上不好意思啃老",
        "实习转正概率不小"
      ],
      "dilemma": "直接就业 vs 考研深造",
      "goals": [
        "职业长期发展",
        "经济独立",
        "降低试错成本",
        "做喜欢的工作"
      ],
      "options": [
        "全力备战考研",
        "接受实习转正",
        "边实习边考研",
        "先工作后读非全"
      ],
      "reversibility": "medium",
      "risk": "high",
      "stage": "大三关键决策期",
      "unknowns": [
        "三年后就业市场变化",
        "研究生学历实际溢价",
        "考研失败后的退路",
        "行业未来天花板高度"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "大三关键节点",
          "考研把握一般",
          "家庭经济支持",
          "心理上不好意思啃老",
          "实习转正概率不小"
        ],
        "dilemma": "直接就业 vs 考研深造",
        "goals": [
          "职业长期发展",
          "经济独立",
          "降低试错成本",
          "做喜欢的工作"
        ],
        "options": [
          "全力备战考研",
          "接受实习转正",
          "边实习边考研",
          "先工作后读非全"
        ],
        "reversibility": "medium",
        "risk": "high",
        "stage": "大三关键决策期",
        "unknowns": [
          "三年后就业市场变化",
          "研究生学历实际溢价",
          "考研失败后的退路",
          "行业未来天花板高度"
        ]
      },
      "matches": [
        {
          "episode": {
            "episode_id": "ramakrishnan_1976_biology_training",
            "person": {
              "name": "文卡特拉曼·拉马克里希南",
              "tags": [
                "转专业",
                "博士后转学科"
              ]
            },
            "time": {
              "year": 1976,
              "stage": "博士后转学科"
            },
            "prior_path": [
              "已完成物理学博士。"
            ],
            "decision_state": {
              "dilemma": "直接找研究岗位 vs 补读生物课程",
              "options": [
                "直接找研究岗位",
                "补读生物课程"
              ],
              "constraints": [
                "缺少生物学基础",
                "已有家庭责任"
              ],
              "goals": [
                "补齐新领域训练",
                "寻找研究兴趣"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "direct_switch",
              "actions": [
                "进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。"
              ]
            },
            "outcomes": {
              "short_term": "重新接受跨学科基础训练。",
              "mid_term": "两年后进入 Yale 从事博士后研究，没有再完成第二个博士。",
              "long_term": "后来持续从事核糖体研究；不能证明所有跨学科者都需要同样路径。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "博士后的知识与资助条件不同于本科转专业；不是普通转学手续。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "VR-AUTO",
                "type": "self_writing",
                "claim": "1976 转生物训练，随后 Yale 博后。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/"
              },
              {
                "source_id": "VR-BIO",
                "type": "biography",
                "claim": "1976 物理博士、两年生物训练及后续研究。",
                "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士后的知识与资助条件不同于本科转专业；不是普通转学手续。"
              }
            ],
            "retrieval_tags": [
              "转专业",
              "direct_switch"
            ],
            "next_episode_ids": [
              "ramakrishnan_1978_yale_postdoc"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.04208769275401032,
            "dilemma_match": 0.46148039565146987,
            "constraint_match": 0.6,
            "goal_match": 1,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【目标】在意的目标有交集（对方的目标：补齐新领域训练、寻找研究兴趣）",
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）"
          ],
          "why_different": [
            "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "1976 物理博士、两年生物训练及后续研究。（VR-BIO）"
            ],
            "self_claims": [
              "1976 转生物训练，随后 Yale 博后。（VR-AUTO）"
            ],
            "interpretations": [
              "重新接受跨学科基础训练。（outcomes.short_term）",
              "两年后进入 Yale 从事博士后研究，没有再完成第二个博士。（outcomes.mid_term）",
              "后来持续从事核糖体研究；不能证明所有跨学科者都需要同样路径。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士后的知识与资助条件不同于本科转专业；不是普通转学手续。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
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
            "stage_match": 0.6,
            "path_match": 0.06786345420374355,
            "dilemma_match": 0.511140526075515,
            "constraint_match": 0.4444444444444445,
            "goal_match": 0.5,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【阶段】人生阶段接近（对方当时：毕业后起步）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（家庭经济支持）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（家庭经济支持）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        },
        {
          "episode": {
            "episode_id": "arnold_1987_caltech_faculty",
            "person": {
              "name": "弗朗西丝·阿诺德",
              "tags": [
                "考研还是就业",
                "博士后结束"
              ]
            },
            "time": {
              "year": 1987,
              "stage": "博士后结束"
            },
            "prior_path": [
              "完成博士及博士后训练，逐渐倾向学术工作。"
            ],
            "decision_state": {
              "dilemma": "进入产业职位 vs 转为独立教职",
              "options": [
                "进入产业职位",
                "转为独立教职"
              ],
              "constraints": [
                "需独立建立课题",
                "岗位选择具有地域差异"
              ],
              "goals": [
                "保持研究自主",
                "保留产业联系"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "explore_then_switch",
              "actions": [
                "1987 年进入 Caltech 教师队伍。"
              ]
            },
            "outcomes": {
              "short_term": "由训练岗位进入独立学术职位。",
              "mid_term": "未知：本集未单独核实其起步数年的经费、教学与生活负担。",
              "long_term": "2018 年以诺贝尔奖得主身份回顾研究历程；奖项不能代替职业成本评价。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。",
                "未核实本人对这次选择的直接评价；不补写励志语录。",
                "未知：本集未单独核实其起步数年的经费、教学与生活负担。"
              ]
            },
            "evidence": [
              {
                "source_id": "FA-AUTO",
                "type": "self_writing",
                "claim": "博士后经历、1987 教职及获奖时的自述。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。"
              }
            ],
            "retrieval_tags": [
              "考研还是就业",
              "explore_then_switch"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.37644922360775845,
            "dilemma_match": 0.5702572853365592,
            "constraint_match": 0.25,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【困境结构】双方核心冲突同属「同构」型（对方当时的困境：进入产业职位 vs 转为独立教职）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（家庭经济支持）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（家庭经济支持）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「三年后就业市场变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [],
            "self_claims": [
              "博士后经历、1987 教职及获奖时的自述。（FA-AUTO）"
            ],
            "interpretations": [
              "由训练岗位进入独立学术职位。（outcomes.short_term）",
              "未知：本集未单独核实其起步数年的经费、教学与生活负担。（outcomes.mid_term）",
              "2018 年以诺贝尔奖得主身份回顾研究历程；奖项不能代替职业成本评价。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士后转教职属于高筛选的学术就业，只能类比职业方向和继续科研投入。",
              "未核实本人对这次选择的直接评价；不补写励志语录。",
              "未知：本集未单独核实其起步数年的经费、教学与生活负担。"
            ]
          }
        }
      ],
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 350,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2838,
        "parser_tokens": 560
      }
    }
  },
  {
    "id": 3,
    "name": "大厂还是小公司/创业（稳定 vs 成长空间）",
    "raw_input": "毕业两年了，在一家小公司做产品，学得快但看不到晋升路径。拿到了一个大厂的 offer，薪资涨三成，但岗位方向比较窄。我很纠结要不要去，怕自己变成螺丝钉，又怕留下来错过平台机会。补充：目前存款不多；无家庭负担；最在意成长空间和长期竞争力。",
    "situation": {
      "constraints": [
        "毕业两年，存款不多",
        "无家庭负担",
        "大厂岗位方向窄",
        "现公司无晋升路径"
      ],
      "dilemma": "留小厂全栈 vs 去大厂螺丝钉",
      "goals": [
        "提升成长空间",
        "保持长期竞争力",
        "提高薪资收入"
      ],
      "options": [
        "留原公司积累",
        "接受大厂Offer",
        "寻找第三选择"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "职业探索期",
      "unknowns": [
        "大厂内部转岗难度",
        "窄方向的长期市场需求",
        "大厂工作强度"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "毕业两年，存款不多",
          "无家庭负担",
          "大厂岗位方向窄",
          "现公司无晋升路径"
        ],
        "dilemma": "留小厂全栈 vs 去大厂螺丝钉",
        "goals": [
          "提升成长空间",
          "保持长期竞争力",
          "提高薪资收入"
        ],
        "options": [
          "留原公司积累",
          "接受大厂Offer",
          "寻找第三选择"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "职业探索期",
        "unknowns": [
          "大厂内部转岗难度",
          "窄方向的长期市场需求",
          "大厂工作强度"
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
            "path_match": 0.06979897441990657,
            "dilemma_match": 0.37068382666059657,
            "constraint_match": 0.4,
            "goal_match": 0.4,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【阶段】人生阶段接近（对方当时：重返研究）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂内部转岗难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂内部转岗难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "episode_id": "ramakrishnan_1999_lmb",
            "person": {
              "name": "文卡特拉曼·拉马克里希南",
              "tags": [
                "大厂还是小公司/创业",
                "科研机构转换"
              ]
            },
            "time": {
              "year": 1999,
              "stage": "科研机构转换"
            },
            "prior_path": [
              "在美国 Utah 开展核糖体研究。"
            ],
            "decision_state": {
              "dilemma": "留在原机构 vs 迁往英国 LMB",
              "options": [
                "留在原机构",
                "迁往英国 LMB"
              ],
              "constraints": [
                "涉及家庭迁移",
                "新团队资源需重建"
              ],
              "goals": [
                "加强科研协作",
                "集中研究投入"
              ],
              "risk": "high",
              "reversibility": "medium"
            },
            "choice": {
              "type": "direct_switch",
              "actions": [
                "1999 年转至英国 LMB。"
              ]
            },
            "outcomes": {
              "short_term": "据自述，接受约四成减薪并迁移研究生活。",
              "mid_term": "2000 年取得核糖体亚基结构研究进展。",
              "long_term": "2009 年获诺贝尔化学奖；无法证明换机构是唯一原因。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "两个科研机构不是大厂与初创公司的直接对照，专业平台与长期资助更重要。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "VR-AUTO",
                "type": "self_writing",
                "claim": "1999 迁移与约 40% 薪酬下降的自述。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/"
              },
              {
                "source_id": "VR-BIO",
                "type": "biography",
                "claim": "2000 结构工作及 2009 奖项。",
                "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。两个科研机构不是大厂与初创公司的直接对照，专业平台与长期资助更重要。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "direct_switch"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.02209471932479834,
            "dilemma_match": 0.4871359250542246,
            "constraint_match": 0.25,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【阶段】人生阶段接近（对方当时：科研机构转换）"
          ],
          "why_different": [
            "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「窄方向的长期市场需求」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「窄方向的长期市场需求」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "2000 结构工作及 2009 奖项。（VR-BIO）"
            ],
            "self_claims": [
              "1999 迁移与约 40% 薪酬下降的自述。（VR-AUTO）"
            ],
            "interpretations": [
              "据自述，接受约四成减薪并迁移研究生活。（outcomes.short_term）",
              "2000 年取得核糖体亚基结构研究进展。（outcomes.mid_term）",
              "2009 年获诺贝尔化学奖；无法证明换机构是唯一原因。（outcomes.long_term）"
            ],
            "ai_inferences": [],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "两个科研机构不是大厂与初创公司的直接对照，专业平台与长期资助更重要。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          }
        },
        {
          "episode": {
            "episode_id": "butterfield_2013_slack_pivot",
            "person": {
              "name": "斯图尔特·巴特菲尔德",
              "tags": [
                "大厂还是小公司/创业",
                "失败后转产品"
              ]
            },
            "time": {
              "year": 2013,
              "stage": "失败后转产品"
            },
            "prior_path": [
              "Glitch 关闭后仍保有部分资金和小团队，曾内部使用沟通工具。"
            ],
            "decision_state": {
              "dilemma": "退回剩余资金 vs 转做协作工具",
              "options": [
                "退回剩余资金",
                "转做协作工具"
              ],
              "constraints": [
                "团队已缩减",
                "外部需求尚待验证"
              ],
              "goals": [
                "重用已验证工具",
                "寻找新市场"
              ],
              "risk": "high",
              "reversibility": "medium"
            },
            "choice": {
              "type": "explore_then_switch",
              "actions": [
                "把内部沟通工具发展为面向其他团队的 Slack。"
              ]
            },
            "outcomes": {
              "short_term": "从内部使用进入对外产品验证。",
              "mid_term": "逐渐取得企业客户，获得后续融资。",
              "long_term": "2019 年上市；并非此前游戏坚持到底得到成功，而是关闭旧项目后重做产品。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "已有投资关系、现金与协作团队是特殊条件；不是零资源转行。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "SB-INVESTOR",
                "type": "biography",
                "claim": "剩余团队和资金、客户与上市回顾。",
                "url": "https://a16z.com/announcement/slack/"
              },
              {
                "source_id": "SB-ORIGIN",
                "type": "biography",
                "claim": "Slack 起源于游戏团队内部沟通工具。",
                "url": "https://slack.com/resources/why-use-slack/what-is-slack-and-how-does-it-work"
              },
              {
                "source_id": "SB-LAUNCH",
                "type": "biography",
                "claim": "2013 年发布测试产品。",
                "url": "https://techcrunch.com/2013/08/14/say-hello-to-slack-the-newest-enterprise-social-network-and-the-latest-effort-from-flickr-co-founder-stewart-butterfields-tiny-speck/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。已有投资关系、现金与协作团队是特殊条件；不是零资源转行。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "explore_then_switch"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.18978561790110882,
            "dilemma_match": 0.4682705217925989,
            "constraint_match": 0.15,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【可逆性】当时选择的可逆性与你相近（对方评估为「中」，你为「中」）",
            "【阶段】人生阶段接近（对方当时：失败后转产品）"
          ],
          "why_different": [
            "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂内部转岗难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂内部转岗难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "剩余团队和资金、客户与上市回顾。（SB-INVESTOR）",
              "Slack 起源于游戏团队内部沟通工具。（SB-ORIGIN）",
              "2013 年发布测试产品。（SB-LAUNCH）"
            ],
            "self_claims": [],
            "interpretations": [
              "从内部使用进入对外产品验证。（outcomes.short_term）",
              "逐渐取得企业客户，获得后续融资。（outcomes.mid_term）",
              "2019 年上市；并非此前游戏坚持到底得到成功，而是关闭旧项目后重做产品。（outcomes.long_term）"
            ],
            "ai_inferences": [],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "已有投资关系、现金与协作团队是特殊条件；不是零资源转行。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          }
        }
      ],
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 36,
        "after_rerank": 3,
        "dropped_by_metadata": 0,
        "forced_diversity": false,
        "elapsed_ms": 523,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 3966,
        "parser_tokens": 531
      }
    }
  }
];
;

/** 字符 bigram 重叠率 —— 词汇对不上时也能判断"问的是不是同一类事" */
function bigramOverlap(a: string, b: string): number {
  const grams = (s: string): Set<string> => {
    const clean = s.replace(/[\s，,。.、；;：:！!？?—\-]/g, '');
    const set = new Set<string>();
    for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2));
    return set;
  };
  const ga = grams(a);
  const gb = grams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  for (const g of ga) if (gb.has(g)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

/**
 * 按用户实际填写的内容挑最接近的演示快照。
 *
 * 刻意做得保守：重叠率低于 0.05 就退回第 1 个场景，
 * 而不是硬凑一个不太像的 —— 显示不相关的数据比显示"通用演示数据"更容易被误读。
 */
export function pickScenario(narrative: string): CachedScenario {
  if (!narrative?.trim() || demoScenarios.length === 0) return demoScenarios[0];
  let best = demoScenarios[0];
  let bestScore = 0;
  for (const s of demoScenarios) {
    const score = bigramOverlap(narrative, s.raw_input);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return bestScore < 0.05 ? demoScenarios[0] : best;
}

/** 默认场景（场景 1），兼容不关心匹配的调用方 */
export const demoCache = {
  situation: demoScenarios[0]?.situation,
  retrieval: demoScenarios[0]?.retrieval,
};

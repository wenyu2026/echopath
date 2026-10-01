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
        "可接受延毕",
        "家庭期望别太高"
      ],
      "dilemma": "坚持本专业 vs 转向新方向",
      "goals": [
        "追求兴趣",
        "个人成长"
      ],
      "options": [
        "继续读完本专业",
        "申请转专业",
        "辅修新方向"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "大二/大三",
      "unknowns": [
        "新方向能力匹配度",
        "转专业成功率"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "已投入两年沉没成本",
          "新方向仅了解两个月",
          "可接受延毕",
          "家庭期望别太高"
        ],
        "dilemma": "坚持本专业 vs 转向新方向",
        "goals": [
          "追求兴趣",
          "个人成长"
        ],
        "options": [
          "继续读完本专业",
          "申请转专业",
          "辅修新方向"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "大二/大三",
        "unknowns": [
          "新方向能力匹配度",
          "转专业成功率"
        ]
      },
      "matches": [
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
            "path_match": 0.16456672253944862,
            "dilemma_match": 0.7237823226144418,
            "constraint_match": 0.15,
            "goal_match": 0.4,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「坚持 vs 转向」型（对方当时的困境：继续电影创作 vs 转入其他工作）",
            "【阶段】人生阶段接近（对方当时：毕业后起步）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家庭期望别太高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「辅修新方向」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家庭期望别太高）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「辅修新方向」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "episode_id": "nusslein_1962_test_medicine",
            "person": {
              "name": "克里斯蒂安妮·纽斯莱因-福尔哈德",
              "tags": [
                "转专业",
                "入学前探索"
              ]
            },
            "time": {
              "year": 1962,
              "stage": "入学前探索"
            },
            "prior_path": [
              "中学毕业时倾向生物学，也短暂考虑医学。"
            ],
            "decision_state": {
              "dilemma": "继续生物方向 vs 转入医学方向",
              "options": [
                "继续生物方向",
                "转入医学方向"
              ],
              "constraints": [
                "职业体验不足",
                "入学方向待确认"
              ],
              "goals": [
                "检验工作适配",
                "减少盲目选择"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "explore_then_persist",
              "actions": [
                "在医院做约一个月护理体验，随后仍选择生物学。"
              ]
            },
            "outcomes": {
              "short_term": "据自述，这段体验令她排除了医生职业。",
              "mid_term": "1964 年又转向生物化学课程，原方向不是终身锁定。",
              "long_term": "1969 年取得文凭，1973 年完成博士。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "短期护理体验不覆盖全部医学职业；德国当时学制不同于现代中国转专业。"
              ],
              "self_comment": "她在自传中说医院体验让她确认不想成为医生。"
            },
            "evidence": [
              {
                "source_id": "CN-AUTO",
                "type": "self_writing",
                "claim": "1962 医院体验、1964 生化、1969 文凭、1973 博士。",
                "url": "https://www.nobelprize.org/prizes/medicine/1995/nusslein-volhard/biographical/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。短期护理体验不覆盖全部医学职业；德国当时学制不同于现代中国转专业。"
              }
            ],
            "retrieval_tags": [
              "转专业",
              "explore_then_persist"
            ],
            "next_episode_ids": [
              "nusslein_1964_biochemistry"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.6206338102586396,
            "dilemma_match": 0.8437882470201572,
            "constraint_match": 0.25918367346938775,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.8999999999999999
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「坚持 vs 转向」型（对方当时的困境：继续生物方向 vs 转入医学方向）",
            "【来时路】此前的投入路径相似：对方曾 中学毕业时倾向生物学，也短暂考虑医学。"
          ],
          "why_different": [
            "【约束差异】你面对「时间与沉没投入」类约束（已投入两年沉没成本、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1962 年（约 64 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1962 年（约 64 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
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
              "1962 医院体验、1964 生化、1969 文凭、1973 博士。（CN-AUTO）",
              "她在自传中说医院体验让她确认不想成为医生。（reflection.self_comment，本人自述）"
            ],
            "interpretations": [
              "据自述，这段体验令她排除了医生职业。（outcomes.short_term）",
              "1964 年又转向生物化学课程，原方向不是终身锁定。（outcomes.mid_term）",
              "1969 年取得文凭，1973 年完成博士。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1962 年（约 64 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "短期护理体验不覆盖全部医学职业；德国当时学制不同于现代中国转专业。"
            ]
          }
        },
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
            "path_match": 0.12622334733642476,
            "dilemma_match": 0.5269568234396341,
            "constraint_match": 0.5714285714285715,
            "goal_match": 0.6666666666666666,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【目标】在意的目标有具体交集：「追求兴趣」（对方的目标：补齐新领域训练、寻找研究兴趣）",
            "【约束】现实约束有具体重叠：「家庭期望别太高」（对方的约束：缺少生物学基础、已有家庭责任）"
          ],
          "why_different": [
            "【路径差异】你的可选路径里有「辅修新方向」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【路径差异】你的可选路径里有「辅修新方向」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
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
        }
      ],
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 644,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 1739,
        "parser_tokens": 471
      }
    }
  },
  {
    "id": 2,
    "name": "考研还是就业（延迟收益 vs 即时确定）",
    "raw_input": "大三了，家里人都劝我考研，说学历高点以后好走。但我手上有两个实习机会，转正概率不小。我担心考研三年出来还不如现在积累的工作经验，又怕不考研以后天花板太低。补充：成绩中等，考研把握一般；实习是喜欢的方向；家里能支持我读研，但我有点不好意思继续花家里的钱。",
    "situation": {
      "constraints": [
        "大三时间节点",
        "家庭支持读研",
        "实习转正概率大",
        "成绩中等考研难",
        "不好意思花家里钱"
      ],
      "dilemma": "考研提升学历 vs 实习积累经验",
      "goals": [
        "未来职业发展好",
        "打破学历天花板",
        "早日经济独立"
      ],
      "options": [
        "全力备考研究生",
        "接受实习转正",
        "边实习边备考"
      ],
      "reversibility": "medium",
      "risk": "high",
      "stage": "大三/就业抉择期",
      "unknowns": [
        "三年后研究生就业行情",
        "研究生学历溢价幅度",
        "实习转正后成长空间",
        "备考实际成功率"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "大三时间节点",
          "家庭支持读研",
          "实习转正概率大",
          "成绩中等考研难",
          "不好意思花家里钱"
        ],
        "dilemma": "考研提升学历 vs 实习积累经验",
        "goals": [
          "未来职业发展好",
          "打破学历天花板",
          "早日经济独立"
        ],
        "options": [
          "全力备考研究生",
          "接受实习转正",
          "边实习边备考"
        ],
        "reversibility": "medium",
        "risk": "high",
        "stage": "大三/就业抉择期",
        "unknowns": [
          "三年后研究生就业行情",
          "研究生学历溢价幅度",
          "实习转正后成长空间",
          "备考实际成功率"
        ]
      },
      "matches": [
        {
          "episode": {
            "episode_id": "kariko_1995_persist_cost",
            "person": {
              "name": "卡塔琳·考里科",
              "tags": [
                "考研还是就业",
                "科研职位受挫"
              ]
            },
            "time": {
              "year": 1995,
              "stage": "科研职位受挫"
            },
            "prior_path": [
              "在宾夕法尼亚大学从事 mRNA 研究。"
            ],
            "decision_state": {
              "dilemma": "接受降职留研 vs 离开研究岗位",
              "options": [
                "接受降职留研",
                "离开研究岗位"
              ],
              "constraints": [
                "晋升与经费受限",
                "已有专业积累"
              ],
              "goals": [
                "继续验证研究",
                "维持科研岗位"
              ],
              "risk": "high",
              "reversibility": "medium"
            },
            "choice": {
              "type": "persist",
              "actions": [
                "1995 年接受较低职位，继续 mRNA 研究。"
              ]
            },
            "outcomes": {
              "short_term": "研究得以继续，但职位处境下降。",
              "mid_term": "1997 年开始与 Weissman 合作；学术职位困境没有随合作立即消失。",
              "long_term": "据传记转述她的回忆，2005、2008 年有研究进展后，2009 年仍未获恢复原职位；后来成就不抹去这段长期职位损失。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "科研职位制度、团队与经费环境不同于考研选择；长期受损限定于职位轨迹，不推断整体人生得失。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "KK-ROCK",
                "type": "biography",
                "claim": "1995 降职、1997 合作；传记转述本人关于 2009 年恢复职位请求被拒的回忆。",
                "url": "https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。科研职位制度、团队与经费环境不同于考研选择；长期受损限定于职位轨迹，不推断整体人生得失。"
              }
            ],
            "retrieval_tags": [
              "考研还是就业",
              "persist",
              "坚持但长期受损"
            ],
            "next_episode_ids": [
              "kariko_2013_biontech"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.03953813068056168,
            "dilemma_match": 0.5467571305598252,
            "constraint_match": 0.6,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.75
          },
          "why_similar": [
            "【约束】现实约束有具体重叠：「不好意思花家里钱」（对方的约束：晋升与经费受限、已有专业积累）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「时间与沉没投入」类约束（大三时间节点）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是1995 年接受较低职位，继续 mRNA 研究。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1995 年（约 31 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「时间与沉没投入」类约束（大三时间节点）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是1995 年接受较低职位，继续 mRNA 研究。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1995 年（约 31 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "1995 降职、1997 合作；传记转述本人关于 2009 年恢复职位请求被拒的回忆。（KK-ROCK）"
            ],
            "self_claims": [],
            "interpretations": [
              "研究得以继续，但职位处境下降。（outcomes.short_term）",
              "1997 年开始与 Weissman 合作；学术职位困境没有随合作立即消失。（outcomes.mid_term）",
              "据传记转述她的回忆，2005、2008 年有研究进展后，2009 年仍未获恢复原职位；后来成就不抹去这段长期职位损失。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1995 年（约 31 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "科研职位制度、团队与经费环境不同于考研选择；长期受损限定于职位轨迹，不推断整体人生得失。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          }
        },
        {
          "episode": {
            "episode_id": "dyson_2014_ev_entry",
            "person": {
              "name": "詹姆斯·戴森",
              "tags": [
                "大厂还是小公司/创业",
                "企业跨行业"
              ]
            },
            "time": {
              "year": 2014,
              "stage": "企业跨行业"
            },
            "prior_path": [
              "已建立消费电器业务。"
            ],
            "decision_state": {
              "dilemma": "集中原有业务 vs 增加整车研发",
              "options": [
                "集中原有业务",
                "增加整车研发"
              ],
              "constraints": [
                "跨行业能力待建立",
                "商业化投入很大"
              ],
              "goals": [
                "探索新产品",
                "寻找技术应用"
              ],
              "risk": "high",
              "reversibility": "low"
            },
            "choice": {
              "type": "direct_switch",
              "actions": [
                "启动电动车项目。"
              ]
            },
            "outcomes": {
              "short_term": "进入整车研发方向；本来源未提供首年独立经营结果。",
              "mid_term": "项目继续推进，但最终没有形成可行的商业方案。",
              "long_term": "2019 年宣布停止项目，寻找买方也未成功。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "成熟公司的跨行业研发与个人创业资源差异很大；技术可造与商业可行要分开。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "JD-BIO",
                "type": "biography",
                "claim": "2014 年启动电动车计划。",
                "url": "https://www.dyson.com/james-dyson"
              },
              {
                "source_id": "JD-CLOSE",
                "type": "self_writing",
                "claim": "2019 商业不可行及终止项目。",
                "url": "https://www.dyson.com/automotive"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。成熟公司的跨行业研发与个人创业资源差异很大；技术可造与商业可行要分开。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "direct_switch",
              "转向后不适合"
            ],
            "next_episode_ids": [
              "dyson_2019_abandon_ev"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0,
            "dilemma_match": 0.4256108183492653,
            "constraint_match": 0.4,
            "goal_match": 0.25,
            "reversibility_match": 0.75,
            "difference_penalty": 0.49999999999999994
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：企业跨行业）",
            "【约束】现实约束有具体重叠：「大三时间节点」（对方的约束：跨行业能力待建立、商业化投入很大）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（不好意思花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是启动电动车项目。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（不好意思花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习转正」这类低成本试探；案例里对方的实际动作是启动电动车项目。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "2014 年启动电动车计划。（JD-BIO）"
            ],
            "self_claims": [
              "2019 商业不可行及终止项目。（JD-CLOSE）"
            ],
            "interpretations": [
              "进入整车研发方向；本来源未提供首年独立经营结果。（outcomes.short_term）",
              "项目继续推进，但最终没有形成可行的商业方案。（outcomes.mid_term）",
              "2019 年宣布停止项目，寻找买方也未成功。（outcomes.long_term）"
            ],
            "ai_inferences": [],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "成熟公司的跨行业研发与个人创业资源差异很大；技术可造与商业可行要分开。",
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
            "path_match": 0.37641697267193597,
            "dilemma_match": 0.5537042093414904,
            "constraint_match": 0.25,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.75
          },
          "why_similar": [
            "【困境结构】两边的取舍都落在「放弃一边、换另一边」这一结构上（对方当时的困境：进入产业职位 vs 转为独立教职）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（不好意思花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1987 年（约 39 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（不好意思花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
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
              "text": "【未知】无法比较「三年后研究生就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "elapsed_ms": 456,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2340,
        "parser_tokens": 717
      }
    }
  },
  {
    "id": 3,
    "name": "大厂还是小公司/创业（稳定 vs 成长空间）",
    "raw_input": "毕业两年了，在一家小公司做产品，学得快但看不到晋升路径。拿到了一个大厂的 offer，薪资涨三成，但岗位方向比较窄。我很纠结要不要去，怕自己变成螺丝钉，又怕留下来错过平台机会。补充：目前存款不多；无家庭负担；最在意成长空间和长期竞争力。",
    "situation": {
      "constraints": [
        "存款不多",
        "无家庭负担",
        "小公司晋升路径缺失",
        "大厂岗位方向过窄"
      ],
      "dilemma": "留小公司全栈 vs 去大厂做螺丝钉",
      "goals": [
        "提升成长空间",
        "增强长期竞争力",
        "获得平台背书"
      ],
      "options": [
        "留原公司积累",
        "接受大厂offer",
        "寻找中型平台机会"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "毕业两年/职场起步期",
      "unknowns": [
        "大厂内部转岗或跳槽难度",
        "窄方向未来的市场需求"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "存款不多",
          "无家庭负担",
          "小公司晋升路径缺失",
          "大厂岗位方向过窄"
        ],
        "dilemma": "留小公司全栈 vs 去大厂做螺丝钉",
        "goals": [
          "提升成长空间",
          "增强长期竞争力",
          "获得平台背书"
        ],
        "options": [
          "留原公司积累",
          "接受大厂offer",
          "寻找中型平台机会"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "毕业两年/职场起步期",
        "unknowns": [
          "大厂内部转岗或跳槽难度",
          "窄方向未来的市场需求"
        ]
      },
      "matches": [
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
            "path_match": 0,
            "dilemma_match": 0.3880970716447333,
            "constraint_match": 0.22222222222222224,
            "goal_match": 0.4,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：毕业后起步）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「大厂内部转岗或跳槽难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
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
              "text": "【未知】无法比较「大厂内部转岗或跳槽难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.021959828518286994,
            "dilemma_match": 0.5075522680497617,
            "constraint_match": 0.25,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.35
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「稳定 vs 冒险」型（对方当时的困境：留在原机构 vs 迁往英国 LMB）",
            "【阶段】人生阶段接近（对方当时：科研机构转换）"
          ],
          "why_different": [
            "【约束差异】你面对「ceiling」类约束（小公司晋升路径缺失）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「窄方向未来的市场需求」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「ceiling」类约束（小公司晋升路径缺失）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「窄方向未来的市场需求」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.1894172630662273,
            "dilemma_match": 0.49158856656112315,
            "constraint_match": 0.15,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：失败后转产品）",
            "【困境结构】双方核心冲突同属「稳定 vs 冒险」型（对方当时的困境：退回剩余资金 vs 转做协作工具）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（无家庭负担）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂内部转岗或跳槽难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（无家庭负担）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂内部转岗或跳槽难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 278,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 3474,
        "parser_tokens": 531
      }
    }
  }
];
;

/** 字符 bigram 重叠率 —— 词汇对不上时也能判断"问的是不是同一类事" */
function bigramOverlap(a: string, b: string): number {
  const grams = (s: string): Set<string> => {
    // 字符类里的 - 放在末尾就不需要转义（放在中间才需要）
    const clean = s.replace(/[\s，,。.、；;：:！!？?—-]/g, '');
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

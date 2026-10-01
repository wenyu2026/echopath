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
        "家庭期望别太高",
        "可接受延毕"
      ],
      "dilemma": "坚持不适专业 vs 转向新方向",
      "goals": [
        "追求兴趣",
        "个人成长",
        "降低不适感"
      ],
      "options": [
        "继续读完原专业",
        "转专业",
        "辅修或双学位"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "大三/大二阶段",
      "unknowns": [
        "新方向能力匹配度",
        "转专业的成功概率",
        "新方向就业前景"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "已投入两年沉没成本",
          "新方向仅了解两个月",
          "家庭期望别太高",
          "可接受延毕"
        ],
        "dilemma": "坚持不适专业 vs 转向新方向",
        "goals": [
          "追求兴趣",
          "个人成长",
          "降低不适感"
        ],
        "options": [
          "继续读完原专业",
          "转专业",
          "辅修或双学位"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "大三/大二阶段",
        "unknowns": [
          "新方向能力匹配度",
          "转专业的成功概率",
          "新方向就业前景"
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
            "path_match": 0.16449058445361645,
            "dilemma_match": 0.7118493065055425,
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
            "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
            "path_match": 0.6206122063750084,
            "dilemma_match": 0.8416648300863785,
            "constraint_match": 0.259,
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
            "path_match": 0.12622418502856197,
            "dilemma_match": 0.5263938341315655,
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
            "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
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
      "source_meta": {
        "LX-TOHOKU": {
          "source_id": "LX-TOHOKU",
          "title": "鲁迅的仙台留学",
          "publisher": "东北大学史料馆",
          "url": "https://www.archives.tohoku.ac.jp/luxun/cn/story/",
          "type": "biography",
          "locator": "赴日与仙台入学、第二学年退学",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-SENDAI": {
          "source_id": "LX-SENDAI",
          "title": "Chinese high school students visit Tohoku University",
          "publisher": "东北大学",
          "url": "https://www.tohoku.ac.jp/en/news/university_news/sakura_exchange_program.html",
          "type": "biography",
          "locator": "Lu Xun studied in Sendai from 1904 to 1906",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-PREFACE": {
          "source_id": "LX-PREFACE",
          "title": "《呐喊》自序（1922）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/wiki/吶喊",
          "type": "self_writing",
          "locator": "自序：医学、筹办新生、金心异劝写文章",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后自述与开放转录；动机按本人表述处理，不当作现场心理记录。"
        },
        "LX-SELECT": {
          "source_id": "LX-SELECT",
          "title": "《自选集》自序（1932）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/zh-hans/《自選集》自序",
          "type": "self_writing",
          "locator": "我做小说，是开手于一九一八年",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后回忆；不是逐日决策日志。"
        },
        "LX-MUSEUM": {
          "source_id": "LX-MUSEUM",
          "title": "鲁迅生平陈列：画出国人的魂灵",
          "publisher": "上海鲁迅纪念馆",
          "url": "https://www.luxunmuseum.cn/",
          "type": "biography",
          "locator": "1918—1922 年十四篇小说",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**原深链（/lxcl/index/id/5.html）2026-10-02 实测 404（官网改版），已改为站点首页；具体展览页需到馆内检索，未能定位到对应条目。**"
        },
        "AL-INTERVIEW": {
          "source_id": "AL-INTERVIEW",
          "title": "李安｜聆听电影之神的声音",
          "publisher": "澎湃转载楚尘文化《李安访谈录》",
          "url": "https://m.thepaper.cn/newsDetail_forward_27605082",
          "type": "interview",
          "locator": "格伦·肯尼访谈：毕业后六年、1990 年剧本比赛、推手",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "中文译编的事后访谈；未将六年没有执导机会扩大成六年无任何正式工作。"
        },
        "AL-NYU": {
          "source_id": "AL-NYU",
          "title": "Ang Lee — Tisch Gala 2024",
          "publisher": "纽约大学 Tisch",
          "url": "https://tisch.nyu.edu/giving/the-tisch-gala/tisch-gala-2024/ang-lee.html",
          "type": "biography",
          "locator": "1984 MFA、后续影片与奖项",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "页面把首部长片写在 1990 年；本集仅用来核对毕业与后续生涯，影片上映年采用访谈的 1991 年。"
        },
        "HM-SELF": {
          "source_id": "HM-SELF",
          "title": "Haruki Murakami: The Moment I Became a Novelist",
          "publisher": "Haruki Murakami / Literary Hub / Knopf",
          "url": "https://lithub.com/haruki-murakami-the-moment-i-became-a-novelist/",
          "type": "self_writing",
          "locator": "1978 球赛、营业后写作、1979 首作、卖店专职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "2015 年出版的自述节选；回顾性解释不代表 1978 年已有明确三年转行计划。"
        },
        "HM-1981": {
          "source_id": "HM-1981",
          "title": "Haruki Murakami",
          "publisher": "Biblioteca Salaborsa Ragazzi / Bologna",
          "url": "https://www.bibliotecasalaborsa.it/ragazzi/profiles/profile-dd3b04",
          "type": "biography",
          "locator": "Nel 1981 Murakami vende il jazz bar",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公共图书馆的二手人物简介，仅补足卖店年份。"
        },
        "CD-STUDY": {
          "source_id": "CD-STUDY",
          "title": "Darwin’s student booklist",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/people/about-darwin/what-darwin-read/darwin-s-student-booklist",
          "type": "biography",
          "locator": "Edinburgh 1825—1827；Cambridge January 1828",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-CHURCH": {
          "source_id": "CD-CHURCH",
          "title": "Darwin and the Church",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/religion/darwin-and-church",
          "type": "biography",
          "locator": "Cambridge degree and intended clerical career",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-BEAGLE": {
          "source_id": "CD-BEAGLE",
          "title": "Voyage of HMS Beagle",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/voyage-hms-beagle",
          "type": "biography",
          "locator": "1831 邀请、父亲资助；1831-12-27 至 1836-10-02 航行",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-REED": {
          "source_id": "SJ-REED",
          "title": "Steve Jobs and Reed College",
          "publisher": "Reed College",
          "url": "https://www.reed.edu/about/steve-jobs.html",
          "type": "biography",
          "locator": "fall 1972；one semester；auditing classes",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-SPEECH": {
          "source_id": "SJ-SPEECH",
          "title": "‘You’ve got to find what you love,’ Jobs says",
          "publisher": "Steve Jobs / Stanford University",
          "url": "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
          "type": "self_writing",
          "locator": "2005 毕业演讲：退学与重启事业两部分",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "预备演讲稿，动机与意义归本人回顾；不把退学认定为创业成功原因。"
        },
        "JB-SPEECH": {
          "source_id": "JB-SPEECH",
          "title": "2010 Baccalaureate remarks",
          "publisher": "Jeff Bezos / Princeton University",
          "url": "https://www.princeton.edu/news/2010/05/30/2010-baccalaureate-remarks",
          "type": "self_writing",
          "locator": "16 years ago、老板要求考虑 48 小时、离职创建 Amazon",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创业者事后回忆；没有未创业的对照结局。"
        },
        "BM-LJMU": {
          "source_id": "BM-LJMU",
          "title": "Brian May profile",
          "publisher": "Liverpool John Moores University",
          "url": "https://www.ljmu.ac.uk/about-us/bicentenary/our-people/brian-may/brian-may-profile",
          "type": "biography",
          "locator": "1974 中断博士，2006 重返，2007 取得博士",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "BM-IMPERIAL": {
          "source_id": "BM-IMPERIAL",
          "title": "Annual Alumni Lecture 2007",
          "publisher": "Imperial College London",
          "url": "https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/",
          "type": "biography",
          "locator": "2006 决定恢复、三十年文献补读、2007 年八月论文",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "VR-AUTO": {
          "source_id": "VR-AUTO",
          "title": "Venkatraman Ramakrishnan — Biographical",
          "publisher": "Nobel Prize / Venki Ramakrishnan",
          "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/",
          "type": "self_writing",
          "locator": "1976 UCSD、1978 Yale、1999 LMB",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "直接打开受站点限制；已核对搜索索引中的长段正文，合并前建议人类复核原页。事后自述。"
        },
        "VR-BIO": {
          "source_id": "VR-BIO",
          "title": "About Venki Ramakrishnan",
          "publisher": "Nobel Prize Inspiration Initiative",
          "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/",
          "type": "biography",
          "locator": "1976 PhD；UCSD two years；1999 LMB；2000 ribosome structure",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-ROCK": {
          "source_id": "KK-ROCK",
          "title": "Katalin Karikó",
          "publisher": "Rockefeller University / Evelyn Strauss",
          "url": "https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/",
          "type": "biography",
          "locator": "1995 降职；1997 Weissman；2005、2008、2009 研究与职位",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-BION": {
          "source_id": "KK-BION",
          "title": "Katalin Karikó and Drew Weissman awarded Nobel Prize",
          "publisher": "BioNTech",
          "url": "https://www.biontech.com/int/en/home/mediaroom/news/statements/2023/10/statement-katalin-kariko-and-drew-weissman-awarded-nobel-prize.html",
          "type": "biography",
          "locator": "2013 入职；2014 联合论文；2022 转外部顾问",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "雇主新闻稿，有宣传目的；不据此断言个人收入、幸福或职业最优解。"
        },
        "FA-AUTO": {
          "source_id": "FA-AUTO",
          "title": "Frances H. Arnold — Biographical",
          "publisher": "Nobel Prize / Frances Arnold",
          "url": "https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/",
          "type": "self_writing",
          "locator": "1979—1980 SERI；January 1981 Berkeley；January 1987 Caltech faculty",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。事后自述，需人类复核。"
        },
        "JG-AUTO": {
          "source_id": "JG-AUTO",
          "title": "Sir John B. Gurdon — Biographical",
          "publisher": "Nobel Prize / John Gurdon",
          "url": "https://www.nobelprize.org/prizes/medicine/2012/gurdon/biographical/",
          "type": "self_writing",
          "locator": "1952 Oxford admission / 1953 Zoology；1960 邀请；Post-Doctoral Work",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。1960 是邀约年份，赴美确切年份未据此锁定。"
        },
        "JG-INTERVIEW": {
          "source_id": "JG-INTERVIEW",
          "title": "Sir John Gurdon: Godfather of cloning",
          "publisher": "Journal of Cell Biology / PMC",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2315664/",
          "type": "interview",
          "locator": "Caltech bacteriophage postdoc 与一年后回到胚胎研究",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "2008 年回顾访谈；不能将不擅长某一实验等同于整体科研能力不足。"
        },
        "JD-BIO": {
          "source_id": "JD-BIO",
          "title": "James Dyson",
          "publisher": "Dyson",
          "url": "https://www.dyson.com/james-dyson",
          "type": "biography",
          "locator": "2014 electric vehicle；2019 halted",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "企业创始人介绍，有宣传选择偏差。"
        },
        "JD-CLOSE": {
          "source_id": "JD-CLOSE",
          "title": "An update on the Dyson automotive project",
          "publisher": "James Dyson / Dyson",
          "url": "https://www.dyson.com/automotive",
          "type": "self_writing",
          "locator": "2019-10-10 员工信：商业不可行、买方寻找失败、关闭项目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "管理层当时声明；员工安置是承诺，不当作已实现的结果。"
        },
        "SB-INVESTOR": {
          "source_id": "SB-INVESTOR",
          "title": "Slack",
          "publisher": "Andreessen Horowitz / John O’Farrell",
          "url": "https://a16z.com/announcement/slack/",
          "type": "biography",
          "locator": "October 2012 Glitch failure；40 to 8；$4m；Slack development",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人回顾，有利益关系；产品上市不证明所有员工或投资人均获益。"
        },
        "SB-ORIGIN": {
          "source_id": "SB-ORIGIN",
          "title": "What is Slack and how does it work?",
          "publisher": "Slack",
          "url": "https://slack.com/resources/why-use-slack/what-is-slack-and-how-does-it-work",
          "type": "biography",
          "locator": "internal chat tool for Glitch",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公司回顾仅支持内部工具起源；该页把游戏关闭写为 2013，与当时记录和投资人所述 2012 冲突，不用于关闭年份。"
        },
        "SB-LAUNCH": {
          "source_id": "SB-LAUNCH",
          "title": "Slack, The Newest Enterprise Social Network, Is The Latest Effort From Flickr Co-Founder Stewart Butterfield",
          "publisher": "TechCrunch",
          "url": "https://techcrunch.com/2013/08/14/say-hello-to-slack-the-newest-enterprise-social-network-and-the-latest-effort-from-flickr-co-founder-stewart-butterfields-tiny-speck/",
          "type": "biography",
          "locator": "2013-08-14 发布报道",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "仅用于发布年份，产品当时仍在有限测试阶段。"
        },
        "EY-BIO": {
          "source_id": "EY-BIO",
          "title": "Eric S. Yuan",
          "publisher": "Zoom Investor Relations",
          "url": "https://investors.zoom.us/board-member-management/eric-yuan",
          "type": "biography",
          "locator": "1997 WebEx、2007 Cisco、June 2011 Zoom",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**该域名（investors.zoom.us）有 Akamai 反爬，自动化工具与无头浏览器均被拒（返回 403 或超时），无法用工具确认深链是否仍存在。**人工核查路径：浏览器打开 investors.zoom.us → Governance → Board of Directors；交叉核对：https://en.wikipedia.org/wiki/Eric_Yuan （二手来源，仅用于交叉验证履历年份）。"
        },
        "EY-2023": {
          "source_id": "EY-2023",
          "title": "A Message from Eric Yuan, CEO of Zoom",
          "publisher": "Eric Yuan / Zoom",
          "url": "https://www.zoom.com/en/blog/a-message-from-eric-yuan-ceo-of-zoom/",
          "type": "self_writing",
          "locator": "2023-02-07 裁员约 1300 人、15%；承担责任",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "CEO 对员工的声明，不是独立调查，不能归咎于单次创办决定。"
        },
        "SA-INTERVIEW": {
          "source_id": "SA-INTERVIEW",
          "title": "How Sara Blakely Started Spanx",
          "publisher": "Sara Blakely / Inc.",
          "url": "https://www.inc.com/sara-blakely/how-sara-blakley-started-spanx.html",
          "type": "interview",
          "locator": "2012 视频文字：传真机销售、积蓄、夜间周末、一年打样",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创始人回忆，未确认准确离职日期。"
        },
        "SA-INVESTOR": {
          "source_id": "SA-INVESTOR",
          "title": "Behind the Deal: Blackstone’s Investment in SPANX",
          "publisher": "Blackstone",
          "url": "https://www.blackstone.com/insights/article/blackstones-investment-in-spanx/",
          "type": "biography",
          "locator": "2000 创办；2021 多数股权投资",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人公告；不使用估值推算本人到手财富。"
        },
        "FK-CHRON": {
          "source_id": "FK-CHRON",
          "title": "Chronik",
          "publisher": "S. Fischer Verlag / FranzKafka.de",
          "url": "https://www.franzkafka.de/leben/chronik",
          "type": "biography",
          "locator": "1908、1912、1922、1923、1924 年条目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "出版社年表；不据年表推断疾病与迁居的因果关系。"
        },
        "CN-AUTO": {
          "source_id": "CN-AUTO",
          "title": "Christiane Nüsslein-Volhard — Biographical",
          "publisher": "Nobel Prize / Christiane Nüsslein-Volhard",
          "url": "https://www.nobelprize.org/prizes/medicine/1995/nusslein-volhard/biographical/",
          "type": "self_writing",
          "locator": "1962 医院试做；summer 1964 Tübingen；Diplom 1969；PhD 1973",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。课程不合预期属于本人评价。"
        },
        "AE-UZH": {
          "source_id": "AE-UZH",
          "title": "Albert Einstein",
          "publisher": "University of Zurich",
          "url": "https://www.uzh.ch/en/researchinnovation/excellence/nobelprize/einstein",
          "type": "biography",
          "locator": "1900 无大学助教职位；1902—1909 专利局；1905 博士；1909 教职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "MODEL-V1": {
          "source_id": "MODEL-V1",
          "title": "本集的处境与类比建模规则",
          "publisher": "fu6868 / Codex",
          "type": "ai_inference",
          "local_path": "README.md",
          "locator": "事实、本人表述与建模",
          "accessed_on": "2026-10-02",
          "access_method": "local",
          "limitations": "仅是检索标注，不代表人物完整真实选项、心理、选择因果或用户成功概率。"
        }
      },
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 558,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2249,
        "parser_tokens": 508
      }
    }
  },
  {
    "id": 2,
    "name": "考研还是就业（延迟收益 vs 即时确定）",
    "raw_input": "大三了，家里人都劝我考研，说学历高点以后好走。但我手上有两个实习机会，转正概率不小。我担心考研三年出来还不如现在积累的工作经验，又怕不考研以后天花板太低。补充：成绩中等，考研把握一般；实习是喜欢的方向；家里能支持我读研，但我有点不好意思继续花家里的钱。",
    "situation": {
      "constraints": [
        "成绩中等考研把握一般",
        "实习转正概率不小",
        "家里支持读研",
        "不好意思再花家里钱"
      ],
      "dilemma": "考研提升学历 vs 实习积累经验",
      "goals": [
        "职业长远发展",
        "经济独立",
        "降低决策风险"
      ],
      "options": [
        "全力备战考研",
        "抓住实习转正",
        "边实习边备考"
      ],
      "reversibility": "medium",
      "risk": "high",
      "stage": "大三关键期",
      "unknowns": [
        "研究生毕业后的就业环境",
        "考研失败后的机会成本",
        "行业未来学历门槛变化"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "成绩中等考研把握一般",
          "实习转正概率不小",
          "家里支持读研",
          "不好意思再花家里钱"
        ],
        "dilemma": "考研提升学历 vs 实习积累经验",
        "goals": [
          "职业长远发展",
          "经济独立",
          "降低决策风险"
        ],
        "options": [
          "全力备战考研",
          "抓住实习转正",
          "边实习边备考"
        ],
        "reversibility": "medium",
        "risk": "high",
        "stage": "大三关键期",
        "unknowns": [
          "研究生毕业后的就业环境",
          "考研失败后的机会成本",
          "行业未来学历门槛变化"
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
            "path_match": 0.03949083621995152,
            "dilemma_match": 0.5504903566809576,
            "constraint_match": 0.6666666666666666,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【约束】现实约束有具体重叠：「不好意思再花家里钱」（对方的约束：晋升与经费受限、已有专业积累）",
            "【困境结构】两边的取舍都落在「放弃一边、换另一边」这一结构上（对方当时的困境：接受降职留研 vs 离开研究岗位）"
          ],
          "why_different": [
            "【约束差异】你面对「门槛与资格」类约束（成绩中等考研把握一般）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「抓住实习转正」这类低成本试探；案例里对方的实际动作是1995 年接受较低职位，继续 mRNA 研究。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1995 年（约 31 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「行业未来学历门槛变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「门槛与资格」类约束（成绩中等考研把握一般）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「抓住实习转正」这类低成本试探；案例里对方的实际动作是1995 年接受较低职位，继续 mRNA 研究。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「行业未来学历门槛变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "dilemma_match": 0.44003790048947167,
            "constraint_match": 0.4444444444444444,
            "goal_match": 0.25,
            "reversibility_match": 0.75,
            "difference_penalty": 0.39999999999999997
          },
          "why_similar": [
            "【约束】现实约束有重叠（对方的约束：跨行业能力待建立、商业化投入很大）",
            "【阶段】人生阶段接近（对方当时：企业跨行业）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（不好意思再花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「抓住实习转正」这类低成本试探；案例里对方的实际动作是启动电动车项目。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【未知】无法比较「研究生毕业后的就业环境」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（不好意思再花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「抓住实习转正」这类低成本试探；案例里对方的实际动作是启动电动车项目。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【未知】无法比较「研究生毕业后的就业环境」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "episode_id": "ramakrishnan_1978_yale_postdoc",
            "person": {
              "name": "文卡特拉曼·拉马克里希南",
              "tags": [
                "考研还是就业",
                "跨学科训练后"
              ]
            },
            "time": {
              "year": 1978,
              "stage": "跨学科训练后"
            },
            "prior_path": [
              "已在 UCSD 学习生物学约两年。"
            ],
            "decision_state": {
              "dilemma": "再读完整博士 vs 转入博士后研究",
              "options": [
                "再读完整博士",
                "转入博士后研究"
              ],
              "constraints": [
                "已有一个博士学位",
                "仍需新领域经验"
              ],
              "goals": [
                "进入具体课题",
                "避免重复学位训练"
              ],
              "risk": "medium",
              "reversibility": "medium"
            },
            "choice": {
              "type": "explore_then_switch",
              "actions": [
                "联系研究者后赴 Yale 做博士后，进入核糖体研究。"
              ]
            },
            "outcomes": {
              "short_term": "从补课阶段进入具体研究团队。",
              "mid_term": "未知：本集没有单独核实这一博后选择最初数年的全部成果与职位变化。",
              "long_term": "1999 年进入 LMB，2000 年参与确定核糖体亚基结构。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "博士后是已有博士者的研究岗位，不等同本科毕业直接就业；第二博士也不同于首次考研。",
                "未核实本人对这次选择的直接评价；不补写励志语录。",
                "未知：本集没有单独核实这一博后选择最初数年的全部成果与职位变化。"
              ]
            },
            "evidence": [
              {
                "source_id": "VR-AUTO",
                "type": "self_writing",
                "claim": "1978 年 Yale 博后与无需第二博士的选择。",
                "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/"
              },
              {
                "source_id": "VR-BIO",
                "type": "biography",
                "claim": "后续 LMB 及 2000 年研究进展。",
                "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。博士后是已有博士者的研究岗位，不等同本科毕业直接就业；第二博士也不同于首次考研。"
              }
            ],
            "retrieval_tags": [
              "考研还是就业",
              "explore_then_switch"
            ],
            "next_episode_ids": [
              "ramakrishnan_1999_lmb"
            ]
          },
          "dimensions": {
            "stage_match": 0.5,
            "path_match": 0.17334195153463738,
            "dilemma_match": 0.5387057470098663,
            "constraint_match": 0.5,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【约束】现实约束有具体重叠：「成绩中等考研把握一般」（对方的约束：已有一个博士学位、仍需新领域经验）",
            "【困境结构】两边的取舍都落在「放弃一边、换另一边」这一结构上（对方当时的困境：再读完整博士 vs 转入博士后研究）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（不好意思再花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「行业未来学历门槛变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（不好意思再花家里钱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「行业未来学历门槛变化」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "后续 LMB 及 2000 年研究进展。（VR-BIO）"
            ],
            "self_claims": [
              "1978 年 Yale 博后与无需第二博士的选择。（VR-AUTO）"
            ],
            "interpretations": [
              "从补课阶段进入具体研究团队。（outcomes.short_term）",
              "未知：本集没有单独核实这一博后选择最初数年的全部成果与职位变化。（outcomes.mid_term）",
              "1999 年进入 LMB，2000 年参与确定核糖体亚基结构。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "博士后是已有博士者的研究岗位，不等同本科毕业直接就业；第二博士也不同于首次考研。",
              "未核实本人对这次选择的直接评价；不补写励志语录。",
              "未知：本集没有单独核实这一博后选择最初数年的全部成果与职位变化。"
            ]
          }
        }
      ],
      "source_meta": {
        "LX-TOHOKU": {
          "source_id": "LX-TOHOKU",
          "title": "鲁迅的仙台留学",
          "publisher": "东北大学史料馆",
          "url": "https://www.archives.tohoku.ac.jp/luxun/cn/story/",
          "type": "biography",
          "locator": "赴日与仙台入学、第二学年退学",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-SENDAI": {
          "source_id": "LX-SENDAI",
          "title": "Chinese high school students visit Tohoku University",
          "publisher": "东北大学",
          "url": "https://www.tohoku.ac.jp/en/news/university_news/sakura_exchange_program.html",
          "type": "biography",
          "locator": "Lu Xun studied in Sendai from 1904 to 1906",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-PREFACE": {
          "source_id": "LX-PREFACE",
          "title": "《呐喊》自序（1922）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/wiki/吶喊",
          "type": "self_writing",
          "locator": "自序：医学、筹办新生、金心异劝写文章",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后自述与开放转录；动机按本人表述处理，不当作现场心理记录。"
        },
        "LX-SELECT": {
          "source_id": "LX-SELECT",
          "title": "《自选集》自序（1932）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/zh-hans/《自選集》自序",
          "type": "self_writing",
          "locator": "我做小说，是开手于一九一八年",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后回忆；不是逐日决策日志。"
        },
        "LX-MUSEUM": {
          "source_id": "LX-MUSEUM",
          "title": "鲁迅生平陈列：画出国人的魂灵",
          "publisher": "上海鲁迅纪念馆",
          "url": "https://www.luxunmuseum.cn/",
          "type": "biography",
          "locator": "1918—1922 年十四篇小说",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**原深链（/lxcl/index/id/5.html）2026-10-02 实测 404（官网改版），已改为站点首页；具体展览页需到馆内检索，未能定位到对应条目。**"
        },
        "AL-INTERVIEW": {
          "source_id": "AL-INTERVIEW",
          "title": "李安｜聆听电影之神的声音",
          "publisher": "澎湃转载楚尘文化《李安访谈录》",
          "url": "https://m.thepaper.cn/newsDetail_forward_27605082",
          "type": "interview",
          "locator": "格伦·肯尼访谈：毕业后六年、1990 年剧本比赛、推手",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "中文译编的事后访谈；未将六年没有执导机会扩大成六年无任何正式工作。"
        },
        "AL-NYU": {
          "source_id": "AL-NYU",
          "title": "Ang Lee — Tisch Gala 2024",
          "publisher": "纽约大学 Tisch",
          "url": "https://tisch.nyu.edu/giving/the-tisch-gala/tisch-gala-2024/ang-lee.html",
          "type": "biography",
          "locator": "1984 MFA、后续影片与奖项",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "页面把首部长片写在 1990 年；本集仅用来核对毕业与后续生涯，影片上映年采用访谈的 1991 年。"
        },
        "HM-SELF": {
          "source_id": "HM-SELF",
          "title": "Haruki Murakami: The Moment I Became a Novelist",
          "publisher": "Haruki Murakami / Literary Hub / Knopf",
          "url": "https://lithub.com/haruki-murakami-the-moment-i-became-a-novelist/",
          "type": "self_writing",
          "locator": "1978 球赛、营业后写作、1979 首作、卖店专职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "2015 年出版的自述节选；回顾性解释不代表 1978 年已有明确三年转行计划。"
        },
        "HM-1981": {
          "source_id": "HM-1981",
          "title": "Haruki Murakami",
          "publisher": "Biblioteca Salaborsa Ragazzi / Bologna",
          "url": "https://www.bibliotecasalaborsa.it/ragazzi/profiles/profile-dd3b04",
          "type": "biography",
          "locator": "Nel 1981 Murakami vende il jazz bar",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公共图书馆的二手人物简介，仅补足卖店年份。"
        },
        "CD-STUDY": {
          "source_id": "CD-STUDY",
          "title": "Darwin’s student booklist",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/people/about-darwin/what-darwin-read/darwin-s-student-booklist",
          "type": "biography",
          "locator": "Edinburgh 1825—1827；Cambridge January 1828",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-CHURCH": {
          "source_id": "CD-CHURCH",
          "title": "Darwin and the Church",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/religion/darwin-and-church",
          "type": "biography",
          "locator": "Cambridge degree and intended clerical career",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-BEAGLE": {
          "source_id": "CD-BEAGLE",
          "title": "Voyage of HMS Beagle",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/voyage-hms-beagle",
          "type": "biography",
          "locator": "1831 邀请、父亲资助；1831-12-27 至 1836-10-02 航行",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-REED": {
          "source_id": "SJ-REED",
          "title": "Steve Jobs and Reed College",
          "publisher": "Reed College",
          "url": "https://www.reed.edu/about/steve-jobs.html",
          "type": "biography",
          "locator": "fall 1972；one semester；auditing classes",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-SPEECH": {
          "source_id": "SJ-SPEECH",
          "title": "‘You’ve got to find what you love,’ Jobs says",
          "publisher": "Steve Jobs / Stanford University",
          "url": "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
          "type": "self_writing",
          "locator": "2005 毕业演讲：退学与重启事业两部分",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "预备演讲稿，动机与意义归本人回顾；不把退学认定为创业成功原因。"
        },
        "JB-SPEECH": {
          "source_id": "JB-SPEECH",
          "title": "2010 Baccalaureate remarks",
          "publisher": "Jeff Bezos / Princeton University",
          "url": "https://www.princeton.edu/news/2010/05/30/2010-baccalaureate-remarks",
          "type": "self_writing",
          "locator": "16 years ago、老板要求考虑 48 小时、离职创建 Amazon",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创业者事后回忆；没有未创业的对照结局。"
        },
        "BM-LJMU": {
          "source_id": "BM-LJMU",
          "title": "Brian May profile",
          "publisher": "Liverpool John Moores University",
          "url": "https://www.ljmu.ac.uk/about-us/bicentenary/our-people/brian-may/brian-may-profile",
          "type": "biography",
          "locator": "1974 中断博士，2006 重返，2007 取得博士",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "BM-IMPERIAL": {
          "source_id": "BM-IMPERIAL",
          "title": "Annual Alumni Lecture 2007",
          "publisher": "Imperial College London",
          "url": "https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/",
          "type": "biography",
          "locator": "2006 决定恢复、三十年文献补读、2007 年八月论文",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "VR-AUTO": {
          "source_id": "VR-AUTO",
          "title": "Venkatraman Ramakrishnan — Biographical",
          "publisher": "Nobel Prize / Venki Ramakrishnan",
          "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/",
          "type": "self_writing",
          "locator": "1976 UCSD、1978 Yale、1999 LMB",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "直接打开受站点限制；已核对搜索索引中的长段正文，合并前建议人类复核原页。事后自述。"
        },
        "VR-BIO": {
          "source_id": "VR-BIO",
          "title": "About Venki Ramakrishnan",
          "publisher": "Nobel Prize Inspiration Initiative",
          "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/",
          "type": "biography",
          "locator": "1976 PhD；UCSD two years；1999 LMB；2000 ribosome structure",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-ROCK": {
          "source_id": "KK-ROCK",
          "title": "Katalin Karikó",
          "publisher": "Rockefeller University / Evelyn Strauss",
          "url": "https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/",
          "type": "biography",
          "locator": "1995 降职；1997 Weissman；2005、2008、2009 研究与职位",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-BION": {
          "source_id": "KK-BION",
          "title": "Katalin Karikó and Drew Weissman awarded Nobel Prize",
          "publisher": "BioNTech",
          "url": "https://www.biontech.com/int/en/home/mediaroom/news/statements/2023/10/statement-katalin-kariko-and-drew-weissman-awarded-nobel-prize.html",
          "type": "biography",
          "locator": "2013 入职；2014 联合论文；2022 转外部顾问",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "雇主新闻稿，有宣传目的；不据此断言个人收入、幸福或职业最优解。"
        },
        "FA-AUTO": {
          "source_id": "FA-AUTO",
          "title": "Frances H. Arnold — Biographical",
          "publisher": "Nobel Prize / Frances Arnold",
          "url": "https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/",
          "type": "self_writing",
          "locator": "1979—1980 SERI；January 1981 Berkeley；January 1987 Caltech faculty",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。事后自述，需人类复核。"
        },
        "JG-AUTO": {
          "source_id": "JG-AUTO",
          "title": "Sir John B. Gurdon — Biographical",
          "publisher": "Nobel Prize / John Gurdon",
          "url": "https://www.nobelprize.org/prizes/medicine/2012/gurdon/biographical/",
          "type": "self_writing",
          "locator": "1952 Oxford admission / 1953 Zoology；1960 邀请；Post-Doctoral Work",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。1960 是邀约年份，赴美确切年份未据此锁定。"
        },
        "JG-INTERVIEW": {
          "source_id": "JG-INTERVIEW",
          "title": "Sir John Gurdon: Godfather of cloning",
          "publisher": "Journal of Cell Biology / PMC",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2315664/",
          "type": "interview",
          "locator": "Caltech bacteriophage postdoc 与一年后回到胚胎研究",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "2008 年回顾访谈；不能将不擅长某一实验等同于整体科研能力不足。"
        },
        "JD-BIO": {
          "source_id": "JD-BIO",
          "title": "James Dyson",
          "publisher": "Dyson",
          "url": "https://www.dyson.com/james-dyson",
          "type": "biography",
          "locator": "2014 electric vehicle；2019 halted",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "企业创始人介绍，有宣传选择偏差。"
        },
        "JD-CLOSE": {
          "source_id": "JD-CLOSE",
          "title": "An update on the Dyson automotive project",
          "publisher": "James Dyson / Dyson",
          "url": "https://www.dyson.com/automotive",
          "type": "self_writing",
          "locator": "2019-10-10 员工信：商业不可行、买方寻找失败、关闭项目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "管理层当时声明；员工安置是承诺，不当作已实现的结果。"
        },
        "SB-INVESTOR": {
          "source_id": "SB-INVESTOR",
          "title": "Slack",
          "publisher": "Andreessen Horowitz / John O’Farrell",
          "url": "https://a16z.com/announcement/slack/",
          "type": "biography",
          "locator": "October 2012 Glitch failure；40 to 8；$4m；Slack development",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人回顾，有利益关系；产品上市不证明所有员工或投资人均获益。"
        },
        "SB-ORIGIN": {
          "source_id": "SB-ORIGIN",
          "title": "What is Slack and how does it work?",
          "publisher": "Slack",
          "url": "https://slack.com/resources/why-use-slack/what-is-slack-and-how-does-it-work",
          "type": "biography",
          "locator": "internal chat tool for Glitch",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公司回顾仅支持内部工具起源；该页把游戏关闭写为 2013，与当时记录和投资人所述 2012 冲突，不用于关闭年份。"
        },
        "SB-LAUNCH": {
          "source_id": "SB-LAUNCH",
          "title": "Slack, The Newest Enterprise Social Network, Is The Latest Effort From Flickr Co-Founder Stewart Butterfield",
          "publisher": "TechCrunch",
          "url": "https://techcrunch.com/2013/08/14/say-hello-to-slack-the-newest-enterprise-social-network-and-the-latest-effort-from-flickr-co-founder-stewart-butterfields-tiny-speck/",
          "type": "biography",
          "locator": "2013-08-14 发布报道",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "仅用于发布年份，产品当时仍在有限测试阶段。"
        },
        "EY-BIO": {
          "source_id": "EY-BIO",
          "title": "Eric S. Yuan",
          "publisher": "Zoom Investor Relations",
          "url": "https://investors.zoom.us/board-member-management/eric-yuan",
          "type": "biography",
          "locator": "1997 WebEx、2007 Cisco、June 2011 Zoom",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**该域名（investors.zoom.us）有 Akamai 反爬，自动化工具与无头浏览器均被拒（返回 403 或超时），无法用工具确认深链是否仍存在。**人工核查路径：浏览器打开 investors.zoom.us → Governance → Board of Directors；交叉核对：https://en.wikipedia.org/wiki/Eric_Yuan （二手来源，仅用于交叉验证履历年份）。"
        },
        "EY-2023": {
          "source_id": "EY-2023",
          "title": "A Message from Eric Yuan, CEO of Zoom",
          "publisher": "Eric Yuan / Zoom",
          "url": "https://www.zoom.com/en/blog/a-message-from-eric-yuan-ceo-of-zoom/",
          "type": "self_writing",
          "locator": "2023-02-07 裁员约 1300 人、15%；承担责任",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "CEO 对员工的声明，不是独立调查，不能归咎于单次创办决定。"
        },
        "SA-INTERVIEW": {
          "source_id": "SA-INTERVIEW",
          "title": "How Sara Blakely Started Spanx",
          "publisher": "Sara Blakely / Inc.",
          "url": "https://www.inc.com/sara-blakely/how-sara-blakley-started-spanx.html",
          "type": "interview",
          "locator": "2012 视频文字：传真机销售、积蓄、夜间周末、一年打样",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创始人回忆，未确认准确离职日期。"
        },
        "SA-INVESTOR": {
          "source_id": "SA-INVESTOR",
          "title": "Behind the Deal: Blackstone’s Investment in SPANX",
          "publisher": "Blackstone",
          "url": "https://www.blackstone.com/insights/article/blackstones-investment-in-spanx/",
          "type": "biography",
          "locator": "2000 创办；2021 多数股权投资",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人公告；不使用估值推算本人到手财富。"
        },
        "FK-CHRON": {
          "source_id": "FK-CHRON",
          "title": "Chronik",
          "publisher": "S. Fischer Verlag / FranzKafka.de",
          "url": "https://www.franzkafka.de/leben/chronik",
          "type": "biography",
          "locator": "1908、1912、1922、1923、1924 年条目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "出版社年表；不据年表推断疾病与迁居的因果关系。"
        },
        "CN-AUTO": {
          "source_id": "CN-AUTO",
          "title": "Christiane Nüsslein-Volhard — Biographical",
          "publisher": "Nobel Prize / Christiane Nüsslein-Volhard",
          "url": "https://www.nobelprize.org/prizes/medicine/1995/nusslein-volhard/biographical/",
          "type": "self_writing",
          "locator": "1962 医院试做；summer 1964 Tübingen；Diplom 1969；PhD 1973",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。课程不合预期属于本人评价。"
        },
        "AE-UZH": {
          "source_id": "AE-UZH",
          "title": "Albert Einstein",
          "publisher": "University of Zurich",
          "url": "https://www.uzh.ch/en/researchinnovation/excellence/nobelprize/einstein",
          "type": "biography",
          "locator": "1900 无大学助教职位；1902—1909 专利局；1905 博士；1909 教职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "MODEL-V1": {
          "source_id": "MODEL-V1",
          "title": "本集的处境与类比建模规则",
          "publisher": "fu6868 / Codex",
          "type": "ai_inference",
          "local_path": "README.md",
          "locator": "事实、本人表述与建模",
          "accessed_on": "2026-10-02",
          "access_method": "local",
          "limitations": "仅是检索标注，不代表人物完整真实选项、心理、选择因果或用户成功概率。"
        }
      },
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 193,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2330,
        "parser_tokens": 510
      }
    }
  },
  {
    "id": 3,
    "name": "大厂还是小公司/创业（稳定 vs 成长空间）",
    "raw_input": "毕业两年了，在一家小公司做产品，学得快但看不到晋升路径。拿到了一个大厂的 offer，薪资涨三成，但岗位方向比较窄。我很纠结要不要去，怕自己变成螺丝钉，又怕留下来错过平台机会。补充：目前存款不多；无家庭负担；最在意成长空间和长期竞争力。",
    "situation": {
      "constraints": [
        "毕业两年经验",
        "存款不多",
        "无家庭负担",
        "大厂岗位方向窄"
      ],
      "dilemma": "留小厂求全能 vs 去大厂做螺丝钉",
      "goals": [
        "提升成长空间",
        "确保长期竞争力",
        "薪资增长"
      ],
      "options": [
        "留任小公司",
        "入职大厂",
        "继续寻找新机会"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "职场新人期",
      "unknowns": [
        "大厂具体业务发展前景",
        "大厂内部转岗难度",
        "小公司未来稳定性",
        "窄方向的市场通用性"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "毕业两年经验",
          "存款不多",
          "无家庭负担",
          "大厂岗位方向窄"
        ],
        "dilemma": "留小厂求全能 vs 去大厂做螺丝钉",
        "goals": [
          "提升成长空间",
          "确保长期竞争力",
          "薪资增长"
        ],
        "options": [
          "留任小公司",
          "入职大厂",
          "继续寻找新机会"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "职场新人期",
        "unknowns": [
          "大厂具体业务发展前景",
          "大厂内部转岗难度",
          "小公司未来稳定性",
          "窄方向的市场通用性"
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
            "stage_match": 0.9,
            "path_match": 0.06995060415848266,
            "dilemma_match": 0.3645670096279062,
            "constraint_match": 0.4,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.35
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：重返研究）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "episode_id": "butterfield_2012_close_glitch",
            "person": {
              "name": "斯图尔特·巴特菲尔德",
              "tags": [
                "大厂还是小公司/创业",
                "创业项目止损"
              ]
            },
            "time": {
              "year": 2012,
              "stage": "创业项目止损"
            },
            "prior_path": [
              "Tiny Speck 经营网络游戏 Glitch，增长没有达到预期。"
            ],
            "decision_state": {
              "dilemma": "继续投入游戏 vs 关闭并缩小团队",
              "options": [
                "继续投入游戏",
                "关闭并缩小团队"
              ],
              "constraints": [
                "产品需求不足",
                "团队依赖融资"
              ],
              "goals": [
                "限制后续损失",
                "寻找人员出路"
              ],
              "risk": "high",
              "reversibility": "low"
            },
            "choice": {
              "type": "abandon",
              "actions": [
                "2012 年决定关闭 Glitch，缩减团队。"
              ]
            },
            "outcomes": {
              "short_term": "游戏关闭，投资人回顾称团队由约四十人缩至八人。",
              "mid_term": "剩余团队探索工作沟通工具，之后形成 Slack。",
              "long_term": "2019 年 Slack 上市；这不改变原游戏失败及裁员的事实。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "尚有投资资金与投资人支持的退出不同于资金耗尽的普通创业者；保留成员的后续收益不代表被裁者。",
                "未核实本人对这次选择的直接评价；不补写励志语录。"
              ]
            },
            "evidence": [
              {
                "source_id": "SB-INVESTOR",
                "type": "biography",
                "claim": "2012 项目失败、团队缩减及后续 Slack。",
                "url": "https://a16z.com/announcement/slack/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。尚有投资资金与投资人支持的退出不同于资金耗尽的普通创业者；保留成员的后续收益不代表被裁者。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "abandon"
            ],
            "next_episode_ids": [
              "butterfield_2013_slack_pivot"
            ]
          },
          "dimensions": {
            "stage_match": 0.9,
            "path_match": 0.21800780421908889,
            "dilemma_match": 0.4349070254785464,
            "constraint_match": 0.2573770491803279,
            "goal_match": 0.15,
            "reversibility_match": 0.75,
            "difference_penalty": 0.49999999999999994
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：创业项目止损）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「低」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【可逆性差异】你的选择可逆性为「中」，对方当时评估为「低」——对方几乎没有退路，其代价结构比你的情形更重（依据：reversibility 字段对比）",
            "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【可逆性差异】你的选择可逆性为「中」，对方当时评估为「低」——对方几乎没有退路，其代价结构比你的情形更重（依据：reversibility 字段对比）",
              "kind": "structure",
              "basis": "reversibility 字段对比",
              "refs": [
                "decision_state.reversibility"
              ]
            },
            {
              "text": "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "2012 项目失败、团队缩减及后续 Slack。（SB-INVESTOR）"
            ],
            "self_claims": [],
            "interpretations": [
              "游戏关闭，投资人回顾称团队由约四十人缩至八人。（outcomes.short_term）",
              "剩余团队探索工作沟通工具，之后形成 Slack。（outcomes.mid_term）",
              "2019 年 Slack 上市；这不改变原游戏失败及裁员的事实。（outcomes.long_term）"
            ],
            "ai_inferences": [],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "尚有投资资金与投资人支持的退出不同于资金耗尽的普通创业者；保留成员的后续收益不代表被裁者。",
              "未核实本人对这次选择的直接评价；不补写励志语录。"
            ]
          }
        },
        {
          "episode": {
            "episode_id": "yuan_2011_zoom",
            "person": {
              "name": "袁征",
              "tags": [
                "大厂还是小公司/创业",
                "大公司转创业"
              ]
            },
            "time": {
              "year": 2011,
              "stage": "大公司转创业"
            },
            "prior_path": [
              "1997 年进入 WebEx，2007 年随收购进入 Cisco，任工程管理职务。"
            ],
            "decision_state": {
              "dilemma": "留在 Cisco vs 另建通信产品",
              "options": [
                "留在 Cisco",
                "另建通信产品"
              ],
              "constraints": [
                "需另组团队",
                "已有职业机会成本"
              ],
              "goals": [
                "自主做产品",
                "建立新的组织"
              ],
              "risk": "high",
              "reversibility": "medium"
            },
            "choice": {
              "type": "direct_switch",
              "actions": [
                "2011 年创办 Zoom。"
              ]
            },
            "outcomes": {
              "short_term": "从大公司工程管理转为新公司创办者。",
              "mid_term": "未知：这些来源没有逐年给出最初数年的个人生活与薪酬结果。",
              "long_term": "2023 年 Zoom 宣布裁员约 1300 人；规模增长之后仍有组织收缩代价。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "管理经验、产业关系与融资能力不能假设普通职员也具备；裁员不可单因归于创办决定。",
                "未知：这些来源没有逐年给出最初数年的个人生活与薪酬结果。"
              ],
              "self_comment": "2023 年员工信中，他为公司增长后的判断失误承担责任；不是对 2011 年离职的一句成功总结。"
            },
            "evidence": [
              {
                "source_id": "EY-BIO",
                "type": "biography",
                "claim": "WebEx/Cisco 履历和 2011 年创办 Zoom。",
                "url": "https://investors.zoom.us/board-member-management/eric-yuan"
              },
              {
                "source_id": "EY-2023",
                "type": "self_writing",
                "claim": "2023 裁员及 CEO 对过快扩张的反思。",
                "url": "https://www.zoom.com/en/blog/a-message-from-eric-yuan-ceo-of-zoom/"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。管理经验、产业关系与融资能力不能假设普通职员也具备；裁员不可单因归于创办决定。"
              }
            ],
            "retrieval_tags": [
              "大厂还是小公司/创业",
              "direct_switch"
            ]
          },
          "dimensions": {
            "stage_match": 0.9,
            "path_match": 0.13186306936849904,
            "dilemma_match": 0.5234256106459108,
            "constraint_match": 0.15,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：大公司转创业）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【未知】无法比较「大厂具体业务发展前景」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "WebEx/Cisco 履历和 2011 年创办 Zoom。（EY-BIO）"
            ],
            "self_claims": [
              "2023 裁员及 CEO 对过快扩张的反思。（EY-2023）",
              "2023 年员工信中，他为公司增长后的判断失误承担责任；不是对 2011 年离职的一句成功总结。（reflection.self_comment，本人自述）"
            ],
            "interpretations": [
              "从大公司工程管理转为新公司创办者。（outcomes.short_term）",
              "未知：这些来源没有逐年给出最初数年的个人生活与薪酬结果。（outcomes.mid_term）",
              "2023 年 Zoom 宣布裁员约 1300 人；规模增长之后仍有组织收缩代价。（outcomes.long_term）"
            ],
            "ai_inferences": [],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "管理经验、产业关系与融资能力不能假设普通职员也具备；裁员不可单因归于创办决定。",
              "未知：这些来源没有逐年给出最初数年的个人生活与薪酬结果。"
            ]
          }
        }
      ],
      "source_meta": {
        "LX-TOHOKU": {
          "source_id": "LX-TOHOKU",
          "title": "鲁迅的仙台留学",
          "publisher": "东北大学史料馆",
          "url": "https://www.archives.tohoku.ac.jp/luxun/cn/story/",
          "type": "biography",
          "locator": "赴日与仙台入学、第二学年退学",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-SENDAI": {
          "source_id": "LX-SENDAI",
          "title": "Chinese high school students visit Tohoku University",
          "publisher": "东北大学",
          "url": "https://www.tohoku.ac.jp/en/news/university_news/sakura_exchange_program.html",
          "type": "biography",
          "locator": "Lu Xun studied in Sendai from 1904 to 1906",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "LX-PREFACE": {
          "source_id": "LX-PREFACE",
          "title": "《呐喊》自序（1922）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/wiki/吶喊",
          "type": "self_writing",
          "locator": "自序：医学、筹办新生、金心异劝写文章",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后自述与开放转录；动机按本人表述处理，不当作现场心理记录。"
        },
        "LX-SELECT": {
          "source_id": "LX-SELECT",
          "title": "《自选集》自序（1932）",
          "publisher": "鲁迅；维基文库转录",
          "url": "https://zh.wikisource.org/zh-hans/《自選集》自序",
          "type": "self_writing",
          "locator": "我做小说，是开手于一九一八年",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "事后回忆；不是逐日决策日志。"
        },
        "LX-MUSEUM": {
          "source_id": "LX-MUSEUM",
          "title": "鲁迅生平陈列：画出国人的魂灵",
          "publisher": "上海鲁迅纪念馆",
          "url": "https://www.luxunmuseum.cn/",
          "type": "biography",
          "locator": "1918—1922 年十四篇小说",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**原深链（/lxcl/index/id/5.html）2026-10-02 实测 404（官网改版），已改为站点首页；具体展览页需到馆内检索，未能定位到对应条目。**"
        },
        "AL-INTERVIEW": {
          "source_id": "AL-INTERVIEW",
          "title": "李安｜聆听电影之神的声音",
          "publisher": "澎湃转载楚尘文化《李安访谈录》",
          "url": "https://m.thepaper.cn/newsDetail_forward_27605082",
          "type": "interview",
          "locator": "格伦·肯尼访谈：毕业后六年、1990 年剧本比赛、推手",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "中文译编的事后访谈；未将六年没有执导机会扩大成六年无任何正式工作。"
        },
        "AL-NYU": {
          "source_id": "AL-NYU",
          "title": "Ang Lee — Tisch Gala 2024",
          "publisher": "纽约大学 Tisch",
          "url": "https://tisch.nyu.edu/giving/the-tisch-gala/tisch-gala-2024/ang-lee.html",
          "type": "biography",
          "locator": "1984 MFA、后续影片与奖项",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "页面把首部长片写在 1990 年；本集仅用来核对毕业与后续生涯，影片上映年采用访谈的 1991 年。"
        },
        "HM-SELF": {
          "source_id": "HM-SELF",
          "title": "Haruki Murakami: The Moment I Became a Novelist",
          "publisher": "Haruki Murakami / Literary Hub / Knopf",
          "url": "https://lithub.com/haruki-murakami-the-moment-i-became-a-novelist/",
          "type": "self_writing",
          "locator": "1978 球赛、营业后写作、1979 首作、卖店专职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "2015 年出版的自述节选；回顾性解释不代表 1978 年已有明确三年转行计划。"
        },
        "HM-1981": {
          "source_id": "HM-1981",
          "title": "Haruki Murakami",
          "publisher": "Biblioteca Salaborsa Ragazzi / Bologna",
          "url": "https://www.bibliotecasalaborsa.it/ragazzi/profiles/profile-dd3b04",
          "type": "biography",
          "locator": "Nel 1981 Murakami vende il jazz bar",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公共图书馆的二手人物简介，仅补足卖店年份。"
        },
        "CD-STUDY": {
          "source_id": "CD-STUDY",
          "title": "Darwin’s student booklist",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/people/about-darwin/what-darwin-read/darwin-s-student-booklist",
          "type": "biography",
          "locator": "Edinburgh 1825—1827；Cambridge January 1828",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-CHURCH": {
          "source_id": "CD-CHURCH",
          "title": "Darwin and the Church",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/religion/darwin-and-church",
          "type": "biography",
          "locator": "Cambridge degree and intended clerical career",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "CD-BEAGLE": {
          "source_id": "CD-BEAGLE",
          "title": "Voyage of HMS Beagle",
          "publisher": "Darwin Correspondence Project / Cambridge",
          "url": "https://www.darwinproject.ac.uk/commentary/voyage-hms-beagle",
          "type": "biography",
          "locator": "1831 邀请、父亲资助；1831-12-27 至 1836-10-02 航行",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-REED": {
          "source_id": "SJ-REED",
          "title": "Steve Jobs and Reed College",
          "publisher": "Reed College",
          "url": "https://www.reed.edu/about/steve-jobs.html",
          "type": "biography",
          "locator": "fall 1972；one semester；auditing classes",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "SJ-SPEECH": {
          "source_id": "SJ-SPEECH",
          "title": "‘You’ve got to find what you love,’ Jobs says",
          "publisher": "Steve Jobs / Stanford University",
          "url": "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says",
          "type": "self_writing",
          "locator": "2005 毕业演讲：退学与重启事业两部分",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "预备演讲稿，动机与意义归本人回顾；不把退学认定为创业成功原因。"
        },
        "JB-SPEECH": {
          "source_id": "JB-SPEECH",
          "title": "2010 Baccalaureate remarks",
          "publisher": "Jeff Bezos / Princeton University",
          "url": "https://www.princeton.edu/news/2010/05/30/2010-baccalaureate-remarks",
          "type": "self_writing",
          "locator": "16 years ago、老板要求考虑 48 小时、离职创建 Amazon",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创业者事后回忆；没有未创业的对照结局。"
        },
        "BM-LJMU": {
          "source_id": "BM-LJMU",
          "title": "Brian May profile",
          "publisher": "Liverpool John Moores University",
          "url": "https://www.ljmu.ac.uk/about-us/bicentenary/our-people/brian-may/brian-may-profile",
          "type": "biography",
          "locator": "1974 中断博士，2006 重返，2007 取得博士",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "BM-IMPERIAL": {
          "source_id": "BM-IMPERIAL",
          "title": "Annual Alumni Lecture 2007",
          "publisher": "Imperial College London",
          "url": "https://www.imperial.ac.uk/news/30594/annual-alumni-lecture-2007/",
          "type": "biography",
          "locator": "2006 决定恢复、三十年文献补读、2007 年八月论文",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "VR-AUTO": {
          "source_id": "VR-AUTO",
          "title": "Venkatraman Ramakrishnan — Biographical",
          "publisher": "Nobel Prize / Venki Ramakrishnan",
          "url": "https://www.nobelprize.org/prizes/chemistry/2009/ramakrishnan/biographical/",
          "type": "self_writing",
          "locator": "1976 UCSD、1978 Yale、1999 LMB",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "直接打开受站点限制；已核对搜索索引中的长段正文，合并前建议人类复核原页。事后自述。"
        },
        "VR-BIO": {
          "source_id": "VR-BIO",
          "title": "About Venki Ramakrishnan",
          "publisher": "Nobel Prize Inspiration Initiative",
          "url": "https://www.nobelprize.org/events/nobel-prize-inspiration-initiative/germany-2021-2/about-venki-ramakrishnan/",
          "type": "biography",
          "locator": "1976 PhD；UCSD two years；1999 LMB；2000 ribosome structure",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-ROCK": {
          "source_id": "KK-ROCK",
          "title": "Katalin Karikó",
          "publisher": "Rockefeller University / Evelyn Strauss",
          "url": "https://www.rockefeller.edu/greengard-prize/recipients/katalin-kariko/",
          "type": "biography",
          "locator": "1995 降职；1997 Weissman；2005、2008、2009 研究与职位",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "KK-BION": {
          "source_id": "KK-BION",
          "title": "Katalin Karikó and Drew Weissman awarded Nobel Prize",
          "publisher": "BioNTech",
          "url": "https://www.biontech.com/int/en/home/mediaroom/news/statements/2023/10/statement-katalin-kariko-and-drew-weissman-awarded-nobel-prize.html",
          "type": "biography",
          "locator": "2013 入职；2014 联合论文；2022 转外部顾问",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "雇主新闻稿，有宣传目的；不据此断言个人收入、幸福或职业最优解。"
        },
        "FA-AUTO": {
          "source_id": "FA-AUTO",
          "title": "Frances H. Arnold — Biographical",
          "publisher": "Nobel Prize / Frances Arnold",
          "url": "https://www.nobelprize.org/prizes/chemistry/2018/arnold/biographical/",
          "type": "self_writing",
          "locator": "1979—1980 SERI；January 1981 Berkeley；January 1987 Caltech faculty",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。事后自述，需人类复核。"
        },
        "JG-AUTO": {
          "source_id": "JG-AUTO",
          "title": "Sir John B. Gurdon — Biographical",
          "publisher": "Nobel Prize / John Gurdon",
          "url": "https://www.nobelprize.org/prizes/medicine/2012/gurdon/biographical/",
          "type": "self_writing",
          "locator": "1952 Oxford admission / 1953 Zoology；1960 邀请；Post-Doctoral Work",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。1960 是邀约年份，赴美确切年份未据此锁定。"
        },
        "JG-INTERVIEW": {
          "source_id": "JG-INTERVIEW",
          "title": "Sir John Gurdon: Godfather of cloning",
          "publisher": "Journal of Cell Biology / PMC",
          "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2315664/",
          "type": "interview",
          "locator": "Caltech bacteriophage postdoc 与一年后回到胚胎研究",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "2008 年回顾访谈；不能将不擅长某一实验等同于整体科研能力不足。"
        },
        "JD-BIO": {
          "source_id": "JD-BIO",
          "title": "James Dyson",
          "publisher": "Dyson",
          "url": "https://www.dyson.com/james-dyson",
          "type": "biography",
          "locator": "2014 electric vehicle；2019 halted",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "企业创始人介绍，有宣传选择偏差。"
        },
        "JD-CLOSE": {
          "source_id": "JD-CLOSE",
          "title": "An update on the Dyson automotive project",
          "publisher": "James Dyson / Dyson",
          "url": "https://www.dyson.com/automotive",
          "type": "self_writing",
          "locator": "2019-10-10 员工信：商业不可行、买方寻找失败、关闭项目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "管理层当时声明；员工安置是承诺，不当作已实现的结果。"
        },
        "SB-INVESTOR": {
          "source_id": "SB-INVESTOR",
          "title": "Slack",
          "publisher": "Andreessen Horowitz / John O’Farrell",
          "url": "https://a16z.com/announcement/slack/",
          "type": "biography",
          "locator": "October 2012 Glitch failure；40 to 8；$4m；Slack development",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人回顾，有利益关系；产品上市不证明所有员工或投资人均获益。"
        },
        "SB-ORIGIN": {
          "source_id": "SB-ORIGIN",
          "title": "What is Slack and how does it work?",
          "publisher": "Slack",
          "url": "https://slack.com/resources/why-use-slack/what-is-slack-and-how-does-it-work",
          "type": "biography",
          "locator": "internal chat tool for Glitch",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "公司回顾仅支持内部工具起源；该页把游戏关闭写为 2013，与当时记录和投资人所述 2012 冲突，不用于关闭年份。"
        },
        "SB-LAUNCH": {
          "source_id": "SB-LAUNCH",
          "title": "Slack, The Newest Enterprise Social Network, Is The Latest Effort From Flickr Co-Founder Stewart Butterfield",
          "publisher": "TechCrunch",
          "url": "https://techcrunch.com/2013/08/14/say-hello-to-slack-the-newest-enterprise-social-network-and-the-latest-effort-from-flickr-co-founder-stewart-butterfields-tiny-speck/",
          "type": "biography",
          "locator": "2013-08-14 发布报道",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "仅用于发布年份，产品当时仍在有限测试阶段。"
        },
        "EY-BIO": {
          "source_id": "EY-BIO",
          "title": "Eric S. Yuan",
          "publisher": "Zoom Investor Relations",
          "url": "https://investors.zoom.us/board-member-management/eric-yuan",
          "type": "biography",
          "locator": "1997 WebEx、2007 Cisco、June 2011 Zoom",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。**该域名（investors.zoom.us）有 Akamai 反爬，自动化工具与无头浏览器均被拒（返回 403 或超时），无法用工具确认深链是否仍存在。**人工核查路径：浏览器打开 investors.zoom.us → Governance → Board of Directors；交叉核对：https://en.wikipedia.org/wiki/Eric_Yuan （二手来源，仅用于交叉验证履历年份）。"
        },
        "EY-2023": {
          "source_id": "EY-2023",
          "title": "A Message from Eric Yuan, CEO of Zoom",
          "publisher": "Eric Yuan / Zoom",
          "url": "https://www.zoom.com/en/blog/a-message-from-eric-yuan-ceo-of-zoom/",
          "type": "self_writing",
          "locator": "2023-02-07 裁员约 1300 人、15%；承担责任",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "CEO 对员工的声明，不是独立调查，不能归咎于单次创办决定。"
        },
        "SA-INTERVIEW": {
          "source_id": "SA-INTERVIEW",
          "title": "How Sara Blakely Started Spanx",
          "publisher": "Sara Blakely / Inc.",
          "url": "https://www.inc.com/sara-blakely/how-sara-blakley-started-spanx.html",
          "type": "interview",
          "locator": "2012 视频文字：传真机销售、积蓄、夜间周末、一年打样",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "创始人回忆，未确认准确离职日期。"
        },
        "SA-INVESTOR": {
          "source_id": "SA-INVESTOR",
          "title": "Behind the Deal: Blackstone’s Investment in SPANX",
          "publisher": "Blackstone",
          "url": "https://www.blackstone.com/insights/article/blackstones-investment-in-spanx/",
          "type": "biography",
          "locator": "2000 创办；2021 多数股权投资",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "投资人公告；不使用估值推算本人到手财富。"
        },
        "FK-CHRON": {
          "source_id": "FK-CHRON",
          "title": "Chronik",
          "publisher": "S. Fischer Verlag / FranzKafka.de",
          "url": "https://www.franzkafka.de/leben/chronik",
          "type": "biography",
          "locator": "1908、1912、1922、1923、1924 年条目",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "出版社年表；不据年表推断疾病与迁居的因果关系。"
        },
        "CN-AUTO": {
          "source_id": "CN-AUTO",
          "title": "Christiane Nüsslein-Volhard — Biographical",
          "publisher": "Nobel Prize / Christiane Nüsslein-Volhard",
          "url": "https://www.nobelprize.org/prizes/medicine/1995/nusslein-volhard/biographical/",
          "type": "self_writing",
          "locator": "1962 医院试做；summer 1964 Tübingen；Diplom 1969；PhD 1973",
          "accessed_on": "2026-10-02",
          "access_method": "search_index",
          "limitations": "原页直接访问受限；已核对索引正文。课程不合预期属于本人评价。"
        },
        "AE-UZH": {
          "source_id": "AE-UZH",
          "title": "Albert Einstein",
          "publisher": "University of Zurich",
          "url": "https://www.uzh.ch/en/researchinnovation/excellence/nobelprize/einstein",
          "type": "biography",
          "locator": "1900 无大学助教职位；1902—1909 专利局；1905 博士；1909 教职",
          "accessed_on": "2026-10-02",
          "access_method": "page",
          "limitations": "机构或传记叙述，不能单独证明因果；未保存网页全文。"
        },
        "MODEL-V1": {
          "source_id": "MODEL-V1",
          "title": "本集的处境与类比建模规则",
          "publisher": "fu6868 / Codex",
          "type": "ai_inference",
          "local_path": "README.md",
          "locator": "事实、本人表述与建模",
          "accessed_on": "2026-10-02",
          "access_method": "local",
          "limitations": "仅是检索标注，不代表人物完整真实选项、心理、选择因果或用户成功概率。"
        }
      },
      "meta": {
        "candidates_recalled": 36,
        "after_metadata_filter": 29,
        "after_rerank": 3,
        "dropped_by_metadata": 7,
        "forced_diversity": false,
        "elapsed_ms": 242,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 3653,
        "parser_tokens": 510
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

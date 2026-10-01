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
      "dilemma": "坚持原专业 vs 转换新方向",
      "goals": [
        "追求个人兴趣",
        "实现个人成长",
        "减少不适合感"
      ],
      "options": [
        "继续读完原专业",
        "申请转专业",
        "辅修或双学位",
        "跨专业考研"
      ],
      "reversibility": "medium",
      "risk": "high",
      "stage": "大二/大三阶段",
      "unknowns": [
        "新方向真实能力匹配度",
        "转专业或跨考成功率",
        "新方向行业前景"
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
        "dilemma": "坚持原专业 vs 转换新方向",
        "goals": [
          "追求个人兴趣",
          "实现个人成长",
          "减少不适合感"
        ],
        "options": [
          "继续读完原专业",
          "申请转专业",
          "辅修或双学位",
          "跨专业考研"
        ],
        "reversibility": "medium",
        "risk": "high",
        "stage": "大二/大三阶段",
        "unknowns": [
          "新方向真实能力匹配度",
          "转专业或跨考成功率",
          "新方向行业前景"
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
            "dilemma_match": 0.541336876365444,
            "constraint_match": 0.5714285714285715,
            "goal_match": 0.6666666666666666,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【目标】在意的目标有具体交集：「追求个人兴趣」（对方的目标：补齐新领域训练、寻找研究兴趣）",
            "【约束】现实约束有具体重叠：「家庭期望别太高」（对方的约束：缺少生物学基础、已有家庭责任）"
          ],
          "why_different": [
            "【路径差异】你的可选路径里有「辅修或双学位」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.6208029287466176,
            "dilemma_match": 0.850749767757899,
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
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1962 年（约 64 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
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
            "path_match": 0.16458772585959663,
            "dilemma_match": 0.7151776480932821,
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
            "【未知】无法比较「新方向真实能力匹配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
        "after_metadata_filter": 31,
        "after_rerank": 3,
        "dropped_by_metadata": 5,
        "forced_diversity": false,
        "elapsed_ms": 298,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2336,
        "parser_tokens": 520
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
        "成绩中等，考研把握一般",
        "家庭经济支持但不愿啃老"
      ],
      "dilemma": "直接就业 vs 考研深造",
      "goals": [
        "职业长远发展",
        "经济独立",
        "从事喜欢方向"
      ],
      "options": [
        "全力备战考研",
        "接受实习争取转正",
        "边实习边考研"
      ],
      "reversibility": "low",
      "risk": "high",
      "stage": "大三关键期",
      "unknowns": [
        "研究生毕业时的就业行情",
        "行业经验与学历的长期回报对比",
        "考研失败后的退路",
        "实习转正的最终成功率"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "大三关键节点",
          "成绩中等，考研把握一般",
          "家庭经济支持但不愿啃老"
        ],
        "dilemma": "直接就业 vs 考研深造",
        "goals": [
          "职业长远发展",
          "经济独立",
          "从事喜欢方向"
        ],
        "options": [
          "全力备战考研",
          "接受实习争取转正",
          "边实习边考研"
        ],
        "reversibility": "low",
        "risk": "high",
        "stage": "大三关键期",
        "unknowns": [
          "研究生毕业时的就业行情",
          "行业经验与学历的长期回报对比",
          "考研失败后的退路",
          "实习转正的最终成功率"
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
            "path_match": 0.042175377166058285,
            "dilemma_match": 0.44714831438124375,
            "constraint_match": 0.6,
            "goal_match": 1,
            "reversibility_match": 0.75,
            "difference_penalty": 0.7000000000000001
          },
          "why_similar": [
            "【目标】在意的目标有具体交集：「从事喜欢方向」（对方的目标：补齐新领域训练、寻找研究兴趣）",
            "【约束】现实约束有具体重叠：「家庭经济支持但不愿啃老」（对方的约束：缺少生物学基础、已有家庭责任）"
          ],
          "why_different": [
            "【约束差异】你面对「门槛与资格」类约束（成绩中等，考研把握一般）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1976 年（约 50 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「行业经验与学历的长期回报对比」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「门槛与资格」类约束（成绩中等，考研把握一般）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是进入加州大学圣迭戈分校学习生物学课程并参与实验室训练。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「行业经验与学历的长期回报对比」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.06777657408773036,
            "dilemma_match": 0.5256666564050999,
            "constraint_match": 0.4444444444444445,
            "goal_match": 0.5,
            "reversibility_match": 0.75,
            "difference_penalty": 0.8
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：毕业后起步）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（家庭经济支持但不愿啃老）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「行业经验与学历的长期回报对比」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（家庭经济支持但不愿啃老）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「行业经验与学历的长期回报对比」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "episode_id": "jobs_1972_reed_dropout",
            "person": {
              "name": "史蒂夫·乔布斯",
              "tags": [
                "转专业",
                "大学初期"
              ]
            },
            "time": {
              "year": 1972,
              "stage": "大学初期"
            },
            "prior_path": [
              "1972 年秋进入里德学院。"
            ],
            "decision_state": {
              "dilemma": "按学位课程读完 vs 退出正式学籍",
              "options": [
                "按学位课程读完",
                "退出正式学籍"
              ],
              "constraints": [
                "教育费用压力",
                "对必修课程存疑"
              ],
              "goals": [
                "探索兴趣",
                "减少正式学费投入"
              ],
              "risk": "high",
              "reversibility": "low"
            },
            "choice": {
              "type": "abandon",
              "actions": [
                "读一个学期后退学，仍留校旁听感兴趣的课程。"
              ]
            },
            "outcomes": {
              "short_term": "不再沿原学位路径学习；自述借住朋友宿舍并节省食宿费用。",
              "mid_term": "继续旁听，包括书法课程；没有取得里德学位。",
              "long_term": "2005 年演讲中回顾书法学习与后来计算机字体设计的联系。"
            },
            "reflection": {
              "unknowns": [
                "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
                "个别人的旁听与技术产业机会不能证明退学有利；现代学籍、资助和签证后果各异。",
                "源头分别使用“一学期”与“六个月”；1972 为入学及退学阶段锚点，不断言退学精确月份。"
              ],
              "self_comment": "他在 2005 年演讲中说当时不清楚大学如何帮助自己，后来才赋予旁听经历意义。"
            },
            "evidence": [
              {
                "source_id": "SJ-REED",
                "type": "biography",
                "claim": "1972 年秋入学，一学期后退学并旁听。",
                "url": "https://www.reed.edu/about/steve-jobs.html"
              },
              {
                "source_id": "SJ-SPEECH",
                "type": "self_writing",
                "claim": "退学后的生活、自述动机及事后解释。",
                "url": "https://news.stanford.edu/stories/2005/06/youve-got-find-love-jobs-says"
              },
              {
                "source_id": "MODEL-V1",
                "type": "ai_inference",
                "claim": "decision_state 全部字段、time.stage、choice.type、人物/检索标签及 Demo 方向是 AI 建模；未发生选项不代表本人实际考虑过。个别人的旁听与技术产业机会不能证明退学有利；现代学籍、资助和签证后果各异。"
              }
            ],
            "retrieval_tags": [
              "转专业",
              "abandon"
            ],
            "next_episode_ids": [
              "jobs_1985_restart"
            ]
          },
          "dimensions": {
            "stage_match": 0.9,
            "path_match": 0.07007262395349856,
            "dilemma_match": 0.4574292122553888,
            "constraint_match": 0.22222222222222224,
            "goal_match": 0.6666666666666666,
            "reversibility_match": 1,
            "difference_penalty": 0.8999999999999999
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：大学初期）",
            "【目标】在意的目标有具体交集：「从事喜欢方向」（对方的目标：探索兴趣、减少正式学费投入）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家庭经济支持但不愿啃老）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是读一个学期后退学，仍留校旁听感兴趣的课程。，没有试探类动作的记录——这是「先验证再决定」与「退出」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1972 年（约 54 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「研究生毕业时的就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家庭经济支持但不愿啃老）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「接受实习争取转正」这类低成本试探；案例里对方的实际动作是读一个学期后退学，仍留校旁听感兴趣的课程。，没有试探类动作的记录——这是「先验证再决定」与「退出」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【⚠️ AI 类比·时代制度】案例发生在 1972 年（约 54 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
              "kind": "era",
              "basis": "ai_inference（模型外部知识）",
              "refs": [
                "time.year"
              ]
            },
            {
              "text": "【未知】无法比较「研究生毕业时的就业行情」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
              "kind": "unknown",
              "basis": "数据缺失（episode 无对应字段）"
            }
          ],
          "evidence_layers": {
            "facts": [
              "1972 年秋入学，一学期后退学并旁听。（SJ-REED）"
            ],
            "self_claims": [
              "退学后的生活、自述动机及事后解释。（SJ-SPEECH）",
              "他在 2005 年演讲中说当时不清楚大学如何帮助自己，后来才赋予旁听经历意义。（reflection.self_comment，本人自述）"
            ],
            "interpretations": [
              "不再沿原学位路径学习；自述借住朋友宿舍并节省食宿费用。（outcomes.short_term）",
              "继续旁听，包括书法课程；没有取得里德学位。（outcomes.mid_term）",
              "2005 年演讲中回顾书法学习与后来计算机字体设计的联系。（outcomes.long_term）"
            ],
            "ai_inferences": [
              "【⚠️ AI 类比·时代制度】案例发生在 1972 年（约 54 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）"
            ],
            "unknowns": [
              "处境选项、目标与风险/可逆性等级是建模，不是当时的完整心理记录。",
              "个别人的旁听与技术产业机会不能证明退学有利；现代学籍、资助和签证后果各异。",
              "源头分别使用“一学期”与“六个月”；1972 为入学及退学阶段锚点，不断言退学精确月份。"
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
        "elapsed_ms": 172,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 2685,
        "parser_tokens": 540
      }
    }
  },
  {
    "id": 3,
    "name": "大厂还是小公司/创业（稳定 vs 成长空间）",
    "raw_input": "毕业两年了，在一家小公司做产品，学得快但看不到晋升路径。拿到了一个大厂的 offer，薪资涨三成，但岗位方向比较窄。我很纠结要不要去，怕自己变成螺丝钉，又怕留下来错过平台机会。补充：目前存款不多；无家庭负担；最在意成长空间和长期竞争力。",
    "situation": {
      "constraints": [
        "毕业两年，需积累平台背书",
        "存款不多，抗风险能力弱",
        "无家庭负担",
        "小公司无晋升路径"
      ],
      "dilemma": "留小厂博全能 vs 去大厂做专才",
      "goals": [
        "成长空间",
        "长期竞争力",
        "薪资提升"
      ],
      "options": [
        "跳槽去大厂",
        "留守小公司",
        "继续看其他机会"
      ],
      "reversibility": "medium",
      "risk": "medium",
      "stage": "职业探索期",
      "unknowns": [
        "大厂转岗或拓宽业务的难度",
        "小公司未来业务发展前景"
      ]
    },
    "retrieval": {
      "situation": {
        "constraints": [
          "毕业两年，需积累平台背书",
          "存款不多，抗风险能力弱",
          "无家庭负担",
          "小公司无晋升路径"
        ],
        "dilemma": "留小厂博全能 vs 去大厂做专才",
        "goals": [
          "成长空间",
          "长期竞争力",
          "薪资提升"
        ],
        "options": [
          "跳槽去大厂",
          "留守小公司",
          "继续看其他机会"
        ],
        "reversibility": "medium",
        "risk": "medium",
        "stage": "职业探索期",
        "unknowns": [
          "大厂转岗或拓宽业务的难度",
          "小公司未来业务发展前景"
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
            "path_match": 0.06974638597258476,
            "dilemma_match": 0.38005811179700244,
            "constraint_match": 0.5454545454545454,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【约束】现实约束有具体重叠：「毕业两年，需积累平台背书」「存款不多，抗风险能力弱」（对方的约束：需补读多年文献、既有工作仍在继续）",
            "【阶段】人生阶段接近（对方当时：重返研究）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多，抗风险能力弱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（存款不多，抗风险能力弱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "stage_match": 0.5,
            "path_match": 0.13197103824534726,
            "dilemma_match": 0.5306316995658023,
            "constraint_match": 0.2222222222222222,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.44999999999999996
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「稳定 vs 冒险」型（对方当时的困境：留在 Cisco vs 另建通信产品）",
            "【阶段】人生阶段接近（对方当时：大公司转创业）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多，抗风险能力弱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「经济」类约束（存款不多，抗风险能力弱）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.18955471108958577,
            "dilemma_match": 0.4590188388513506,
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
            "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，需积累平台背书）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「时间与沉没投入」类约束（毕业两年，需积累平台背书）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【未知】无法比较「大厂转岗或拓宽业务的难度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "elapsed_ms": 417,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 3320,
        "parser_tokens": 530
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

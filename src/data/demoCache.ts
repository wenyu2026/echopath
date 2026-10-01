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
      "stage": "大二结束",
      "dilemma": "留在本专业 vs 转向新方向",
      "options": [
        "继续本专业",
        "转入新方向",
        "辅修新方向"
      ],
      "constraints": [
        "已投入两年",
        "新方向只了解两个月",
        "可接受延毕",
        "家庭期望别太高"
      ],
      "goals": [
        "追求兴趣",
        "个人成长"
      ],
      "risk": "medium",
      "reversibility": "medium",
      "unknowns": [
        "新方向长期适配度",
        "转方向的具体门槛",
        "家庭实际可接受度"
      ]
    },
    "retrieval": {
      "situation": {
        "stage": "大二结束",
        "dilemma": "留在本专业 vs 转向新方向",
        "options": [
          "继续本专业",
          "转入新方向",
          "辅修新方向"
        ],
        "constraints": [
          "已投入两年",
          "新方向只了解两个月",
          "可接受延毕",
          "家庭期望别太高"
        ],
        "goals": [
          "追求兴趣",
          "个人成长"
        ],
        "risk": "medium",
        "reversibility": "medium",
        "unknowns": [
          "新方向长期适配度",
          "转方向的具体门槛",
          "家庭实际可接受度"
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
            "path_match": 0.1644834547995976,
            "dilemma_match": 0.7299311825942775,
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
            "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.6207451162602161,
            "dilemma_match": 0.8578389697966593,
            "constraint_match": 0.2598901098901099,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.8999999999999999
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「坚持 vs 转向」型（对方当时的困境：继续生物方向 vs 转入医学方向）",
            "【来时路】此前的投入路径相似：对方曾 中学毕业时倾向生物学，也短暂考虑医学。"
          ],
          "why_different": [
            "【约束差异】你面对「时间与沉没投入」类约束（已投入两年、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1962 年（约 64 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「时间与沉没投入」类约束（已投入两年、可接受延毕）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
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
              "text": "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.1263364000687095,
            "dilemma_match": 0.5404684609091998,
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
            "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【未知】无法比较「新方向长期适配度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "elapsed_ms": 321,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 1663,
        "parser_tokens": 469
      }
    }
  },
  {
    "id": 2,
    "name": "考研还是就业（延迟收益 vs 即时确定）",
    "raw_input": "大三了，家里人都劝我考研，说学历高点以后好走。但我手上有两个实习机会，转正概率不小。我担心考研三年出来还不如现在积累的工作经验，又怕不考研以后天花板太低。补充：成绩中等，考研把握一般；实习是喜欢的方向；家里能支持我读研，但我有点不好意思继续花家里的钱。",
    "situation": {
      "stage": "大三",
      "dilemma": "考研 vs 工作实习",
      "options": [
        "全力考研",
        "选实习转正",
        "边实习边备考"
      ],
      "constraints": [
        "家人劝考研",
        "成绩中等",
        "考研把握一般",
        "两实习机会"
      ],
      "goals": [
        "提升学历",
        "积累经验",
        "减少内耗"
      ],
      "risk": "medium",
      "reversibility": "medium",
      "unknowns": [
        "考研成功率",
        "实习转正概率",
        "行业学历门槛",
        "长期职业天花板"
      ]
    },
    "retrieval": {
      "situation": {
        "stage": "大三",
        "dilemma": "考研 vs 工作实习",
        "options": [
          "全力考研",
          "选实习转正",
          "边实习边备考"
        ],
        "constraints": [
          "家人劝考研",
          "成绩中等",
          "考研把握一般",
          "两实习机会"
        ],
        "goals": [
          "提升学历",
          "积累经验",
          "减少内耗"
        ],
        "risk": "medium",
        "reversibility": "medium",
        "unknowns": [
          "考研成功率",
          "实习转正概率",
          "行业学历门槛",
          "长期职业天花板"
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
            "path_match": 0.06791579559432373,
            "dilemma_match": 0.5050414605080266,
            "constraint_match": 0.4444444444444445,
            "goal_match": 0.15,
            "reversibility_match": 1,
            "difference_penalty": 0.65
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：毕业后起步）",
            "【可逆性】双方对这次选择的可逆性判断一致（都是「中」）—— 都还留着退路"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家人劝考研）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「选实习转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1984 年（约 42 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「实习转正概率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家人劝考研）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「选实习转正」这类低成本试探；案例里对方的实际动作是继续写剧本并寻找电影制作机会。，没有试探类动作的记录——这是「先验证再决定」与「死磕原路」的结构差异（依据：options 与 choice.actions 对比）",
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
              "text": "【未知】无法比较「实习转正概率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.17359226681973483,
            "dilemma_match": 0.5291923194061919,
            "constraint_match": 0.4444444444444445,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.55
          },
          "why_similar": [
            "【约束】现实约束有具体重叠：「成绩中等」（对方的约束：已有一个博士学位、仍需新领域经验）",
            "【困境结构】两边的取舍都落在「放弃一边、换另一边」这一结构上（对方当时的困境：再读完整博士 vs 转入博士后研究）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（家人劝考研）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的学业转向不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「实习转正概率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「家庭」类约束（家人劝考研）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
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
              "text": "【未知】无法比较「实习转正概率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.05839786771393722,
            "dilemma_match": 0.44602474296292516,
            "constraint_match": 0.2571428571428571,
            "goal_match": 0.25,
            "reversibility_match": 1,
            "difference_penalty": 0.35
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：学术转产业）",
            "【困境结构】两边的取舍都落在「放弃一边、换另一边」这一结构上（对方当时的困境：继续原学术岗位 vs 加入生物技术公司）"
          ],
          "why_different": [
            "【约束差异】你面对「门槛与资格」类约束（成绩中等）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【路径差异】你的可选路径里有「选实习转正」这类低成本试探；案例里对方的实际动作是2013 年加入 BioNTech。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
            "【未知】无法比较「考研成功率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「门槛与资格」类约束（成绩中等）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【路径差异】你的可选路径里有「选实习转正」这类低成本试探；案例里对方的实际动作是2013 年加入 BioNTech。，没有试探类动作的记录——这是「先验证再决定」与「直接转向」的结构差异（依据：options 与 choice.actions 对比）",
              "kind": "structure",
              "basis": "options × choice.actions 对比",
              "refs": [
                "options",
                "choice.actions"
              ]
            },
            {
              "text": "【未知】无法比较「考研成功率」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "elapsed_ms": 474,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 1441,
        "parser_tokens": 488
      }
    }
  },
  {
    "id": 3,
    "name": "大厂还是小公司/创业（稳定 vs 成长空间）",
    "raw_input": "毕业两年了，在一家小公司做产品，学得快但看不到晋升路径。拿到了一个大厂的 offer，薪资涨三成，但岗位方向比较窄。我很纠结要不要去，怕自己变成螺丝钉，又怕留下来错过平台机会。补充：目前存款不多；无家庭负担；最在意成长空间和长期竞争力。",
    "situation": {
      "stage": "毕业两年",
      "dilemma": "去大厂 vs 留小公司",
      "options": [
        "接受大厂offer",
        "留在小公司",
        "继续找其他机会"
      ],
      "constraints": [
        "存款不多",
        "无家庭负担",
        "小公司无晋升路径"
      ],
      "goals": [
        "成长空间",
        "长期竞争力",
        "提升薪资"
      ],
      "risk": "medium",
      "reversibility": "high",
      "unknowns": [
        "大厂岗位方向窄的具体程度",
        "大厂内部转岗可能性",
        "小公司未来成长上限",
        "大厂工作强度与文化",
        "小公司加薪或晋升承诺"
      ]
    },
    "retrieval": {
      "situation": {
        "stage": "毕业两年",
        "dilemma": "去大厂 vs 留小公司",
        "options": [
          "接受大厂offer",
          "留在小公司",
          "继续找其他机会"
        ],
        "constraints": [
          "存款不多",
          "无家庭负担",
          "小公司无晋升路径"
        ],
        "goals": [
          "成长空间",
          "长期竞争力",
          "提升薪资"
        ],
        "risk": "medium",
        "reversibility": "high",
        "unknowns": [
          "大厂岗位方向窄的具体程度",
          "大厂内部转岗可能性",
          "小公司未来成长上限",
          "大厂工作强度与文化",
          "小公司加薪或晋升承诺"
        ]
      },
      "matches": [
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
            "path_match": 0.021822438578076263,
            "dilemma_match": 0.504239297097311,
            "constraint_match": 0.25,
            "goal_match": 0.25,
            "reversibility_match": 0.75,
            "difference_penalty": 0.39999999999999997
          },
          "why_similar": [
            "【困境结构】双方核心冲突同属「稳定 vs 冒险」型（对方当时的困境：留在原机构 vs 迁往英国 LMB）",
            "【阶段】人生阶段接近（对方当时：科研机构转换）"
          ],
          "why_different": [
            "【约束差异】你面对「ceiling」类约束（小公司无晋升路径）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
            "【未知】无法比较「小公司未来成长上限」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
          ],
          "why_different_detail": [
            {
              "text": "【约束差异】你面对「ceiling」类约束（小公司无晋升路径）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
              "kind": "structure",
              "basis": "constraints 对比",
              "refs": [
                "decision_state.constraints"
              ]
            },
            {
              "text": "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
              "kind": "structure",
              "basis": "reversibility 字段对比",
              "refs": [
                "decision_state.reversibility"
              ]
            },
            {
              "text": "【未知】无法比较「小公司未来成长上限」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0.1894676407270459,
            "dilemma_match": 0.48513657278752126,
            "constraint_match": 0.15,
            "goal_match": 0.15,
            "reversibility_match": 0.75,
            "difference_penalty": 0.49999999999999994
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：失败后转产品）",
            "【困境结构】双方核心冲突同属「稳定 vs 冒险」型（对方当时的困境：退回剩余资金 vs 转做协作工具）"
          ],
          "why_different": [
            "【约束差异】你面对「家庭」类约束（无家庭负担）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
            "【未知】无法比较「大厂岗位方向窄的具体程度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
              "kind": "structure",
              "basis": "reversibility 字段对比",
              "refs": [
                "decision_state.reversibility"
              ]
            },
            {
              "text": "【未知】无法比较「大厂岗位方向窄的具体程度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
            "path_match": 0,
            "dilemma_match": 0.4502197652865136,
            "constraint_match": 0.4,
            "goal_match": 0.15,
            "reversibility_match": 0.75,
            "difference_penalty": 0.8
          },
          "why_similar": [
            "【阶段】人生阶段接近（对方当时：经营与创作）",
            "【约束】现实约束有重叠（对方的约束：店务占用时间、文学能力尚待验证）"
          ],
          "why_different": [
            "【约束差异】你面对「经济」类约束（存款不多）；案例记录中没有这部分内容，无法确认对方当时是否面对同样约束——这个案例帮不了你评估这方面的代价（依据：constraints 对比）",
            "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
            "【⚠️ AI 类比·时代制度】案例发生在 1978 年（约 48 年前）：当时的职业转换不存在今天这样的门槛体系与市场信号（成绩门槛、延毕成本、就业行情等）。此条为模型外部知识推断，案例数据没有直接证据，不可作为事实引用（依据：ai_inference）",
            "【未知】无法比较「大厂岗位方向窄的具体程度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）"
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
              "text": "【可逆性差异】你的选择可逆性为「高」，对方当时评估为「中」——对方保留了更多退路，其结果未必能平移到你身上（依据：reversibility 字段对比）",
              "kind": "structure",
              "basis": "reversibility 字段对比",
              "refs": [
                "decision_state.reversibility"
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
              "text": "【未知】无法比较「大厂岗位方向窄的具体程度」：案例资料里查不到对方在这方面的记录，任何结论都只能是推测——「查不到」不等于「事实上没有」，我们选择承认不知道；你可以在 What-if 里补充这个信息再看匹配变化（依据：数据缺失）",
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
        "elapsed_ms": 456,
        "weights": {
          "stage_match": 0.15,
          "path_match": 0.2,
          "dilemma_match": 0.25,
          "constraint_match": 0.2,
          "goal_match": 0.15,
          "reversibility_match": 0.05
        },
        "parser_elapsed_ms": 1739,
        "parser_tokens": 503
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

/**
 * 演示占位案例（离线兜底数据）
 * ============================================================
 * ⚠️ 本文件只服务 #16 前端开发与演示兜底，**不是正式数据集**。
 *
 * - 前 3 条：来自 data/episodes.json 的种子样例（鲁迅 / 李安 / 村上春树）
 * - 后 3 条：**合成的演示案例**，人物名标注「合成示例」，
 *   evidence.type 一律为 ai_inference，用于演示「证据分层」
 *   如何把 AI 推断和史实分开显示。
 *
 * 正式数据由 #13（fu6868）维护在 data/episodes.json，
 * 正式检索由 #14/#15（Damn4lee）提供。两者就绪后，
 * 只要 retrieve() 返回合法的 RetrievalResponse，本文件即可整体删除。
 */
import type { DecisionEpisode } from '../../types/episode.ts'

export const mockEpisodes: DecisionEpisode[] = [
  {
    "episode_id": "lu_xun_1906_medicine_to_literature",
    "person": {
      "name": "鲁迅（周树人）",
      "birth_year": 1881,
      "tags": [
        "文学",
        "转向",
        "青年",
        "留学"
      ]
    },
    "time": {
      "year": 1906,
      "age": 25,
      "stage": "留日期间"
    },
    "prior_path": [
      "1902 年公费赴日本留学",
      "1904 年入仙台医学专门学校学医",
      "受日俄战争幻灯片事件刺激"
    ],
    "decision_state": {
      "dilemma": "继续学医 vs 弃医从文",
      "options": [
        "继续学医",
        "立即弃医从文",
        "先完成学业再转"
      ],
      "constraints": [
        "公费留学身份",
        "家庭期望",
        "时代环境"
      ],
      "goals": [
        "改变国民精神",
        "找到真正价值"
      ],
      "risk": "high",
      "reversibility": "low"
    },
    "choice": {
      "type": "direct_switch",
      "actions": [
        "从仙台医专退学",
        "回东京从事文艺翻译与写作"
      ]
    },
    "outcomes": {
      "short_term": "失去医学学位路径，经济拮据，与家人关系紧张",
      "mid_term": "进入新文化阵营，逐步确立文学地位",
      "long_term": "成为中国现代文学奠基者之一"
    },
    "reflection": {
      "self_comment": "在《呐喊》自序中自述：医学并非一件紧要事，改变精神才是第一要著",
      "unknowns": [
        "当时具体心理活动的直接记录",
        "退学决定的确切日期"
      ]
    },
    "evidence": [
      {
        "source_id": "LX-S1",
        "type": "self_writing",
        "claim": "《呐喊》自序记述了幻灯片事件与弃医从文的动机"
      },
      {
        "source_id": "LX-S2",
        "type": "self_writing",
        "claim": "《藤野先生》记述了在仙台医专的经历与离开"
      },
      {
        "source_id": "LX-S3",
        "type": "biography",
        "claim": "1906 年从仙台医学专门学校退学"
      }
    ],
    "retrieval_tags": [
      "沉没成本",
      "换方向",
      "高不确定性",
      "理想驱动",
      "低可逆性"
    ]
  },
  {
    "episode_id": "ang_lee_1984_six_years_persist",
    "person": {
      "name": "李安",
      "birth_year": 1954,
      "tags": [
        "电影",
        "坚持",
        "中年",
        "创作"
      ]
    },
    "time": {
      "year": 1984,
      "age": 30,
      "stage": "职业起步期"
    },
    "prior_path": [
      "1978 年赴美就读伊利诺伊大学",
      "1984 年获纽约大学电影制作硕士",
      "毕业作品获关注但无商业机会"
    ],
    "decision_state": {
      "dilemma": "坚持电影梦 vs 转行谋生",
      "options": [
        "继续坚持写剧本",
        "转行做稳定工作",
        "回国发展"
      ],
      "constraints": [
        "经济依赖配偶收入",
        "行业门槛高",
        "年龄增长"
      ],
      "goals": [
        "拍出属于自己的电影",
        "不放弃创作"
      ],
      "risk": "high",
      "reversibility": "medium"
    },
    "choice": {
      "type": "persist",
      "actions": [
        "持续写剧本",
        "在家承担家务与育儿",
        "等待机会"
      ]
    },
    "outcomes": {
      "short_term": "六年无正式工作，家庭经济由配偶承担，承受外界质疑",
      "mid_term": "1990 年剧本获奖，获得执导机会",
      "long_term": "成为国际知名导演，多次获奥斯卡奖"
    },
    "reflection": {
      "self_comment": "在多次访谈中提到配偶的支持是关键，也提到那段时期的自我怀疑",
      "unknowns": [
        "六年间的具体经济数字",
        "是否曾认真考虑过放弃"
      ]
    },
    "evidence": [
      {
        "source_id": "AL-S1",
        "type": "interview",
        "claim": "李安在访谈中多次谈及毕业后的六年蛰伏期与配偶支持"
      },
      {
        "source_id": "AL-S2",
        "type": "biography",
        "claim": "1984 年纽约大学电影制作硕士毕业，1990 年剧本获奖"
      }
    ],
    "retrieval_tags": [
      "坚持",
      "沉没成本",
      "经济约束",
      "家庭支持",
      "高不确定性"
    ]
  },
  {
    "episode_id": "murakami_1978_bar_and_writing",
    "person": {
      "name": "村上春树",
      "birth_year": 1949,
      "tags": [
        "文学",
        "双轨",
        "青年",
        "创业"
      ]
    },
    "time": {
      "year": 1978,
      "age": 29,
      "stage": "职业早期"
    },
    "prior_path": [
      "1974 年开设爵士酒吧 Peter Cat",
      "长期经营酒吧，负债经营",
      "几乎无写作经验"
    ],
    "decision_state": {
      "dilemma": "继续经营酒吧 vs 转向写作",
      "options": [
        "维持现状",
        "立即关店写作",
        "边经营边写作"
      ],
      "constraints": [
        "酒吧有债务",
        "无文学圈资源",
        "收入依赖店铺"
      ],
      "goals": [
        "尝试写作",
        "保留经济安全垫"
      ],
      "risk": "medium",
      "reversibility": "high"
    },
    "choice": {
      "type": "dual_track",
      "actions": [
        "继续经营酒吧",
        "利用深夜时间写作",
        "三年后再决定是否全职"
      ]
    },
    "outcomes": {
      "short_term": "极度疲惫，睡眠不足，但经济未断",
      "mid_term": "1979 年处女作获新人奖，1981 年卖掉酒吧专职写作",
      "long_term": "成为国际知名作家"
    },
    "reflection": {
      "self_comment": "在《我的职业是小说家》中回顾：先保留退路，等验证可行再全力投入",
      "unknowns": [
        "1978 年决定写作时的具体触发细节"
      ]
    },
    "evidence": [
      {
        "source_id": "MH-S1",
        "type": "self_writing",
        "claim": "《我的职业是小说家》记述了经营酒吧期间开始写作的经历"
      },
      {
        "source_id": "MH-S2",
        "type": "interview",
        "claim": "访谈中提到 1978 年看棒球赛时产生写小说的念头"
      }
    ],
    "retrieval_tags": [
      "双轨并行",
      "低风险试探",
      "高可逆性",
      "经济约束",
      "副业转主业"
    ]
  },
  {
    "episode_id": "syn_explore_then_switch_2021",
    "person": {
      "name": "合成示例 A（先试探再转向）",
      "tags": [
        "工科",
        "试探",
        "转向",
        "青年"
      ]
    },
    "time": {
      "year": 2021,
      "age": 21,
      "stage": "大三"
    },
    "prior_path": [
      "高考按分数被调剂进材料专业",
      "大一大二成绩中上，但持续提不起兴趣",
      "大二暑假自学了两个月编程，做出一个小工具"
    ],
    "decision_state": {
      "dilemma": "留在材料专业 vs 转向计算机",
      "options": [
        "读完材料",
        "立刻申请转专业",
        "先修两门课再决定"
      ],
      "constraints": [
        "已投入两年",
        "转专业有成绩门槛",
        "可能延毕",
        "家庭希望稳定"
      ],
      "goals": [
        "做有兴趣的事",
        "不想延毕",
        "保留就业退路"
      ],
      "risk": "medium",
      "reversibility": "high"
    },
    "choice": {
      "type": "explore_then_switch",
      "actions": [
        "先选修两门计算机核心课并参加一次项目",
        "确认能跟上后再申请跨专业考研",
        "没有直接退掉原专业"
      ]
    },
    "outcomes": {
      "short_term": "一学期同时应付两边课程，非常累，成绩略有下滑",
      "mid_term": "确认自己确实喜欢也跟得上，顺利跨专业读研",
      "long_term": "进入新方向，但仍需补基础，起点晚于科班同学"
    },
    "reflection": {
      "self_comment": "（合成示例，非真实人物自述）",
      "unknowns": [
        "如果直接转向会不会更快",
        "延毕一年的机会成本到底多大"
      ]
    },
    "evidence": [
      {
        "source_id": "SYN-A1",
        "type": "ai_inference",
        "claim": "本条为合成的演示案例，用于展示「先试探再转向」路径，非真实史料"
      }
    ],
    "retrieval_tags": [
      "换方向",
      "低风险试探",
      "高可逆性",
      "沉没成本",
      "副业转主业"
    ]
  },
  {
    "episode_id": "syn_switch_misfit_2019",
    "person": {
      "name": "合成示例 B（转向后并不适合）",
      "tags": [
        "转专业",
        "负向结果",
        "青年",
        "试错"
      ]
    },
    "time": {
      "year": 2019,
      "age": 20,
      "stage": "大二"
    },
    "prior_path": [
      "大一对本专业失望，觉得课程陈旧",
      "听说新方向就业好、收入高",
      "几乎没有真正上手试过新方向的内容"
    ],
    "decision_state": {
      "dilemma": "留在原专业 vs 立刻转到热门方向",
      "options": [
        "留在原专业",
        "立刻转专业",
        "先自学一段时间"
      ],
      "constraints": [
        "转专业窗口只有一次",
        "家庭要求按时毕业",
        "对新方向了解仅来自传言"
      ],
      "goals": [
        "获得更好的收入",
        "摆脱当下的失望感"
      ],
      "risk": "high",
      "reversibility": "low"
    },
    "choice": {
      "type": "direct_switch",
      "actions": [
        "在没有实际体验的情况下提交转专业申请",
        "成功转入新专业"
      ]
    },
    "outcomes": {
      "short_term": "短期情绪明显变好，觉得自己终于做了决定",
      "mid_term": "发现新方向的核心课程同样枯燥，且基础薄弱、压力很大",
      "long_term": "毕业时既没有原专业积累，也没有新方向优势，求职期一度非常被动"
    },
    "reflection": {
      "self_comment": "（合成示例，非真实人物自述）",
      "unknowns": [
        "如果当初先自学一段时间，结论是否会不同",
        "这是方向不适合还是方法不对"
      ]
    },
    "evidence": [
      {
        "source_id": "SYN-B1",
        "type": "ai_inference",
        "claim": "本条为合成的演示案例，用于展示「转向后并不适合」路径，非真实史料"
      }
    ],
    "retrieval_tags": [
      "换方向",
      "高不确定性",
      "低可逆性",
      "沉没成本",
      "冲动决策"
    ]
  },
  {
    "episode_id": "syn_explore_then_persist_2020",
    "person": {
      "name": "合成示例 C（试探后确认留下）",
      "tags": [
        "医学",
        "试探",
        "坚持",
        "青年"
      ]
    },
    "time": {
      "year": 2020,
      "age": 22,
      "stage": "大四"
    },
    "prior_path": [
      "医学专业第五年，实习期间感到强烈动摇",
      "看到同龄人转行互联网收入更高",
      "家庭为供其读书已投入很多"
    ],
    "decision_state": {
      "dilemma": "继续读医 vs 毕业后转行",
      "options": [
        "按计划继续从医",
        "毕业即转行",
        "实习期认真体验后再定"
      ],
      "constraints": [
        "学制长、沉没成本高",
        "家庭投入大",
        "转行无相关经验"
      ],
      "goals": [
        "不做后悔的决定",
        "让投入不白费"
      ],
      "risk": "medium",
      "reversibility": "low"
    },
    "choice": {
      "type": "explore_then_persist",
      "actions": [
        "在实习中刻意记录哪些环节让自己有动力",
        "去旁听两场转行分享会",
        "最终决定留在医学方向"
      ]
    },
    "outcomes": {
      "short_term": "焦虑缓解，但仍有「是不是错过了别的可能」的念头",
      "mid_term": "进入专科培训，逐渐找到能投入的细分方向",
      "long_term": "成为临床医生，偶尔仍会想起当年的犹豫"
    },
    "reflection": {
      "self_comment": "（合成示例，非真实人物自述）",
      "unknowns": [
        "如果当初转行会不会更满意",
        "留下的决定有多少是出于沉没成本"
      ]
    },
    "evidence": [
      {
        "source_id": "SYN-C1",
        "type": "ai_inference",
        "claim": "本条为合成的演示案例，用于展示「试探后确认留下」路径，非真实史料"
      }
    ],
    "retrieval_tags": [
      "坚持",
      "沉没成本",
      "低可逆性",
      "理想驱动",
      "延迟收益"
    ]
  }
]

/**
 * 开发用 Mock 数据
 * ============================================
 * 后端（#14）未就绪时，前端用这份数据跑通全流程。
 *
 * ⚠️ 数据形状严格遵循 src/types/episode.ts —— 后端就绪后只需替换数据源，
 *    组件代码不用改。
 *
 * 演示场景：要不要转专业
 */

import type {
  Situation,
  RetrievalResponse,
  MatchResult,
  DecisionEpisode,
} from '../types/episode';

/* ============================================================
   用户处境（P2 显示，可手动修改）
   ============================================================ */

export const mockSituation: Situation = {
  stage: '大二/大三',
  dilemma: '坚持本专业 vs 转向新方向',
  options: ['继续读完', '申请转专业', '辅修双学位', '跨专业考研'],
  constraints: ['已投入两年', '转专业有成绩门槛', '可能延毕', '家庭期望'],
  goals: ['做感兴趣的事', '减少内耗', '顺利毕业'],
  risk: 'medium',
  reversibility: 'medium',
  unknowns: ['新方向的能力匹配度', '转专业成功率', '新方向就业前景'],
};

/* ============================================================
   三个案例（对应三条路径）
   ============================================================ */

const luXun: DecisionEpisode = {
  episode_id: 'lu_xun_1906_medicine_to_literature',
  person: { name: '鲁迅', birth_year: 1881, tags: ['文学', '转向', '青年', '留学'] },
  time: { year: 1906, age: 25, stage: '留日期间' },
  prior_path: ['1902 年公费赴日本留学', '1904 年入仙台医学专门学校学医', '受日俄战争幻灯片事件刺激'],
  decision_state: {
    dilemma: '继续学医 vs 弃医从文',
    options: ['继续学医', '立即弃医从文', '先完成学业再转'],
    constraints: ['公费留学身份', '家庭期望', '时代环境'],
    goals: ['改变国民精神', '找到真正价值'],
    risk: 'high',
    reversibility: 'low',
  },
  choice: { type: 'direct_switch', actions: ['从仙台医专退学', '回东京从事文艺翻译与写作'] },
  outcomes: {
    short_term: '失去医学学位路径，经济拮据，与家人关系紧张',
    mid_term: '进入新文化阵营，逐步确立文学地位',
    long_term: '成为中国现代文学奠基者之一',
  },
  reflection: {
    self_comment: '在《呐喊》自序中自述：医学并非一件紧要事，改变精神才是第一要著',
    unknowns: ['当时具体心理活动的直接记录', '退学决定的确切日期'],
  },
  evidence: [
    { source_id: 'LX-S1', type: 'self_writing', claim: '《呐喊》自序记述了幻灯片事件与弃医从文的动机' },
    { source_id: 'LX-S2', type: 'self_writing', claim: '《藤野先生》记述了在仙台医专的经历与离开' },
    { source_id: 'LX-S3', type: 'biography', claim: '1906 年从仙台医学专门学校退学' },
  ],
  retrieval_tags: ['沉没成本', '换方向', '高不确定性', '理想驱动', '低可逆性'],
};

const angLee: DecisionEpisode = {
  episode_id: 'ang_lee_1984_six_years_persist',
  person: { name: '李安', birth_year: 1954, tags: ['电影', '坚持', '创作'] },
  time: { year: 1984, age: 30, stage: '职业起步期' },
  prior_path: ['1978 年赴美就读伊利诺伊大学', '1984 年获纽约大学电影制作硕士', '毕业作品获关注但无商业机会'],
  decision_state: {
    dilemma: '坚持电影梦 vs 转行谋生',
    options: ['继续坚持写剧本', '转行做稳定工作', '回国发展'],
    constraints: ['经济依赖配偶收入', '行业门槛高', '年龄增长'],
    goals: ['拍出属于自己的电影', '不放弃创作'],
    risk: 'high',
    reversibility: 'medium',
  },
  choice: { type: 'persist', actions: ['持续写剧本', '在家承担家务与育儿', '等待机会'] },
  outcomes: {
    short_term: '六年无正式工作，家庭经济由配偶承担，承受外界质疑',
    mid_term: '1990 年剧本获奖，获得执导机会',
    long_term: '成为国际知名导演，多次获奥斯卡奖',
  },
  reflection: {
    self_comment: '在多次访谈中提到配偶的支持是关键，也提到那段时期的自我怀疑',
    unknowns: ['六年间的具体经济数字', '是否曾认真考虑过放弃'],
  },
  evidence: [
    { source_id: 'AL-S1', type: 'interview', claim: '李安在访谈中多次谈及毕业后的六年蛰伏期与配偶支持' },
    { source_id: 'AL-S2', type: 'biography', claim: '1984 年纽约大学电影制作硕士毕业，1990 年剧本获奖' },
  ],
  retrieval_tags: ['坚持', '沉没成本', '经济约束', '家庭支持', '高不确定性'],
};

const murakami: DecisionEpisode = {
  episode_id: 'murakami_1978_bar_and_writing',
  person: { name: '村上春树', birth_year: 1949, tags: ['文学', '双轨', '青年', '创业'] },
  time: { year: 1978, age: 29, stage: '职业早期' },
  prior_path: ['1974 年开设爵士酒吧 Peter Cat', '长期经营酒吧，负债经营', '几乎无写作经验'],
  decision_state: {
    dilemma: '继续经营酒吧 vs 转向写作',
    options: ['维持现状', '立即关店写作', '边经营边写作'],
    constraints: ['酒吧有债务', '无文学圈资源', '收入依赖店铺'],
    goals: ['尝试写作', '保留经济安全垫'],
    risk: 'medium',
    reversibility: 'high',
  },
  choice: { type: 'dual_track', actions: ['继续经营酒吧', '利用深夜时间写作', '三年后再决定是否全职'] },
  outcomes: {
    short_term: '极度疲惫，睡眠不足，但经济未断',
    mid_term: '1979 年处女作获新人奖，1981 年卖掉酒吧专职写作',
    long_term: '成为国际知名作家',
  },
  reflection: {
    self_comment: '在《我的职业是小说家》中回顾：先保留退路，等验证可行再全力投入',
    unknowns: ['1978 年决定写作时的具体触发细节'],
  },
  evidence: [
    { source_id: 'MH-S1', type: 'self_writing', claim: '《我的职业是小说家》记述了经营酒吧期间开始写作的经历' },
    { source_id: 'MH-S2', type: 'interview', claim: '访谈中提到 1978 年看棒球赛时产生写小说的念头' },
  ],
  retrieval_tags: ['双轨并行', '低风险试探', '高可逆性', '经济约束', '副业转主业'],
};

/* ============================================================
   三个匹配结果（含维度分数、像/不像、证据分层）
   ============================================================ */

export const mockMatches: MatchResult[] = [
  {
    episode: luXun,
    dimensions: {
      stage_match: 0.92,
      path_match: 0.78,
      dilemma_match: 0.95,
      constraint_match: 0.41,
      goal_match: 0.86,
      reversibility_match: 0.55,
      difference_penalty: 0.82,
    },
    why_similar: [
      '同样在投入两年后对原方向产生根本性质疑',
      '同样面对"坚持还是转向"的二元抉择',
      '选择都高度不可逆（退学 / 转专业都难回头）',
    ],
    why_different: [
      '对方有公费留学保障，没有你的经济压力',
      '1904 年没有"转专业"制度，转向代价远高于今天',
      '对方的转向源于强烈使命感，你是兴趣驱动 —— 动机强度不同',
    ],
    evidence_layers: {
      facts: ['1906 年从仙台医学专门学校退学', '1902 年公费赴日，1904 年入学仙台医专'],
      self_claims: ['《呐喊》自序中的动机自述', '《藤野先生》中对留学经历的回忆'],
      interpretations: ['后人多将其解读为"民族觉醒"驱动，但本人未如此表述'],
      ai_inferences: ['「同样存在沉没成本焦虑」属于结构性类比，非史实'],
      unknowns: ['退学决定的确切日期', '当时是否考虑过"先毕业再转"'],
    },
  },
  {
    episode: angLee,
    dimensions: {
      stage_match: 0.58,
      path_match: 0.63,
      dilemma_match: 0.71,
      constraint_match: 0.34,
      goal_match: 0.68,
      reversibility_match: 0.72,
      difference_penalty: 0.66,
    },
    why_similar: [
      '都在已有投入后面对"要不要继续"的自我怀疑',
      '都需要承受外界质疑与不确定性',
    ],
    why_different: [
      '对方在 30 岁且已获得专业学位，你还在本科阶段',
      '对方有稳定配偶收入托底，你的经济来源不同',
      '领域不同：电影行业靠作品说话，学业有明确期限',
    ],
    evidence_layers: {
      facts: ['1984 年纽约大学电影制作硕士毕业', '1990 年剧本获奖并获执导机会'],
      self_claims: ['多次访谈中提及配偶支持是关键'],
      interpretations: ['"六年蛰伏"的叙事在后来的报道中被反复强化'],
      ai_inferences: ['「同样承受外界质疑」是类比推断'],
      unknowns: ['六年间的具体经济数字', '是否曾认真考虑放弃'],
    },
  },
  {
    episode: murakami,
    dimensions: {
      stage_match: 0.74,
      path_match: 0.69,
      dilemma_match: 0.88,
      constraint_match: 0.57,
      goal_match: 0.61,
      reversibility_match: 0.93,
      difference_penalty: 0.38,
    },
    why_similar: [
      '同样面对"要不要放弃现有路径"的选择',
      '都选择了低成本试探，而不是一次性押上全部',
      '经济约束都是决策的关键变量',
    ],
    why_different: [
      '对方是"自雇者"，时间可自主安排；你在学制内，时间被课程切割',
      '对方没有"学历中断"的风险，你有',
      '写作可以深夜进行，你的新方向可能需要整块时间',
    ],
    evidence_layers: {
      facts: ['1974 年开设爵士酒吧 Peter Cat', '1979 年处女作获群像新人文学奖', '1981 年卖掉酒吧'],
      self_claims: ['《我的职业是小说家》中的回顾'],
      interpretations: ['"深夜写作"被后来演绎为创作神话的一部分'],
      ai_inferences: ['「低成本试探」与你的"辅修/双学位"选项结构相似，属推断'],
      unknowns: ['1978 年决定写作时的具体触发细节'],
    },
  },
];

/* ============================================================
   完整检索响应
   ============================================================ */

export const mockRetrieval: RetrievalResponse = {
  situation: mockSituation,
  matches: mockMatches,
  meta: {
    candidates_recalled: 47,
    after_metadata_filter: 18,
    after_rerank: 6,
    elapsed_ms: 4200,
  },
};

/* ============================================================
   P1 来时路的引导问题
   ============================================================ */

/**
 * ⚠️ v2 改进：问题与示例改成**分阶段**的。
 *
 * 原来六问的 placeholder 全是校园场景
 * （「专业课 + 实验室打杂」「转专业要降级一年」）。
 * 但产品自己准备的第三个演示场景是「大厂还是小厂/创业」——
 * 一个职场处境。评委试那个场景时，会看到一堆只在大学里成立的问题，
 * 立刻露出「这套东西只做过学生」的马脚。
 *
 * 现在按第一问的回答粗分三类，给出对应措辞与例子：
 *   校园 / 职场 / 其他
 * 判定用关键词，判不出来就退回中性措辞（不假装知道）。
 */

export type JourneyStage = 'school' | 'career' | 'general';

export interface JourneyQuestion {
  id: string;
  label: string;
  placeholder: string;
}

const QUESTIONS: Record<JourneyStage, JourneyQuestion[]> = {
  school: [
    { id: 'q1', label: '你现在处在什么阶段？', placeholder: '比如：大二，专业是材料科学' },
    { id: 'q2', label: '过去两年你主要在做什么？', placeholder: '比如：专业课 + 实验室打杂，参加过两次竞赛' },
    { id: 'q3', label: '现在让你动摇的是什么？', placeholder: '比如：发现自己对专业课毫无兴趣，反而一直在自学设计' },
    { id: 'q4', label: '你对新方向了解到什么程度？', placeholder: '比如：看了两个月的教程，没做过真实项目' },
    { id: 'q5', label: '现实约束有哪些？', placeholder: '比如：家里希望我稳定就业，转专业要降级一年' },
    { id: 'q6', label: '你最不能接受的结局是什么？', placeholder: '比如：毕业后做着完全不喜欢的工作，又不敢再改' },
  ],
  career: [
    { id: 'q1', label: '你现在处在什么阶段？', placeholder: '比如：工作五年，在一家小公司做产品' },
    { id: 'q2', label: '这几年你主要积累了什么？', placeholder: '比如：三年 to B 产品经验，带过两个人，没做过从 0 到 1' },
    { id: 'q3', label: '现在让你动摇的是什么？', placeholder: '比如：学得快但看不到晋升路径，不确定留下来是不是在浪费时间' },
    { id: 'q4', label: '你对新方向了解到什么程度？', placeholder: '比如：和那边的人聊过两次，但没实际做过' },
    { id: 'q5', label: '现实约束有哪些？', placeholder: '比如：目前存款不多，无家庭负担，但断供半年就撑不住' },
    { id: 'q6', label: '你最不能接受的结局是什么？', placeholder: '比如：三年后还在原地，却已经错过了能换的窗口' },
  ],
  general: [
    { id: 'q1', label: '你现在处在什么阶段？', placeholder: '比如：三十岁出头，做着一份说不上喜欢也说不上讨厌的工作' },
    { id: 'q2', label: '过去这段时间你主要在做什么？', placeholder: '比如：一直在本职上投入，副业只是零散试过几次' },
    { id: 'q3', label: '现在让你动摇的是什么？', placeholder: '比如：隐约觉得该变，但说不清具体该转向哪里' },
    { id: 'q4', label: '你对新方向了解到什么程度？', placeholder: '比如：只是听说过，还没认真了解过' },
    { id: 'q5', label: '现实约束有哪些？', placeholder: '比如：要照顾家里，能承受的试错成本有限' },
    { id: 'q6', label: '你最不能接受的结局是什么？', placeholder: '比如：一直没变，最后连想变的念头都没有了' },
  ],
};

/** 从第一问的回答粗判属于哪类处境 */
export function detectJourneyStage(stageAnswer: string): JourneyStage {
  const t = (stageAnswer ?? '').trim();
  if (!t) return 'general';
  if (/大学|学院|专业|在校|大一|大二|大三|大四|研究生|读研|本科|读书|学生|留学|高考/.test(t)) return 'school';
  if (/工作|职场|在职|入职|公司|岗位|转行|创业|自由职业|年经验|毕业[0-9一二三四五六七八九十]|career/i.test(t)) return 'career';
  return 'general';
}

/** 按处境取问题列表。判不出类别时给中性措辞，不假装知道 */
export function getJourneyQuestions(stageAnswer: string): JourneyQuestion[] {
  return QUESTIONS[detectJourneyStage(stageAnswer)];
}

/** 兼容：默认给校园版（原来的行为），供不关心分支的调用方使用 */
export const journeyQuestions = QUESTIONS.school;

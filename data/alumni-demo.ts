/**
 * 模拟校友数据集（Demo 用）
 * ============================================
 * ⚠️ 这是**虚构数据**。人名全部匿名化处理，用于演示「换数据源」这一拍。
 *
 * 为什么需要它（实测结论 ③）：
 *   现有 36 条里按「转专业/方向重构」筛只有 9 条 / 6 人，且分布是
 *   direct_switch 7 / abandon 1 / explore_then_persist 1 ——
 *   **几乎只能拿出一种走法**，做不出「2-4 条不同路径」的效果。
 *
 * 它与 data/episodes.json **完全同构**：
 *   字段名、层级、类型全部一致 —— 这正是「同一套引擎」的证明。
 *   唯一的差别是内容来自「校友」而非「历史人物」。
 *
 * ⚠️ 与历史人物数据的三个刻意差异（都是机构场景的真实特点）：
 *
 *   ① 有失败、有后悔、有转向后回来
 *      历史名人库最大的毛病是**幸存者偏差**（只有成功者、男性、士人）。
 *      校友数据可以包含「跨考失败先就业」「读研后转回本行」这类真实轨迹。
 *      这是学校场景相对名人库的**核心优势**，必须在数据里体现。
 *
 *   ② evidence 是「学校内部记录」而非公开史料
 *      来源类型用 institution_record / self_report / academic_record，
 *      对应真实学校能拿到的东西（教务系统、毕业生问卷、访谈）。
 *
 *   ③ 有 consent 与脱敏标记
 *      机构场景下这是硬要求，不是装饰。
 *
 * ⚠️ 数量与分布刻意设计过：
 *   6 种走法每种 ≥3 人，否则聚类拿不出 2-4 条路径。
 */

export const ALUMNI_META = {
  /** 这份数据是虚构的，UI 必须显示这一条 */
  is_synthetic: true,
  disclaimer:
    '本数据集为演示用虚构数据，人名与经历均为构造，不代表任何真实个人。' +
    '它的作用是证明：同一套引擎可以装载任意来源的人群数据。',
  how_real_data_would_work:
    '真实部署时，学校导入的是教务记录 + 毕业生问卷 + 自愿访谈的脱敏数据；' +
    '隐私级别为 deidentified，机构只能看到聚合统计，看不到个体作答。',
  consent_basis: 'demo_synthetic',
  retention_policy: '演示数据，不持久化',
};

/** 走法原型的六种分布（用于自检：每种必须 ≥3） */
export const EXPECTED_ARCHETYPES = [
  'persist',
  'explore_then_persist',
  'explore_then_switch',
  'direct_switch',
  'dual_track',
  'abandon',
];

/**
 * 校友案例。
 *
 * 命名规则：`alumni_<年份>_<序号>`，与历史库的 `<人名>_<年份>_<事件>` 不同，
 * 但**字段结构完全一致**。
 */
export const ALUMNI_EPISODES = [
  /* ============ direct_switch：直接转向（4 条）============ */
  {
    episode_id: 'alumni_2018_01',
    person: { name: '2018 届 · 材料科学与工程', tags: ['转专业', '跨考'] },
    time: { year: 2018, stage: '本科三年级' },
    prior_path: ['大二从化学转入材料科学与工程。', '大三下开始自学编程。'],
    decision_state: {
      dilemma: '留本专业考研 vs 跨考计算机',
      options: ['留本专业考研', '跨考计算机', '先就业再看'],
      constraints: ['已修完材料专业核心课', '编程只有自学基础', '家庭希望尽快稳定'],
      goals: ['做自己有兴趣的方向', '有可迁移的技能'],
      risk: 'high',
      reversibility: 'low',
    },
    choice: {
      type: 'direct_switch',
      actions: ['放弃材料方向的保研资格，跨考计算机。'],
    },
    outcomes: {
      short_term: '第一次跨考落榜，毕业后进入一家小公司做测试。',
      mid_term: '工作两年后通过内部转岗成为后端开发。',
      long_term: '转型成功，但比同届晚约两年进入目标岗位。',
    },
    reflection: {
      self_comment: '回头看不后悔，但如果当年先修两门计算机核心课再决定，可能会更稳。',
      unknowns: ['当年放弃保研的真实心理过程未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-01', type: 'self_report', claim: '本人回顾跨考与转岗经历。' },
      { source_id: 'AL-RECORD-01', type: 'institution_record', claim: '教务记录显示放弃保研资格。' },
      { source_id: 'AL-MODEL-01', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['转专业', 'direct_switch', '跨考'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2019_01',
    person: { name: '2019 届 · 生物医学工程', tags: ['转行', '转专业'] },
    time: { year: 2019, stage: '本科四年级' },
    prior_path: ['大二进入生物医学工程实验室。', '做过两个学期的动物实验。'],
    decision_state: {
      dilemma: '继续读本专业研 vs 转向数据方向',
      options: ['本专业读研', '转向数据分析', '考公'],
      constraints: ['实验技能已积累三年', '不想再做动物实验', '没有系统学过统计'],
      goals: ['做不伤害动物的技术', '工作有成长空间'],
      risk: 'high',
      reversibility: 'low',
    },
    choice: {
      type: 'direct_switch',
      actions: ['放弃本专业直博机会，转申数据分析方向。'],
    },
    outcomes: {
      short_term: '申请季拿到一所普通院校的数据科学硕士。',
      mid_term: '毕业后进入互联网公司做数据分析。',
      long_term: '五年后成为数据团队负责人，但放弃了原本的科研路径。',
    },
    reflection: {
      self_comment: '转得干脆反而是对的，拖下去只会更难受。',
      unknowns: ['如果继续读博会怎样，无法判断。'],
    },
    evidence: [
      { source_id: 'AL-SELF-02', type: 'self_report', claim: '本人访谈记录。' },
      { source_id: 'AL-RECORD-02', type: 'institution_record', claim: '教务记录显示放弃直博资格。' },
      { source_id: 'AL-MODEL-02', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['转行', 'direct_switch'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2016_01',
    person: { name: '2016 届 · 汉语言文学', tags: ['转行', '转专业'] },
    time: { year: 2016, stage: '本科三年级' },
    prior_path: ['按高考分数调剂到汉语言文学。', '大二开始发现自己更喜欢做产品。'],
    decision_state: {
      dilemma: '读完中文系 vs 转向产品经理方向',
      options: ['读完本专业', '辅修管理', '直接找产品实习'],
      constraints: ['文科背景没有技术基础', '家里希望考教师编', '已经读了两年'],
      goals: ['做有实际产出的工作', '不想进体制'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'direct_switch',
      actions: ['大三下开始密集投产品实习，不再准备教师编。'],
    },
    outcomes: {
      short_term: '连投两个月后拿到一家创业公司的产品实习。',
      mid_term: '毕业直接入职该公司，一年后跳到大厂。',
      long_term: '成为产品线负责人；与家里的关系紧张了几年才缓和。',
    },
    reflection: {
      self_comment: '最难的其实不是找工作，是跟家里解释为什么不当老师。',
      unknowns: ['未记录家人态度变化的具体时间点。'],
    },
    evidence: [
      { source_id: 'AL-SELF-03', type: 'self_report', claim: '本人回顾转行与家庭沟通。' },
      { source_id: 'AL-TRACK-03', type: 'institution_record', claim: '就业系统记录其实习与就业单位。' },
      { source_id: 'AL-MODEL-03', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['转行', 'direct_switch'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2021_01',
    person: { name: '2021 届 · 机械工程', tags: ['转专业', '考研'] },
    time: { year: 2021, stage: '本科三年级' },
    prior_path: ['大二进机械实验室做结构设计。', '参加过两次机器人比赛。'],
    decision_state: {
      dilemma: '继续机械方向 vs 转向嵌入式',
      options: ['机械读研', '转嵌入式', '出国'],
      constraints: ['机械课程已修完', '嵌入式只做过比赛项目', '经济上不支持出国'],
      goals: ['做软硬结合的东西', '留在制造业'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'direct_switch',
      actions: ['调整考研方向，改报控制科学与工程。'],
    },
    outcomes: {
      short_term: '考研成功，进入一所 985 的控制方向。',
      mid_term: '研究生期间做机器人控制，与本科机械基础衔接良好。',
      long_term: '毕业后进入工业机器人公司做算法。',
    },
    reflection: {
      self_comment: '这个转向其实不算大，机械底子帮了忙。',
      unknowns: ['当年是否考虑过其他方向，未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-04', type: 'self_report', claim: '本人回顾考研方向调整。' },
      { source_id: 'AL-RECORD-04', type: 'academic_record', claim: '考研录取记录。' },
      { source_id: 'AL-MODEL-04', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['转专业', 'direct_switch'],
    next_episode_ids: [],
  },

  /* ============ dual_track：两条轨并行（4 条）============ */
  {
    episode_id: 'alumni_2017_01',
    person: { name: '2017 届 · 环境工程', tags: ['双轨', '副业'] },
    time: { year: 2017, stage: '本科四年级' },
    prior_path: ['本科做水处理方向。', '大三开始运营一个环保科普公众号。'],
    decision_state: {
      dilemma: '专心本专业就业 vs 全职做内容',
      options: ['本专业就业', '全职做自媒体', '边工作边做内容'],
      constraints: ['公众号收入不稳定', '本专业有对口岗位', '家里不理解做自媒体'],
      goals: ['有稳定收入', '内容能继续做下去'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'dual_track',
      actions: ['接受环保公司 offer，同时继续运营公众号，没有辞职。'],
    },
    outcomes: {
      short_term: '白天上班晚上写稿，持续了两年。',
      mid_term: '公众号做到十万读者，开始有稳定广告收入。',
      long_term: '第五年辞职成立小型内容工作室，客户主要来自环保行业。',
    },
    reflection: {
      self_comment: '边做边看是对的，直接辞职大概率撑不过半年。',
      unknowns: ['未记录前两年的具体时间投入。'],
    },
    evidence: [
      { source_id: 'AL-SELF-05', type: 'self_report', claim: '本人回顾双轨经历与辞职节点。' },
      { source_id: 'AL-TRACK-05', type: 'institution_record', claim: '就业系统记录其就业单位与离职时间。' },
      { source_id: 'AL-MODEL-05', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['双轨', 'dual_track'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2020_01',
    person: { name: '2020 届 · 土木工程', tags: ['双轨', '转行'] },
    time: { year: 2020, stage: '本科四年级' },
    prior_path: ['大三在施工单位实习过一个暑假。', '自学了前端开发。'],
    decision_state: {
      dilemma: '进施工单位 vs 转互联网',
      options: ['施工国企', '互联网前端', '边工作边转'],
      constraints: ['土木就业面窄但稳定', '前端作品只有一个练手项目', '家人认为国企最稳'],
      goals: ['不要长期驻工地', '收入有增长'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'dual_track',
      actions: ['签约国企，同时用业余时间做外包项目积累经验。'],
    },
    outcomes: {
      short_term: '入职后被派驻外地项目，白天现场晚上写代码。',
      mid_term: '一年半后凭外包经历跳槽到一家软件公司。',
      long_term: '转型完成，但比直接转行的同学晚了一年多。',
    },
    reflection: {
      self_comment: '先保住饭碗再转，压力小很多。',
      unknowns: ['驻场期间的身体与心理成本未量化。'],
    },
    evidence: [
      { source_id: 'AL-SELF-06', type: 'self_report', claim: '本人回顾双轨与跳槽过程。' },
      { source_id: 'AL-TRACK-06', type: 'institution_record', claim: '就业系统记录两次就业单位。' },
      { source_id: 'AL-MODEL-06', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['双轨', 'dual_track', '转行'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2015_01',
    person: { name: '2015 届 · 金融学', tags: ['双轨', '考研'] },
    time: { year: 2015, stage: '本科四年级' },
    prior_path: ['大三在银行实习。', '同时准备考研。'],
    decision_state: {
      dilemma: '直接就业 vs 全职备考',
      options: ['签约银行', '全职备考', '边工作边考'],
      constraints: ['银行 offer 有签约期限', '考研把握不足五成', '家里希望先就业'],
      goals: ['不要空窗期', '保留读研可能'],
      risk: 'low',
      reversibility: 'high',
    },
    choice: {
      type: 'dual_track',
      actions: ['签下银行 offer，入职后继续在职备考。'],
    },
    outcomes: {
      short_term: '工作第一年边上班边复习，效率很低。',
      mid_term: '第二年放弃考研，专注工作。',
      long_term: '在银行做到支行管理岗，但一直觉得没试过读研是个遗憾。',
    },
    reflection: {
      self_comment: '两头都想要，结果两头都没尽全力。',
      unknowns: ['未记录放弃考研的具体原因。'],
    },
    evidence: [
      { source_id: 'AL-SELF-07', type: 'self_report', claim: '本人回顾在职备考与放弃。' },
      { source_id: 'AL-TRACK-07', type: 'institution_record', claim: '就业系统记录其单位与晋升。' },
      { source_id: 'AL-MODEL-07', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['双轨', 'dual_track'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2022_01',
    person: { name: '2022 届 · 心理学', tags: ['双轨', '转专业'] },
    time: { year: 2022, stage: '本科三年级' },
    prior_path: ['大二进心理学实验室。', '大三开始接用户体验相关的兼职。'],
    decision_state: {
      dilemma: '继续做学术心理 vs 转向用户体验研究',
      options: ['本专业读研', '转 UX 研究', '边读研边做兼职'],
      constraints: ['已有实验设计能力', 'UX 岗位不多', '导师希望他留下读研'],
      goals: ['用上心理学方法', '不放弃学术训练'],
      risk: 'low',
      reversibility: 'high',
    },
    choice: {
      type: 'dual_track',
      actions: ['接受导师保研，同时继续做 UX 兼职项目。'],
    },
    outcomes: {
      short_term: '研究生期间完成学业，兼职项目累计了三个。',
      mid_term: '毕业时凭项目经历拿到一家公司的用户研究员岗位。',
      long_term: '把学术方法带进产业研究，成为团队里的方法论负责人。',
    },
    reflection: {
      self_comment: '两边都保住的关键是研一没有贪多，只接了一个项目。',
      unknowns: ['导师对兼职的真实态度未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-08', type: 'self_report', claim: '本人回顾保研与兼职并行。' },
      { source_id: 'AL-RECORD-08', type: 'academic_record', claim: '保研录取记录。' },
      { source_id: 'AL-MODEL-08', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['双轨', 'dual_track', '转专业'],
    next_episode_ids: [],
  },

  /* ============ explore_then_switch：先试探再转向（3 条）============ */
  {
    episode_id: 'alumni_2018_02',
    person: { name: '2018 届 · 化学工程', tags: ['转行', '试探'] },
    time: { year: 2018, stage: '本科三年级下' },
    prior_path: ['大二进化工实验室。', '大三暑假做过一份实验室助理。'],
    decision_state: {
      dilemma: '化工读研 vs 转技术写作',
      options: ['化工读研', '技术写作', '先试试再定'],
      constraints: ['实验做得不好不坏', '文字表达能力被导师认可', '没有写作行业经验'],
      goals: ['做擅长且不排斥的事', '避免长期实验岗'],
      risk: 'low',
      reversibility: 'high',
    },
    choice: {
      type: 'explore_then_switch',
      actions: ['先用一个学期接翻译与文档兼职，确认能做后再放弃考研。'],
    },
    outcomes: {
      short_term: '兼职三个月后确认自己喜欢也做得来。',
      mid_term: '放弃考研，毕业后进入一家工具软件公司做文档。',
      long_term: '成为技术文档团队负责人，薪资不低于同届读研的同学。',
    },
    reflection: {
      self_comment: '先试了三个月才决定，这个顺序很重要。',
      unknowns: ['兼职期间的具体收入未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-09', type: 'self_report', claim: '本人回顾试探与决定过程。' },
      { source_id: 'AL-TRACK-09', type: 'institution_record', claim: '就业系统记录其就业单位。' },
      { source_id: 'AL-MODEL-09', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_switch', '转行'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2020_02',
    person: { name: '2020 届 · 会计学', tags: ['转行', '试探'] },
    time: { year: 2020, stage: '本科四年级' },
    prior_path: ['大三在会计师事务所实习。', '实习期间参加了公司的数字化项目。'],
    decision_state: {
      dilemma: '进事务所 vs 转数据分析',
      options: ['事务所审计', '数据分析', '先实习验证'],
      constraints: ['会计是父母强烈期待的方向', '只在实习里接触过数据工具', '没有编程基础'],
      goals: ['工作有技术含量', '不要完全违逆家里'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'explore_then_switch',
      actions: ['先接一份数据分析实习验证，确认后再拒掉事务所 offer。'],
    },
    outcomes: {
      short_term: '实习两个月后拿到转正机会。',
      mid_term: '工作三年后读了一个在职数据科学硕士。',
      long_term: '成为财务数据分析岗，把会计背景变成了优势。',
    },
    reflection: {
      self_comment: '最庆幸的是先实习了，不然我会以为自己只是不喜欢工作。',
      unknowns: ['父母态度转变过程未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-10', type: 'self_report', claim: '本人回顾实习验证与决定。' },
      { source_id: 'AL-TRACK-10', type: 'institution_record', claim: '就业系统记录实习与就业。' },
      { source_id: 'AL-MODEL-10', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_switch', '转行'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2023_01',
    person: { name: '2023 届 · 新闻传播', tags: ['转行', '试探'] },
    time: { year: 2023, stage: '本科三年级' },
    prior_path: ['大二在校园媒体做采编。', '大三发现传统媒体岗位在收缩。'],
    decision_state: {
      dilemma: '继续做记者 vs 转产品运营',
      options: ['媒体实习', '产品运营', '先各试一段'],
      constraints: ['写作能力是唯一突出优势', '没有产品相关经历', '家里没有行业资源'],
      goals: ['能力可迁移', '不被行业周期淘汰'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'explore_then_switch',
      actions: ['大四上同时做一份媒体实习和一份运营实习，对比后再定。'],
    },
    outcomes: {
      short_term: '两段实习各做了两个月。',
      mid_term: '选择运营方向，毕业进入一家内容平台。',
      long_term: '两年后成为内容策略岗，采编能力成了差异化优势。',
    },
    reflection: {
      self_comment: '两边都试过之后选，比只看招聘 JD 靠谱得多。',
      unknowns: ['两段实习的具体评价未记录。'],
    },
    evidence: [
      { source_id: 'AL-SELF-11', type: 'self_report', claim: '本人回顾双实习对比。' },
      { source_id: 'AL-TRACK-11', type: 'institution_record', claim: '就业系统记录就业单位。' },
      { source_id: 'AL-MODEL-11', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_switch', '转行'],
    next_episode_ids: [],
  },

  /* ============ explore_then_persist：试探后守住（3 条）============ */
  {
    episode_id: 'alumni_2019_02',
    person: { name: '2019 届 · 数学与应用数学', tags: ['试探', '留原方向'] },
    time: { year: 2019, stage: '本科三年级' },
    prior_path: ['大二确定想读基础数学。', '大三参加过量化实习。'],
    decision_state: {
      dilemma: '基础数学读博 vs 转量化金融',
      options: ['基础数学读博', '量化金融', '先实习看'],
      constraints: ['纯数学成绩不错', '家里担心读博收入低', '量化实习薪酬很高'],
      goals: ['做自己认可的研究', '不为钱彻底改行'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'explore_then_persist',
      actions: ['做了一个量化暑期实习，之后决定仍然读基础数学。'],
    },
    outcomes: {
      short_term: '实习结束拿到 return offer，但拒绝了。',
      mid_term: '进入基础数学博士项目。',
      long_term: '读到第五年，期间靠奖学金和助教收入维持。',
    },
    reflection: {
      self_comment: '试过之后才知道自己受不了那种工作节奏，这个结论值一个暑期。',
      unknowns: ['读博的最终结果尚未产生。'],
    },
    evidence: [
      { source_id: 'AL-SELF-12', type: 'self_report', claim: '本人回顾实习与最终选择。' },
      { source_id: 'AL-RECORD-12', type: 'academic_record', claim: '博士录取记录。' },
      { source_id: 'AL-MODEL-12', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_persist'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2021_02',
    person: { name: '2021 届 · 临床医学', tags: ['试探', '留原方向'] },
    time: { year: 2021, stage: '本科第四年' },
    prior_path: ['五年制临床医学，已读四年。', '见习期间感到疲惫但不算排斥。'],
    decision_state: {
      dilemma: '继续临床 vs 转医学相关行业',
      options: ['继续临床', '转医药企业', '转医疗投资'],
      constraints: ['已投入四年', '转行需重新积累', '同学多数在准备规培'],
      goals: ['职业有意义感', '不要长期超负荷'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'explore_then_persist',
      actions: ['到大四暑假去医药企业做了一段市场实习，之后决定继续临床。'],
    },
    outcomes: {
      short_term: '实习后确认自己更适应临床环境。',
      mid_term: '进入规培，工作强度大但适应良好。',
      long_term: '成为某三甲医院住院医师，仍在规培后期。',
    },
    reflection: {
      self_comment: '那段实习最大的作用是排除法。',
      unknowns: ['长期职业满意度尚未显现。'],
    },
    evidence: [
      { source_id: 'AL-SELF-13', type: 'self_report', claim: '本人回顾实习与决定。' },
      { source_id: 'AL-RECORD-13', type: 'academic_record', claim: '规培录取记录。' },
      { source_id: 'AL-MODEL-13', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_persist'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2017_02',
    person: { name: '2017 届 · 电子工程', tags: ['试探', '留原方向'] },
    time: { year: 2017, stage: '本科三年级' },
    prior_path: ['大二进电路设计实验室。', '大三参加过创业比赛。'],
    decision_state: {
      dilemma: '读电子方向研 vs 加入创业公司',
      options: ['读研', '创业公司', '先实习再定'],
      constraints: ['实验室有保研名额', '创业公司给的期权不确定', '父母倾向稳妥'],
      goals: ['做真正落地的产品', '保留学术可能'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'explore_then_persist',
      actions: ['暑假去创业公司实习两个月，之后选择保研。'],
    },
    outcomes: {
      short_term: '实习期间看到公司现金流紧张。',
      mid_term: '保研成功，研究方向更偏向产业落地。',
      long_term: '研究生毕业后进入芯片公司做设计。',
    },
    reflection: {
      self_comment: '实习让我看到创业不是我想的那样，省了两年试错。',
      unknowns: ['若当年加入该公司结果如何，无法判断。'],
    },
    evidence: [
      { source_id: 'AL-SELF-14', type: 'self_report', claim: '本人回顾实习观察与决定。' },
      { source_id: 'AL-RECORD-14', type: 'academic_record', claim: '保研录取记录。' },
      { source_id: 'AL-MODEL-14', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['试探', 'explore_then_persist'],
    next_episode_ids: [],
  },

  /* ============ persist：守住原路径（3 条）============ */
  {
    episode_id: 'alumni_2016_02',
    person: { name: '2016 届 · 物理学', tags: ['坚持', '学术'] },
    time: { year: 2016, stage: '本科四年级' },
    prior_path: ['大二进理论物理课题组。', '大三发表过一篇会议论文。'],
    decision_state: {
      dilemma: '继续物理读博 vs 转行做技术',
      options: ['物理读博', '转软件开发', '考公'],
      constraints: ['理论方向就业面窄', '编程能力一般', '家里希望有稳定收入'],
      goals: ['做基础研究', '不接受完全放弃物理'],
      risk: 'high',
      reversibility: 'low',
    },
    choice: {
      type: 'persist',
      actions: ['拒绝两个软件岗 offer，直接申请物理博士。'],
    },
    outcomes: {
      short_term: '申请季只拿到一所学校的 offer。',
      mid_term: '读博期间发了两篇论文，但方向偏冷门。',
      long_term: '读完博后进入一所普通高校任教，收入低于同期转行的同学。',
    },
    reflection: {
      self_comment: '收入差距是真实存在的，但我没后悔。',
      unknowns: ['是否长期满意，需要更长时间观察。'],
    },
    evidence: [
      { source_id: 'AL-SELF-15', type: 'self_report', claim: '本人回顾选择与现状。' },
      { source_id: 'AL-RECORD-15', type: 'academic_record', claim: '博士录取与毕业记录。' },
      { source_id: 'AL-MODEL-15', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['坚持', 'persist'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2018_03',
    person: { name: '2018 届 · 建筑学', tags: ['坚持', '转专业'] },
    time: { year: 2018, stage: '本科五年级' },
    prior_path: ['五年制建筑学，已读五年。', '大三实习时经历过一次方案被推翻。'],
    decision_state: {
      dilemma: '继续建筑 vs 转向室内设计',
      options: ['建筑事务所', '室内设计', '转行离开设计'],
      constraints: ['五年学制投入大', '行业整体下行', '同学陆续转行'],
      goals: ['留在设计行业', '不要从零开始'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'persist',
      actions: ['坚持投建筑事务所，没有跟随同学转行。'],
    },
    outcomes: {
      short_term: '入职一家中型事务所，起薪低于同学转行后的水平。',
      mid_term: '三年后成为项目主创之一。',
      long_term: '行业仍在下行，但凭借积累接到了独立项目。',
    },
    reflection: {
      self_comment: '看着同学转行收入翻倍会动摇，但我确实喜欢做设计。',
      unknowns: ['行业走势对长期收入的影响尚不明确。'],
    },
    evidence: [
      { source_id: 'AL-SELF-16', type: 'self_report', claim: '本人回顾坚持的理由。' },
      { source_id: 'AL-TRACK-16', type: 'institution_record', claim: '就业系统记录其单位。' },
      { source_id: 'AL-MODEL-16', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['坚持', 'persist'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2020_03',
    person: { name: '2020 届 · 食品科学', tags: ['坚持', '考研'] },
    time: { year: 2020, stage: '本科四年级' },
    prior_path: ['大二进食品检测实验室。', '参加过两次食品安全竞赛。'],
    decision_state: {
      dilemma: '本专业读研 vs 转行互联网',
      options: ['本专业读研', '互联网运营', '直接就业'],
      constraints: ['食品行业薪资普遍偏低', '互联网岗位竞争激烈', '已积累三年实验技能'],
      goals: ['用上专业积累', '不接受完全浪费'],
      risk: 'medium',
      reversibility: 'medium',
    },
    choice: {
      type: 'persist',
      actions: ['报考本专业研究生，同时投递了几家食品企业作为备选。'],
    },
    outcomes: {
      short_term: '考研上岸一所农业类院校。',
      mid_term: '研究生期间做食品安全检测方法研究。',
      long_term: '毕业进入检测机构，工作稳定但薪资增长缓慢。',
    },
    reflection: {
      self_comment: '稳定是稳定，但薪资确实是个问题。',
      unknowns: ['长期收入是否能追上互联网同学，未知。'],
    },
    evidence: [
      { source_id: 'AL-SELF-17', type: 'self_report', claim: '本人回顾选择与现状。' },
      { source_id: 'AL-RECORD-17', type: 'academic_record', claim: '研究生录取记录。' },
      { source_id: 'AL-MODEL-17', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['坚持', 'persist'],
    next_episode_ids: [],
  },

  /* ============ abandon：退出该路径（3 条）============ */
  {
    episode_id: 'alumni_2019_03',
    person: { name: '2019 届 · 生物技术', tags: ['放弃', '转行'] },
    time: { year: 2019, stage: '本科三年级' },
    prior_path: ['大二进生物实验室。', '做了两年细胞实验。'],
    decision_state: {
      dilemma: '继续读生物研 vs 彻底离开生物方向',
      options: ['生物读研', '转行做别的事', '考公'],
      constraints: ['实验反复失败消耗信心', '生物就业面窄', '成绩够保研'],
      goals: ['换个环境', '不想再做湿实验'],
      risk: 'high',
      reversibility: 'low',
    },
    choice: {
      type: 'abandon',
      actions: ['放弃保研资格，毕业后考取了公务员。'],
    },
    outcomes: {
      short_term: '备考半年后上岸地方单位。',
      mid_term: '工作内容与专业完全无关，重新学习。',
      long_term: '五年后适应了体制内节奏，认为放弃科研是正确决定。',
    },
    reflection: {
      self_comment: '不是不喜欢生物，是受不了那种反复失败的状态。',
      unknowns: ['如果换一个实验室是否会改变决定，未知。'],
    },
    evidence: [
      { source_id: 'AL-SELF-18', type: 'self_report', claim: '本人回顾放弃与转考公。' },
      { source_id: 'AL-RECORD-18', type: 'institution_record', claim: '教务记录显示放弃保研。' },
      { source_id: 'AL-MODEL-18', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['放弃', 'abandon'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2021_03',
    person: { name: '2021 届 · 材料成型', tags: ['放弃', '转行'] },
    time: { year: 2021, stage: '本科四年级' },
    prior_path: ['大三在铸造厂实习。', '实习后明确不想进制造业现场。'],
    decision_state: {
      dilemma: '进制造业 vs 转行做别的',
      options: ['制造企业', '转行', '先就业再转'],
      constraints: ['专业对口岗位几乎都在工厂', '转行没有明确方向', '家里希望有正式工作'],
      goals: ['不要长期在产线', '尽快有收入'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'abandon',
      actions: ['放弃所有制造业 offer，选择了一家教培机构。'],
    },
    outcomes: {
      short_term: '入职教培，收入不稳定但工作环境好。',
      mid_term: '两年后教培行业政策变化，被迫再次转行。',
      long_term: '转入一家制造业企业的销售岗，绕回了行业但换了职能。',
    },
    reflection: {
      self_comment: '绕了一圈还是回到制造业，但这次是我不想再逃了。',
      unknowns: ['教培那两年是否算浪费，本人看法前后有变化。'],
    },
    evidence: [
      { source_id: 'AL-SELF-19', type: 'self_report', claim: '本人回顾两次转行。' },
      { source_id: 'AL-TRACK-19', type: 'institution_record', claim: '就业系统记录三段就业。' },
      { source_id: 'AL-MODEL-19', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['放弃', 'abandon', '转行'],
    next_episode_ids: [],
  },
  {
    episode_id: 'alumni_2015_02',
    person: { name: '2015 届 · 国际经济与贸易', tags: ['放弃', '转行'] },
    time: { year: 2015, stage: '本科三年级' },
    prior_path: ['大二在贸易公司实习。', '实习中发现自己不喜欢跟单工作。'],
    decision_state: {
      dilemma: '读完国贸 vs 转向别的方向',
      options: ['国贸相关岗位', '转向其他行业', '继续读书'],
      constraints: ['国贸岗位同质化严重', '没有其他专业技能', '家庭经济一般'],
      goals: ['找到有积累性的工作', '不要频繁换行'],
      risk: 'medium',
      reversibility: 'high',
    },
    choice: {
      type: 'abandon',
      actions: ['不再投国贸岗位，用半年时间自学了设计。'],
    },
    outcomes: {
      short_term: '毕业后进入一家小广告公司做设计助理。',
      mid_term: '三年后成为独立设计师，收入不稳定但自由度较高。',
      long_term: '成立了一个小工作室，营收波动大。',
    },
    reflection: {
      self_comment: '收入不稳是代价，但我确实不想再坐办公室做跟单。',
      unknowns: ['长期经济状况能否稳定，尚不确定。'],
    },
    evidence: [
      { source_id: 'AL-SELF-20', type: 'self_report', claim: '本人回顾转行与现状。' },
      { source_id: 'AL-TRACK-20', type: 'institution_record', claim: '就业系统记录就业情况。' },
      { source_id: 'AL-MODEL-20', type: 'ai_inference', claim: 'decision_state 字段为建模推断。' },
    ],
    retrieval_tags: ['放弃', 'abandon'],
    next_episode_ids: [],
  },
];

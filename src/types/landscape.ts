/**
 * 决策地形 v2 —— 「引擎 + 可换数据源」的类型契约
 * ============================================================
 * 目标：让同一个引擎能装任何人群数据。
 *
 *   历史名人库  ─┐
 *   校友库      ─┼→  同一套 Schema → 同一套引擎 → 同一种输出
 *   员工库      ─┤
 *   机构私有库  ─┘
 *
 * ⚠️ 本文件与 episode.ts 的关系
 *   episode.ts 是**现有六页**在用的契约，不动它（队友都依赖）。
 *   本文件是新增层：把 DecisionEpisode 包上一层「数据源」语义，
 *   并定义新的输出结构（PathArchetype / RootFactor / PersonalizedCost）。
 *
 * ⚠️ 为什么现在就要按「最终产品」设计而不是图省事
 *   最终交付物是一个完整网页（前端 + 后端 + 好看 UI）。
 *   如果现在造一个临时结构，队友照它做前端 → 返工两个人的时间。
 *   所以字段命名、分层、隐私字段都一次性到位。
 *
 * ⚠️ 三条实测得出的设计约束（不要推翻，见文末「实测记录」）
 *   ① choice.type 记「做了什么」，机制记「在权衡什么」—— 两者都要，不可互替
 *   ② 路径聚类必须用 root_factors 的集合重叠，不能用机制文本的 embedding
 *   ③ 现有 36 条撑不起「2-4 条路径」，演示必须引入第二份数据源
 */

import type { DecisionEpisode, Level } from './episode';

/* ============================================================
   一、根因素（RootFactor）—— 用户与人物共用的语义空间
   ============================================================ */

/**
 * 标准根因素词表。
 *
 * ⚠️ 必须是**封闭词表**。
 *   如果不封闭，模型会自由发挥（实测抽出过「路径绑定的制度性通道」这种
 *   一句一义的短语），那么跨人物的集合重叠就无从计算 —— 聚类直接失效。
 *
 * 12 个是当前数据量下的折中：
 *   少于 ~10 个太粗（区分不出走法差异）
 *   多于 ~20 个会导致大量字段缺失 + 伪精确
 */
export const ROOT_FACTORS = [
  '沉没成本',
  '转换成本',
  '新路径验证不足',
  '长期方向匹配',
  '再次选错风险',
  '时间窗口',
  '经济压力',
  '家庭约束',
  '制度约束',
  '身份绑定',
  '机会成本',
  '社会支持',
] as const;

export type RootFactor = (typeof ROOT_FACTORS)[number];

/* ============================================================
   二、决策机制（DecisionMechanism）—— 中等抽象层
   ============================================================ */

/**
 * 走法原型。
 *
 * ⚠️ 与 episode.choice.type 的关系（实测结论 ①）
 *   两者记的是**不同的东西**，不可互相替代：
 *
 *     choice.type  记「做了什么」  ← 客观行为
 *     archetype    记「在权衡什么」← 决策结构
 *
 *   实测反例：把 choice.type 当标准答案喂给模型，6 条里改了 4 条。
 *   但检查机制描述后发现**模型更准**：
 *
 *     鲁迅    库里=direct_switch → 模型=dual_track
 *             事实：1904 入仙台医专 → 1906 退学，但退学前已持续翻译写作
 *             = 确实同时在两条轨上
 *     乔布斯  库里=abandon       → 模型=dual_track
 *             事实：退学但**继续旁听**课程 = 典型的双轨
 *
 *   所以 archetype_v2 是**新增字段**，与 choice.type 并存。
 *   不要去「修正」choice.type —— 它的口径是对的，只是回答另一个问题。
 */
export type PathArchetypeId =
  | 'persist'              // 守住已投入的路径
  | 'explore_then_persist' // 先低成本试探，验证后再决定守住
  | 'explore_then_switch'  // 先低成本试探，验证后转向
  | 'direct_switch'        // 直接转向
  | 'dual_track'           // 两条轨并行（退而不离）
  | 'abandon'              // 退出/放弃该路径
  | 'unknown';             // 证据不足以判定

/**
 * 一个 Episode 的机制标注。
 * 由 scripts/tag-mechanisms.mjs 离线产出到 data/mechanisms.json。
 */
export interface MechanismTag {
  /** 走法原型（新增字段，不覆盖 choice.type） */
  archetype: PathArchetypeId;
  /** 从封闭词表 ROOT_FACTORS 里选的 3-6 个 —— 聚类靠它 */
  root_factors: RootFactor[];
  /**
   * ≤20 字概括「在权衡什么」。
   * ⚠️ 不得出现具体职业/专业名（否则无法跨时代比较）。
   *   例：「在已投入路径与未验证向往间权衡」
   */
  mechanism_short: string;
  /** 标注时用的模型与时间，便于复现与追责 */
  tagged_by: string;
  tagged_at: string;
}

/* ============================================================
   三、数据源（DataSource）—— 「模板」的关键抽象
   ============================================================ */

/**
 * 数据来源类型。
 * P0 只用到 historical_public 与 alumni；
 * 后两个是 ToB 预留（字段现在就有，成本≈0，以后重构代价很大）。
 */
export type SourceType =
  | 'historical_public'    // 公开历史人物
  | 'alumni'               // 学校校友
  | 'employee'             // 公司员工
  | 'institution_private'; // 机构私有

/**
 * 隐私级别。
 *
 * ⚠️ 这不是装饰字段。
 *   机构场景和 ToC 场景的风险性质完全不同：
 *     看古人：用户自己看，自己判断
 *     装学生数据：学生填的东西可能被学校/公司看到
 *   最危险的不是技术泄露，是**用途漂移**：
 *     学校拿「发展方向匹配」去考核就业率？
 *     公司拿「发展路径匹配」去决定裁谁？
 *
 *   所以 P0 就要把 privacy_level 带进响应，
 *   UI 必须显示数据来源与隐私级别，让用户知道自己在看谁的数据。
 */
export type PrivacyLevel = 'public' | 'deidentified' | 'private';

/** 数据源的展示信息（前端顶部开关要显示） */
export interface DataSourceInfo {
  id: string;
  /** 中文标签，如「历史人物库」「2024 届校友库」 */
  label: string;
  source_type: SourceType;
  privacy_level: PrivacyLevel;
  /** 这份数据的一句话说明，显示给用户 */
  description: string;
  /** 数据规模，显示为「基于 N 条真实轨迹」 */
  episode_count: number;
  person_count: number;
}

/** 数据源接口 —— 引擎只认这个，不认识「历史人物」这个概念 */
export interface DataSource {
  info: DataSourceInfo;
  /** 带机制标注的案例（机制缺失时 mechanism 为 undefined，引擎会跳过聚类） */
  episodes: Array<DecisionEpisode & { mechanism?: MechanismTag }>;
}

/* ============================================================
   四、用户侧输入 v2
   ============================================================ */

/**
 * 用户处境 v2。
 *
 * 与 v1（Situation）的差别：
 *   v1 强制 dilemma 是 "A vs B" —— 但真实困境常常是 3 条以上的路
 *   v2 用 options（2-5 条）+ root_factors（3-6 个）表达
 *
 * ⚠️ v1 不删。现有六页还在用 Situation。
 *   两者可以互转（v1 → v2 时把 dilemma 拆成 options，根因素留空待解析）。
 */
export interface SituationV2 {
  /** 人生阶段，≤12 字 */
  stage: string;
  /** 此刻面对的岔路，2-5 条 */
  options: string[];
  /** 从封闭词表选的 3-6 个根因素 */
  root_factors: RootFactor[];
  /** 现实约束，2-6 条（自然语言，不强制词表） */
  constraints: string[];
  /** 真正在意的目标，2-5 条 */
  goals: string[];
  /**
   * ⚠️ 他最怕发生什么 —— **单独一个字段，不要混进 unknowns**。
   *
   *   实测发现：这一条原来被塞进 `unknowns: ['最怕：xxx']`，
   *   然后**后端没有任何地方读它**（全仓库 grep `fear` = 0 次）。
   *
   *   但它是**给「代价」排序最关键的信息** ——
   *   「哪条代价对你最重」完全取决于你最怕什么。
   *   比如你怕「拖两年才发现还是不喜欢」，那「时间窗口」类的代价就该排最前。
   */
  fear?: string;
  /**
   * 他为想去的方向**实际花过时间**的尝试。
   * 用来判断「这条路保不保护他不想白费的东西」。
   */
  validation?: string;
  /** 他的来时路（被调剂 / 自己选的 / 转过来的） */
  prior_path?: string;
  risk: Level;
  reversibility: Level;
  /** 尚不明确的信息 */
  unknowns: string[];
}

/* ============================================================
   五、输出：三条路径 + 个性化代价
   ============================================================ */

/**
 * 代价的依据。
 * ⚠️ 这是本产品最核心的差异化 —— **必须能追溯到用户原话**。
 *   《个人信息保护法》第 24 条要求自动化决策可解释；
 *   而产品层面更重要：用户看到「因为你刚才说……」才会信。
 */
export interface CostBasis {
  kind: 'user_quote' | 'structure' | 'era' | 'unknown';
  /** kind=user_quote 时，这里是用户真实说过的那句话（原样引用） */
  quote?: string;
  /** 内部依据说明，不直接显示给用户 */
  note?: string;
}

/** 一条个性化代价 */
export interface PersonalizedCost {
  /** 给用户看的一句话，如「继续投入几年后，仍然发现不认同这个方向」 */
  text: string;
  /** 为什么对「你」而言它最重 */
  basis: CostBasis;
}

/** 支撑某条路径的真实案例（人物后置 —— 这里只给最小识别信息） */
export interface SupportingCase {
  episode_id: string;
  /** 显示名，如「李安」或「2019 届 · 材料」 */
  display_name: string;
  /** 年份，如 1984 */
  year: number;
  /** 一句话：他后来怎样了（用于卡片上的「看看他们后来…」） */
  outcome_hint: string;
  /**
   * 他这条案例的因素标注（数据工程离线标注，原样透传）。
   * 前端用来逐人回答「为什么推荐他」：你和他共同卡在哪些因素上。
   */
  root_factors?: string[];
}

/**
 * 一条走法（路径原型）。
 * ⚠️ 这是旧版「三个名人卡」的替代物 —— 人物后置，选择机制前置。
 */
export interface PathArchetype {
  id: PathArchetypeId;
  /** 路径标题，如「守住已经建立的路径」 */
  title: string;
  /** 一句话描述这条路的性质（不是建议，是描述） */
  one_line: string;
  /** 这条路保护的是什么 */
  protects: string[];
  /** 对「你」而言可能最重的代价 —— 按个性化程度排序 */
  costs: PersonalizedCost[];
  /** 这条路径来自哪几条真实案例（可追溯） */
  supporting_cases: SupportingCase[];
  /**
   * 诚实降级标记。
   * 当候选只聚出一种走法、或某个案例背景差异较大时，把原因写在这里。
   * ⚠️ 绝不为了凑满 2-4 条而伪造路径。
   */
  caveat?: string;
}

/* ============================================================
   六、响应
   ============================================================ */

/**
 * 决策地形响应。
 * 每一层对应 UI 的一个区块 —— 前端拿到可直接渲染，不用再拼。
 */
export interface LandscapeResponse {
  /** 顶部开关要显示的数据源信息 */
  data_source: DataSourceInfo;

  /** 第二屏：AI 对你的理解（用户可逐条修改） */
  profile: {
    stage: string;
    /** 抽象出的根因素 */
    root_factors: RootFactor[];
    /** 一句人话翻译：「你真正面对的，不只是『转不转专业』。它更像是……」 */
    mechanism_reading: string;
    /** 原始约束/目标，供用户确认 */
    constraints: string[];
    goals: string[];
  };

  /** 第三屏：2-4 条路径（不是 3 条名人卡） */
  archetypes: PathArchetype[];

  /**
   * 是否因候选不足而无法给出多条路径。
   * true 时 archetypes 可能只有 1 条 —— UI 必须明说，不许装作还有别的。
   */
  single_path_only: boolean;

  meta: {
    /** 第一阶段召回的人物数 */
    persons_recalled: number;
    /** 第二阶段命中的案例数 */
    episodes_matched: number;
    /** 最终聚出的路径数 */
    archetypes_found: number;
    elapsed_ms: number;
    /** 聚类判据，便于答辩时解释 */
    clustering?: {
      method: 'root_factor_jaccard';
      threshold: number;
    };
  };
}

/* ============================================================
   实测记录（写在这里，免得后人重踩）
   ============================================================

   ① choice.type 与决策机制是两回事
      把 choice.type 当标准答案喂给模型，6 条里改了 4 条；
      检查机制描述后确认模型更准（鲁迅、乔布斯的「双轨」判定符合史实）。
      → archetype_v2 是新增字段，不覆盖 choice.type。

   ② 机制文本不能用于聚类
      实测三条机制文本：
        鲁迅: 当已投入的路径与制度绑定的身份同时构成约束时…
        李安: 当已有投入形成特定能力积累，但制度性通道长期不开放时…
        村上: 当既有路径尚能维持生存且未彻底失效时…
      字面几乎不重叠（自由发挥的长句）；但 root_factors 高度重叠。
      → 聚类用 root_factors 的 Jaccard，不用机制文本的 embedding。

   ③ 现有数据撑不起多路径
      36 条里按「转专业/方向重构」筛只有 9 条 / 6 人：
        direct_switch 7 / abandon 1 / explore_then_persist 1
      → 主要只能拿出一种走法。演示必须引入第二份数据源。

   ④ 机制抽取本身很快且稳
      6/6 成功，1.6-2.0s/条；36 条约 1 分钟。
   ============================================================ */

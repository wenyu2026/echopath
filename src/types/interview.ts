/**
 * 访谈的字段规格（前后端共用）
 * ============================================
 * ⚠️ 为什么单独一个文件，而不是放在 server/interview/interview.ts 里
 *
 *   前端需要 `FIELDS` 来显示「你的处境」面板的中文标签。
 *   但如果直接从 server 文件 import，会把**整个服务端模块**拉进浏览器构建 ——
 *   连带 `process.env`、`node:http` 这些浏览器里不存在的东西，
 *   构建直接报 "Cannot find name 'process'"。
 *
 *   所以：**规格（数据）放这里，逻辑（调 LLM）留在 server。**
 *
 * ⚠️ 这张表是**产品的核心资产** —— 它定义了「什么样才算了解一个人」。
 *   改它等于改产品，不是改代码。
 */

/**
 * 访谈要弄清楚的字段。
 *
 * relevance: 这个字段对「匹配到正确的人」有多重要（0-1）
 * burden:    问这个问题的负担有多重（0-1，越高越难答/越敏感）
 *            负担高的往后放 —— 先建立信任再问敏感的
 * askable:   能不能直接用一句话问出来
 */
export interface FieldSpec {
  key: string;
  /** 中文名，显示在「你的处境」面板上 */
  label: string;
  /** 问这个问题时的意图（给模型看的，不是给用户看的） */
  intent: string;
  relevance: number;
  burden: number;
  askable: boolean;
}

export const FIELDS: FieldSpec[] = [
  {
    key: 'stage',
    label: '所处阶段',
    intent: '他现在处在什么人生/教育/职业阶段，越具体越好（大三？工作五年？）',
    relevance: 0.9,
    burden: 0.05,
    askable: true,
  },
  {
    key: 'dilemma',
    label: '迷茫点',
    intent:
      '他此刻到底在纠结什么。注意：不要接受「我很迷茫」这种空话，要问出具体在两条/几条路之间。',
    relevance: 1.0,
    burden: 0.2,
    askable: true,
  },
  {
    key: 'prior_path',
    label: '来时路',
    intent: '他是怎么走到今天这个路口的 —— 做过什么、投入了什么。',
    relevance: 0.85,
    burden: 0.15,
    askable: true,
  },
  {
    key: 'constraints',
    label: '现实约束',
    intent:
      '有哪些拔不掉的条件：经济、家庭、成绩门槛、时间窗口等。注意：问「约束程度」而不是问具体数字。',
    relevance: 0.9,
    burden: 0.45,
    askable: true,
  },
  {
    key: 'goals',
    label: '真正在意的',
    intent: '他真正想要的是什么（兴趣、稳定、收入、意义……）。要区分「嘴上说的」和「真的在意的」。',
    relevance: 0.85,
    burden: 0.3,
    askable: true,
  },
  {
    key: 'validation',
    label: '对新方向验证到什么程度',
    intent: '他对想去的方向做过哪些**真正需要投入时间**的尝试。这一条对匹配影响很大。',
    relevance: 0.95,
    burden: 0.25,
    askable: true,
  },
  {
    key: 'fear',
    label: '最怕的结果',
    intent: '他最怕发生什么。这一条决定了「代价」该怎么排序 —— 是产品个性化的关键。',
    relevance: 0.95,
    burden: 0.4,
    askable: true,
  },
  {
    key: 'reversibility_attitude',
    label: '对可逆性的态度',
    intent: '如果这条路走不通，能不能退回来？他对此的接受度如何（比如能不能接受延毕）。',
    relevance: 0.6,
    burden: 0.3,
    askable: true,
  },
];

/** 访谈配置 */
export const INTERVIEW_CONFIG = {
  /** 最少问几轮才开始总结（避免刚问两句就下结论） */
  min_questions: 4,
  /**
   * ⚠️ **刻意没有「最多问几轮」**。
   *
   * 原来这里有 `max_questions: 8`，实测暴露了它的害处：
   *
   *   用户答到第 8 轮时，AI 刚好问出最有价值的一问 ——
   *   「你说满意，是喜欢这个方向本身，还是觉得读下去稳？」
   *   但已到上限，**这一问没机会问完就被截断了**。
   *
   *   而且中间 AI 自我纠错花掉了 2 轮（用户说「我没说要转专业呀」），
   *   8 轮里有 1/4 用在纠错上，真正采集信息只用掉 6 轮。
   *
   * **轮次是手段不是目的。** 真正的目的是「信息够不够下判断」。
   * 所以停止只看三件事：
   *   ① 关键字段置信度够不够
   *   ② 还有没有「问了能改变结果」的问题
   *   ③ 是不是在原地打转（下面这个兜底）
   *
   * 用户随时可以自己喊停（UI 上有「够了，直接看结果」）。
   */
  /** 连续这么多轮没推进任何关键字段，就停 —— 防原地打转，而不是防问得多 */
  no_progress_rounds: 6,
  /** 平均置信度到这个值就可以停了 */
  confidence_threshold: 0.75,
  /** 最高优先级的未解决字段低于这个值就可以停了 */
  priority_threshold: 0.25,
  /**
   * 同一个字段最多问几次。
   *
   * ⚠️ 实测踩到过：问了 goals「你图它什么」，用户答的却是 fear
   *   （「我最怕的是选错了方向…」）。抽取器只抽用户真说了的，所以 goals 空着。
   *   第一版把 goals 记成「已问过」**再也不问了** —— 最后 goals 完全没采集到。
   *
   *   教训：**问了 ≠ 答了**。允许重问，但要换角度，并打折（见 priorityOf）。
   */
  max_asks_per_field: 3,
};

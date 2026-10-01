/**
 * 输出守卫（#15 第二部分）
 * ============================================
 * 依据：server/RULES-evidence-counter-analogy.md 第 2.5 节与第三节。
 *
 * 为什么必须是机械校验而不是提示词约束：
 *   方案第 17 节把「替用户做决定」列为明确的产品伦理风险。
 *   提示词会被模型忽略，正则不会。这是产品红线，必须硬拦。
 *
 * 两道黑名单：
 *   1. 决策指令类（你应该 / 我推荐你 …）—— 违反「提供镜子，不代替选择」
 *   2. 结果二元化类（成功 / 失败 / 赢家）—— 违反「不把结果倒推成正确决策」
 */

/** 决策指令黑名单（规则文档 2.5 原文） */
const DECISION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /你应该/g, label: '你应该' },
  { re: /你最好/g, label: '你最好' },
  { re: /建议你(选择|选|放弃)/g, label: '建议你选择/选/放弃' },
  { re: /我推荐你/g, label: '我推荐你' },
  { re: /最优(选择|路线)/g, label: '最优选择/路线' },
  { re: /正确(的)?选择/g, label: '正确选择' },
  // 补充：同义变体，产品调性一致才拦得住
  { re: /应?该选/g, label: '该选' },
  { re: /推荐你/g, label: '推荐你' },
  { re: /最好的(选择|办法|方案)/g, label: '最好的选择/办法/方案' },
];

/** 结果二元化黑名单（规则文档第三节） */
const OUTCOME_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /成功/g, label: '成功' },
  { re: /失败/g, label: '失败' },
  { re: /赢家/g, label: '赢家' },
];

export interface Violation {
  label: string;
  kind: 'decision' | 'outcome';
  /** 命中的上下文，便于排查 */
  excerpt: string;
}

/** 扫一遍文本，返回所有命中项 */
export function findViolations(text: string, kinds: ('decision' | 'outcome')[] = ['decision']): Violation[] {
  const hits: Violation[] = [];
  const scan = (patterns: { re: RegExp; label: string }[], kind: 'decision' | 'outcome') => {
    for (const { re, label } of patterns) {
      // 每次调用重置 lastIndex，避免 /g 正则在多次调用间串状态
      re.lastIndex = 0;
      const m = re.exec(text);
      if (!m) continue;
      const at = m.index;
      hits.push({
        label,
        kind,
        excerpt: text.slice(Math.max(0, at - 12), Math.min(text.length, at + label.length + 12)),
      });
    }
  };

  if (kinds.includes('decision')) scan(DECISION_PATTERNS, 'decision');
  if (kinds.includes('outcome')) scan(OUTCOME_PATTERNS, 'outcome');
  return hits;
}

export function isClean(text: string, kinds: ('decision' | 'outcome')[] = ['decision']): boolean {
  return findViolations(text, kinds).length === 0;
}

/**
 * 重写提示词（规则文档 2.5：命中后用 glm-5 重写一次）。
 *
 * 关键约束：**改为「代价 / 结果」视角，不给行动指令，不许新增事实**。
 */
export const REWRITE_SYSTEM_PROMPT = `你是文本改写器。用户会给一句违反了「不替用户做决定」原则的中文句子。

你的任务：把它改写成「代价 / 结果」视角的陈述句。

硬性约束：
1. 禁止出现：你应该、你最好、建议你选择、我推荐你、最优选择、正确选择、最好的选择
2. 禁止新增原文没有的事实
3. 禁止新增任何行动指令
4. 保持原意，只换视角：把「你该做 X」改成「做 X 的代价是 Y」或「有人做 X，结果 Z」
5. 只输出改写后的那一句，不要解释，不要引号

示例：
输入：你应该先做低成本验证再决定
输出：先做低成本验证的人，保留了随时收回决定的余地，代价是推迟了正式转型的时间`;

/**
 * 对一段文本执行守卫：命中 → 交给 rewrite 重写一次 → 再命中 → 丢弃该句。
 *
 * @param text     待检查文本
 * @param rewrite  重写函数（注入以便单测不依赖网络）；返回空串表示放弃重写
 * @param kinds    检查哪几类黑名单
 * @returns        通过检查的文本
 */
export async function guardText(
  text: string,
  rewrite: (text: string) => Promise<string>,
  kinds: ('decision' | 'outcome')[] = ['decision'],
): Promise<{ text: string; violations: Violation[]; action: 'pass' | 'rewritten' | 'dropped' }> {
  const first = findViolations(text, kinds);
  if (first.length === 0) return { text, violations: [], action: 'pass' };

  let rewritten = '';
  try {
    rewritten = (await rewrite(text)).trim();
  } catch {
    rewritten = '';
  }

  // 重写失败或重写后仍违规 → 丢弃（规则文档 2.5：再命中直接删除该句）
  if (!rewritten || findViolations(rewritten, kinds).length > 0) {
    return { text: '', violations: first, action: 'dropped' };
  }

  return { text: rewritten, violations: first, action: 'rewritten' };
}

/** 批量守卫一组文本（反类比列表用），返回过滤后的列表 */
export async function guardList(
  items: string[],
  rewrite: (text: string) => Promise<string>,
  kinds: ('decision' | 'outcome')[] = ['decision'],
): Promise<{ items: string[]; dropped: string[]; rewritten: number }> {
  const kept: string[] = [];
  const dropped: string[] = [];
  let rewrittenCount = 0;

  for (const item of items) {
    const r = await guardText(item, rewrite, kinds);
    if (r.action === 'dropped') {
      dropped.push(item);
      continue;
    }
    if (r.action === 'rewritten') rewrittenCount++;
    kept.push(r.text);
  }

  return { items: kept, dropped, rewritten: rewrittenCount };
}

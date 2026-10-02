/**
 * 前端 ↔ 检索链路 的唯一适配层
 * ============================================================
 * #16（前端）只依赖本文件导出的 retrieve()。
 *
 * 现在：本地结构匹配（可离线演示，不依赖网络 / API Key）
 * 以后：#14/#15 的后端就绪后，把 USE_REMOTE 打开、填上地址即可，
 *       页面代码一行都不用改。
 *
 * 契约：入参 string，出参 RetrievalResponse（见 src/types/episode.ts）
 */
import type {
  ChoiceType,
  DecisionEpisode,
  EvidenceType,
  Level,
  MatchDimensions,
  MatchResult,
  RetrievalResponse,
  Situation,
} from '../../types/episode.ts'
import { mockEpisodes } from './mockEpisodes.ts'

/** 后端就绪后改成 true，并配置 VITE_API_BASE（见 .env.example） */
const USE_REMOTE = false

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

/* ------------------------------------------------------------------
 * 一、处境解析（Situation Parser）
 * 现在：本地关键词规则，保证离线也能演示
 * 以后：POST /api/parse → glm-5 + json_schema 严格模式
 * ------------------------------------------------------------------ */

/** 关键词 → 结构化字段的本地规则表 */
const RULES: Array<{
  /** 命中任一关键词即视为相关 */
  keywords: string[]
  stage?: string
  dilemma?: string
  options?: string[]
  constraints?: string[]
  goals?: string[]
  tags?: string[]
  risk?: Level
  reversibility?: Level
  unknowns?: string[]
}> = [
  {
    keywords: ['专业', '转专业', '选专业', '调剂'],
    stage: '大二/大三',
    dilemma: '坚持本专业 vs 转向新方向',
    options: ['继续读完', '申请转专业', '先修课再决定'],
    constraints: ['已投入两年', '转专业有成绩门槛', '可能延毕'],
    goals: ['做感兴趣的事', '减少内耗'],
    tags: ['换方向', '沉没成本'],
    risk: 'medium',
    reversibility: 'medium',
    unknowns: ['新方向的能力匹配度', '转专业的真实成功率'],
  },
  {
    keywords: ['考研', '就业', '工作', '毕业'],
    stage: '大三/大四',
    dilemma: '继续深造 vs 直接就业',
    options: ['全力考研', '直接就业', '边实习边备考'],
    constraints: ['备考时间有限', '经济压力', '学历门槛'],
    goals: ['更好的起点', '尽快独立'],
    tags: ['延迟收益', '经济约束'],
    risk: 'medium',
    reversibility: 'medium',
    unknowns: ['目标行业的学历门槛', '备考成功率'],
  },
  {
    keywords: ['创业', '大厂', '小公司', '稳定', '体制', '考公'],
    stage: '毕业前后',
    dilemma: '稳定路径 vs 高成长路径',
    options: ['去大厂/体制内', '去小公司/创业', '先积累再决定'],
    constraints: ['家庭期待稳定', '试错成本', '信息不足'],
    goals: ['成长空间', '安全感'],
    tags: ['稳定', '高不确定性'],
    risk: 'high',
    reversibility: 'low',
    unknowns: ['小公司的真实存活率', '自己能承受多大的不确定性'],
  },
  {
    keywords: ['坚持', '放弃', '放弃吗', '撑不住', '看不到希望'],
    stage: '坚持期',
    dilemma: '继续坚持 vs 及时止损',
    options: ['继续投入', '停止并转向', '降低投入先观察'],
    constraints: ['已投入大量时间', '外部期待', '机会成本'],
    goals: ['不后悔', '投入不白费'],
    tags: ['坚持', '沉没成本', '低可逆性'],
    risk: 'high',
    reversibility: 'low',
    unknowns: ['再坚持多久才有结果', '转向后能否复用已有积累'],
  },
]

/** 从自由文本里挑出命中的规则，合并成 Situation */
export function parseSituation(input: string): Situation {
  const text = input.trim()
  const hit = RULES.filter((r) => r.keywords.some((k) => text.includes(k)))

  // 一条都没命中时给一个中性兜底，保证流程不中断
  const merged = hit.length > 0 ? hit : [RULES[0]]

  const pick = <T,>(key: 'options' | 'constraints' | 'goals' | 'unknowns'): T[] => {
    const out: T[] = []
    for (const r of merged) {
      for (const v of (r[key] ?? []) as T[]) {
        if (!out.includes(v)) out.push(v)
      }
    }
    return out
  }

  const first = merged[0]

  return {
    stage: first.stage ?? '当前阶段',
    dilemma: first.dilemma ?? '坚持现状 vs 做出改变',
    options: pick<string>('options').slice(0, 5),
    constraints: pick<string>('constraints').slice(0, 6),
    goals: pick<string>('goals').slice(0, 5),
    risk: first.risk ?? 'medium',
    reversibility: first.reversibility ?? 'medium',
    unknowns: pick<string>('unknowns').slice(0, 6),
  }
}

/* ------------------------------------------------------------------
 * 二、结构匹配（七维度打分）
 * 现在：标签重叠 + 枚举距离，可解释、可离线
 * 以后：embedding 召回 + LLM 重排，接口签名不变
 * ------------------------------------------------------------------ */

const LEVEL_VALUE: Record<Level, number> = { low: 0, medium: 1, high: 2 }

/** 两个集合的重叠比例，0-1 */
function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0.5
  const setB = new Set(b)
  const hits = a.filter((x) => setB.has(x)).length
  return hits / Math.max(a.length, b.length)
}

/** 文本包含关系的粗粒度相似度，用于困境/阶段 */
function textSim(a: string, b: string): number {
  const chars = (s: string) => new Set(s.replace(/[^\u4e00-\u9fa5A-Za-z]/g, ''))
  const sa = chars(a)
  const sb = chars(b)
  if (sa.size === 0 || sb.size === 0) return 0.5
  let hits = 0
  for (const c of sa) if (sb.has(c)) hits += 1
  return hits / Math.max(sa.size, sb.size)
}

/** 枚举距离相似度：完全一致 1，差一级 0.5，差两级 0 */
function levelSim(a: Level, b: Level): number {
  return 1 - Math.abs(LEVEL_VALUE[a] - LEVEL_VALUE[b]) / 2
}

/** 计算七个维度，并给出标签命中明细 */
export function scoreEpisode(
  s: Situation,
  e: DecisionEpisode,
): { dimensions: MatchDimensions; tagHits: string[]; tagMisses: string[] } {
  const tags = e.retrieval_tags
  const wanted = [...s.constraints, ...s.goals, ...s.options]

  const tagHits = tags.filter((t) => wanted.some((w) => w.includes(t) || t.includes(w)))
  const tagMisses = tags.filter((t) => !tagHits.includes(t))

  const dimensions: MatchDimensions = {
    stage_match: textSim(s.stage, e.time.stage),
    path_match: overlap(s.options, e.decision_state.options),
    dilemma_match: textSim(s.dilemma, e.decision_state.dilemma),
    constraint_match: overlap(s.constraints, e.decision_state.constraints),
    goal_match: overlap(s.goals, e.decision_state.goals),
    reversibility_match: levelSim(s.reversibility, e.decision_state.reversibility),
    // 差异惩罚：风险越不一致、标签越对不上，惩罚越高
    difference_penalty:
      1 -
      (levelSim(s.risk, e.decision_state.risk) * 0.6 +
        (tagHits.length / Math.max(tags.length, 1)) * 0.4),
  }

  return { dimensions, tagHits, tagMisses }
}

/** 总分：正向维度取平均，减去差异惩罚 */
function totalScore(d: MatchDimensions): number {
  const positive =
    (d.stage_match +
      d.path_match +
      d.dilemma_match +
      d.constraint_match +
      d.goal_match +
      d.reversibility_match) /
    6
  return positive * (1 - d.difference_penalty * 0.35)
}

/* ------------------------------------------------------------------
 * 三、多样性选择器
 * 硬要求：最终 3 个案例的 choice.type 至少覆盖 2 种不同值
 * ------------------------------------------------------------------ */
export function selectDiverse(
  ranked: MatchResult[],
  size = 3,
): MatchResult[] {
  const picked: MatchResult[] = []
  const usedTypes = new Set<ChoiceType>()

  // 第一轮：每种 choice.type 只取分最高的一个，保证多样性
  for (const m of ranked) {
    if (picked.length >= size) break
    const t = m.episode.choice.type
    if (!usedTypes.has(t)) {
      usedTypes.add(t)
      picked.push(m)
    }
  }

  // 第二轮：如果还不够，按分数补齐
  for (const m of ranked) {
    if (picked.length >= size) break
    if (!picked.includes(m)) picked.push(m)
  }

  return picked
}

/* ------------------------------------------------------------------
 * 四、像 / 不像 的解释生成
 * ------------------------------------------------------------------ */
const CHOICE_LABEL: Record<ChoiceType, string> = {
  persist: '坚持原路',
  direct_switch: '直接转向',
  explore_then_switch: '先试探再转向',
  explore_then_persist: '试探后确认留下',
  abandon: '放弃退出',
  dual_track: '双轨并行',
}

export function choiceLabel(t: ChoiceType): string {
  return CHOICE_LABEL[t]
}

const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  self_writing: '本人自述',
  biography: '权威传记',
  interview: '公开访谈',
  encyclopedia: '公共资料',
  ai_inference: 'AI 推断',
}

export function evidenceLabel(t: EvidenceType): string {
  return EVIDENCE_LABEL[t]
}

/** 为什么像你：只写命中的结构点 */
function buildWhySimilar(s: Situation, e: DecisionEpisode, hits: string[]): string[] {
  const out: string[] = []
  const ds = e.decision_state

  if (hits.length > 0) {
    out.push(`都涉及这些结构性关键词：${hits.join('、')}`)
  }
  const sharedConstraints = s.constraints.filter((c) => ds.constraints.includes(c))
  if (sharedConstraints.length > 0) {
    out.push(`同样面对「${sharedConstraints.join('、')}」这类约束`)
  }
  const sharedGoals = s.goals.filter((g) => ds.goals.includes(g))
  if (sharedGoals.length > 0) {
    out.push(`在意的目标也有重叠：${sharedGoals.join('、')}`)
  }
  if (s.reversibility === ds.reversibility) {
    out.push(`这次选择的可逆性接近（都是 ${s.reversibility === 'low' ? '低' : s.reversibility === 'medium' ? '中' : '高'}）`)
  }
  if (out.length === 0) {
    out.push('在「阶段」这一维度上处在相近的人生位置')
  }
  return out
}

/** 为什么不能照搬：反类比，至少 2 条 */
function buildWhyDifferent(s: Situation, e: DecisionEpisode, misses: string[]): string[] {
  const out: string[] = []
  const ds = e.decision_state

  out.push(
    `时代与制度背景不同：对方在 ${e.time.year} 年、${e.time.age ?? '?'} 岁做决定，你面对的是今天的规则与机会`,
  )

  if (misses.length > 0) {
    out.push(`对方处境里还有这些你并没有提到的条件：${misses.slice(0, 3).join('、')}`)
  }
  const myOnly = s.constraints.filter((c) => !ds.constraints.includes(c))
  if (myOnly.length > 0) {
    out.push(`反过来，你有对方没有的约束：${myOnly.slice(0, 3).join('、')}`)
  }
  if (s.risk !== ds.risk) {
    out.push(
      `风险承受度不同：你是 ${s.risk}，对方是 ${ds.risk} —— 同样的选择放在你身上，代价不一样`,
    )
  }
  if (s.reversibility !== ds.reversibility) {
    out.push('这一步的可逆性也不同，撤回成本不能直接套用')
  }
  return out.slice(0, 4)
}

/** 证据分层：把 evidence 按 type 归到五层，ai_inference 单独隔离 */
function buildEvidenceLayers(e: DecisionEpisode): MatchResult['evidence_layers'] {
  const layers: MatchResult['evidence_layers'] = {
    facts: [],
    self_claims: [],
    interpretations: [],
    ai_inferences: [],
    unknowns: [...e.reflection.unknowns],
  }

  for (const ev of e.evidence) {
    switch (ev.type) {
      case 'self_writing':
        layers.self_claims.push(`${ev.claim}（${ev.source_id}）`)
        break
      case 'biography':
      case 'encyclopedia':
        layers.facts.push(`${ev.claim}（${ev.source_id}）`)
        break
      case 'interview':
        layers.self_claims.push(`${ev.claim}（${ev.source_id}）`)
        break
      case 'ai_inference':
        // ⚠️ 铁律：AI 推断绝不能混进 facts
        layers.ai_inferences.push(`${ev.claim}（${ev.source_id}）`)
        break
    }
  }

  // 结果链本身属于「后人/资料的解释」，单独归一层
  layers.interpretations.push(
    `长期结果的一种叙述：${e.outcomes.long_term}`,
  )

  return layers
}

/* ------------------------------------------------------------------
 * 五、对外主函数
 * ------------------------------------------------------------------ */

/** 本地检索：解析 → 打分 → 重排 → 多样性采样 */
function retrieveLocal(input: string, situationOverride?: Situation): RetrievalResponse {
  const started = performance.now()
  const situation = situationOverride ?? parseSituation(input)

  const scored = mockEpisodes.map((episode) => {
    const { dimensions, tagHits, tagMisses } = scoreEpisode(situation, episode)
    const match: MatchResult = {
      episode,
      dimensions,
      why_similar: buildWhySimilar(situation, episode, tagHits),
      why_different: buildWhyDifferent(situation, episode, tagMisses),
      evidence_layers: buildEvidenceLayers(episode),
    }
    return { match, score: totalScore(dimensions) }
  })

  const candidates = scored.length
  const afterFilter = scored.filter((x) => x.score > 0.2).length
  const ranked = scored.sort((a, b) => b.score - a.score).map((x) => x.match)
  const selected = selectDiverse(ranked, 3)

  return {
    situation,
    matches: selected,
    meta: {
      candidates_recalled: candidates,
      after_metadata_filter: afterFilter,
      after_rerank: ranked.length,
      elapsed_ms: Math.round(performance.now() - started),
    },
  }
}

/** 远程检索：后端就绪后启用（#14/#15） */
async function retrieveRemote(input: string): Promise<RetrievalResponse> {
  const res = await fetch(`${API_BASE}/api/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
  if (!res.ok) throw new Error(`retrieve failed: ${res.status}`)
  return (await res.json()) as RetrievalResponse
}

/**
 * 检索入口。
 * - 离线/演示：走本地结构匹配
 * - 后端就绪：USE_REMOTE = true，失败时自动降级回本地（断网兜底）
 */
export async function retrieve(
  input: string,
  situationOverride?: Situation,
): Promise<RetrievalResponse> {
  if (USE_REMOTE) {
    try {
      return await retrieveRemote(input)
    } catch {
      // 🔴 兜底：API 挂了也不能白屏
      return retrieveLocal(input, situationOverride)
    }
  }
  return retrieveLocal(input, situationOverride)
}

/** 供 What-if 场景使用：只换 Situation，其余不动 */
export async function retrieveWithSituation(situation: Situation): Promise<RetrievalResponse> {
  return retrieveLocal('', situation)
}

export { mockEpisodes }

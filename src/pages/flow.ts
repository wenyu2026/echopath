/**
 * 六页面共享的流程状态
 * ============================================================
 * 这是纯前端状态，不进 src/types（那是全队契约，由 wenyu2026 维护）。
 */
import { useCallback, useMemo, useState } from 'react'
import type { MatchResult, RetrievalResponse, Situation } from '../types/episode.ts'
import { retrieve, retrieveWithSituation } from './retrieval/retrieve.ts'

/** 六个页面 */
export type PageId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6'

export const PAGES: Array<{ id: PageId; title: string; hint: string }> = [
  { id: 'P1', title: '来时路', hint: '你从哪儿走到这里' },
  { id: 'P2', title: '当前路口', hint: 'AI 读到的处境' },
  { id: 'P3', title: '人生分叉地图', hint: '三条真实走过的路' },
  { id: 'P4', title: '案例详情', hint: '处境 → 选择 → 结果链' },
  { id: 'P5', title: '像与不像', hint: '为什么不能照搬' },
  { id: 'P6', title: '回到自己', hint: '把判断权还给你' },
]

/** P1 的快速问题 */
export interface PriorAnswers {
  stage: string
  invested: string
  tried: string
  constraints: string
  careMost: string
}

export const EMPTY_PRIOR: PriorAnswers = {
  stage: '',
  invested: '',
  tried: '',
  constraints: '',
  careMost: '',
}

export const QUICK_QUESTIONS: Array<{
  key: keyof PriorAnswers
  question: string
  options: string[]
}> = [
  {
    key: 'stage',
    question: '你现在处在哪个阶段？',
    options: ['大一/大二', '大三/大四', '毕业前后', '工作 1-3 年'],
  },
  {
    key: 'invested',
    question: '在现在的路上已经投入多久？',
    options: ['不到一年', '一到两年', '两年以上', '五年以上'],
  },
  {
    key: 'tried',
    question: '对新方向，你实际验证过多少？',
    options: ['只听说/看过', '了解过一点', '自学或试过一阵', '已经做过项目/实习'],
  },
  {
    key: 'constraints',
    question: '现实约束主要是哪一类？',
    options: ['家庭期待', '经济压力', '时间/延毕', '几乎没有硬约束'],
  },
  {
    key: 'careMost',
    question: '你真正在意的是什么？',
    options: ['兴趣与意义', '收入', '稳定与安全', '成长空间'],
  },
]

/** 把快速问答 + 自然语言拼成给解析器的输入 */
export function composeInput(prior: PriorAnswers, freeText: string): string {
  const parts = [
    prior.stage && `阶段：${prior.stage}`,
    prior.invested && `已投入：${prior.invested}`,
    prior.tried && `对新方向验证程度：${prior.tried}`,
    prior.constraints && `现实约束：${prior.constraints}`,
    prior.careMost && `最在意：${prior.careMost}`,
    freeText && `自由描述：${freeText}`,
  ].filter(Boolean)
  return parts.join('；')
}

export interface FlowState {
  page: PageId
  prior: PriorAnswers
  freeText: string
  situation: Situation | null
  result: RetrievalResponse | null
  selectedIndex: number
  loading: boolean
  error: string | null
}

export function useFlow() {
  const [state, setState] = useState<FlowState>({
    page: 'P1',
    prior: EMPTY_PRIOR,
    freeText: '',
    situation: null,
    result: null,
    selectedIndex: 0,
    loading: false,
    error: null,
  })

  const goto = useCallback((page: PageId) => {
    setState((s) => ({ ...s, page }))
  }, [])

  const setPrior = useCallback((key: keyof PriorAnswers, value: string) => {
    setState((s) => ({ ...s, prior: { ...s.prior, [key]: value } }))
  }, [])

  const setFreeText = useCallback((freeText: string) => {
    setState((s) => ({ ...s, freeText }))
  }, [])

  /** P1 → P2：解析处境 */
  const analyze = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    const input = composeInput(state.prior, state.freeText)
    try {
      const result = await retrieve(input)
      setState((s) => ({
        ...s,
        situation: result.situation,
        result,
        loading: false,
        page: 'P2',
      }))
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e) }))
    }
  }, [state.prior, state.freeText])

  /** P2 手工改一个字段 */
  const patchSituation = useCallback((patch: Partial<Situation>) => {
    setState((s) => (s.situation ? { ...s, situation: { ...s.situation, ...patch } } : s))
  }, [])

  /** P2 → P3：用（可能被改过的）Situation 重新检索 */
  const confirmSituation = useCallback(async () => {
    if (!state.situation) return
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await retrieveWithSituation(state.situation)
      setState((s) => ({
        ...s,
        result,
        situation: result.situation,
        selectedIndex: 0,
        loading: false,
        page: 'P3',
      }))
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e) }))
    }
  }, [state.situation])

  /** What-if：改条件后重新匹配，保持在同一页 */
  const whatIf = useCallback(async (patch: Partial<Situation>) => {
    if (!state.situation) return
    const next = { ...state.situation, ...patch }
    const result = await retrieveWithSituation(next)
    setState((s) => ({ ...s, situation: next, result, selectedIndex: 0 }))
  }, [state.situation])

  const selectCase = useCallback((selectedIndex: number) => {
    setState((s) => ({ ...s, selectedIndex }))
  }, [])

  const matches = useMemo<MatchResult[]>(() => state.result?.matches ?? [], [state.result])

  return {
    state,
    matches,
    goto,
    setPrior,
    setFreeText,
    analyze,
    patchSituation,
    confirmSituation,
    whatIf,
    selectCase,
  }
}

export type Flow = ReturnType<typeof useFlow>

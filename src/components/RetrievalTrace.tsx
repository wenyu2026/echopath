/**
 * 检索过程可视化
 * ============================================================
 * 方案第 13 节原话：「而不是隐藏所有过程。
 * 黑客松评委会更容易看到技术深度。」
 *
 * 展示：候选召回 → 元数据过滤 → 结构重排 → 多样性采样
 */
import type { RetrievalResponse } from '../types/episode.ts'

interface Props {
  meta: RetrievalResponse['meta']
  /** 最终选中数 */
  selected: number
}

export function RetrievalTrace({ meta, selected }: Props) {
  const steps = [
    { label: '候选召回', value: meta.candidates_recalled, note: '本地案例库全量' },
    { label: '元数据过滤', value: meta.after_metadata_filter, note: '低分直接排除' },
    { label: '结构重排', value: meta.after_rerank, note: '七维度加权' },
    { label: '多样性采样', value: selected, note: 'choice.type 去重' },
  ]

  return (
    <div className="trace">
      {steps.map((s, i) => (
        <div className="trace-step" key={s.label}>
          <div className="trace-index">{i + 1}</div>
          <div className="trace-main">
            <span className="trace-label">{s.label}</span>
            <span className="trace-note">{s.note}</span>
          </div>
          <div className="trace-value">{s.value}</div>
          {i < steps.length - 1 && <div className="trace-arrow" aria-hidden="true">→</div>}
        </div>
      ))}
      <div className="trace-elapsed">耗时 {meta.elapsed_ms} ms</div>
    </div>
  )
}

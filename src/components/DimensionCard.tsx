/**
 * 维度卡（七维度）
 * ============================================================
 * 🔴 产品硬要求：**不要**写「相似度 87%」。
 * 要展示可解释的维度条，最后一行「差异惩罚」自然引出「为什么不能照搬」。
 */
import type { MatchDimensions } from '../types/episode.ts'

interface Props {
  dimensions: MatchDimensions
  /** 差异惩罚的说明文字，例如「时代背景显著不同」 */
  differenceNote?: string
}

/** 单条维度：名称 + 十格条 + 高/中/低 */
function DimensionRow({
  label,
  value,
  warn = false,
  note,
}: {
  label: string
  value: number
  warn?: boolean
  note?: string
}) {
  const filled = Math.round(clamp01(value) * 10)
  const level = value >= 0.66 ? '高' : value >= 0.33 ? '中' : '低'

  return (
    <div className={warn ? 'dim-row dim-row-warn' : 'dim-row'}>
      <span className="dim-label">{label}</span>
      <span className="dim-bar" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <i key={i} className={i < filled ? 'dim-cell dim-cell-on' : 'dim-cell'} />
        ))}
      </span>
      <span className="dim-level">{warn ? '注意' : level}</span>
      <span className="dim-value">{Math.round(clamp01(value) * 100)}</span>
      {note && <span className="dim-note">{note}</span>}
    </div>
  )
}

export function DimensionCard({ dimensions, differenceNote }: Props) {
  return (
    <div className="dim-card">
      <DimensionRow label="阶段相似" value={dimensions.stage_match} />
      <DimensionRow label="来时路相似" value={dimensions.path_match} />
      <DimensionRow label="困境结构" value={dimensions.dilemma_match} />
      <DimensionRow label="约束条件" value={dimensions.constraint_match} />
      <DimensionRow label="目标相似" value={dimensions.goal_match} />
      <DimensionRow label="可逆性" value={dimensions.reversibility_match} />
      <DimensionRow
        label="⚠️ 差异惩罚"
        value={dimensions.difference_penalty}
        warn
        note={differenceNote}
      />
      <p className="dim-footnote">
        不输出单一「相似度」——因为「像」和「能不能照搬」是两件事。
      </p>
    </div>
  )
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

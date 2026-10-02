/**
 * P2 当前路口
 * ============================================================
 * 展示 AI 抽取的 Situation，并且**每个字段都能改** ——
 * 「用户可控」是 Demo 剧本第 3 拍要现场演示的动作。
 */
import type { Level, Situation } from '../types/episode.ts'
import type { Flow } from './flow.ts'

interface Props {
  flow: Flow
}

const LEVEL_OPTIONS: Array<{ value: Level; label: string }> = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
]

/** 可编辑的字符串数组字段 */
function ListField({
  label,
  values,
  hint,
  onChange,
}: {
  label: string
  values: string[]
  hint: string
  onChange: (next: string[]) => void
}) {
  return (
    <section className="field-block">
      <header>
        <h3>{label}</h3>
        <span className="field-hint">{hint}</span>
      </header>
      <div className="chip-row">
        {values.map((v, i) => (
          <span className="tag" key={`${v}-${i}`}>
            {v}
            <button
              type="button"
              className="tag-x"
              aria-label={`移除 ${v}`}
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </section>
  )
}

/** 可编辑的枚举字段 */
function LevelField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Level
  onChange: (v: Level) => void
}) {
  return (
    <section className="field-block field-inline">
      <h3>{label}</h3>
      <div className="choice-row">
        {LEVEL_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={value === o.value ? 'chip chip-on' : 'chip'}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export function P2Crossroad({ flow }: Props) {
  const { state, patchSituation, confirmSituation, goto } = flow
  const s: Situation | null = state.situation

  if (!s) {
    return (
      <div className="page">
        <p className="empty-state">还没有解析结果，请先回到第一步。</p>
        <button type="button" className="btn" onClick={() => goto('P1')}>
          ← 回到来时路
        </button>
      </div>
    )
  }

  return (
    <div className="page page-p2">
      <header className="page-head">
        <p className="eyebrow">第二步 · 当前路口</p>
        <h1>这是系统读到的你</h1>
        <p className="lede">
          它读的是<strong>结构</strong>，不是关键词。
          如果哪里读偏了，直接改 —— 改完的结果会立刻变。
        </p>
      </header>

      <div className="crossroad-card">
        <div className="crossroad-hero">
          <span className="hero-label">核心冲突</span>
          <p className="hero-dilemma">{s.dilemma}</p>
          <input
            className="hero-edit"
            value={s.dilemma}
            aria-label="编辑核心冲突"
            onChange={(e) => patchSituation({ dilemma: e.target.value })}
          />
        </div>

        <div className="field-block">
          <header>
            <h3>人生阶段</h3>
          </header>
          <input
            className="text-input"
            value={s.stage}
            aria-label="编辑人生阶段"
            onChange={(e) => patchSituation({ stage: e.target.value })}
          />
        </div>

        <ListField
          label="可选道路"
          hint="2–5 项"
          values={s.options}
          onChange={(options) => patchSituation({ options })}
        />
        <ListField
          label="现实约束"
          hint="2–6 项，越具体越准"
          values={s.constraints}
          onChange={(constraints) => patchSituation({ constraints })}
        />
        <ListField
          label="真正在意的目标"
          hint="2–5 项"
          values={s.goals}
          onChange={(goals) => patchSituation({ goals })}
        />

        <div className="field-pair">
          <LevelField
            label="风险承受度"
            value={s.risk}
            onChange={(risk) => patchSituation({ risk })}
          />
          <LevelField
            label="可逆性"
            value={s.reversibility}
            onChange={(reversibility) => patchSituation({ reversibility })}
          />
        </div>

        <ListField
          label="还不明确的信息"
          hint="这些会被标注为「未知」"
          values={s.unknowns}
          onChange={(unknowns) => patchSituation({ unknowns })}
        />
      </div>

      <div className="page-actions page-actions-split">
        <button type="button" className="btn" onClick={() => goto('P1')}>
          ← 改回来时路
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={state.loading}
          onClick={confirmSituation}
        >
          {state.loading ? '正在重新匹配…' : '用这个处境去找相似的路 →'}
        </button>
      </div>
    </div>
  )
}

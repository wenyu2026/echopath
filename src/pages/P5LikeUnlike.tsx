/**
 * P5 像与不像
 * ============================================================
 * 产品的核心记忆点：主动说「为什么你不能照搬」。
 * 聊天机器人永远不会做这件事。
 *
 * 同时承载 What-if 演示：改一个条件 → 匹配实时变化。
 * 这是「结构匹配，不是文本匹配」最无法反驳的证据。
 */
import { useMemo, useState } from 'react'
import { DimensionCard } from '../components/DimensionCard.tsx'
import type { Flow } from './flow.ts'
import { choiceLabel } from './retrieval/retrieve.ts'

interface Props {
  flow: Flow
}

/** 可现场切换的假设条件 */
const WHAT_IF_OPTIONS = [
  { key: 'reversibility', value: 'high', label: '假设我不怕延毕' },
  { key: 'risk', value: 'high', label: '假设我愿意冒更大风险' },
  { key: 'reversibility', value: 'low', label: '假设我完全不能延毕' },
] as const

export function P5LikeUnlike({ flow }: Props) {
  const { state, matches, goto, whatIf } = flow
  const [pending, setPending] = useState<string | null>(null)

  const m = matches[Math.min(state.selectedIndex, matches.length - 1)]

  /** 当前生效的假设（从 situation 反推，用于高亮） */
  const activeWhatIf = useMemo(() => {
    if (!state.situation) return null
    const hit = WHAT_IF_OPTIONS.find(
      (o) => state.situation?.[o.key] === o.value,
    )
    return hit ? hit.label : null
  }, [state.situation])

  if (!m || !state.situation) {
    return (
      <div className="page">
        <p className="empty-state">还没有匹配结果。</p>
        <button type="button" className="btn" onClick={() => goto('P3')}>
          ← 回到分叉地图
        </button>
      </div>
    )
  }

  async function runWhatIf(opt: (typeof WHAT_IF_OPTIONS)[number]) {
    setPending(opt.label)
    await whatIf({ [opt.key]: opt.value })
    setPending(null)
  }

  return (
    <div className="page page-p5">
      <header className="page-head">
        <p className="eyebrow">第五步 · 像与不像</p>
        <h1>这一屏，是这个产品最想让你看到的东西</h1>
        <p className="lede">
          它不会告诉你「应该怎么做」。
          它只把<strong>为什么像你</strong>和<strong>为什么你也不能照搬</strong>摊开给你看。
        </p>
      </header>

      <section className="whatif-card">
        <header>
          <h2>如果条件变一下，还像吗？</h2>
          <p className="field-hint">
            改一个条件，匹配结果会实时变化 —— 这说明它比的是<strong>结构</strong>，不是文本
          </p>
        </header>
        <div className="choice-row">
          {WHAT_IF_OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              className={activeWhatIf === o.label ? 'chip chip-on' : 'chip'}
              disabled={pending !== null}
              onClick={() => runWhatIf(o)}
            >
              {pending === o.label ? '重算中…' : o.label}
            </button>
          ))}
        </div>
        <div className="whatif-current">
          当前假设：
          <strong>{activeWhatIf ?? '未设置（用你自己的原始条件）'}</strong>
        </div>
      </section>

      <section className="compare-head">
        <h2>
          正在看：{m.episode.person.name}
          <span className="choice-badge">{choiceLabel(m.episode.choice.type)}</span>
        </h2>
        <div className="choice-row">
          {matches.map((item, i) => (
            <button
              key={item.episode.episode_id}
              type="button"
              className={i === state.selectedIndex ? 'chip chip-on' : 'chip'}
              onClick={() => flow.selectCase(i)}
            >
              {String.fromCharCode(65 + i)} · {choiceLabel(item.episode.choice.type)}
            </button>
          ))}
        </div>
      </section>

      <div className="compare-grid">
        <section className="compare-col compare-like">
          <h3>为什么像你</h3>
          <ul>
            {m.why_similar.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
        <section className="compare-col compare-unlike">
          <h3>为什么你不能照搬</h3>
          <ul>
            {m.why_different.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      </div>

      <DimensionCard dimensions={m.dimensions} differenceNote={m.why_different[0]} />

      <div className="page-actions page-actions-split">
        <button type="button" className="btn" onClick={() => goto('P4')}>
          ← 回看案例详情
        </button>
        <button type="button" className="btn btn-primary" onClick={() => goto('P6')}>
          回到我自己 →
        </button>
      </div>
    </div>
  )
}

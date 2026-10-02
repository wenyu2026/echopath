/**
 * P3 人生分叉地图
 * ============================================================
 * 🔴 最关键的一屏：不给一条路，给三条**真实有人走过的路**。
 * 不是排名 —— 按「选择方向」区分，而不是按分数排序展示。
 */
import { DimensionCard } from '../components/DimensionCard.tsx'
import { ForkMap } from '../components/ForkMap.tsx'
import { RetrievalTrace } from '../components/RetrievalTrace.tsx'
import type { Flow } from './flow.ts'
import { choiceLabel } from './retrieval/retrieve.ts'

interface Props {
  flow: Flow
}

export function P3ForkMap({ flow }: Props) {
  const { state, matches, selectCase, goto } = flow

  if (matches.length === 0) {
    return (
      <div className="page">
        <p className="empty-state">还没有匹配结果，请先完成前两步。</p>
        <button type="button" className="btn" onClick={() => goto('P1')}>
          ← 回到来时路
        </button>
      </div>
    )
  }

  const selected = matches[Math.min(state.selectedIndex, matches.length - 1)]

  return (
    <div className="page page-p3">
      <header className="page-head">
        <p className="eyebrow">第三步 · 人生分叉地图</p>
        <h1>从相似的路口出发，他们分别走成了这样</h1>
        <p className="lede">
          这里<strong>没有推荐</strong>。三条路只是三个不同的方向，
          每条都对应一个真实发生过的人生决策。
        </p>
      </header>

      <div className="map-wrap">
        <ForkMap
          matches={matches}
          selectedIndex={state.selectedIndex}
          onSelect={selectCase}
          selfLabel="你"
        />
      </div>

      <div className="lane-cards">
        {matches.map((m, i) => (
          <button
            key={m.episode.episode_id}
            type="button"
            className={i === state.selectedIndex ? 'lane-card lane-card-on' : 'lane-card'}
            onClick={() => selectCase(i)}
          >
            <span className="lane-tag">{String.fromCharCode(65 + i)}</span>
            <span className="lane-choice">{choiceLabel(m.episode.choice.type)}</span>
            <span className="lane-person">{m.episode.person.name}</span>
            <span className="lane-outcome">{m.episode.outcomes.mid_term}</span>
          </button>
        ))}
      </div>

      <section className="selected-panel">
        <div className="selected-head">
          <h2>
            {selected.episode.person.name}
            <span className="muted">
              　{selected.episode.time.year} 年 · {selected.episode.time.age ?? '?'} 岁 ·{' '}
              {selected.episode.time.stage}
            </span>
          </h2>
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              selectCase(state.selectedIndex)
              goto('P4')
            }}
          >
            打开完整案例 →
          </button>
        </div>

        <p className="selected-dilemma">{selected.episode.decision_state.dilemma}</p>

        <DimensionCard
          dimensions={selected.dimensions}
          differenceNote={selected.why_different[0]}
        />

        <div className="why-pair">
          <section className="why-card why-similar">
            <h3>为什么像你</h3>
            <ul>
              {selected.why_similar.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
          <section className="why-card why-different">
            <h3>为什么不能照搬</h3>
            <ul>
              {selected.why_different.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      {state.result && (
        <section className="trace-section">
          <h3>这次是怎么找出来的</h3>
          <RetrievalTrace meta={state.result.meta} selected={matches.length} />
        </section>
      )}

      <div className="page-actions page-actions-split">
        <button type="button" className="btn" onClick={() => goto('P2')}>
          ← 调整我的处境
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => goto('P4')}
        >
          看这条路的完整结果链 →
        </button>
      </div>
    </div>
  )
}

/**
 * P4 案例详情
 * ============================================================
 * 不是名人语录，是完整的结果链：
 * 当时背景 → 知道什么 → 有哪些选项 → 实际选了什么
 * → 1–3 年结果 → 长期结果 → 后来怎么反思 → 证据来源
 */
import { EvidenceDrawer } from '../components/EvidenceDrawer.tsx'
import type { Flow } from './flow.ts'
import { choiceLabel } from './retrieval/retrieve.ts'

interface Props {
  flow: Flow
}

export function P4CaseDetail({ flow }: Props) {
  const { state, matches, goto, selectCase } = flow
  const m = matches[Math.min(state.selectedIndex, matches.length - 1)]

  if (!m) {
    return (
      <div className="page">
        <p className="empty-state">还没有选中案例。</p>
        <button type="button" className="btn" onClick={() => goto('P3')}>
          ← 回到分叉地图
        </button>
      </div>
    )
  }

  const e = m.episode

  return (
    <div className="page page-p4">
      <header className="page-head">
        <p className="eyebrow">第四步 · 案例详情</p>
        <h1>
          {e.person.name}
          <span className="muted">
            　{e.time.year} 年 · {e.time.age ?? '?'} 岁 · {e.time.stage}
          </span>
        </h1>
        <p className="lede">
          {e.decision_state.dilemma}
          <span className="choice-badge">{choiceLabel(e.choice.type)}</span>
        </p>
      </header>

      {/* 案例切换器：不离开本页就能横向对比三条路 */}
      <nav className="case-switcher" aria-label="切换案例">
        {matches.map((item, i) => (
          <button
            key={item.episode.episode_id}
            type="button"
            className={i === state.selectedIndex ? 'chip chip-on' : 'chip'}
            onClick={() => selectCase(i)}
          >
            {String.fromCharCode(65 + i)} · {choiceLabel(item.episode.choice.type)}
          </button>
        ))}
      </nav>

      <ol className="chain">
        <li className="chain-step">
          <div className="chain-marker">1</div>
          <div className="chain-body">
            <h3>做这次选择之前，他已经经历了什么</h3>
            <ul className="bullet">
              {e.prior_path.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </li>

        <li className="chain-step">
          <div className="chain-marker">2</div>
          <div className="chain-body">
            <h3>当时他知道什么、有哪些选项</h3>
            <div className="kv-grid">
              <div>
                <span className="kv-key">可选道路</span>
                <div className="chip-row">
                  {e.decision_state.options.map((o) => (
                    <span className="tag tag-plain" key={o}>
                      {o}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="kv-key">现实约束</span>
                <div className="chip-row">
                  {e.decision_state.constraints.map((c) => (
                    <span className="tag tag-plain" key={c}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="kv-key">在意什么</span>
                <div className="chip-row">
                  {e.decision_state.goals.map((g) => (
                    <span className="tag tag-plain" key={g}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </li>

        <li className="chain-step chain-step-choice">
          <div className="chain-marker">3</div>
          <div className="chain-body">
            <h3>实际做了什么</h3>
            <ul className="bullet">
              {e.choice.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </li>

        <li className="chain-step">
          <div className="chain-marker">4</div>
          <div className="chain-body">
            <h3>结果链 —— 分短 / 中 / 长期，不是「成功 / 失败」</h3>
            <div className="outcome-ladder">
              <div className="outcome-item">
                <span className="outcome-tag">1–3 年</span>
                <p>{e.outcomes.short_term}</p>
              </div>
              <div className="outcome-item">
                <span className="outcome-tag">中期</span>
                <p>{e.outcomes.mid_term}</p>
              </div>
              <div className="outcome-item">
                <span className="outcome-tag">长期</span>
                <p>{e.outcomes.long_term}</p>
              </div>
            </div>
          </div>
        </li>

        <li className="chain-step">
          <div className="chain-marker">5</div>
          <div className="chain-body">
            <h3>后来他怎么看这件事</h3>
            {e.reflection.self_comment ? (
              <blockquote className="self-quote">{e.reflection.self_comment}</blockquote>
            ) : (
              <p className="muted">没有找到本人后来的直接表述</p>
            )}
            {e.reflection.unknowns.length > 0 && (
              <div className="unknown-box">
                <strong>仍然不确定的部分</strong>
                <ul className="bullet">
                  {e.reflection.unknowns.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </li>
      </ol>

      {/* 🔴 关键事实能点开看到来源 */}
      <EvidenceDrawer layers={m.evidence_layers} />

      <div className="page-actions page-actions-split">
        <button type="button" className="btn" onClick={() => goto('P3')}>
          ← 回到分叉地图
        </button>
        <button type="button" className="btn btn-primary" onClick={() => goto('P5')}>
          看看这条路的「像与不像」→
        </button>
      </div>
    </div>
  )
}

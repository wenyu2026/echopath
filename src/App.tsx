/**
 * EchoPath 来路 —— 应用外壳
 * ============================================================
 * 六页面 + 人生分叉地图（Issue #16）
 *
 * ⚠️ 这不是聊天界面。整个体验围绕「路口 → 分叉 → 案例 → 证据」，
 *    没有对话框，没有「AI 说」气泡。
 *
 * 样式全部放在 src/pages/pages.css（本责任区内），
 * 不改 src/main.tsx / index.css / vite.config.ts（属于 wenyu2026）。
 */
import './pages/pages.css'
import { PAGES, useFlow } from './pages/flow.ts'
import type { PageId } from './pages/flow.ts'
import { P1Arrival } from './pages/P1Arrival.tsx'
import { P2Crossroad } from './pages/P2Crossroad.tsx'
import { P3ForkMap } from './pages/P3ForkMap.tsx'
import { P4CaseDetail } from './pages/P4CaseDetail.tsx'
import { P5LikeUnlike } from './pages/P5LikeUnlike.tsx'
import { P6BackToSelf } from './pages/P6BackToSelf.tsx'

/** 每一步能否点开，取决于前面的数据是否就绪 */
function isReachable(page: PageId, hasSituation: boolean, hasMatches: boolean): boolean {
  switch (page) {
    case 'P1':
      return true
    case 'P2':
      return hasSituation
    case 'P3':
    case 'P4':
    case 'P5':
    case 'P6':
      return hasMatches
  }
}

function App() {
  const flow = useFlow()
  const { state, goto } = flow
  const hasSituation = state.situation !== null
  const hasMatches = flow.matches.length > 0

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ⌥
          </span>
          <div>
            <h1 className="brand-name">来路 EchoPath</h1>
            <p className="brand-tagline">
              不是预测你的未来，而是把别人已经走过的未来提前给你看
            </p>
          </div>
        </div>

        <nav className="step-nav" aria-label="流程步骤">
          {PAGES.map((p, i) => {
            const reachable = isReachable(p.id, hasSituation, hasMatches)
            const current = state.page === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={current ? 'step step-on' : 'step'}
                disabled={!reachable}
                aria-current={current ? 'step' : undefined}
                onClick={() => goto(p.id)}
              >
                <span className="step-index">{i + 1}</span>
                <span className="step-title">{p.title}</span>
                <span className="step-hint">{p.hint}</span>
              </button>
            )
          })}
        </nav>
      </header>

      <main className="app-main">
        {state.page === 'P1' && <P1Arrival flow={flow} />}
        {state.page === 'P2' && <P2Crossroad flow={flow} />}
        {state.page === 'P3' && <P3ForkMap flow={flow} />}
        {state.page === 'P4' && <P4CaseDetail flow={flow} />}
        {state.page === 'P5' && <P5LikeUnlike flow={flow} />}
        {state.page === 'P6' && <P6BackToSelf flow={flow} />}
      </main>

      <footer className="app-footer">
        <span>学军黑客松 2026 · 赛道一 Echo · 未来·回响</span>
        <span className="footer-note">
          本页不提供「你应该选什么」——只展示真实走过的路与它们的代价
        </span>
      </footer>
    </div>
  )
}

export default App

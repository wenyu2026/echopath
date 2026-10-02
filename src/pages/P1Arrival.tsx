/**
 * P1 来时路
 * ============================================================
 * 5 个快速问题 + 自然语言补充。收集 prior path、目标、约束。
 * ⚠️ 不做聊天框 —— 用卡片式问答，避免「又一个 AI Chat」的第一印象。
 */
import type { Flow } from './flow.ts'
import { QUICK_QUESTIONS } from './flow.ts'

interface Props {
  flow: Flow
}

export function P1Arrival({ flow }: Props) {
  const { state, setPrior, setFreeText, analyze } = flow
  const answered = QUICK_QUESTIONS.filter((q) => state.prior[q.key]).length
  const ready = answered >= 3

  return (
    <div className="page page-p1">
      <header className="page-head">
        <p className="eyebrow">第一步 · 来时路</p>
        <h1>先说说你是怎么走到这个路口的</h1>
        <p className="lede">
          不用想清楚再写。回答几个问题就行 ——
          我们要的不是你的结论，而是你的处境。
        </p>
      </header>

      <div className="progress-hint">
        已答 {answered} / {QUICK_QUESTIONS.length}
        {!ready && <span className="hint-warn">　至少回答 3 个才能继续</span>}
      </div>

      <div className="question-grid">
        {QUICK_QUESTIONS.map((q, i) => (
          <section className="question-card" key={q.key}>
            <h2>
              <span className="q-index">{i + 1}</span>
              {q.question}
            </h2>
            <div className="choice-row">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={state.prior[q.key] === opt ? 'chip chip-on' : 'chip'}
                  onClick={() => setPrior(q.key, opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="free-text-card">
        <label htmlFor="free-text">
          <strong>还有什么想补充的？</strong>
          <span className="label-hint">用自己的话说说现在的困境，越具体越好</span>
        </label>
        <textarea
          id="free-text"
          rows={4}
          value={state.freeText}
          placeholder="例：我已经学了两年，越来越觉得不适合自己，但换方向是不是太晚了？"
          onChange={(e) => setFreeText(e.target.value)}
        />
      </section>

      {state.error && <p className="error-box">出错了：{state.error}</p>}

      <div className="page-actions">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!ready || state.loading}
          onClick={analyze}
        >
          {state.loading ? '正在读取你的处境…' : '看看我的处境 →'}
        </button>
      </div>
    </div>
  )
}

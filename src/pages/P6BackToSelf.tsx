/**
 * P6 回到自己
 * ============================================================
 * 🔴 验收红线：本页**绝不出现**「你应该选择 X」。
 *
 * 它只做三件事：
 * 1. 让你排序「最不能接受的结果」
 * 2. 让你写下「愿意付的代价」
 * 3. 生成一个**可执行的下一步验证行动**（而不是结论）
 */
import { useState } from 'react'
import type { Flow } from './flow.ts'
import { choiceLabel } from './retrieval/retrieve.ts'

interface Props {
  flow: Flow
}

export function P6BackToSelf({ flow }: Props) {
  const { state, matches, goto } = flow
  const [unacceptable, setUnacceptable] = useState<string[]>([])
  const [cost, setCost] = useState('')
  const [action, setAction] = useState('')
  const [generated, setGenerated] = useState(false)

  if (matches.length === 0) {
    return (
      <div className="page">
        <p className="empty-state">还没有匹配结果。</p>
        <button type="button" className="btn" onClick={() => goto('P1')}>
          ← 重新开始
        </button>
      </div>
    )
  }

  function toggleUnacceptable(id: string) {
    setUnacceptable((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  /** 生成的是「下一步动作」，不是「答案」 */
  const suggestedAction = buildNextAction(state.situation?.constraints ?? [], cost)

  return (
    <div className="page page-p6">
      <header className="page-head">
        <p className="eyebrow">第六步 · 回到自己</p>
        <h1>现在，把判断权还给你</h1>
        <p className="lede">
          历史没有替你做选择。下面这三个问题，答案只有你自己知道。
        </p>
      </header>

      <section className="self-block">
        <h2>
          <span className="q-index">1</span>
          哪一种结果你最不能接受？
        </h2>
        <p className="field-hint">
          从刚才三条路里选。选中的通常是你在下意识回避的那个代价。
        </p>
        <div className="unacceptable-list">
          {matches.map((m) => {
            const id = m.episode.episode_id
            const on = unacceptable.includes(id)
            return (
              <button
                key={id}
                type="button"
                className={on ? 'unacceptable-item unacceptable-on' : 'unacceptable-item'}
                onClick={() => toggleUnacceptable(id)}
              >
                <span className="unacceptable-head">
                  <strong>{m.episode.person.name}</strong>
                  <span className="choice-badge">{choiceLabel(m.episode.choice.type)}</span>
                </span>
                <span className="unacceptable-outcome">{m.episode.outcomes.short_term}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="self-block">
        <h2>
          <span className="q-index">2</span>
          为了想要的，你愿意付什么代价？
        </h2>
        <textarea
          rows={3}
          value={cost}
          placeholder="例：愿意多花一年时间，但不愿意让家里再承担经济压力"
          onChange={(e) => setCost(e.target.value)}
        />
      </section>

      <section className="self-block">
        <h2>
          <span className="q-index">3</span>
          下一步，用什么方式低成本验证一下？
        </h2>
        <div className="suggest-box">
          <p className="suggest-label">系统建议的一个方向（不是结论，只是可验证的动作）</p>
          <p className="suggest-text">{suggestedAction}</p>
          <button type="button" className="btn btn-small" onClick={() => setGenerated(true)}>
            用这个方向起草
          </button>
        </div>
        <textarea
          rows={3}
          value={action}
          placeholder="把它写成你自己能执行的一步，例如：这两周先跟 2 位转过专业的人聊一次"
          onChange={(e) => setAction(e.target.value)}
        />
        {generated && action.trim() === '' && (
          <p className="hint-note">已经放到下面的输入框了，改到你自己满意为止。</p>
        )}
      </section>

      <section className="closing-card">
        <p className="closing-line">
          你已经知道：哪些路真的有人走过，它们分别付出了什么。
        </p>
        <p className="closing-sub">
          剩下的选择，是你自己的。
        </p>
      </section>

      <div className="page-actions page-actions-split">
        <button type="button" className="btn" onClick={() => goto('P5')}>
          ← 回看像与不像
        </button>
        <button type="button" className="btn" onClick={() => goto('P1')}>
          换一个处境重新开始
        </button>
      </div>
    </div>
  )
}

/** 根据用户约束给一个「验证动作」，永远不给结论 */
function buildNextAction(constraints: string[], cost: string): string {
  const wants = constraints.join(' ')
  if (wants.includes('经济') || cost.includes('经济')) {
    return '先找一个不增加经济负担的验证方式：用课余时间做一个最小项目，持续 2–3 周，看自己是否还想继续。'
  }
  if (wants.includes('延毕') || wants.includes('时间')) {
    return '先去查清这个方向在你学校的具体规则（学分认定、转专业窗口），把「可能延毕」变成一个有明确条件的判断。'
  }
  if (wants.includes('家庭')) {
    return '先和家里做一次「只讲事实不讲结论」的沟通，把他们的顾虑具体化成两三条可以验证的条件。'
  }
  return '给自己设一个两周的验证期：做一次最小尝试，记录「哪些环节让我有动力」，两周后再看结论有没有变。'
}

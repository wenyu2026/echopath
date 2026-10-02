/**
 * 证据抽屉（证据分层）
 * ============================================================
 * 🔴 铁律：ai_inference **绝不**能和史实混在一起。
 * 五层固定顺序展示，AI 推断单独一层并显著标注。
 */
import type { MatchResult } from '../types/episode.ts'

interface Props {
  layers: MatchResult['evidence_layers']
  /** 是否默认展开 */
  defaultOpen?: boolean
}

const LAYER_META = [
  { key: 'facts', title: '史实', desc: '权威传记 / 公共资料支撑', tone: 'fact' },
  { key: 'self_claims', title: '本人表述', desc: '本人自述 / 访谈，可能有自我包装', tone: 'self' },
  { key: 'interpretations', title: '后人解释', desc: '他人的叙述框架，不等于事实', tone: 'interp' },
  { key: 'ai_inferences', title: 'AI 推断', desc: '⚠️ 系统推断，不能当史实使用', tone: 'ai' },
  { key: 'unknowns', title: '未知 / 有争议', desc: '明确不确定的部分', tone: 'unknown' },
] as const

export function EvidenceDrawer({ layers, defaultOpen = false }: Props) {
  const total = LAYER_META.reduce((n, l) => n + layers[l.key].length, 0)

  return (
    <details className="evidence-drawer" open={defaultOpen}>
      <summary>
        <span className="evidence-title">证据来源</span>
        <span className="evidence-count">{total} 条 · 按可信度分层</span>
      </summary>

      <div className="evidence-body">
        {LAYER_META.map((meta) => {
          const items = layers[meta.key]
          return (
            <section key={meta.key} className={`evidence-layer evidence-${meta.tone}`}>
              <header>
                <h4>{meta.title}</h4>
                <span className="evidence-desc">{meta.desc}</span>
              </header>
              {items.length === 0 ? (
                <p className="evidence-empty">本案例暂无这一层的内容</p>
              ) : (
                <ul>
                  {items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </details>
  )
}

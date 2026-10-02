/**
 * 路径卡
 * ============================================
 * ⚠️ 从 Landscape.tsx 里抽出来的 —— 对话页也要用同一张卡。
 *   两处各写一份的话，改文案要改两遍，迟早不一致。
 *
 * 卡片的三个信息块（顺序是刻意的）：
 *   ① 这条路保护的是什么  ← 先讲"你能保住什么"，用户才有兴趣往下看
 *   ② 对你可能最重的代价  ← 再讲代价，且必须能追到用户原话
 *   ③ 来自哪几个真实案例  ← 最后才给人物（人物后置）
 */

import { useState } from 'react';
import type { PathArchetype } from '../types/landscape';

/** 走法 → 配色（沿用 styles.css 里的 path-a/b/c 体系） */
const ARCHETYPE_COLOR: Record<string, string> = {
  persist: 'var(--path-a)',
  explore_then_persist: 'var(--path-c)',
  explore_then_switch: 'var(--path-c)',
  direct_switch: 'var(--path-b)',
  dual_track: 'var(--now)',
  abandon: 'var(--warn)',
  unknown: 'var(--line-strong)',
};

export default function PathCard({ a, index }: { a: PathArchetype; index: number }) {
  const [open, setOpen] = useState(false);
  const color = ARCHETYPE_COLOR[a.id] ?? 'var(--now)';

  return (
    <div className="land-card" style={{ borderLeftColor: color }}>
      <div className="land-card-head">
        <span className="land-card-idx" style={{ background: color }}>
          {String.fromCharCode(65 + index)}
        </span>
        <h3 className="land-card-title">{a.title}</h3>
      </div>

      <p className="land-card-oneline">{a.one_line}</p>

      {a.caveat && <div className="land-caveat">⚠️ {a.caveat}</div>}

      <div className="land-block">
        <div className="land-block-label">这条路保护的是</div>
        <ul className="land-list protect">
          {a.protects.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="land-block">
        <div className="land-block-label">对你可能最重的代价</div>
        <ul className="land-list cost">
          {a.costs.map((c, i) => (
            <li key={i}>
              {i === 0 && <span className="land-cost-star">最重</span>}
              <span>{c.text}</span>
              {/* ⚠️ 用户原话必须原样引用，这是产品最核心的可信度来源 */}
              {c.basis.kind === 'user_quote' && c.basis.quote && (
                <div className="land-quote">↳ 因为你刚才说：「{c.basis.quote}」</div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button className="land-expand" onClick={() => setOpen(!open)}>
        {open ? '收起' : `看看这 ${a.supporting_cases.length} 个案例后来怎样`}
        <span className="land-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="land-cases">
          {a.supporting_cases.map((c) => (
            <div className="land-case" key={c.episode_id}>
              <div className="land-case-name">
                {c.display_name}
                <span className="land-case-year">{c.year}</span>
              </div>
              {c.outcome_hint && <div className="land-case-hint">→ {c.outcome_hint}…</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

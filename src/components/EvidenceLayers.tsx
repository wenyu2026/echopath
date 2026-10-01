/**
 * 证据分层展示
 * ============================================
 * 方案第 13 节 + 第 17 节要求：
 *   事实、解释、未知必须分层；AI 推断不许伪装成史实。
 *
 * ⚠️ v2 改进：避免与上面的时间轴重复。
 *
 *   走查时发现 P4 一屏之内同样的文字出现两遍：
 *     · outcomes.short/mid/long —— 时间轴的「结果链条」已经展示过，
 *       而 interpretations 层又原样列一次
 *     · reflection.unknowns —— 时间轴的「我们不知道的部分」已经列过，
 *       unknowns 层再列一次（实测 3/3 完全重复）
 *
 *   分层区的**真正价值不是重复正文，而是交代「哪部分有来源」**。
 *   所以这里把已经被时间轴展示过的条目压成一行统计，
 *   只把**新增信息**（带 source_id 的史实与本人表述、AI 类比）完整列出。
 */

import type { MatchResult } from '../types/episode';

const LAYER_META = [
  { key: 'facts', label: '史实', cls: 'layer-facts', dot: '#2f6d5a', hint: '有来源支持的事实' },
  { key: 'self_claims', label: '本人表述', cls: 'layer-self', dot: '#2f5d8a', hint: '当事人自己的说法' },
  { key: 'interpretations', label: '后人解释', cls: 'layer-interp', dot: '#8a6a1f', hint: '他人的解读，非当事人原意' },
  { key: 'ai_inferences', label: 'AI 类比', cls: 'layer-ai', dot: '#a8a29a', hint: '⚠️ 系统推断，不是史实' },
  { key: 'unknowns', label: '未知 / 有争议', cls: 'layer-unknown', dot: '#a8a29a', hint: '我们也不知道的部分' },
] as const;

/** 这些层的内容时间轴已经完整展示过 —— 再列一遍只是重复 */
const SHOWN_ABOVE = new Set(['interpretations', 'unknowns']);

export default function EvidenceLayers({ layers }: { layers: MatchResult['evidence_layers'] }) {
  const detailed = LAYER_META.filter(
    ({ key }) => !SHOWN_ABOVE.has(key) && (layers[key]?.length ?? 0) > 0,
  );
  const summarized = LAYER_META.filter(
    ({ key }) => SHOWN_ABOVE.has(key) && (layers[key]?.length ?? 0) > 0,
  );

  const hasAnything = detailed.length > 0 || summarized.length > 0;
  if (!hasAnything) {
    return <div className="empty">这个案例暂无可分层的内容</div>;
  }

  return (
    <>
      <p className="muted small" style={{ marginTop: -6, marginBottom: 14 }}>
        上面时间轴里的内容，哪一段是<strong>有来源的事实</strong>、哪一段是
        <strong>后人的解读</strong>、哪一段<strong>根本查不到</strong> —— 在这里分开。
      </p>

      <div className="layer-stack">
        {detailed.map(({ key, label, cls, dot, hint }) => (
          <div className={`layer ${cls}`} key={key}>
            <div className="layer-head">
              <span className="layer-dot" style={{ background: dot }} />
              <span>{label}</span>
              <span className="muted tiny" style={{ fontWeight: 400 }}>
                {hint}
              </span>
            </div>
            <ul>
              {layers[key].map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {summarized.length > 0 && (
        <div className="layer-summary">
          时间轴里另外 {summarized.reduce((n, s) => n + layers[s.key].length, 0)} 条内容属于：
          {summarized.map((s) => (
            <span key={s.key} className="layer-chip" title={s.hint}>
              <span className="layer-dot" style={{ background: s.dot }} />
              {s.label} {layers[s.key].length} 条
            </span>
          ))}
          <span className="tiny muted" style={{ display: 'block', marginTop: 6 }}>
            它们已在上面完整展示，这里不重复列 —— 只说明它们的性质。
          </span>
        </div>
      )}
    </>
  );
}

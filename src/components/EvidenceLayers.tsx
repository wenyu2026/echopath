/**
 * 证据分层展示
 * ============================================
 * 方案第 13 节 + 第 17 节要求：
 *   事实、解释、未知必须分层；AI 推断不许伪装成史实。
 */

import type { MatchResult } from '../types/episode';

const LAYER_META = [
  { key: 'facts', label: '史实', cls: 'layer-facts', dot: '#2f6d5a', hint: '有来源支持的事实' },
  { key: 'self_claims', label: '本人表述', cls: 'layer-self', dot: '#2f5d8a', hint: '当事人自己的说法' },
  { key: 'interpretations', label: '后人解释', cls: 'layer-interp', dot: '#8a6a1f', hint: '他人的解读，非当事人原意' },
  { key: 'ai_inferences', label: 'AI 类比', cls: 'layer-ai', dot: '#a8a29a', hint: '⚠️ 系统推断，不是史实' },
  { key: 'unknowns', label: '未知 / 有争议', cls: 'layer-unknown', dot: '#a8a29a', hint: '我们也不知道的部分' },
] as const;

export default function EvidenceLayers({ layers }: { layers: MatchResult['evidence_layers'] }) {
  return (
    <div className="layer-stack">
      {LAYER_META.map(({ key, label, cls, dot, hint }) => {
        const items = layers[key];
        if (!items || items.length === 0) return null;
        return (
          <div className={`layer ${cls}`} key={key}>
            <div className="layer-head">
              <span className="layer-dot" style={{ background: dot }} />
              <span>{label}</span>
              <span className="muted tiny" style={{ fontWeight: 400 }}>
                {hint}
              </span>
            </div>
            <ul>
              {items.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

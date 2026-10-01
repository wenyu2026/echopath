/**
 * 七维度匹配卡
 * ============================================
 * 方案第 8 节要求：不要输出「相似度 87%」，而是给维度卡 ——
 * 这样既更可信，也自然引出「为什么不能照搬」。
 */

import type { MatchDimensions } from '../types/episode';

const DIMENSION_META: { key: keyof MatchDimensions; label: string; isPenalty?: boolean }[] = [
  { key: 'stage_match', label: '阶段相似' },
  { key: 'path_match', label: '来时路相似' },
  { key: 'dilemma_match', label: '困境结构' },
  { key: 'constraint_match', label: '约束条件' },
  { key: 'goal_match', label: '目标相似' },
  { key: 'reversibility_match', label: '可逆性' },
  { key: 'difference_penalty', label: '⚠️ 差异惩罚', isPenalty: true },
];

function levelWord(v: number): string {
  if (v >= 0.8) return '高';
  if (v >= 0.6) return '中高';
  if (v >= 0.4) return '中';
  if (v >= 0.2) return '低';
  return '极低';
}

export default function DimensionCard({ dims }: { dims: MatchDimensions }) {
  return (
    <div className="dims">
      {DIMENSION_META.map(({ key, label, isPenalty }) => {
        const v = dims[key];
        const pct = Math.round(v * 100);
        const cls = isPenalty ? 'warn' : v >= 0.7 ? 'ok' : '';
        return (
          <div key={key}>
            <div className="dim-row">
              <span className="dim-label">{label}</span>
              <span className="dim-track">
                <span className={`dim-fill ${cls}`} style={{ width: `${pct}%` }} />
              </span>
              <span className="dim-value">{levelWord(v)}</span>
            </div>
            {isPenalty && v >= 0.6 && (
              <div className="dim-row">
                <span />
                <span className="dim-note">
                  时代 / 制度 / 资源差异较大 —— 这是「不能照搬」的主要来源
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

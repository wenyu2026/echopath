/**
 * 七维度匹配卡
 * ============================================
 * 方案第 8 节要求：不要输出「相似度 87%」，而是给维度卡 ——
 * 这样既更可信，也自然引出「为什么不能照搬」。
 *
 * ⚠️ v2 改进：差异惩罚的**方向**和其他六维相反，视觉上必须区分开。
 *
 *   前六维：分数越高越像 → 条越长 = 越好
 *   差异惩罚：分数越高越不像 → 原来也用同样的条长表达
 *
 *   结果：扫一眼卡片会读出「差异惩罚 90%，很高，很好」——
 *   完全反了。而这条恰恰是「不能照搬」的核心指标。
 *
 *   改法：差异惩罚的条改成表达「可迁移性」= 1 - 惩罚，
 *   这样**所有条都是越长越好**，方向统一；
 *   同时把标签写成「可迁移性」，并在高惩罚时给出警示语。
 */

import type { MatchDimensions } from '../types/episode';

type Row = {
  key: keyof MatchDimensions;
  label: string;
  /** 该维度的分数是否需要翻转（越高越危险的那种） */
  invert?: boolean;
  /** 翻转后的解释文案 */
  explain?: (raw: number) => string;
};

const ROWS: Row[] = [
  { key: 'stage_match', label: '阶段相似' },
  { key: 'path_match', label: '来时路相似' },
  { key: 'dilemma_match', label: '困境结构' },
  { key: 'constraint_match', label: '约束条件' },
  { key: 'goal_match', label: '目标相似' },
  { key: 'reversibility_match', label: '可逆性' },
  {
    key: 'difference_penalty',
    label: '可迁移性',
    invert: true,
    explain: (raw) =>
      raw >= 0.75
        ? '时代 / 制度 / 资源差别很大 —— 这条路的**结果**几乎不能直接套到你身上'
        : raw >= 0.45
          ? '时代 / 制度 / 资源有差别 —— 参考它的**做法**，别照搬它的**结果**'
          : '时代与制度环境接近 —— 它的结果对你更有参考价值',
  },
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
      {ROWS.map(({ key, label, invert, explain }) => {
        const raw = dims[key];
        // 翻转维度：条长表达「可迁移性」，让所有条方向一致（越长越好）
        const shown = invert ? 1 - raw : raw;
        const pct = Math.round(shown * 100);
        const cls = shown >= 0.7 ? 'ok' : shown < 0.4 ? 'warn' : '';
        return (
          <div key={key}>
            <div className="dim-row">
              <span className="dim-label">{label}</span>
              <span className="dim-track">
                <span className={`dim-fill ${cls}`} style={{ width: `${pct}%` }} />
              </span>
              <span className="dim-value">{levelWord(shown)}</span>
            </div>
            {invert && explain && (
              <div className="dim-row">
                <span />
                <span className="dim-note">{explain(raw)}</span>
              </div>
            )}
          </div>
        );
      })}

      <p className="tiny muted" style={{ marginTop: 14, marginBottom: 0 }}>
        七条都是<strong>条越长越好</strong>。最后一条是反的指标「差异惩罚」翻转过来的 ——
        它越长，说明那个人的时代与制度环境越接近你，结果越能参考。
      </p>
    </div>
  );
}

/**
 * P5 像与不像
 * ============================================
 * 产品的核心记忆点。
 * 方案验收：每个案例都有「为什么像你」和「为什么不像你」。
 *
 * ⚠️ 本页绝不出现「你应该选择 X」。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import DimensionCard from '../components/DimensionCard';
import CounterAnalogy from '../components/CounterAnalogy';
import { CHOICE_LABEL } from '../components/ForkMap';

const PATH_COLORS = ['#8a5a2f', '#2f6d5a', '#6b4a8a'];

export default function P5Compare() {
  const { result, situation, setReachable } = useApp();
  const nav = useNavigate();
  const [openIdx, setOpenIdx] = useState(0);

  if (!result) {
    return (
      <div className="empty">
        还没有检索结果。请先回到 <a href="/crossroads">当前路口</a>。
      </div>
    );
  }

  return (
    <div>
      <h1>像在哪里，不像在哪里</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 22 }}>
        这一页是整个东西最要紧的部分。
        <strong>我们不会告诉你该选哪条路</strong> —— 只把每条路和你之间的相同与不同摊开。
      </p>

      {situation && (
        <div className="notice" style={{ marginBottom: 18 }}>
          <span className="tiny muted">你的处境</span>
          <br />
          <strong>{situation.stage}</strong>　·　{situation.dilemma}
        </div>
      )}

      {/* 三条路的切换 */}
      <div className="row" style={{ marginBottom: 16 }}>
        {result.matches.map((m, i) => (
          <button
            key={m.episode.episode_id}
            className="btn btn-sm"
            style={
              openIdx === i
                ? { background: PATH_COLORS[i], color: '#fff', borderColor: PATH_COLORS[i] }
                : undefined
            }
            onClick={() => setOpenIdx(i)}
          >
            路径 {String.fromCharCode(65 + i)}　{m.episode.person.name}
            <span className="muted" style={{ color: openIdx === i ? 'rgba(255,255,255,.75)' : undefined, marginLeft: 6 }}>
              {CHOICE_LABEL[m.episode.choice.type] ?? m.episode.choice.type}
            </span>
          </button>
        ))}
      </div>

      {result.matches.map((m, i) => {
        if (i !== openIdx) return null;
        const ep = m.episode;
        return (
          <div key={ep.episode_id} className="stack">
            {/* 维度卡 */}
            <div className="card">
              <div className="card-head">
                <span className="card-sub">七个维度上的相似度</span>
                <span className="spacer" />
                <span className="tiny muted">不是「相似度 87%」这种单一分数</span>
              </div>
              <DimensionCard dims={m.dimensions} />
              <p className="tiny muted" style={{ marginTop: 16, marginBottom: 0 }}>
                「差异惩罚」越高，说明时代 / 制度 / 资源差别越大 —— 照搬的风险也越大。
              </p>
            </div>

            {/* 像与不像 */}
            <CounterAnalogy whySimilar={m.why_similar} whyDifferent={m.why_different} />

            <div className="row">
              <button className="btn btn-sm" onClick={() => nav(`/episode/${i}`)}>
                回看 {ep.person.name} 的完整经过
              </button>
            </div>
          </div>
        );
      })}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => { setReachable(5); nav('/reflect'); }}>
          这些和我有什么关系？→
        </button>
        <button className="btn btn-ghost" onClick={() => nav('/map')}>
          ← 回到分叉地图
        </button>
      </div>

      <div className="notice" style={{ marginTop: 22 }}>
        <strong>请记住这一页在做什么：</strong>
        <br />
        它不是在替你做决定，而是在帮你把「别人真实走过的路」和「你真实站着的位置」对齐。
        最后一步怎么走，仍然由你决定。
      </div>
    </div>
  );
}

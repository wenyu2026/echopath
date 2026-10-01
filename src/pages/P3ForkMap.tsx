/**
 * P3 人生分叉地图
 * ============================================
 * 核心体验：不是最像的三个案例，而是尽量覆盖不同的决策路径。
 * 方案验收：返回 3 个案例，至少覆盖 2 种不同选择方向。
 */

import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import ForkMap, { CHOICE_LABEL } from '../components/ForkMap';

const PATH_COLORS = ['#8a5a2f', '#2f6d5a', '#6b4a8a'];

export default function P3ForkMap() {
  const { result, setReachable, mode } = useApp();
  const nav = useNavigate();

  if (!result) {
    return (
      <div className="empty">
        还没有检索结果。请先回到 <a href="/crossroads">上一步</a> 完成处境填写。
      </div>
    );
  }

  const { matches, meta } = result;
  const types = new Set(matches.map((m) => m.episode.choice.type));

  function openEpisode(i: number) {
    setReachable(4);
    nav(`/episode/${i}`);
  }

  return (
    <div>
      <h1>别人从这里去了哪里</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 22 }}>
        下面是 <strong>三条真实有人走过的路</strong>。不是排名，也不是推荐 ——
        颜色只区分方向，不区分好坏。
      </p>

      {mode === 'offline' && (
        <div className="notice warn" style={{ marginBottom: 18 }}>
          <strong>⚠️ 离线演示模式</strong>
          <br />
          后端接口不可用，当前展示的是预生成快照。<strong>功能演示不受影响</strong>，
          但下面的检索统计是快照里的历史值，不是本次实时计算。
        </div>
      )}

      {/* 检索过程可视化（方案第 13 节要求：不要隐藏过程） */}
      <div className="card">
        <div className="card-head">
          <span className="card-sub">检索过程</span>
        </div>
        <div className="pipeline">
          <span className="pipe-node">全部案例库</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-node">语义召回 {meta.candidates_recalled} 条</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-node">约束筛选 {meta.after_metadata_filter} 条</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-node">结构重排 {meta.after_rerank} 条</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-node final">多样性采样 {matches.length} 条</span>
          <span className="spacer" />
          <span className="tiny muted">耗时 {(meta.elapsed_ms / 1000).toFixed(1)}s</span>
        </div>
        <p className="tiny muted" style={{ marginTop: 12, marginBottom: 0 }}>
          匹配靠的是<strong>结构相似</strong>（阶段 / 困境 / 约束 / 目标 / 可逆性），
          不是文本相似。所以三条案例覆盖了不同的选择方向：{' '}
          <strong>{[...types].map((t) => CHOICE_LABEL[t] ?? t).join(' / ')}</strong>
        </p>
      </div>

      {/* 分叉地图 */}
      <div style={{ marginTop: 18 }}>
        <ForkMap matches={matches} onSelect={openEpisode} />
      </div>

      {/* 三条路径卡 */}
      <div className="path-list">
        {matches.map((m, i) => {
          const ep = m.episode;
          return (
            <div className="path-card" key={ep.episode_id}>
              <div className="path-card-bar" style={{ background: PATH_COLORS[i] }} />
              <div className="path-card-body">
                <div className="path-label" style={{ color: PATH_COLORS[i] }}>
                  路径 {String.fromCharCode(65 + i)}
                </div>
                <div className="path-title">{CHOICE_LABEL[ep.choice.type] ?? ep.choice.type}</div>
                <div className="path-person">
                  {ep.person.name}　·　{ep.time.year} 年
                  {/* ⚠️ 数据里部分案例没有 age（#13 的 36 条并非都有），
                      不能直接渲染 undefined，否则显示「2006 年， 岁」 */}
                  {typeof ep.time.age === 'number' ? `，${ep.time.age} 岁` : ''}
                  <br />
                  <span className="tiny">{ep.time.stage}</span>
                </div>
                <div className="path-outcome">
                  <span className="tiny muted">长期结果</span>
                  <br />
                  {ep.outcomes.long_term}
                </div>
                <button className="btn btn-sm" onClick={() => openEpisode(i)}>
                  看这条路的完整经过 →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => { setReachable(5); nav('/compare'); }}>
          对比「像与不像」→
        </button>
        <button className="btn btn-ghost" onClick={() => nav('/crossroads')}>
          ← 修改我的处境
        </button>
      </div>

      <div className="notice" style={{ marginTop: 20 }}>
        <strong>留意：</strong>这三个人的时代、制度、资源都和你不同。
        所以下一步不是让你照着谁做，而是看清<strong>哪些能参考、哪些不能照搬</strong>。
      </div>
    </div>
  );
}

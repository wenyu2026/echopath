/**
 * P4 案例详情
 * ============================================
 * 不是名人语录，而是完整的结果链：
 *   当时处境 → 他知道什么 → 有哪些选项 → 实际选择 → 结果链 → 后来反思
 * 并且每个关键事实都能点开看证据来源。
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../state/AppState';
import EvidenceDrawer from '../components/EvidenceDrawer';
import EvidenceLayers from '../components/EvidenceLayers';
import { CHOICE_LABEL } from '../components/ForkMap';

const PATH_COLORS = ['#8a5a2f', '#2f6d5a', '#6b4a8a'];

export default function P4Episode() {
  const { result, setReachable } = useApp();
  const nav = useNavigate();
  const { index } = useParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!result) {
    return (
      <div className="empty">
        还没有检索结果。请先回到 <a href="/crossroads">当前路口</a>。
      </div>
    );
  }

  const i = Number(index ?? 0);
  const m = result.matches[i];
  if (!m) {
    return <div className="empty">找不到这条案例。请回到 <a href="/map">分叉地图</a>。</div>;
  }

  const ep = m.episode;
  const color = PATH_COLORS[i] ?? '#2f5d8a';

  // 真正的外部来源数 —— 不算 AI 推断（那条没有出处，只说明建模范围）
  const sourceCount = ep.evidence.filter((e) => e.type !== 'ai_inference').length;
  const aiCount = ep.evidence.length - sourceCount;

  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="tag" style={{ background: color, color: '#fff', borderColor: color }}>
          路径 {String.fromCharCode(65 + i)}
        </span>
        <span className="tag">{CHOICE_LABEL[ep.choice.type] ?? ep.choice.type}</span>
        <span className="spacer" />
        <button className="btn btn-sm btn-ghost" onClick={() => nav('/map')}>
          ← 回到地图
        </button>
      </div>

      <h1>
        {ep.person.name}
        <span className="muted" style={{ fontSize: 17, fontFamily: 'var(--sans)', marginLeft: 12 }}>
          {ep.time.year} 年
          {/* 部分案例没有 age —— 不能直接渲染 undefined */}
          {typeof ep.time.age === 'number' ? ` · ${ep.time.age} 岁` : ''}
          {ep.time.stage ? ` · ${ep.time.stage}` : ''}
        </span>
      </h1>

      {/* 结果链时间轴 */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <span className="card-sub">完整经过</span>
          <span className="spacer" />
          {/*
            ⚠️ 数字要诚实：原来写的是 ep.evidence.length，
            但那把 **AI 推断条目**也算成「证据来源」了 ——
            实测每条案例的 evidence 里都有 1 条 ai_inference，
            所以按钮会写「看证据来源（3）」而实际只有 2 条能点开。
            点进去发现少一条，比一开始就写对更伤可信度。
          */}
          <button className="btn btn-sm" onClick={() => setDrawerOpen(true)}>
            🔍 看证据来源（{sourceCount}）
          </button>
        </div>

        <div className="timeline">
          <div className="tl-item">
            <div className="tl-label">做这次选择之前</div>
            <div className="tl-body">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {ep.prior_path.map((p, k) => (
                  <li key={k}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tl-item">
            <div className="tl-label">当时面对的选择</div>
            <div className="tl-body">
              <div style={{ marginBottom: 8 }}>
                <strong>{ep.decision_state.dilemma}</strong>
              </div>
              <div className="tag-row">
                {ep.decision_state.options.map((o, k) => (
                  <span className="tag" key={k}>
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="tl-item">
            <div className="tl-label">他的现实约束</div>
            <div className="tl-body">
              <div className="tag-row">
                {ep.decision_state.constraints.map((c, k) => (
                  <span className="tag" key={k}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="tl-item hl">
            <div className="tl-label">实际做了什么</div>
            <div className="tl-body">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {ep.choice.actions.map((a, k) => (
                  <li key={k}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 结果链：短 / 中 / 长期 */}
          <div className="tl-item">
            <div className="tl-label">结果链条（短期 → 长期）</div>
            <div className="tl-body">
              <div className="notice" style={{ marginBottom: 8 }}>
                <span className="tiny muted">短期</span>
                <br />
                {ep.outcomes.short_term}
              </div>
              <div className="notice" style={{ marginBottom: 8 }}>
                <span className="tiny muted">中期</span>
                <br />
                {ep.outcomes.mid_term}
              </div>
              <div className="notice">
                <span className="tiny muted">长期</span>
                <br />
                {ep.outcomes.long_term}
              </div>
            </div>
          </div>

          {ep.reflection.self_comment && (
            <div className="tl-item">
              <div className="tl-label">他后来怎么评价</div>
              <div className="tl-body">
                <em>{ep.reflection.self_comment}</em>
              </div>
            </div>
          )}

          {ep.reflection.unknowns.length > 0 && (
            <div className="tl-item">
              <div className="tl-label">我们不知道的部分</div>
              <div className="tl-body muted">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {ep.reflection.unknowns.map((u, k) => (
                    <li key={k}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 证据分层 */}
      <div className="card">
        <div className="card-head">
          <span className="card-sub">这段记述的可信度分层</span>
        </div>
        <EvidenceLayers layers={m.evidence_layers} />
      </div>

      <div className="btn-row">
        {i > 0 && (
          <button className="btn" onClick={() => nav(`/episode/${i - 1}`)}>
            ← 上一条路
          </button>
        )}
        {i < result.matches.length - 1 && (
          <button className="btn" onClick={() => nav(`/episode/${i + 1}`)}>
            下一条路 →
          </button>
        )}
        <span className="spacer" />
        <button className="btn btn-primary" onClick={() => { setReachable(5); nav('/compare'); }}>
          对比三条路的「像与不像」→
        </button>
      </div>

      <EvidenceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`${ep.person.name} · ${ep.time.year}`}
        evidence={ep.evidence}
        sourceCount={sourceCount}
        aiCount={aiCount}
      />
    </div>
  );
}

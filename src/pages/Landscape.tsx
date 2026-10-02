/**
 * 决策地形 —— 「引擎 + 可换数据源」的演示页
 * ============================================
 * ⚠️ 这是**新增页面**，不修改现有六页（P1-P6 照常工作）。
 *
 * 这一页要证明的事只有一件：
 *   **同一套引擎，换一个数据源，立刻给出另一套结果。**
 *
 * 所以版面设计围绕「数据源开关」组织：
 *   顶部固定一条，显示当前数据源 + 隐私级别 + 规模，点击即切换。
 *
 * 视觉沿用现有设计变量（暖灰白纸感 + 墨色正文 + 深青控制色），
 * 不引入新的设计语言 —— 否则两个页面拼在一起会像两个产品。
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLandscape } from '../state/useLandscape';
import type { SituationV2 } from '../types/landscape';
import PathCard from '../components/PathCard';

/** 演示用的默认输入 —— 一个真实的转专业处境 */
const DEMO_SITUATION: SituationV2 = {
  stage: '本科三年级',
  options: ['继续读本专业', '转向新方向', '先找工作再看'],
  root_factors: ['沉没成本', '新路径验证不足', '转换成本', '长期方向匹配'],
  constraints: ['已投入两年半', '转专业有成绩门槛', '家庭希望尽快稳定'],
  goals: ['做自己认可的方向', '有可迁移的技能'],
  risk: 'high',
  reversibility: 'low',
  unknowns: ['新方向是否真的适合', '能不能承受延毕'],
};

const DEMO_QUOTE = '我不太怕晚毕业，我最怕的是再浪费几年。';

export default function Landscape() {
  const { sources, sourceId, setSourceId, data, loading, error, run } = useLandscape();
  const [started, setStarted] = useState(false);

  return (
    <div className="land-wrap">
      {/* ---------- 顶部：数据源开关（这一页的主角） ---------- */}
      <div className="land-switch">
        <div className="land-switch-row">
          <span className="land-switch-label">数据源</span>
          {sources.length === 0 && <span className="tiny muted">（后端未启动）</span>}
          {sources.map((s) => (
            <button
              key={s.id}
              className={`land-switch-btn ${s.id === sourceId ? 'on' : ''}`}
              onClick={() => setSourceId(s.id)}
              disabled={loading}
            >
              {s.label}
            </button>
          ))}
        </div>
        {data && (
          <div className="land-source-meta">
            <span className="land-tag">{data.data_source.episode_count} 条案例</span>
            <span className="land-tag">{data.data_source.person_count} 位人物</span>
            <span className="land-tag privacy">{data.data_source.privacy_level}</span>
            <span className="land-source-desc">{data.data_source.description}</span>
          </div>
        )}
      </div>

      {/* ---------- 未开始 ---------- */}
      {!started && (
        <div className="land-intro">
          <h1>同一个引擎，装载不同的人群数据</h1>
          <p className="land-intro-lead">
            历史人物只是我们拿不到的「真实人群数据」的<strong>替代品</strong>。
            下面这段输入可以装在<strong>任何</strong>人群数据上 —— 学校装校友数据、
            公司装员工数据，引擎本身不变。
          </p>

          <div className="land-input-preview">
            <div className="land-input-label">演示输入</div>
            <pre className="land-input-text">{`阶段：${DEMO_SITUATION.stage}
岔路：${DEMO_SITUATION.options.join(' / ')}
根因素：${DEMO_SITUATION.root_factors.join(' · ')}
约束：${DEMO_SITUATION.constraints.join(' · ')}`}</pre>
            <div className="land-input-label" style={{ marginTop: 14 }}>
              他在访谈里说过
            </div>
            <pre className="land-input-text quote">「{DEMO_QUOTE}」</pre>
          </div>

          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={() => {
                setStarted(true);
                void run(DEMO_SITUATION, DEMO_QUOTE);
              }}
            >
              生成决策地形 →
            </button>
          </div>

          <p className="land-foot-note">
            <Link to="/">← 回到原来的六页流程</Link>
          </p>
        </div>
      )}

      {/* ---------- 加载 / 错误 ---------- */}
      {started && loading && !data && (
        <div className="land-loading">
          <div className="land-spinner" />
          正在从当前数据源里找与你来时路相近的人…
        </div>
      )}

      {error && (
        <div className="notice warn" style={{ marginTop: 20 }}>
          <strong>⚠️ 生成失败</strong>
          <br />
          {error}
        </div>
      )}

      {/* ---------- 结果 ---------- */}
      {started && data && (
        <>
          {/* 第二屏：AI 对你的理解 */}
          <div className="card land-profile">
            <div className="card-head">
              <span className="card-sub">AI 对你的理解</span>
              <span className="spacer" />
              <span className="tiny muted">每一条都能改 —— 你的处境由你定义</span>
            </div>

            <div className="land-roots">
              {data.profile.root_factors.map((r) => (
                <span className="land-root-chip" key={r}>
                  {r}
                </span>
              ))}
            </div>

            <p className="land-reading">{data.profile.mechanism_reading}</p>
          </div>

          {/* 第三屏：决策地形 */}
          <div className="land-paths-head">
            <h2>
              在与你来时路相近的人中，我们看到了 {data.archetypes.length} 种不同走法
            </h2>
            <p className="tiny muted">
              不是排名，也不是推荐。顺序按支撑案例的多少排。
              {data.single_path_only && ' 候选里只找到一种明确走法，没有凑数。'}
            </p>
          </div>

          <div className="land-paths">
            {data.archetypes.map((a, i) => (
              <PathCard a={a} index={i} key={a.id + i} />
            ))}
          </div>

          {/* meta */}
          <div className="land-meta">
            <span>召回人物 {data.meta.persons_recalled}</span>
            <span>命中案例 {data.meta.episodes_matched}</span>
            <span>聚出路径 {data.meta.archetypes_found}</span>
            <span>
              聚类：{data.meta.clustering?.method}（阈值 {data.meta.clustering?.threshold}）
            </span>
            <span>耗时 {data.meta.elapsed_ms}ms</span>
          </div>

          <div className="btn-row" style={{ marginTop: 24 }}>
            <button className="btn" onClick={() => void run(DEMO_SITUATION, DEMO_QUOTE)} disabled={loading}>
              {loading ? '重新生成中…' : '重新生成'}
            </button>
            <button className="btn btn-ghost" onClick={() => setStarted(false)}>
              回到说明
            </button>
          </div>
        </>
      )}
    </div>
  );
}

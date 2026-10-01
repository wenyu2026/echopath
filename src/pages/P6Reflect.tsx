/**
 * P6 回到自己
 * ============================================
 * 把洞察转化为自我决策，而不是 AI 决策。
 * 方案要求：不问「哪个人最成功」，而问
 *   「哪个结果你最不能接受」「你愿意付什么代价」「什么条件一变，选择就会变化」
 *
 * ⚠️ 本页绝不出现「你应该选择 X」。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { CHOICE_LABEL } from '../components/ForkMap';

type Answer = { unacceptable: string; condition: string; action: string };

export default function P6Reflect() {
  const { result, reset } = useApp();
  const nav = useNavigate();
  const [a, setA] = useState<Answer>({ unacceptable: '', condition: '', action: '' });
  const [done, setDone] = useState(false);

  if (!result) {
    return (
      <div className="empty">
        还没有检索结果。请先回到 <a href="/crossroads">当前路口</a>。
      </div>
    );
  }

  const { matches, situation } = result;

  /* ---------- 完成后的收尾页 ---------- */
  if (done) {
    return (
      <div className="narrow" style={{ margin: '0 auto' }}>
        <h1>你已经知道了这些</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          系统没有替你做任何决定。它只做了两件事：找到走过相似路口的人，以及告诉你哪里不能照搬。
        </p>

        <div className="card" style={{ marginTop: 22 }}>
          <div className="card-head">
            <span className="card-sub">你刚才的判断</span>
          </div>

          {a.unacceptable && (
            <div className="situation-row">
              <span className="situation-key">最不能接受</span>
              <span className="situation-val">{a.unacceptable}</span>
            </div>
          )}
          {a.condition && (
            <div className="situation-row">
              <span className="situation-key">如果条件变了</span>
              <span className="situation-val">{a.condition}</span>
            </div>
          )}
          {a.action && (
            <div className="situation-row">
              <span className="situation-key">下一步行动</span>
              <span className="situation-val">{a.action}</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span className="card-sub">这次出现过的人</span>
          </div>
          {matches.map((m, i) => (
            <div className="situation-row" key={m.episode.episode_id}>
              <span className="situation-key">路径 {String.fromCharCode(65 + i)}</span>
              <span className="situation-val">
                {m.episode.person.name}　
                <span className="muted small">
                  {CHOICE_LABEL[m.episode.choice.type] ?? m.episode.choice.type}　·　
                  {m.episode.outcomes.long_term}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="closing" style={{ borderTop: 'none', marginTop: 8 }}>
          <p>
            历史没有替你做选择，
            <br />
            但现在你已经知道：
            <br />
            哪些路真的有人走过，它们分别付出了什么。
          </p>
        </div>

        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button
            className="btn"
            onClick={() => {
              reset();
              nav('/');
            }}
          >
            换个处境重新开始
          </button>
          <button className="btn btn-ghost" onClick={() => nav('/compare')}>
            ← 再看一遍「像与不像」
          </button>
        </div>
      </div>
    );
  }

  /* ---------- 反思页 ---------- */
  return (
    <div className="narrow" style={{ margin: '0 auto' }}>
      <h1>最后，回到你自己</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 26 }}>
        前面看的是别人。这一页只有你。
      </p>

      {situation && (
        <div className="notice" style={{ marginBottom: 22 }}>
          你站在：<strong>{situation.dilemma}</strong>
        </div>
      )}

      {/* 问题 1 */}
      <div className="card">
        <div className="prompt-block" style={{ margin: '0 0 14px' }}>
          <p>哪一种结果你最不能接受？</p>
          <span className="tiny muted">不是「哪个最好」，而是「哪个你受不了」。</span>
        </div>

        <div className="option-grid">
          {matches.map((m, i) => {
            const txt = `${String.fromCharCode(65 + i)}：${CHOICE_LABEL[m.episode.choice.type] ?? ''} → ${m.episode.outcomes.long_term}`;
            return (
              <button
                key={m.episode.episode_id}
                className={`option-chip${a.unacceptable === txt ? ' selected' : ''}`}
                onClick={() => setA({ ...a, unacceptable: txt })}
              >
                <strong>路径 {String.fromCharCode(65 + i)}</strong>
                <br />
                <span className="small muted">{m.episode.outcomes.long_term}</span>
              </button>
            );
          })}
          <button
            className={`option-chip${a.unacceptable === '都不是，我担心的是别的' ? ' selected' : ''}`}
            onClick={() => setA({ ...a, unacceptable: '都不是，我担心的是别的' })}
          >
            都不是
          </button>
        </div>
      </div>

      {/* 问题 2 */}
      <div className="card">
        <div className="prompt-block" style={{ margin: '0 0 14px' }}>
          <p>什么条件一变，你的选择就会变？</p>
          <span className="tiny muted">
            比如「如果新方向已经验证过半年」「如果我不用负担家里」。
          </span>
        </div>
        <textarea
          value={a.condition}
          onChange={(e) => setA({ ...a, condition: e.target.value })}
          placeholder="如果……那么我会……"
          rows={3}
        />
      </div>

      {/* 问题 3 */}
      <div className="card">
        <div className="prompt-block" style={{ margin: '0 0 14px' }}>
          <p>那么，下一步你打算做什么？</p>
          <span className="tiny muted">
            方案里提到最多的那类行动：<strong>低成本验证</strong> —— 花最小代价先试一次。
          </span>
        </div>
        <textarea
          value={a.action}
          onChange={(e) => setA({ ...a, action: e.target.value })}
          placeholder="比如：这学期去做一个该方向的真实小项目，再决定要不要转"
          rows={3}
        />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => setDone(true)}>
          完成
        </button>
        <button className="btn btn-ghost" onClick={() => nav('/compare')}>
          ← 回到「像与不像」
        </button>
      </div>
    </div>
  );
}

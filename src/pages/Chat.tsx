/**
 * 对话式访谈页
 * ============================================
 * 形态：**左侧对话框 + 右侧「你的处境」面板**
 *
 * 为什么是对话而不是表单：
 *   用户说「我大三学材料，觉得不适合自己」——
 *   **这句话的信息量几乎为零**。真正决定匹配结果的是
 *   他怕什么、在意什么、试过什么。而这些**只能问出来**。
 *
 * 为什么右侧要有个面板：
 *   AI 边聊边抽结构。用户能看到「它到底理解成了什么」，
 *   而且**能改** —— 这是产品「不替你做决定」的一条具体落地。
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatInterview } from '../state/useChatInterview';
import { FIELDS } from '../types/interview';
import PathCard from '../components/PathCard';

/** 字段 → 中文标签（右侧面板显示用） */
const LABELS: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.key, f.label]));

export default function Chat() {
  const chat = useChatInterview();
  const [draft, setDraft] = useState('');
  const [sourceId, setSourceId] = useState('historical');
  const [sources, setSources] = useState<Array<{ id: string; label: string }>>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/sources')
      .then((r) => (r.ok ? r.json() : { sources: [] }))
      .then((j: { sources?: Array<{ id: string; label: string }> }) => setSources(j.sources ?? []))
      .catch(() => setSources([]));
  }, []);

  // 新消息自动滚到底
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.messages, chat.phase.kind]);

  const busy = chat.phase.kind === 'asking' || chat.phase.kind === 'confirming' || chat.phase.kind === 'searching';

  function submit() {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    void chat.answer(t);
  }

  const collected = chat.state?.collected ?? {};
  const confidence = chat.state?.confidence ?? {};

  return (
    <div className="chat-wrap">
      {/* ================= 左：对话 ================= */}
      <div className="chat-main">
        <div className="chat-head">
          <h1>先说说你的情况</h1>
          <p className="tiny muted">
            不用想清楚再来。你写得越具体，后面找到的人越接近真实的你。
            <Link to="/landscape">（或看数据源演示 →）</Link>
          </p>
        </div>

        <div className="chat-list" ref={listRef}>
          {chat.messages.map((m) => (
            <div className={`chat-row ${m.role}`} key={m.id}>
              <div className="chat-bubble">
                {m.text}

                {/* 抽到了什么 —— 让用户看到 AI 到底理解成了什么 */}
                {m.role === 'user' && m.extracted && m.extracted.length > 0 && (
                  <div className="chat-extracted">
                    {m.extracted.map((u, i) => (
                      <div className="chat-extract-item" key={i}>
                        <span className="chat-extract-field">{LABELS[u.field] ?? u.field}</span>
                        <span className="chat-extract-value">{u.value}</span>
                        <span className={`chat-extract-conf ${u.confidence >= 0.85 ? 'hi' : u.confidence >= 0.6 ? 'mid' : 'lo'}`}>
                          {u.confidence >= 0.85 ? '明确' : u.confidence >= 0.6 ? '较明确' : '存疑'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {m.role === 'user' && m.quote && (
                  <div className="chat-quote">★ 记下了你这句：「{m.quote}」</div>
                )}
              </div>
            </div>
          ))}

          {chat.phase.kind === 'asking' && (
            <div className="chat-row ai">
              <div className="chat-bubble typing">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          {chat.phase.kind === 'error' && (
            <div className="notice warn" style={{ marginTop: 12 }}>
              <strong>⚠️ 出错了</strong>
              <br />
              {chat.phase.error}
              <div className="btn-row" style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => chat.start()}>
                  重新开始
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 输入区 */}
        {chat.phase.kind !== 'done' && (
          <div className="chat-input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={draft}
              placeholder="像跟朋友说话一样写就行…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={busy}
              rows={2}
            />
            <button className="btn btn-primary chat-send" onClick={submit} disabled={busy || !draft.trim()}>
              说
            </button>
          </div>
        )}

        <div className="chat-foot">
          <span className="tiny muted">
            第 {chat.progress.asked} / {chat.progress.max} 轮
          </span>
          {chat.phase.kind !== 'done' && chat.progress.asked >= 2 && (
            <button className="btn btn-sm btn-ghost" onClick={() => void chat.finishNow()} disabled={busy}>
              够了，直接看结果
            </button>
          )}
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={chat.reset} disabled={busy}>
            重来
          </button>
        </div>
      </div>

      {/* ================= 右：你的处境 ================= */}
      <aside className="chat-side">
        <div className="chat-side-head">
          <span>你的处境</span>
          <span className="tiny muted">{Object.keys(collected).length} 项</span>
        </div>

        {Object.keys(collected).length === 0 && (
          <p className="tiny muted chat-side-empty">
            还没有收集到信息。
            <br />
            聊两句，这里会长出来。
          </p>
        )}

        {Object.entries(collected).map(([k, v]) => {
          const c = confidence[k] ?? 0;
          return (
            <div className="chat-side-item" key={k}>
              <div className="chat-side-label">
                {LABELS[k] ?? k}
                <span className={`chat-side-dot ${c >= 0.85 ? 'hi' : c >= 0.6 ? 'mid' : 'lo'}`} />
              </div>
              <div className="chat-side-value">{v}</div>
            </div>
          );
        })}

        {/* 确认后：去检索 */}
        {chat.phase.kind === 'confirming' && (
          <div className="chat-side-action">
            <div className="tiny muted" style={{ marginBottom: 8 }}>
              我理解得对吗？确认后就去数据库找相似的人。
            </div>
            <select
              className="chat-source-select"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              {sources.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="btn-row" style={{ marginTop: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => void chat.search(sourceId)}>
                对，去找人 →
              </button>
              <button className="btn btn-sm btn-ghost" onClick={chat.reset}>
                不对，重来
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ================= 结果：在对话里讲，可展开看细节 ================= */}
      {chat.landscape && chat.phase.kind === 'done' && (
        <div className="chat-result">
          <div className="chat-result-head">
            <h2>
              我在 {chat.landscape.data_source.label}里找到 {chat.landscape.archetypes.length} 种走法
            </h2>
            <p className="tiny muted">
              {chat.landscape.data_source.episode_count} 条案例 ·{' '}
              {chat.landscape.data_source.person_count} 位人物 · 隐私级别{' '}
              {chat.landscape.data_source.privacy_level}
              <br />
              {chat.landscape.data_source.description}
            </p>
          </div>

          <div className="land-roots" style={{ marginBottom: 18 }}>
            {chat.landscape.profile.root_factors.map((r) => (
              <span className="land-root-chip" key={r}>
                {r}
              </span>
            ))}
          </div>

          <div className="land-paths">
            {chat.landscape.archetypes.map((a, i) => (
              <PathCard a={a} index={i} key={a.id + i} />
            ))}
          </div>

          <div className="land-meta">
            <span>召回人物 {chat.landscape.meta.persons_recalled}</span>
            <span>命中案例 {chat.landscape.meta.episodes_matched}</span>
            <span>耗时 {chat.landscape.meta.elapsed_ms}ms</span>
          </div>

          <div className="btn-row" style={{ marginTop: 22 }}>
            <button className="btn" onClick={chat.reset}>
              换个处境再聊一次
            </button>
            <Link className="btn btn-ghost" to="/landscape">
              看数据源演示
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

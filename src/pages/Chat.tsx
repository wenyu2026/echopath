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
import { useChatInterview } from '../state/useChatInterview';
import { FIELDS } from '../types/interview';
import PathCard from '../components/PathCard';
import CaseDrawer from '../components/CaseDrawer';

/** 字段 → 中文标签（右侧面板显示用） */
const LABELS: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.key, f.label]));

export default function Chat() {
  const chat = useChatInterview();
  const [draft, setDraft] = useState('');
  const [sourceId, setSourceId] = useState('historical');
  /** 「改这句」正在编辑哪条消息 */
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  /** 总结阶段「哪里不对」的输入 */
  const [fixDraft, setFixDraft] = useState('');
  const [openCase, setOpenCase] = useState<string | null>(null);
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

  /**
   * 路径分两档：有厚度的（≥2 案例）和只有 1 个案例的。
   * 后者收进折叠区 —— 卡片自己都写着「参考价值有限」，
   * 就不该和结实的那几条占同样的位置。
   */
  const allPaths = chat.landscape?.archetypes ?? [];
  const mainPaths = allPaths.filter((a) => a.supporting_cases.length >= 2);
  const thinPaths = allPaths.filter((a) => a.supporting_cases.length < 2);

  return (
    <div className="chat-wrap">
      {/* ================= 左：对话 ================= */}
      <div className="chat-main">
        <div className="chat-head">
          <h1>先说说你的情况</h1>
          <p className="tiny muted">
            不用想清楚再来。你写得越具体，后面找到的人越接近真实的你。
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

                {/*
                  ⚠️ 「改这句」—— 实测反馈：答错了只能重开，聊了 10 轮全废。
                  回滚到这句话之前，用新内容重走。
                */}
                {m.role === 'user' && !busy && (
                  <button
                    className="chat-edit"
                    onClick={() => setEditing({ id: m.id, text: m.text })}
                    title="这句话说错了？改一下，从这句重新来"
                  >
                    ✏️ 改这句
                  </button>
                )}

                {/* 就地编辑框 */}
                {editing?.id === m.id && (
                  <div className="chat-edit-box">
                    <textarea
                      className="chat-edit-input"
                      value={editing.text}
                      onChange={(e) => setEditing({ id: m.id, text: e.target.value })}
                      rows={3}
                      autoFocus
                    />
                    <div className="chat-edit-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          const t = editing.text.trim();
                          setEditing(null);
                          if (t) void chat.rewindTo(m.id, t);
                        }}
                      >
                        从这句重来
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>
                        算了
                      </button>
                      <span className="tiny muted">这一句之后的追问都会重新问一遍</span>
                    </div>
                  </div>
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
            已聊 {chat.progress.asked} 轮 · 摸清 {chat.progress.fields} 项
          </span>
          {chat.phase.kind !== 'done' && chat.progress.asked >= 2 && (
            <button className="btn btn-sm btn-ghost" onClick={() => void chat.finishNow()} disabled={busy}>
              够了，直接看结果
            </button>
          )}
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(null); setFixDraft(''); chat.reset(); }} disabled={busy}>
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
            </div>

            {/*
              ⚠️ 实测反馈：「你问我理解的对吗，我完全没有回答的余地呀」。
              原来只有「对」和「全推翻重来」两个出口 ——
              想说「大体对，但第三点理解错了」无路可走。
              所以加这个输入框：不用精确描述，想到哪说到哪。
            */}
            <div className="chat-fix">
              <div className="tiny muted" style={{ marginBottom: 6 }}>
                哪里不对？直接说，我改完再找人
              </div>
              <textarea
                className="chat-fix-input"
                value={fixDraft}
                placeholder="比如：我不是想换行业，是想换岗位"
                onChange={(e) => setFixDraft(e.target.value)}
                rows={2}
              />
              <div className="chat-fix-actions">
                <button
                  className="btn btn-sm"
                  disabled={!fixDraft.trim() || busy}
                  onClick={() => {
                    const t = fixDraft.trim();
                    if (!t) return;
                    setFixDraft('');
                    void chat.correctSummary(t);
                  }}
                >
                  改一下，继续聊
                </button>
                <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(null); setFixDraft(''); chat.reset(); }}>
                  全部重来
                </button>
              </div>
            </div>
          </div>
        )}

        {/*
          ⚠️ 没有迷茫 —— 这里**不给「去找人」按钮**。
          硬凑几条「别人的人生抉择」等于在暗示「你该重新考虑」，
          而产品的主张恰恰是「不替你判断该不该变」。
        */}
        {chat.noDilemma && (
          <div className="chat-nodilemma">
            <div className="chat-nodilemma-title">你现在的状态不需要参考别人</div>
            <p className="chat-nodilemma-body">
              听起来你不是「在选什么」，而是「在确认」。
              这时候看别人怎么选，反而会干扰你自己已经想清楚的东西。
            </p>
            <p className="chat-nodilemma-body">
              如果<strong>真遇到岔路</strong>，再回来聊一次 —— 那时候我们才该去找人。
            </p>
            <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(null); setFixDraft(''); chat.reset(); }}>
              换个处境再聊
            </button>
          </div>
        )}
      </aside>

      {/* ================= 结果：在对话里讲，可展开看细节 ================= */}
      {chat.landscape && chat.phase.kind === 'done' && (
        <div className="chat-result">
          <div className="chat-result-head">
            {/*
              ⚠️ 标题跟着**实际条数**走，并且说人话。
              实测反馈：
                · 「四种解法为什么这么固定呀，无论我说什么你都是四种」
                  → 已改成按实际聚出的路径数（见 landscape-v2.ts）
                · 「四种解法」这个说法也要改 —— 用户不是在要「解法」，
                  是在看「别人走过哪几条路」
            */}
            <h2>
              {mainPaths.length === 0
                ? '这些案例里没有一条路有多人走过'
                : mainPaths.length === 1
                  ? '在这些案例里，只看到一种明确的走法'
                  : `在这些案例里，我看到 ${mainPaths.length} 种不同的走法`}
            </h2>
            <p className="chat-result-sub">
              不是给你的建议，只是别人真实走过的路。点开可以看他们后来怎么样。
            </p>

            {/* ⚠️ 数据来源与规模 —— 收进 ⓘ，默认不占主视觉 */}
            <details className="chat-source-info">
              <summary>
                <span className="chat-info-icon">ⓘ</span>
                这些案例从哪来
              </summary>
              <div className="chat-source-info-body">
                <div>
                  共 {chat.landscape.data_source.episode_count} 条案例 ·{' '}
                  {chat.landscape.data_source.person_count} 位人物 · 数据来源：
                  {chat.landscape.data_source.label}
                </div>
                <div style={{ marginTop: 6 }}>{chat.landscape.data_source.description}</div>
                <div style={{ marginTop: 6 }}>
                  隐私级别：{chat.landscape.data_source.privacy_level}
                </div>
              </div>
            </details>
          </div>

          <div className="land-roots" style={{ marginBottom: 18 }}>
            {chat.landscape.profile.root_factors.map((r) => (
              <span className="land-root-chip" key={r}>
                {r}
              </span>
            ))}
          </div>

          {/*
            ⚠️ 分两档渲染（产品负责人选的方案）：
              · **有厚度的**（≥2 个案例支撑）→ 主卡
              · **只有 1 个案例的** → 折叠起来

            理由：既然卡片上自己都写着「这条路径目前只有 1 个案例支撑，
            参考价值有限」，那它就不该和结实的那几条占同样的位置。
            收进折叠区 —— 想看能看，但不会让用户误以为它们分量相当。
          */}
          <div className="land-paths">
            {chat.landscape.archetypes
              .filter((a) => a.supporting_cases.length >= 2)
              .map((a, i) => (
                <PathCard a={a} index={i} key={a.id + i} onOpenCase={(id) => setOpenCase(id)} />
              ))}
          </div>

          {thinPaths.length > 0 && (
            <details className="chat-thin">
              <summary>
                另有 {thinPaths.length} 种走法，各只有 1 个案例支撑 ——
                参考价值有限，要看可以展开
              </summary>
              <div className="land-paths" style={{ marginTop: 12 }}>
                {thinPaths.map((a, i) => (
                  <PathCard
                    a={a}
                    index={mainPaths.length + i}
                    key={a.id + i}
                    onOpenCase={(id) => setOpenCase(id)}
                  />
                ))}
              </div>
            </details>
          )}

          <div className="land-meta">
            <span>召回人物 {chat.landscape.meta.persons_recalled}</span>
            <span>命中案例 {chat.landscape.meta.episodes_matched}</span>
            <span>耗时 {chat.landscape.meta.elapsed_ms}ms</span>
          </div>

          <div className="btn-row" style={{ marginTop: 22 }}>
            <button className="btn" onClick={() => { setEditing(null); setFixDraft(''); chat.reset(); }}>
              换个处境再聊一次
            </button>
          </div>
        </div>
      )}

      {/* 案例详情抽屉 */}
      {openCase && chat.landscape && (
        <CaseDrawer
          episodeId={openCase}
          sourceId={sourceId}
          situation={{
            stage: chat.landscape.profile.stage,
            options: chat.state?.collected.dilemma ? [chat.state.collected.dilemma] : ['未说明'],
            constraints: chat.landscape.profile.constraints,
            goals: chat.landscape.profile.goals,
            risk: 'medium',
            reversibility: 'medium',
          }}
          onClose={() => setOpenCase(null)}
        />
      )}
    </div>
  );
}

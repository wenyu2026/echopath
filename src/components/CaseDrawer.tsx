/**
 * 案例详情抽屉
 * ============================================
 * 点开某个案例后，从这个人的轨迹往下看。
 *
 * 五个区块（顺序是刻意的，不是排版偏好）：
 *   ① 他是怎么走到这个路口的
 *   ② ⚠️ 当时已经知道什么   ← 与 ④ 严格分开
 *   ③ 实际做了什么
 *   ④ ⚠️ 后来发生了什么     ← 与 ② 严格分开
 *   ⑤ 为什么不能照搬
 *
 * ⚠️ ② 和 ④ 分开是本产品最硬的一条设计约束。
 *   合起来写就会变成「因为他选了 A，所以后来成功了」——
 *   那是成功学，不是决策参考。
 *   他自己的数据里把这叫 Temporal Information Boundary。
 */

import { useEffect, useState } from 'react';

interface EvidenceMeta {
  source_id: string;
  title?: string;
  publisher?: string;
  locator?: string;
  limitations?: string;
  accessed_on?: string;
}

interface EvidenceItem {
  source_id: string;
  type: string;
  claim: string;
  quote?: string;
  url?: string;
  meta?: EvidenceMeta | null;
}

interface WhyDifferentItem {
  text: string;
  kind: 'structure' | 'evidence' | 'era' | 'unknown';
  basis?: string;
  refs?: string[];
}

interface CaseData {
  data_source: { label: string; episode_count: number };
  episode: {
    episode_id: string;
    person: { name: string; tags: string[] };
    time: { year: number; stage: string };
    prior_path: string[];
    decision_state: {
      dilemma: string;
      options: string[];
      constraints: string[];
      goals: string[];
      risk: string;
      reversibility: string;
    };
    choice: { type: string; actions: string[] };
    outcomes: { short_term: string; mid_term: string; long_term: string };
    reflection: { self_comment?: string; unknowns: string[] };
  };
  temporal_boundary: {
    known_at_time: string[];
    decided: string[];
    happened_after: string[];
    note: string;
  };
  evidence_layers: Record<string, string[]>;
  evidence_detail: EvidenceItem[];
  why_different: WhyDifferentItem[];
}

const LAYER_LABEL: Record<string, string> = {
  facts: '事实',
  self_claims: '本人回忆',
  interpretations: '后人解释',
  ai_inferences: 'AI 建模',
  unknowns: '未知 / 无法证明',
};

const LAYER_CLASS: Record<string, string> = {
  facts: 'layer-fact',
  self_claims: 'layer-self',
  interpretations: 'layer-interp',
  ai_inferences: 'layer-ai',
  unknowns: 'layer-unknown',
};

const KIND_LABEL: Record<string, string> = {
  structure: '结构差异',
  evidence: '证据差异',
  era: '⚠️ AI 类比 · 时代制度',
  unknown: '未知',
};

const EVIDENCE_TYPE: Record<string, string> = {
  biography: '传记 / 研究',
  self_writing: '本人作品',
  interview: '访谈 / 演讲',
  letter: '书信',
  archive: '档案',
  ai_inference: 'AI 建模',
  self_report: '本人陈述',
  institution_record: '学校记录',
  academic_record: '教务记录',
};

export default function CaseDrawer({
  episodeId,
  sourceId,
  situation,
  onClose,
}: {
  episodeId: string;
  sourceId: string;
  /** 用户的处境 —— 反类比要用它来对比 */
  situation: { stage: string; options: string[]; constraints: string[]; goals: string[]; risk: string; reversibility: string };
  onClose: () => void;
}) {
  const [data, setData] = useState<CaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    fetch('/api/case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode_id: episodeId, source_id: sourceId, ...situation }),
    })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error?.message ?? `HTTP ${r.status}`);
        return j as CaseData;
      })
      .then((j) => {
        if (!cancelled) setData(j);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });

    return () => {
      cancelled = true;
    };
    // situation 是对象，用 JSON 串做依赖避免每次渲染都重拉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId, sourceId, JSON.stringify(situation)]);

  // Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <aside className="drawer drawer-wide" role="dialog" aria-label="案例详情">
        <div className="drawer-head">
          <h3>{data ? data.episode.person.name : '加载中…'}</h3>
          {data && (
            <span className="muted small">
              {data.episode.time.year} 年 · {data.episode.time.stage}
            </span>
          )}
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          {error && (
            <div className="notice warn">
              <strong>⚠️ 打不开这个案例</strong>
              <br />
              {error}
            </div>
          )}

          {!data && !error && <div className="empty">正在读他的经历…</div>}

          {data && (
            <>
              {/* ① 他是怎么走到这个路口的 */}
              <section className="case-sec">
                <div className="case-sec-title">他是怎么走到这个路口的</div>
                {data.episode.prior_path.map((p, i) => (
                  <div className="case-path-item" key={i}>
                    {p}
                  </div>
                ))}
              </section>

              {/* ② 当时已经知道什么 —— 与 ④ 严格分开 */}
              <section className="case-sec case-known">
                <div className="case-sec-title">
                  当时已经知道什么
                  <span className="case-sec-hint">他做决定时掌握的信息</span>
                </div>
                <div className="case-tags">
                  {data.temporal_boundary.known_at_time.map((c, i) => (
                    <span className="case-tag" key={i}>
                      {c}
                    </span>
                  ))}
                </div>
                <div className="case-sub">
                  他面对的是：<strong>{data.episode.decision_state.dilemma}</strong>
                </div>
                <div className="case-sub muted">
                  可逆性 {data.episode.decision_state.reversibility} · 风险 {data.episode.decision_state.risk}
                </div>
              </section>

              {/* ③ 实际做了什么 */}
              <section className="case-sec">
                <div className="case-sec-title">实际做了什么</div>
                {data.temporal_boundary.decided.map((a, i) => (
                  <div className="case-path-item" key={i}>
                    {a}
                  </div>
                ))}
              </section>

              {/* ④ 后来发生了什么 */}
              <section className="case-sec case-after">
                <div className="case-sec-title">
                  后来发生了什么
                  <span className="case-sec-hint">⚠️ 这些发生在他做决定之后</span>
                </div>
                {(
                  [
                    ['短期', data.episode.outcomes.short_term],
                    ['中期', data.episode.outcomes.mid_term],
                    ['长期', data.episode.outcomes.long_term],
                  ] as const
                )
                  .filter(([, v]) => v && v.trim())
                  .map(([label, v]) => (
                    <div className="case-outcome" key={label}>
                      <span className="case-outcome-label">{label}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                <div className="case-note">{data.temporal_boundary.note}</div>

                {data.episode.reflection.self_comment && (
                  <div className="case-self-comment">
                    <div className="tiny muted" style={{ marginBottom: 5 }}>
                      他本人后来说（这是回看，不是当时的想法）
                    </div>
                    {data.episode.reflection.self_comment}
                  </div>
                )}
              </section>

              {/* ⑤ 为什么不能照搬 */}
              <section className="case-sec case-diff">
                <div className="case-sec-title">
                  为什么不能照搬
                  <span className="case-sec-hint">这条最重要 —— 它才是参考价值的来源</span>
                </div>
                {data.why_different.map((w, i) => (
                  <div className={`case-diff-item kind-${w.kind}`} key={i}>
                    <span className="case-diff-kind">{KIND_LABEL[w.kind] ?? w.kind}</span>
                    <span>{w.text}</span>
                  </div>
                ))}
              </section>

              {/* 证据抽屉 */}
              <section className="case-sec">
                <button className="case-evidence-toggle" onClick={() => setShowEvidence(!showEvidence)}>
                  {showEvidence ? '收起证据' : '查看证据来源'}
                  <span className="land-caret">{showEvidence ? '▴' : '▾'}</span>
                </button>

                {showEvidence && (
                  <div className="case-evidence">
                    {/* 分层统计 */}
                    <div className="case-layer-row">
                      {Object.entries(data.evidence_layers).map(([k, v]) =>
                        v.length > 0 ? (
                          <span className={`case-layer ${LAYER_CLASS[k] ?? ''}`} key={k}>
                            {LAYER_LABEL[k] ?? k} {v.length}
                          </span>
                        ) : null,
                      )}
                    </div>

                    {data.evidence_detail.map((e, i) => {
                      const m = e.meta;
                      const isAi = e.type === 'ai_inference';
                      return (
                        <div className="case-ev-item" key={i}>
                          <div className="case-ev-type">{EVIDENCE_TYPE[e.type] ?? e.type}</div>
                          <div className="case-ev-claim">{e.claim}</div>

                          {m && (m.publisher || m.title) && (
                            <div className="case-ev-cite">
                              {m.publisher && <strong>{m.publisher}</strong>}
                              {m.publisher && m.title && '　'}
                              {m.title && <span>《{m.title}》</span>}
                              {m.locator && (
                                <>
                                  <br />
                                  <span className="tiny muted">定位：{m.locator}</span>
                                </>
                              )}
                            </div>
                          )}

                          {m?.limitations && (
                            <div className="case-ev-limit">
                              <span className="tiny">已知局限：{m.limitations}</span>
                            </div>
                          )}

                          <div className="case-ev-meta">
                            <code>{e.source_id}</code>
                            {e.url ? (
                              <a href={e.url} target="_blank" rel="noreferrer noopener">
                                打开原文 ↗
                              </a>
                            ) : (
                              <span className="tiny muted">
                                {isAi ? 'AI 建模产物，无外部来源' : '这条没有记录链接'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

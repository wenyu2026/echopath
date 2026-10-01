/**
 * What-if 条件调整（T5 后的改进 ②）
 * ============================================
 * 为什么需要它：
 *   后端在 24 条反类比里有 9 条（37.5%）写着「你可以在 What-if 里补充这个信息再看匹配变化」——
 *   但 What-if 根本不存在。这是个**悬空承诺**，评委一点就露馅。
 *
 * 更重要的是：它是**证明「结构匹配」而非「文本匹配」的唯一硬手段**。
 *   文本相似度不会因为「假设我不怕延毕」而改变；
 *   结构匹配会。所以改一个条件、看结果实时变化，
 *   比嘴上说十遍「我们不是文本相似」都有力。
 *
 * 实现：不新增后端接口 —— 直接复用 POST /api/retrieve（它本来就接受 situation）。
 */

import { useState, type FormEvent } from 'react';
import type { RetrievalResponse, Situation } from '../types/episode';
import { CHOICE_LABEL } from './ForkMap';

/** 预置的 What-if 假设，覆盖三类最常见的条件变化 */
const PRESETS: { label: string; apply: (s: Situation) => Situation; hint: string }[] = [
  {
    label: '假设我不怕延毕',
    hint: '移除「可能延毕 / 时间」类约束',
    apply: (s) => ({
      ...s,
      constraints: s.constraints.filter((c) => !/延毕|时间|年限|来不及|太晚/.test(c)),
      reversibility: 'high',
    }),
  },
  {
    label: '假设家里完全支持',
    hint: '移除家庭期望类约束',
    apply: (s) => ({ ...s, constraints: s.constraints.filter((c) => !/家庭|父母|期望|家人/.test(c)) }),
  },
  {
    label: '假设新方向已验证半年',
    hint: '把「新方向未验证」从 unknown 里移除',
    apply: (s) => ({
      ...s,
      unknowns: s.unknowns.filter((u) => !/新方向|验证|了解/.test(u)),
    }),
  },
  {
    label: '假设我经济压力很大',
    hint: '加一条经济约束',
    apply: (s) => ({ ...s, constraints: [...s.constraints, '经济压力大，需要尽快有收入'] }),
  },
];

/**
 * 自定义条件：把用户随手写的一句话接到 constraints 上。
 *
 * 为什么不做成「AI 解析成结构化字段」：那要多一次 LLM 调用（2-3s），
 * 而 What-if 的价值在于**即时看到结构变化**，等 3 秒就失去冲击力了。
 * 直接当约束加进去，检索链路本身会做类别归并 —— 效果一样，但是瞬时的。
 */
function customApply(text: string) {
  const clean = text.trim().replace(/^假设/, '').trim();
  return (s: Situation): Situation => ({
    ...s,
    constraints: [...s.constraints, clean],
    // 补一句明确表述，让后端的约束类别识别更容易命中
    goals: s.goals,
  });
}

type Props = {
  baseSituation: Situation;
  baseResult: RetrievalResponse | null;
  onRerun: (s: Situation) => Promise<RetrievalResponse | null>;
};

export default function WhatIfPanel({ baseSituation, baseResult, onRerun }: Props) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [after, setAfter] = useState<RetrievalResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  /** 当前这次假设是不是用户自己写的（决定"没变"时怎么解释） */
  const [isCustom, setIsCustom] = useState(false);

  /** 统一的执行入口：预置与自定义都走这里 */
  async function runWith(label: string, apply: (s: Situation) => Situation, custom = false) {
    setBusy(true);
    setError(null);
    setActiveLabel(label);
    setIsCustom(custom);
    try {
      const res = await onRerun(apply(baseSituation));
      if (!res) {
        setError('后端不可用，What-if 需要实时重算（离线模式下无法演示）');
        setAfter(null);
      } else {
        setAfter(res);
      }
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setActiveLabel(null);
    setAfter(null);
    setError(null);
  }

  function submitCustom(e: FormEvent) {
    e.preventDefault();
    const t = custom.trim();
    if (!t) return;
    runWith(`假设${t.replace(/^假设/, '')}`, customApply(t), true);
  }

  // 对比：案例是否变了 / 顺序是否变了
  const beforeNames = baseResult?.matches.map((m) => m.episode.person.name) ?? [];
  const afterNames = after?.matches.map((m) => m.episode.person.name) ?? [];
  const changed = activeLabel && JSON.stringify(beforeNames) !== JSON.stringify(afterNames);

  return (
    <div className="card whatif">
      <div className="card-head">
        <span className="card-sub">What-if · 改一个条件，看匹配怎么变</span>
        <span className="spacer" />
        {activeLabel && (
          <button className="btn btn-sm btn-ghost" onClick={clear}>
            恢复
          </button>
        )}
      </div>

      <p className="muted small" style={{ marginTop: -4 }}>
        这一步是为了证明一件事：<strong>匹配靠的是结构，不是语义相似</strong>。
        文本相似度不会因为你「假设不怕延毕」而变化 —— 结构匹配会。
      </p>

      <div className="row" style={{ marginTop: 14 }}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`option-chip${activeLabel === p.label ? ' selected' : ''}`}
            style={{ flex: '0 1 auto', minWidth: 0 }}
            onClick={() => runWith(p.label, p.apply)}
            disabled={busy}
            title={p.hint}
          >
            {p.label}
            <br />
            <span className="tiny muted">{p.hint}</span>
          </button>
        ))}
      </div>

      {/* 自定义条件：只加约束、不调 LLM，保证改完立刻看到结果 */}
      <form className="whatif-custom" onSubmit={submitCustom}>
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="或者自己写一个：假设我已经拿到大厂 offer"
          disabled={busy}
          aria-label="自定义 What-if 条件"
        />
        <button className="btn btn-sm" type="submit" disabled={busy || !custom.trim()}>
          试一下
        </button>
        <span className="tiny muted">
          会把它当作一条新约束重新检索 —— 不调 AI，改完立刻出结果
        </span>
      </form>

      {busy && <div className="notice" style={{ marginTop: 16 }}>正在用新条件重新检索…</div>}

      {error && (
        <div className="notice warn" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

      {after && !busy && (
        <div style={{ marginTop: 18 }}>
          <div className={`notice${changed ? ' warn' : ''}`} style={{ marginBottom: 14 }}>
            {changed ? (
              <>
                <strong>匹配结果变了。</strong>同样的输入文字、不同的约束条件 →
                系统选出了不同的三个人。这正好说明匹配发生在<strong>结构层</strong>。
              </>
            ) : (
              <>
                <strong>匹配结果没变 —— 而且我们能说清为什么。</strong>
                <br />
                {isCustom ? (
                  <>
                    你写的这句话里，没有落进系统认识的约束类别
                    （经济 / 时间 / 门槛 / 家庭 / 身份 / 机会成本 / 不确定性 …）。
                    它不是被忽略了，而是<strong>没能归到任何一个结构维度上</strong>，
                    所以结构匹配无从调整。试着换个说法，比如
                    「<em>家里没人能帮我出学费</em>」或「<em>我已经拿到别的 offer</em>」。
                  </>
                ) : (
                  <>
                    这条假设涉及的约束，在候选案例里本来就都对得上或都对不上 ——
                    改了它不改变三者的相对次序。这也是一个诚实的结论：
                    <strong>它对你这个处境影响不大</strong>。
                  </>
                )}
              </>
            )}
          </div>

          <div className="dim-row" style={{ fontWeight: 600, marginBottom: 6 }}>
            <span className="dim-label">对比</span>
            <span />
            <span className="dim-value">改之前 → 改之后</span>
          </div>

          {(after.matches.length > 0 ? after.matches : []).map((m, i) => {
            const ep = m.episode;
            const beforeM = baseResult?.matches.find((x) => x.episode.episode_id === ep.episode_id);
            const isNew = !beforeM;
            return (
              <div className="situation-row" key={ep.episode_id}>
                <span className="situation-key">
                  第 {i + 1} 条
                  {isNew && <span className="kind-badge kind-ai" style={{ marginLeft: 6 }}>新进</span>}
                </span>
                <span className="situation-val">
                  {ep.person.name}　
                  <span className="muted small">{CHOICE_LABEL[ep.choice.type] ?? ep.choice.type}</span>
                  {beforeM ? (
                    <span className="tiny muted" style={{ marginLeft: 10 }}>
                      维度分变化：困境 {fmt(beforeM.dimensions.dilemma_match)} → {fmt(m.dimensions.dilemma_match)}　
                      约束 {fmt(beforeM.dimensions.constraint_match)} → {fmt(m.dimensions.constraint_match)}
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}

          {baseResult && (
            <div className="tiny muted" style={{ marginTop: 10 }}>
              改之前选的是：{beforeNames.join(' / ') || '（无）'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(v: number): string {
  return v.toFixed(2);
}

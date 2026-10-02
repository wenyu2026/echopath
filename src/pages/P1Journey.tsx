/**
 * P1 来时路
 * ============================================
 * 收集 prior path、目标、约束。
 * 方案要求：5–10 个快速问题 / 自然语言经历。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import { getJourneyQuestions } from '../data/mock';
import { PATHS } from '../routes';

export default function P1Journey() {
  const { journey, setJourneyAnswer, buildSituation, loadingSituation, setReachable, outOfScope, clearOutOfScope } = useApp();
  const nav = useNavigate();
  const [idx, setIdx] = useState(0);

  // 按第一问的回答切换问题措辞（校园 / 职场 / 中性）
  // —— 否则评委试「大厂还是小厂」场景时，会看到只在大学里成立的问题
  const questions = getJourneyQuestions(journey.q1 ?? '');

  const q = questions[idx];
  const value = journey[q.id] ?? '';
  const filled = questions.filter((x) => (journey[x.id] ?? '').trim().length > 0).length;
  const isLast = idx === questions.length - 1;

  async function next() {
    if (!isLast) {
      setIdx(idx + 1);
      return;
    }
    // 进入 P2 前，把回答交给后端解析成结构化处境。
    // 后端不可用时 buildSituation 内部会自动降级到离线数据，不会卡住流程；
    // 但**输入超出范围**时必须留在原地给引导，不能带着空处境往下走。
    const ok = await buildSituation();
    if (!ok) return;
    setReachable(1);
    nav(PATHS.crossroads);
  }

  return (
    <div className="narrow" style={{ margin: '0 auto' }}>
      <h1>先说说你的来时路</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 26 }}>
        不需要写得完整。你写得越具体，后面找到的人越接近真实的你。
        <br />
        <span className="small">（这是一次性收集，不会用于其它用途）</span>
      </p>

      {/* 输入超出范围时明确拒答，而不是硬编一个处境出来。
          实测最糟的情形：喂「中午吃什么」也能被解析成「午餐决策」并匹配历史人物。 */}
      {outOfScope && (
        <div className="notice warn" style={{ marginBottom: 20 }}>
          <strong>这个系统处理不了这类问题</strong>
          <br />
          {outOfScope.reason}。
          {outOfScope.hint && (
            <>
              <br />
              {outOfScope.hint}
            </>
          )}
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-sm" onClick={clearOutOfScope}>
              好，我换个说法
            </button>
          </div>
        </div>
      )}

      {/* 进度 */}
      <div className="row tiny muted" style={{ marginBottom: 8 }}>
        <span>
          第 {idx + 1} / {questions.length} 问
        </span>
        <span className="spacer" />
        <span>已回答 {filled} 项</span>
      </div>
      <div className="dim-track" style={{ marginBottom: 26 }}>
        <div
          className="dim-fill"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`q-${q.id}`}>{q.label}</label>
          <textarea
            id={`q-${q.id}`}
            value={value}
            placeholder={q.placeholder}
            onChange={(e) => setJourneyAnswer(q.id, e.target.value)}
            autoFocus
            rows={4}
          />
        </div>

        <div className="btn-row">
          <button className="btn" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
            ← 上一问
          </button>
          <span className="spacer" />
          {!isLast && (
            <button className="btn btn-ghost" onClick={next}>
              跳过这题
            </button>
          )}
          <button className="btn btn-primary" onClick={next} disabled={loadingSituation}>
            {loadingSituation
              ? '正在理解你的处境…'
              : isLast
                ? '看看我走到了哪个路口 →'
                : '下一个问题 →'}
          </button>
        </div>
      </div>

      {/* 已填的回答一览 */}
      {filled > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-sub">你已填写的</span>
          </div>
          {questions
            .filter((x) => (journey[x.id] ?? '').trim())
            .map((x) => (
              <div className="situation-row" key={x.id}>
                <span className="situation-key">{x.label}</span>
                <span className="situation-val">{journey[x.id]}</span>
              </div>
            ))}
        </div>
      )}

      <div className="notice" style={{ marginTop: 20 }}>
        <strong>为什么先问这些？</strong>
        <br />
        因为「和我像」不能只看一句话的语义相似。要看：
        <em>之前的路径 + 当前的冲突 + 现实约束 + 可选道路 + 心理目标</em>
        是不是结构上相似。
      </div>
    </div>
  );
}

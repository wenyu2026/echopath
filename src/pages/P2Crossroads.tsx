/**
 * P2 当前路口
 * ============================================
 * 展示 AI 抽取的结构化处境，并允许用户手动修改。
 * 方案验收：用户可以手动修改 AI 对自己处境的理解。
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppState';
import type { Situation, Level } from '../types/episode';
import { PATHS } from '../routes';

const LEVEL_LABEL: Record<Level, string> = { low: '低', medium: '中', high: '高' };

const ARRAY_FIELDS: { key: keyof Situation; label: string }[] = [
  { key: 'options', label: '可选道路' },
  { key: 'constraints', label: '现实约束' },
  { key: 'goals', label: '真正在意的目标' },
  { key: 'unknowns', label: '尚不明确的信息' },
];

export default function P2Crossroads() {
  const { situation, setSituation, runRetrieval, loadingRetrieval, mode, offlineReason, setReachable, situationFromUserInput } = useApp();
  const nav = useNavigate();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [addingTo, setAddingTo] = useState<keyof Situation | null>(null);

  if (!situation) {
    return (
      <div className="empty">
        还没有你的处境信息。请先回到 <a href="/">第一步</a>。
      </div>
    );
  }

  const s = situation;

  function patch(p: Partial<Situation>) {
    setSituation({ ...s, ...p });
  }

  function saveItem(field: keyof Situation, index: number) {
    const arr = [...(s[field] as string[])];
    if (!draft.trim()) arr.splice(index, 1);
    else arr[index] = draft.trim();
    patch({ [field]: arr } as Partial<Situation>);
    setEditing(null);
    setDraft('');
  }

  function addItem(field: keyof Situation) {
    if (!draft.trim()) {
      setAddingTo(null);
      return;
    }
    patch({ [field]: [...(s[field] as string[]), draft.trim()] } as Partial<Situation>);
    setDraft('');
    setAddingTo(null);
  }

  async function go() {
    await runRetrieval();
    setReachable(3);
    nav(PATHS.map);
  }

  return (
    <div>
      <h1>这是你现在站的路口</h1>
      {situationFromUserInput ? (
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          我们从你的回答里抽出了这些结构。
          <strong>如果哪里不对，直接改</strong> —— 你的处境由你定义，不是由系统定义。
        </p>
      ) : (
        /* 全跳过 6 问的情况：不能把系统编的内容说成"从你的回答里抽出来的" */
        <div className="notice warn" style={{ marginTop: 8, marginBottom: 24 }}>
          <strong>你没有填写任何内容</strong>
          <br />
          下面是一份<strong>通用起点</strong>，不是从你的话里读出来的 ——
          它只是让你先看到流程长什么样。
          <strong>把它改成你自己的处境</strong>，后面的案例才会真的像你。
        </div>
      )}

      {mode === 'offline' && (
        <div className="notice warn" style={{ marginBottom: 18 }}>
          <strong>⚠️ 离线演示模式</strong>
          <br />
          后端接口暂时不可用{offlineReason ? `（${offlineReason}）` : ''}，
          当前显示的是预生成的演示数据。**功能演示不受影响，但这不是实时计算结果。**
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-sub">当前路口卡</span>
          <span className="spacer" />
          <span className="tiny muted">点击任意条目可编辑</span>
        </div>

        {/* 阶段 */}
        <div className="situation-row">
          <span className="situation-key">人生阶段</span>
          <span className="situation-val">
            {editing === 'stage' ? (
              <input
                type="text"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => saveItem('stage' as keyof Situation, 0)}
                onKeyDown={(e) => e.key === 'Enter' && saveItem('stage' as keyof Situation, 0)}
              />
            ) : (
              <span
                className="tag editable"
                onClick={() => {
                  setEditing('stage');
                  setDraft(s.stage);
                }}
              >
                {s.stage}
              </span>
            )}
          </span>
        </div>

        {/* 核心冲突 */}
        <div className="situation-row">
          <span className="situation-key">核心冲突</span>
          <span className="situation-val">
            {editing === 'dilemma' ? (
              <input
                type="text"
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => saveItem('dilemma' as keyof Situation, 0)}
                onKeyDown={(e) => e.key === 'Enter' && saveItem('dilemma' as keyof Situation, 0)}
              />
            ) : (
              <strong
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setEditing('dilemma');
                  setDraft(s.dilemma);
                }}
              >
                {s.dilemma}
              </strong>
            )}
          </span>
        </div>

        {/* 数组字段 */}
        {ARRAY_FIELDS.map(({ key, label }) => {
          const arr = s[key] as string[];
          return (
            <div className="situation-row" key={key}>
              <span className="situation-key">{label}</span>
              <span className="situation-val">
                <span className="tag-row">
                  {arr.map((item, i) => (
                    <span key={`${item}-${i}`}>
                      {editing === `${key}-${i}` ? (
                        <input
                          type="text"
                          value={draft}
                          autoFocus
                          style={{ width: 200, display: 'inline-block', padding: '3px 8px' }}
                          onChange={(e) => setDraft(e.target.value)}
                          onBlur={() => saveItem(key, i)}
                          onKeyDown={(e) => e.key === 'Enter' && saveItem(key, i)}
                        />
                      ) : (
                        <span
                          className="tag editable"
                          onClick={() => {
                            setEditing(`${key}-${i}`);
                            setDraft(item);
                          }}
                          title="点击编辑"
                        >
                          {item}
                          <span
                            className="tag-remove"
                            title="删除"
                            onClick={(e) => {
                              e.stopPropagation();
                              patch({ [key]: arr.filter((_, j) => j !== i) } as Partial<Situation>);
                            }}
                          >
                            ×
                          </span>
                        </span>
                      )}
                    </span>
                  ))}

                  {addingTo === key ? (
                    <input
                      type="text"
                      value={draft}
                      autoFocus
                      placeholder="回车添加"
                      style={{ width: 160, display: 'inline-block', padding: '3px 8px' }}
                      onChange={(e) => setDraft(e.target.value)}
                      onBlur={() => addItem(key)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(key)}
                    />
                  ) : (
                    <span
                      className="tag tag-add editable"
                      onClick={() => {
                        setAddingTo(key);
                        setDraft('');
                      }}
                    >
                      + 添加
                    </span>
                  )}
                </span>
              </span>
            </div>
          );
        })}

        {/* 风险 / 可逆性 */}
        <div className="situation-row">
          <span className="situation-key">风险承受度</span>
          <span className="situation-val">
            <select
              value={s.risk}
              onChange={(e) => patch({ risk: e.target.value as Level })}
              style={{ width: 'auto', display: 'inline-block', padding: '5px 10px' }}
            >
              {(['low', 'medium', 'high'] as Level[]).map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
          </span>
        </div>

        <div className="situation-row">
          <span className="situation-key">选择的可逆性</span>
          <span className="situation-val">
            <select
              value={s.reversibility}
              onChange={(e) => patch({ reversibility: e.target.value as Level })}
              style={{ width: 'auto', display: 'inline-block', padding: '5px 10px' }}
            >
              {(['low', 'medium', 'high'] as Level[]).map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
            <span className="muted tiny" style={{ marginLeft: 10 }}>
              能不能撤回、试错成本多大
            </span>
          </span>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={go} disabled={loadingRetrieval}>
          {loadingRetrieval ? '正在检索相似的人生路口…' : '看看别人从这里去了哪里 →'}
        </button>
        <button className="btn btn-ghost" onClick={() => nav(PATHS.journey)}>
          ← 回去修改来时路
        </button>
      </div>

      <div className="notice" style={{ marginTop: 20 }}>
        <strong>注意：</strong>系统不会预测你的未来，也不给「最佳路线」。
        它只做一件事 —— 找出真实处在过相似路口的人，把他们的选择和结果摆给你看。
      </div>
    </div>
  );
}

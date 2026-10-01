/**
 * 证据抽屉
 * ============================================
 * 验收要求：至少一个关键事实能点开看到证据来源。
 *
 * ⚠️ v2 改进：加上**可点击的原文链接**与来源机构/局限说明。
 *
 *   原来只显示 source_id（如 LX-SENDAI）—— 那对用户毫无意义，
 *   而且抽屉的整个承诺是「每个关键事实都能追溯到具体来源」，
 *   却在最需要"点一下验证"的地方什么也点不了。
 *
 *   数据里本来就有 url / publisher / title，只是没渲染出来。
 *   现在把它变成「能当场点开验证」的样子 ——
 *   这才是把「我们号称可追溯」变成「你自己看」。
 */

import { useEffect } from 'react';
import type { Evidence } from '../types/episode';

const TYPE_LABEL: Record<string, string> = {
  self_writing: '本人写作',
  biography: '传记 / 研究',
  interview: '访谈 / 演讲',
  encyclopedia: '百科 / 数据库',
  ai_inference: '⚠️ AI 推断',
};

/** 从 url 里取一个短域名，用于显示在链接上 */
function hostOf(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export default function EvidenceDrawer({
  open,
  onClose,
  title,
  evidence,
  sourceCount,
  aiCount,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  evidence: Evidence[];
  /** 真正的外部来源数（不含 AI 推断） */
  sourceCount?: number;
  /** AI 推断条目数 —— 单独说明，不混进"来源"里 */
  aiCount?: number;
}) {
  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const linkCount = evidence.filter((e) => e.url).length;

  return (
    <>
      <div className="drawer-mask" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="证据来源">
        <div className="drawer-head">
          <h3>证据来源</h3>
          <span className="muted small">{title}</span>
          <button className="btn btn-sm btn-ghost" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <p className="muted small" style={{ marginBottom: 18 }}>
            每个关键事实都应能追溯到具体来源。
            {typeof sourceCount === 'number' && (
              <>
                {' '}
                这条案例有 <strong>{sourceCount} 条外部来源</strong>
                {linkCount > 0 && <>（其中 {linkCount} 条可直接点开原文）</>}。
              </>
            )}
            {typeof aiCount === 'number' && aiCount > 0 && (
              <>
                {' '}
                另有 <strong>{aiCount} 条 AI 推断</strong> —— 那不是来源，
                只是说明哪些字段是建模出来的，不必去找出处。
              </>
            )}
          </p>

          {evidence.length === 0 ? (
            <div className="empty">这条案例暂无证据记录</div>
          ) : (
            evidence.map((e) => {
              const host = hostOf(e.url);
              const isAi = e.type === 'ai_inference';
              return (
                <div className="evidence-item" key={e.source_id}>
                  <div className="evidence-type">{TYPE_LABEL[e.type] ?? e.type}</div>
                  <div className="evidence-claim">{e.claim}</div>

                  {e.quote && <blockquote className="evidence-quote">{e.quote}</blockquote>}

                  <div className="evidence-meta">
                    <code className="evidence-src">{e.source_id}</code>

                    {e.url ? (
                      <a
                        className="evidence-link"
                        href={e.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        title={e.url}
                      >
                        打开原文 ↗
                        {host && <span className="tiny"> {host}</span>}
                      </a>
                    ) : (
                      <span className="tiny muted">
                        {isAi ? 'AI 建模产物，无外部来源' : '这条没有记录链接'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}

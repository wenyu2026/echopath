/**
 * 证据抽屉
 * ============================================
 * 验收要求：至少一个关键事实能点开看到证据来源。
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

export default function EvidenceDrawer({
  open,
  onClose,
  title,
  evidence,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  evidence: Evidence[];
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
            每个关键事实都应能追溯到具体来源。{' '}
            <strong>标注为「AI 推断」的内容不是史实</strong>，只表示结构相似。
          </p>

          {evidence.length === 0 ? (
            <div className="empty">这条案例暂无证据记录</div>
          ) : (
            evidence.map((e) => (
              <div className="evidence-item" key={e.source_id}>
                <div className="evidence-type">{TYPE_LABEL[e.type] ?? e.type}</div>
                <div className="evidence-claim">{e.claim}</div>
                <div className="evidence-src">{e.source_id}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

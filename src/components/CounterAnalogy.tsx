/**
 * 像与不像（反类比）
 * ============================================
 * 产品的核心记忆点：主动告诉用户「为什么你不能照搬」。
 * 聊天机器人永远不会做这件事。
 *
 * ⚠️ T5 集成改进：后端（#15）把差异类别写在文本前缀里
 *   （【约束差异】/【路径差异】/【⚠️ AI 类比·…】/【未知】），
 *   因为它走的是「模板式零 LLM」，不额外产出结构化字段。
 *   这里解析前缀 → 渲染成彩色徽章，满足方案第 2.3 节
 *   「⚠️ AI 类比 与 未知 必须与普通差异视觉区分」的硬要求。
 */

/** 前缀 → 样式。顺序敏感：先匹配更具体的 */
const KIND_STYLES: { match: RegExp; cls: string; label: string }[] = [
  { match: /^【⚠️\s*AI\s*类比[^】]*】/, cls: 'kind-ai', label: '⚠️ AI 类比' },
  { match: /^【未知】/, cls: 'kind-unknown', label: '未知' },
  { match: /^【约束差异】/, cls: 'kind-structure', label: '约束差异' },
  { match: /^【路径差异】/, cls: 'kind-structure', label: '路径差异' },
  { match: /^【结构差异】/, cls: 'kind-structure', label: '结构差异' },
  { match: /^【证据[^】]*】/, cls: 'kind-evidence', label: '证据差异' },
];

function parseItem(raw: string): { kind: string | null; label: string; text: string } {
  for (const k of KIND_STYLES) {
    const m = raw.match(k.match);
    if (m) {
      return { kind: k.cls, label: k.label, text: raw.slice(m[0].length).trim() };
    }
  }
  return { kind: null, label: '', text: raw };
}

function ItemList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((raw, i) => {
        const { kind, label, text } = parseItem(raw);
        return (
          <li key={i}>
            {kind && <span className={`kind-badge ${kind}`}>{label}</span>}
            {text}
          </li>
        );
      })}
    </ul>
  );
}

export default function CounterAnalogy({
  whySimilar,
  whyDifferent,
}: {
  whySimilar: string[];
  whyDifferent: string[];
}) {
  return (
    <div className="compare-grid">
      <div className="compare-col similar">
        <div className="compare-title">
          <span>✓</span> 像你的地方
        </div>
        <ItemList items={whySimilar} />
      </div>

      <div className="compare-col different">
        <div className="compare-title">
          <span>✕</span> 你不能照搬的地方
        </div>
        <ItemList items={whyDifferent} />
        <p className="tiny" style={{ marginTop: 12, marginBottom: 0, opacity: 0.78, lineHeight: 1.9 }}>
          标 <span className="kind-badge kind-ai">⚠️ AI 类比</span> 的是模型的外部知识推断，
          <strong>不是史实</strong>；标 <span className="kind-badge kind-unknown">未知</span>
          的是案例资料里查不到、我们不替你猜的部分。
        </p>
      </div>
    </div>
  );
}

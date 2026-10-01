/**
 * 像与不像（反类比）
 * ============================================
 * 产品的核心记忆点：主动告诉用户「为什么你不能照搬」。
 * 聊天机器人永远不会做这件事。
 */

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
        <ul>
          {whySimilar.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="compare-col different">
        <div className="compare-title">
          <span>✕</span> 你不能照搬的地方
        </div>
        <ul>
          {whyDifferent.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

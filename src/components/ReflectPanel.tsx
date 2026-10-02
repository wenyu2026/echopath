/**
 * 回到自己 —— 最后一步
 * ============================================
 * ⚠️ 这一屏是全产品的「最后一公里」，也是最容易被漏掉的一屏。
 *
 *   原方案只提到「最终给的是**验证实验**，而不是最终决策」，
 *   但没有对应的数据结构。路线图里出现过「下一步最值得验证什么？」却没有落地。
 *
 *   问题：用户看完 4 条路径，然后呢？
 *   如果不给一个**具体的、下周就能做的动作**，
 *   前面所有页都只是「看了一场展览」。
 *
 * ⚠️ 但这里**不能变成建议**。
 *   「你应该先去实习」是处方，违反产品铁律。
 *   所以这一屏只做三件事：
 *     ① 把他自己说过的话摊开（他已经在意的、已经怕的）
 *     ② 给出一个**中性的验证问题**（不是"去做 X"，而是"你需要先搞清楚 X"）
 *     ③ 让他自己选一个
 */

import { useState } from 'react';
import type { LandscapeResponse } from '../types/landscape';

interface Props {
  landscape: LandscapeResponse;
  /** 用户在访谈里说过的最能体现他在意什么的那句话 */
  userQuote: string;
  /** 访谈采到的字段（用于摊开"你已经在意的"） */
  collected: Record<string, string>;
}

/**
 * 从「他在意的 / 他怕的 / 他没验证的」推出中性验证问题。
 *
 * ⚠️ 注意措辞：全部是「你需不需要先弄清 X」而不是「你应该去做 X」。
 *   前者是把问题还给他，后者是替他做决定。
 */
function buildVerifications(landscape: LandscapeResponse, collected: Record<string, string>): string[] {
  const out: string[] = [];

  // ① 新方向验证不足 —— 几乎所有人都缺这一条
  const validation = collected.validation ?? '';
  if (/没有|无|仅|只|零散|没做过/.test(validation) || validation === '') {
    out.push('你对新方向的了解，有多少来自「真的花过时间」而不是「听说」？');
  }

  // ② 最怕的结果提到了，但没问过它会不会真的发生
  const fear = collected.fear ?? '';
  if (fear) {
    out.push(`你怕的是「${fear}」——有没有什么小事先试出它会不会真的发生？`);
  }

  // ③ 从路径里找「信息缺口」
  //    如果有一条路径的代价明显比其他重，说明用户还没想清那一块
  if (landscape.archetypes.length >= 2) {
    const titles = landscape.archetypes.slice(0, 3).map((a) => a.title);
    out.push(`这几条路（${titles.join(' / ')}）里，你最没法想象自己走的是哪一条？为什么？`);
  }

  // ④ 约束里如果有家庭类，那通常是最难谈的
  const constraints = collected.constraints ?? '';
  if (/家|父母|爸妈|家人/.test(constraints)) {
    out.push('家里那关，你是想先说服他们，还是先拿到一个他们没法反对的结果？');
  }

  // 兜底：真的推不出就问一个通用的
  if (out.length === 0) {
    out.push('看完这些之后，哪一条最让你不舒服？那个不舒服通常指向你真正在意的东西。');
  }

  return out.slice(0, 3);
}

export default function ReflectPanel({ landscape, userQuote, collected }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const verifications = buildVerifications(landscape, collected);

  const facts = [
    collected.stage ? `你现在在：${collected.stage}` : '',
    collected.dilemma ? `你在纠结：${collected.dilemma}` : '',
    collected.validation ? `对新方向：${collected.validation}` : '',
    collected.fear ? `最怕的是：${collected.fear}` : '',
    collected.constraints ? `约束是：${collected.constraints}` : '',
    collected.goals ? `真正在意：${collected.goals}` : '',
  ].filter(Boolean);

  return (
    <div className="reflect-wrap">
      <div className="reflect-head">
        <h2>回到你自己</h2>
        <p className="muted">
          上面是别人的路。<strong>下面是你自己的。</strong>
          没有哪一条是给你的答案 —— 只有几个你还没想清楚的地方。
        </p>
      </div>

      <div className="reflect-grid">
        {/* 左：你已经说过的 */}
        <div className="reflect-card">
          <div className="reflect-card-title">你已经告诉我的</div>
          <ul className="reflect-facts">
            {facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {userQuote && (
            <div className="reflect-quote">
              <div className="tiny muted" style={{ marginBottom: 6 }}>
                你自己说的
              </div>「{userQuote}」
            </div>
          )}
        </div>

        {/* 右：还没想清楚的 */}
        <div className="reflect-card reflect-card-action">
          <div className="reflect-card-title">
            还没想清楚的地方
            <span className="tiny muted" style={{ marginLeft: 8, fontWeight: 400 }}>
              选一个，就是下一步
            </span>
          </div>

          <div className="reflect-options">
            {verifications.map((v, i) => (
              <button
                className={`reflect-option ${picked === v ? 'on' : ''}`}
                key={i}
                onClick={() => setPicked(v)}
              >
                {v}
              </button>
            ))}
          </div>

          {picked && (
            <div className="reflect-picked">
              <div className="tiny muted" style={{ marginBottom: 7 }}>
                你选的下一步是
              </div>
              <div className="reflect-picked-text">{picked}</div>
              <div className="reflect-picked-note">
                我们不告诉你答案。但如果你能回答上面这个问题，
                再来一次，我们会找到更接近你的人。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部的边界声明 */}
      <div className="reflect-disclaimer">
        <strong>这条产品不做的事</strong>
        <ul>
          <li>不预测你的未来，也不算成功率 —— 数据不支持，算了会害人</li>
          <li>不告诉你该选哪条路 —— 只把每条路要付的代价摊开</li>
          <li>不把相关性说成因果 —— 只说「选 A 之后发生了 B」，不说「因为选 A 所以 B」</li>
        </ul>
      </div>
    </div>
  );
}

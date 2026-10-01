/**
 * 人生分叉地图（SVG）
 * ============================================
 * 视觉概念（方案第 10 节）：
 *   过去是已发生的线，现在是一个节点，未来是迷雾。
 *   系统不替你画未来，而是把「别人从相似节点出发后已经走完的路」叠加给你看。
 *
 * ⚠️ 这不是排名，是三条不同的路。颜色区分方向，不区分优劣。
 *
 * ⚠️ v2 改进：「过去」的三个节点原来是写死的「入学 / 投入 / 动摇」。
 *   走查时发现无论用户输入什么故事，地图上都显示同样的三个词 ——
 *   连"换工作"这种跟入学毫无关系的处境也显示「入学」。
 *   而地图是整个 demo 视觉上最显眼的东西，**写死的标签等于告诉评委
 *   「这张图是装饰，不是数据」**。
 *
 *   现在改成从真实数据推出来：
 *     · 从 situation.stage 推第一个节点（你从哪来）
 *     · 从匹配案例的 prior_path 抽共同动作（这条路上的人做过什么）
 *     · 最后一个固定为「动摇」—— 因为能走到检索这一步，本身就是动摇了
 */

import type { MatchResult, Situation } from '../types/episode';

/** 三条路径的配色与位置 */
const LANES = [
  { key: 'A', y: 84, color: '#8a5a2f', label: '路径 A' },
  { key: 'B', y: 200, color: '#2f6d5a', label: '路径 B' },
  { key: 'C', y: 316, color: '#6b4a8a', label: '路径 C' },
];

/** 选择类型 → 中文说明 */
const CHOICE_LABEL: Record<string, string> = {
  persist: '坚持原路',
  direct_switch: '直接转向',
  explore_then_switch: '先试探再转向',
  explore_then_persist: '试探后留下',
  abandon: '放弃退出',
  dual_track: '双轨并行',
};

/**
 * 从处境与案例推出「过去」这条线上的三个节点。
 *
 * 目标：让标签**属于用户自己的故事**，而不是通用占位词。
 * 每个标签控制在 2-5 字，保证 SVG 里放得下。
 */
function buildPastNodes(situation: Situation | null, matches: MatchResult[]): { label: string }[] {
  // ① 起点：用户自己说的阶段（截短到能放下）
  const stage = (situation?.stage ?? '').trim();
  const start = stage ? shorten(stage, 5) : '起点';

  // ② 中段：从匹配案例的来时路里找一个**两个以上案例共有**的动作用词
  const mid = commonPriorPathWord(matches) ?? '已投入';

  // ③ 末段：能走到这一步，本身就是动摇 —— 这个词对所有处境都成立
  return [{ label: start }, { label: mid }, { label: '动摇' }];
}

/** 从多个案例的 prior_path 里抽一个出现 ≥2 次、且适合做节点的短词 */
function commonPriorPathWord(matches: MatchResult[]): string | undefined {
  const counter = new Map<string, number>();
  // 这些词信息量太低，不适合当选节点标签
  const STOP = new Set(['已经', '一直', '开始', '后来', '当时', '自己', '没有', '一个', '这个', '那个']);

  for (const m of matches) {
    const seen = new Set<string>();
    for (const p of m.episode.prior_path ?? []) {
      // 抽 2-4 字的中文词
      for (const w of String(p).match(/[\u4e00-\u9fa5]{2,4}/g) ?? []) {
        if (STOP.has(w) || seen.has(w)) continue;
        seen.add(w);
        counter.set(w, (counter.get(w) ?? 0) + 1);
      }
    }
  }

  // 取「多个案例共有」的，优先较长（信息量更大）
  const shared = [...counter.entries()].filter(([, n]) => n >= 2 && n < matches.length + 1);
  if (shared.length === 0) return undefined;
  shared.sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  return shared[0][0];
}

/** 截短标签，保证 SVG 里放得下 */
function shorten(s: string, max: number): string {
  const clean = s.replace(/[/／·、,，\s]/g, '');
  return clean.length <= max ? clean : clean.slice(0, max);
}

type Props = {
  matches: MatchResult[];
  /** 用于让「过去」这条线反映用户自己的处境，而不是通用占位词 */
  situation?: Situation | null;
  onSelect?: (index: number) => void;
  activeIndex?: number;
};

export default function ForkMap({ matches, situation, onSelect, activeIndex }: Props) {
  const nowX = 286;
  const nowY = 200;
  const endX = 812;
  const pastNodes = buildPastNodes(situation ?? null, matches);

  return (
    <div className="forkmap">
      <svg viewBox="0 0 900 400" role="img" aria-label="人生分叉地图：从你现在的节点出发的三条路径">
        <defs>
          {/* 未来迷雾 */}
          <linearGradient id="fog" x1="0" x2="1">
            <stop offset="0" stopColor="#f7f5f1" stopOpacity="0" />
            <stop offset="0.55" stopColor="#f7f5f1" stopOpacity="0.55" />
            <stop offset="1" stopColor="#f7f5f1" stopOpacity="0.95" />
          </linearGradient>

          {/* 每条路径的渐变（从实到虚） */}
          {LANES.map((lane) => (
            <linearGradient key={lane.key} id={`pg-${lane.key}`} x1="0" x2="1">
              <stop offset="0" stopColor={lane.color} stopOpacity="0.95" />
              <stop offset="0.7" stopColor={lane.color} stopOpacity="0.6" />
              <stop offset="1" stopColor={lane.color} stopOpacity="0.25" />
            </linearGradient>
          ))}

          {/* 现在这个节点的高光 */}
          <radialGradient id="nowGlow">
            <stop offset="0" stopColor="#2f5d8a" stopOpacity="0.22" />
            <stop offset="1" stopColor="#2f5d8a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ---------- 分区标签 ---------- */}
        <text x="30" y="28" fontSize="11" fill="#a8a29a" letterSpacing="1.6">
          过去（已发生）
        </text>
        <text x={nowX - 26} y="28" fontSize="11" fill="#a8a29a" letterSpacing="1.6">
          现在
        </text>
        <text x={endX - 60} y="28" fontSize="11" fill="#a8a29a" letterSpacing="1.6">
          未来（迷雾）
        </text>

        {/* ---------- 过去：一条实线 + 关键节点 ----------
            节点标签来自真实数据（用户阶段 + 匹配案例共有的来时路动作），
            不再是写死的「入学 / 投入 / 动摇」 */}
        <line x1="30" y1={nowY} x2={nowX - 18} y2={nowY} stroke="#c4bdb1" strokeWidth="2" />
        {pastNodes.map((n, i) => {
          const x = 74 + i * 72;
          return (
            <g key={`${n.label}-${i}`}>
              <circle cx={x} cy={nowY} r="4.5" fill="#f7f5f1" stroke="#a8a29a" strokeWidth="1.6" />
              <text x={x} y={nowY + 26} fontSize="11.5" fill="#7d7871" textAnchor="middle">
                {n.label}
              </text>
            </g>
          );
        })}

        {/* ---------- 现在：节点 ---------- */}
        <circle cx={nowX} cy={nowY} r="46" fill="url(#nowGlow)" />
        <circle cx={nowX} cy={nowY} r="13" fill="#2f5d8a" />
        <circle cx={nowX} cy={nowY} r="21" fill="none" stroke="#2f5d8a" strokeWidth="1.4" strokeDasharray="3 4" opacity="0.55" />
        <text x={nowX} y={nowY + 44} fontSize="12.5" fill="#2f5d8a" textAnchor="middle" fontWeight="600">
          你在这里
        </text>

        {/* ---------- 三条分叉路径 ---------- */}
        {LANES.map((lane, i) => {
          const m = matches[i];
          const isActive = activeIndex === i;
          const d = `M ${nowX + 14} ${nowY} C ${nowX + 150} ${nowY}, ${endX - 220} ${lane.y}, ${endX} ${lane.y}`;

          return (
            <g
              key={lane.key}
              onClick={() => onSelect?.(i)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
              opacity={activeIndex === undefined || isActive ? 1 : 0.42}
            >
              {/* 加宽的透明热区，便于点击 */}
              <path d={d} stroke="transparent" strokeWidth="26" fill="none" />

              <path
                d={d}
                stroke={`url(#pg-${lane.key})`}
                strokeWidth={isActive ? 3.4 : 2.4}
                fill="none"
                strokeLinecap="round"
              />

              {/* 终点节点 */}
              <circle cx={endX} cy={lane.y} r={isActive ? 7 : 5.5} fill={lane.color} />

              {/* 路径标号 */}
              <circle cx={nowX + 52} cy={lane.y === nowY ? nowY - 0 : (nowY + lane.y) / 2} r="1" fill="none" />

              {/* 文字信息 */}
              <text x={endX + 12} y={lane.y - 5} fontSize="13" fontWeight="600" fill={lane.color}>
                {lane.label}
              </text>
              <text x={endX + 12} y={lane.y + 13} fontSize="12" fill="#4a4742">
                {m ? m.episode.person.name : '—'}
              </text>
              <text x={endX + 12} y={lane.y + 29} fontSize="11.5" fill="#7d7871">
                {m ? CHOICE_LABEL[m.episode.choice.type] ?? m.episode.choice.type : ''}
              </text>
            </g>
          );
        })}

        {/* ---------- 迷雾遮罩 ---------- */}
        <rect x="620" y="0" width="280" height="400" fill="url(#fog)" pointerEvents="none" />
      </svg>

      <div className="forkmap-legend">
        <span style={{ color: 'var(--ink-4)' }}>三条路都是真实有人走过的</span>
        <span className="spacer" />
        {LANES.map((lane, i) => {
          const m = matches[i];
          if (!m) return null;
          return (
            <span className="legend-item" key={lane.key}>
              <span className="legend-dot" style={{ background: lane.color }} />
              {lane.label}　{m.episode.person.name}　
              <span className="muted">{CHOICE_LABEL[m.episode.choice.type] ?? m.episode.choice.type}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { CHOICE_LABEL };

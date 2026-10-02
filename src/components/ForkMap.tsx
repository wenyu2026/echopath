/**
 * 人生分叉地图
 * ============================================================
 * 核心视觉：过去是已发生的实线，现在是中间一个节点，
 * 未来是三条别人**已经走完**的岔路（不是排名，是不同方向）。
 *
 * 用纯 SVG 画，不引入任何图形库（赛场不装多余依赖）。
 */
import type { MatchResult } from '../types/episode.ts'
import { choiceLabel } from '../pages/retrieval/retrieve.ts'

/** 每条路径的主题色，按选择方向区分 */
const PATH_COLORS = ['#6ea8fe', '#f0a35e', '#7fc8a9', '#c9a0dc']

interface Props {
  matches: MatchResult[]
  selectedIndex: number
  onSelect: (index: number) => void
  /** 当前用户自己的节点标签 */
  selfLabel: string
}

const W = 900
const H = 420
const SELF_X = 150
const MID_X = 470
const END_X = 830

export function ForkMap({ matches, selectedIndex, onSelect, selfLabel }: Props) {
  const count = Math.max(matches.length, 1)
  const laneGap = H / (count + 1)

  return (
    <svg
      className="fork-map"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="人生分叉地图：三条相似人生路径"
    >
      <defs>
        <linearGradient id="fog" x1="0" x2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 未来迷雾：右侧渐隐，暗示「还没发生」 */}
      <rect x={MID_X} y="0" width={W - MID_X} height={H} fill="url(#fog)" />

      {/* 用户自己的位置 */}
      <circle cx={SELF_X} cy={H / 2} r="16" className="node node-self" />
      <text x={SELF_X} y={H / 2 + 42} className="map-label map-label-self" textAnchor="middle">
        {selfLabel}
      </text>
      <text x={SELF_X} y={H / 2 - 30} className="map-caption" textAnchor="middle">
        现在
      </text>

      {/* 干道：现在 → 岔口 */}
      <path
        d={`M ${SELF_X + 16} ${H / 2} C ${SELF_X + 120} ${H / 2}, ${MID_X - 120} ${H / 2}, ${MID_X} ${H / 2}`}
        className="edge edge-trunk"
      />
      <circle cx={MID_X} cy={H / 2} r="7" className="node node-junction" />

      {matches.map((m, i) => {
        const y = laneGap * (i + 1)
        const color = PATH_COLORS[i % PATH_COLORS.length]
        const active = i === selectedIndex
        const d = `M ${MID_X} ${H / 2} C ${MID_X + 110} ${H / 2}, ${MID_X + 110} ${y}, ${END_X} ${y}`

        return (
          <g
            key={m.episode.episode_id}
            className={active ? 'fork-lane fork-lane-active' : 'fork-lane'}
            onClick={() => onSelect(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect(i)
            }}
            aria-label={`第 ${i + 1} 条路径：${choiceLabel(m.episode.choice.type)}`}
          >
            {/* 点击热区 */}
            <rect x={MID_X} y={y - 52} width={W - MID_X} height={104} className="fork-hit" />
            <path d={d} stroke={color} className="edge edge-branch" />
            <circle cx={END_X} cy={y} r={active ? 15 : 11} fill={color} className="node" />

            {/* 路径标签 */}
            <text x={MID_X + 24} y={y - 26} className="map-choice" fill={color}>
              {String.fromCharCode(65 + i)} · {choiceLabel(m.episode.choice.type)}
            </text>
            <text x={MID_X + 24} y={y + 2} className="map-person">
              {m.episode.person.name}　{m.episode.time.year} 年 · {m.episode.time.age ?? '?'} 岁
            </text>
            <text x={MID_X + 24} y={y + 30} className="map-outcome">
              {truncate(m.episode.outcomes.long_term, 30)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s
}

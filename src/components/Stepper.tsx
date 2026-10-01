/**
 * 六步流程指示器
 * ============================================
 * 让用户随时知道自己在整个流程的哪一步。
 */

import { NavLink } from 'react-router-dom';

export const STEPS = [
  { path: '/', label: '来时路' },
  { path: '/crossroads', label: '当前路口' },
  { path: '/map', label: '人生分叉地图' },
  { path: '/episode/0', label: '案例详情' },
  { path: '/compare', label: '像与不像' },
  { path: '/reflect', label: '回到自己' },
];

/** 哪些步骤已经可以访问（有数据了） */
export function Stepper({ reachable }: { reachable: number }) {
  return (
    <nav className="stepper" aria-label="流程步骤">
      {STEPS.map((s, i) => {
        const locked = i > reachable;
        const cls = `step${i === reachable ? ' active' : ''}${i < reachable ? ' done' : ''}`;

        if (locked) {
          return (
            <span className={cls} key={s.path} style={{ opacity: 0.45, cursor: 'not-allowed' }}>
              <span className="step-num">{i + 1}</span>
              {s.label}
            </span>
          );
        }

        return (
          <NavLink
            to={s.path}
            key={s.path}
            className={({ isActive }) => `${cls}${isActive ? ' active' : ''}`}
            end={s.path === '/'}
          >
            <span className="step-num">{i < reachable ? '✓' : i + 1}</span>
            {s.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

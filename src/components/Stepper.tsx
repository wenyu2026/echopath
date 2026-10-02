/**
 * 六步流程指示器
 * ============================================
 * 让用户随时知道自己在整个流程的哪一步。
 *
 * ⚠️ 修过两个 bug：
 *
 *   ① **路径过期**：原来写死 '/', '/crossroads' …。
 *      六页移到 /classic/* 之后，这些链接全部指向不存在的路由，
 *      点了会掉到 404 兜底（重定向回首页）。
 *
 *   ② **高亮逻辑用 reachable 判断，与"实际在哪一页"脱节**：
 *      原来写 `i === reachable`。但 reachable 是"解锁到第几步"，
 *      不是"现在在第几步"。人在 P3 但 reachable=5 时，
 *      第 6 项会被错误高亮成当前步。
 *
 *      更糟的是：用户反馈"在对话页看到六个全灰、第一个亮着" ——
 *      那是因为 pathname 是 /chat，NavLink 谁都匹配不上，
 *      而 `i === reachable`（reachable=0）把第一项点亮了。
 *      看起来像"23456 都不能用"。
 *
 *   现在：高亮**只看 pathname**（classicStepOf）。
 *   不在经典流程里时，这个组件根本不显示（由 App.tsx 控制）。
 */

import { NavLink } from 'react-router-dom';
import { PATHS } from '../routes';

export const STEPS = [
  { path: PATHS.journey, label: '来时路' },
  { path: PATHS.crossroads, label: '当前路口' },
  { path: PATHS.map, label: '人生分叉地图' },
  { path: PATHS.episode(0), label: '案例详情' },
  { path: PATHS.compare, label: '像与不像' },
  { path: PATHS.reflect, label: '回到自己' },
];

/**
 * @param reachable 解锁到第几步（0-based：0 = 只有第一步可用）
 * @param current   当前在第几步（0-based，来自 pathname；-1 = 不在经典流程里）
 */
export function Stepper({ reachable, current = 0 }: { reachable: number; current?: number }) {
  return (
    <nav className="stepper" aria-label="流程步骤">
      {STEPS.map((s, i) => {
        const locked = i > reachable;
        // ⚠️ 高亮只看「现在在哪一页」，不看「解锁到第几步」
        const cls = `step${i === current ? ' active' : ''}${i < current ? ' done' : ''}`;

        if (locked) {
          return (
            <span className={cls} key={s.path} style={{ opacity: 0.45, cursor: 'not-allowed' }}>
              <span className="step-num">{i + 1}</span>
              {s.label}
            </span>
          );
        }

        return (
          <NavLink to={s.path} key={s.path} className={() => cls}>
            <span className="step-num">{i < current ? '✓' : i + 1}</span>
            {s.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

/**
 * 路由路径集中定义
 * ============================================
 * ⚠️ 为什么要有这个文件
 *
 *   原来六页里的跳转全是硬编码的 `nav('/crossroads')`、`nav('/map')`。
 *   后来产品主形态换成对话访谈，六页被移到 `/classic/*` 前缀下 ——
 *   于是**每一处硬编码都要改**，散在 6 个文件里，改漏一处就跳错页。
 *
 *   集中到这里之后，以后要再换前缀，只改这个文件。
 *
 * ⚠️ 六页组件本身没动逻辑，只是把路径字符串换成常量。
 */

/** 经典流程的路径前缀 */
export const CLASSIC = '/classic';

/** 经典六页的路径 */
export const PATHS = {
  /** 主流程：对话式访谈 */
  chat: '/',
  /** 引擎演示：数据源切换 */
  landscape: '/landscape',

  /** 经典流程：P1 来时路 */
  journey: CLASSIC,
  /** P2 当前路口 */
  crossroads: `${CLASSIC}/crossroads`,
  /** P3 分叉地图 */
  map: `${CLASSIC}/map`,
  /** P4 案例详情（需带 index） */
  episode: (index: number | string) => `${CLASSIC}/episode/${index}`,
  /** P5 像与不像 */
  compare: `${CLASSIC}/compare`,
  /** P6 回到自己 */
  reflect: `${CLASSIC}/reflect`,
} as const;

/**
 * 从当前 pathname 判断处在经典流程的第几步。
 *
 * ⚠️ 返回 **0-based**（P1 = 0）。Stepper 内部用 `i === current` 判断高亮，
 *   而索引 i 是 0-based —— 两边必须一致。
 *
 *   第一版这里返回了 1-based，结果人在 P1 时高亮的是「2 当前路口」。
 *   这种 off-by-one 看代码很难发现（两个文件各自都"对"），
 *   但浏览器里一眼就看出来了 —— 所以 UI 改动一定要截图验证。
 *
 * ⚠️ 返回 -1 表示「不在经典流程里」—— 此时 Stepper 根本不该显示。
 */
export function classicStepOf(pathname: string): number {
  if (pathname === PATHS.journey) return 0;
  if (pathname.startsWith(`${CLASSIC}/crossroads`)) return 1;
  if (pathname.startsWith(`${CLASSIC}/map`)) return 2;
  if (pathname.startsWith(`${CLASSIC}/episode`)) return 3;
  if (pathname.startsWith(`${CLASSIC}/compare`)) return 4;
  if (pathname.startsWith(`${CLASSIC}/reflect`)) return 5;
  return -1;
}

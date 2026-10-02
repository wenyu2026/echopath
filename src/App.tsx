/**
 * 应用外壳 + 路由
 * ============================================
 * ⚠️ v2 改造：产品主形态从「六页固定问卷」换成「对话式访谈」
 *
 *   旧：/  = P1 来时路（固定六问）
 *   新：/  = 对话式访谈               ← 产品主形态
 *       /classic/* = 原来的六页流程     ← 保留，作为「另一种走法」
 *
 * 为什么改（用户明确要求）：
 *   产品要的是「AI 一问一答理解你，再去数据库找相似的人」。
 *   固定六问是「填表 → 甩给你三张卡」，形态不对。
 *
 * ⚠️ 六页一行没动，只是换了 URL 前缀。它们的组件、state、样式全部原样。
 *   想回去只要把 /classic 去掉。
 *
 * ⚠️ 导航问题（用户反馈过）：
 *   原来顶部那条 Stepper 只认六页路径，人在 /chat 时六项全灰、
 *   还错误地高亮第一项 —— 看起来像"23456 都不能用"。
 *   现在改成：**Stepper 只在经典流程里显示**，
 *   对话页有自己的顶栏（含「经典流程」入口）。
 */

import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { Stepper } from './components/Stepper';
import { CLASSIC, classicStepOf } from './routes';

import P1Journey from './pages/P1Journey';
import P2Crossroads from './pages/P2Crossroads';
import P3ForkMap from './pages/P3ForkMap';
import P4Episode from './pages/P4Episode';
import P5Compare from './pages/P5Compare';
import P6Reflect from './pages/P6Reflect';
import Landscape from './pages/Landscape';
import Chat from './pages/Chat';

/** 当前是不是在经典流程里 */
function useInClassic(): boolean {
  const { pathname } = useLocation();
  return pathname === CLASSIC || pathname.startsWith(`${CLASSIC}/`);
}

function Shell() {
  const { reachable } = useApp();
  const { pathname } = useLocation();
  const inClassic = useInClassic();
  // ⚠️ Stepper 的高亮必须看「现在在第几页」，不是「解锁到第几步」
  const classicStep = classicStepOf(pathname);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            来路 <small>EchoPath</small>
          </Link>
          <span className="slogan">
            不是预测你的未来，而是把别人已经走过的未来提前给你看
          </span>
          {/* ⚠️ 导航分两种：经典流程显示六步进度条；主流程显示对等入口 */}
          {inClassic ? (
            <nav className="topnav">
              <Link to="/" className="topnav-link">
                ← 回到对话
              </Link>
            </nav>
          ) : (
            <nav className="topnav">
              <Link to={CLASSIC} className="topnav-link">
                六页经典流程
              </Link>
              <Link to="/landscape" className="topnav-link">
                数据源演示
              </Link>
            </nav>
          )}
        </div>
        {/* Stepper 只在经典流程里有意义 —— 主流程不是「六步」 */}
        {inClassic && <Stepper reachable={reachable} current={classicStep} />}
      </header>

      <main className="page">
        <Routes>
          {/* ---- 主流程：对话式访谈 ---- */}
          <Route path="/" element={<Chat />} />

          {/* ---- 经典六页流程（原样保留，只换了前缀）---- */}
          <Route path={`${CLASSIC}`} element={<P1Journey />} />
          <Route path={`${CLASSIC}/crossroads`} element={<P2Crossroads />} />
          <Route path={`${CLASSIC}/map`} element={<P3ForkMap />} />
          <Route path={`${CLASSIC}/episode/:index`} element={<P4Episode />} />
          <Route path={`${CLASSIC}/compare`} element={<P5Compare />} />
          <Route path={`${CLASSIC}/reflect`} element={<P6Reflect />} />

          {/* ---- 引擎演示 ---- */}
          <Route path="/landscape" element={<Landscape />} />

          {/* ⚠️ 兼容老地址：以前 /crossroads 之类直接可用，现在要带 /classic。
                 直接重定向过去，免得队友书签失效。 */}
          <Route path="/crossroads" element={<Navigate to={`${CLASSIC}/crossroads`} replace />} />
          <Route path="/map" element={<Navigate to={`${CLASSIC}/map`} replace />} />
          <Route path="/compare" element={<Navigate to={`${CLASSIC}/compare`} replace />} />
          <Route path="/reflect" element={<Navigate to={`${CLASSIC}/reflect`} replace />} />

          {/* 老地址 /chat 也留着（我之前的版本用过） */}
          <Route path="/chat" element={<Navigate to="/" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="closing" style={{ marginTop: 0 }}>
        <p style={{ fontSize: 15 }}>
          学军黑客松 2026 · 赛道一 Echo · 未来·回响
          <br />
          <span className="small muted" style={{ fontFamily: 'var(--sans)' }}>
            数据为演示样例，来源需经核实；系统不提供决策建议，也不预测个人未来。
          </span>
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell />
      </AppProvider>
    </BrowserRouter>
  );
}

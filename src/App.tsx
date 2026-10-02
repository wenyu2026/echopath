/**
 * 应用外壳 + 路由
 * ============================================
 * 六个页面：P1 来时路 → P2 当前路口 → P3 分叉地图 → P4 案例详情 → P5 像与不像 → P6 回到自己
 *
 * ⚠️ 有意不使用聊天框式界面（方案明确要求）：
 *    聊天框会让评委一眼认为"又一个 AI Chat"。
 *    这里做的是「路口 + 分叉 + 案例卡 + 证据抽屉」的地图式体验。
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './state/AppState';
import { Stepper } from './components/Stepper';

import P1Journey from './pages/P1Journey';
import P2Crossroads from './pages/P2Crossroads';
import P3ForkMap from './pages/P3ForkMap';
import P4Episode from './pages/P4Episode';
import P5Compare from './pages/P5Compare';
import P6Reflect from './pages/P6Reflect';
import Landscape from './pages/Landscape';

function Shell() {
  const { reachable } = useApp();

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
        </div>
        <Stepper reachable={reachable} />
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<P1Journey />} />
          <Route path="/crossroads" element={<P2Crossroads />} />
          <Route path="/map" element={<P3ForkMap />} />
          <Route path="/episode/:index" element={<P4Episode />} />
          <Route path="/compare" element={<P5Compare />} />
          <Route path="/reflect" element={<P6Reflect />} />
        {/* 决策地形 v2 —— 独立流程，与上面六页并存，互不影响 */}
        <Route path="/landscape" element={<Landscape />} />
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

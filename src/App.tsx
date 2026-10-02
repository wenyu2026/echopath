/**
 * 应用外壳 + 路由
 * ============================================
 * ⚠️ v3：只保留对话主流程
 *
 *   /    对话式访谈  ← 唯一的流程
 *
 * 删掉了什么（2026-10-02）：
 *   /classic    六页经典流程（固定六问 → 三案例 → 像不像 → 回自己）
 *   /landscape  数据源切换演示
 *
 * ⚠️ 它们**没有丢** —— 完整代码在分支 `classic-flow-archive`：
 *     git checkout classic-flow-archive -- src/pages
 *   归档分支里还包含：
 *     · 离线兜底快照（src/data/demoCache.ts）
 *     · What-if 面板（src/components/WhatIfPanel.tsx）
 *     · 七维匹配卡 / 反类比 / 证据分层的前端实现
 *
 * 为什么删：产品形态定为「对话」，两套并存的代价是
 *   · 用户不知道哪条是主流程
 *   · 维护两份 UI 的样式与状态
 *   · 演示时容易被问「你们到底有几种形态」
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './pages/Chat';

function Shell() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <span className="brand">
            来路 <small>EchoPath</small>
          </span>
          <span className="slogan">
            不是预测你的未来，而是把别人已经走过的未来提前给你看
          </span>
        </div>
      </header>

      <main className="page">
        <Routes>
          <Route path="/" element={<Chat />} />
          {/* 老地址全部回首页 —— 免得旧书签或队友的链接 404 */}
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
      <Shell />
    </BrowserRouter>
  );
}

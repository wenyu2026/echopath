import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // ⚠️ 必须显式打开。
    //
    // Vite 默认在 outDir **位于项目根目录内** 时才清空；
    // 实测这里并没有清 —— 连构建 11 次后 dist/ 里堆了 11 个历史 bundle，
    // 其中一个还是早已从 public/ 删掉的 icons.svg。
    //
    // 后果不是磁盘占用，而是**验证不可靠**：
    // 你想确认「新代码有没有进产物」，翻到的可能是上一次的构建结果。
    // 这一轮我就差点又被误导一次。
    emptyOutDir: true,
  },

  server: {
    // 前端与后端分成两个进程（前端 5173、后端 3000），
    // 前端 fetch 的是相对路径 /api/...，必须由 dev server 转发到后端。
    // 少了这段，所有接口调用会打到 5173 上 404，页面会一直走离线兜底。
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // preview（构建产物预览）同样需要转发
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

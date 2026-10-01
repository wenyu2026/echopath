import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

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

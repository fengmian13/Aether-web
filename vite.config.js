import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 前端运行端口
    proxy: {
      // 代理配置：将所有 /api 开头的请求转发到 Java 后端
      '/api': {
        target: 'http://localhost:6060', // 对应 application.properties 中的 server.port
        changeOrigin: true,
        // 如果后端不需要 /api 前缀，可以在这里重写路径，
        // 但根据你的配置 server.servlet.context-path=/api，这里不需要 rewrite
      },
      // 如果将来需要代理 WebSocket (ws.port=6061)
      '/ws': {
        target: 'ws://localhost:6061',
        ws: true,
      }
    }
  }
})
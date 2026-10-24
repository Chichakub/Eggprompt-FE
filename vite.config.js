import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      // ตอน dev: เรียก /api/xxx จะถูกส่งไป Spring Boot (ตัด /api ออก เหมือน Nginx บน VM)
      '/api': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
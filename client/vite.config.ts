import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    // Dev tunnels (serveo/cloudflare) for testing inside Telegram; leading dot matches subdomains.
    allowedHosts: ['.serveousercontent.com', '.serveo.net', '.trycloudflare.com'],
    proxy: {
      '/api': process.env.VITE_API_PROXY ?? 'http://127.0.0.1:3000',
    },
  },
})

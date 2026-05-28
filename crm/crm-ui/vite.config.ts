import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Production build is served behind nginx at /admin/. Dev server stays at /.
// Override at build time with VITE_BASE_URL=... (env var or .env.local) if
// deployed under a different path — e.g. set VITE_BASE_URL=/ to run the build
// directly off the CRM server during local development.
export default defineConfig(({ command, mode }) => ({
  base:
    loadEnv(mode, process.cwd(), '').VITE_BASE_URL ||
    process.env.VITE_BASE_URL ||
    (command === 'build' ? '/admin/' : '/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
}))

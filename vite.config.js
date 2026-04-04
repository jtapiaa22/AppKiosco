import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // En build: rutas relativas para que Electron pueda cargar dist/index.html
  // En dev:   rutas absolutas (/) para que el servidor de Vite funcione bien
  base: command === 'build' ? './' : '/',
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
}))

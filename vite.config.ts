import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
      '@components': path.resolve(__dirname, './frontend/components'),
      '@pages': path.resolve(__dirname, './frontend/pages'),
      '@hooks': path.resolve(__dirname, './frontend/hooks'),
      '@utils': path.resolve(__dirname, './frontend/utils'),
      '@styles': path.resolve(__dirname, './frontend/styles'),
      '@types': path.resolve(__dirname, './frontend/types'),
      '@context': path.resolve(__dirname, './frontend/context'),
      '@api': path.resolve(__dirname, './frontend/api'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})

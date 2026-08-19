import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // appType 'spa' (default) already rewrites unknown paths to index.html,
  // so /astrologers deep-links work in dev and in preview.
  server: {
    port: 5190,
    proxy: {
      '/api': 'http://localhost:4050',
      '/user-api': 'http://localhost:4050',
      '/admin-api': 'http://localhost:4050',
      '/noauth-api': 'http://localhost:4050',
      '/files': 'http://localhost:4050'
    }
  }
})

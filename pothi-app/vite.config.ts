import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Keep an untouched copy of the built shell as app.html.
 *
 * scripts/prerender.js overwrites dist/index.html with the homepage snapshot,
 * but Caddy still needs a shell with no content and no canonical to serve the
 * private routes (/buy, /order, /profile, /astrologers) — otherwise each of
 * them is handed a full static copy of the homepage, canonical included.
 *
 * Emitted here rather than copied inside the prerenderer because the
 * prerenderer's copy is only pristine on a fresh build: run it twice without
 * rebuilding and the second run copies the first run's snapshot, silently
 * turning the shell into the homepage. Doing it at build time makes that
 * impossible.
 */
function shellCopy() {
  return {
    name: 'astropothi-shell-copy',
    closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, 'app.html'))
    }
  }
}

export default defineConfig({
  plugins: [react(), shellCopy()],
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

import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Harus sebelum plugin React: plugin ini menghasilkan routeTree.gen.ts.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    // React Compiler dijalankan lewat oxc-transform-react.
    react({ compiler: true }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    // Source map diunggah ke Sentry oleh pipeline deploy, tidak disajikan publik.
    sourcemap: true,
    // Dipakai scripts/check-bundle-budget.mjs untuk menghitung initial JS.
    manifest: true,
  },
})

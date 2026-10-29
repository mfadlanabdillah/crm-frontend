import { fileURLToPath } from 'node:url'
import { federation } from '@module-federation/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Everything that holds state or context must be one instance across host and remotes.
const singleton = { singleton: true, requiredVersion: false } as const

export default defineConfig({
  plugins: [
    // Micro frontend PoC: remotes are registered at runtime (src/app/modules/remote.ts), so none is
    // listed here and this build does not depend on any remote.
    federation({
      name: 'crm_console',
      remotes: {},
      // Remotes are typed by hand (src/app/modules/remote.ts); skip the generated @mf-types.
      dts: false,
      shared: {
        react: singleton,
        'react-dom': singleton,
        'react-i18next': singleton,
        '@tanstack/react-query': singleton,
        '@tanstack/react-router': singleton,
        '@crm/app-kit': singleton,
        '@crm/auth': singleton,
        '@crm/ui': singleton,
      },
    }),
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

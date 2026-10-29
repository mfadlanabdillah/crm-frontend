import { fileURLToPath } from 'node:url'
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const REMOTE_PORT = 5177

// Everything that holds state or context must be one instance with the host, or hooks break.
const singleton = { singleton: true, requiredVersion: false } as const

// The built remote is served under /cs/ next to the console; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cs/' : '/',
  plugins: [
    federation({
      name: 'crm_cs',
      filename: 'remoteEntry.js',
      exposes: { './module': './src/module.tsx' },
      // The host types this remote by hand; skip the generated @mf-types.
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
    // No React Compiler here on purpose: each app compiles on its own.
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: REMOTE_PORT,
    strictPort: true,
    origin: `http://localhost:${REMOTE_PORT}`,
    cors: true,
  },
  preview: { port: 4178, strictPort: true, cors: true },
  build: { target: 'esnext' },
}))

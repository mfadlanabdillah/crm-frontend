import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const REMOTE_PORT = 5175

// Everything that holds state or context must be one instance with the host, or hooks break.
const singleton = { singleton: true, requiredVersion: false } as const

export default defineConfig({
  plugins: [
    federation({
      name: 'crm_investigator',
      filename: 'remoteEntry.js',
      exposes: { './module': './src/module.tsx' },
      // The host types this remote by hand; skip the generated @mf-types.
      dts: false,
      shared: {
        react: singleton,
        'react-dom': singleton,
        'react-i18next': singleton,
        '@tanstack/react-query': singleton,
        '@crm/auth': singleton,
      },
    }),
    // No React Compiler here on purpose: the host uses it, and each app compiles on its own.
    react(),
  ],
  server: {
    port: REMOTE_PORT,
    strictPort: true,
    origin: `http://localhost:${REMOTE_PORT}`,
    cors: true,
  },
  preview: { port: 4176, strictPort: true, cors: true },
  build: { target: 'esnext' },
})

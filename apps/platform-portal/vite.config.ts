import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Internal IDP portal: reads the generated catalog, ships no domain code, and is not a remote.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5178 },
})

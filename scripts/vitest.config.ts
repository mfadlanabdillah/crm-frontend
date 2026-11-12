import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'verify',
    environment: 'node',
    include: ['verify/**/*.test.mjs'],
  },
})

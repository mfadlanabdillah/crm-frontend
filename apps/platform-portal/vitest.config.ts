import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'platform-portal',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

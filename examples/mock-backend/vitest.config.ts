import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { name: 'example-mock-backend', include: ['src/**/*.test.ts'] },
})

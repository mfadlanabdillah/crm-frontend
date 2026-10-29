import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { name: 'app-kit', include: ['src/**/*.test.ts'] },
})

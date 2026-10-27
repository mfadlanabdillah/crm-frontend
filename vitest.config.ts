import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: ['apps/crm-agent', 'packages/api-client', 'packages/auth', 'packages/i18n'],
    coverage: {
      provider: 'v8',
      include: ['apps/crm-agent/src/**', 'packages/*/src/**'],
      // Kode penghubung (routes, main, router) diuji lewat Playwright; mock dev bukan kode produksi.
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/generated/**',
        '**/routeTree.gen.ts',
        'apps/crm-agent/src/{main.tsx,router.tsx,routes/**,test/**}',
        'apps/crm-agent/src/mocks/{browser,db,handlers}.ts',
        'packages/test-utils/**',
      ],
      reporter: ['text-summary'],
      // Lantai regresi, bukan target: naikkan seiring tes bertambah.
      thresholds: { statements: 36, branches: 31, functions: 31, lines: 35 },
    },
  },
})

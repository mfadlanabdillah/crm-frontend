import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'apps/crm-console',
      'examples/crm-cs',
      'examples/mock-backend',
      'packages/api-client',
      'packages/app-kit',
      'packages/auth',
      'packages/i18n',
      'packages/ui',
    ],
    coverage: {
      provider: 'v8',
      include: ['apps/crm-console/src/**', 'examples/crm-cs/src/**', 'packages/*/src/**'],
      // Kode penghubung (routes, main, router) diuji lewat Playwright; mock dev bukan kode produksi.
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/generated/**',
        '**/routeTree.gen.ts',
        'apps/crm-console/src/{main.tsx,router.tsx,routes/**,test/**}',
        'apps/crm-console/src/mocks/{browser,db,handlers}.ts',
        'packages/test-utils/**',
      ],
      reporter: ['text-summary'],
      // Lantai regresi, bukan target: naikkan seiring tes bertambah.
      thresholds: { statements: 38, branches: 34, functions: 34, lines: 37 },
    },
  },
})

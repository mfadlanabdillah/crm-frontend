import { defineConfig, devices } from '@playwright/test'

/**
 * Journeys through the console plus the CS remote (`examples/crm-cs`), on the mock backend. The
 * console's own tests are in `apps/crm-console/e2e` and need no remote.
 */
const PORT = 5173
const CS_PORT = 5177

export default defineConfig({
  testDir: './cs',
  fullyParallel: true,
  // Each worker is a Chromium. Measured (cold Vite cache, same ~25s for 2-4 workers): 6 workers fail
  // every run, 3 pass on a quiet machine but time out once RAM/swap is tight, 2 stay green.
  // Raise only after re-measuring on a machine with ~8 GB RAM.
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  // The dev server compiles lazily; under parallel load a first page load can pass the default 5s.
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    // Animations would make assertions race the UI; a test that needs motion turns it back on.
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `pnpm --filter @crm/crm-console dev --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        MOCK_DOMAIN: 'examples/mock-backend/src/index.ts',
        VITE_ENABLE_MOCKS: 'true',
        VITE_MOCK_ROLE: 'supervisor',
        VITE_REMOTE_MODULES: `crm_cs=http://localhost:${CS_PORT}/remoteEntry.js`,
      },
    },
    {
      command: 'pnpm --filter @crm/crm-cs dev',
      url: `http://localhost:${CS_PORT}/remoteEntry.js`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})

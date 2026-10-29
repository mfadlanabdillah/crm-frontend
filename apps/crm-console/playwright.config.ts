import { defineConfig, devices } from '@playwright/test'

const PORT = 5173

export default defineConfig({
  testDir: './e2e',
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
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The shell alone. The remote below does not exist on purpose: it shows the "remote did not load"
  // banner and the empty state. Journeys through real remotes live in examples/e2e.
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_ENABLE_MOCKS: 'true',
      VITE_MOCK_ROLE: 'supervisor',
      VITE_REMOTE_MODULES: 'crm_missing=http://localhost:5999/remoteEntry.js',
    },
  },
})

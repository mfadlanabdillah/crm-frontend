import { defineConfig, devices } from '@playwright/test'

/**
 * Journeys across every menu of the micro frontend PoC: the host plus its three remotes, all on the
 * mock backend. Not part of CI (CI never starts the remotes): run it with `pnpm test:e2e:mfe`.
 * Servers already running on these ports are reused.
 */
const HOST_PORT = 5173
const REMOTES = [
  { filter: '@crm/crm-cs', port: 5177, name: 'crm_cs' },
  { filter: '@crm/crm-finance', port: 5174, name: 'crm_finance' },
  { filter: '@crm/crm-investigator', port: 5175, name: 'crm_investigator' },
  { filter: '@crm/crm-monitor', port: 5176, name: 'crm_monitor' },
] as const

const remoteModules = REMOTES.map(
  ({ name, port }) => `${name}=http://localhost:${port}/remoteEntry.js`,
).join(',')

export default defineConfig({
  testDir: './mfe',
  fullyParallel: true,
  // Four dev servers and two Chromium instances: more workers are too heavy on a small machine.
  workers: 2,
  retries: 0,
  reporter: [['list']],
  // Five dev servers compile on demand; a page that loads all four remotes can pass 10s on a small machine.
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${HOST_PORT}`,
    trace: 'on-first-retry',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    // Animations would make assertions race the UI; a test that needs motion turns it back on.
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `pnpm --filter @crm/crm-console dev --port ${HOST_PORT} --strictPort`,
      url: `http://localhost:${HOST_PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
      env: {
        MOCK_DOMAIN: 'examples/mock-backend/src/index.ts',
        VITE_ENABLE_MOCKS: 'true',
        VITE_MOCK_ROLE: 'supervisor',
        VITE_REMOTE_MODULES: remoteModules,
      },
    },
    ...REMOTES.map(({ filter, port }) => ({
      command: `pnpm --filter ${filter} dev`,
      url: `http://localhost:${port}/remoteEntry.js`,
      reuseExistingServer: true,
      timeout: 120_000,
    })),
  ],
})

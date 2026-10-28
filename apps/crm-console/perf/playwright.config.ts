import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4174

/**
 * Pengukuran performa terhadap build produksi harness.
 * Jalankan: `pnpm --filter @crm/crm-console perf` (heap: tambahkan `--grep heap`).
 */
export default defineConfig({
  testDir: '.',
  testMatch: '*.perf.ts',
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  timeout: 60 * 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    // Resolusi laptop kelas bawah.
    viewport: { width: 1366, height: 768 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: `vite build --config perf/vite.config.ts && vite preview --config perf/vite.config.ts --port ${PORT}`,
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})

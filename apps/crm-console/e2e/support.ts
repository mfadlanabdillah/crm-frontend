import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

export { expect }

/**
 * Sesi mock hidup di memori halaman dan dibuat ulang setiap reload, jadi perpindahan halaman di
 * tengah alur (setelah masuk atau keluar) harus lewat router, bukan `page.goto`.
 */
export async function clientNavigate(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

interface ApiActivity {
  inFlight: number
  lastChange: number
}

const activity = new WeakMap<Page, ApiActivity>()

/**
 * Counts in-flight `/v1/` requests. `networkidle` is not enough: the mock delays each response, so a
 * request issued just before the session ends is answered with 401 afterwards, and that 401 sends
 * the app to /login before the test can act.
 */
function trackApiRequests(page: Page) {
  const state: ApiActivity = { inFlight: 0, lastChange: Date.now() }
  const isApi = (url: string) => new URL(url).pathname.startsWith('/v1/')
  const change = (delta: number) => {
    state.inFlight = Math.max(0, state.inFlight + delta)
    state.lastChange = Date.now()
  }
  page.on('request', (request) => isApi(request.url()) && change(1))
  const settled = (request: { url(): string }) => isApi(request.url()) && change(-1)
  page.on('requestfinished', settled)
  page.on('requestfailed', settled)
  activity.set(page, state)
}

/**
 * Ends the session on the mock backend once no API request is in flight (and none started for a
 * moment). Only valid for pages from the `signedInPage` fixture.
 */
export async function endSession(page: Page) {
  const state = activity.get(page)
  if (!state) throw new Error('endSession needs a page from the signedInPage fixture')
  await expect
    .poll(() => state.inFlight === 0 && Date.now() - state.lastChange > 500, { timeout: 15_000 })
    .toBe(true)
  await page.evaluate(() => fetch('/v1/auth/logout', { method: 'POST' }))
}

/** `signedInPage`: halaman yang sudah di /cases dengan sesi mock aktif (peran bawaan: supervisor). */
export const test = base.extend<{ signedInPage: Page }>({
  // Parameter kedua bernama `provide`: nama `use` memicu aturan react-hooks di ESLint.
  signedInPage: async ({ page }, provide) => {
    trackApiRequests(page)
    await page.goto('/cases')
    await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
    await provide(page)
  },
})

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

/**
 * Memutus sesi di mock backend. Query awal harus selesai dulu; kalau tidak, 401-nya memicu
 * redirect ke /login sebelum tes sempat bertindak.
 */
export async function endSession(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => fetch('/v1/auth/logout', { method: 'POST' }))
}

/** `signedInPage`: halaman yang sudah di /cases dengan sesi mock aktif (peran bawaan: supervisor). */
export const test = base.extend<{ signedInPage: Page }>({
  // Parameter kedua bernama `provide`: nama `use` memicu aturan react-hooks di ESLint.
  signedInPage: async ({ page }, provide) => {
    await page.goto('/cases')
    await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
    await provide(page)
  },
})

import type { Page } from '@playwright/test'
import { expect, test } from '../support'

/**
 * Makes GETs of `path` answer 500 until `recover` is called. Takes effect on the next load (the API
 * client keeps the `fetch` it saw at startup). The mock runs in a service worker, which
 * `page.route` cannot see, so `fetch` is wrapped instead.
 */
async function failGet(page: Page, path: string) {
  await page.addInitScript((target) => {
    const original = window.fetch
    let failing = true
    Object.assign(window, { recoverGet: () => (failing = false) })
    window.fetch = (input, init) => {
      const request = new Request(input, init)
      if (failing && request.method === 'GET' && new URL(request.url).pathname === target) {
        return Promise.resolve(
          Response.json({ code: 'internal', message: 'boom' }, { status: 500 }),
        )
      }
      return original(input, init)
    }
  }, path)
  return () => page.evaluate(() => (window as unknown as { recoverGet(): void }).recoverGet())
}

test('a 500 on the case list shows ErrorState and Retry recovers', async ({
  signedInPage: page,
}) => {
  const recover = await failGet(page, '/v1/cases')
  await page.goto('/cases')

  await expect(page.getByRole('alert').filter({ hasText: 'Gagal memuat data' })).toBeVisible()
  await recover()
  await page.getByRole('button', { name: 'Coba lagi' }).click()

  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Pratinjau case / }).first()).toBeVisible()
})

test('a 500 on case detail shows ErrorState and Retry recovers', async ({ signedInPage: page }) => {
  const recover = await failGet(page, '/v1/cases/case-00008')
  await page.goto('/cases/case-00008')

  await expect(page.getByRole('alert').filter({ hasText: 'Gagal memuat data' })).toBeVisible()
  await recover()
  await page.getByRole('button', { name: 'Coba lagi' }).click()

  await expect(page.getByText('CASE-2026-100008', { exact: true }).first()).toBeVisible()
})

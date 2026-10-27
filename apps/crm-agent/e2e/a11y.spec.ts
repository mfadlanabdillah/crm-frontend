import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/** Sesi mock hidup di memori halaman: pindah halaman lewat router, bukan `page.goto`. */
async function clientNavigate(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  )
  expect(summary).toEqual([])
}

test('login tanpa pelanggaran WCAG AA', async ({ page }) => {
  // Sesi mock aktif sejak awal, jadi /login langsung meneruskan; keluar lewat UI dulu.
  await page.goto('/cases')
  await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page.getByRole('button', { name: 'Masuk lewat SSO' })).toBeVisible()
  await expectNoViolations(page)
})

test.describe('setelah masuk', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cases')
    await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
  })

  test('daftar case', async ({ page }) => {
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await expectNoViolations(page)
  })

  test('detail case', async ({ page }) => {
    await clientNavigate(page, '/cases/case-00001')
    await expect(page.getByText('CASE-2026-100001', { exact: true }).first()).toBeVisible()
    await expect(page.getByLabel('Tulis balasan…')).toBeVisible()
    await expectNoViolations(page)
  })

  test('daftar dan detail customer', async ({ page }) => {
    await clientNavigate(page, '/customers')
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
    await expectNoViolations(page)

    await page.getByRole('row').nth(1).getByRole('link').click()
    await expect(page).toHaveURL(/\/customers\/cust-\d+$/)
    await expectNoViolations(page)
  })

  test('daftar case bisa dioperasikan dengan keyboard', async ({ page }) => {
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    const firstLink = page.getByRole('row').nth(1).getByRole('link').first()

    await firstLink.focus()
    await expect(firstLink).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/cases\/case-\d+$/)
  })
})

import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { clientNavigate, expect, test } from './support'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  )
  expect(summary).toEqual([])
}

test('login tanpa pelanggaran WCAG AA', async ({ signedInPage: page }) => {
  // Sesi mock aktif sejak awal, jadi /login langsung meneruskan; keluar lewat UI dulu.
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page.getByRole('button', { name: 'Masuk lewat SSO' })).toBeVisible()
  await expectNoViolations(page)
})

test.describe('setelah masuk', () => {
  test('daftar case', async ({ signedInPage: page }) => {
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    await expectNoViolations(page)
  })

  test('detail case', async ({ signedInPage: page }) => {
    await clientNavigate(page, '/cases/case-00001')
    await expect(page.getByText('CASE-2026-100001', { exact: true }).first()).toBeVisible()
    await expect(page.getByLabel('Tulis balasan…')).toBeVisible()
    await expectNoViolations(page)
  })

  test('daftar dan detail customer', async ({ signedInPage: page }) => {
    await clientNavigate(page, '/customers')
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
    await expectNoViolations(page)

    await page.getByRole('row').nth(1).getByRole('link').click()
    await expect(page).toHaveURL(/\/customers\/cust-\d+$/)
    await expectNoViolations(page)
  })

  test('daftar case bisa dioperasikan dengan keyboard', async ({ signedInPage: page }) => {
    await expect(page.getByRole('row').nth(1)).toBeVisible()
    const firstLink = page.getByRole('row').nth(1).getByRole('link').first()

    await firstLink.focus()
    await expect(firstLink).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/cases\/case-\d+$/)
  })
})

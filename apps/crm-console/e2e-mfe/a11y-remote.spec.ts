import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, moduleNav, openAs, test } from './support'

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
  const summary = violations.map(
    (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  )
  expect(summary).toEqual([])
}

test('Finance list and decision panel have no WCAG AA violations', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Finance' }).click()
  await expect(page.locator('.finance__table tbody tr').first()).toBeVisible()
  await expectNoViolations(page)

  await page.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Menunggu' })
  await expect(page.locator('.finance__table tbody tr').first()).toContainText('Menunggu')
  await page.getByRole('button', { name: 'Putuskan' }).first().click()
  await expect(page.getByLabel('Catatan keputusan')).toBeVisible()
  await expectNoViolations(page)
})

test('Investigator list and detail have no WCAG AA violations', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Investigator' }).click()
  await expect(page.locator('.investigator__table tbody tr').first()).toBeVisible()
  await expectNoViolations(page)

  await page.locator('.investigator__table tbody tr').first().getByRole('link').click()
  await expect(page.locator('.investigator__timeline')).toBeVisible()
  await expectNoViolations(page)
})

test('Monitor has no WCAG AA violations', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Monitor' }).click()
  await expect(page.locator('.monitor__table tbody tr').first()).toBeVisible()
  await expectNoViolations(page)
})

test('the customer profile with its case history has no WCAG AA violations', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Customer' }).click()
  // Wait for the customer table, not what is left of the case table during the route change.
  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  await page.getByRole('row').nth(1).getByRole('link').click()
  await expect(page.getByRole('heading', { name: 'Case terkait' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Case terkait' }).locator('..').getByRole('link').first(),
  ).toBeVisible()
  await expectNoViolations(page)
})

import type { Page } from '@playwright/test'
import { expect, expectNoViolations, test } from '../support'

const sidebar = (page: Page) => page.locator('#app-sidebar')
const width = async (page: Page) => (await sidebar(page).boundingBox())?.width
const moduleNav = (page: Page) => page.getByRole('navigation', { name: 'Modul' })

test('the sidebar collapses to an icon rail and expands again', async ({ signedInPage: page }) => {
  const collapse = page.getByRole('button', { name: 'Ciutkan sidebar' })
  await expect(collapse).toHaveAttribute('aria-expanded', 'true')
  await expect.poll(() => width(page)).toBe(256)

  await collapse.click()
  const expand = page.getByRole('button', { name: 'Perluas sidebar' })
  await expect(expand).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => width(page)).toBe(64)
  // The logo must keep its square: it once shrank when the hidden app name still took space.
  await expect
    .poll(async () => (await sidebar(page).getByText('CA', { exact: true }).boundingBox())?.width)
    .toBe(32)
  // The module's own sidebar content does not fit a rail, but the menu keeps its names.
  await expect(page.getByRole('navigation', { name: 'Antrean' })).toBeHidden()
  await expect(moduleNav(page).getByRole('link', { name: 'Case' })).toBeVisible()
  await expect(moduleNav(page).getByRole('link', { name: 'Customer' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Keluar' })).toBeVisible()

  await expand.click()
  await expect.poll(() => width(page)).toBe(256)
  await expect(page.getByRole('navigation', { name: 'Antrean' })).toBeVisible()
})

test('the choice is remembered after a reload', async ({ signedInPage: page }) => {
  await page.getByRole('button', { name: 'Ciutkan sidebar' }).click()
  await expect.poll(() => width(page)).toBe(64)

  await page.reload()

  await expect(page.getByRole('button', { name: 'Perluas sidebar' })).toBeVisible()
  await expect.poll(() => width(page)).toBe(64)
})

test('a collapsed menu item shows its name on hover and on keyboard focus', async ({
  signedInPage: page,
}) => {
  await page.getByRole('button', { name: 'Ciutkan sidebar' }).click()
  await expect.poll(() => width(page)).toBe(64)
  const link = moduleNav(page).getByRole('link', { name: 'Customer' })
  const hint = sidebar(page).locator('[aria-hidden="true"]', { hasText: 'Customer' })
  await expect(hint).toHaveCSS('opacity', '0')

  await link.hover()
  await expect(hint).toHaveCSS('opacity', '1')

  await page.mouse.move(700, 400)
  await expect(hint).toHaveCSS('opacity', '0')
  await link.focus()
  await expect(hint).toHaveCSS('opacity', '1')
})

test('the collapsed sidebar has no WCAG AA violations', async ({ signedInPage: page }) => {
  await page.getByRole('button', { name: 'Ciutkan sidebar' }).click()
  await expect.poll(() => width(page)).toBe(64)
  await moduleNav(page).getByRole('link', { name: 'Customer' }).hover()

  await expectNoViolations(page)
})

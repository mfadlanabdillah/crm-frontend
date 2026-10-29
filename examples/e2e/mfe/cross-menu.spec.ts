import type { Page } from '@playwright/test'
import { expect, moduleNav, openAs, test } from './support'

const CASE_ID = 'case-00010'
const CASE_CODE = 'CASE-2026-100010'

function waitForPatch(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().includes(`/v1/cases/${CASE_ID}`),
  )
}

test('a case escalated in Case shows up in Investigator, and the work flows back to Case', async ({
  page,
}) => {
  await openAs(page, 'supervisor', `/cases/${CASE_ID}`)
  await expect(page.getByText(CASE_CODE, { exact: true }).first()).toBeVisible()

  // Make sure the move below is a real change, whatever queue the seed gave this case.
  const queue = page.getByRole('combobox', { name: 'Antrean' })
  if ((await queue.inputValue()) === 'escalated') {
    const back = waitForPatch(page)
    await queue.selectOption({ label: 'Antrean L1' })
    await back
  }
  const moved = waitForPatch(page)
  await queue.selectOption({ label: 'Eskalasi' })
  await moved
  await expect(queue).toHaveValue('escalated')

  // Investigator (a separate app) lists it first: the list is sorted by last update.
  await moduleNav(page).getByRole('link', { name: 'Investigator' }).click()
  const row = page.getByRole('row', { name: new RegExp(CASE_CODE) })
  await expect(row).toBeVisible()
  await row.getByRole('link').click()
  await expect(page).toHaveURL(new RegExp(`/remote/investigator/case/${CASE_ID}$`))

  const actions = page.getByRole('region', { name: 'Tindakan' })
  await page.getByLabel('Catatan internal').fill('Catatan dari investigator')
  await page.getByRole('button', { name: 'Tambah catatan' }).click()
  await expect(page.getByRole('list', { name: 'Timeline' })).toContainText(
    'Catatan dari investigator',
  )

  const statusChanged = waitForPatch(page)
  await actions.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Menunggu' })
  await statusChanged

  // Back in Case: the note and the new status are there without a reload.
  await actions.getByRole('link', { name: 'Buka di Case' }).click()
  await expect(page).toHaveURL(new RegExp(`/cases/${CASE_ID}$`))
  await expect(page.getByText('Catatan dari investigator')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('pending')
  await expect(page.getByRole('combobox', { name: 'Antrean' })).toHaveValue('escalated')

  // Monitor (another app) links to the filtered case list of the host.
  await moduleNav(page).getByRole('link', { name: 'Monitor' }).click()
  await page.getByRole('link', { name: 'Eskalasi' }).click()
  await expect(page).toHaveURL(/\/cases\?.*queue=escalated/)
  await expect(page.getByRole('row').nth(1)).toBeVisible()
})

test('Monitor shows the same open-case figures as the Case sidebar', async ({ page }) => {
  await openAs(page, 'supervisor')
  const sidebar = await page
    .getByRole('link', { name: /^Eskalasi/ })
    .first()
    .innerText()

  await moduleNav(page).getByRole('link', { name: 'Monitor' }).click()
  const monitorRow = page
    .getByRole('table', { name: 'Monitor' })
    .locator('tbody tr', { hasText: 'Eskalasi' })
  await expect(monitorRow).toBeVisible()

  const digits = (text: string) => text.replace(/\D/g, '')
  expect(digits(await monitorRow.innerText())).toBe(digits(sidebar))
})

test('Monitor links the unassigned figure to the unassigned view of Case', async ({ page }) => {
  await openAs(page, 'supervisor')

  await moduleNav(page).getByRole('link', { name: 'Monitor' }).click()
  await page
    .getByRole('link', { name: /^[\d.]+$/ })
    .first()
    .click()

  await expect(page).toHaveURL(/\/cases\?.*view=unassigned/)
})

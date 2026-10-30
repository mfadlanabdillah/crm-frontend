import type { Page } from '@playwright/test'
import { expect, expectNoViolations, test } from '../support'

const CASE_ID = 'case-00010'
const CASE_CODE = 'CASE-2026-100010'

/**
 * Opens the case as a mock role (`?role=` is read by the dev mock). A hard load is fine because
 * nothing has been written yet; after any write, move only by clicks.
 */
async function openCaseAs(page: Page, role: 'l1' | 'l2') {
  await page.goto(`/cases/${CASE_ID}?role=${role}`)
  await expect(page.getByText(CASE_CODE, { exact: true }).first()).toBeVisible()
}

function waitForPatch(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().includes(`/v1/cases/${CASE_ID}`),
  )
}

test('an L2 agent moves a case from the L1 queue to the L2 queue', async ({ page }) => {
  await openCaseAs(page, 'l2')
  const queue = page.getByRole('combobox', { name: 'Antrean' })

  // Start from the L1 queue, whatever queue the seed gave this case.
  if ((await queue.inputValue()) !== 'l1') {
    const reset = waitForPatch(page)
    await queue.selectOption({ label: 'Antrean L1' })
    await reset
  }
  await expect(queue).toHaveValue('l1')

  const patch = waitForPatch(page)
  await queue.selectOption({ label: 'Antrean L2' })
  const response = await patch

  expect(response.status()).toBe(200)
  expect(response.request().postDataJSON()).toEqual({ queue: 'l2' })
  await expect(queue).toHaveValue('l2')
  // The confirmation is a toast from the shell, raised by the remote. Scan while it is on screen.
  // A reset above also raises one, so look at the newest.
  await expect(page.getByRole('status').filter({ hasText: 'Case diperbarui' }).last()).toBeVisible()
  await expectNoViolations(page)
  await expect(page.getByRole('region', { name: 'Timeline' })).toContainText(
    'Case dipindah ke Antrean L2.',
  )
})

test('an L1 agent has no queue control but keeps status and priority', async ({ page }) => {
  await openCaseAs(page, 'l1')

  // The controls render together, so the absence below is not a page that has not loaded yet.
  await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Prioritas' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Antrean' })).toHaveCount(0)
})

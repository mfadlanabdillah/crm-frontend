import type { Page } from '@playwright/test'
import { clientNavigate, expect, test } from '../support'

const CASE_ID = 'case-00007'
const CASE_CODE = 'CASE-2026-100007'

function timeline(page: Page) {
  return page.getByRole('region', { name: 'Timeline' })
}

function waitForPatch(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === 'PATCH' && response.url().includes(`/v1/cases/${CASE_ID}`),
  )
}

test.beforeEach(async ({ signedInPage: page }) => {
  await clientNavigate(page, `/cases/${CASE_ID}`)
  await expect(page.getByText(CASE_CODE, { exact: true }).first()).toBeVisible()
})

test('mengubah status mengirim PATCH, menampilkan toast dan entri Timeline', async ({
  signedInPage: page,
}) => {
  const status = page.getByRole('combobox', { name: 'Status' })
  const target = (await status.inputValue()) === 'resolved' ? 'closed' : 'resolved'

  const patch = waitForPatch(page)
  await status.selectOption(target)

  expect((await patch).request().postDataJSON()).toEqual({ status: target })
  await expect(status).toHaveValue(target)
  await expect(page.getByRole('status').filter({ hasText: 'Case diperbarui' }).last()).toBeVisible()
  await expect(timeline(page)).toContainText(`Status diubah menjadi ${target}.`)
})

test('mengubah prioritas mengirim PATCH dan menampilkan entri Timeline', async ({
  signedInPage: page,
}) => {
  const priority = page.getByRole('combobox', { name: 'Prioritas' })
  const target = (await priority.inputValue()) === 'urgent' ? 'low' : 'urgent'

  const patch = waitForPatch(page)
  await priority.selectOption(target)

  expect((await patch).request().postDataJSON()).toEqual({ priority: target })
  await expect(priority).toHaveValue(target)
  await expect(timeline(page)).toContainText(`Prioritas diubah menjadi ${target}.`)
})

test('"Ambil case ini" menjadikan agen yang masuk sebagai PIC', async ({ signedInPage: page }) => {
  const assign = page.getByRole('button', { name: 'Ambil case ini' })
  await expect(assign).toBeEnabled()

  const patch = waitForPatch(page)
  await assign.click()

  expect((await patch).request().postDataJSON()).toEqual({ assigneeId: 'user-supervisor' })
  await expect(page.getByRole('banner').getByText('Sari Wulandari')).toBeVisible()
  await expect(assign).toBeDisabled()
  await expect(timeline(page)).toContainText('Case di-assign ke Sari Wulandari.')
})

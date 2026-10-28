import { expect, moduleNav, openAs, test } from './support'

test('Finance approves and rejects refund requests, and keeps the decision', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Finance' }).click()

  const filter = page.getByRole('combobox', { name: 'Status' })
  const rows = page.locator('.finance__table tbody tr')
  await expect(rows.first()).toBeVisible()
  await filter.selectOption({ label: 'Menunggu' })
  await expect(rows.first()).toContainText('Menunggu')

  // Approve: the buttons stay disabled until the note is long enough.
  const approvedCode = (await rows.first().locator('td').first().innerText()).trim()
  await rows.first().getByRole('button', { name: 'Putuskan' }).click()
  const approve = page.getByRole('button', { name: 'Setujui' })
  await expect(approve).toBeDisabled()
  await page.getByLabel('Catatan keputusan').fill('ok')
  await expect(approve).toBeDisabled()
  await page.getByLabel('Catatan keputusan').fill('Sesuai bukti foto')
  await approve.click()
  await expect(page.locator('.finance__table')).not.toContainText(approvedCode)

  // Reject the next one.
  const rejectedCode = (await rows.first().locator('td').first().innerText()).trim()
  await rows.first().getByRole('button', { name: 'Putuskan' }).click()
  await page.getByLabel('Catatan keputusan').fill('Bukti tidak memadai')
  await page.getByRole('button', { name: 'Tolak' }).click()
  await expect(page.locator('.finance__table')).not.toContainText(rejectedCode)

  // Both decisions are kept, with who decided.
  await filter.selectOption({ label: 'Disetujui' })
  await expect(page.locator('.finance__table')).toContainText(approvedCode)
  await expect(page.locator('.finance__table')).toContainText('Diputuskan oleh Sari Wulandari')
  await filter.selectOption({ label: 'Ditolak' })
  await expect(page.locator('.finance__table')).toContainText(rejectedCode)
})

test('a refund request links to its case in the host', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Finance' }).click()

  const rows = page.locator('.finance__table tbody tr')
  // Wait for the Finance table: the Case list has a Status select too.
  await expect(rows.first()).toBeVisible()
  await page.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Menunggu' })
  await expect(rows.first()).toContainText('Menunggu')
  await rows.first().getByRole('button', { name: 'Putuskan' }).click()
  await page.getByRole('link', { name: /^Buka case CASE-/ }).click()

  await expect(page).toHaveURL(/\/cases\/case-\d+$/)
  await expect(page.getByLabel('Tulis balasan…')).toBeVisible()
})

test('Finance stays in the menu of a supervisor only', async ({ page }) => {
  await openAs(page, 'l2')

  await expect(moduleNav(page).getByRole('link', { name: 'Finance' })).toHaveCount(0)
})

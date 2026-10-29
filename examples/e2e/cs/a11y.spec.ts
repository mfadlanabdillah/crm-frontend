import { clientNavigate, expect, expectNoViolations, test } from '../support'

test('case list', async ({ signedInPage: page }) => {
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await expectNoViolations(page)
})

test('case detail', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/cases/case-00001')
  await expect(page.getByText('CASE-2026-100001', { exact: true }).first()).toBeVisible()
  await expect(page.getByLabel('Tulis balasan…')).toBeVisible()
  await expectNoViolations(page)
})

test('create case form, with and without errors', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/cases/new')
  await expect(page.getByLabel('Subjek', { exact: true })).toBeVisible()
  await expectNoViolations(page)

  await page.getByRole('button', { name: 'Buat case' }).click()
  await expect(page.getByText('Subjek minimal 3 karakter.')).toBeVisible()
  await expectNoViolations(page)
})

test('customer list and detail', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/customers')
  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  await expectNoViolations(page)

  await page.getByRole('row').nth(1).getByRole('link').click()
  await expect(page).toHaveURL(/\/customers\/cust-\d+$/)
  await expectNoViolations(page)
})

test('the case list works with the keyboard', async ({ signedInPage: page }) => {
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  const firstLink = page.getByRole('row').nth(1).getByRole('link').first()

  await firstLink.focus()
  await expect(firstLink).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/cases\/case-\d+$/)
})

import { expect, test } from '../support'

test('creating a case opens its detail page', async ({ signedInPage: page }) => {
  await page.getByRole('link', { name: 'Case baru' }).click()
  await expect(page).toHaveURL(/\/cases\/new$/)

  await page.getByLabel('Subjek', { exact: true }).fill('Paket rusak saat diterima')
  await page.getByLabel('Deskripsi', { exact: true }).fill('Kardus penyok dan isi pecah.')
  await page.getByRole('combobox', { name: 'Prioritas' }).selectOption({ label: 'Tinggi' })
  await page.getByRole('combobox', { name: 'Antrean' }).selectOption({ label: 'Antrean L2' })
  await page.getByRole('button', { name: 'Buat case' }).click()

  await expect(page).toHaveURL(/\/cases\/case-\d+$/)
  await expect(page.getByRole('heading', { name: 'Paket rusak saat diterima' })).toBeVisible()
})

test('an invalid form shows errors and stays on the page', async ({ signedInPage: page }) => {
  await page.getByRole('link', { name: 'Case baru' }).click()
  await page.getByRole('button', { name: 'Buat case' }).click()

  await expect(page.getByText('Subjek minimal 3 karakter.')).toBeVisible()
  await expect(page.getByLabel('Subjek', { exact: true })).toBeFocused()
  await expect(page).toHaveURL(/\/cases\/new$/)
})

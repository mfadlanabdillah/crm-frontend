import { clientNavigate, expect, test } from '../support'

test('pencarian dan halaman daftar customer tersimpan di URL', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/customers')
  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  const search = page.getByLabel('Cari nama atau kota…')
  const rows = page.getByRole('row')
  const firstRow = rows.nth(1)

  await page.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText(/^Halaman 2 dari/)).toBeVisible()

  const name = (await firstRow.getByRole('link').innerText()).trim()
  await search.fill(name)
  await page.getByRole('button', { name: 'Cari', exact: true }).click()

  // Pencarian kembali ke halaman 1 dan hanya menyisakan yang cocok.
  await expect(page).toHaveURL(/q=/)
  await expect(page).not.toHaveURL(/page=2/)
  await expect(page.getByText(/^Halaman 1 dari/)).toBeVisible()
  await expect(rows.nth(1).getByRole('link', { name, exact: true })).toBeVisible()

  await search.fill('zzzz-tidak-ada')
  await page.getByRole('button', { name: 'Cari', exact: true }).click()
  await expect(page.getByText('Belum ada data')).toBeVisible()
})

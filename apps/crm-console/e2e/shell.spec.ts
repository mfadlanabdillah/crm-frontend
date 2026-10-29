import { expect, test } from './support'

// The config points the shell at a remote that does not exist, so nothing loads.
test('a remote that does not load is reported, and the shell still works', async ({
  signedInPage: page,
}) => {
  await expect(page.getByRole('alert')).toContainText('crm_missing')
  await expect(page.getByRole('button', { name: 'Muat ulang' })).toBeVisible()
  await expect(page.getByText('Belum ada menu')).toBeVisible()
})

test('the start page stays put when no module is visible', async ({ signedInPage: page }) => {
  await expect(page).toHaveURL(/localhost:\d+\/$/)
  await expect(page.getByText('Belum ada menu')).toBeVisible()
})

test('signing out leads to login', async ({ signedInPage: page }) => {
  await page.getByRole('button', { name: 'Keluar' }).click()

  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('button', { name: 'Masuk lewat SSO' })).toBeVisible()
})

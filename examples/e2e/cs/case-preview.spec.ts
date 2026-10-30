import { expect, test } from '../support'

test('pratinjau case terbuka dari daftar, tertutup dengan Escape, dan bisa dibuka lewat URL', async ({
  signedInPage: page,
}) => {
  await page
    .getByRole('button', { name: /^Pratinjau case / })
    .first()
    .click()

  const drawer = page.getByRole('dialog', { name: 'Pratinjau case' })
  await expect(drawer).toBeVisible()
  await expect(page).toHaveURL(/[?&]preview=case-/)
  await expect(drawer.getByRole('link', { name: 'Buka detail case' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(page).not.toHaveURL(/preview=/)

  await page.goto('/cases?preview=case-00001')
  await expect(page.getByRole('dialog', { name: 'Pratinjau case' })).toBeVisible()
})

import { expect, moduleNav, openAs, test } from './support'

test('a customer profile shows the case history and links to each case', async ({ page }) => {
  await openAs(page, 'supervisor')
  await moduleNav(page).getByRole('link', { name: 'Customer' }).click()

  // Wait for the customer table, not what is left of the case table during the route change.
  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  // The first customers own more than one case in the mock data.
  const firstCustomer = page.getByRole('row').nth(1).getByRole('link')
  await expect(firstCustomer).toBeVisible()
  await firstCustomer.click()
  await expect(page).toHaveURL(/\/customers\/cust-\d+$/)

  const history = page.getByRole('heading', { name: 'Case terkait' }).locator('..')
  await expect(history.getByRole('link').first()).toBeVisible()
  expect(await history.getByRole('link').count()).toBeGreaterThan(1)

  await history.getByRole('link').first().click()
  await expect(page).toHaveURL(/\/cases\/case-\d+$/)
  await expect(page.getByLabel('Tulis balasan…')).toBeVisible()
})

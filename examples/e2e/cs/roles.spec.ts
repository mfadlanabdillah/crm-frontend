import { expect, test } from '../support'

test('an L1 agent is sent back from /customers and has no Customer menu', async ({ page }) => {
  await page.goto('/customers?role=l1')

  await expect.poll(() => new URL(page.url()).pathname).toBe('/cases')
  const menu = page.getByRole('navigation', { name: 'Modul' })
  await expect(menu.getByRole('link', { name: 'Case' })).toBeVisible()
  await expect(menu.getByRole('link', { name: 'Customer' })).toHaveCount(0)
})

test('an L2 agent keeps /customers', async ({ page }) => {
  await page.goto('/customers?role=l2')

  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/customers')
})

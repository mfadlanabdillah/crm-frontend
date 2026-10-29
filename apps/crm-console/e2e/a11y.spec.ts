import { clientNavigate, expect, expectNoViolations, test } from './support'

test('login has no WCAG AA violations', async ({ signedInPage: page }) => {
  // The mock session is active from the start, so /login would forward; sign out through the UI.
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page.getByRole('button', { name: 'Masuk lewat SSO' })).toBeVisible()
  await expectNoViolations(page)
})

test('the start page with no module has no WCAG AA violations', async ({ signedInPage: page }) => {
  await expect(page.getByText('Belum ada menu')).toBeVisible()
  await expectNoViolations(page)
})

test('design system gallery: every shared component and state', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/design-system')
  await expect(page.getByRole('heading', { name: 'Design system' })).toBeVisible()
  await expectNoViolations(page)
})

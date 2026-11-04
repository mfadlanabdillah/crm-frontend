import { createSignedInTest, expect } from '../../apps/crm-console/e2e/support'

export {
  clientNavigate,
  endSession,
  expect,
  expectNoViolations,
} from '../../apps/crm-console/e2e/support'

/** The CS journeys start signed in on /cases, once the Case screen is up. */
export const test = createSignedInTest('/cases', async (page) => {
  const heading = page.getByRole('heading', { name: 'Case', exact: true }).first()
  const loadFailed = page.getByText('Sebagian layar gagal dimuat')
  await heading.or(loadFailed).waitFor()
  if (await loadFailed.isVisible()) {
    throw new Error('CS remote "crm_cs" did not load: the shell shows its load-failed alert.')
  }
  await expect(heading).toBeVisible()
})

import { createSignedInTest, expect } from '../../apps/crm-console/e2e/support'

export {
  clientNavigate,
  endSession,
  expect,
  expectNoViolations,
} from '../../apps/crm-console/e2e/support'

/** The CS journeys start signed in on /cases, once the Case screen is up. */
export const test = createSignedInTest('/cases', (page) =>
  expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible(),
)

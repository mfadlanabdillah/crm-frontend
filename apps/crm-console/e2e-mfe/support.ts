import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export { expect, test } from '@playwright/test'

export type MockRole = 'l1' | 'l2' | 'supervisor'

export function moduleNav(page: Page) {
  return page.getByRole('navigation', { name: 'Modul' })
}

/**
 * Opens the app as a mock role (`?role=` is read by the dev mock). A hard load is fine here because
 * nothing has been written yet; after any write, move only by clicks. Mock data lives in page
 * memory, so `page.goto` would reset it. The menu is complete once it shows, because the host waits
 * for its remotes before rendering.
 */
export async function openAs(page: Page, role: MockRole, path = '/cases') {
  await page.goto(`${path}${path.includes('?') ? '&' : '?'}role=${role}`)
  await expect(moduleNav(page).getByRole('link', { name: 'Case' })).toBeVisible()
}

export async function menuItems(page: Page): Promise<string[]> {
  const links = await moduleNav(page).getByRole('link').allInnerTexts()
  return links.map((text) => text.trim())
}

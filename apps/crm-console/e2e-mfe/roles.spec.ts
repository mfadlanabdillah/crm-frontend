import { expect, menuItems, openAs, test } from './support'

test('each role sees only its own menus', async ({ browser }) => {
  const expected = {
    l1: ['Case'],
    l2: ['Case', 'Customer', 'Investigator'],
    supervisor: ['Case', 'Customer', 'Finance', 'Investigator', 'Monitor'],
  } as const

  for (const [role, menus] of Object.entries(expected)) {
    const page = await (await browser.newContext({ locale: 'id-ID' })).newPage()
    await openAs(page, role as keyof typeof expected)
    expect(await menuItems(page), role).toEqual(menus)
    await page.close()
  }
})

test('a role without the permission is sent back from a remote URL', async ({ page }) => {
  await openAs(page, 'l1', '/remote/investigator')

  await expect(page).toHaveURL(/\/cases/)
})

test('L2 can open Investigator but not Finance or Monitor', async ({ browser }) => {
  for (const [path, allowed] of [
    ['/remote/investigator', true],
    ['/remote/finance', false],
    ['/remote/monitor', false],
  ] as const) {
    const page = await (await browser.newContext({ locale: 'id-ID' })).newPage()
    await openAs(page, 'l2', path)
    // The URL keeps the ?role= query, so compare the path only.
    await expect.poll(() => new URL(page.url()).pathname).toBe(allowed ? path : '/cases')
    await page.close()
  }
})

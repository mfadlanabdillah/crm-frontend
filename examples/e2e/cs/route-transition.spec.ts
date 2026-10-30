import type { Page } from '@playwright/test'
import { expect, test } from '../support'

type CountingWindow = Window & { __viewTransitions?: number }

/** Counts calls to the browser's view transition API; the router calls it when a page changes. */
async function countViewTransitions(page: Page) {
  await page.evaluate(() => {
    const target = window as CountingWindow
    target.__viewTransitions = 0
    const original = document.startViewTransition.bind(document)
    document.startViewTransition = (...args) => {
      target.__viewTransitions = (target.__viewTransitions ?? 0) + 1
      return original(...args)
    }
  })
  return () => page.evaluate(() => (window as CountingWindow).__viewTransitions ?? 0)
}

async function filterTheList(page: Page) {
  await page
    .getByRole('navigation', { name: 'Antrean' })
    .getByRole('link', { name: /Antrean L1/ })
    .click()
  await expect(page).toHaveURL(/queue=l1/)
}

async function changePage(page: Page) {
  await page
    .getByRole('navigation', { name: 'Modul' })
    .getByRole('link', { name: 'Customer' })
    .click()
  await expect(page).toHaveURL(/\/customers/)
}

test.describe('with no motion preference', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('changing page runs a view transition, filtering the list does not', async ({
    signedInPage: page,
  }) => {
    const transitions = await countViewTransitions(page)

    await filterTheList(page)
    expect(await transitions()).toBe(0)

    await changePage(page)
    await expect.poll(transitions).toBeGreaterThan(0)
  })
})

test('with reduced motion no navigation runs a view transition', async ({ signedInPage: page }) => {
  const transitions = await countViewTransitions(page)

  await filterTheList(page)
  await changePage(page)

  expect(await transitions()).toBe(0)
})

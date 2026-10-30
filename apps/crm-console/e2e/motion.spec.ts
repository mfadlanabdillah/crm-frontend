import type { Page } from '@playwright/test'
import { clientNavigate, expect, test } from './support'

async function readMotion(page: Page) {
  const button = page.getByRole('button', { name: 'Keluar' })
  return {
    token: await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--motion-base').trim(),
    ),
    transition: await button.evaluate((element) =>
      parseFloat(getComputedStyle(element).transitionDuration),
    ),
  }
}

test('reduced motion zeroes the motion tokens and cuts component transitions', async ({
  signedInPage: page,
}) => {
  await clientNavigate(page, '/design-system')
  await expect(page.getByRole('heading', { name: 'Design system' })).toBeVisible()

  // The Playwright config turns reduced motion on for every test.
  const { token, transition } = await readMotion(page)
  expect(token).toBe('0ms')
  expect(transition).toBeLessThan(0.001)
})

test('with no motion preference the tokens and the Button transition are live', async ({
  signedInPage: page,
}) => {
  await clientNavigate(page, '/design-system')
  await expect(page.getByRole('heading', { name: 'Design system' })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  const { token, transition } = await readMotion(page)
  expect(token).toBe('200ms')
  expect(transition).toBeCloseTo(0.15, 2)
})

test('a value that changes flashes, then settles', async ({ signedInPage: page }) => {
  await clientNavigate(page, '/design-system')
  const value = page.getByTestId('change-flash')
  await expect(value).not.toHaveClass(/animate-change-flash/)

  await page.getByRole('button', { name: 'Change the value' }).click()

  await expect(value).toHaveClass(/animate-change-flash/)
  await expect(value).toHaveCSS('animation-name', 'change-flash')
  await expect(value).not.toHaveClass(/animate-change-flash/)
})

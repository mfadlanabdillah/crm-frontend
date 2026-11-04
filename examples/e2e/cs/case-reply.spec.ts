import type { Page } from '@playwright/test'
import { clientNavigate, expect, test } from '../support'

const CASE_ID = 'case-00006'
const CASE_CODE = 'CASE-2026-100006'

function editor(page: Page) {
  return page.getByLabel('Tulis balasan…')
}

function timeline(page: Page) {
  return page.getByRole('region', { name: 'Timeline' })
}

async function openCase(page: Page) {
  await clientNavigate(page, `/cases/${CASE_ID}`)
  await expect(page.getByText(CASE_CODE, { exact: true }).first()).toBeVisible()
}

async function send(page: Page, text: string) {
  await editor(page).click()
  await page.keyboard.type(text)
  await page.getByRole('button', { name: 'Kirim' }).click()
}

test('balasan ke customer masuk Timeline, editor dan draft dikosongkan', async ({
  signedInPage: page,
}) => {
  await openCase(page)
  await send(page, 'Balasan untuk customer')

  await expect(page.getByRole('status').filter({ hasText: 'Balasan terkirim' })).toBeVisible()
  await expect(timeline(page)).toContainText('Balasan untuk customer')
  await expect(
    timeline(page).getByRole('listitem').filter({ hasText: 'Balasan untuk customer' }),
  ).toContainText('Balas customer')
  await expect(editor(page)).toHaveText('')

  // Draft sudah terhapus: kembali ke case ini tidak memulihkan teks lama.
  await clientNavigate(page, '/cases')
  await openCase(page)
  await expect(editor(page)).toHaveText('')
})

test('catatan internal masuk Timeline sebagai catatan internal', async ({ signedInPage: page }) => {
  await openCase(page)
  await page.getByRole('button', { name: 'Tim internal' }).click()
  await send(page, 'Catatan untuk tim')

  await expect(page.getByRole('status').filter({ hasText: 'Balasan terkirim' })).toBeVisible()
  await expect(timeline(page)).toContainText('Catatan untuk tim')
  await expect(
    timeline(page).getByRole('listitem').filter({ hasText: 'Catatan untuk tim' }),
  ).toContainText('Catatan internal')
  await expect(editor(page)).toHaveText('')
})

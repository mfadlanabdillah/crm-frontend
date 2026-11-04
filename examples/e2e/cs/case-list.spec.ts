import type { Page } from '@playwright/test'
import { expect, test } from '../support'

function total(page: Page) {
  return page.getByRole('search').getByText(/^[\d.,]+ case$/)
}

test('filter, pencarian, dan halaman tersimpan di URL dan pulih saat dimuat ulang', async ({
  signedInPage: page,
}) => {
  const all = await total(page).innerText()

  await page.getByRole('combobox', { name: 'Status' }).selectOption('pending')
  await expect(page).toHaveURL(/status=pending/)
  await page.getByRole('combobox', { name: 'Antrean' }).selectOption('l2')
  await expect(page).toHaveURL(/queue=l2/)
  await expect(total(page)).not.toHaveText(all)

  await page.getByLabel('Cari kode, subjek, atau nama customer').fill('a')
  await page.getByRole('button', { name: 'Cari', exact: true }).click()
  await expect(page).toHaveURL(/q=a(&|$)/)

  await page.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText(/^Halaman 2 dari/)).toBeVisible()

  // Mengubah filter kembali ke halaman 1.
  await page.getByRole('combobox', { name: 'Status' }).selectOption('open')
  await expect(page.getByText(/^Halaman 1 dari/)).toBeVisible()

  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('open')
  await expect(page.getByRole('combobox', { name: 'Antrean' })).toHaveValue('l2')
  await expect(page.getByLabel('Cari kode, subjek, atau nama customer')).toHaveValue('a')

  await page.getByRole('button', { name: 'Bersihkan' }).click()
  await expect(page).not.toHaveURL(/status=|queue=|q=/)
  await expect(page.getByRole('combobox', { name: 'Status' })).toHaveValue('')
})

test('nilai URL yang usang atau tidak valid jatuh ke default tanpa error', async ({
  signedInPage: page,
}) => {
  await page.goto('/cases?sort=bogus&page=abc&pageSize=3&status=&view=nope')

  await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
  await expect(page.getByText(/^Halaman 1 dari/)).toBeVisible()
  await expect(page.getByLabel('Baris per halaman')).toHaveValue('25')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Pratinjau case / }).first()).toBeVisible()
})

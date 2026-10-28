import type { Page } from '@playwright/test'
import { expect, test } from './support'

function moduleNav(page: Page) {
  return page.getByRole('navigation', { name: 'Modul' })
}

test('pindah modul lewat sidebar: daftar customer lalu detail', async ({ signedInPage: page }) => {
  await moduleNav(page).getByRole('link', { name: 'Customer' }).click()

  await expect(page).toHaveURL(/\/customers$/)
  await expect(page.getByRole('heading', { name: 'Customer', exact: true }).first()).toBeVisible()
  await expect(moduleNav(page).getByRole('link', { name: 'Customer' })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // Tunggu tabel customer (bukan sisa tabel case saat route masih berpindah).
  await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  const firstCustomer = page.getByRole('row').nth(1).getByRole('link')
  const name = (await firstCustomer.textContent()) ?? ''
  await firstCustomer.click()

  await expect(page).toHaveURL(/\/customers\/cust-\d+$/)
  await expect(page.getByRole('heading', { name })).toBeVisible()
  // Supervisor memiliki pii.view.full, jadi nomor telepon tampil utuh (tanpa bintang).
  await expect(page.getByText(/^0812\d{8}$/)).toBeVisible()
})

test('tab workspace case hanya tampil di modul Case', async ({ signedInPage: page }) => {
  await page.goto('/cases/case-00001')
  await expect(page.getByText('CASE-2026-100001', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Case terbuka' })).toBeVisible()

  await moduleNav(page).getByRole('link', { name: 'Customer' }).click()
  await expect(page).toHaveURL(/\/customers$/)
  await expect(page.getByRole('navigation', { name: 'Case terbuka' })).toHaveCount(0)
})

test('dari detail case ke profil customer (tautan lintas modul)', async ({
  signedInPage: page,
}) => {
  await page.goto('/cases/case-00001')
  await page.getByRole('link', { name: 'Lihat profil customer' }).click()

  await expect(page).toHaveURL(/\/customers\/cust-1$/)
  await expect(page.getByRole('button', { name: 'Kembali ke daftar customer' })).toBeVisible()
})

test.describe('layar kecil', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('navigasi modul tersedia di layar kecil', async ({ signedInPage: page }) => {
    const nav = page.getByRole('navigation', { name: 'Modul' })
    await expect(nav).toBeVisible()

    await nav.getByRole('link', { name: 'Customer' }).click()
    await expect(page).toHaveURL(/\/customers$/)
    await expect(page.getByRole('columnheader', { name: 'Nama' })).toBeVisible()
  })
})

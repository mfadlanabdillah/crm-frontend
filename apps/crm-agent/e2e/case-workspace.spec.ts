import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

/**
 * Sesi mock hidup di memori halaman dan dibuat ulang setiap reload, jadi
 * perpindahan halaman di tengah alur harus lewat router, bukan `page.goto`.
 */
async function clientNavigate(page: Page, path: string) {
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

async function openCase(page: Page, caseId: string, code: string) {
  await clientNavigate(page, `/cases/${caseId}`)
  await expect(page.getByText(code, { exact: true }).first()).toBeVisible()
}

function editor(page: Page) {
  return page.getByLabel('Tulis balasan…')
}

function tabs(page: Page) {
  return page.getByRole('navigation', { name: 'Case terbuka' })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/cases')
  await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()
})

test('draft balasan tidak terbawa saat pindah case lewat tab', async ({ page }) => {
  await openCase(page, 'case-00001', 'CASE-2026-100001')
  await openCase(page, 'case-00002', 'CASE-2026-100002')

  await editor(page).click()
  await page.keyboard.type('Draf khusus untuk case 2')
  await expect(editor(page)).toContainText('Draf khusus untuk case 2')

  await tabs(page).getByRole('link', { name: 'CASE-2026-100001' }).click()

  await expect(page).toHaveURL(/\/cases\/case-00001$/)
  await expect(editor(page)).not.toContainText('Draf khusus untuk case 2')
  await expect(editor(page)).toHaveText('')
})

test('sesi habis saat kirim balasan: ke login, lalu kembali ke case setelah masuk', async ({
  page,
}) => {
  await openCase(page, 'case-00003', 'CASE-2026-100003')

  await page.getByRole('button', { name: 'Tim internal' }).click()
  await editor(page).click()
  await page.keyboard.type('Balasan yang akan gagal')

  // Putus sesi di mock backend supaya POST replies dibalas 401.
  await page.evaluate(() => fetch('/v1/auth/logout', { method: 'POST' }))
  await page.getByRole('button', { name: 'Kirim' }).click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fcases%2Fcase-00003/)

  await page.getByRole('button', { name: 'Masuk lewat SSO' }).click()
  await expect(page).toHaveURL(/\/cases\/case-00003$/)
  await expect(editor(page)).toContainText('Balasan yang akan gagal')
  await expect(page.getByRole('button', { name: 'Tim internal' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('logout mengosongkan tab workspace sesi sebelumnya', async ({ page }) => {
  await openCase(page, 'case-00001', 'CASE-2026-100001')
  await expect(tabs(page).getByRole('link', { name: 'CASE-2026-100001' })).toBeVisible()

  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByRole('button', { name: 'Masuk lewat SSO' }).click()
  await expect(page).toHaveURL(/\/cases(\?|$)/)

  await openCase(page, 'case-00002', 'CASE-2026-100002')
  await expect(tabs(page).getByRole('link')).toHaveText(['CASE-2026-100002'])
})

test('login kembali ke halaman yang dituju lewat ?redirect=', async ({ page }) => {
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL(/\/login/)

  // Guard mengarahkan ke /login?redirect=/cases/case-00004.
  await clientNavigate(page, '/cases/case-00004')
  await expect(page).toHaveURL(/\/login\?redirect=/)

  await page.getByRole('button', { name: 'Masuk lewat SSO' }).click()
  await expect(page).toHaveURL(/\/cases\/case-00004$/)
  await expect(page.getByText('CASE-2026-100004', { exact: true }).first()).toBeVisible()
})

test('kembali dari SSO dengan sesi aktif langsung diteruskan ke ?redirect=', async ({ page }) => {
  // Sesi mock sudah aktif setelah reload, sama seperti setelah callback SSO.
  await page.goto('/login?redirect=%2Fcases%2Fcase-00005')
  await expect(page).toHaveURL(/\/cases\/case-00005$/)
  await expect(page.getByText('CASE-2026-100005', { exact: true }).first()).toBeVisible()
})

test('redirect ke domain lain diabaikan', async ({ page }) => {
  await page.goto('/login?redirect=%2F%2Fevil.example%2Fphish')
  await expect(page).toHaveURL(/^http:\/\/localhost:5173\/cases(\?|$)/)
  await expect(page.getByText('Terjadi kesalahan')).toHaveCount(0)
})

test('logout di satu tab membawa tab lain ke login', async ({ page, context }) => {
  await page.goto('/cases')
  await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()

  const other = await context.newPage()
  await other.goto('/cases')
  await expect(other.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Keluar' }).click()

  await expect(page).toHaveURL(/\/login/)
  await expect(other).toHaveURL(/\/login\?redirect=%2Fcases/)
})

test('sesi berakhir saat memuat data membawa agen ke login dengan redirect', async ({ page }) => {
  await page.goto('/cases')
  await expect(page.getByRole('heading', { name: 'Case', exact: true }).first()).toBeVisible()

  // Query awal harus selesai dulu, kalau tidak 401-nya sudah memicu redirect sebelum klik.
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => fetch('/v1/auth/logout', { method: 'POST' }))
  await page
    .getByRole('navigation', { name: 'Modul' })
    .getByRole('link', { name: 'Customer' })
    .click()

  await expect(page).toHaveURL(/\/login\?redirect=%2Fcustomers/)
})

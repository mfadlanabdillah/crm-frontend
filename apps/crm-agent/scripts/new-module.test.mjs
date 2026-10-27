import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let sandbox

/** Salinan minimal app: skrip menghitung path dari lokasinya sendiri, jadi repo asli tidak tersentuh. */
beforeEach(() => {
  sandbox = mkdtempSync(path.join(tmpdir(), 'new-module-'))
  mkdirSync(path.join(sandbox, 'scripts'))
  cpSync(path.join(appRoot, 'scripts/new-module.mjs'), path.join(sandbox, 'scripts/new-module.mjs'))
  mkdirSync(path.join(sandbox, 'src/app/modules'), { recursive: true })
  cpSync(
    path.join(appRoot, 'src/app/modules/registry.ts'),
    path.join(sandbox, 'src/app/modules/registry.ts'),
  )
})

afterEach(() => rmSync(sandbox, { recursive: true, force: true }))

function run(...args) {
  try {
    execFileSync('node', [path.join(sandbox, 'scripts/new-module.mjs'), ...args], {
      env: { ...process.env, NEW_MODULE_SKIP_POSTPROCESS: '1' },
      stdio: 'pipe',
    })
    return { ok: true, stderr: '' }
  } catch (error) {
    return { ok: false, stderr: String(error.stderr) }
  }
}

const read = (rel) => readFileSync(path.join(sandbox, rel), 'utf8')

describe('new:module', () => {
  it('membuat kerangka modul, route tipis, dan mendaftarkannya di registry', () => {
    expect(run('invoice', '--path', '/invoices', '--icon', 'Receipt').ok).toBe(true)

    for (const file of [
      'module.ts',
      'public.ts',
      'api/invoice.ts',
      'queries/keys.ts',
      'schemas/search.ts',
      'pages/InvoiceListPage.tsx',
    ]) {
      expect(existsSync(path.join(sandbox, 'src/modules/invoice', file)), file).toBe(true)
    }
    expect(read('src/modules/invoice/module.ts')).toContain("basePath: '/invoices'")
    expect(read('src/app/modules/registry.ts')).toContain("from '@/modules/invoice/module'")
    expect(read('src/app/modules/registry.ts')).toMatch(/invoiceModule\]/)
    expect(read('src/routes/_authenticated/invoices/index.tsx')).not.toContain('requirePermission')
  })

  it('--permission mengisi module.ts dan memasang guard di route', () => {
    expect(run('invoice', '--permission', 'invoice.view').ok).toBe(true)

    expect(read('src/modules/invoice/module.ts')).toContain("permission: 'invoice.view',")
    expect(read('src/routes/_authenticated/invoices/index.tsx')).toContain(
      "beforeLoad: requirePermission('invoice.view')",
    )
  })

  it('menolak id, path, dan permission yang bentuknya salah', () => {
    expect(run('Invoice').stderr).toContain('kebab-case')
    expect(run('invoice', '--path', 'invoices').stderr).toContain('--path')
    expect(run('invoice', '--permission', 'invoice').stderr).toContain('--permission')
    expect(existsSync(path.join(sandbox, 'src/modules/invoice'))).toBe(false)
  })

  it('menolak modul yang sudah ada dan tidak mendaftar dua kali', () => {
    expect(run('invoice').ok).toBe(true)

    const second = run('invoice')

    expect(second.ok).toBe(false)
    expect(second.stderr).toContain('sudah ada')
    expect(read('src/app/modules/registry.ts').match(/invoiceModule/g)).toHaveLength(2)
  })
})

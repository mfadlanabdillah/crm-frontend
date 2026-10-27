import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let root
let sandbox
let resourcesFile

/** Minimal copy of the app: the script derives its paths from its own location, so the real repo stays untouched. */
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'new-module-'))
  sandbox = path.join(root, 'apps/crm-agent')
  mkdirSync(path.join(sandbox, 'scripts'), { recursive: true })
  cpSync(path.join(appRoot, 'scripts/new-module.mjs'), path.join(sandbox, 'scripts/new-module.mjs'))
  mkdirSync(path.join(sandbox, 'src/app/modules'), { recursive: true })
  cpSync(
    path.join(appRoot, 'src/app/modules/registry.ts'),
    path.join(sandbox, 'src/app/modules/registry.ts'),
  )
  resourcesFile = path.join(root, 'packages/i18n/src/resources.ts')
  mkdirSync(path.dirname(resourcesFile), { recursive: true })
  cpSync(path.join(appRoot, '../../packages/i18n/src/resources.ts'), resourcesFile)
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

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
    expect(run('zz-fixture', '--path', '/zz-fixtures', '--icon', 'Box').ok).toBe(true)

    for (const file of [
      'module.ts',
      'public.ts',
      'api/zz-fixture.ts',
      'queries/keys.ts',
      'schemas/search.ts',
      'pages/ZzFixtureListPage.tsx',
    ]) {
      expect(existsSync(path.join(sandbox, 'src/modules/zz-fixture', file)), file).toBe(true)
    }
    expect(existsSync(path.join(sandbox, 'src/modules/zz-fixture/components'))).toBe(true)
    expect(read('src/modules/zz-fixture/module.ts')).toContain("basePath: '/zz-fixtures'")
    expect(read('src/app/modules/registry.ts')).toContain("from '@/modules/zz-fixture/module'")
    expect(read('src/app/modules/registry.ts')).toMatch(/zzFixtureModule\]/)
    expect(read('src/routes/_authenticated/zz-fixtures/index.tsx')).not.toContain(
      'requirePermission',
    )
  })

  it('adds a placeholder title to both locales', () => {
    expect(run('zz-fixture').ok).toBe(true)

    const text = readFileSync(resourcesFile, 'utf8')
    expect(text.match(/\n {2}zzFixture: \{ title: 'ZzFixture' \},\n\} as const\n/g)).toHaveLength(2)
  })

  it('leaves resources.ts alone when its format is not recognized', () => {
    writeFileSync(resourcesFile, 'export {}\n')

    expect(run('zz-fixture').ok).toBe(true)
    expect(readFileSync(resourcesFile, 'utf8')).toBe('export {}\n')
  })

  it('--permission mengisi module.ts dan memasang guard di route', () => {
    expect(run('zz-fixture', '--permission', 'zzfixture.view').ok).toBe(true)

    expect(read('src/modules/zz-fixture/module.ts')).toContain("permission: 'zzfixture.view',")
    expect(read('src/routes/_authenticated/zz-fixtures/index.tsx')).toContain(
      "beforeLoad: requirePermission('zzfixture.view')",
    )
  })

  it('menolak id, path, dan permission yang bentuknya salah', () => {
    expect(run('Invoice').stderr).toContain('kebab-case')
    expect(run('zz-fixture', '--path', 'invoices').stderr).toContain('--path')
    expect(run('zz-fixture', '--permission', 'zz-fixture').stderr).toContain('--permission')
    expect(existsSync(path.join(sandbox, 'src/modules/zz-fixture'))).toBe(false)
  })

  it('menolak modul yang sudah ada dan tidak mendaftar dua kali', () => {
    expect(run('zz-fixture').ok).toBe(true)

    const second = run('zz-fixture')

    expect(second.ok).toBe(false)
    expect(second.stderr).toContain('already exists')
    expect(read('src/app/modules/registry.ts').match(/zzFixtureModule/g)).toHaveLength(2)
  })
})

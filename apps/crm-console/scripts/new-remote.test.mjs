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

/** Minimal copy of the apps folder: the script derives its paths from its own location. */
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'new-remote-'))
  sandbox = path.join(root, 'apps/crm-console')
  mkdirSync(path.join(sandbox, 'scripts'), { recursive: true })
  cpSync(path.join(appRoot, 'scripts/new-remote.mjs'), path.join(sandbox, 'scripts/new-remote.mjs'))
  mkdirSync(path.join(root, 'examples/crm-cs'), { recursive: true })
  writeFileSync(path.join(root, 'examples/crm-cs/vite.config.ts'), 'const REMOTE_PORT = 5177\n')
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

function run(...args) {
  try {
    const stdout = execFileSync('node', [path.join(sandbox, 'scripts/new-remote.mjs'), ...args], {
      env: { ...process.env, NEW_REMOTE_SKIP_POSTPROCESS: '1' },
      stdio: 'pipe',
    })
    return { ok: true, stdout: String(stdout), stderr: '' }
  } catch (error) {
    return { ok: false, stdout: '', stderr: String(error.stderr) }
  }
}

const read = (rel) => readFileSync(path.join(root, 'apps/crm-billing', rel), 'utf8')

describe('new:remote', () => {
  it('creates the app with the next free port and its own text namespace', () => {
    const result = run('billing', '--icon', 'Receipt', '--permission', 'case.export')

    expect(result.ok).toBe(true)
    for (const file of [
      'package.json',
      'tsconfig.json',
      'index.html',
      'vite.config.ts',
      'src/standalone.ts',
      'src/module.tsx',
      'src/BillingPage.tsx',
    ]) {
      expect(existsSync(path.join(root, 'apps/crm-billing', file)), file).toBe(true)
    }
    expect(read('package.json')).toContain('"name": "@crm/crm-billing"')
    expect(read('vite.config.ts')).toContain('REMOTE_PORT = 5178')
    expect(read('vite.config.ts')).toContain("name: 'crm_billing'")
    expect(read('src/module.tsx')).toContain("permission: 'case.export'")
    expect(read('src/module.tsx')).toContain('{ billing: bundle }')
    expect(result.stdout).toContain('crm_billing=http://localhost:5178/remoteEntry.js')
  })

  it('leaves the permission to be added when none is given', () => {
    run('billing')

    expect(read('src/module.tsx')).toContain("// permission: 'billing.view'")
  })

  it('turns a kebab-case id into names the code can use', () => {
    run('after-sales')

    const module = readFileSync(path.join(root, 'apps/crm-after-sales/src/module.tsx'), 'utf8')
    expect(module).toContain('AfterSalesPage')
    expect(module).toContain('{ afterSales: bundle }')
  })

  it('refuses a duplicate, a bad id, a bad icon, and a port that is taken', () => {
    expect(run('billing').ok).toBe(true)

    expect(run('billing').stderr).toContain('already exists')
    expect(run('Bad_Id').stderr).toContain('kebab-case')
    expect(run('other', '--icon', 'receipt').stderr).toContain('lucide-react icon')
    expect(run('other', '--port', '5177').stderr).toContain('used by another remote')
    expect(existsSync(path.join(root, 'apps/crm-other'))).toBe(false)
  })
})

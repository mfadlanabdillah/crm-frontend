import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findRemotes, plan } from './dev-all.mjs'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dev-all.mjs')
let root

function app(dir, config) {
  mkdirSync(path.join(root, dir), { recursive: true })
  if (config !== undefined) writeFileSync(path.join(root, dir, 'vite.config.ts'), config)
}

const remoteConfig = (name, port) =>
  `const REMOTE_PORT = ${port}\nfederation({ name: '${name}' })\n`

/** A repo with the console, one app remote, two example remotes, and folders that are no remote. */
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'dev-all-'))
  app('apps/crm-console', "federation({ name: 'crm_console' })\n")
  app('apps/crm-it', remoteConfig('crm_it', 5178))
  app('apps/notes')
  app('examples/crm-cs', remoteConfig('crm_cs', 5177))
  app('examples/crm-finance', remoteConfig('crm_finance', 5174))
  app('examples/mock-backend', 'export default {}\n')
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('findRemotes', () => {
  it('finds the remotes in apps and examples, ordered by name, and skips the console', () => {
    expect(findRemotes(root).map((r) => [r.id, r.name, r.port, r.dir])).toEqual([
      ['cs', 'crm_cs', 5177, 'examples/crm-cs'],
      ['finance', 'crm_finance', 5174, 'examples/crm-finance'],
      ['it', 'crm_it', 5178, 'apps/crm-it'],
    ])
  })

  it('leaves the examples out with appsOnly', () => {
    expect(findRemotes(root, { appsOnly: true }).map((r) => r.id)).toEqual(['it'])
  })

  it('refuses two remotes on one port', () => {
    app('apps/crm-clash', remoteConfig('crm_clash', 5177))

    expect(() => findRemotes(root)).toThrow('port 5177 is used by more than one remote')
  })
})

describe('plan', () => {
  it('runs the console and every remote, and lists them for the console', () => {
    const { env, args } = plan({ remotes: findRemotes(root) })

    expect(env.VITE_REMOTE_MODULES).toBe(
      'crm_cs=http://localhost:5177/remoteEntry.js,crm_finance=http://localhost:5174/remoteEntry.js,crm_it=http://localhost:5178/remoteEntry.js',
    )
    expect(args).toEqual([
      '-r',
      '--parallel',
      '--no-bail',
      '--filter',
      '@crm/crm-console',
      '--filter',
      './examples/crm-cs',
      '--filter',
      './examples/crm-finance',
      '--filter',
      './apps/crm-it',
      '--if-present',
      'dev',
    ])
  })

  it('adds the mock domain data only when an example runs, and keeps one the caller set', () => {
    const remotes = findRemotes(root)

    expect(plan({ remotes }).env.MOCK_DOMAIN).toBe('examples/mock-backend/src/index.ts')
    expect(plan({ remotes, env: { MOCK_DOMAIN: 'mine.ts' } }).env.MOCK_DOMAIN).toBeUndefined()
    expect(plan({ remotes: findRemotes(root, { appsOnly: true }) }).env.MOCK_DOMAIN).toBeUndefined()
  })

  it('picks remotes by id or by full name', () => {
    const remotes = findRemotes(root)

    expect(plan({ remotes, only: ['cs', 'crm_it'] }).chosen.map((r) => r.id)).toEqual(['cs', 'it'])
  })

  it('names the remotes it found when an id is unknown', () => {
    expect(() => plan({ remotes: findRemotes(root), only: ['nope'] })).toThrow(
      'unknown remote: nope (found: cs, finance, it)',
    )
  })

  it('still starts the console when there is no remote', () => {
    const { env, args } = plan({ remotes: [] })

    expect(env.VITE_REMOTE_MODULES).toBe('')
    expect(args).toContain('@crm/crm-console')
  })
})

describe('pnpm dev:all', () => {
  const print = (...flags) =>
    String(execFileSync('node', [script, '--print', ...flags], { stdio: 'pipe' }))

  it('lists the remotes of this repository without starting anything', () => {
    const output = print()

    expect(output).toContain('crm_cs=http://localhost:5177/remoteEntry.js')
    expect(output).toContain('--filter ./examples/crm-finance')
    expect(output).toMatch(/^MOCK_DOMAIN=examples\/mock-backend\/src\/index\.ts$/m)
  })

  it('narrows to the remotes asked for', () => {
    const output = print('--only', 'cs')

    expect(output).toContain('crm_cs=')
    expect(output).not.toContain('crm_finance')
  })

  it('stops with a message on a bad option', () => {
    expect(() => execFileSync('node', [script, '--nope'], { stdio: 'pipe' })).toThrow(
      /unknown option --nope/,
    )
  })
})

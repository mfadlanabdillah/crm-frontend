import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { buildReport, exitCode, step } from '../lib/report.mjs'
import {
  changedFiles,
  dependentsOf,
  packageForPath,
  readWorkspaceGlobs,
  resolveBase,
  resolveScope,
  workspacePackages,
} from '../lib/scope.mjs'

const cleanups = []
afterEach(() => {
  for (const dir of cleanups.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function write(file, text) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, text)
}

function addPackage(root, dir, name, dependencies = {}) {
  write(
    path.join(root, dir, 'package.json'),
    JSON.stringify({ name, version: '0.0.0', dependencies }),
  )
}

function git(root, ...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

/** Repo kecil: apps/app dan packages/kit bergantung pada packages/ui. */
function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'crm-verify-scope-'))
  cleanups.push(root)
  write(
    path.join(root, 'pnpm-workspace.yaml'),
    [
      'packages:',
      '  - apps/*',
      '  - packages/*',
      '',
      'onlyBuiltDependencies:',
      '  - esbuild',
      '',
    ].join('\n'),
  )
  write(path.join(root, 'package.json'), '{"name":"fixture","private":true}')
  addPackage(root, 'apps/app', '@crm/app', { '@crm/ui': 'workspace:*' })
  addPackage(root, 'packages/ui', '@crm/ui')
  addPackage(root, 'packages/kit', '@crm/kit', { '@crm/ui': 'workspace:*' })
  write(path.join(root, 'apps/app/src/main.ts'), 'export const a = 1\n')
  write(path.join(root, 'packages/ui/src/button.ts'), 'export const b = 1\n')
  write(path.join(root, 'packages/kit/src/index.ts'), 'export const c = 1\n')
  git(root, 'init', '-q')
  git(root, 'config', 'user.email', 'test@example.com')
  git(root, 'config', 'user.name', 'Test')
  git(root, 'add', '.')
  git(root, 'commit', '-qm', 'init')
  git(root, 'commit', '-q', '--allow-empty', '-m', 'second')
  return root
}

describe('workspace', () => {
  it('reads only the packages block', () => {
    expect(readWorkspaceGlobs(fixture())).toEqual(['apps/*', 'packages/*'])
  })

  it('maps a file to its deepest package', () => {
    const packages = workspacePackages(fixture())
    expect(packages.map((pkg) => pkg.name).sort()).toEqual(['@crm/app', '@crm/kit', '@crm/ui'])
    expect(packageForPath(packages, 'packages/ui/src/button.ts')).toBe('@crm/ui')
    expect(packageForPath(packages, 'README.md')).toBeNull()
  })

  it('finds direct dependents', () => {
    expect(dependentsOf(workspacePackages(fixture()), '@crm/ui').sort()).toEqual([
      '@crm/app',
      '@crm/kit',
    ])
  })
})

describe('scope', () => {
  it('falls back to HEAD~1 without a development branch', () => {
    const root = fixture()
    const { base, mergeBase } = resolveBase(root)
    expect(base).toBe('HEAD~1')
    expect(mergeBase).toBe(git(root, 'rev-parse', 'HEAD~1'))
  })

  it('counts tracked edits and untracked files', () => {
    const root = fixture()
    const mergeBase = git(root, 'rev-parse', 'HEAD~1')
    write(path.join(root, 'packages/ui/src/button.ts'), 'export const b = 2\n')
    write(path.join(root, 'packages/ui/src/new.ts'), 'export const d = 1\n')
    expect(changedFiles(root, mergeBase)).toEqual([
      'packages/ui/src/button.ts',
      'packages/ui/src/new.ts',
    ])
  })

  it('adds one level of dependents to the typecheck scope', () => {
    const root = fixture()
    write(path.join(root, 'packages/ui/src/button.ts'), 'export const b = 2\n')
    const scope = resolveScope({ root })
    expect(scope.changed).toEqual(['@crm/ui'])
    expect(scope.affected).toEqual(['@crm/app', '@crm/kit', '@crm/ui'])
  })

  it('uses every package with --all', () => {
    const scope = resolveScope({ root: fixture(), all: true })
    expect(scope.changed).toEqual(['@crm/app', '@crm/kit', '@crm/ui'])
    expect(scope.base).toBeNull()
  })
})

describe('report', () => {
  it('fails when any step fails', () => {
    const scope = { base: 'x', mergeBase: 'y', files: [], changed: [], affected: [] }
    const report = buildReport(scope, [
      step({ id: 'lint', status: 'pass' }),
      step({ id: 'test', status: 'fail', failures: [] }),
    ])
    expect(report.summary).toEqual({ status: 'fail', passed: 1, failed: 1, skipped: 0 })
    expect(exitCode(report)).toBe(1)
  })
})

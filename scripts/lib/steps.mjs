import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { step } from './report.mjs'

const rules = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'))
const VITEST_CONFIGS = ['vitest.config.ts', 'vitest.config.mts', 'vitest.config.js']

function now() {
  return performance.now()
}

function docsFor(ruleId) {
  return Object.hasOwn(rules, ruleId) ? rules[ruleId] : null
}

function run(root, command, args) {
  const started = now()
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CI: '1', FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 32 * 1024 * 1024,
    timeout: 300_000,
  })
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    durationMs: Math.round(now() - started),
    command: [command, ...args].join(' '),
  }
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`.trim()
}

function failed(id, result, failures) {
  return step({
    id,
    status: 'fail',
    durationMs: result.durationMs,
    command: result.command,
    failures: failures.length > 0 ? failures : [rawFailure(result)],
  })
}

function rawFailure(result) {
  return {
    file: null,
    line: null,
    column: null,
    ruleId: null,
    message: output(result).split('\n').slice(0, 20).join('\n'),
    docsUrl: null,
  }
}

export function format(root, files) {
  if (files.length === 0) return null
  const result = run(root, 'pnpm', ['exec', 'prettier', '--check', '--ignore-unknown', ...files])
  if (result.exitCode === 0) {
    return step({
      id: 'format',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  const failures = output(result)
    .split('\n')
    .filter((line) => line.startsWith('[warn] ') && line.includes('.'))
    .map((line) => line.replace('[warn] ', '').trim())
    .filter((line) => !line.startsWith('Code style'))
    .map((file) => ({
      file,
      line: null,
      column: null,
      ruleId: 'prettier',
      message: 'not formatted',
      docsUrl: null,
    }))
  return failed('format', result, failures)
}

export function lint(root, files) {
  if (files.length === 0) return null
  const result = run(root, 'pnpm', [
    'exec',
    'eslint',
    '--format',
    'json',
    '--max-warnings=0',
    '--no-warn-ignored',
    ...files,
  ])
  const start = result.stdout.indexOf('[')
  let report = null
  if (start !== -1) {
    try {
      report = JSON.parse(result.stdout.slice(start))
    } catch {
      report = null
    }
  }
  const failures = (report ?? []).flatMap((entry) =>
    entry.messages.map((message) => ({
      file: path.relative(root, entry.filePath),
      line: message.line ?? null,
      column: message.column ?? null,
      ruleId: message.ruleId,
      message: message.message,
      docsUrl: docsFor(message.ruleId),
    })),
  )
  if (result.exitCode === 0 && failures.length === 0) {
    return step({
      id: 'lint',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  return failed('lint', result, failures)
}

const TSC_ERROR = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/

export function typecheck(root, packages) {
  const targets = packages.filter((pkg) => Boolean(pkg.json.scripts?.typecheck))
  if (targets.length === 0) return null
  const failures = []
  let durationMs = 0
  const commands = []
  for (const pkg of targets) {
    const result = run(root, 'pnpm', ['--filter', pkg.name, 'typecheck'])
    durationMs += result.durationMs
    commands.push(result.command)
    const before = failures.length
    for (const line of output(result).split('\n')) {
      const match = line.match(TSC_ERROR)
      if (match) {
        failures.push({
          file: match[1],
          line: Number(match[2]),
          column: Number(match[3]),
          ruleId: match[4],
          message: match[5],
          docsUrl: 'AGENTS.md',
        })
      }
    }
    if (result.exitCode !== 0 && failures.length === before) {
      failures.push(rawFailure(result))
    }
  }
  const command = commands.join(' && ')
  if (failures.length === 0) {
    return step({ id: 'typecheck', status: 'pass', durationMs, command })
  }
  return step({ id: 'typecheck', status: 'fail', durationMs, command, failures })
}

export function vitestProject(pkg) {
  for (const name of VITEST_CONFIGS) {
    const file = path.join(pkg.abs, name)
    if (!existsSync(file)) continue
    const match = readFileSync(file, 'utf8').match(/name:\s*['"]([^'"]+)['"]/)
    if (match) return match[1]
  }
  return null
}

export function test(root, targets) {
  const unique = [...new Map(targets.map((target) => [target.project, target])).values()]
  if (unique.length === 0) return null
  const failures = []
  let durationMs = 0
  const commands = []
  for (const { project, filters = [] } of unique) {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'crm-verify-'))
    const outputFile = path.join(dir, 'vitest.json')
    const args = [
      'exec',
      'vitest',
      'run',
      '--project',
      project,
      '--coverage=false',
      '--reporter=json',
      `--outputFile=${outputFile}`,
      ...filters,
    ]
    const result = run(root, 'pnpm', args)
    durationMs += result.durationMs
    commands.push(result.command)
    const before = failures.length
    try {
      const report = JSON.parse(readFileSync(outputFile, 'utf8'))
      for (const file of report.testResults ?? []) {
        for (const assertion of file.assertionResults ?? []) {
          if (assertion.status !== 'failed') continue
          failures.push({
            file: path.relative(root, file.name),
            line: assertion.location?.line ?? null,
            column: assertion.location?.column ?? null,
            ruleId: 'test',
            message: [assertion.fullName, ...(assertion.failureMessages ?? [])]
              .filter(Boolean)
              .join('\n'),
            docsUrl: 'docs/agents/recipes.md',
          })
        }
      }
    } catch {
      if (result.exitCode !== 0) failures.push(rawFailure(result))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
    if (result.exitCode !== 0 && failures.length === before) failures.push(rawFailure(result))
  }
  const command = commands.join(' && ')
  if (failures.length === 0) {
    return step({ id: 'test', status: 'pass', durationMs, command })
  }
  return step({ id: 'test', status: 'fail', durationMs, command, failures })
}

export function docs(root) {
  const result = run(root, 'pnpm', [
    'exec',
    'vitest',
    'run',
    'apps/crm-console/scripts/agent-docs.test.mjs',
    '--coverage=false',
  ])
  if (result.exitCode === 0) {
    return step({
      id: 'docs',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  return failed('docs', result, [
    {
      file: null,
      line: null,
      column: null,
      ruleId: 'agent-docs',
      message: output(result).split('\n').slice(-30).join('\n'),
      docsUrl: 'AGENTS.md',
    },
  ])
}

export function codegen(root) {
  const result = run(root, 'pnpm', ['codegen:check'])
  if (result.exitCode === 0) {
    return step({
      id: 'codegen',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  return failed('codegen', result, [
    {
      file: 'packages/api-client/src/generated/openapi.d.ts',
      line: null,
      column: null,
      ruleId: 'codegen',
      message: 'generated types are stale; run pnpm codegen:api and commit the result',
      docsUrl: 'AGENTS.md',
    },
  ])
}

export function e2e(root) {
  const result = run(root, 'pnpm', ['test:e2e'])
  if (result.exitCode === 0) {
    return step({
      id: 'e2e',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  return failed('e2e', result, [
    {
      file: null,
      line: null,
      column: null,
      ruleId: 'e2e',
      message: output(result).split('\n').slice(-30).join('\n'),
      docsUrl: 'AGENTS.md',
    },
  ])
}

export function full(root) {
  const result = run(root, 'pnpm', ['check'])
  if (result.exitCode === 0) {
    return step({
      id: 'check',
      status: 'pass',
      durationMs: result.durationMs,
      command: result.command,
    })
  }
  return failed('check', result, [
    {
      file: null,
      line: null,
      column: null,
      ruleId: 'check',
      message: output(result).split('\n').slice(-40).join('\n'),
      docsUrl: 'AGENTS.md',
    },
  ])
}

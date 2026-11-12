#!/usr/bin/env node
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildReport, exitCode, skipped, writeReport } from './lib/report.mjs'
import { resolveScope } from './lib/scope.mjs'
import * as steps from './lib/steps.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HELP = `Usage: pnpm verify [options]

Scoped verification for a change: format, lint, typecheck, tests, and the
checks that only matter when their inputs change. Use \`pnpm check\` before
you finish; verify is for the inner loop.

Options:
  --base <ref>   Compare against <ref> (default: origin/development)
  --all          Every workspace package, no git diff
  --json [path]  Write the report (default: verify-report.json; - for stdout)
  --list         Print the scope and planned steps, run nothing
  --e2e          Also run the Playwright suites
  --full         Run \`pnpm check\` instead of the scoped steps
  -h, --help     Show this help
`

function parseArgs(argv) {
  const options = { base: null, all: false, json: null, list: false, e2e: false, full: false }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '-h' || arg === '--help') {
      process.stdout.write(HELP)
      process.exit(0)
    } else if (arg === '--all') {
      options.all = true
    } else if (arg === '--list') {
      options.list = true
    } else if (arg === '--e2e') {
      options.e2e = true
    } else if (arg === '--full') {
      options.full = true
    } else if (arg === '--base') {
      options.base = argv[index + 1] ?? null
      if (!options.base) throw new Error('--base needs a ref')
      index += 1
    } else if (arg === '--json') {
      const next = argv[index + 1]
      if (next && !next.startsWith('-')) {
        options.json = next
        index += 1
      } else if (next === '-') {
        options.json = '-'
        index += 1
      } else {
        options.json = 'verify-report.json'
      }
    } else {
      throw new Error(`unknown option: ${arg}`)
    }
  }
  return options
}

function isDocsChange(file) {
  return (
    file === 'AGENTS.md' ||
    file === 'README.md' ||
    file.startsWith('docs/') ||
    file === 'packages/api-client/openapi/openapi.yaml'
  )
}

function isCodegenChange(file) {
  return (
    file === 'packages/api-client/openapi/openapi.yaml' ||
    file.startsWith('packages/api-client/src/generated/')
  )
}

function moduleFilters(pkg, files) {
  const dirs = new Set()
  for (const file of files.filter((entry) => entry.startsWith(`${pkg.dir}/`))) {
    const match = file.match(/^(.*\/src\/modules\/[^/]+)\//)
    if (!match) return []
    dirs.add(match[1])
  }
  return [...dirs]
}

function plan(scope, options) {
  if (options.full) return [{ id: 'check', run: () => steps.full(root) }]
  const entries = []
  const push = (id, run, reason) => entries.push({ id, run, reason })
  push('format', () => steps.format(root, scope.files), 'no changed files')
  push('lint', () => steps.lint(root, scope.files), 'no changed files')

  const affected = scope.packages.filter((pkg) => scope.affected.includes(pkg.name))
  push('typecheck', () => steps.typecheck(root, affected), 'no package with typecheck changed')

  const changed = scope.packages.filter((pkg) => scope.changed.includes(pkg.name))
  const targets = changed
    .map((pkg) => ({ project: steps.vitestProject(pkg), filters: moduleFilters(pkg, scope.files) }))
    .filter((target) => Boolean(target.project))
  if (scope.files.some((file) => file.startsWith('scripts/'))) {
    targets.push({ project: 'verify', filters: [] })
  }
  push('test', () => steps.test(root, targets), 'no changed package has a vitest project')

  const codegen = scope.files.some(isCodegenChange)
  push(
    'codegen',
    () => (codegen ? steps.codegen(root) : null),
    'openapi.yaml and generated types unchanged',
  )

  const consoleTested = scope.changed.includes('@crm/crm-console')
  const docs = scope.files.some(isDocsChange)
  push(
    'docs',
    () => (docs && !consoleTested ? steps.docs(root) : null),
    consoleTested ? 'covered by the crm-console project tests' : 'no docs changed',
  )

  if (options.e2e) push('e2e', () => steps.e2e(root), null)
  return entries
}

function printScope(scope) {
  const lines = []
  if (scope.all) {
    lines.push('scope  all workspace packages')
  } else {
    lines.push(`scope  base=${scope.base} mergeBase=${scope.mergeBase}`)
    lines.push(
      `       ${scope.files.length} file(s), ${scope.changed.length} changed package(s), ${scope.affected.length} typechecked`,
    )
    if (scope.changed.length > 0) lines.push(`       ${scope.changed.join(', ')}`)
  }
  process.stdout.write(`${lines.join('\n')}\n`)
}

function printStep(result) {
  const mark = result.status === 'pass' ? 'ok  ' : result.status === 'skip' ? 'skip' : 'FAIL'
  const suffix =
    result.status === 'skip' ? `  ${result.reason ?? ''}` : `  ${seconds(result.durationMs)}`
  process.stdout.write(`  ${mark} ${result.id.padEnd(10)}${suffix}\n`)
  if (result.status === 'fail') {
    for (const failure of result.failures) {
      const where = failure.file
        ? `${failure.file}${failure.line ? `:${failure.line}` : ''}`
        : 'output'
      process.stdout.write(`       ${where}  ${failure.ruleId ?? ''}\n`)
      for (const line of failure.message.split('\n').slice(0, 8)) {
        process.stdout.write(`       ${line}\n`)
      }
      if (failure.docsUrl) process.stdout.write(`       see ${failure.docsUrl}\n`)
    }
  }
}

function seconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`
}

function main() {
  let options
  try {
    options = parseArgs(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${HELP}`)
    process.exitCode = 2
    return
  }

  const started = performance.now()
  let scope
  try {
    scope = resolveScope({ root, base: options.base, all: options.all })
  } catch (error) {
    process.stderr.write(`verify: ${error.message}\n`)
    process.exitCode = 2
    return
  }

  const entries = plan(scope, options)
  const toStdout = options.json === '-'

  if (options.list) {
    printScope(scope)
    process.stdout.write(`steps  ${entries.map((entry) => entry.id).join(', ')}\n`)
    return
  }

  if (!toStdout) printScope(scope)
  const results = []
  for (const entry of entries) {
    const result = entry.run()
    results.push(result ?? skipped(entry.id, entry.reason ?? 'not applicable'))
  }

  if (!toStdout) {
    for (const result of results) printStep(result)
  }

  const report = buildReport(scope, results)
  report.startedAt = new Date().toISOString()
  report.durationMs = Math.round(performance.now() - started)
  const summary = report.summary
  if (!toStdout) {
    process.stdout.write(
      `\n  ${summary.failed} failed, ${summary.passed} passed, ${summary.skipped} skipped  (${seconds(report.durationMs)})\n`,
    )
  }

  if (options.json) {
    writeReport(report, options.json)
    if (options.json !== '-') process.stdout.write(`  report ${options.json}\n`)
  }

  process.exitCode = exitCode(report)
}

main()

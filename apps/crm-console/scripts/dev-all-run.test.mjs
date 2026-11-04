import { spawn, spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
let root
let bin
let report

/** A pnpm that records how it was started instead of starting anything. Node, so it runs on Windows too. */
const FAKE_PNPM = `#!/usr/bin/env node
const fs = require('node:fs')
const env = process.env
fs.writeFileSync(
  env.FAKE_REPORT,
  [
    'args=' + process.argv.slice(2).join(' '),
    'cwd=' + process.cwd(),
    'remotes=' + (env.VITE_REMOTE_MODULES ?? ''),
    'mock=' + (env.MOCK_DOMAIN ?? ''),
    'home=' + (env.HOME ?? ''),
  ].join('\\n') + '\\n',
)
if (env.FAKE_KILL) process.kill(process.pid, 'SIGTERM')
if (env.FAKE_WAIT) {
  const stop = () => {
    fs.writeFileSync(env.FAKE_REPORT + '.signal', 'forwarded\\n')
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  fs.writeFileSync(env.FAKE_REPORT + '.ready', 'ready\\n')
  // Gives up after ten seconds, so a test that fails cannot leave this process running.
  setTimeout(() => process.exit(9), 10000)
} else process.exit(Number(env.FAKE_EXIT ?? 0))
`

const windows = process.platform === 'win32'

function app(dir, config) {
  mkdirSync(path.join(root, dir), { recursive: true })
  writeFileSync(path.join(root, dir, 'vite.config.ts'), config)
}

/** A copy of the script inside a small repository, because it finds the repository from its own path. */
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), 'dev-all-run-'))
  mkdirSync(path.join(root, 'apps/crm-console/scripts'), { recursive: true })
  cpSync(
    path.join(scriptsDir, 'dev-all.mjs'),
    path.join(root, 'apps/crm-console/scripts/dev-all.mjs'),
  )
  app('apps/crm-console', "federation({ name: 'crm_console' })\n")
  app('apps/crm-it', "const REMOTE_PORT = 5178\nfederation({ name: 'crm_it' })\n")
  app('examples/crm-cs', "const REMOTE_PORT = 5177\nfederation({ name: 'crm_cs' })\n")
  bin = path.join(root, 'bin')
  mkdirSync(bin)
  writeFileSync(path.join(bin, 'pnpm'), FAKE_PNPM, { mode: 0o755 })
  // Windows ignores the shebang and finds pnpm through PATHEXT, so it needs a .cmd that runs the script.
  writeFileSync(path.join(bin, 'pnpm.cmd'), '@node "%~dp0pnpm" %*\r\n')
  report = path.join(root, 'report.txt')
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

const script = () => path.join(root, 'apps/crm-console/scripts/dev-all.mjs')
/** Windows names the variable `Path`; setting `PATH` next to it would leave two keys. */
const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH'
const env = (extra = {}) => ({
  ...process.env,
  [pathKey]: `${bin}${path.delimiter}${process.env[pathKey]}`,
  FAKE_REPORT: report,
  ...extra,
})
const run = (args = [], extra = {}) =>
  spawnSync(process.execPath, [script(), ...args], {
    env: env(extra),
    cwd: tmpdir(),
    encoding: 'utf8',
  })
const recorded = () =>
  Object.fromEntries(
    readFileSync(report, 'utf8')
      .trim()
      .split('\n')
      .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
  )

describe('dev:all running pnpm', () => {
  it('starts pnpm in the repository root with the remote list, keeping the inherited environment', () => {
    const result = run()

    expect(result.status).toBe(0)
    const seen = recorded()
    expect(realpathSync(seen.cwd)).toBe(realpathSync(root))
    expect(seen.args).toBe(
      '-r --parallel --no-bail --filter @crm/crm-console --filter ./examples/crm-cs --filter ./apps/crm-it --if-present dev',
    )
    expect(seen.remotes).toBe(
      'crm_cs=http://localhost:5177/remoteEntry.js,crm_it=http://localhost:5178/remoteEntry.js',
    )
    expect(seen.mock).toBe('examples/mock-backend/src/index.ts')
    expect(seen.home).toBe(process.env.HOME ?? '')
  })

  it('leaves out the examples and their mock data with --apps-only', () => {
    expect(run(['--apps-only']).status).toBe(0)

    const seen = recorded()
    expect(seen.remotes).toBe('crm_it=http://localhost:5178/remoteEntry.js')
    expect(seen.mock).toBe('')
    expect(seen.args).not.toContain('examples')
  })

  it('runs only the remotes named with --only, in both spellings of the flag', () => {
    run(['--only', 'cs'])
    expect(recorded().remotes).toBe('crm_cs=http://localhost:5177/remoteEntry.js')

    run(['--only=it'])
    expect(recorded().remotes).toBe('crm_it=http://localhost:5178/remoteEntry.js')
  })

  it('reports a remote it had to leave out, and still starts the others', () => {
    app('apps/crm-sales', "federation({ name: 'crm_sales' })\n")

    const result = run()

    expect(result.status).toBe(0)
    expect(result.stderr).toContain(
      'dev:all: skipped apps/crm-sales: its vite.config.ts has no `REMOTE_PORT = <number>`',
    )
    expect(recorded().remotes).toContain('crm_it=')
  })

  it('says so when it starts the console alone', () => {
    rmSync(path.join(root, 'apps/crm-it'), { recursive: true })
    rmSync(path.join(root, 'examples'), { recursive: true })

    const result = run()

    expect(result.stdout).toContain('no remotes found, starting the console alone')
    expect(recorded().remotes).toBe('')
  })

  it("exits with pnpm's own exit code", () => {
    expect(run([], { FAKE_EXIT: '3' }).status).toBe(3)
  })

  it.skipIf(windows)('does not report success when pnpm was killed by a signal', () => {
    expect(run([], { FAKE_KILL: '1' }).status).toBe(1)
  })

  it('names the problem when pnpm cannot be started, instead of crashing', () => {
    const empty = path.join(root, 'empty')
    mkdirSync(empty)

    const result = run([], { [pathKey]: empty })

    expect(result.status).toBe(1)
    // With a shell (Windows) the shell reports it; without one, spawn emits an error that dev:all names.
    expect(result.stderr).toContain(windows ? 'not recognized' : 'dev:all: could not start pnpm')
    expect(result.stderr).not.toContain('Unhandled')
  })

  // Windows has no signals to forward: child.kill ends the process without running its handler.
  it.skipIf(windows)('passes Ctrl+C on to pnpm and exits with its code', async () => {
    const child = spawn(process.execPath, [script()], {
      env: env({ FAKE_WAIT: '1' }),
      cwd: tmpdir(),
      stdio: 'ignore',
    })
    const exited = new Promise((resolve) => child.on('exit', (code) => resolve(code)))
    await vi.waitFor(() => expect(existsSync(`${report}.ready`)).toBe(true), { timeout: 5000 })

    child.kill('SIGINT')

    expect(await exited).toBe(0)
    expect(readFileSync(`${report}.signal`, 'utf8').trim()).toBe('forwarded')
  })
})

/**
 * Starts the console and every remote it can find, with one command.
 *
 *   pnpm dev:all [--apps-only] [--only <id,id>] [--print]
 *
 *   --apps-only   leave out examples/ (and the mock domain data they need)
 *   --only a,b    only these remotes, by id: `cs` for crm-cs, `finance` for crm-finance (or the full name)
 *   --print       show the environment and the command instead of running them
 *
 * A remote is an app under apps/ or examples/ whose vite.config.ts has a federation name written as
 * `name: 'crm_x'` and a port written as `REMOTE_PORT = 5178`, which is what `pnpm new:remote` writes.
 * A config that mentions a federation or `REMOTE_PORT` but does not match is reported on stderr and
 * left out, so a hand-written remote does not vanish quietly. The console is the host, never a remote.
 *
 * The script builds VITE_REMOTE_MODULES from the remotes it finds, so a new remote needs no edit to any
 * list, and runs the `dev` script of the console and of each remote with one `pnpm -r --parallel --no-bail`.
 *
 * The menu order follows the remote names, alphabetically, because the console registers its menus in
 * the order of VITE_REMOTE_MODULES (apps/crm-console/src/app/modules/remote.ts). To order it
 * differently, set VITE_REMOTE_MODULES yourself and run the `dev` scripts directly.
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MOCK_DOMAIN = 'examples/mock-backend/src/index.ts'
const HOST = 'crm_console'
const NAME = /name:\s*['"](crm_[a-z0-9_]+)['"]/
const PORT = /REMOTE_PORT\s*=\s*(\d+)/

/**
 * Remotes under apps/ and examples/, ordered by name. The console lists its menus in the order of
 * VITE_REMOTE_MODULES, so a stable order keeps the menu stable (crm_cs, then crm_finance, ...).
 * `onSkip(dir, reason)` is called for a config that looks like a remote but cannot be read as one.
 * Throws when two remotes share a port.
 */
export function findRemotes(repoRoot, { appsOnly = false, onSkip = () => {} } = {}) {
  const remotes = []
  for (const parent of appsOnly ? ['apps'] : ['apps', 'examples']) {
    const parentDir = path.join(repoRoot, parent)
    if (!existsSync(parentDir)) continue
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      const config = path.join(parentDir, entry.name, 'vite.config.ts')
      if (!entry.isDirectory() || !existsSync(config)) continue
      const dir = `${parent}/${entry.name}`
      const source = readFileSync(config, 'utf8')
      const name = NAME.exec(source)?.[1]
      const port = PORT.exec(source)?.[1]
      if (name && port) {
        remotes.push({ name, port: Number(port), dir, id: entry.name.replace(/^crm-/, '') })
      } else if (name !== HOST && (name || /REMOTE_PORT|federation\(/.test(source))) {
        const missing = [
          name ? null : "federation `name: 'crm_<id>'`",
          port ? null : '`REMOTE_PORT = <number>`',
        ]
        onSkip(dir, `its vite.config.ts has no ${missing.filter(Boolean).join(' and no ')}`)
      }
    }
  }
  const ports = remotes.map((remote) => remote.port).sort((a, b) => a - b)
  const clash = ports.find((port, i) => ports[i + 1] === port)
  if (clash) throw new Error(`port ${clash} is used by more than one remote`)
  return remotes.sort((a, b) => a.name.localeCompare(b.name))
}

/** The environment and the pnpm arguments for the chosen remotes. */
export function plan({ remotes, only = [], env = {} }) {
  const unknown = only.filter((id) => !remotes.some((r) => r.id === id || r.name === id))
  if (unknown.length > 0) {
    const known = remotes.map((r) => r.id).join(', ') || 'none'
    throw new Error(`unknown remote: ${unknown.join(', ')} (found: ${known})`)
  }
  const chosen =
    only.length > 0 ? remotes.filter((r) => only.includes(r.id) || only.includes(r.name)) : remotes

  const planEnv = {
    VITE_REMOTE_MODULES: chosen
      .map((r) => `${r.name}=http://localhost:${r.port}/remoteEntry.js`)
      .join(','),
  }
  // Only the examples read the mock domain data; a value the caller already set wins.
  if (!env.MOCK_DOMAIN && chosen.some((r) => r.dir.startsWith('examples/'))) {
    planEnv.MOCK_DOMAIN = MOCK_DOMAIN
  }

  const args = [
    '-r',
    '--parallel',
    '--no-bail',
    '--filter',
    '@crm/crm-console',
    ...chosen.flatMap((r) => ['--filter', `./${r.dir}`]),
    '--if-present',
    'dev',
  ]
  return { env: planEnv, args, chosen }
}

function fail(message) {
  process.stderr.write(`dev:all: ${message}\n`)
  process.exit(1)
}

function parseArgs(argv) {
  const options = { appsOnly: false, only: [], print: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apps-only') options.appsOnly = true
    else if (arg === '--print') options.print = true
    else if (arg === '--only' || arg.startsWith('--only=')) {
      const value = arg === '--only' ? argv[++i] : arg.slice('--only='.length)
      // A flag in the value's place means the list was forgotten; an empty list would start everything.
      const ids =
        value === undefined || value.startsWith('--') ? [] : value.split(',').filter(Boolean)
      if (ids.length === 0)
        fail('--only needs a comma-separated list of ids, e.g. --only cs,finance')
      options.only = ids
    } else fail(`unknown option ${arg} (use --apps-only, --only <id,id>, or --print)`)
  }
  return options
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
  const options = parseArgs(process.argv.slice(2))

  let result
  try {
    const onSkip = (dir, reason) => process.stderr.write(`dev:all: skipped ${dir}: ${reason}\n`)
    result = plan({
      remotes: findRemotes(repoRoot, { appsOnly: options.appsOnly, onSkip }),
      only: options.only,
      env: process.env,
    })
  } catch (error) {
    fail(error.message)
  }

  const shown = Object.entries(result.env).map(([key, value]) => `${key}=${value}`)
  if (options.print) {
    process.stdout.write(`${[...shown, `pnpm ${result.args.join(' ')}`].join('\n')}\n`)
    return
  }
  if (result.chosen.length === 0) {
    process.stdout.write('dev:all: no remotes found, starting the console alone\n')
  }

  const child = spawn('pnpm', result.args, {
    cwd: repoRoot,
    env: { ...process.env, ...result.env },
    stdio: 'inherit',
  })
  child.on('error', (error) => fail(`could not start pnpm: ${error.message}`))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()

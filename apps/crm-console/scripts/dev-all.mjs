/**
 * Starts the console and every remote it can find, with one command.
 *
 *   pnpm dev:all [--apps-only] [--only <id,id>] [--print]
 *
 * A remote is an app under apps/ or examples/ whose vite.config.ts has a federation `name` and a
 * `REMOTE_PORT`, which is what `pnpm new:remote` writes. The script builds VITE_REMOTE_MODULES from
 * them, so a new remote needs no edit to any list, and runs every `dev` script with one
 * `pnpm -r --parallel --no-bail`.
 *
 *   --apps-only   leave out examples/ (and the mock domain data they need)
 *   --only a,b    only these remotes, by id: `cs` for crm-cs, `it` for crm-it (or the full name)
 *
 * The menu order follows the remote names, alphabetically. To order it differently, set
 * VITE_REMOTE_MODULES yourself and run the `dev` scripts directly.
 *   --print       show the environment and the command instead of running them
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MOCK_DOMAIN = 'examples/mock-backend/src/index.ts'

/**
 * Remotes under apps/ and examples/, ordered by name. The console lists its menus in the order of
 * VITE_REMOTE_MODULES, so a stable order keeps the menu stable (crm_cs, then crm_finance, ...).
 * Throws when two remotes share a port.
 */
export function findRemotes(repoRoot, { appsOnly = false } = {}) {
  const remotes = []
  for (const parent of appsOnly ? ['apps'] : ['apps', 'examples']) {
    const parentDir = path.join(repoRoot, parent)
    if (!existsSync(parentDir)) continue
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      const config = path.join(parentDir, entry.name, 'vite.config.ts')
      if (!entry.isDirectory() || !existsSync(config)) continue
      const source = readFileSync(config, 'utf8')
      const name = /name: '(crm_[a-z0-9_]+)'/.exec(source)?.[1]
      const port = /REMOTE_PORT = (\d+)/.exec(source)?.[1]
      if (!name || !port) continue
      remotes.push({
        name,
        port: Number(port),
        dir: `${parent}/${entry.name}`,
        id: entry.name.replace(/^crm-/, ''),
      })
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
      if (!value) fail('--only needs a comma-separated list of ids, e.g. --only cs,finance')
      options.only = value.split(',').filter(Boolean)
    } else fail(`unknown option ${arg} (use --apps-only, --only <id,id>, or --print)`)
  }
  return options
}

function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
  const options = parseArgs(process.argv.slice(2))

  let result
  try {
    result = plan({
      remotes: findRemotes(repoRoot, { appsOnly: options.appsOnly }),
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
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()

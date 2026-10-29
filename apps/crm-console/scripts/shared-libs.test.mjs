import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

/** Library names inside the `shared: { ... }` block of a Vite config (or of the generator's template). */
function sharedLibs(file) {
  const text = readFileSync(path.join(repoRoot, file), 'utf8')
  const block = /shared:\s*\{([^}]*)\}/.exec(text)?.[1] ?? ''
  return [...block.matchAll(/^\s*'?([@\w/-]+)'?:/gm)].map((match) => match[1])
}

const remoteConfigs = ['apps', 'examples'].flatMap((parent) =>
  readdirSync(path.join(repoRoot, parent))
    .map((name) => `${parent}/${name}/vite.config.ts`)
    .filter(
      (file) => existsSync(path.join(repoRoot, file)) && file !== 'apps/crm-console/vite.config.ts',
    ),
)

describe('shared libraries (Module Federation singletons)', () => {
  const shell = sharedLibs('apps/crm-console/vite.config.ts')

  it('the console shares something', () => {
    expect(shell.length).toBeGreaterThan(0)
  })

  it.each([...remoteConfigs, 'apps/crm-console/scripts/new-remote.mjs'])(
    '%s declares only libraries the console shares',
    (file) => {
      const extra = sharedLibs(file).filter((lib) => !shell.includes(lib))
      expect(extra).toEqual([])
    },
  )
})

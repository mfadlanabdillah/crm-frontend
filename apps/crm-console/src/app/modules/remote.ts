import type { RemoteModule } from '@crm/module-contract'
import { loadRemote, registerRemotes } from '@module-federation/runtime'
import type { LucideIcon } from 'lucide-react'
import type { AnyRoute } from '@tanstack/react-router'
import { registerRemoteModule } from '@/app/modules/registry'
import type { ModuleDefinition } from '@/modules/types'

// A dev server compiles a remote on first request, which takes longer than serving a built one.
export const LOAD_TIMEOUT_MS = import.meta.env.DEV ? 60_000 : 5_000

/** Route factories of the loaded remotes, applied by `createAppRouter` before the router exists. */
export const remoteRouteFactories: Array<(parent: AnyRoute) => AnyRoute[]> = []

/** Names of the configured remotes that failed to load, so the shell can say so and offer a retry. */
export const failedRemotes: string[] = []

export interface RemoteEntry {
  name: string
  entry: string
}

/** `name=entryUrl,name=entryUrl`; a pair without both parts is ignored. */
export function parseRemotes(raw: string | undefined): RemoteEntry[] {
  return (raw ?? '').split(',').flatMap((pair) => {
    const at = pair.indexOf('=')
    const name = pair.slice(0, at).trim()
    const entry = pair.slice(at + 1).trim()
    return at > 0 && name && entry ? [{ name, entry }] : []
  })
}

/** The two casts are the trust boundary: the contract types `icon` and `nav` loosely on purpose. */
function toModuleDefinition(remote: RemoteModule): ModuleDefinition {
  return {
    ...remote,
    icon: remote.icon as LucideIcon,
    nav: remote.nav as ModuleDefinition['nav'],
  }
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('remote load timed out')), LOAD_TIMEOUT_MS)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })
}

/**
 * Registers the remotes and loads each one's `./module` into the module registry. A remote that is
 * down or slow must never break the host: the failure is logged and the host starts without it.
 */
export async function loadRemoteModules(raw: string | undefined): Promise<void> {
  const remotes = parseRemotes(raw)
  failedRemotes.length = 0
  if (remotes.length === 0) return

  registerRemotes(remotes.map(({ name, entry }) => ({ name, entry, type: 'module' })))
  const loaded = await Promise.all(
    remotes.map(async ({ name }) => {
      try {
        return await withTimeout(
          loadRemote<{ default: RemoteModule | RemoteModule[] }>(`${name}/module`),
        )
      } catch (error) {
        console.error(`Remote "${name}" is unavailable; continuing without it.`, error)
        failedRemotes.push(name)
        return null
      }
    }),
  )
  // Load in parallel, register in the configured order: the menu must not depend on which remote
  // answered first.
  for (const remote of loaded) {
    if (!remote) continue
    for (const module of [remote.default].flat()) {
      registerRemoteModule(toModuleDefinition(module))
      if (module.routes) remoteRouteFactories.push(module.routes)
    }
  }
}

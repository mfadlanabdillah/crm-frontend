import { can } from '@crm/auth'
import type { Role } from '@crm/auth'
import type { ModuleDefinition } from '@/modules/types'

/**
 * Daftar modul CRM. Menambah modul = membuat `modules/<id>/module.ts` lalu mendaftarkannya di sini
 * (`pnpm new:module <id>` melakukannya otomatis).
 */
export const modules: readonly ModuleDefinition[] = []

const remoteModules: ModuleDefinition[] = []

/**
 * Modules loaded at runtime from remote apps (see `app/modules/remote.ts`). A module whose id or
 * path is already taken is ignored with a warning: a remote must never replace another module.
 */
export function registerRemoteModule(module: ModuleDefinition) {
  const clash = allModules().find(
    (existing) => existing.id === module.id || existing.basePath === module.basePath,
  )
  if (clash) {
    console.warn(`Remote module "${module.id}" ignored: its id or path is used by "${clash.id}".`)
    return
  }
  remoteModules.push(module)
}

/** Built-in modules first, then the ones registered at runtime. */
export function allModules(): readonly ModuleDefinition[] {
  return [...modules, ...remoteModules]
}

export function findActiveModule(pathname: string): ModuleDefinition | undefined {
  return allModules().find(
    (module) => pathname === module.basePath || pathname.startsWith(`${module.basePath}/`),
  )
}

/** Modul yang boleh dilihat sebuah peran (modul tanpa `permission` terbuka untuk semua yang login). */
export function getVisibleModules(role: Role | null | undefined): ModuleDefinition[] {
  return allModules().filter((module) => !module.permission || can(role, module.permission))
}

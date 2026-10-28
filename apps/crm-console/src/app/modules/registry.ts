import { can } from '@crm/auth'
import type { Role } from '@crm/auth'
import { caseModule } from '@/modules/case/module'
import { customerModule } from '@/modules/customer/module'
import type { ModuleDefinition } from '@/modules/types'

/**
 * Daftar modul CRM. Menambah modul = membuat `modules/<id>/module.ts` lalu mendaftarkannya di sini
 * (`pnpm new:module <id>` melakukannya otomatis).
 */
export const modules: readonly ModuleDefinition[] = [caseModule, customerModule]

const remoteModules: ModuleDefinition[] = []

/** Modules loaded at runtime from remote apps (see `app/modules/remote.ts`); ids must be unique. */
export function registerRemoteModule(module: ModuleDefinition) {
  if (!allModules().some((existing) => existing.id === module.id)) remoteModules.push(module)
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

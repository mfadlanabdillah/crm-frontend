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

export function findActiveModule(pathname: string): ModuleDefinition | undefined {
  return modules.find(
    (module) => pathname === module.basePath || pathname.startsWith(`${module.basePath}/`),
  )
}

/** Modul yang boleh dilihat sebuah peran (modul tanpa `permission` terbuka untuk semua yang login). */
export function getVisibleModules(role: Role | null | undefined): ModuleDefinition[] {
  return modules.filter((module) => !module.permission || can(role, module.permission))
}

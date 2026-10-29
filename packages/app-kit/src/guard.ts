import { can } from '@crm/auth'
import type { Permission } from '@crm/auth'
import type { Session } from '@crm/api-client'
import { redirect } from '@tanstack/react-router'

/**
 * `beforeLoad` untuk route yang butuh izin tertentu. Peran tanpa izin diarahkan ke `/`
 * (yang meneruskan ke halaman awal) alih-alih melihat error generik dari API.
 * Sengaja tidak memakai registry modul agar tidak masuk chunk awal; samakan nilainya dengan
 * `permission` di `modules/<id>/module.ts`. UI hanya menyembunyikan; backend tetap penjaga akhir.
 */
export function requirePermission(permission: Permission) {
  return ({ context }: { context: { session: Session } }) => {
    if (!can(context.session.user.role, permission)) {
      throw redirect({ to: '/' })
    }
  }
}

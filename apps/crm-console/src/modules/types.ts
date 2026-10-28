/** Kontrak antara shell dan modul. Letaknya di modules/ (bukan app/) supaya modul boleh mengimpornya. */
import type { Permission } from '@crm/auth'
import type { LinkOptions } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import type { StreamStatus } from '@/lib/sse'

/**
 * Kontrak antara shell (`app/`) dan sebuah modul CRM. Shell hanya tahu bentuk ini;
 * isi modul (halaman, query, store) tetap di `modules/<id>/`.
 */
export type SignOutReason = 'logout' | 'expired'

export interface ModuleDefinition {
  /** Pengenal unik, sama dengan nama folder di `modules/`. */
  id: string
  /** Kunci i18n untuk nama modul (sidebar dan judul header). */
  labelKey: string
  icon: LucideIcon
  /** Awalan path; dipakai untuk menentukan modul yang sedang aktif. */
  basePath: string
  /** Tujuan tautan sidebar (path + search bawaan). */
  nav: LinkOptions
  /** Modul disembunyikan bila peran tidak punya izin ini. */
  permission?: Permission
  /** Page of a remote module, rendered by the generic `/remote/$moduleId` route. */
  Page?: ComponentType
  /** Bagian sidebar milik modul, tampil saat modul aktif. */
  Sidebar?: ComponentType<{ variant?: 'sidebar' | 'inline' }>
  /** Baris tab di bawah header, tampil saat modul aktif. */
  Tabs?: ComponentType
  /** Hook koneksi real-time modul; status dilaporkan ke indikator di header. */
  useRealtime?: () => StreamStatus
  /**
   * Bersihkan state klien modul (store) saat sesi berakhir. Cache query dibersihkan shell.
   * `logout`: agen keluar (di tab ini atau tab lain). `expired`: server menolak sesi (401);
   * modul boleh menyimpan pekerjaan yang belum terkirim untuk dipulihkan setelah masuk lagi.
   */
  onSignOut?: (reason: SignOutReason) => void
}

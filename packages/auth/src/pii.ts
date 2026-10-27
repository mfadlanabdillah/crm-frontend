import type { Role } from './roles'
import { can } from './roles'

const EMPTY = '—'

/**
 * Nomor HP hanya utuh untuk role yang punya izin `pii.view.full`.
 * Contoh: 081234567890 -> 0812****7890
 */
export function maskPhone(phone: string | null | undefined, role: Role | null): string {
  if (!phone) return EMPTY
  if (can(role, 'pii.view.full')) return phone
  const digits = phone.replace(/\s+/g, '')
  if (digits.length <= 8) return `${digits.slice(0, 2)}****`
  return `${digits.slice(0, 4)}****${digits.slice(-4)}`
}

/** Alamat hanya utuh untuk role yang punya izin `pii.view.full`. */
export function maskAddress(address: string | null | undefined, role: Role | null): string {
  if (!address) return EMPTY
  if (can(role, 'pii.view.full')) return address
  // Sudah disamarkan (mis. oleh server): jangan menambah elipsis lagi.
  if (address.endsWith('…')) return address
  const visible = address.slice(0, 16).trimEnd()
  return `${visible}…`
}

/** Email tetap ditampilkan domain-nya agar agen bisa memverifikasi kanal. */
export function maskEmail(email: string | null | undefined, role: Role | null): string {
  if (!email) return EMPTY
  if (can(role, 'pii.view.full')) return email
  const [local, domain] = email.split('@')
  if (!local || !domain) return '****'
  const head = local.slice(0, 2)
  return `${head}****@${domain}`
}

import { maskAddress, maskEmail, maskPhone } from '@crm/auth'
import type { Role } from '@crm/auth'
import type { Case, Customer, CustomerProfile } from '@crm/api-client'

/**
 * Masking sisi "server" untuk backend tiruan. Di produksi ini tugas BFF: peran tanpa
 * `pii.view.full` tidak pernah menerima data utuh, jadi tidak terlihat di tab Network.
 * UI tetap memanggil helper yang sama sebagai lapisan kedua (idempoten pada data yang sudah disamarkan).
 */
function maskPii<T extends Customer | CustomerProfile>(item: T, role: Role): T {
  return {
    ...item,
    phone: item.phone ? maskPhone(item.phone, role) : item.phone,
    email: item.email ? maskEmail(item.email, role) : item.email,
    address: item.address ? maskAddress(item.address, role) : item.address,
  }
}

export function maskCaseForRole(item: Case, role: Role): Case {
  return { ...item, customer: maskPii(item.customer, role) }
}

export function maskCustomerForRole(item: CustomerProfile, role: Role): CustomerProfile {
  return maskPii(item, role)
}

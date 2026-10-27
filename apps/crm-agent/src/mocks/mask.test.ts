import { maskAddress, maskEmail, maskPhone } from '@crm/auth'
import { describe, expect, it } from 'vitest'
import { maskCustomerForRole } from './mask'
import type { CustomerProfile } from '@crm/api-client'

const customer: CustomerProfile = {
  id: 'cust-1',
  name: 'Budi Santoso',
  segment: 'regular',
  city: 'Bandung',
  phone: '081234567890',
  email: 'budi1@example.com',
  address: 'Jl. Merdeka No. 12, Bandung',
  createdAt: '2026-10-01T00:00:00.000Z',
}

describe('masking mock server', () => {
  it('peran tanpa pii.view.full menerima data tersamarkan', () => {
    const masked = maskCustomerForRole(customer, 'l2')
    expect(masked.phone).toBe('0812****7890')
    expect(masked.email).toBe('bu****@example.com')
    expect(masked.address).not.toContain('Merdeka No. 12, Bandung')
  })

  it('supervisor menerima data utuh', () => {
    expect(maskCustomerForRole(customer, 'supervisor')).toEqual(customer)
  })

  it('idempoten: masking ulang di UI tidak mengubah hasil', () => {
    const once = maskCustomerForRole(customer, 'l2')
    expect(maskPhone(once.phone, 'l2')).toBe(once.phone)
    expect(maskEmail(once.email, 'l2')).toBe(once.email)
    expect(maskAddress(once.address, 'l2')).toBe(once.address)
  })
})

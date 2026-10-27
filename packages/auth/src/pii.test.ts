import { describe, expect, it } from 'vitest'
import { maskAddress, maskEmail, maskPhone } from './pii'

describe('masking PII', () => {
  it('menyamarkan nomor HP untuk agen L1 dan L2', () => {
    expect(maskPhone('081234567890', 'l1')).toBe('0812****7890')
    expect(maskPhone('081234567890', 'l2')).toBe('0812****7890')
  })

  it('menampilkan nomor HP utuh untuk supervisor', () => {
    expect(maskPhone('081234567890', 'supervisor')).toBe('081234567890')
  })

  it('mengembalikan tanda kosong untuk data yang tidak ada', () => {
    expect(maskPhone(null, 'admin')).toBe('—')
    expect(maskAddress(undefined, 'admin')).toBe('—')
    expect(maskEmail(null, 'admin')).toBe('—')
  })

  it('menyamarkan alamat dan email untuk role tanpa izin penuh', () => {
    expect(maskAddress('Jl. Jenderal Sudirman No. 52, Jakarta Selatan', 'l1')).toContain('…')
    expect(maskEmail('budi@example.com', 'l1')).toBe('bu****@example.com')
  })

  it('masking ulang tidak mengubah data yang sudah disamarkan', () => {
    const once = maskAddress('Jl. Merdeka No. 12, Bandung', 'l1')
    expect(maskAddress(once, 'l1')).toBe(once)
    expect(maskPhone(maskPhone('081234567890', 'l1'), 'l1')).toBe('0812****7890')
  })
})

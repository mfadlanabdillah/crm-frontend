import { describe, expect, it } from 'vitest'
import { formatDateTime, formatNumber, formatRelative, initials } from './format'

describe('formatDateTime', () => {
  it('memakai zona Asia/Jakarta', () => {
    expect(formatDateTime('2026-01-02T00:00:00Z')).toContain('07.00')
  })

  it.each([null, undefined, '', 'bukan-tanggal'])('mengembalikan tanda strip untuk %s', (value) => {
    expect(formatDateTime(value)).toBe('—')
  })
})

describe('formatRelative', () => {
  const now = Date.parse('2026-01-01T12:00:00Z')
  const at = (offsetSeconds: number) => new Date(now + offsetSeconds * 1000).toISOString()

  it('memilih satuan menurut selisih', () => {
    expect(formatRelative(at(-30), now)).toContain('detik')
    expect(formatRelative(at(-5 * 60), now)).toContain('menit')
    expect(formatRelative(at(-3 * 3600), now)).toContain('jam')
    expect(formatRelative(at(-5 * 86_400), now)).toContain('hari')
  })

  it.each([null, undefined, 'x'])('mengembalikan tanda strip untuk %s', (value) => {
    expect(formatRelative(value, now)).toBe('—')
  })
})

describe('formatNumber dan initials', () => {
  it('memakai pemisah ribuan id-ID', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('mengambil maksimal dua inisial dan melewati spasi ganda', () => {
    expect(initials('budi  santoso wijaya')).toBe('BS')
    expect(initials('')).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it('mempertahankan path internal beserta query dan hash', () => {
    expect(safeRedirectPath('/cases/abc?tab=timeline#reply')).toBe('/cases/abc?tab=timeline#reply')
  })

  it('menolak URL absolut dan protocol-relative', () => {
    expect(safeRedirectPath('https://evil.com')).toBeUndefined()
    expect(safeRedirectPath('//evil.com/cases')).toBeUndefined()
    expect(safeRedirectPath('/\\evil.com')).toBeUndefined()
    expect(safeRedirectPath('/\t/evil.com')).toBeUndefined()
    expect(safeRedirectPath('javascript:alert(1)')).toBeUndefined()
  })

  it('menolak redirect kembali ke login dan nilai kosong', () => {
    expect(safeRedirectPath('/login?redirect=/cases')).toBeUndefined()
    expect(safeRedirectPath('')).toBeUndefined()
    expect(safeRedirectPath(undefined)).toBeUndefined()
  })
})

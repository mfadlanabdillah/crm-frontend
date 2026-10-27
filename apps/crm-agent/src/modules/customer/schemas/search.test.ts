import { describe, expect, it } from 'vitest'
import { customerSearchSchema, toCustomerListQuery } from './search'

describe('customerSearchSchema', () => {
  it('memakai default untuk URL kosong', () => {
    expect(customerSearchSchema.parse({})).toEqual({ page: 1 })
  })

  it('menolak nilai rusak tanpa melempar error', () => {
    expect(customerSearchSchema.parse({ page: 'abc', q: 42 })).toEqual({ page: 1 })
  })

  it('q kosong dibuang dari query API', () => {
    const search = customerSearchSchema.parse({ q: '  ', page: '3' })
    expect(toCustomerListQuery(search)).toEqual({ page: 3, page_size: 25 })
  })
})

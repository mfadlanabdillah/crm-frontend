import { describe, expect, it } from 'vitest'
import { caseSearchSchema, toCaseListQuery, updateCaseSearch } from './search'

describe('case search params', () => {
  it('memberi default yang stabil untuk URL kosong', () => {
    const search = caseSearchSchema.parse({})
    expect(search).toMatchObject({
      view: 'all',
      sort: '-updated_at',
      page: 1,
      pageSize: 25,
    })
    expect(search.status).toBeUndefined()
  })

  it('menerima nilai valid dan mengubahnya menjadi angka', () => {
    const search = caseSearchSchema.parse({
      status: 'open',
      queue: 'l2',
      view: 'mine',
      page: '3',
      pageSize: '50',
    })
    expect(search.status).toBe('open')
    expect(search.page).toBe(3)
    expect(search.pageSize).toBe(50)
  })

  it('mengabaikan nilai rusak tanpa melempar error', () => {
    const search = caseSearchSchema.parse({
      status: 123,
      queue: '',
      page: '0',
      pageSize: '9999',
      sort: 'acak',
    })
    expect(search.status).toBeUndefined()
    expect(search.queue).toBeUndefined()
    expect(search.page).toBe(1)
    expect(search.pageSize).toBe(25)
    expect(search.sort).toBe('-updated_at')
  })

  it('menerima kode status/antrean apa pun dari master data', () => {
    const search = caseSearchSchema.parse({ status: 'on_hold', queue: 'swat' })
    expect(search.status).toBe('on_hold')
    expect(search.queue).toBe('swat')
  })

  it('memetakan search ke query API tanpa field undefined', () => {
    const search = caseSearchSchema.parse({ q: '  resi  ' })
    const query = toCaseListQuery(search)

    expect(query).toEqual({
      view: 'all',
      sort: '-updated_at',
      page: 1,
      page_size: 25,
      q: 'resi',
    })
  })

  it('reset halaman ketika filter berubah, kecuali page eksplisit', () => {
    const search = caseSearchSchema.parse({ page: 4, status: 'open' })
    expect(updateCaseSearch(search, { q: 'baru' }).page).toBe(1)
    expect(updateCaseSearch(search, { status: 'closed', page: 7 }).page).toBe(7)
  })
})

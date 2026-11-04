import { describe, expect, it } from 'vitest'
import { DEFAULT_CASE_SEARCH } from '../schemas/search'
import { caseListQueryOptions } from './useCases'

describe('caseListQueryOptions', () => {
  it('keeps the query key stable when only preview changes', () => {
    const closed = caseListQueryOptions({ ...DEFAULT_CASE_SEARCH })
    const open = caseListQueryOptions({ ...DEFAULT_CASE_SEARCH, preview: 'case-1' })
    expect(open.queryKey).toEqual(closed.queryKey)
  })

  it('changes the key when a real filter changes', () => {
    const a = caseListQueryOptions({ ...DEFAULT_CASE_SEARCH })
    const b = caseListQueryOptions({ ...DEFAULT_CASE_SEARCH, page: 2 })
    expect(b.queryKey).not.toEqual(a.queryKey)
  })
})

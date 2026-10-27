import { beforeEach, describe, expect, it } from 'vitest'
import { useConnectionStore, worstStatus } from './connection'

describe('worstStatus', () => {
  it('null bila tidak ada modul yang melapor', () => {
    expect(worstStatus({})).toBeNull()
  })

  it('mengambil status terburuk', () => {
    expect(worstStatus({ a: 'live', b: 'reconnecting' })).toBe('reconnecting')
    expect(worstStatus({ a: 'live', b: 'offline', c: 'connecting' })).toBe('offline')
    expect(worstStatus({ a: 'live' })).toBe('live')
  })
})

describe('useConnectionStore', () => {
  beforeEach(() => useConnectionStore.setState({ statuses: {} }))

  it('melaporkan dan menghapus status per modul', () => {
    useConnectionStore.getState().report('case', 'live')
    expect(useConnectionStore.getState().statuses).toEqual({ case: 'live' })
    useConnectionStore.getState().clear('case')
    expect(useConnectionStore.getState().statuses).toEqual({})
  })

  it('tidak membuat state baru bila status sama', () => {
    useConnectionStore.getState().report('case', 'live')
    const before = useConnectionStore.getState().statuses
    useConnectionStore.getState().report('case', 'live')
    expect(useConnectionStore.getState().statuses).toBe(before)
  })
})

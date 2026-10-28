import { beforeEach, describe, expect, it } from 'vitest'
import { draftKey, useDraftsStore } from './drafts'

describe('drafts store', () => {
  beforeEach(() => useDraftsStore.getState().reset())

  it('memisahkan draf per agen dan per case', () => {
    const { setDraft } = useDraftsStore.getState()
    setDraft(draftKey('u1', 'c1'), { body: 'a', visibility: 'customer' })
    setDraft(draftKey('u2', 'c1'), { body: 'b', visibility: 'internal' })

    const { drafts } = useDraftsStore.getState()
    expect(drafts[draftKey('u1', 'c1')]?.body).toBe('a')
    expect(drafts[draftKey('u2', 'c1')]?.body).toBe('b')
    expect(drafts[draftKey('u1', 'c2')]).toBeUndefined()
  })

  it('clearDraft hanya menghapus satu draf', () => {
    const { setDraft, clearDraft } = useDraftsStore.getState()
    setDraft('u1:c1', { body: 'a', visibility: 'customer' })
    setDraft('u1:c2', { body: 'b', visibility: 'customer' })

    clearDraft('u1:c1')

    expect(Object.keys(useDraftsStore.getState().drafts)).toEqual(['u1:c2'])
  })
})

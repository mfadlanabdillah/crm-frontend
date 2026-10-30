import { afterEach, describe, expect, it, vi } from 'vitest'

async function freshStore() {
  vi.resetModules()
  return import('./sidebar-store')
}

describe('useSidebarStore', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts expanded and remembers a toggle', async () => {
    const { useSidebarStore, SIDEBAR_STORAGE_KEY } = await freshStore()
    expect(useSidebarStore.getState().collapsed).toBe(false)

    useSidebarStore.getState().toggle()

    expect(useSidebarStore.getState().collapsed).toBe(true)
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('1')

    useSidebarStore.getState().toggle()
    expect(window.localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('0')
  })

  it('reads the saved choice when the app loads', async () => {
    window.localStorage.setItem('crm.sidebar.collapsed', '1')
    const { useSidebarStore } = await freshStore()

    expect(useSidebarStore.getState().collapsed).toBe(true)
  })

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { useSidebarStore } = await freshStore()

    expect(useSidebarStore.getState().collapsed).toBe(false)
    useSidebarStore.getState().toggle()
    expect(useSidebarStore.getState().collapsed).toBe(true)
  })
})

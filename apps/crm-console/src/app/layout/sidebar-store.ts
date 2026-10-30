import { create } from 'zustand'

export const SIDEBAR_STORAGE_KEY = 'crm.sidebar.collapsed'

// A UI preference, not session data: it is kept across sign-out. Storage can be blocked or full, in
// which case the choice simply lasts for this page load.
function read(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function write(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // Nothing to do: see above.
  }
}

interface SidebarState {
  collapsed: boolean
  toggle: () => void
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: read(),
  toggle: () => {
    const collapsed = !get().collapsed
    write(collapsed)
    set({ collapsed })
  },
}))

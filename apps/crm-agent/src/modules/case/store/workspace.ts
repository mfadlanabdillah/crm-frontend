import { create } from 'zustand'

export interface WorkspaceTab {
  caseId: string
  title: string
}

interface WorkspaceState {
  tabs: WorkspaceTab[]
  activeCaseId: string | null
  openTab: (tab: WorkspaceTab) => void
  closeTab: (caseId: string) => void
  setActive: (caseId: string | null) => void
  reset: () => void
}

const MAX_TABS = 8

/**
 * Hanya UI state (tab yang terbuka). Data case tetap di cache TanStack Query,
 * bukan disalin ke store ini.
 */
export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  tabs: [],
  activeCaseId: null,

  openTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find((item) => item.caseId === tab.caseId)
      if (existing) {
        return {
          activeCaseId: tab.caseId,
          tabs: state.tabs.map((item) =>
            item.caseId === tab.caseId ? { ...item, title: tab.title } : item,
          ),
        }
      }
      const tabs = [...state.tabs, tab]
      return {
        tabs: tabs.length > MAX_TABS ? tabs.slice(tabs.length - MAX_TABS) : tabs,
        activeCaseId: tab.caseId,
      }
    }),

  closeTab: (caseId) =>
    set((state) => ({
      tabs: state.tabs.filter((item) => item.caseId !== caseId),
      activeCaseId: state.activeCaseId === caseId ? null : state.activeCaseId,
    })),

  setActive: (caseId) => set({ activeCaseId: caseId }),

  reset: () => set({ tabs: [], activeCaseId: null }),
}))

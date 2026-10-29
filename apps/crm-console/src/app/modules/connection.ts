import type { StreamStatus } from '@crm/app-kit'
import { create } from 'zustand'

interface ConnectionState {
  statuses: Record<string, StreamStatus>
  report: (moduleId: string, status: StreamStatus) => void
  clear: (moduleId: string) => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  statuses: {},
  report: (moduleId, status) =>
    set((state) =>
      state.statuses[moduleId] === status
        ? state
        : { statuses: { ...state.statuses, [moduleId]: status } },
    ),
  clear: (moduleId) =>
    set((state) => {
      const { [moduleId]: _removed, ...rest } = state.statuses
      return { statuses: rest }
    }),
}))

/** Urutan dari paling buruk ke paling baik; indikator header menampilkan yang terburuk. */
const SEVERITY: StreamStatus[] = ['offline', 'closed', 'reconnecting', 'connecting', 'live']

export function worstStatus(statuses: Record<string, StreamStatus>): StreamStatus | null {
  const values = Object.values(statuses)
  if (values.length === 0) return null
  return values.reduce((worst, status) =>
    SEVERITY.indexOf(status) < SEVERITY.indexOf(worst) ? status : worst,
  )
}

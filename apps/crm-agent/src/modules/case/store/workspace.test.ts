import { beforeEach, describe, expect, it } from 'vitest'
import { useWorkspaceStore } from './workspace'

describe('workspace store', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset()
  })

  it('membuka tab dan menandainya aktif', () => {
    useWorkspaceStore.getState().openTab({ caseId: 'c1', title: 'CASE-1' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(1)
    expect(useWorkspaceStore.getState().activeCaseId).toBe('c1')
  })

  it('tidak menduplikasi tab untuk case yang sama', () => {
    const { openTab } = useWorkspaceStore.getState()
    openTab({ caseId: 'c1', title: 'CASE-1' })
    openTab({ caseId: 'c2', title: 'CASE-2' })
    openTab({ caseId: 'c1', title: 'CASE-1' })

    const state = useWorkspaceStore.getState()
    expect(state.tabs.map((tab) => tab.caseId)).toEqual(['c1', 'c2'])
    expect(state.activeCaseId).toBe('c1')
  })

  it('menutup tab aktif mengosongkan activeCaseId', () => {
    const { openTab, closeTab } = useWorkspaceStore.getState()
    openTab({ caseId: 'c1', title: 'CASE-1' })
    closeTab('c1')

    expect(useWorkspaceStore.getState().tabs).toEqual([])
    expect(useWorkspaceStore.getState().activeCaseId).toBeNull()
  })

  it('membatasi jumlah tab agar sesi panjang tidak bocor memori', () => {
    const { openTab } = useWorkspaceStore.getState()
    for (let index = 0; index < 12; index += 1) {
      openTab({ caseId: `c${index}`, title: `CASE-${index}` })
    }

    const { tabs } = useWorkspaceStore.getState()
    expect(tabs).toHaveLength(8)
    expect(tabs.at(-1)?.caseId).toBe('c11')
  })
})

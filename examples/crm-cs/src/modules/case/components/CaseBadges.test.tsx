import { masterDataKey } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { MasterData } from '@crm/api-client'
import { renderWithProviders } from '@crm/test-utils'
import { CasePriorityBadge, CaseStatusBadge } from './CaseBadges'

const masterData: MasterData = {
  statuses: [{ code: 'open', label: 'Baru', tone: 'info' }],
  queues: [],
  priorities: [{ code: 'urgent', label: 'Mendesak', tone: 'danger' }],
}

function seeded() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(masterDataKey, masterData)
  return queryClient
}

describe('CaseBadges', () => {
  it('menampilkan label dan warna dari master data', () => {
    renderWithProviders(<CaseStatusBadge status="open" />, { queryClient: seeded() })

    const badge = screen.getByText('Baru')
    expect(badge.className).toContain('text-brand-strong')
  })

  it('memakai master data untuk prioritas', () => {
    renderWithProviders(<CasePriorityBadge priority="urgent" />, { queryClient: seeded() })
    expect(screen.getByText('Mendesak').className).toContain('text-danger-ink')
  })

  it('kode yang tidak dikenal tampil apa adanya dengan warna netral', () => {
    renderWithProviders(<CaseStatusBadge status="on_hold" />, { queryClient: seeded() })

    const badge = screen.getByText('on_hold')
    expect(badge.className).toContain('text-ink-muted')
  })
})

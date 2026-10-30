import { masterDataKey } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Case, MasterData } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { renderWithRouter } from '@crm/test-utils'
import { registerTexts } from '@/texts'
import { caseKeys } from '../queries/keys'
import { CasePreview } from './CasePreview'

const masterData: MasterData = {
  statuses: [{ code: 'open', label: 'Baru', tone: 'info' }],
  queues: [],
  priorities: [{ code: 'urgent', label: 'Mendesak', tone: 'danger' }],
}

const caseItem = {
  id: 'c1',
  code: 'CASE-1',
  subject: 'Paket terlambat',
  description: 'Paket belum sampai.',
  status: 'open',
  queue: 'l1',
  priority: 'urgent',
  assignee: null,
  customer: { id: 'u1', name: 'Budi', phone: '0800', email: 'b@example.test' },
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-02T00:00:00Z',
  timeline: [],
} as unknown as Case

beforeAll(async () => {
  await createI18n()
  registerTexts()
})

describe('CasePreview', () => {
  it('shows the case summary and links to the detail page', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    queryClient.setQueryData(masterDataKey, masterData)
    queryClient.setQueryData(caseKeys.detail('c1'), caseItem)

    await renderWithRouter(<CasePreview caseId="c1" />, {
      queryClient,
      linkTargets: ['/cases/$caseId'],
    })

    expect(screen.getByText('Paket terlambat')).toBeInTheDocument()
    expect(screen.getByText('Mendesak')).toBeInTheDocument()
    expect(screen.getByText('Budi')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Buka detail case' })).toHaveAttribute(
      'href',
      '/cases/c1',
    )
  })
})

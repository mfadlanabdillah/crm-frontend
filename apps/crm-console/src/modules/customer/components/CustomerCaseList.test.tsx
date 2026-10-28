import { screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Case } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { renderWithRouter } from '@crm/test-utils'
import { CustomerCaseList } from './CustomerCaseList'

const item = {
  id: 'case-00001',
  code: 'CASE-2026-100001',
  subject: 'Paket belum diterima',
  status: 'open',
  createdAt: '2026-10-01T03:00:00.000Z',
} as Case

describe('CustomerCaseList', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('links each case to its detail route and shows the translated status', async () => {
    await renderWithRouter(<CustomerCaseList items={[item]} statusLabel={() => 'Baru'} />, {
      linkTargets: ['/cases/$caseId'],
    })

    expect(screen.getByRole('link', { name: 'CASE-2026-100001' })).toHaveAttribute(
      'href',
      '/cases/case-00001',
    )
    expect(screen.getByText('Paket belum diterima')).toBeInTheDocument()
    expect(screen.getByText('Baru')).toBeInTheDocument()
  })

  it('says so when the customer has no case', async () => {
    await renderWithRouter(<CustomerCaseList items={[]} statusLabel={(code) => code} />)

    expect(screen.getByText('Belum ada case untuk customer ini.')).toBeInTheDocument()
  })
})

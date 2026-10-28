import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { MasterData } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { renderWithProviders } from '@crm/test-utils'
import { masterDataKey } from '@/lib/query-keys'
import { DEFAULT_CASE_SEARCH } from '../schemas/search'
import { CaseFilters } from './CaseFilters'

const masterData: MasterData = {
  statuses: [
    { code: 'open', label: 'Baru', tone: 'info' },
    { code: 'on_hold', label: 'Ditahan', tone: 'warning' },
  ],
  queues: [{ code: 'swat', label: 'SWAT', tone: 'neutral' }],
  priorities: [],
}

beforeAll(async () => {
  await createI18n()
})

function renderFilters(props: Partial<Parameters<typeof CaseFilters>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(masterDataKey, masterData)
  const onChange = vi.fn()
  const onReset = vi.fn()
  renderWithProviders(
    <CaseFilters
      search={DEFAULT_CASE_SEARCH}
      data={undefined}
      onChange={onChange}
      onReset={onReset}
      {...props}
    />,
    { queryClient },
  )
  return { onChange, onReset }
}

describe('CaseFilters', () => {
  it('mengisi pilihan status dan antrean dari master data, bukan daftar tetap', () => {
    renderFilters()

    expect(screen.getByRole('option', { name: 'Ditahan' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'SWAT' })).toBeInTheDocument()
  })

  it('memilih status mengirim kodenya; memilih "semua" mengirim undefined', async () => {
    const { onChange } = renderFilters({ search: { ...DEFAULT_CASE_SEARCH, status: 'open' } })
    const status = screen.getByRole('combobox', { name: 'Status' })

    await userEvent.selectOptions(status, 'on_hold')
    expect(onChange).toHaveBeenLastCalledWith({ status: 'on_hold' })

    await userEvent.selectOptions(status, '')
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined })
  })

  it('submit pencarian memangkas spasi dan kosong menjadi undefined', async () => {
    const { onChange } = renderFilters()
    const box = screen.getByRole('searchbox')

    await userEvent.type(box, '  resi 123  {Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ q: 'resi 123' })

    await userEvent.clear(box)
    await userEvent.type(box, '   {Enter}')
    expect(onChange).toHaveBeenLastCalledWith({ q: undefined })
  })

  it('tombol hapus filter hanya ada saat ada filter aktif', async () => {
    const { onReset } = renderFilters({ search: { ...DEFAULT_CASE_SEARCH, queue: 'swat' } })

    await userEvent.click(screen.getByRole('button', { name: /hapus|bersihkan/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})

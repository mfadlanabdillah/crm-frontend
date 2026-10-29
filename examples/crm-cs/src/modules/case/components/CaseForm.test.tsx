import { masterDataKey } from '@crm/app-kit'
import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { MasterData } from '@crm/api-client'
import { createI18n } from '@crm/i18n'
import { registerTexts } from '@/texts'
import { renderWithProviders } from '@crm/test-utils'
import { CaseForm } from './CaseForm'

const masterData: MasterData = {
  statuses: [],
  queues: [{ code: 'swat', label: 'SWAT', tone: 'neutral' }],
  priorities: [{ code: 'urgent', label: 'Urgent', tone: 'danger' }],
}

beforeAll(async () => {
  await createI18n()
  registerTexts()
})

function renderForm(props: Partial<Parameters<typeof CaseForm>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(masterDataKey, masterData)
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  renderWithProviders(<CaseForm onSubmit={onSubmit} onCancel={onCancel} {...props} />, {
    queryClient,
  })
  return { onSubmit, onCancel }
}

describe('CaseForm', () => {
  it('shows translated validation errors and does not submit an empty form', async () => {
    const { onSubmit } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Buat case' }))

    expect(await screen.findByText('Subjek minimal 3 karakter.')).toBeInTheDocument()
    expect(screen.getAllByText('Wajib dipilih.')).toHaveLength(2)
    expect(screen.getByLabelText('Subjek')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('offers priorities and queues from master data only', () => {
    renderForm()
    expect(screen.getByRole('option', { name: 'SWAT' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
  })

  it('submits the request built from the form values', async () => {
    const { onSubmit } = renderForm()

    await userEvent.type(screen.getByLabelText('Subjek'), '  Paket belum sampai ')
    await userEvent.selectOptions(screen.getByLabelText('Prioritas'), 'urgent')
    await userEvent.selectOptions(screen.getByLabelText('Antrean'), 'swat')
    await userEvent.click(screen.getByRole('button', { name: 'Buat case' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      subject: 'Paket belum sampai',
      priority: 'urgent',
      queue: 'swat',
    })
  })

  it('disables the buttons while pending and shows a server error', () => {
    renderForm({ isPending: true, error: 'Subjek minimal 3 karakter' })

    expect(screen.getByRole('button', { name: 'Membuat…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Subjek minimal 3 karakter')
  })

  it('calls onCancel', async () => {
    const { onCancel } = renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

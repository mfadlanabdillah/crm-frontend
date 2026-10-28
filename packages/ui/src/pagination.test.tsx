import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createI18n } from '@crm/i18n'
import { Pagination } from './pagination'

describe('Pagination', () => {
  beforeAll(async () => {
    await createI18n()
  })

  it('reports the previous and next page and shows the summary', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)

    expect(screen.getByText('Halaman 2 dari 5')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sebelumnya' }))

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3)
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1)
  })

  it('disables the buttons at both ends, and treats zero pages as one', () => {
    const { rerender } = render(<Pagination page={1} totalPages={0} onPageChange={() => {}} />)

    expect(screen.getByRole('button', { name: 'Sebelumnya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled()
    expect(screen.getByText('Halaman 1 dari 1')).toBeInTheDocument()

    rerender(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Berikutnya' })).toBeDisabled()
  })

  it('renders extra controls next to the summary', () => {
    render(
      <Pagination page={1} totalPages={2} onPageChange={() => {}}>
        <span>ukuran halaman</span>
      </Pagination>,
    )

    expect(screen.getByText('ukuran halaman')).toBeInTheDocument()
  })
})

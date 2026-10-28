import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Page, PageHeader } from './page'

describe('Page', () => {
  it('limits the width of the body', () => {
    render(
      <Page width="sm">
        <p>isi</p>
      </Page>,
    )

    expect(screen.getByText('isi').parentElement).toHaveClass('max-w-xl')
  })
})

describe('PageHeader', () => {
  it('shows the title, the purpose line, and the actions', () => {
    render(
      <PageHeader
        title="Case"
        description="Kelola case"
        actions={<button type="button">Baru</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Case' })).toBeInTheDocument()
    expect(screen.getByText('Kelola case')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Baru' })).toBeInTheDocument()
  })

  it('leaves the purpose line out when there is none', () => {
    render(<PageHeader title="Case" />)

    expect(screen.queryByText('Kelola case')).not.toBeInTheDocument()
  })
})

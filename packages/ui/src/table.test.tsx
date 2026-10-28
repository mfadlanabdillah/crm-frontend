import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Table, TBody, Td, Th, THead, Tr } from './table'

describe('Table', () => {
  it('builds an accessible table: column headers carry a scope', () => {
    render(
      <Table>
        <THead>
          <Tr>
            <Th>Nama</Th>
          </Tr>
        </THead>
        <TBody>
          <Tr>
            <Td>Sari</Td>
          </Tr>
        </TBody>
      </Table>,
    )

    expect(screen.getByRole('columnheader', { name: 'Nama' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('cell', { name: 'Sari' })).toBeInTheDocument()
  })

  it('can keep a cell on one line (codes, amounts)', () => {
    render(
      <Table>
        <TBody>
          <Tr>
            <Td nowrap>RF-2026-1001</Td>
          </Tr>
        </TBody>
      </Table>,
    )

    expect(screen.getByRole('cell')).toHaveClass('whitespace-nowrap')
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './badge'
import { Button } from './button'
import { Input } from './input'
import { Select } from './select'
import { Skeleton } from './skeleton'
import { Textarea } from './textarea'

describe('primitives', () => {
  it('Button defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Simpan</Button>)

    expect(screen.getByRole('button', { name: 'Simpan' })).toHaveAttribute('type', 'button')
  })

  it('Button variants change the look, not the element', () => {
    render(
      <Button variant="danger" size="sm">
        Hapus
      </Button>,
    )

    expect(screen.getByRole('button')).toHaveClass('bg-danger', 'h-8')
  })

  it('Badge colors come from design tokens, never from the Tailwind palette', () => {
    render(
      <>
        <Badge tone="success">a</Badge>
        <Badge tone="warning">b</Badge>
        <Badge tone="danger">c</Badge>
      </>,
    )

    expect(screen.getByText('a')).toHaveClass('bg-success-soft', 'text-success-ink')
    expect(screen.getByText('b')).toHaveClass('bg-warning-soft', 'text-warning-ink')
    expect(screen.getByText('c')).toHaveClass('bg-danger-soft', 'text-danger-ink')
  })

  it('form controls share one height and forward their attributes', () => {
    render(
      <>
        <Input aria-label="cari" />
        <Select aria-label="status">
          <option>x</option>
        </Select>
        <Textarea aria-label="catatan" />
      </>,
    )

    expect(screen.getByLabelText('cari')).toHaveClass('h-9')
    expect(screen.getByLabelText('status')).toHaveClass('h-9')
    expect(screen.getByLabelText('catatan')).toHaveClass('min-h-24')
  })

  it('Skeleton has preset sizes that className can still override', () => {
    const { container } = render(<Skeleton size="row" className="w-1/2" />)

    expect(container.firstElementChild).toHaveClass('h-10', 'w-1/2')
    expect(container.firstElementChild).not.toHaveClass('w-full')
  })

  it('Skeleton is hidden from assistive technology', () => {
    const { container } = render(<Skeleton className="h-4" />)

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})

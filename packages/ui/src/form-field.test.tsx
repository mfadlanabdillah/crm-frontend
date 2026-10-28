import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormField } from './form-field'

describe('FormField', () => {
  it('links the label to the control and describes it with the hint', () => {
    render(
      <FormField label="Subject" hint="Short summary">
        {(control) => <input {...control} />}
      </FormField>,
    )

    const input = screen.getByLabelText('Subject')
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveAccessibleDescription('Short summary')
  })

  it('marks the control invalid and describes it with hint and error', () => {
    render(
      <FormField label="Subject" hint="Short summary" error="Too short">
        {(control) => <input {...control} />}
      </FormField>,
    )

    const input = screen.getByLabelText('Subject')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Short summary Too short')
  })

  it('has no aria-describedby without hint or error', () => {
    render(<FormField label="Name">{(control) => <input {...control} />}</FormField>)
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby')
  })
})

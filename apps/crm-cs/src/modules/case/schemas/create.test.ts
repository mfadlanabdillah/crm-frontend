import { describe, expect, it } from 'vitest'
import { createCaseSchema, toCreateCaseRequest } from './create'

const valid = { subject: 'Package not delivered', description: '', priority: 'normal', queue: 'l1' }

describe('createCaseSchema', () => {
  it('accepts a valid form and trims text', () => {
    const parsed = createCaseSchema.parse({ ...valid, subject: '  Package not delivered  ' })
    expect(parsed.subject).toBe('Package not delivered')
  })

  it.each([
    [{ subject: 'ab' }, 'subject', 'cases.create.errors.subjectShort'],
    [{ subject: 'x'.repeat(121) }, 'subject', 'cases.create.errors.subjectLong'],
    [{ description: 'x'.repeat(2001) }, 'description', 'cases.create.errors.descriptionLong'],
    [{ priority: '' }, 'priority', 'cases.create.errors.required'],
    [{ queue: '' }, 'queue', 'cases.create.errors.required'],
  ])('rejects %j with an i18n key as the message', (patch, field, key) => {
    const result = createCaseSchema.safeParse({ ...valid, ...patch })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((item) => item.path[0] === field)
    expect(issue?.message).toBe(key)
  })
})

describe('toCreateCaseRequest', () => {
  it('omits an empty description', () => {
    expect(toCreateCaseRequest(valid)).toEqual({
      subject: 'Package not delivered',
      priority: 'normal',
      queue: 'l1',
    })
  })

  it('keeps a filled description', () => {
    expect(toCreateCaseRequest({ ...valid, description: 'Details' }).description).toBe('Details')
  })
})

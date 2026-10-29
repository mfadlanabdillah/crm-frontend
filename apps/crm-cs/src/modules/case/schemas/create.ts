import { z } from 'zod'
import type { CreateCaseRequest } from '@crm/api-client'

/** Messages are i18n keys; the form translates them with `t(error.message)`. */
export const createCaseSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'cases.create.errors.subjectShort')
    .max(120, 'cases.create.errors.subjectLong'),
  description: z.string().trim().max(2000, 'cases.create.errors.descriptionLong'),
  // Codes come from master data, so the form starts empty instead of hardcoding a business default.
  priority: z.string().min(1, 'cases.create.errors.required'),
  queue: z.string().min(1, 'cases.create.errors.required'),
})

export type CreateCaseForm = z.infer<typeof createCaseSchema>

export const EMPTY_CREATE_CASE_FORM: CreateCaseForm = {
  subject: '',
  description: '',
  priority: '',
  queue: '',
}

export function toCreateCaseRequest(values: CreateCaseForm): CreateCaseRequest {
  return {
    subject: values.subject,
    priority: values.priority,
    queue: values.queue,
    ...(values.description ? { description: values.description } : {}),
  }
}

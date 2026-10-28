import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(['l1', 'l2', 'supervisor', 'admin']),
})

/**
 * Event real-time sengaja membawa patch minimal, bukan seluruh case:
 * cache di client cukup di-update di tempat tanpa refetch massal.
 */
export const caseEventSchema = z.object({
  id: z.string(),
  type: z.enum(['case.created', 'case.updated', 'case.assigned', 'case.escalated']),
  caseId: z.string(),
  occurredAt: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignee: userSchema.nullish(),
})

export type CaseEventPayload = z.infer<typeof caseEventSchema>

export type CaseEventPatch = Pick<CaseEventPayload, 'status' | 'priority' | 'assignee'>

export function toCasePatch(event: CaseEventPayload): CaseEventPatch {
  return {
    ...(event.status ? { status: event.status } : {}),
    ...(event.priority ? { priority: event.priority } : {}),
    ...(event.assignee !== undefined ? { assignee: event.assignee ?? null } : {}),
  }
}

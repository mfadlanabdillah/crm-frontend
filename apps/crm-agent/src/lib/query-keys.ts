export const sessionKey = ['session'] as const
export const masterDataKey = ['master-data'] as const

export const caseKeys = {
  all: ['cases'] as const,
  lists: () => [...caseKeys.all, 'list'] as const,
  list: (params: unknown) => [...caseKeys.lists(), params] as const,
  detail: (caseId: string) => [...caseKeys.all, 'detail', caseId] as const,
  summary: () => [...caseKeys.all, 'summary'] as const,
}

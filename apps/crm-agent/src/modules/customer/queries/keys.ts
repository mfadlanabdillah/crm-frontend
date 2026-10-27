export const customerKeys = {
  all: ['customer'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: unknown) => [...customerKeys.lists(), params] as const,
  detail: (customerId: string) => [...customerKeys.all, 'detail', customerId] as const,
}

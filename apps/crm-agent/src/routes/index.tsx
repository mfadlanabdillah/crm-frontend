import { createFileRoute, redirect } from '@tanstack/react-router'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/cases', search: DEFAULT_CASE_SEARCH })
  },
})

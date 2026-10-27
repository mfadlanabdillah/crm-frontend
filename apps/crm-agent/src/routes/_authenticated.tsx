import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/app/layout/AppShell'
import { sessionQueryOptions } from '@/app/auth/session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    return { session }
  },
  component: AppShell,
})

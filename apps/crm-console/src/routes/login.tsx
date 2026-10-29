import { env } from '@crm/app-kit'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Alert, Button } from '@crm/ui'
import { useSignIn, sessionQueryOptions } from '@/app/auth/session'
import { safeRedirectPath } from '@/lib/redirect'

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  // Juga menangani kembalinya agen dari SSO: returnTo = /login?redirect=...
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!session) return
    // Sanitasi di titik pakai: search route digabung dengan search mentah dari
    // root, jadi membuang key di validateSearch tidak cukup.
    const redirectTo = safeRedirectPath(search.redirect)
    if (redirectTo) throw redirect({ href: redirectTo })
    throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const signIn = useSignIn()
  const redirectTo = safeRedirectPath(Route.useSearch().redirect)

  const handleSignIn = () => {
    signIn.mutate(undefined, {
      onSuccess: (session) => {
        if (!session) return
        void queryClient.invalidateQueries()
        if (redirectTo) {
          router.history.push(redirectTo)
        } else {
          void navigate({ to: '/' })
        }
      },
    })
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-sm">
        <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold text-ink">{t('login.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('login.description')}</p>

        <Button className="mt-6 w-full" onClick={handleSignIn} disabled={signIn.isPending}>
          {signIn.isPending ? t('common.loading') : t('login.button')}
        </Button>

        {signIn.isError ? <Alert className="mt-3">{signIn.error.message}</Alert> : null}

        {env.mocksEnabled ? (
          <p className="mt-4 text-xs text-ink-muted">{t('login.devHint')}</p>
        ) : null}
      </div>
    </div>
  )
}

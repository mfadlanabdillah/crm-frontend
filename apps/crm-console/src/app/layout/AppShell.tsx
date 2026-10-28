import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { useAuth } from '@crm/auth'
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button } from '@crm/ui'
import type { BadgeTone } from '@crm/ui'
import { useSignOut } from '@/app/auth/sign-out'
import { useConnectionStore, worstStatus } from '@/app/modules/connection'
import { findActiveModule, getVisibleModules } from '@/app/modules/registry'
import type { ModuleDefinition } from '@/modules/types'
import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'
import type { StreamStatus } from '@/lib/sse'

const connectionTone: Record<StreamStatus, BadgeTone> = {
  connecting: 'warning',
  reconnecting: 'warning',
  live: 'success',
  offline: 'danger',
  closed: 'muted',
}

function ConnectionBadge({ status }: { status: StreamStatus }) {
  const { t } = useTranslation()
  const label =
    status === 'live'
      ? t('common.connection.live')
      : status === 'offline'
        ? t('common.connection.offline')
        : status === 'closed'
          ? t('common.connection.offline')
          : t('common.connection.reconnecting')

  return (
    <Badge tone={connectionTone[status]} className="gap-1.5">
      <span
        aria-hidden="true"
        className={
          status === 'live'
            ? 'size-1.5 rounded-full bg-success'
            : status === 'offline'
              ? 'size-1.5 rounded-full bg-danger'
              : 'size-1.5 animate-pulse rounded-full bg-warning'
        }
      />
      {label}
    </Badge>
  )
}

/** Menjalankan hook real-time sebuah modul dan melaporkan statusnya ke indikator header. */
function ModuleRealtime({ module }: { module: ModuleDefinition }) {
  const status = module.useRealtime?.()
  const report = useConnectionStore((state) => state.report)
  const clear = useConnectionStore((state) => state.clear)

  useEffect(() => {
    if (status) report(module.id, status)
    return () => clear(module.id)
  }, [module.id, status, report, clear])

  return null
}

const navBase = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors'
const navIdle = 'text-ink-muted hover:bg-surface-muted hover:text-ink'
const navActive = 'bg-brand-soft font-medium text-brand-strong'

function ModuleNav({
  items,
  active,
  variant = 'sidebar',
}: {
  items: readonly ModuleDefinition[]
  active: ModuleDefinition | undefined
  variant?: 'sidebar' | 'inline'
}) {
  const { t } = useTranslation()
  const inline = variant === 'inline'

  return (
    <nav
      aria-label={t('common.modules')}
      className={cn(
        'border-b border-border-subtle',
        inline ? 'flex gap-1 overflow-x-auto px-3 py-2 lg:hidden' : 'space-y-1 p-3',
      )}
    >
      {items.map((module) => (
        <Link
          key={module.id}
          {...module.nav}
          className={cn(
            navBase,
            inline && 'shrink-0',
            module.id === active?.id ? navActive : navIdle,
          )}
          aria-current={module.id === active?.id ? 'page' : undefined}
        >
          <module.icon className="size-4" aria-hidden="true" />
          {t(module.labelKey)}
        </Link>
      ))}
    </nav>
  )
}

export function AppShell() {
  const { t } = useTranslation()
  const { session } = useAuth()
  const signOut = useSignOut()
  const { pathname } = useLocation()
  const streamStatus = useConnectionStore((state) => worstStatus(state.statuses))
  const visibleModules = getVisibleModules(session?.user.role)
  const active = findActiveModule(pathname)
  const ActiveSidebar = active?.Sidebar
  const ActiveTabs = active?.Tabs

  return (
    <div className="flex h-full">
      {/* Hanya modul yang boleh dilihat peran ini yang membuka koneksi real-time. */}
      {visibleModules.map((module) => (
        <ModuleRealtime key={module.id} module={module} />
      ))}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-surface-raised lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border-subtle px-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
            CA
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{t('common.appName')}</p>
            <p className="truncate text-[11px] text-ink-muted">Customer Service</p>
          </div>
        </div>

        <ModuleNav items={visibleModules} active={active} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {ActiveSidebar ? <ActiveSidebar /> : null}
        </div>

        <div className="border-t border-border-subtle p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-ink"
            >
              {session ? initials(session.user.name) : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{session?.user.name ?? '—'}</p>
              <p className="truncate text-xs text-ink-muted uppercase">
                {session?.user.role ?? '—'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              aria-label={t('common.signOut')}
              title={t('common.signOut')}
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-raised px-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white lg:hidden">
            CA
          </span>
          <h1 className="hidden text-sm font-semibold text-ink sm:block">
            {active ? t(active.labelKey) : t('common.appName')}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {streamStatus ? <ConnectionBadge status={streamStatus} /> : null}
            <span className="hidden text-xs text-ink-muted sm:inline">
              {session ? t('common.signedInAs') : null}
              {session ? ` ${session.user.name}` : null}
            </span>
          </div>
        </header>

        {visibleModules.length > 1 ? (
          <ModuleNav items={visibleModules} active={active} variant="inline" />
        ) : null}

        {ActiveSidebar ? (
          <div className="lg:hidden">
            <ActiveSidebar variant="inline" />
          </div>
        ) : null}

        {ActiveTabs ? <ActiveTabs /> : null}

        <main className="min-h-0 flex-1 overflow-hidden bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

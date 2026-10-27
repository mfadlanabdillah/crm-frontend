import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { DEFAULT_CASE_SEARCH } from '@/modules/case/schemas/search'
import { useWorkspaceStore } from '@/modules/case/store/workspace'

export function WorkspaceTabs() {
  const { t } = useTranslation()
  const tabs = useWorkspaceStore((state) => state.tabs)
  const activeCaseId = useWorkspaceStore((state) => state.activeCaseId)
  const closeTab = useWorkspaceStore((state) => state.closeTab)
  const setActive = useWorkspaceStore((state) => state.setActive)
  const navigate = useNavigate()
  const location = useLocation()

  if (tabs.length === 0 || !location.pathname.startsWith('/cases/')) return null

  const handleClose = (caseId: string) => {
    closeTab(caseId)
    if (caseId !== activeCaseId) return

    const remaining = tabs.filter((tab) => tab.caseId !== caseId)
    const next = remaining[remaining.length - 1]
    if (next) {
      void navigate({ to: '/cases/$caseId', params: { caseId: next.caseId } })
    } else {
      void navigate({ to: '/cases', search: DEFAULT_CASE_SEARCH })
    }
  }

  return (
    <nav
      aria-label={t('cases.tabs')}
      className="flex items-center gap-1 overflow-x-auto border-b border-border-subtle bg-surface-muted/60 px-2 py-1.5"
    >
      {tabs.map((tab) => {
        const isActive = tab.caseId === activeCaseId
        return (
          <div
            key={tab.caseId}
            className={cn(
              'group flex shrink-0 items-center rounded-lg border text-sm',
              isActive
                ? 'border-border-subtle bg-surface text-ink shadow-sm'
                : 'border-transparent text-ink-muted hover:bg-surface/60',
            )}
          >
            <Link
              to="/cases/$caseId"
              params={{ caseId: tab.caseId }}
              onClick={() => setActive(tab.caseId)}
              className="max-w-48 truncate py-1.5 pr-1 pl-2.5"
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.title}
            </Link>
            <button
              type="button"
              onClick={() => handleClose(tab.caseId)}
              className="mr-1 rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label={`Tutup ${tab.title}`}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </nav>
  )
}

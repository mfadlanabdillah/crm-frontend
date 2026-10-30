import { Button } from '@crm/ui'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** Shown from the `lg` breakpoint up, where the sidebar exists. Below it the menu is a top bar. */
export function SidebarToggle({
  collapsed,
  onToggle,
  controls,
}: {
  collapsed: boolean
  onToggle: () => void
  controls: string
}) {
  const { t } = useTranslation()
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden lg:inline-flex"
      aria-label={collapsed ? t('common.expandSidebar') : t('common.collapseSidebar')}
      aria-expanded={!collapsed}
      aria-controls={controls}
      onClick={onToggle}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  )
}

import type { RemoteModule } from '@crm/module-contract'
import { Gauge } from 'lucide-react'
import { getI18n } from 'react-i18next'
import { MonitorPage } from './MonitorPage'

// Texts live under this module's own id; a remote must not write outside its namespace.
const resources = {
  'id-ID': {
    title: 'Monitor',
    intro: 'Beban antrean saat ini, dimuat dari aplikasi terpisah (crm-monitor).',
    loading: 'Memuat…',
    failed: 'Gagal memuat data.',
    unassigned: 'Belum di-assign',
    overdue: 'Lewat batas waktu',
    queue: 'Antrean',
    open: 'Case terbuka',
    refreshed: 'Diperbarui otomatis tiap 30 detik',
  },
  'en-US': {
    title: 'Monitor',
    intro: 'Current queue load, loaded from a separate app (crm-monitor).',
    loading: 'Loading…',
    failed: 'Failed to load data.',
    unassigned: 'Unassigned',
    overdue: 'Overdue',
    queue: 'Queue',
    open: 'Open cases',
    refreshed: 'Refreshes automatically every 30 seconds',
  },
} as const

const i18n = getI18n()
for (const [locale, bundle] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, 'translation', { monitor: bundle }, true, true)
}

const monitorModule = {
  id: 'monitor',
  labelKey: 'monitor.title',
  icon: Gauge,
  basePath: '/remote/monitor',
  nav: { to: '/remote/$moduleId', params: { moduleId: 'monitor' } },
  // Stand-in: an existing permission held by supervisor and admin only. A dedicated permission is a
  // business decision for packages/auth/src/roles.ts.
  permission: 'case.reassign',
  Page: MonitorPage,
} satisfies RemoteModule

export default monitorModule

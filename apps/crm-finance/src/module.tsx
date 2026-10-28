import type { RemoteModule } from '@crm/module-contract'
import { Landmark } from 'lucide-react'
import { getI18n } from 'react-i18next'
import { FinancePage } from './FinancePage'

// The remote brings its own text: it is added to the host's i18next instance when the module loads.
const resources = {
  'id-ID': {
    title: 'Finance',
    intro: 'Modul ini dimuat saat runtime dari aplikasi terpisah (crm-finance).',
    user: 'Pengguna',
    role: 'Peran',
    language: 'Bahasa',
    reactVersion: 'Versi React',
    cachedQueries: 'Query di cache bersama',
    loadedAt: 'Dimuat',
    clicks_one: 'Diklik {{count}} kali',
    clicks_other: 'Diklik {{count}} kali',
  },
  'en-US': {
    title: 'Finance',
    intro: 'This module is loaded at runtime from a separate app (crm-finance).',
    user: 'User',
    role: 'Role',
    language: 'Language',
    reactVersion: 'React version',
    cachedQueries: 'Queries in the shared cache',
    loadedAt: 'Loaded',
    clicks_one: 'Clicked {{count}} time',
    clicks_other: 'Clicked {{count}} times',
  },
} as const

const i18n = getI18n()
for (const [locale, bundle] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, 'translation', { finance: bundle }, true, true)
}

const financeModule = {
  id: 'finance',
  labelKey: 'finance.title',
  icon: Landmark,
  basePath: '/remote/finance',
  nav: { to: '/remote/$moduleId', params: { moduleId: 'finance' } },
  Page: FinancePage,
} satisfies RemoteModule

export default financeModule

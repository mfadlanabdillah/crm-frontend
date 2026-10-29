import type { RemoteModule } from '@crm/module-contract'
import { ShieldAlert } from 'lucide-react'
import { getI18n } from 'react-i18next'
import { InvestigatorPage } from './InvestigatorPage'

// Texts live under this module's own id; a remote must not write outside its namespace.
const resources = {
  'id-ID': {
    title: 'Investigator',
    intro: 'Case yang dieskalasi, dimuat dari aplikasi terpisah (crm-investigator).',
    noQueue: 'Antrean eskalasi tidak ada di master data.',
    empty: 'Tidak ada case di antrean eskalasi.',
    loading: 'Memuat…',
    failed: 'Gagal memuat data.',
    code: 'Kode',
    subject: 'Subjek',
    customer: 'Customer',
    status: 'Status',
    priority: 'Prioritas',
    updated: 'Diperbarui',
    back: 'Kembali ke daftar',
    notFound: 'Halaman tidak ditemukan.',
    timeline: 'Timeline',
    internal: 'Internal',
    assignee: 'Penanggung jawab',
    stt: 'Nomor STT',
    unassigned: 'Belum di-assign',
    queue: 'Antrean',
    note: 'Catatan internal',
    addNote: 'Tambah catatan',
    openInCase: 'Buka di Case',
    actions: 'Tindakan',
  },
  'en-US': {
    title: 'Investigator',
    intro: 'Escalated cases, loaded from a separate app (crm-investigator).',
    noQueue: 'The escalation queue is not in master data.',
    empty: 'No cases in the escalation queue.',
    loading: 'Loading…',
    failed: 'Failed to load data.',
    code: 'Code',
    subject: 'Subject',
    customer: 'Customer',
    status: 'Status',
    priority: 'Priority',
    updated: 'Updated',
    back: 'Back to the list',
    notFound: 'Page not found.',
    timeline: 'Timeline',
    internal: 'Internal',
    assignee: 'Assignee',
    stt: 'STT number',
    unassigned: 'Unassigned',
    queue: 'Queue',
    note: 'Internal note',
    addNote: 'Add note',
    openInCase: 'Open in Case',
    actions: 'Actions',
  },
} as const

const i18n = getI18n()
for (const [locale, bundle] of Object.entries(resources)) {
  i18n.addResourceBundle(locale, 'translation', { investigator: bundle }, true, true)
}

const investigatorModule = {
  id: 'investigator',
  labelKey: 'investigator.title',
  icon: ShieldAlert,
  basePath: '/remote/investigator',
  nav: { to: '/remote/$moduleId', params: { moduleId: 'investigator' } },
  // Stand-in: an existing permission held by L2, supervisor, and admin. A dedicated permission is a
  // business decision for packages/auth/src/roles.ts.
  permission: 'case.escalate',
  Page: InvestigatorPage,
} satisfies RemoteModule

export default investigatorModule

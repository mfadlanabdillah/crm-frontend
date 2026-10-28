import type { RemoteModule } from '@crm/module-contract'
import { Landmark } from 'lucide-react'
import { getI18n } from 'react-i18next'
import { FinancePage } from './FinancePage'

// Texts live under this module's own id; a remote must not write outside its namespace.
const resources = {
  'id-ID': {
    title: 'Finance',
    intro: 'Permintaan refund dari tim CS, dimuat dari aplikasi terpisah (crm-finance).',
    all: 'Semua status',
    filter: 'Status',
    loading: 'Memuat…',
    failed: 'Gagal memuat data.',
    empty: 'Tidak ada permintaan refund.',
    code: 'Kode',
    customer: 'Customer',
    amount: 'Nominal',
    reason: 'Alasan',
    requested: 'Diajukan',
    decide: 'Putuskan',
    close: 'Tutup',
    openCase: 'Buka case',
    note: 'Catatan keputusan',
    noteHint: 'Wajib diisi, minimal 3 karakter.',
    approve: 'Setujui',
    reject: 'Tolak',
    decidedBy: 'Diputuskan oleh {{name}}',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    pageOf: 'Halaman {{page}} dari {{total}}',
    sharedTitle: 'Konteks bersama dengan host',
    user: 'Pengguna',
    role: 'Peran',
    cachedQueries: 'Query di cache bersama',
  },
  'en-US': {
    title: 'Finance',
    intro: 'Refund requests from the CS team, loaded from a separate app (crm-finance).',
    all: 'All statuses',
    filter: 'Status',
    loading: 'Loading…',
    failed: 'Failed to load data.',
    empty: 'No refund requests.',
    code: 'Code',
    customer: 'Customer',
    amount: 'Amount',
    reason: 'Reason',
    requested: 'Requested',
    decide: 'Decide',
    close: 'Close',
    openCase: 'Open case',
    note: 'Decision note',
    noteHint: 'Required, at least 3 characters.',
    approve: 'Approve',
    reject: 'Reject',
    decidedBy: 'Decided by {{name}}',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{page}} of {{total}}',
    sharedTitle: 'Context shared with the host',
    user: 'User',
    role: 'Role',
    cachedQueries: 'Queries in the shared cache',
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
  // Stand-in: an existing permission held by supervisor and admin only. A Finance permission is a
  // business decision for packages/auth/src/roles.ts.
  permission: 'case.export',
  Page: FinancePage,
} satisfies RemoteModule

export default financeModule

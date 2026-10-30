const idID = {
  common: {
    appName: 'CRM',
    loading: 'Memuat…',
    retry: 'Coba lagi',
    cancel: 'Batal',
    save: 'Simpan',
    search: 'Cari',
    clear: 'Bersihkan',
    signOut: 'Keluar',
    signedInAs: 'Masuk sebagai',
    modules: 'Modul',
    connection: {
      live: 'Realtime aktif',
      reconnecting: 'Menyambung ulang…',
      offline: 'Realtime terputus',
    },
    emptyTitle: 'Belum ada data',
    emptyDescription: 'Coba ubah filter atau kriteria pencarian.',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    pageOf: 'Halaman {{page}} dari {{totalPages}}',
    errorTitle: 'Gagal memuat data',
    errorDescription: 'Periksa koneksi Anda lalu coba lagi.',
    rowsPerPage: 'Baris per halaman',
    of: 'dari',
    close: 'Tutup',
    notifications: 'Notifikasi',
    collapseSidebar: 'Ciutkan sidebar',
    expandSidebar: 'Perluas sidebar',
  },
  errors: {
    title: 'Terjadi kesalahan',
    description: 'Halaman gagal ditampilkan. Coba lagi, atau muat ulang halaman.',
    reference: 'Kode referensi: {{id}}',
    reload: 'Muat ulang halaman',
    notFound: 'Halaman tidak ditemukan.',
  },
  home: {
    noModulesTitle: 'Belum ada menu',
    noModulesDescription:
      'Peran Anda belum punya akses ke modul mana pun, atau modul belum dimuat. Hubungi admin.',
  },
  remote: {
    loadFailed: 'Sebagian layar gagal dimuat: {{names}}. Periksa koneksi, lalu muat ulang.',
    retry: 'Muat ulang',
    unavailableTitle: 'Modul tidak tersedia',
    unavailableDescription:
      'Modul ini dimuat dari aplikasi lain yang saat ini tidak dapat dijangkau.',
  },
  login: {
    title: 'Masuk ke CRM',
    description: 'Gunakan akun SSO internal untuk melanjutkan.',
    button: 'Masuk lewat SSO',
    devHint: 'Mode mock: sesi dibuat lokal oleh MSW, tidak ada data produksi.',
  },
} as const

const enUS = {
  common: {
    appName: 'CRM',
    loading: 'Loading…',
    retry: 'Try again',
    cancel: 'Cancel',
    save: 'Save',
    search: 'Search',
    clear: 'Clear',
    signOut: 'Sign out',
    signedInAs: 'Signed in as',
    modules: 'Modules',
    connection: {
      live: 'Realtime connected',
      reconnecting: 'Reconnecting…',
      offline: 'Realtime offline',
    },
    emptyTitle: 'Nothing here yet',
    emptyDescription: 'Adjust the filters or search terms.',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {{page}} of {{totalPages}}',
    errorTitle: 'Could not load data',
    errorDescription: 'Check your connection and try again.',
    rowsPerPage: 'Rows per page',
    of: 'of',
    close: 'Close',
    notifications: 'Notifications',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
  },
  errors: {
    title: 'Something went wrong',
    description: 'The page could not be displayed. Try again, or reload the page.',
    reference: 'Reference code: {{id}}',
    reload: 'Reload page',
    notFound: 'Page not found.',
  },
  home: {
    noModulesTitle: 'No menu yet',
    noModulesDescription:
      'Your role has no access to any module, or the modules did not load. Contact an admin.',
  },
  remote: {
    loadFailed: 'Some screens failed to load: {{names}}. Check your connection, then reload.',
    retry: 'Reload',
    unavailableTitle: 'Module unavailable',
    unavailableDescription:
      'This module is loaded from another app that cannot be reached right now.',
  },
  login: {
    title: 'Sign in to CRM',
    description: 'Use your internal SSO account to continue.',
    button: 'Sign in with SSO',
    devHint: 'Mock mode: the session is created locally by MSW; no production data.',
  },
} as const

export const resources = {
  'id-ID': { translation: idID },
  'en-US': { translation: enUS },
} as const

export type AppLocale = keyof typeof resources

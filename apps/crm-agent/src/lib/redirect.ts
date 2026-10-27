const PROBE_ORIGIN = 'http://same-origin.invalid'

/**
 * Terima hanya path internal untuk param `?redirect=`. Parsing lewat `URL`
 * supaya trik seperti `//evil.com`, `/\evil.com`, atau tab di tengah path
 * diperlakukan sama seperti oleh browser, lalu ditolak karena beda origin.
 */
export function safeRedirectPath(value: string | undefined): string | undefined {
  if (!value || !value.startsWith('/')) return undefined

  let url: URL
  try {
    url = new URL(value, PROBE_ORIGIN)
  } catch {
    return undefined
  }

  if (url.origin !== PROBE_ORIGIN) return undefined
  // Kembali ke /login hanya membuat loop.
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) return undefined

  return `${url.pathname}${url.search}${url.hash}`
}

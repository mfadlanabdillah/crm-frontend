import { describe, expect, it } from 'vitest'
import { stripHtml } from './text'

describe('stripHtml', () => {
  it('mengubah paragraf dan baris menjadi teks', () => {
    expect(stripHtml('<p>Halo</p><p>Paket siap diambil</p>')).toBe('Halo\nPaket siap diambil')
  })

  it('mengubah entity dasar tanpa mengeksekusi tag', () => {
    expect(stripHtml('<p>Status &lt;dalam perjalanan&gt; &amp; aman</p>')).toBe(
      'Status <dalam perjalanan> & aman',
    )
  })

  it('tidak menyisakan tag script', () => {
    expect(stripHtml('<p>Aman</p><script>alert(1)</script>')).toBe('Aman')
  })
})

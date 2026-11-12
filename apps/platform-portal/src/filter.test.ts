import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { filterCatalog } from './filter'

describe('filterCatalog', () => {
  it('mengembalikan seluruh katalog untuk kata kunci kosong', () => {
    expect(filterCatalog(catalog, '   ')).toEqual(catalog)
  })

  it('menyaring modul berdasarkan id', () => {
    const view = filterCatalog(catalog, 'customer')
    expect(view.modules.map((mod) => mod.id)).toEqual(['customer'])
  })

  it('menyaring paket berdasarkan nama', () => {
    const view = filterCatalog(catalog, '@crm/ui')
    expect(view.packages.map((pkg) => pkg.name)).toEqual(['@crm/ui'])
  })

  it('mengembalikan daftar kosong saat tidak ada yang cocok', () => {
    const view = filterCatalog(catalog, 'zzz-not-there')
    expect(view.remotes).toEqual([])
    expect(view.modules).toEqual([])
    expect(view.packages).toEqual([])
  })
})

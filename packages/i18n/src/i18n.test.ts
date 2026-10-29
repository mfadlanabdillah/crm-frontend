import { describe, expect, it } from 'vitest'
import { createI18n, resources } from './index'

describe('i18n', () => {
  it('memakai id-ID sebagai default', async () => {
    const instance = await createI18n()
    expect(instance.language).toBe('id-ID')
    expect(instance.t('login.button')).toBe('Masuk lewat SSO')
  })

  it('bisa memuat en-US', async () => {
    const instance = await createI18n('en-US')
    expect(instance.language).toBe('en-US')
    expect(instance.t('login.button')).toBe('Sign in with SSO')
  })
})

type Tree = { readonly [key: string]: string | Tree }

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string'
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) }
  }, {})
}

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort()

describe('kelengkapan locale', () => {
  const id = flatten(resources['id-ID'].translation)
  const en = flatten(resources['en-US'].translation)

  it('id-ID dan en-US punya kunci yang sama persis', () => {
    const idKeys = Object.keys(id).sort()
    const enKeys = Object.keys(en).sort()
    expect({
      hanyaDiId: idKeys.filter((key) => !(key in en)),
      hanyaDiEn: enKeys.filter((key) => !(key in id)),
    }).toEqual({ hanyaDiId: [], hanyaDiEn: [] })
  })

  it('tidak ada teks kosong', () => {
    const empty = [...Object.entries(id), ...Object.entries(en)]
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key)
    expect(empty).toEqual([])
  })

  it('placeholder {{...}} sama di kedua locale', () => {
    const mismatched = Object.keys(id)
      .filter((key) => key in en)
      .filter((key) => placeholders(id[key] ?? '').join() !== placeholders(en[key] ?? '').join())
    expect(mismatched).toEqual([])
  })
})

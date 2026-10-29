import { describe, expect, it } from 'vitest'
import { texts } from './texts'

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

describe('CS texts', () => {
  const id = flatten(texts['id-ID'])
  const en = flatten(texts['en-US'])

  it('id-ID and en-US have exactly the same keys', () => {
    expect({
      onlyInId: Object.keys(id).filter((key) => !(key in en)),
      onlyInEn: Object.keys(en).filter((key) => !(key in id)),
    }).toEqual({ onlyInId: [], onlyInEn: [] })
  })

  it('has no empty text', () => {
    const empty = [...Object.entries(id), ...Object.entries(en)]
      .filter(([, text]) => text.trim() === '')
      .map(([key]) => key)
    expect(empty).toEqual([])
  })

  it('uses the same {{placeholders}} in both locales', () => {
    const mismatched = Object.keys(id)
      .filter((key) => key in en)
      .filter((key) => placeholders(id[key] ?? '').join() !== placeholders(en[key] ?? '').join())
    expect(mismatched).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { packageStatus } from './report'
import type { VerifyReport } from './report'

function report(overrides: Partial<VerifyReport> = {}): VerifyReport {
  return {
    startedAt: '2026-11-12T07:40:00.000Z',
    durationMs: 1000,
    scope: { changed: ['@crm/ui'], affected: ['@crm/ui', '@crm/app-kit'] },
    steps: [],
    summary: { status: 'pass', passed: 1, failed: 0, skipped: 0 },
    ...overrides,
  }
}

describe('packageStatus', () => {
  it('unchecked tanpa laporan', () => {
    expect(packageStatus(null, { name: '@crm/ui', path: 'packages/ui' })).toBe('unchecked')
  })

  it('pass untuk paket di cakupan run yang hijau', () => {
    expect(packageStatus(report(), { name: '@crm/ui', path: 'packages/ui' })).toBe('pass')
  })

  it('unchecked untuk paket di luar cakupan', () => {
    expect(packageStatus(report(), { name: '@crm/i18n', path: 'packages/i18n' })).toBe('unchecked')
  })

  it('fail bila ada failure di bawah path paket', () => {
    const failed = report({
      steps: [
        {
          id: 'lint',
          status: 'fail',
          durationMs: 10,
          failures: [
            {
              file: 'packages/ui/src/button.tsx',
              line: 2,
              ruleId: 'x',
              message: 'bad',
            },
          ],
        },
      ],
      summary: { status: 'fail', passed: 0, failed: 1, skipped: 0 },
    })
    expect(packageStatus(failed, { name: '@crm/ui', path: 'packages/ui' })).toBe('fail')
  })
})

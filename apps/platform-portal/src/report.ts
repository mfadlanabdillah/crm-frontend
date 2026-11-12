export interface VerifyFailure {
  file: string | null
  line: number | null
  ruleId: string | null
  message: string
}

export interface VerifyStep {
  id: string
  status: 'pass' | 'fail' | 'skip'
  durationMs: number
  failures: VerifyFailure[]
}

export interface VerifyReport {
  startedAt: string
  durationMs: number
  scope: { changed: string[]; affected: string[] }
  steps: VerifyStep[]
  summary: { status: 'pass' | 'fail'; passed: number; failed: number; skipped: number }
}

/**
 * `pnpm verify --json` menulis `verify-report.json` di root repo; berkas itu tidak di-commit.
 * Tanpa laporan, portal tetap jalan dan menampilkan status "unchecked".
 */
const reports = import.meta.glob<VerifyReport>('../../../verify-report.json', {
  eager: true,
  import: 'default',
})

export const verifyReport: VerifyReport | null = Object.values(reports)[0] ?? null

export type PackageStatus = 'pass' | 'fail' | 'unchecked'

/** Status satu paket: gagal bila ada failure di bawah path-nya, lulus bila masuk cakupan dan run hijau. */
export function packageStatus(
  report: VerifyReport | null,
  pkg: { name: string; path: string },
): PackageStatus {
  if (!report) return 'unchecked'
  const failed = report.steps.some(
    (step) =>
      step.status === 'fail' &&
      step.failures.some((failure) => failure.file?.startsWith(`${pkg.path}/`)),
  )
  if (failed) return 'fail'
  const inScope = [...report.scope.changed, ...report.scope.affected].includes(pkg.name)
  return inScope && report.summary.status === 'pass' ? 'pass' : 'unchecked'
}

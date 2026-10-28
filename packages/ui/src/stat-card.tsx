import type { ReactNode } from 'react'
import { Card } from './card'

/** One figure with its name (queue load, a count). Put a link in `value` to make it a drill-down. */
export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="flex flex-1 flex-col gap-1">
      <span className="text-sm text-ink-muted">{label}</span>
      <strong className="text-2xl font-semibold text-ink">{value}</strong>
    </Card>
  )
}

import { FlexRender, createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import type { Row } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Link } from '@tanstack/react-router'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Case } from '@crm/api-client'
import { maskPhone } from '@crm/auth'
import type { Role } from '@crm/auth'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/format'
import { CasePriorityBadge, CaseStatusBadge } from './CaseBadges'

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, Case>()
const EMPTY_ROWS: Case[] = []

const GRID = 'grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_110px_100px_130px] items-center gap-3'

/**
 * Tinggi baris tetap (Tailwind `h-16`). Dengan tinggi tetap, virtualizer tidak perlu mengukur
 * elemen dan tidak menghitung ulang posisi 10.000 item setiap kali baris baru muncul.
 */
const ROW_HEIGHT = 64

/**
 * Isi baris di-memo: saat scroll yang berubah hanya posisi (transform) di pembungkus, bukan sel.
 * React Compiler melewati CaseTable karena API virtualizer, jadi memo ini ditulis manual.
 */
const CaseRowCells = memo(function CaseRowCells({ row }: { row: Row<typeof features, Case> }) {
  return row.getAllCells().map((cell) => (
    <div key={cell.id} role="cell" className="min-w-0">
      <FlexRender cell={cell} />
    </div>
  ))
})

export function CaseTable({
  cases,
  role,
  isFetching = false,
}: {
  cases: Case[]
  role: Role | null
  isFetching?: boolean
}) {
  const { t } = useTranslation()

  // Kolom stabil per role: masking PII ikut role, bukan state baris.
  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor('subject', {
          header: t('cases.subject'),
          cell: ({ row }) => (
            <div className="min-w-0">
              <Link
                to="/cases/$caseId"
                params={{ caseId: row.original.id }}
                className="block truncate text-sm font-medium text-ink hover:text-brand-strong hover:underline"
              >
                {row.original.subject}
              </Link>
              <span className="text-xs text-ink-muted">{row.original.code}</span>
            </div>
          ),
        }),
        helper.display({
          id: 'customer',
          header: t('cases.customer'),
          cell: ({ row }) => (
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{row.original.customer.name}</p>
              <p className="truncate text-xs text-ink-muted">
                {maskPhone(row.original.customer.phone, role)}
              </p>
            </div>
          ),
        }),
        helper.accessor('status', {
          header: t('cases.status'),
          cell: ({ getValue }) => <CaseStatusBadge status={getValue()} />,
        }),
        helper.accessor('priority', {
          header: t('cases.priority'),
          cell: ({ getValue }) => <CasePriorityBadge priority={getValue()} />,
        }),
        helper.accessor('updatedAt', {
          header: t('cases.updatedAt'),
          cell: ({ getValue }) => (
            <time dateTime={getValue()} className="text-xs text-ink-muted">
              {formatRelative(getValue())}
            </time>
          ),
        }),
      ]),
    [role, t],
  )

  const table = useTable({
    features,
    columns,
    data: cases.length > 0 ? cases : EMPTY_ROWS,
    getRowId: (row) => row.id,
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const rows = table.getRowModel().rows

  // Fungsi opsi harus stabil: identitas baru membuat virtualizer membuang cache ukurannya
  // dan menghitung ulang seluruh item di setiap render (terlihat di profil CPU saat scroll).
  const getScrollElement = useCallback(() => scrollRef.current, [])
  const estimateSize = useCallback(() => ROW_HEIGHT, [])
  const getItemKey = useCallback((index: number) => rows[index]?.id ?? index, [rows])

  // useVirtualizer mengembalikan fungsi yang tidak aman di-memoize, jadi React Compiler
  // melewati komponen ini.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement,
    estimateSize,
    overscan: 8,
    getItemKey,
  })

  return (
    <div className="h-full min-h-0 overflow-x-auto">
      <div
        role="table"
        aria-label={t('cases.title')}
        aria-busy={isFetching}
        className={cn(
          'flex h-full min-h-0 min-w-[780px] flex-col',
          isFetching && 'opacity-70 transition-opacity',
        )}
      >
        <div role="rowgroup" className="bg-surface-muted/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} role="row" className={cn(GRID, 'px-6 py-2')}>
              {headerGroup.headers.map((header) => (
                <div
                  key={header.id}
                  role="columnheader"
                  className="text-xs font-semibold tracking-wide text-ink-muted uppercase"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div ref={scrollRef} role="rowgroup" className="min-h-0 flex-1 overflow-y-auto">
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              if (!row) return null
              return (
                <div
                  key={row.id}
                  role="row"
                  data-index={virtualRow.index}
                  className={cn(
                    GRID,
                    'absolute inset-x-0 top-0 h-16 overflow-hidden border-b border-border-subtle bg-surface px-6 hover:bg-surface-muted/60',
                  )}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <CaseRowCells row={row} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

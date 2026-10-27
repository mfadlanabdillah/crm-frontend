/**
 * Harness pengukuran performa. Merender `CaseTable` yang sama dengan aplikasi,
 * tetapi dengan 10.000 baris sekaligus, dan menerapkan event SSE lewat `applyCaseEvent`.
 * Dibangun terpisah (perf/vite.config.ts) sehingga tidak ikut bundle produksi.
 */
import './perf.css'
import { createI18n } from '@crm/i18n'
import type { CaseListResponse, Role } from '@crm/api-client'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CaseTable } from '@/modules/case/components/CaseTable'
import { applyCaseEvent, parseCaseEvent } from '@/modules/case/queries/useCaseStream'
import { caseKeys } from '@/lib/query-keys'
import { createEventStream } from '@/lib/sse'
import type { StreamStatus } from '@/lib/sse'
import { db } from '@/mocks/db'

declare global {
  interface Window {
    __perf: { rows: number; queryFnCalls: number; eventsApplied: number; stream: StreamStatus }
  }
}

const PERF_ROLE: Role = 'supervisor'
const ROW_COUNT = 10_000
const PAGE_SIZE = 100
const listKey = caseKeys.list({ perf: true })

function buildList(): CaseListResponse {
  const items = Array.from(
    { length: ROW_COUNT / PAGE_SIZE },
    (_, index) =>
      db.listCases({ view: 'all', sort: '-updated_at', page: index + 1, page_size: PAGE_SIZE })
        .items,
  ).flat()
  return { items, meta: { page: 1, pageSize: items.length, total: items.length, totalPages: 1 } }
}

const initialList = buildList()
window.__perf = {
  rows: initialList.items.length,
  queryFnCalls: 0,
  eventsApplied: 0,
  stream: 'closed',
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: false } },
})

function Harness() {
  const [status, setStatus] = useState<StreamStatus>('closed')
  const { data } = useQuery({
    queryKey: listKey,
    queryFn: () => {
      // Harus tetap 0 selama pengukuran: event menambal cache, bukan refetch.
      window.__perf.queryFnCalls += 1
      return initialList
    },
    initialData: initialList,
  })

  useEffect(() => {
    const sseUrl = new URLSearchParams(window.location.search).get('sse')
    if (!sseUrl) return

    const stream = createEventStream({
      url: sseUrl,
      eventName: 'case',
      parse: parseCaseEvent,
      onEvent: (event) => {
        applyCaseEvent(queryClient, event)
        window.__perf.eventsApplied += 1
      },
      onStatus: (next) => {
        window.__perf.stream = next
        setStatus(next)
      },
    })
    return () => stream.close()
  }, [])

  return (
    <div className="flex h-full flex-col">
      <p className="shrink-0 px-6 py-2 text-xs text-ink-muted" data-testid="perf-status">
        {data.items.length} baris · stream {status}
      </p>
      <div className="min-h-0 flex-1">
        <CaseTable cases={data.items} role={PERF_ROLE} />
      </div>
    </div>
  )
}

const rootRoute = createRootRoute({ component: Harness })
const caseRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cases/$caseId' })
const router = createRouter({
  routeTree: rootRoute.addChildren([caseRoute]),
  history: createMemoryHistory({ initialEntries: ['/'] }),
})

async function bootstrap() {
  await createI18n()
  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Elemen #root tidak ditemukan')

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

void bootstrap()

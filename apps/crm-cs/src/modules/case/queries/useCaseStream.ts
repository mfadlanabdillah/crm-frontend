import { env, createEventStream } from '@crm/app-kit'
import type { StreamStatus } from '@crm/app-kit'
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import type { Case, CaseListResponse } from '@crm/api-client'
import { caseKeys } from './keys'
import { caseEventSchema, toCasePatch } from '../schemas/event'
import type { CaseEventPayload } from '../schemas/event'

const MOCK_EVENT_INTERVAL_MS = 20_000

function streamUrl(): string {
  return `${env.apiBaseUrl.replace(/\/$/, '')}/v1/events/stream`
}

export function parseCaseEvent(raw: string): CaseEventPayload {
  return caseEventSchema.parse(JSON.parse(raw))
}

/** Tambal cache list dan detail di tempat; tidak memicu refetch kecuali case baru/eskalasi. */
export function applyCaseEvent(queryClient: QueryClient, event: CaseEventPayload): void {
  const patch = toCasePatch(event)
  if (Object.keys(patch).length > 0) {
    queryClient.setQueryData<Case>(caseKeys.detail(event.caseId), (current) =>
      current ? { ...current, ...patch } : current,
    )
    queryClient.setQueriesData<CaseListResponse>({ queryKey: caseKeys.lists() }, (current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === event.caseId ? { ...item, ...patch } : item,
            ),
          }
        : current,
    )
  }

  if (event.type === 'case.created' || event.type === 'case.escalated') {
    void queryClient.invalidateQueries({ queryKey: caseKeys.summary() })
    void queryClient.invalidateQueries({ queryKey: caseKeys.lists(), refetchType: 'none' })
  }
}

/**
 * Satu koneksi per sesi. Event hanya menambal cache yang sudah ada; kalau case
 * belum pernah dibuka, tidak ada refetch paksa — data diambil saat dibutuhkan.
 */
export function useCaseStream(): StreamStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<StreamStatus>(env.mocksEnabled ? 'live' : 'connecting')

  useEffect(() => {
    if (env.mocksEnabled) {
      if (!env.mockEvents) return () => {}

      // Simulasi event untuk menguji alur cache tanpa backend SSE.
      const timer = setInterval(() => {
        void queryClient.invalidateQueries({ queryKey: caseKeys.lists() })
        void queryClient.invalidateQueries({ queryKey: caseKeys.summary() })
      }, MOCK_EVENT_INTERVAL_MS)

      return () => clearInterval(timer)
    }

    const stream = createEventStream({
      url: streamUrl(),
      eventName: 'case',
      parse: parseCaseEvent,
      onEvent: (event) => applyCaseEvent(queryClient, event),
      onStatus: setStatus,
      onError: (error) => {
        if (import.meta.env.DEV) console.warn('[sse] event diabaikan', error)
      },
    })

    return () => stream.close()
  }, [queryClient])

  return status
}

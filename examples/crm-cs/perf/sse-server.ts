import { createServer } from 'node:http'
import type { Server, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface CaseEventInput {
  caseId: string
  status?: 'open' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

/**
 * Server SSE minimal untuk pengukuran. Setiap event membawa `occurredAt` (epoch ms) supaya
 * latensi end-to-end bisa dihitung di proses yang sama (satu mesin, satu jam sistem).
 */
export async function startSseServer(allowOrigin: string) {
  const clients = new Set<ServerResponse>()
  let sequence = 0

  const server: Server = createServer((request, response) => {
    if (request.url !== '/stream') {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'access-control-allow-origin': allowOrigin,
      'access-control-allow-credentials': 'true',
    })
    response.write(': connected\n\n')
    clients.add(response)
    request.on('close', () => clients.delete(response))
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}/stream`,
    clientCount: () => clients.size,
    /** Kirim event dan kembalikan `occurredAt` yang dipakai sebagai titik nol latensi. */
    emit(input: CaseEventInput): number {
      sequence += 1
      const occurredAt = Date.now()
      const payload = {
        id: `perf-${sequence}`,
        type: 'case.updated',
        caseId: input.caseId,
        occurredAt: new Date(occurredAt).toISOString(),
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
      }
      const frame = `event: case\ndata: ${JSON.stringify(payload)}\n\n`
      for (const client of clients) client.write(frame)
      return occurredAt
    },
    close: () =>
      new Promise<void>((resolve) => {
        for (const client of clients) client.end()
        server.close(() => resolve())
      }),
  }
}

import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { CDPSession, Page } from '@playwright/test'
import { startSseServer } from './sse-server'

const ORIGIN = 'http://localhost:4174'
const STATUS_LABEL = {
  open: 'Baru',
  pending: 'Menunggu',
  resolved: 'Selesai',
  closed: 'Ditutup',
} as const
type Status = keyof typeof STATUS_LABEL

const resultsDir = new URL('./results/', import.meta.url)

async function saveResult(name: string, data: unknown) {
  await mkdir(resultsDir, { recursive: true })
  await writeFile(new URL(`${name}.json`, resultsDir), JSON.stringify(data, null, 2))
  console.log(`\n[${name}]`, JSON.stringify(data, null, 2))
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return Number((sorted[Math.max(0, index)] ?? 0).toFixed(1))
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits))
}

async function openHarness(page: Page, sseUrl?: string) {
  await page.goto(sseUrl ? `/?sse=${encodeURIComponent(sseUrl)}` : '/')
  await expect(page.getByTestId('perf-status')).toContainText('10000 baris')
}

async function setCpuThrottle(cdp: CDPSession, rate: number) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate })
}

/** Scroll kontainer tabel setiap frame dan catat durasi antar-frame (rAF). */
async function measureScroll(page: Page, pxPerFrame: number, maxFrames: number) {
  return page.evaluate(
    ({ pxPerFrame, maxFrames }) =>
      new Promise<{
        frames: number[]
        longTasks: number
        scrollHeight: number
        reachedEnd: boolean
        maxDomRows: number
      }>((resolve) => {
        const container = document.querySelectorAll<HTMLElement>('[role="rowgroup"]')[1]
        if (!container) throw new Error('Kontainer scroll tabel tidak ditemukan')
        container.scrollTop = 0

        let longTasks = 0
        const observer = new PerformanceObserver((list) => {
          longTasks += list.getEntries().length
        })
        observer.observe({ type: 'longtask' })

        const frames: number[] = []
        let maxDomRows = 0
        let last = performance.now()
        const step = (now: number) => {
          frames.push(now - last)
          last = now
          maxDomRows = Math.max(maxDomRows, container.querySelectorAll('[role="row"]').length)
          container.scrollTop += pxPerFrame
          const reachedEnd =
            container.scrollTop + container.clientHeight >= container.scrollHeight - 1
          if (reachedEnd || frames.length >= maxFrames) {
            observer.disconnect()
            resolve({
              frames: frames.slice(1),
              longTasks,
              scrollHeight: container.scrollHeight,
              reachedEnd,
              maxDomRows,
            })
            return
          }
          requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }),
    { pxPerFrame, maxFrames },
  )
}

function summarizeFrames(frames: number[]) {
  const mean = frames.reduce((sum, value) => sum + value, 0) / frames.length
  return {
    frames: frames.length,
    avgFps: round(1000 / mean),
    p50FrameMs: percentile(frames, 50),
    p95FrameMs: percentile(frames, 95),
    p99FrameMs: percentile(frames, 99),
    maxFrameMs: round(Math.max(...frames)),
    jankyFramesPct: round((frames.filter((value) => value > 20).length / frames.length) * 100),
  }
}

/**
 * Waktu CPU main thread per frame (script, layout, style) dari metrik Chrome. Lebih stabil
 * daripada FPS saat mesin dipakai proses lain, jadi dipakai untuk membandingkan perubahan kode.
 */
async function withCpuMetrics<T extends { frames: number[] }>(
  cdp: CDPSession,
  run: () => Promise<T>,
) {
  const read = async () => {
    const { metrics } = await cdp.send('Performance.getMetrics')
    const value = (name: string) => metrics.find((item) => item.name === name)?.value ?? 0
    return {
      script: value('ScriptDuration'),
      layout: value('LayoutDuration'),
      style: value('RecalcStyleDuration'),
      task: value('TaskDuration'),
    }
  }
  const before = await read()
  const result = await run()
  const after = await read()
  const perFrame = (key: keyof typeof before) =>
    round(((after[key] - before[key]) * 1000) / result.frames.length, 2)
  return {
    result,
    cpuMsPerFrame: {
      script: perFrame('script'),
      layout: perFrame('layout'),
      style: perFrame('style'),
      totalTask: perFrame('task'),
    },
  }
}

test('scroll 10.000 baris', async ({ page }) => {
  await openHarness(page)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  const result: Record<string, unknown> = {}
  const cpuRates = (process.env.PERF_CPU ?? '1,4').split(',').map(Number)

  for (const cpu of cpuRates) {
    await setCpuThrottle(cdp, cpu)
    // Scroll cepat realistis (~9.000 px/detik) dan "flick" sampai baris terakhir.
    const { result: normal, cpuMsPerFrame: normalCpu } = await withCpuMetrics(cdp, () =>
      measureScroll(page, 150, 600),
    )
    const { result: toEnd, cpuMsPerFrame: toEndCpu } = await withCpuMetrics(cdp, () =>
      measureScroll(page, 1000, 2000),
    )
    result[`cpu${cpu}x`] = {
      normalScroll: {
        pxPerFrame: 150,
        ...summarizeFrames(normal.frames),
        longTasks: normal.longTasks,
        cpuMsPerFrame: normalCpu,
      },
      flickToEnd: {
        pxPerFrame: 1000,
        reachedEnd: toEnd.reachedEnd,
        ...summarizeFrames(toEnd.frames),
        longTasks: toEnd.longTasks,
        cpuMsPerFrame: toEndCpu,
      },
      scrollHeightPx: toEnd.scrollHeight,
      maxDomRows: Math.max(normal.maxDomRows, toEnd.maxDomRows),
    }
    expect(toEnd.reachedEnd).toBe(true)
  }
  await setCpuThrottle(cdp, 1)
  await saveResult('scroll', { rows: 10_000, viewport: '1366x768', ...result })
})

/** Ambil case yang terlihat beserta statusnya dari DOM tabel. */
async function visibleCases(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[role="rowgroup"] [role="row"]'))
      .map((row) => {
        const link = row.querySelector<HTMLAnchorElement>('a[href^="/cases/"]')
        const cells = row.querySelectorAll('[role="cell"]')
        return {
          caseId: link?.getAttribute('href')?.split('/').pop() ?? '',
          statusLabel: cells[2]?.textContent?.trim() ?? '',
          top: row.getBoundingClientRect().top,
        }
      })
      .filter((item) => item.caseId && item.top > 0 && item.top < window.innerHeight - 80),
  )
}

/** Pasang observer sebelum event dikirim; resolve dengan Date.now() saat label status berubah. */
async function armObserver(page: Page, caseId: string, expectedLabel: string) {
  await page.evaluate(
    ({ caseId, expectedLabel }) => {
      const container = document.querySelectorAll<HTMLElement>('[role="rowgroup"]')[1]!
      const read = () =>
        container
          .querySelector(`a[href="/cases/${caseId}"]`)
          ?.closest('[role="row"]')
          ?.querySelectorAll('[role="cell"]')[2]
          ?.textContent?.trim()
      ;(window as unknown as { __seen: Promise<number> }).__seen = new Promise<number>(
        (resolve) => {
          const observer = new MutationObserver(() => {
            if (read() === expectedLabel) {
              observer.disconnect()
              resolve(Date.now())
            }
          })
          observer.observe(container, { subtree: true, childList: true, characterData: true })
        },
      )
    },
    { caseId, expectedLabel },
  )
}

async function measureLatency(
  page: Page,
  sse: Awaited<ReturnType<typeof startSseServer>>,
  count: number,
) {
  const latencies: number[] = []
  const order: Status[] = ['pending', 'resolved', 'open']

  for (let index = 0; index < count; index += 1) {
    const candidates = await visibleCases(page)
    const target = candidates[index % candidates.length]
    if (!target) throw new Error('Tidak ada baris yang terlihat')
    const next = order.find((status) => STATUS_LABEL[status] !== target.statusLabel) ?? 'pending'

    await armObserver(page, target.caseId, STATUS_LABEL[next])
    const occurredAt = sse.emit({ caseId: target.caseId, status: next })
    const seenAt = await page.evaluate(
      () => (window as unknown as { __seen: Promise<number> }).__seen,
    )
    latencies.push(seenAt - occurredAt)
    await page.waitForTimeout(50)
  }
  return latencies
}

function summarizeLatency(latencies: number[]) {
  return {
    events: latencies.length,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    maxMs: round(Math.max(...latencies)),
    over1sCount: latencies.filter((value) => value >= 1000).length,
  }
}

test('latensi event real-time (SSE → cache → DOM)', async ({ page }) => {
  const sse = await startSseServer(ORIGIN)
  try {
    await openHarness(page, sse.url)
    await expect.poll(() => page.evaluate(() => window.__perf.stream)).toBe('live')
    const cdp = await page.context().newCDPSession(page)

    const cpu1 = await measureLatency(page, sse, 100)
    await setCpuThrottle(cdp, 4)
    const cpu4 = await measureLatency(page, sse, 50)
    await setCpuThrottle(cdp, 1)

    const queryFnCalls = await page.evaluate(() => window.__perf.queryFnCalls)
    await saveResult('realtime', {
      transport: 'EventSource ke server SSE lokal (127.0.0.1), tanpa latensi jaringan',
      rowsInCache: 10_000,
      cpu1x: summarizeLatency(cpu1),
      cpu4x: summarizeLatency(cpu4),
      refetchDuringTest: queryFnCalls,
    })
    expect(queryFnCalls).toBe(0)
  } finally {
    await sse.close()
  }
})

test('heap sesi panjang dengan event berkala', async ({ page }) => {
  const minutes = Number(process.env.PERF_HEAP_MINUTES ?? 30)
  test.skip(!process.env.PERF_HEAP, 'Set PERF_HEAP=1 untuk menjalankan sesi panjang')
  test.setTimeout((minutes + 10) * 60_000)

  const sse = await startSseServer(ORIGIN)
  const statuses: Status[] = ['open', 'pending', 'resolved', 'closed']
  try {
    await openHarness(page, sse.url)
    await expect.poll(() => page.evaluate(() => window.__perf.stream)).toBe('live')
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Performance.enable')

    const sample = async (minute: number) => {
      await cdp.send('HeapProfiler.collectGarbage')
      const { usedSize } = await cdp.send('Runtime.getHeapUsage')
      const { metrics } = await cdp.send('Performance.getMetrics')
      const metric = (name: string) => metrics.find((item) => item.name === name)?.value ?? 0
      return {
        minute,
        heapMb: round(usedSize / 1024 / 1024, 2),
        domNodes: metric('Nodes'),
        listeners: metric('JSEventListeners'),
      }
    }

    // Event tiap 500 ms ke case acak di seluruh 10.000 baris (terlihat maupun tidak).
    let emitted = 0
    const emitter = setInterval(() => {
      const index = 1 + Math.floor(Math.random() * 10_000)
      sse.emit({
        caseId: `case-${String(index).padStart(5, '0')}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      })
      emitted += 1
    }, 500)

    const samples = [await sample(0)]
    for (let minute = 1; minute <= minutes; minute += 1) {
      // Agen menggulir daftar beberapa kali per menit.
      for (let scroll = 0; scroll < 4; scroll += 1) {
        await page.evaluate(() => {
          const container = document.querySelectorAll<HTMLElement>('[role="rowgroup"]')[1]!
          container.scrollTop = Math.random() * container.scrollHeight
        })
        await page.waitForTimeout(15_000)
      }
      samples.push(await sample(minute))
    }
    clearInterval(emitter)

    // Regresi linear setelah menit ke-1 (warm-up) untuk melihat tren pertumbuhan.
    const steady = samples.filter((item) => item.minute >= 1)
    const n = steady.length
    const meanX = steady.reduce((sum, item) => sum + item.minute, 0) / n
    const meanY = steady.reduce((sum, item) => sum + item.heapMb, 0) / n
    const slope =
      steady.reduce((sum, item) => sum + (item.minute - meanX) * (item.heapMb - meanY), 0) /
      steady.reduce((sum, item) => sum + (item.minute - meanX) ** 2, 0)

    const eventsApplied = await page.evaluate(() => window.__perf.eventsApplied)
    await saveResult('heap', {
      minutes,
      eventsEmitted: emitted,
      eventsApplied,
      heapStartMb: samples[1]?.heapMb,
      heapEndMb: samples[samples.length - 1]?.heapMb,
      heapMaxMb: Math.max(...samples.map((item) => item.heapMb)),
      slopeKbPerMinute: round(slope * 1024, 1),
      samples,
    })
  } finally {
    await sse.close()
  }
})

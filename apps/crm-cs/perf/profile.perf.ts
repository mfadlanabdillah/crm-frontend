import { writeFile, mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

/**
 * Profil CPU saat scroll pada CPU 4× lebih lambat. Bukan pengukuran baseline; dipakai untuk
 * mencari fungsi termahal. Jalankan: `pnpm --filter @crm/crm-cs perf --grep profil`.
 */
test('profil scroll CPU 4×', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('perf-status')).toContainText('10000 baris')
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
  await cdp.send('Profiler.start')

  const pxPerFrame = Number(process.env.PERF_PX ?? 150)
  await page.evaluate(
    (pxPerFrame) =>
      new Promise<void>((resolve) => {
        const container = document.querySelectorAll<HTMLElement>('[role="rowgroup"]')[1]!
        let frames = 0
        const step = () => {
          container.scrollTop += pxPerFrame
          frames += 1
          if (frames < 300) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      }),
    pxPerFrame,
  )

  const { profile } = await cdp.send('Profiler.stop')
  const intervals = profile.timeDeltas ?? []
  const selfTime = new Map<number, number>()
  profile.samples?.forEach((nodeId, index) => {
    selfTime.set(nodeId, (selfTime.get(nodeId) ?? 0) + (intervals[index] ?? 0))
  })

  const byFunction = new Map<string, number>()
  for (const node of profile.nodes) {
    const { functionName, url, lineNumber } = node.callFrame
    const file = url.split('/').pop() || '(native)'
    const key = `${functionName || '(anonymous)'} @ ${file}:${lineNumber + 1}`
    byFunction.set(key, (byFunction.get(key) ?? 0) + (selfTime.get(node.id) ?? 0))
  }
  const total = [...byFunction.values()].reduce((sum, value) => sum + value, 0)
  const top = [...byFunction.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([name, micros]) => `${((micros / total) * 100).toFixed(1).padStart(5)}%  ${name}`)

  await mkdir(new URL('./results/', import.meta.url), { recursive: true })
  await writeFile(new URL('./results/profile-top.txt', import.meta.url), top.join('\n'))
  console.log(top.join('\n'))
})

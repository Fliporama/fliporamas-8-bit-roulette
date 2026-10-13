// usage (from the project root): node scripts/perf/idle.mjs
// Set TITLE=1 to measure the title card instead of the table.
import { chromium } from 'playwright-core'

const title = process.env.TITLE === '1'
const browser = await chromium.launch({ channel: 'msedge' })
for (const [label, width, height, scene] of [
  ['desktop scene on ', 1440, 900, '1'],
  ['desktop scene off', 1440, 900, '0'],
  ['phone   scene on ', 390, 844, '1'],
  ['phone   scene off', 390, 844, '0'],
]) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript((value) => localStorage.setItem('fliporama-scene', value), scene)
  // A seen intro opens on the title with no boot.
  if (title) await context.addInitScript(() => localStorage.setItem('fliporama-intro', '1'))
  const page = await context.newPage()
  await page.goto((process.env.URL ?? 'http://localhost:5173/') + (title ? '' : '?play'))
  await page.waitForTimeout(2500)
  const devtools = await context.newCDPSession(page)
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.waitForTimeout(500)
  const result = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const gaps = []
        let last = performance.now()
        const began = last
        const tick = (now) => {
          gaps.push(now - last)
          last = now
          if (now - began < 6000) requestAnimationFrame(tick)
          else {
            gaps.shift()
            gaps.sort((a, b) => a - b)
            resolve({
              frames: gaps.length,
              average: gaps.reduce((t, g) => t + g, 0) / gaps.length,
              p95: gaps[Math.floor(gaps.length * 0.95)],
              worst: gaps.at(-1),
              over20: gaps.filter((g) => g > 20).length,
            })
          }
        }
        requestAnimationFrame(tick)
      }),
  )
  console.log(label, JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Math.round(v * 10) / 10]))))
  await context.close()
}
await browser.close()

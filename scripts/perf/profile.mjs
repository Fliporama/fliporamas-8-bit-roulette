// usage (from the project root): node scripts/perf/profile.mjs [width] [height]. SPIN=1 profiles a spin instead of the idle page.
import { chromium } from 'playwright-core'

const width = Number(process.argv[2] ?? 390)
const height = Number(process.argv[3] ?? 844)
const browser = await chromium.launch({ channel: 'msedge' })
const context = await browser.newContext({ viewport: { width, height } })
const page = await context.newPage()
await page.goto('http://localhost:5173/')
await page.waitForTimeout(2500)
const devtools = await context.newCDPSession(page)
await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 })
await devtools.send('Profiler.enable')
await devtools.send('Profiler.setSamplingInterval', { interval: 500 })
await devtools.send('Profiler.start')
if (process.env.SPIN) {
  await page.locator('[data-spot^="n17"]').first().click()
  await page.getByRole('button', { name: /spin the wheel/i }).click()
}
await page.waitForTimeout(8000)
const { profile } = await devtools.send('Profiler.stop')

const self = new Map()
const byId = new Map(profile.nodes.map((node) => [node.id, node]))
const total = profile.timeDeltas.reduce((sum, delta) => sum + delta, 0)
profile.samples.forEach((id, index) => {
  const node = byId.get(id)
  const frame = node.callFrame
  const name = `${frame.functionName || '(anonymous)'} ${frame.url.split('/').pop()?.split('?')[0] ?? ''}:${frame.lineNumber}`
  self.set(name, (self.get(name) ?? 0) + profile.timeDeltas[index])
})
const rows = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
console.log(`profile ${width}x${height}, ${(total / 1000).toFixed(0)} ms sampled`)
for (const [name, micros] of rows) console.log(`${(micros / 1000).toFixed(1).padStart(8)} ms  ${((micros / total) * 100).toFixed(1).padStart(5)}%  ${name}`)
await browser.close()

// usage (from the project root): node scripts/perf/idle.mjs
// Set TITLE=1 to measure the title card instead of the table.
import { chromium } from 'playwright-core'
import { recordFrames, slowDown } from './frames.mjs'

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
  await slowDown(context, page)
  await page.waitForTimeout(500)
  const frames = await recordFrames(page)
  await page.waitForTimeout(6000)
  console.log(label, JSON.stringify(await frames()))
  await context.close()
}
await browser.close()

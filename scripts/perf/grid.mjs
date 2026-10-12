// How far each centred piece of the scene sits off the art-pixel grid, at several page widths. All zeros is right.
// Columns: lamp, croupier, clock, gramophone; then the same with the snapping taken away, as a control.
// usage (from the project root): node scripts/perf/grid.mjs
import { chromium } from 'playwright-core'

const PIECES = ['.scene-lamp', '.scene-croupier', '.fixture-clock', '.fixture-gramophone']
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage()
let off = 0
for (const width of [1440, 1439, 1438, 1437, 1001, 1000, 999]) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(process.env.URL ?? 'http://localhost:5173/')
  await page.waitForSelector('.scene-stage')
  const measure = (unsnapped) =>
    page.evaluate(
      ([pieces, unsnapped]) => {
        const stage = document.querySelector('.scene-stage')
        // The control: what the pieces did before they were snapped.
        if (unsnapped) stage.style.setProperty('--middle', '50%')
        const px = parseFloat(getComputedStyle(stage).getPropertyValue('--px'))
        const from = stage.getBoundingClientRect().left
        return [
          stage.clientWidth,
          ...pieces.map((piece) => {
            const element = document.querySelector(piece)
            if (getComputedStyle(element).display === 'none') return 'hidden'
            const offGrid = (element.getBoundingClientRect().left - from) % px
            return Math.round(Math.min(Math.abs(offGrid), px - Math.abs(offGrid)) * 100) / 100
          }),
        ]
      },
      [PIECES, unsnapped],
    )
  const row = await measure(false)
  const control = await measure(true)
  off += row.slice(1).filter((value) => value !== 'hidden' && value !== 0).length
  console.log(`page ${width}, stage ${row[0]}: ${row.slice(1).join(' ')}   (unsnapped: ${control.slice(1).join(' ')})`)
}
await browser.close()
process.exit(off ? 1 : 0)

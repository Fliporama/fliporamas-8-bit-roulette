// Plays one round in a real browser and saves screenshots and a video to captures/.
// Usage: npm run capture [-- phone] [-- http://some-preview-url]
// Needs the dev server running (npm run dev) unless a URL is given. Uses the installed Edge
// (set CAPTURE_BROWSER=chrome to use Chrome), so there is no browser download.
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const phone = args.includes('phone')
const url = args.find((arg) => arg.startsWith('http')) ?? 'http://localhost:5173/'
const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }
const out = 'captures'
const name = phone ? 'phone' : 'desktop'

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? 'msedge' })
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: phone ? 3 : 1,
  hasTouch: phone,
  recordVideo: { dir: `${out}/video-tmp`, size: viewport },
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
page.on('pageerror', (error) => errors.push(error.message))

const shot = (step) => page.screenshot({ path: `${out}/${name}-${step}.png` })
const spot = (id) => page.locator(`[data-spot^="${id}"]`).first()

await page.goto(url)
await page.waitForTimeout(800)
await shot('1-idle')

// A straight bet stacked three high, a street, and two outside bets.
for (let toss = 0; toss < 3; toss++) {
  await spot('n17').click()
  await page.waitForTimeout(180)
}
await page.getByRole('button', { name: 'Street', exact: true }).click()
await spot('n8').click()
await spot('red').click()
await spot('odd').click()
await page.waitForTimeout(350)
await shot('2-mid-toss')
await page.waitForTimeout(900)
await shot('3-bets-placed')

await page.getByRole('button', { name: /spin the wheel/i }).click()
await page.waitForTimeout(2200)
await shot('4-spinning')
await page.waitForTimeout(3000)
await shot('5-landed')
await page.waitForTimeout(1500)
await shot('6-tally')
await page.waitForTimeout(4000)
await shot('7-settled')

await context.close()
await browser.close()

const [video] = await readdir(`${out}/video-tmp`)
await rename(`${out}/video-tmp/${video}`, `${out}/${name}-round.webm`)
await rm(`${out}/video-tmp`, { recursive: true })

console.log(`Saved ${name} screenshots and ${name}-round.webm to ${out}/`)
if (errors.length > 0) {
  console.error(`Console errors:\n${errors.join('\n')}`)
  process.exitCode = 1
}

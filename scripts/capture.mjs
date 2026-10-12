// Opens the app in a real browser and saves what it looks like to captures/.
//
//   npm run capture                      play one round: screenshots and a video
//   npm run capture -- styleguide        one full-page screenshot of /?styleguide
//
// Add `phone` for a 390 px wide phone, `reduced` to ask for reduced motion, or a URL to capture
// a deployed preview. Fails if the page logs an error or scrolls sideways.
// Needs the dev server running (npm run dev) unless a URL is given. Uses the installed Edge
// (set CAPTURE_BROWSER=chrome to use Chrome), so there is no browser download.
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const phone = args.includes('phone')
const styleguide = args.includes('styleguide')
const reduced = args.includes('reduced')
const url = args.find((arg) => arg.startsWith('http')) ?? 'http://localhost:5173/'
const viewport = phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }
const out = 'captures'
const name = reduced ? 'reduced' : phone ? 'phone' : 'desktop'

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: process.env.CAPTURE_BROWSER ?? 'msedge' })
const context = await browser.newContext({
  viewport,
  // A full-page phone shot at 3x is too large to be useful.
  deviceScaleFactor: phone ? (styleguide ? 2 : 3) : 1,
  hasTouch: phone,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
  ...(styleguide ? {} : { recordVideo: { dir: `${out}/video-tmp`, size: viewport } }),
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
page.on('pageerror', (error) => errors.push(error.message))

if (styleguide) await captureStyleguide()
else await captureRound()

if (errors.length > 0) {
  console.error(`Problems:\n${errors.join('\n')}`)
  process.exitCode = 1
}

async function checkOverflow() {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
  if (scrollWidth > innerWidth) errors.push(`Horizontal overflow: ${scrollWidth} > ${innerWidth}`)
}

async function captureStyleguide() {
  await page.goto(`${url}?styleguide`)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${name}-styleguide.png`, fullPage: true })
  await checkOverflow()
  await browser.close()
  console.log(`Saved ${out}/${name}-styleguide.png`)
}

async function captureRound() {
  const shot = (step) => page.screenshot({ path: `${out}/${name}-${step}.png` })
  const spot = (id) => page.locator(`[data-spot^="${id}"]`).first()

  await page.goto(url)
  await page.waitForTimeout(800)
  await shot('1-idle')
  await checkOverflow()

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

  // A live resize: the canvases must redraw at the new size, and nothing may overflow.
  // Desktop narrows to a tablet; a phone narrows to the smallest common phone.
  await page.setViewportSize(phone ? { width: 360, height: 780 } : { width: 700, height: 900 })
  await page.waitForTimeout(400)
  await shot('8-resized')
  await checkOverflow()

  await context.close()
  await browser.close()

  const [video] = await readdir(`${out}/video-tmp`)
  await rename(`${out}/video-tmp/${video}`, `${out}/${name}-round.webm`)
  await rm(`${out}/video-tmp`, { recursive: true })
  console.log(`Saved ${name} screenshots and ${name}-round.webm to ${out}/`)
}

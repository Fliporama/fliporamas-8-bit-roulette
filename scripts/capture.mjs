// Opens the app in a real browser and saves what it looks like to captures/.
//
//   npm run capture                      play one round: screenshots and a video
//   npm run capture -- styleguide        one full-page screenshot of /?styleguide
//   npm run capture -- idle              leave the page alone for 30 seconds: stills, a video and frame times
//   npm run capture -- intro             power-on to the first bet: boot, title, press start, the hand
//
// Add `phone` for a 390 px wide phone, `reduced` to ask for reduced motion, or a URL to capture
// a deployed preview. Fails if the page logs an error or scrolls sideways.
// Needs the dev server running (npm run dev) unless a URL is given. Uses the installed Edge
// (set CAPTURE_BROWSER=chrome to use Chrome), so there is no browser download.
import { mkdir, readFile, readdir, rename, rm } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const args = process.argv.slice(2)
const phone = args.includes('phone')
const styleguide = args.includes('styleguide')
const reduced = args.includes('reduced')
const idle = args.includes('idle')
const intro = args.includes('intro')
const url = args.find((arg) => arg.startsWith('http')) ?? 'http://localhost:5173/'
// Straight to the table, past the intro; a preview URL may already carry a query.
const playUrl = new URL(url)
playUrl.searchParams.set('play', '')
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
else if (idle) await captureIdle()
else if (intro) await captureIntro()
else await captureRound()

if (errors.length > 0) {
  console.error(`Problems:\n${errors.join('\n')}`)
  process.exitCode = 1
}

async function checkOverflow() {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
  if (scrollWidth > innerWidth) errors.push(`Horizontal overflow: ${scrollWidth} > ${innerWidth}`)
}

async function checkLight(expected, when) {
  const light = await page.evaluate(() => document.getElementById('game')?.dataset.light)
  if (light !== expected) errors.push(`Light ${when}: ${light}`)
}

async function captureStyleguide() {
  await page.goto(`${url}?styleguide`)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${out}/${name}-styleguide.png`, fullPage: true })
  await checkOverflow()
  await browser.close()
  console.log(`Saved ${out}/${name}-styleguide.png`)
}

async function saveVideo(file) {
  const [video] = await readdir(`${out}/video-tmp`)
  await rename(`${out}/video-tmp/${video}`, `${out}/${file}`)
  await rm(`${out}/video-tmp`, { recursive: true })
}

// The roadmap's test of a living scene: with no input at all, the page must keep moving.
async function captureIdle() {
  const prefix = phone ? 'phone-idle' : 'idle'
  const still = () => page.evaluate(() => document.querySelector('.scene')?.classList.contains('is-still'))
  await page.goto(playUrl.href)
  await page.waitForTimeout(800)

  const stills = []
  for (const seconds of [0, 10, 20, 30]) {
    if (seconds > 0) await page.waitForTimeout(10_000)
    const path = `${out}/${prefix}-${seconds}s.png`
    await page.screenshot({ path })
    stills.push(await readFile(path))
  }
  if (stills.every((image) => image.equals(stills[0]))) errors.push('The page did not move in 30 seconds')
  await checkOverflow()

  // Out of view, the scene must stop; back in view, it must start again.
  await page.setViewportSize({ width: viewport.width, height: 300 })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  if (!(await still())) errors.push('The scene kept animating out of view')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.setViewportSize(viewport)
  await page.waitForTimeout(500)
  if (await still()) errors.push('The scene did not resume')

  // Frame cost on a slower machine: the gaps between animation frames, with the CPU held to a quarter speed.
  const devtools = await context.newCDPSession(page)
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.waitForTimeout(1500) // let the redraw after the resize finish: this measures the room at rest
  const frames = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const gaps = []
        let last = performance.now()
        const began = last
        const tick = (now) => {
          gaps.push(now - last)
          last = now
          if (now - began < 5000) requestAnimationFrame(tick)
          else resolve({ average: gaps.reduce((total, gap) => total + gap, 0) / gaps.length, worst: Math.max(...gaps) })
        }
        requestAnimationFrame(tick)
      }),
  )
  console.log(`Frames at 4x slowdown: average ${frames.average.toFixed(1)} ms, worst ${frames.worst.toFixed(1)} ms`)

  await context.close()
  await browser.close()
  await saveVideo(`${prefix}.webm`)
  console.log(`Saved ${prefix} stills and ${prefix}.webm to ${out}/`)
}

// The first ten seconds: boot, title, press start, the tutorial hand and a first bet within 15 seconds.
async function captureIntro() {
  const prefix = name === 'desktop' ? 'intro' : `${name}-intro`
  const shot = (step) => page.screenshot({ path: `${out}/${prefix}-${step}.png` })
  const FIRST_BET_LIMIT = 15_000
  const TITLE_GUARD = 400 // the title ignores a press for its first 300 ms
  // The layer stays mounted while the hand is owed; the hand shows when its visibility is on.
  const handShown = () => page.evaluate(() => [...document.querySelectorAll('.ghost-hand')].some((hand) => getComputedStyle(hand).visibility === 'visible'))

  // 1. The fast path, with empty storage.
  // Under reduced motion the boot must never mount: watch for it from the first node on.
  if (reduced)
    await page.addInitScript(() => {
      const note = () => document.querySelector('.boot') && (window.__bootSeen = true)
      new MutationObserver(note).observe(document, { childList: true, subtree: true })
      note()
    })
  const started = Date.now()
  await page.goto(url)
  if (!reduced) {
    await page.waitForTimeout(Math.max(0, 400 - (Date.now() - started)))
    await shot('1-boot-line')
    await page.waitForTimeout(Math.max(0, 1500 - (Date.now() - started)))
    await shot('2-boot-check')
  }
  await page.locator('.title-start').waitFor()
  if (reduced && (await page.evaluate(() => window.__bootSeen))) errors.push('The boot showed with reduced motion')
  const shown = await page.evaluate(() => [window.scrollY, document.activeElement?.classList.contains('title-start')])
  if (shown[0] !== 0) errors.push(`The page was scrolled when the title appeared: ${shown[0]}`)
  if (!shown[1]) errors.push('The start button did not have focus when the title appeared')
  await page.waitForTimeout(TITLE_GUARD)
  await shot('3-title')
  // With reduced motion the room light is never driven (as in the round capture), so it stays normal.
  if (!reduced) await checkLight('dim', 'on the title')
  await page.locator('.title-start').click()
  await page.waitForTimeout(150)
  await shot('4-lift')
  await page.waitForTimeout(850)
  // Start hands the keyboard to the first chip, and must not scroll the page to do it.
  const begun = await page.evaluate(() => [window.scrollY, document.activeElement === document.querySelector('.chip-choice')])
  if (begun[0] !== 0) errors.push(`The page was scrolled 1 s after start: ${begun[0]}`)
  if (!begun[1]) errors.push('The first chip did not have focus 1 s after start')
  let handSeen = await handShown()
  await page.waitForTimeout(1500)
  await shot('5-hand')
  handSeen ||= await handShown()
  // On a phone the hand's targets may be off screen, so it is not checked there.
  if (!phone && !handSeen) errors.push('The tutorial hand did not show after start')
  await page.locator('[data-chip="25"]').click()
  if (!phone && (await handShown())) errors.push('The tutorial hand stayed after the first click')
  await page.locator('[data-spot="n17"]').click()
  const taken = Date.now() - started
  const bets = await page.locator('.bet-line').count()
  console.log(`First bet ${(taken / 1000).toFixed(1)} s after load, ${bets} bet line(s)`)
  if (taken > FIRST_BET_LIMIT) errors.push(`The first bet took ${taken} ms`)
  if (bets !== 1) errors.push(`Expected 1 bet line, found ${bets}`)
  await checkLight('normal', 'after the first bet')
  await page.waitForTimeout(400)
  await shot('6-first-bet')
  await checkOverflow()

  // 2. A press during the boot skips the boot only; the title's guard keeps it from starting the game.
  // Once by mouse and once by key: the mouse press lands on the boot, which may swallow the click whole.
  const skips = [
    ['press', () => page.mouse.click(viewport.width / 2, viewport.height / 2)],
    ['key', () => page.keyboard.press('Enter')],
  ]
  for (const [how, skip] of reduced ? [] : skips) {
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(500)
    await skip()
    await page.waitForTimeout(200)
    if ((await page.locator('.title-card').count()) === 0) errors.push(`No title after the skipping ${how}`)
    if ((await page.locator('.boot').count()) > 0) errors.push(`The boot survived the skipping ${how}`)
    await page.waitForTimeout(TITLE_GUARD)
    if ((await page.locator('.title-card').count()) === 0) errors.push(`The skipping ${how} started the game`)
  }

  // 3. Attract: left alone on the title, the hand shows the loop.
  await page.goto(url) // a fresh load starts at the top; a reload kept load 1's scroll position
  await page.locator('.title-start').waitFor()
  await page.waitForTimeout(10_000)
  await shot('7-attract')
  // On a phone the hand may have no visible target at this moment, so allow one more loop (about 5 s).
  let seen = await handShown()
  for (let waited = 0; !seen && waited < 5000; waited += 250) {
    await page.waitForTimeout(250)
    seen = await handShown()
  }
  if (!seen) errors.push('The ghost hand was not visible after 10 s on the title')

  await context.close()
  await browser.close()
  await saveVideo(`${prefix}.webm`)
  console.log(`Saved ${prefix} stills and ${prefix}.webm to ${out}/`)
}

async function captureRound() {
  const shot = (step) => page.screenshot({ path: `${out}/${name}-${step}.png` })
  const spot = (id) => page.locator(`[data-spot^="${id}"]`).first()

  await page.goto(playUrl.href)
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
  // The room dims for the spin and must come back: see the check after the round.
  if (!reduced) await checkLight('dim', 'while spinning')
  await page.waitForTimeout(3000)
  await shot('5-landed')
  await page.waitForTimeout(1500)
  await shot('6-tally')
  await page.waitForTimeout(4000)
  await shot('7-settled')
  await checkLight('normal', 'after the round')

  // A live resize: the canvases must redraw at the new size, and nothing may overflow.
  // Desktop narrows to a tablet; a phone narrows to the smallest common phone.
  await page.setViewportSize(phone ? { width: 360, height: 780 } : { width: 700, height: 900 })
  await page.waitForTimeout(400)
  await shot('8-resized')
  await checkOverflow()

  await context.close()
  await browser.close()

  await saveVideo(`${name}-round.webm`)
  console.log(`Saved ${name} screenshots and ${name}-round.webm to ${out}/`)
}

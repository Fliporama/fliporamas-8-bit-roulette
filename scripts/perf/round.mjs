// Frame gaps while a round is played at four-times CPU slowdown. usage (from the project root): node scripts/perf/round.mjs
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge' })
for (const [label, width, height] of [['desktop', 1440, 900], ['phone  ', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500 })
  if (process.env.SCENE) await context.addInitScript((value) => localStorage.setItem('fliporama-scene', value), process.env.SCENE)
  const page = await context.newPage()
  await page.goto((process.env.URL ?? 'http://localhost:5173/') + '?play')
  await page.waitForTimeout(2500)
  const devtools = await context.newCDPSession(page)
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    window.__gaps = []
    let last = performance.now()
    const tick = (now) => {
      window.__gaps.push(now - last)
      last = now
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const spot = (id) => page.locator(`[data-spot^="${id}"]`).first()
  for (const id of ['n17', 'n17', 'n8', 'red', 'odd', 'n32']) {
    await spot(id).click()
    await page.waitForTimeout(300)
  }
  await page.getByRole('button', { name: /spin the wheel/i }).click()
  await page.waitForTimeout(11000)
  const result = await page.evaluate(() => {
    const gaps = window.__gaps.slice(1).sort((a, b) => a - b)
    return {
      frames: gaps.length,
      average: gaps.reduce((t, g) => t + g, 0) / gaps.length,
      p95: gaps[Math.floor(gaps.length * 0.95)],
      worst: gaps.at(-1),
      over20: gaps.filter((g) => g > 20).length,
      over34: gaps.filter((g) => g > 34).length,
    }
  })
  console.log(label, JSON.stringify(Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Math.round(v * 10) / 10]))))
  await context.close()
}
await browser.close()

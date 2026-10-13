// Frame gaps while a round is played at four-times CPU slowdown. usage (from the project root): node scripts/perf/round.mjs
import { chromium } from 'playwright-core'
import { recordFrames, slowDown } from './frames.mjs'

const browser = await chromium.launch({ channel: 'msedge' })
for (const [label, width, height] of [['desktop', 1440, 900], ['phone  ', 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 500 })
  if (process.env.SCENE) await context.addInitScript((value) => localStorage.setItem('fliporama-scene', value), process.env.SCENE)
  const page = await context.newPage()
  await page.goto((process.env.URL ?? 'http://localhost:5173/') + '?play')
  await page.waitForTimeout(2500)
  await slowDown(context, page)
  await page.waitForTimeout(500)
  const frames = await recordFrames(page)
  const spot = (id) => page.locator(`[data-spot^="${id}"]`).first()
  for (const id of ['n17', 'n17', 'n8', 'red', 'odd', 'n32']) {
    await spot(id).click()
    await page.waitForTimeout(300)
  }
  await page.getByRole('button', { name: /spin the wheel/i }).click()
  await page.waitForTimeout(11000)
  console.log(label, JSON.stringify(await frames()))
  await context.close()
}
await browser.close()

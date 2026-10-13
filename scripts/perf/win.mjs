// Plays rounds until a big win, then saves stills of the celebration to captures/win-*.png, and one of the settings panel.
// Eighteen straight bets pay double the stake when one comes in, which is a "big" win; about every other round.
// usage (from the project root): node scripts/perf/win.mjs [phone]
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const phone = process.argv.includes('phone')
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: phone })
const errors = []
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
page.on('pageerror', (error) => errors.push(error.message))
await mkdir('captures', { recursive: true })
await page.goto((process.env.URL ?? 'http://localhost:5173/') + '?play')
await page.waitForTimeout(800)

await page.getByRole('button', { name: 'Settings' }).click()
await page.waitForTimeout(200)
await page.screenshot({ path: 'captures/win-0-settings.png' })
await page.keyboard.press('Escape')

let won = false
for (let round = 0; round < 12 && !won; round++) {
  for (let number = 1; number <= 18; number++) await page.locator(`[data-spot="n${number}"]`).click()
  await page.getByRole('button', { name: /spin the wheel/i }).click()
  await page.locator('.tally-banner, .table-note:has-text("NO WIN")').first().waitFor({ timeout: 15_000 }).catch(() => {})
  if ((await page.locator('.tally-banner').count()) === 0) {
    await page.waitForTimeout(1500)
    continue
  }
  won = true
  // The burst goes off when the count-up ends: wait for the shake, then take a still every 150 ms.
  await page.locator('#game.shake-big, #game.shake-huge').waitFor({ timeout: 10_000 })
  console.log('Filter on the game as the shake starts:', await page.evaluate(() => {
    const game = document.getElementById('game')
    return `${getComputedStyle(game).filter} (effects: ${game.closest('[data-effects]')?.dataset.effects}; animations: ${game.getAnimations().map((animation) => animation.animationName).join(', ')})`
  }))
  for (let still = 1; still <= 5; still++) {
    await page.screenshot({ path: `captures/win-${still}.png` })
    await page.waitForTimeout(150)
  }
}
await browser.close()
if (!won) errors.push('No big win in twelve rounds: run it again')
if (errors.length > 0) {
  console.error(`Problems:\n${errors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log('Saved captures/win-0-settings.png and win-1 to win-5.png')
}

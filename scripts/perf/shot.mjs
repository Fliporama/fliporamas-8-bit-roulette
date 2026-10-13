// usage (from the project root): node scripts/perf/shot.mjs <query> <selector> <out.png> [width] [scale]
import { chromium } from 'playwright-core'
const [query, selector, out, width = '1440', scale = '1'] = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'msedge' })
const page = await (await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: Number(scale) })).newPage()
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()))
page.on('pageerror', (e) => console.error('pageerror:', e.message))
await page.goto('http://localhost:5173/' + query)
await page.waitForTimeout(900)
await page.locator(selector).first().screenshot({ path: out })
await browser.close()
console.log('saved', out)

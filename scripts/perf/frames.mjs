// Measuring frame cost, shared by the capture and perf scripts.

/** Holds the page's CPU to a quarter speed, to stand in for a slower machine. */
export async function slowDown(context, page) {
  const devtools = await context.newCDPSession(page)
  await devtools.send('Emulation.setCPUThrottlingRate', { rate: 4 })
}

/** Starts recording the gaps between animation frames. Returns a function that summarises them so far, in milliseconds. */
export async function recordFrames(page) {
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
  return () =>
    page.evaluate(() => {
      const gaps = window.__gaps.slice(1).sort((a, b) => a - b)
      const summary = {
        frames: gaps.length,
        average: gaps.reduce((total, gap) => total + gap, 0) / gaps.length,
        p95: gaps[Math.floor(gaps.length * 0.95)],
        worst: gaps.at(-1),
        over20: gaps.filter((gap) => gap > 20).length,
        over34: gaps.filter((gap) => gap > 34).length,
      }
      return Object.fromEntries(Object.entries(summary).map(([name, value]) => [name, Math.round(value * 10) / 10]))
    })
}

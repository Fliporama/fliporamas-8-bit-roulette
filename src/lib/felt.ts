import { dither, hash } from './palette'

type FeltStep = 0 | 1 | 2 | 3

const POOL = { x: 0.5, y: 0.2, reachX: 0.66, reachY: 1.05 } // the lamp's centre and reach, as fractions of the felt
const BAND = 0.3 // share of each light step given to the dithered band at its bright edge
const WEAR = 5 // art pixels from the rail over which the felt is worn darker
const FLECK_ONE_IN = 61 // how sparse the single-pixel flecks of texture are

/**
 * The step of the felt ramp at one art pixel of a `cols` × `rows` felt lit from top centre.
 * Light falls off in flat steps with a dithered band where two meet; never a smooth gradient.
 * `shift` moves the lamp's pool by that many light steps: the room dimmed or flared.
 */
export function feltStep(x: number, y: number, cols: number, rows: number, shift = 0): FeltStep {
  if (cols <= 0 || rows <= 0) return 0
  const distance = Math.hypot(((x + 0.5) / cols - POOL.x) / POOL.reachX, ((y + 0.5) / rows - POOL.y) / POOL.reachY)
  const light = Math.max(0, Math.min(3.999, (1 - distance) * 4 + shift))
  let step = Math.floor(light)
  // 0 across the flat part of a step, rising to 1 through the band at its bright edge.
  const blend = Math.max(0, (light - step - (1 - BAND)) / BAND)
  if (blend > dither(x, y)) step += 1

  const edge = Math.min(x, y, cols - 1 - x, rows - 1 - y)
  if (edge < WEAR && dither(x, y) < 1 - edge / WEAR) step -= 1

  const fleck = hash(x, y)
  if (fleck % FLECK_ONE_IN === 0) step += fleck & 64 ? 1 : -1

  return Math.max(0, Math.min(3, step)) as FeltStep
}

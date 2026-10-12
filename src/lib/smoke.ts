import { dither, hash } from './palette'

export type SmokeToken = 'smoke-0' | 'smoke-1'

const CELL = { x: 7, y: 16 } // art pixels across and up one wisp: taller than wide, so smoke reads as rising
const RISE = 5 // art pixels a second, upward
const DRIFT = 2 // art pixels a second, sideways
const THIN = 0.66 // density at which a pixel shows as smoke at all...
const THICK = 0.84 // ...and at which it shows as the lighter, denser smoke
const SOFT = 0.12 // width of the dither at each of those edges
const FADE = { side: 0.25, floor: 0.35, ceiling: 0.25 } // share of the band over which smoke thins to nothing at each edge

/** A fixed value between 0 and 1 for each point of a grid. */
function lattice(x: number, y: number): number {
  return (hash(x, y) % 1024) / 1023
}

/** Smooth noise: lattice values blended between grid points. */
function noise(x: number, y: number): number {
  const left = Math.floor(x)
  const top = Math.floor(y)
  const across = (x - left) ** 2 * (3 - 2 * (x - left))
  const down = (y - top) ** 2 * (3 - 2 * (y - top))
  const upper = lattice(left, top) + (lattice(left + 1, top) - lattice(left, top)) * across
  const lower = lattice(left, top + 1) + (lattice(left + 1, top + 1) - lattice(left, top + 1)) * across
  return upper + (lower - upper) * down
}

/**
 * The smoke at one art pixel of a `cols` × `rows` band at `seconds`, or undefined for clear air.
 * Wisps rise and drift; they thin to nothing at every edge of the band.
 */
export function smokeToken(x: number, y: number, seconds: number, cols: number, rows: number): SmokeToken | undefined {
  if (cols <= 0 || rows <= 0) return undefined
  const fromSide = Math.min(x, cols - 1 - x) / (cols * FADE.side)
  const fromFloor = (rows - 1 - y) / (rows * FADE.floor)
  const fromCeiling = y / (rows * FADE.ceiling)
  const room = Math.min(1, fromSide, fromFloor, fromCeiling)
  if (room <= 0) return undefined

  // The field itself stays put; the point sampled moves against the drift, so the smoke appears to travel.
  const u = (x - seconds * DRIFT) / CELL.x
  const v = (y + seconds * RISE) / CELL.y
  const density = (noise(u, v) * 0.65 + noise(u * 2 + 17, v * 2 + 31) * 0.35) * room + (dither(x, y) - 0.5) * SOFT
  if (density > THICK) return 'smoke-1'
  return density > THIN ? 'smoke-0' : undefined
}

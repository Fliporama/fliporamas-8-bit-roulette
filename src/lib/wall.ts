import { dither, hash } from './palette'

export interface WallView {
  cols: number
  rows: number
  /** The lamp's bulb, in art pixels. Absent: an unlit wall. */
  lamp?: { x: number; y: number }
  /** Light steps added to the lamp's pool. */
  shift: number
  /** The row where wood panelling begins. Absent: wallpaper all the way down. */
  skirt?: number
}

export const WALL_TOKENS: readonly string[] = ['ink-0', 'ink-1', 'ink-2', 'wood-0', 'wood-1', 'wood-2']

/** Art pixels after which the wallpaper repeats. */
export const WALL_REPEAT = 16

const MOTIF = { every: WALL_REPEAT, size: 5 } // the wallpaper's diamond: art pixels between repeats, and its half-width
const BOARD = 12 // art pixels from one panelling groove to the next
const CAP = 2 // the rail along the top of the panelling
const GRAIN_ONE_IN = 23
const REACH = { x: 0.45, y: 0.9 } // how far the lamp's light carries, as fractions of the wall
const LIT = 1 // light above this lifts a surface one step up its ramp...
const SHADE = 0.3 // ...and below this drops it one step
const SOFT = 0.3 // width of the dither where the light changes step

// One step up or down a token's own ramp, stopping at its ends.
const LIGHTER: Record<string, string> = {}
const DARKER: Record<string, string> = {}
for (const ramp of ['ink', 'wood']) {
  for (let step = 0; step < 3; step++) {
    LIGHTER[`${ramp}-${step}`] = `${ramp}-${Math.min(2, step + 1)}`
    DARKER[`${ramp}-${step}`] = `${ramp}-${Math.max(0, step - 1)}`
  }
}

/**
 * The palette token at one art pixel of the room's back wall: patterned paper above, wood panelling
 * below, lit in hard steps from the lamp. With no lamp it is only ever the two darkest inks.
 */
export function wallPixel(x: number, y: number, view: WallView): string {
  let token: string
  if (view.skirt !== undefined && y >= view.skirt) {
    const down = y - view.skirt
    if (down < CAP) token = 'wood-2'
    else if (x % BOARD === 0) token = 'wood-0'
    else token = hash(x, Math.floor(y / 3)) % GRAIN_ONE_IN === 0 ? 'wood-0' : 'wood-1'
  } else {
    const fromCentre = Math.abs((x % MOTIF.every) - MOTIF.every / 2) + Math.abs((y % MOTIF.every) - MOTIF.every / 2)
    token = fromCentre === MOTIF.size || fromCentre === 0 ? 'ink-0' : 'ink-1'
  }
  if (!view.lamp) return token

  const distance = Math.hypot((x + 0.5 - view.lamp.x) / (view.cols * REACH.x), (y + 0.5 - view.lamp.y) / (view.rows * REACH.y))
  const light = (1 - distance) * 2 + view.shift + (dither(x, y) - 0.5) * SOFT
  if (light > LIT) return LIGHTER[token]
  if (light < SHADE) return DARKER[token]
  return token
}

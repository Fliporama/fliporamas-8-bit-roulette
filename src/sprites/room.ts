import { FACE } from '../lib/clock'
import type { Light } from '../lib/scene'
import { sketch } from '../lib/sketch'
import type { SpriteData } from '../lib/sprite'

// The room's furniture. Each obeys the lighting rule: lit along the top, shadowed along the bottom,
// outlined in ink.

const BULB: Record<Light, { hot: string; warm: string; glow: boolean }> = {
  dim: { hot: 'brass-1', warm: 'brass-0', glow: false },
  normal: { hot: 'lamp-1', warm: 'lamp-0', glow: false },
  flare: { hot: 'lamp-1', warm: 'lamp-1', glow: true },
}

/** The green-shaded lamp over the table, on its cord, with its bulb at one light level. */
function lamp(level: Light): SpriteData {
  const { hot, warm, glow } = BULB[level]
  const drawing = sketch(48, 40).rect(22, 7, 4, 3, 'brass-0')
  // The shade: a cone, lighter where the room's own light catches its crown.
  for (let row = 0; row < 18; row++) {
    const token = row < 3 ? 'felt-3' : row < 10 ? 'felt-2' : 'felt-1'
    drawing.rect(19 - row, 10 + row, 10 + row * 2, 1, token)
  }
  drawing
    .rect(1, 28, 46, 2, 'brass-3')
    .rect(1, 30, 46, 2, 'brass-1')
    .rect(15, 32, 18, 2, hot)
    .rect(16, 34, 16, 2, warm)
    .outline('ink-0')
    .rect(23, 0, 2, 7, 'ink-0') // the cord
  if (glow) drawing.rect(12, 37, 24, 1, 'lamp-0').rect(8, 39, 32, 1, 'lamp-0')
  return drawing.sprite()
}

export const LAMPS: Record<Light, SpriteData> = { dim: lamp('dim'), normal: lamp('normal'), flare: lamp('flare') }

/** A turned wooden pedestal for the wheel at rest. */
export const WHEEL_STAND = sketch(44, 12)
  .rect(1, 1, 42, 2, 'wood-2')
  .rect(1, 3, 42, 1, 'wood-0')
  .rect(13, 4, 18, 2, 'brass-2')
  .rect(16, 6, 12, 6, 'wood-1')
  .rect(16, 6, 2, 6, 'wood-2')
  .rect(26, 6, 2, 6, 'wood-0')
  .outline('ink-0')
  .sprite()

/** Where the frosted window is cut out of the door, in art pixels. */
export const DOOR_WINDOW = { x: 8, y: 6, width: 28, height: 24 }

/** The top of a panelled door in the back wall. Its window is left clear: the glass is drawn behind it. */
export const DOOR = sketch(44, 52)
  .rect(1, 1, 42, 51, 'wood-0')
  .rect(3, 3, 38, 49, 'wood-1')
  .rect(3, 3, 38, 1, 'wood-2')
  .rect(DOOR_WINDOW.x - 2, DOOR_WINDOW.y - 2, DOOR_WINDOW.width + 4, DOOR_WINDOW.height + 4, 'wood-0')
  .rect(8, 36, 28, 16, 'wood-0')
  .rect(10, 38, 24, 14, 'wood-1')
  .rect(10, 38, 24, 1, 'wood-2')
  .rect(36, 32, 3, 3, 'brass-2')
  .rect(36, 34, 3, 1, 'brass-1')
  .outline('ink-0')
  .clear(DOOR_WINDOW.x, DOOR_WINDOW.y, DOOR_WINDOW.width, DOOR_WINDOW.height)
  .sprite()

const PATRON = { width: 18, height: 22 }

/** Whoever is passing behind the glass: head and shoulders, in shadow. */
export const PATRONS: readonly SpriteData[] = [
  sketch(PATRON.width, PATRON.height).ellipse(9, 7, 5, 6, 'ink-2').ellipse(9, 18, 9, 6, 'ink-2').rect(0, 18, 18, 4, 'ink-2').sprite(),
  sketch(PATRON.width, PATRON.height)
    .rect(5, 0, 8, 5, 'ink-2') // a hat's crown
    .rect(2, 4, 14, 2, 'ink-2') // and brim
    .ellipse(9, 9, 4, 5, 'ink-2')
    .ellipse(9, 19, 8, 6, 'ink-2')
    .rect(1, 19, 16, 3, 'ink-2')
    .sprite(),
]

/** Where the face sits within the clock's case. */
export const CLOCK_FACE = { x: 3, y: 4 }

/** A wall clock: a wooden case, a paper face, and a dark glazed door below for the pendulum. No hands. */
export const CLOCK = sketch(FACE + 6, 36)
  .rect(1, 1, FACE + 4, 34, 'wood-1')
  .rect(1, 1, FACE + 4, 2, 'wood-2')
  .rect(1, 33, FACE + 4, 2, 'wood-0')
  .rect(CLOCK_FACE.x - 1, CLOCK_FACE.y - 1, FACE + 2, FACE + 2, 'ink-0')
  .rect(CLOCK_FACE.x, CLOCK_FACE.y, FACE, FACE, 'paper-0')
  .rect(4, 18, FACE - 2, 14, 'ink-0')
  .outline('ink-0')
  .sprite()

export const PENDULUM = sketch(3, 11).rect(1, 0, 1, 8, 'brass-1').rect(0, 8, 3, 3, 'brass-2').sprite()

/** A ceiling fan seen from below, its two blades turning towards and away from the viewer. */
function fan(reach: number): SpriteData {
  return sketch(60, 8)
    .rect(30 - reach, 4, reach * 2, 3, 'wood-1')
    .rect(30 - reach, 4, reach * 2, 1, 'wood-2')
    .rect(27, 2, 6, 5, 'brass-1')
    .rect(27, 2, 6, 1, 'brass-3')
    .outline('ink-0')
    .rect(29, 0, 2, 2, 'ink-0')
    .sprite()
}

export const FAN: readonly SpriteData[] = [fan(29), fan(21), fan(6), fan(21)]

/** A gramophone: a brass horn over a wooden box. The record is drawn separately, so it can turn. */
export const GRAMOPHONE = sketch(28, 28)
  .rect(5, 17, 20, 10, 'wood-1')
  .rect(5, 17, 20, 1, 'wood-2')
  .rect(5, 25, 20, 2, 'wood-0')
  .rect(17, 9, 2, 6, 'brass-1')
  .ellipse(10, 8, 9, 7, 'brass-2')
  .ellipse(10, 6, 7, 3, 'brass-3')
  .ellipse(9, 9, 5, 4, 'brass-0')
  .outline('ink-0')
  .sprite()

/** Where the record sits on the gramophone's box. */
export const RECORD_AT = { x: 8, y: 14 }

function record(glint: number): SpriteData {
  return sketch(14, 3).rect(1, 0, 12, 3, 'ink-0').rect(0, 1, 14, 1, 'ink-0').rect(glint, 1, 2, 1, 'paper-0').sprite()
}

export const RECORD: readonly SpriteData[] = [record(2), record(5), record(8), record(11)]

/** The shelf the gramophone stands on. */
export const SHELF = sketch(34, 5).rect(1, 1, 32, 1, 'wood-2').rect(1, 2, 32, 2, 'wood-0').outline('ink-0').sprite()

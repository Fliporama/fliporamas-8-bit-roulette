import { sketch } from '../lib/sketch'
import type { Sketch } from '../lib/sketch'
import type { SpriteData } from '../lib/sprite'

// The croupier, waist-up, in layers that stack exactly: every layer is WIDTH × HEIGHT art pixels.
// The lamp hangs in front of and above the head, so the face stays dark: only the visor's brass
// edge and the eyes catch the light. Shirt, waistcoat and hands are lit from above.

export const WIDTH = 80
export const HEIGHT = 68
const MIDDLE = WIDTH / 2

/** Where the eyes sit on the figure when looking straight ahead. */
export const EYES_AT = { x: 34, y: 15 }

/** Head, visor and torso: everything but the arms and the eyes. */
export const BODY: SpriteData = (() => {
  const drawing = sketch(WIDTH, HEIGHT)
    // Waistcoat, shaded down the side away from the lamp.
    .rect(24, 30, 32, 38, 'ink-2')
    .rect(50, 32, 6, 36, 'ink-1')
    .rect(26, 30, 12, 1, 'smoke-0')
    // Neck and head: a dark shape under the visor.
    .rect(36, 23, 8, 6, 'ink-1')
    .ellipse(MIDDLE, 13, 11, 12, 'ink-1')
    .rect(29, 3, 22, 5, 'ink-2')
    .rect(27, 8, 26, 2, 'brass-2')
    .rect(27, 10, 26, 1, 'brass-1')

  // The shirt front shows in a V between the lapels.
  for (let row = 0; row < 19; row++) {
    const half = 7 - Math.floor(row / 3)
    drawing
      .rect(MIDDLE - half, 29 + row, half * 2, 1, 'paper-0')
      .rect(MIDDLE - half - 3, 29 + row, 3, 1, 'oxblood-1')
      .rect(MIDDLE + half, 29 + row, 3, 1, 'oxblood-0')
  }
  return drawing
    .rect(MIDDLE + 2, 32, 2, 14, 'smoke-2')
    // Bow tie.
    .rect(33, 27, 5, 6, 'oxblood-1')
    .rect(42, 27, 5, 6, 'oxblood-1')
    .rect(33, 32, 5, 1, 'oxblood-0')
    .rect(42, 32, 5, 1, 'oxblood-0')
    .rect(38, 28, 4, 4, 'oxblood-0')
    // Buttons.
    .rect(39, 51, 2, 2, 'brass-2')
    .rect(39, 57, 2, 2, 'brass-2')
    .rect(39, 63, 2, 2, 'brass-2')
    .outline('ink-0')
    .sprite()
})()

/** Two eyes, catching the lamp. */
export const EYES: SpriteData = sketch(13, 2).rect(0, 0, 3, 2, 'paper-1').rect(10, 0, 3, 2, 'paper-1').sprite()

export type Arms = 'rest' | 'raised' | 'tap' | 'shrug' | 'tie'
type Side = 'left' | 'right'

/** Draws on one side of the figure: coordinates are given for the left arm and mirrored for the right. */
function on(drawing: Sketch, side: Side) {
  return (x: number, y: number, width: number, height: number, token: string) =>
    drawing.rect(side === 'left' ? x : WIDTH - x - width, y, width, height, token)
}

/** A sleeve from the shoulder down to a hand `lift` art pixels above the rail and `out` further from the body. */
function resting(drawing: Sketch, side: Side, lift = 0, out = 0) {
  const box = on(drawing, side)
  box(13, 29, 12, 8, 'paper-0') // shoulder
  box(13 - out, 35, 10, 16 - lift, 'paper-0') // upper arm
  box(13 - out, 35, 2, 16 - lift, 'smoke-1')
  box(10 - out, 49 - lift, 11, 10, 'paper-0') // forearm
  box(10 - out, 49 - lift, 2, 10, 'smoke-1')
  box(10 - out, 57 - lift, 11, 2, 'smoke-2') // the rolled cuff
  box(9 - out, 59 - lift, 13, 7, 'brass-3') // hand
  box(9 - out, 64 - lift, 13, 2, 'brass-1')
}

/** An arm raised beside the head, palm out: no more bets. */
function raised(drawing: Sketch, side: Side) {
  const box = on(drawing, side)
  box(13, 29, 12, 8, 'paper-0')
  box(6, 27, 10, 12, 'paper-0') // upper arm, out to the side
  box(6, 37, 10, 2, 'smoke-1')
  box(4, 15, 10, 14, 'paper-0') // forearm, upright
  box(4, 15, 2, 14, 'smoke-1')
  box(4, 15, 10, 2, 'smoke-2')
  box(3, 3, 12, 12, 'brass-3') // open palm
  box(6, 3, 1, 6, 'brass-1')
  box(9, 3, 1, 6, 'brass-1')
  box(12, 3, 1, 6, 'brass-1')
  box(3, 13, 12, 2, 'brass-1')
}

/** A hand brought up to straighten the bow tie. */
function atTie(drawing: Sketch, side: Side) {
  const box = on(drawing, side)
  box(13, 29, 12, 8, 'paper-0')
  box(13, 35, 10, 12, 'paper-0')
  box(13, 35, 2, 12, 'smoke-1')
  for (let step = 0; step < 5; step++) box(15 + step * 3, 42 - step * 2, 9, 8, 'paper-0') // forearm, across the chest
  box(27, 33, 9, 2, 'smoke-2')
  box(29, 26, 9, 8, 'brass-3')
  box(29, 32, 9, 2, 'brass-1')
}

const POSES: Record<Arms, (drawing: Sketch) => void> = {
  rest: (drawing) => {
    resting(drawing, 'left')
    resting(drawing, 'right')
  },
  raised: (drawing) => {
    resting(drawing, 'left')
    raised(drawing, 'right')
  },
  tap: (drawing) => {
    resting(drawing, 'left')
    resting(drawing, 'right', 3)
  },
  shrug: (drawing) => {
    resting(drawing, 'left', 3, 5)
    resting(drawing, 'right', 3, 5)
  },
  tie: (drawing) => {
    resting(drawing, 'left')
    atTie(drawing, 'right')
  },
}

function arms(pose: Arms): SpriteData {
  const drawing = sketch(WIDTH, HEIGHT)
  POSES[pose](drawing)
  return drawing.outline('ink-0').sprite()
}

export const ARMS: Record<Arms, SpriteData> = {
  rest: arms('rest'),
  raised: arms('raised'),
  tap: arms('tap'),
  shrug: arms('shrug'),
  tie: arms('tie'),
}

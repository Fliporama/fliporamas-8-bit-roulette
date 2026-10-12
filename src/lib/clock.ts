import { sketch } from './sketch'
import type { Sketch } from './sketch'
import type { SpriteData } from './sprite'

/** Art pixels across the clock's face: odd, so it has a centre pixel. */
export const FACE = 11

const CENTRE = (FACE - 1) / 2
const MINUTE_HAND = 4 // art pixels from the centre
const HOUR_HAND = 3

/** A hand as whole pixels from the centre towards `turns` of a full circle, clockwise from twelve. */
function hand(drawing: Sketch, turns: number, length: number, token: string) {
  const angle = turns * 2 * Math.PI
  for (let step = 0; step <= length; step++) {
    drawing.rect(CENTRE + Math.round(Math.sin(angle) * step), CENTRE - Math.round(Math.cos(angle) * step), 1, 1, token)
  }
}

/** The hands of a clock at a time of day, as a FACE × FACE sprite. Where they cross, the minute hand shows. */
export function clockHands(hours: number, minutes: number): SpriteData {
  const drawing = sketch(FACE, FACE)
  hand(drawing, ((hours % 12) + minutes / 60) / 12, HOUR_HAND, 'oxblood-0')
  hand(drawing, minutes / 60, MINUTE_HAND, 'ink-0')
  return drawing.sprite()
}

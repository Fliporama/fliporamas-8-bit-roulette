import { CHIP_VALUES } from '../lib/chips'
import type { ChipValue } from '../lib/chips'
import { sprite } from '../lib/sprite'
import type { SpriteData } from '../lib/sprite'

/**
 * A casino chip in three-quarter view: a lit face above a shadowed edge two art pixels deep,
 * so chips stacked two pixels apart read as a solid column.
 */
function chip(value: ChipValue): SpriteData {
  return sprite(
    [
      '...xxxxxx...',
      '.xxhhsshhxx.',
      'xhhffffffhhx',
      'xsffffffffsx',
      'xsffffffffsx',
      'xhffffffffhx',
      'xddffssffddx',
      'xddddddddddx',
      'xsddddddddsx',
      '.xxddssddxx.',
      '...xxxxxx...',
    ],
    { x: 'ink-0', f: `chip-${value}`, h: `chip-${value}-light`, d: `chip-${value}-dark`, s: `chip-${value}-stripe` },
  )
}

export const CHIP_SPRITES = Object.fromEntries(CHIP_VALUES.map((value) => [value, chip(value)])) as Record<ChipValue, SpriteData>

/** The pool of shadow a chip stack throws straight down onto the felt. */
export const CHIP_SHADOW = sprite(['.xxxxxxxxxxxx.', 'xxxxxxxxxxxxxx', '..xxxxxxxxxx..'], { x: 'chip-shadow' })

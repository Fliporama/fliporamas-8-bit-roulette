import { sprite } from '../lib/sprite'
import type { SpriteData } from '../lib/sprite'

// Sample sprites. Each obeys the lighting rule: lit along the top, shadowed along the bottom,
// outlined in ink.

export type ChipValue = 1 | 5 | 10 | 25 | 100

/**
 * A casino chip in three-quarter view: a lit face above a shadowed edge two art pixels deep,
 * so chips stacked two pixels apart read as a solid column.
 */
export function chip(value: ChipValue): SpriteData {
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

/** The pool of shadow a chip stack throws straight down onto the felt. */
export const CHIP_SHADOW = sprite(['.xxxxxxxxxxxx.', 'xxxxxxxxxxxxxx', '..xxxxxxxxxx..'], { x: 'felt-0' })

const centred = (body: string) => {
  const pad = '.'.repeat((24 - body.length) / 2)
  return pad + body + pad
}
const shade = (width: number, fill: string) => centred(`x${fill.repeat(width)}x`)

/** The green-shaded lamp that lights the whole scene. */
export const LAMP = sprite(
  [
    centred('cc'),
    centred('cc'),
    shade(4, 'B'),
    shade(8, 'G'),
    shade(12, 'g'),
    shade(14, 'g'),
    shade(16, 'g'),
    shade(18, 'd'),
    shade(20, 'd'),
    shade(22, 'd'),
    shade(22, 'B'),
    shade(22, 'b'),
    shade(8, 'L'),
    centred('l'.repeat(8)),
  ],
  {
    x: 'ink-0',
    c: 'brass-0',
    B: 'brass-3',
    b: 'brass-1',
    G: 'felt-3',
    g: 'felt-2',
    d: 'felt-1',
    L: 'lamp-1',
    l: 'lamp-0',
  },
)

/** A tileable length of the table's wooden rail, capped in brass. */
export const RAIL = sprite(
  [
    'BBBBBBBBBBBBBBBB',
    'wwwwwwwwwwwwwwww',
    'mmmmwwmmmmmmmwmm',
    'mmkmmmmmmwwmmmmm',
    'kkkkkkkkkkkkkkkk',
    'xxxxxxxxxxxxxxxx',
  ],
  { B: 'brass-3', w: 'wood-2', m: 'wood-1', k: 'wood-0', x: 'ink-0' },
)

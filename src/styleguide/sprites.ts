import { sprite } from '../lib/sprite'

const centred = (body: string) => {
  const pad = '.'.repeat((24 - body.length) / 2)
  return pad + body + pad
}
const shade = (width: number, fill: string) => centred(`x${fill.repeat(width)}x`)

/** The green-shaded lamp that lights the whole scene. Phase 3 hangs it over the table. */
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

import { sprite } from '../lib/sprite'

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

import { sprite } from '../lib/sprite'

/** A pointing hand. The fingertip is the top-left corner, so that corner is where it taps. */
export const HAND = sprite(
  [
    'oo..........',
    'ofo.........',
    'offo........',
    'offfooo.....',
    '.offffffoo..',
    '.offfffffo..',
    '..offffffoo.',
    '..offffffffo',
    '..offffffffo',
    '...offffffo.',
    '...osssssso.',
    '....oooooo..',
    '....occcco..',
    '....occcco..',
    '....occcco..',
    '....oooooo..',
  ],
  { o: 'ink-0', f: 'paper-1', s: 'paper-0', c: 'brass-2' },
)

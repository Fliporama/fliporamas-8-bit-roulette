import type { BetTarget } from './roulette'

export type Light = 'dim' | 'normal' | 'flare'
export type Reaction = 'idle' | 'noMoreBets' | 'win' | 'loss'
/** Left, centre, right. */
export type Look = -1 | 0 | 1

export interface Moment {
  phase: 'betting' | 'spinning' | 'tallying'
  won: boolean
}

const STORAGE_KEY = 'fliporama-scene'

/** Light steps added to the lamp's pool at each level. */
export const LIGHT_SHIFT: Record<Light, number> = { dim: -1, normal: 0, flare: 1 }

/** The room dims while the wheel turns and flares when a win is counted out. */
export function lightFor({ phase, won }: Moment): Light {
  if (phase === 'spinning') return 'dim'
  return phase === 'tallying' && won ? 'flare' : 'normal'
}

export function reactionFor({ phase, won }: Moment): Reaction {
  if (phase === 'spinning') return 'noMoreBets'
  if (phase === 'tallying') return won ? 'win' : 'loss'
  return 'idle'
}

/** Which third of the wide table a bet sits in: numbers run left to right, 1 to 36. */
export function lookFor({ kind, numbers }: Pick<BetTarget, 'kind' | 'numbers'>): Look {
  if (kind === 'column') return 1
  const mean = numbers.reduce((total, number) => total + number, 0) / numbers.length
  return mean < 13 ? -1 : mean > 24 ? 1 : 0
}

/** Whether room animation starts on: a stored choice wins, otherwise on unless motion is reduced. */
export function sceneDefault(stored: string | null, reducedMotion: boolean): boolean {
  if (stored === '1') return true
  if (stored === '0') return false
  return !reducedMotion
}

let on = true
try {
  on = sceneDefault(localStorage.getItem(STORAGE_KEY), matchMedia('(prefers-reduced-motion: reduce)').matches)
} catch {
  // No storage or no media queries: the room animates, and the setting just doesn't persist.
}

export function isSceneOn(): boolean {
  return on
}

export function setSceneOn(value: boolean): void {
  on = value
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Nothing to do: see above.
  }
}

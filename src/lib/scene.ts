import type { BetTarget } from './roulette'
import { prefersReducedMotion, stored } from './stored'

export type Light = 'dim' | 'normal' | 'flare'
export type Reaction = 'idle' | 'noMoreBets' | 'win' | 'loss'
/** Left, centre, right. */
export type Look = -1 | 0 | 1

export interface Moment {
  phase: 'betting' | 'spinning' | 'tallying'
  won: boolean
}

const STORE = stored('fliporama-scene')

/** Light steps added to the lamp's pool at each level. */
export const LIGHT_SHIFT: Record<Light, number> = { dim: -1, normal: 0, flare: 1 }

const STEP_MS = 100 // a change of level lands in two hard steps this far apart
const FLICKER = { everyMin: 6000, everyMax: 14000, ms: 80, shift: -0.5 }

/**
 * Takes the room's light from the shift `from` to `level`, calling `show` with each shift in turn:
 * half-way at once, then the level. At normal it then flickers now and then, unless `hidden` says nobody would see.
 * Returns a function that stops it where it is.
 */
export function runLight(from: number, level: Light, show: (shift: number) => void, hidden: () => boolean): () => void {
  const target = LIGHT_SHIFT[level]
  const timers: ReturnType<typeof setTimeout>[] = []
  const later = (run: () => void, ms: number) => timers.push(setTimeout(run, ms))
  if (from !== target) {
    show((from + target) / 2)
    later(() => show(target), STEP_MS)
  }
  if (level === 'normal') {
    const wait = () => FLICKER.everyMin + Math.random() * (FLICKER.everyMax - FLICKER.everyMin)
    const flicker = () => {
      // Not in a hidden tab: a flicker repaints the felt and the wall for nobody.
      if (!hidden()) {
        show(FLICKER.shift)
        later(() => show(target), FLICKER.ms)
      }
      later(flicker, wait())
    }
    later(flicker, wait())
  }
  return () => timers.forEach((timer) => clearTimeout(timer))
}

/** The level a light shift shows as: anything below normal already looks dim, and only a full step up is a flare. */
export function levelOf(shift: number): Light {
  if (shift < 0) return 'dim'
  return shift >= 1 ? 'flare' : 'normal'
}

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

let on = sceneDefault(STORE.get(), prefersReducedMotion())

export function isSceneOn(): boolean {
  return on
}

export function setSceneOn(value: boolean): void {
  on = value
  STORE.set(value ? '1' : '0')
}

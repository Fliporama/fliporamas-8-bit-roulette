import { prefersReducedMotion, stored } from './stored'

/** How much screen treatment and juice the player wants: see the settings panel. */
export type Effects = 'full' | 'low' | 'off'

export const EFFECTS: readonly Effects[] = ['full', 'low', 'off']

/** The share of each burst's particles that fly at a level. */
export const PARTICLE_SHARE: Record<Effects, number> = { full: 1, low: 0.5, off: 0 }

const STORE = stored('fliporama-effects')

/** The level effects start at: a stored choice wins, otherwise full unless motion is reduced. */
export function effectsDefault(stored: string | null, reducedMotion: boolean): Effects {
  const known = EFFECTS.find((level) => level === stored)
  return known ?? (reducedMotion ? 'off' : 'full')
}

let level = effectsDefault(STORE.get(), prefersReducedMotion())

export function getEffects(): Effects {
  return level
}

export function setEffects(value: Effects): void {
  level = value
  STORE.set(value)
}

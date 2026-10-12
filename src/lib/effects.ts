/** How much screen treatment and juice the player wants: see the settings panel. */
export type Effects = 'full' | 'low' | 'off'

export const EFFECTS: readonly Effects[] = ['full', 'low', 'off']

/** The share of each burst's particles that fly at a level. */
export const PARTICLE_SHARE: Record<Effects, number> = { full: 1, low: 0.5, off: 0 }

const STORAGE_KEY = 'fliporama-effects'

/** The level effects start at: a stored choice wins, otherwise full unless motion is reduced. */
export function effectsDefault(stored: string | null, reducedMotion: boolean): Effects {
  const known = EFFECTS.find((level) => level === stored)
  return known ?? (reducedMotion ? 'off' : 'full')
}

/** A value from a source that may be missing or blocked. */
function read<Value>(source: () => Value, otherwise: Value): Value {
  try {
    return source()
  } catch {
    return otherwise
  }
}

let level = effectsDefault(
  read(() => localStorage.getItem(STORAGE_KEY), null),
  read(() => matchMedia('(prefers-reduced-motion: reduce)').matches, false),
)

export function getEffects(): Effects {
  return level
}

export function setEffects(value: Effects): void {
  level = value
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // No storage: the setting just doesn't persist.
  }
}

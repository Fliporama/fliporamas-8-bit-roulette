// What the screen layer shows for a given room light, and when it should give up moving. See ScreenEffects.tsx.

const LAMP_GLOW = { atNormal: 0.12, perStep: 0.3 } // strength of the light added round the bulb, and what one light step adds
const DIM_VIGNETTE = 0.6 // how much deeper the vignette goes with the room fully dimmed, as a share of itself
const LATE = 1.5 // a tick this many times its interval apart counts as late
const WINDOW = 24 // ticks judged at a time: two seconds of grain

/** Strength of the glow round the lamp's bulb for a light shift: none when dimmed, strongest on a flare. */
export function lampGlow(light: number): number {
  return Math.max(0, LAMP_GLOW.atNormal + light * LAMP_GLOW.perStep)
}

/** How much the vignette deepens for a light shift: only a dimmed room darkens the corners further. */
export function vignetteBoost(light: number): number {
  return Math.max(0, -light) * DIM_VIGNETTE
}

/**
 * Whether the layer is struggling, from the gaps between its last ticks in milliseconds:
 * true when the two most recent windows both ran late on average. One bad window is a hitch, not a slow machine.
 */
export function struggling(gaps: readonly number[], interval: number): boolean {
  if (gaps.length < WINDOW * 2) return false
  const late = (window: readonly number[]) => window.reduce((total, gap) => total + gap, 0) / window.length > interval * LATE
  return late(gaps.slice(-WINDOW)) && late(gaps.slice(-WINDOW * 2, -WINDOW))
}

/** How many gaps `struggling` needs to be given. */
export const STRUGGLE_GAPS = WINDOW * 2

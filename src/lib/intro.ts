import { createInsideTarget, type InsideBetKind } from './roulette'
import { stored } from './stored'

export type Stage = 'boot' | 'title' | 'play'

const STORE = stored('fliporama-intro')

/** `search` is location.search. `/?play` wins; then reduced motion or a seen intro start at the title. */
export function firstStage(search: string, seen: boolean, reducedMotion: boolean): Stage {
  if (new URLSearchParams(search).has('play')) return 'play'
  return seen || reducedMotion ? 'title' : 'boot'
}

/** Whether the hand's tutorial run is owed: not seen, and not opened with `?play`. */
export function owesHand(search: string, seen: boolean): boolean {
  return !seen && !new URLSearchParams(search).has('play')
}

export function introSeen(): boolean {
  return STORE.get() === '1'
}

export function markIntroSeen(): void {
  STORE.set('1')
}

export function forgetIntro(): void {
  STORE.set(null)
}

interface HandStep {
  target: string // a CSS selector
  ms: number // how long the hand stays
}

export const HAND_STEPS: readonly HandStep[] = [
  { target: '[data-chip="25"]', ms: 900 },
  { target: '[data-spot="n17"]', ms: 900 },
  { target: '.spin-button', ms: 1200 },
]
export const HAND_REST_MS = 1500
export const ATTRACT_AFTER_MS = 8000
export const PREVIEW_MS = 1000

const example = (kind: InsideBetKind, selection: number[]) =>
  createInsideTarget(kind, selection)?.numbers ?? []

/** The numbers an example bet of each kind covers. */
export const PREVIEW_EXAMPLE: Record<InsideBetKind, readonly number[]> = {
  straight: example('straight', [17]),
  split: example('split', [17, 20]),
  street: example('street', [17]),
  sixLine: example('sixLine', [17]),
}

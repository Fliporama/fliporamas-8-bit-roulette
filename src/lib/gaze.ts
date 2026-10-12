import type { Look } from './scene'

/** Where the croupier's eyes point and what holds them there; `seen` is the last chip looked at. */
export interface Eyes {
  gaze: Look
  busy?: 'look' | 'glance'
  seen: number
}

export type EyesEvent =
  | { type: 'chip'; at: Look; id: number }
  | { type: 'lookOver' }
  | { type: 'glance'; at: Look }
  | { type: 'glanceOver' }
  | { type: 'pause' }

export const EYES_FORWARD: Eyes = { gaze: 0, seen: 0 }

/**
 * The eyes after an event. A look at a chip outranks an idle glance: a glance never starts or ends one,
 * and a chip that lands during a glance takes over. A chip is looked at once, however often it is offered.
 */
export function eyesAfter(eyes: Eyes, event: EyesEvent): Eyes {
  switch (event.type) {
    case 'chip':
      return event.id === eyes.seen ? eyes : { gaze: event.at, busy: 'look', seen: event.id }
    case 'lookOver':
      return eyes.busy === 'look' ? { gaze: 0, seen: eyes.seen } : eyes
    case 'glance':
      return eyes.busy ? eyes : { gaze: event.at, busy: 'glance', seen: eyes.seen }
    case 'glanceOver':
      return eyes.busy === 'glance' ? { gaze: 0, seen: eyes.seen } : eyes
    case 'pause':
      return { gaze: 0, seen: eyes.seen }
  }
}

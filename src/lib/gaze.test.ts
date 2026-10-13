import { expect, it } from 'vitest'
import { EYES_FORWARD, eyesAfter } from './gaze'
import type { EyesEvent } from './gaze'

const after = (...events: EyesEvent[]) => events.reduce(eyesAfter, EYES_FORWARD)

it('looks at a chip, then forward again', () => {
  expect(after({ type: 'chip', at: 1, id: 1 }).gaze).toBe(1)
  expect(after({ type: 'chip', at: 1, id: 1 }, { type: 'lookOver' }).gaze).toBe(0)
})

it('does not let an idle glance cut a look short', () => {
  const looking = after({ type: 'chip', at: 1, id: 1 }, { type: 'glance', at: -1 })
  expect(looking.gaze).toBe(1)
  expect(eyesAfter(looking, { type: 'glanceOver' }).gaze).toBe(1)
})

it('lets a chip that lands during a glance win', () => {
  const looking = after({ type: 'glance', at: -1 }, { type: 'chip', at: 1, id: 1 }, { type: 'glanceOver' })
  expect(looking.gaze).toBe(1)
  expect(eyesAfter(looking, { type: 'lookOver' }).gaze).toBe(0)
})

it('glances and returns when nothing else is going on', () => {
  expect(after({ type: 'glance', at: -1 }).gaze).toBe(-1)
  expect(after({ type: 'glance', at: -1 }, { type: 'glanceOver' }).gaze).toBe(0)
})

it('faces forward on a pause and does not look again at the same chip afterwards', () => {
  const paused = after({ type: 'chip', at: 1, id: 4 }, { type: 'pause' })
  expect(paused.gaze).toBe(0)
  expect(eyesAfter(paused, { type: 'chip', at: 1, id: 4 }).gaze).toBe(0)
  expect(eyesAfter(paused, { type: 'chip', at: 1, id: 5 }).gaze).toBe(1)
  // Free to glance again straight away: the pause ended whatever held the eyes.
  expect(eyesAfter(paused, { type: 'glance', at: -1 }).gaze).toBe(-1)
})

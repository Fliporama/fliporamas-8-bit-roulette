import { expect, it } from 'vitest'
import { levelOf, lightFor, lookFor, reactionFor, sceneDefault, startsOn } from './scene'
import type { Moment } from './scene'

const at = (phase: Moment['phase'], won = false): Moment => ({ phase, won })

it('lights the room for each moment of the game', () => {
  expect(lightFor(at('betting'))).toBe('normal')
  expect(lightFor(at('spinning'))).toBe('dim')
  expect(lightFor(at('tallying', true))).toBe('flare')
  expect(lightFor(at('tallying', false))).toBe('normal')
  expect(lightFor(at('betting', true))).toBe('normal')
})

it('gives the croupier a reaction for each moment', () => {
  expect(reactionFor(at('betting'))).toBe('idle')
  expect(reactionFor(at('spinning'))).toBe('noMoreBets')
  expect(reactionFor(at('tallying', true))).toBe('win')
  expect(reactionFor(at('tallying', false))).toBe('loss')
})

it('looks at the part of the table a bet is on', () => {
  expect(lookFor({ kind: 'straight', numbers: [0] })).toBe(-1)
  expect(lookFor({ kind: 'straight', numbers: [3] })).toBe(-1)
  expect(lookFor({ kind: 'straight', numbers: [17] })).toBe(0)
  expect(lookFor({ kind: 'straight', numbers: [36] })).toBe(1)
  expect(lookFor({ kind: 'street', numbers: [7, 8, 9] })).toBe(-1)
  expect(lookFor({ kind: 'dozen', numbers: Array.from({ length: 12 }, (_, index) => index + 25) })).toBe(1)
  expect(lookFor({ kind: 'column', numbers: [3, 6, 9] })).toBe(1) // the column boxes are at the right end
})

it('starts on unless motion is reduced, and a stored choice wins', () => {
  expect(sceneDefault(null, false)).toBe(true)
  expect(sceneDefault(null, true)).toBe(false)
  expect(sceneDefault('1', true)).toBe(true)
  expect(sceneDefault('0', false)).toBe(false)
})

it('ignores a stored value it did not write', () => {
  expect(sceneDefault('yes', false)).toBe(true)
  expect(sceneDefault('', true)).toBe(false)
})

it('still honours reduced motion when the stored setting cannot be read', () => {
  const broken = () => {
    throw new Error('storage is blocked')
  }
  expect(startsOn(broken, () => true)).toBe(false)
  expect(startsOn(broken, () => false)).toBe(true)
  expect(startsOn(() => '0', broken)).toBe(false)
  expect(startsOn(() => null, broken)).toBe(true)
})

it('names the level a light shift shows as', () => {
  expect(levelOf(-1)).toBe('dim')
  expect(levelOf(-0.5)).toBe('dim') // a flicker, or half-way down: the lamp is already dimmer
  expect(levelOf(0)).toBe('normal')
  expect(levelOf(0.5)).toBe('normal')
  expect(levelOf(1)).toBe('flare')
})

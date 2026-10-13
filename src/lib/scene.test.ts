import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { levelOf, lightFor, lookFor, reactionFor, runLight, sceneDefault } from './scene'
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

it('names the level a light shift shows as', () => {
  expect(levelOf(-1)).toBe('dim')
  expect(levelOf(-0.5)).toBe('dim') // a flicker, or half-way down: the lamp is already dimmer
  expect(levelOf(0)).toBe('normal')
  expect(levelOf(0.5)).toBe('normal')
  expect(levelOf(1)).toBe('flare')
})

describe('runLight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0) // the shortest wait between flickers: six seconds
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('reaches a new level in two hard steps', () => {
    const shown: number[] = []
    runLight(0, 'dim', (shift) => shown.push(shift), () => false)
    expect(shown).toEqual([-0.5])
    vi.advanceTimersByTime(100)
    expect(shown).toEqual([-0.5, -1])
    vi.advanceTimersByTime(60_000)
    expect(shown).toEqual([-0.5, -1]) // no flicker away from normal
  })

  it('shows nothing when it is already there', () => {
    const shown: number[] = []
    runLight(1, 'flare', (shift) => shown.push(shift), () => false)
    vi.advanceTimersByTime(60_000)
    expect(shown).toEqual([])
  })

  it('drops a change that is interrupted and starts the next from where the light stood', () => {
    const shown: number[] = []
    const stop = runLight(0, 'dim', (shift) => shown.push(shift), () => false)
    vi.advanceTimersByTime(50)
    stop()
    runLight(shown.at(-1)!, 'flare', (shift) => shown.push(shift), () => false)
    vi.advanceTimersByTime(1000)
    expect(shown).toEqual([-0.5, 0.25, 1])
  })

  it('flickers now and then at normal, and stops when told to', () => {
    const shown: number[] = []
    const stop = runLight(0, 'normal', (shift) => shown.push(shift), () => false)
    vi.advanceTimersByTime(5999)
    expect(shown).toEqual([])
    vi.advanceTimersByTime(1)
    expect(shown).toEqual([-0.5])
    vi.advanceTimersByTime(80)
    expect(shown).toEqual([-0.5, 0])
    vi.advanceTimersByTime(6000)
    expect(shown).toEqual([-0.5, 0, -0.5, 0])
    stop()
    vi.advanceTimersByTime(60_000)
    expect(shown).toEqual([-0.5, 0, -0.5, 0])
  })

  it('skips the flicker while the document is hidden, and picks it up again after', () => {
    const shown: number[] = []
    let hidden = true
    runLight(0, 'normal', (shift) => shown.push(shift), () => hidden)
    vi.advanceTimersByTime(20_000)
    expect(shown).toEqual([])
    hidden = false
    vi.advanceTimersByTime(6000)
    expect(shown.slice(0, 2)).toEqual([-0.5, 0])
  })
})

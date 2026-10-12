import { expect, it } from 'vitest'
import { STRUGGLE_GAPS, lampGlow, struggling, vignetteBoost } from './screen'

it('glows most on a flare, a little at normal and not at all when dimmed', () => {
  expect(lampGlow(1)).toBeGreaterThan(lampGlow(0))
  expect(lampGlow(0)).toBeGreaterThan(0)
  expect(lampGlow(-0.5)).toBe(0)
  expect(lampGlow(-1)).toBe(0)
})

it('deepens the vignette only as the room dims', () => {
  expect(vignetteBoost(1)).toBe(0)
  expect(vignetteBoost(0)).toBe(0)
  expect(vignetteBoost(-1)).toBeGreaterThan(vignetteBoost(-0.5))
  expect(vignetteBoost(-0.5)).toBeGreaterThan(0)
})

const gaps = (ms: number, count = STRUGGLE_GAPS) => Array.from({ length: count }, () => ms)

it('is not struggling when ticks arrive on time', () => {
  expect(struggling(gaps(83), 83)).toBe(false)
  expect(struggling(gaps(100), 83)).toBe(false)
})

it('is struggling when ticks have run late for two windows together', () => {
  expect(struggling(gaps(200), 83)).toBe(true)
})

it('forgives one bad window, and waits until it has seen enough', () => {
  const half = STRUGGLE_GAPS / 2
  expect(struggling([...gaps(83, half), ...gaps(400, half)], 83)).toBe(false)
  expect(struggling([...gaps(400, half), ...gaps(83, half)], 83)).toBe(false)
  expect(struggling(gaps(400, STRUGGLE_GAPS - 1), 83)).toBe(false)
})

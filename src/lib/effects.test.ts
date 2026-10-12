import { expect, it } from 'vitest'
import { EFFECTS, PARTICLE_SHARE, effectsDefault } from './effects'

it('starts full, or off when motion is reduced', () => {
  expect(effectsDefault(null, false)).toBe('full')
  expect(effectsDefault(null, true)).toBe('off')
})

it('lets a stored choice win, and ignores one it does not know', () => {
  for (const level of EFFECTS) expect(effectsDefault(level, true)).toBe(level)
  expect(effectsDefault('ultra', false)).toBe('full')
  expect(effectsDefault('', true)).toBe('off')
})

it('flies fewer particles at each step down, and none when off', () => {
  expect(PARTICLE_SHARE.full).toBeGreaterThan(PARTICLE_SHARE.low)
  expect(PARTICLE_SHARE.low).toBeGreaterThan(PARTICLE_SHARE.off)
  expect(PARTICLE_SHARE.off).toBe(0)
})

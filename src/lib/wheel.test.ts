import { describe, expect, it } from 'vitest'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from './wheel'

describe('wheel geometry', () => {
  it('holds every pocket from 0 to 36 exactly once, starting at zero', () => {
    expect(WHEEL_ORDER).toHaveLength(37)
    expect([...WHEEL_ORDER].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i))
    expect(WHEEL_ORDER.slice(0, 4)).toEqual([0, 32, 15, 19])
    expect(WHEEL_ORDER.at(-1)).toBe(26)
  })

  it('places each pocket one arc further clockwise', () => {
    expect(pocketAngle(0)).toBe(0)
    expect(pocketAngle(32)).toBeCloseTo(POCKET_ARC)
    expect(pocketAngle(26)).toBeCloseTo(360 - POCKET_ARC)
  })
})

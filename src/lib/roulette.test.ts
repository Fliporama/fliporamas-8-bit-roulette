import { describe, expect, it } from 'vitest'
import {
  calculateReturns,
  createInsideTarget,
  createOutsideTarget,
  getPocketColor,
  randomPocket,
} from './roulette'

describe('roulette pocket colors', () => {
  it('keeps zero green and identifies red and black pockets', () => {
    expect(getPocketColor(0)).toBe('green')
    expect(getPocketColor(1)).toBe('red')
    expect(getPocketColor(2)).toBe('black')
    expect(getPocketColor(36)).toBe('red')
  })
})

describe('bet targets', () => {
  it('validates inside bets and assigns total-return multipliers', () => {
    expect(createInsideTarget('straight', [8])?.returnMultiplier).toBe(36)
    expect(createInsideTarget('split', [1, 4])?.returnMultiplier).toBe(18)
    expect(createInsideTarget('street', [1, 2, 3])?.returnMultiplier).toBe(12)
    expect(createInsideTarget('sixLine', [1, 2, 3, 4, 5, 6])?.returnMultiplier).toBe(6)
    expect(createInsideTarget('split', [1, 5])).toBeUndefined()
    expect(createInsideTarget('street', [1, 2, 4])).toBeUndefined()
  })

  it('handles zero for even-money bets and validates dozens and columns', () => {
    const red = createOutsideTarget('red')
    const even = createOutsideTarget('even')
    const dozen = createOutsideTarget('dozen', 2)
    const column = createOutsideTarget('column', 3)

    expect(red?.numbers).not.toContain(0)
    expect(even?.numbers).not.toContain(0)
    expect(dozen?.numbers).toEqual(Array.from({ length: 12 }, (_, index) => index + 13))
    expect(column?.numbers).toContain(36)
    expect(createOutsideTarget('dozen', 4)).toBeUndefined()
  })
})

describe('roulette returns', () => {
  it('returns total winning stakes and nothing for losing bets', () => {
    const straight = createInsideTarget('straight', [7])!
    const red = createOutsideTarget('red')!
    const black = createOutsideTarget('black')!

    expect(
      calculateReturns(7, [
        { target: straight, stake: 5 },
        { target: red, stake: 10 },
      ]),
    ).toBe(200)
    expect(calculateReturns(0, [{ target: black, stake: 10 }])).toBe(0)
  })
})

describe('random pocket selection', () => {
  it('maps samples to 0-36 without modulo bias', () => {
    const values = [0xffff_ffff, 36]
    expect(randomPocket(() => values.shift()!)).toBe(36)
  })
})
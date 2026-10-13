import { describe, expect, it } from 'vitest'
import {
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
    expect(createInsideTarget('street', [5])?.numbers).toEqual([4, 5, 6])
    expect(createInsideTarget('sixLine', [9])?.numbers).toEqual([7, 8, 9, 10, 11, 12])
    expect(createInsideTarget('street', [0])).toBeUndefined()
  })

  it('handles zero for even-money bets and validates dozens and columns', () => {
    const red = createOutsideTarget('red')
    const even = createOutsideTarget('even')
    const dozen = createOutsideTarget('dozen', 2)
    const column = createOutsideTarget('column', 3)

    expect(red.numbers).not.toContain(0)
    expect(even.numbers).not.toContain(0)
    expect(dozen.numbers).toEqual(Array.from({ length: 12 }, (_, index) => index + 13))
    expect(column.numbers).toContain(36)
  })
})

describe('random pocket selection', () => {
  it('maps samples to 0-36 without modulo bias', () => {
    const values = [0xffff_ffff, 36]
    expect(randomPocket(() => values.shift()!)).toBe(36)
  })
})
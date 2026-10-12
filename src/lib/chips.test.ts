import { describe, expect, it } from 'vitest'
import { stackAnchor, tossDuration } from './chips'

// Tile centres 40 apart. Wide table: a street runs up the screen. Stood on end: it runs leftwards.
const wide = (number: number) => ({ x: Math.floor((number - 1) / 3) * 40, y: 0 - ((number - 1) % 3) * 40 })
const tall = (number: number) => ({ x: 0 - ((number - 1) % 3) * 40, y: Math.floor((number - 1) / 3) * 40 })

describe('stackAnchor', () => {
  it('puts a straight bet on its tile', () => {
    expect(stackAnchor('straight', [wide(5)])).toEqual(wide(5))
    expect(stackAnchor('red', [{ x: 9, y: 9 }])).toEqual({ x: 9, y: 9 })
  })

  it('puts a split on the line the two tiles share', () => {
    expect(stackAnchor('split', [wide(1), wide(2)])).toEqual({ x: 0, y: -20 })
    expect(stackAnchor('split', [wide(1), wide(4)])).toEqual({ x: 20, y: 0 })
  })

  it('puts a street on the outer edge of its lowest tile, in either orientation', () => {
    expect(stackAnchor('street', [1, 2, 3].map(wide))).toEqual({ x: 0, y: 20 })
    expect(stackAnchor('street', [1, 2, 3].map(tall))).toEqual({ x: 20, y: 0 })
  })

  it('puts a six line on the outer edge between its two streets', () => {
    expect(stackAnchor('sixLine', [1, 2, 3, 4, 5, 6].map(wide))).toEqual({ x: 20, y: 20 })
    expect(stackAnchor('sixLine', [1, 2, 3, 4, 5, 6].map(tall))).toEqual({ x: 20, y: 20 })
  })
})

describe('tossDuration', () => {
  it('grows with distance and stays within limits', () => {
    expect(tossDuration(0)).toBe(280)
    expect(tossDuration(200)).toBeGreaterThan(tossDuration(100))
    expect(tossDuration(5000)).toBe(480)
  })
})

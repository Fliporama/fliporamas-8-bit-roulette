import { describe, expect, it } from 'vitest'
import { sprite } from './sprite'

const KEY = { x: 'ink-0', o: 'brass-2' }

describe('sprite', () => {
  it('reports the grid size and leaves dots transparent', () => {
    const gem = sprite(['.xx.', 'xoox', '.xx.'], KEY)
    expect(gem.width).toBe(4)
    expect(gem.height).toBe(3)
    expect(gem.rects.filter((rect) => rect.y === 0)).toEqual([{ x: 1, y: 0, width: 2, token: 'ink-0' }])
  })

  it('merges a horizontal run of one colour into one rectangle', () => {
    expect(sprite(['xoox'], KEY).rects).toEqual([
      { x: 0, y: 0, width: 1, token: 'ink-0' },
      { x: 1, y: 0, width: 2, token: 'brass-2' },
      { x: 3, y: 0, width: 1, token: 'ink-0' },
    ])
  })

  it('rejects a malformed sprite where it is defined', () => {
    expect(() => sprite([], KEY)).toThrow(/empty/)
    expect(() => sprite(['xx', 'x'], KEY)).toThrow(/row 1/)
    expect(() => sprite(['x?'], KEY)).toThrow(/"\?"/)
    expect(() => sprite(['x.'], { ...KEY, '.': 'ink-0' })).toThrow(/transparent/)
    expect(() => sprite(['x'], { xy: 'ink-0' })).toThrow(/single character/)
  })
})

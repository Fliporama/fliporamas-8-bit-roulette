import { expect, it } from 'vitest'
import { sketch } from './sketch'

it('merges each row of a rectangle into one run', () => {
  expect(sketch(4, 3).rect(1, 0, 2, 2, 'ink-0').sprite()).toEqual({
    width: 4,
    height: 3,
    rects: [
      { x: 1, y: 0, width: 2, token: 'ink-0' },
      { x: 1, y: 1, width: 2, token: 'ink-0' },
    ],
  })
})

it('paints later shapes over earlier ones, and can cut holes', () => {
  const drawn = sketch(3, 1).rect(0, 0, 3, 1, 'wood-1').rect(1, 0, 1, 1, 'brass-2').sprite()
  expect(drawn.rects.map((rect) => rect.token)).toEqual(['wood-1', 'brass-2', 'wood-1'])
  expect(sketch(3, 1).rect(0, 0, 3, 1, 'wood-1').clear(1, 0, 1, 1).sprite().rects).toHaveLength(2)
})

it('ignores anything drawn off the edge', () => {
  expect(sketch(2, 2).rect(-5, -5, 6, 6, 'ink-0').rect(9, 9, 2, 2, 'ink-0').sprite().rects).toEqual([{ x: 0, y: 0, width: 1, token: 'ink-0' }])
})

it('draws a symmetrical ellipse', () => {
  const rows = sketch(9, 9).ellipse(4.5, 4.5, 4, 4, 'paper-0').sprite().rects
  expect(rows[0].x + rows[0].width / 2).toBe(4.5)
  expect(rows.find((rect) => rect.y === 4)?.width).toBeGreaterThan(rows[0].width)
})

it('outlines whatever has been drawn, staying inside the sprite', () => {
  const drawn = sketch(5, 3).rect(2, 1, 1, 1, 'brass-2').outline('ink-0').sprite()
  expect(drawn.rects).toEqual([
    { x: 2, y: 0, width: 1, token: 'ink-0' },
    { x: 1, y: 1, width: 1, token: 'ink-0' },
    { x: 2, y: 1, width: 1, token: 'brass-2' },
    { x: 3, y: 1, width: 1, token: 'ink-0' },
    { x: 2, y: 2, width: 1, token: 'ink-0' },
  ])
})

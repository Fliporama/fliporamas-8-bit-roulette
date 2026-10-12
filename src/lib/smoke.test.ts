import { expect, it } from 'vitest'
import { smokeToken } from './smoke'

const COLS = 120
const ROWS = 80
const field = (seconds: number) => {
  const tokens: (string | undefined)[] = []
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) tokens.push(smokeToken(x, y, seconds, COLS, ROWS))
  return tokens
}

it('is thin: mostly clear air, with some smoke', () => {
  const smoky = field(3).filter(Boolean).length
  expect(smoky).toBeGreaterThan(COLS * ROWS * 0.02)
  expect(smoky).toBeLessThan(COLS * ROWS * 0.3)
})

it('only uses the smoke tokens', () => {
  for (const token of field(3)) expect(['smoke-0', 'smoke-1', undefined]).toContain(token)
})

it('is the same at the same moment and different later', () => {
  expect(field(3)).toEqual(field(3))
  expect(field(4)).not.toEqual(field(3))
})

it('leaves the edges of the band clear', () => {
  for (let y = 0; y < ROWS; y++) {
    expect(smokeToken(0, y, 3, COLS, ROWS)).toBeUndefined()
    expect(smokeToken(COLS - 1, y, 3, COLS, ROWS)).toBeUndefined()
  }
})

it('still behaves after hours of running, and with no room', () => {
  const late = field(40000).filter(Boolean).length
  expect(late).toBeGreaterThan(COLS * ROWS * 0.02)
  expect(late).toBeLessThan(COLS * ROWS * 0.3)
  expect(smokeToken(0, 0, 1, 0, 0)).toBeUndefined()
})

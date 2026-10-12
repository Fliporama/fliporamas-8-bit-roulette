import { expect, it } from 'vitest'
import { feltStep } from './felt'

const COLS = 96
const ROWS = 44
const block = (left: number, top: number) =>
  Array.from({ length: 81 }, (_, index) => feltStep(left + (index % 9), top + Math.floor(index / 9), COLS, ROWS))

it('is brightest under the lamp and darkest in the bottom corners', () => {
  expect(block(44, 5).filter((step) => step === 3).length).toBeGreaterThan(60)
  expect(block(0, 35).filter((step) => step === 0).length).toBeGreaterThan(60)
  expect(block(87, 35).filter((step) => step === 0).length).toBeGreaterThan(60)
})

it('only ever returns a step of the felt ramp', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) expect([0, 1, 2, 3]).toContain(feltStep(x, y, COLS, ROWS))
})

it('gives the same pixel the same step every time', () => {
  expect(feltStep(17, 9, COLS, ROWS)).toBe(feltStep(17, 9, COLS, ROWS))
})

it('copes with a felt that has no room yet', () => {
  expect([0, 1, 2, 3]).toContain(feltStep(0, 0, 0, 0))
  expect([0, 1, 2, 3]).toContain(feltStep(0, 0, 1, 1))
})

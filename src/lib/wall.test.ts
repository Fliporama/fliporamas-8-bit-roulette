import { expect, it } from 'vitest'
import { WALL_TOKENS, wallPixel } from './wall'
import type { WallView } from './wall'

const COLS = 120
const ROWS = 80
const band: WallView = { cols: COLS, rows: ROWS, lamp: { x: 60, y: 20 }, shift: 0, skirt: 56 }
const rank = (token: string) => WALL_TOKENS.indexOf(token) % 3 // the step within its ramp

it('uses wallpaper above the skirt and wood below it', () => {
  expect(wallPixel(10, 10, band)).toMatch(/^ink-/)
  expect(wallPixel(10, 70, band)).toMatch(/^wood-/)
  expect(wallPixel(10, 70, { ...band, skirt: undefined })).toMatch(/^ink-/)
})

it('is lighter near the lamp than in the far corners', () => {
  const near = Array.from({ length: 25 }, (_, index) => rank(wallPixel(58 + (index % 5), 22 + Math.floor(index / 5), band)))
  const far = Array.from({ length: 25 }, (_, index) => rank(wallPixel(index % 5, Math.floor(index / 5), band)))
  expect(Math.min(...near)).toBeGreaterThan(Math.max(...far))
})

it('never uses the lightest ink on an unlit wall, so page text over it stays readable', () => {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      expect(['ink-0', 'ink-1']).toContain(wallPixel(x, y, { cols: COLS, rows: ROWS, shift: 0 }))
    }
  }
})

it('dims and flares with the light', () => {
  const count = (shift: number) => {
    let lit = 0
    for (let y = 0; y < 56; y++) for (let x = 0; x < COLS; x++) if (wallPixel(x, y, { ...band, shift }) === 'ink-2') lit++
    return lit
  }
  expect(count(-1)).toBeLessThan(count(0))
  expect(count(1)).toBeGreaterThan(count(0))
})

it('only uses tokens it declares, and copes with no room', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) expect(WALL_TOKENS).toContain(wallPixel(x, y, band))
  expect(WALL_TOKENS).toContain(wallPixel(0, 0, { cols: 0, rows: 0, shift: 0 }))
})

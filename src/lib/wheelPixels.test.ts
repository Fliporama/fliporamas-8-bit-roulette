/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { POCKET_ARC } from './wheel'
import { RADII, WHEEL_TOKENS, wheelPixel } from './wheelPixels'
import type { WheelView } from './wheelPixels'

const SIZE = 96
const HALF = SIZE / 2
const view = (extra: Partial<WheelView> = {}): WheelView => ({ size: SIZE, turn: 0, hubTurn: 0, ...extra })
/** The pixel just right of the vertical centre line, in the number band at the top. */
const top = (extra?: Partial<WheelView>) => wheelPixel(HALF, Math.round(HALF * (1 - RADII.numbers / 100)), view(extra))

it('puts pocket 0 at the top of an unturned wheel', () => {
  expect(top()).toMatch(/^felt-/)
})

it('brings the next pocket round as the wheel turns back by one pocket', () => {
  expect(top({ turn: -POCKET_ARC })).toMatch(/^oxblood-/) // 32, red
  expect(top({ turn: -2 * POCKET_ARC })).toMatch(/^ink-/) // 15, black
})

it('reads turns of any size and sign the same way', () => {
  expect(top({ turn: -POCKET_ARC - 720 })).toBe(top({ turn: -POCKET_ARC }))
  expect(top({ turn: 36 * POCKET_ARC + 1080 })).toBe(top({ turn: -POCKET_ARC }))
})

it('draws the ball where it is told to', () => {
  const pixel = wheelPixel(Math.round(HALF * (1 + RADII.ballRest / 100)), HALF, view({ ball: { angle: 90, radius: RADII.ballRest } }))
  expect(pixel).toMatch(/^paper-/)
})

it('has a brass hub and nothing outside the rim', () => {
  expect(wheelPixel(HALF, HALF, view())).toMatch(/^brass-/)
  expect(wheelPixel(0, 0, view())).toBeUndefined()
})

it('dims the losers and lights the winner once the ball is down', () => {
  expect(top({ landed: { winner: 0, lit: true } })).toBe('brass-2')
  expect(top({ turn: -POCKET_ARC, landed: { winner: 0, lit: true } })).not.toBe(top({ turn: -POCKET_ARC }))
})

it('only uses tokens that exist', () => {
  const css = readFileSync('src/tokens.css', 'utf8')
  const used = new Set<string>()
  for (const turn of [0, 13, -200]) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const token = wheelPixel(x, y, view({ turn, hubTurn: turn / 2, ball: { angle: 40, radius: 96 }, landed: { winner: 7, lit: turn === 0 } }))
        if (token) used.add(token)
      }
    }
  }
  for (const token of used) {
    expect(css).toContain(`--${token}:`)
    expect(WHEEL_TOKENS).toContain(token)
  }
})

it('copes with a wheel that has no room yet', () => {
  expect(wheelPixel(0, 0, view({ size: 0 }))).toBeUndefined()
  expect(() => wheelPixel(1, 1, view({ size: 2 }))).not.toThrow()
})

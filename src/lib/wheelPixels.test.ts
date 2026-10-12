/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from './wheel'
import { RADII, WHEEL_TOKENS, wheelPainter, wheelPixel } from './wheelPixels'
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

it('never lightens the number band, so the numbers stay readable', () => {
  expect(top()).toBe('felt-2')
  expect(top({ turn: -POCKET_ARC })).toBe('oxblood-1')
  expect(top({ turn: -2 * POCKET_ARC })).toBe('ink-1')
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

it('paints exactly what wheelPixel says, at every pixel', () => {
  const codes = Uint32Array.from({ length: WHEEL_TOKENS.length + 1 }, (_, code) => code)
  const balls = [undefined, { angle: 40, radius: 96 }, { angle: -310.5, radius: RADII.ballRest }, { angle: 200, radius: 10 }]
  const landings = [undefined, { winner: 7, lit: true }, { winner: 7, lit: false }]
  for (const size of [0, 2, 96, 100, 172]) {
    const painter = wheelPainter(size)
    const out = new Uint32Array(size * size)
    let run = 0
    for (const turn of [0, 13, -200.25, -POCKET_ARC, 725.5, 3600 + POCKET_ARC / 2]) {
      const rest = { turn, hubTurn: -turn / 3, ball: balls[run % balls.length], landed: landings[run % landings.length] }
      run++
      painter(rest, codes, out)
      const wrong: string[] = []
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const token = wheelPixel(x, y, { size, ...rest })
          const painted = out[y * size + x]
          if (painted !== (token ? WHEEL_TOKENS.indexOf(token) + 1 : 0)) wrong.push(`${x},${y}: ${token} not ${WHEEL_TOKENS[painted - 1]}`)
        }
      }
      expect(wrong.slice(0, 5), `size ${size}, turn ${turn}`).toEqual([])
    }
  }
})

it('rests the ball in the winning pocket, wherever the wheel stops', () => {
  for (const size of [96, 172]) {
    const half = size / 2
    const reach = (half * RADII.ballRest) / 100
    for (const number of WHEEL_ORDER) {
      for (const [turn, laps] of [[540, 5], [723.4, 6], [899.9, 7]]) {
        // As RouletteWheel leaves it: the ball's arm has run back `laps` times and stopped over the pocket.
        const angle = ((turn + pocketAngle(number) - 360 * laps) * Math.PI) / 180
        const x = Math.floor(half + reach * Math.sin(angle))
        const y = Math.floor(half - reach * Math.cos(angle))
        const under = (lit: boolean) => wheelPixel(x, y, { size, turn, hubTurn: 0, landed: { winner: number, lit } })
        expect(under(true), `${number} at ${turn}`).toBe('brass-2')
        expect(under(false), `${number} at ${turn}`).toMatch(/^(oxblood|ink|felt)-/)
      }
    }
  }
})

it('copes with a wheel that has no room yet', () => {
  expect(wheelPixel(0, 0, view({ size: 0 }))).toBeUndefined()
  expect(() => wheelPixel(1, 1, view({ size: 2 }))).not.toThrow()
})

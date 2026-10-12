import { expect, it } from 'vitest'
import { FACE, clockHands, untilNextMinute } from './clock'

const CENTRE = (FACE - 1) / 2
const cells = (hours: number, minutes: number, token: string) =>
  clockHands(hours, minutes)
    .rects.filter((rect) => rect.token === token)
    .flatMap((rect) => Array.from({ length: rect.width }, (_, index) => ({ x: rect.x + index, y: rect.y })))

it('points the minute hand straight up on the hour', () => {
  const minute = cells(3, 0, 'ink-0')
  expect(minute.length).toBeGreaterThan(2)
  for (const cell of minute) expect(cell.x).toBe(CENTRE)
  expect(Math.min(...minute.map((cell) => cell.y))).toBeLessThan(CENTRE - 2)
})

it('points the hour hand right at three and left at nine', () => {
  expect(Math.max(...cells(3, 0, 'oxblood-0').map((cell) => cell.x))).toBeGreaterThan(CENTRE)
  expect(Math.min(...cells(9, 0, 'oxblood-0').map((cell) => cell.x))).toBeLessThan(CENTRE)
})

it('reads afternoon hours like morning ones', () => {
  expect(clockHands(15, 20)).toEqual(clockHands(3, 20))
  expect(clockHands(0, 0)).toEqual(clockHands(12, 0))
})

it('keeps both hands on the face at any time', () => {
  for (const [hours, minutes] of [[0, 0], [12, 0], [23, 59], [6, 30], [10, 10]]) {
    const hands = clockHands(hours, minutes)
    expect(hands.width).toBe(FACE)
    expect(hands.height).toBe(FACE)
    for (const rect of hands.rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(FACE)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeLessThan(FACE)
    }
  }
})

it('waits until the minute turns, not a minute from now', () => {
  expect(untilNextMinute(new Date(2026, 9, 13, 3, 14, 59, 400))).toBe(600)
  expect(untilNextMinute(new Date(2026, 9, 13, 3, 14, 20, 0))).toBe(40_000)
  expect(untilNextMinute(new Date(2026, 9, 13, 3, 14, 0, 0))).toBe(60_000)
})

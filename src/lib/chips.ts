import type { BetKind, BetPlacement } from './roulette'

export const CHIP_VALUES = [1, 5, 10, 25, 100] as const
export type ChipValue = (typeof CHIP_VALUES)[number]

export interface Point {
  x: number
  y: number
}

export interface Chip {
  id: number
  value: ChipValue
}

/** A bet plus the physical chips that were tossed onto it, oldest first. */
export interface PlacedBet extends BetPlacement {
  chips: Chip[]
}

const TOSS_MS = { min: 280, max: 480, perPixel: 0.35 }

/** Half a tile beyond `from`, on the side away from `towards`: the outer edge of a street. */
function outerEdge(from: Point, towards: Point): Point {
  return { x: from.x + (from.x - towards.x) / 2, y: from.y + (from.y - towards.y) / 2 }
}

function midpoint(first: Point, second: Point): Point {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
}

/**
 * Where a bet's chips sit, from the centres of the tiles it covers in ascending number order.
 * Works from tile centres alone, so it holds for the wide table and the stood-on-end one.
 */
export function stackAnchor(kind: BetKind, centres: readonly Point[]): Point {
  switch (kind) {
    case 'split':
      return midpoint(centres[0], centres[1])
    case 'street':
      return outerEdge(centres[0], centres[1])
    case 'sixLine':
      return midpoint(outerEdge(centres[0], centres[1]), outerEdge(centres[3], centres[4]))
    default:
      return centres[0]
  }
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Where chips sit in a box that also holds a label: `inset` from its right edge, centred vertically. */
export function boxAnchor(box: Box, inset: number): Point {
  return { x: box.x + box.width - inset, y: box.y + box.height / 2 }
}

/** Milliseconds a chip spends in the air: longer throws take longer, within limits. */
export function tossDuration(distance: number): number {
  return Math.min(TOSS_MS.max, TOSS_MS.min + distance * TOSS_MS.perPixel)
}

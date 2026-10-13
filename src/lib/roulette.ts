type PocketColor = 'green' | 'red' | 'black'

export type InsideBetKind = 'straight' | 'split' | 'street' | 'sixLine'
type OutsideBetKind =
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen'
  | 'column'
export type BetKind = InsideBetKind | OutsideBetKind

const INSIDE_KINDS: readonly BetKind[] = ['straight', 'split', 'street', 'sixLine']

export function isInside(kind: BetKind): kind is InsideBetKind {
  return INSIDE_KINDS.includes(kind)
}

export interface BetTarget {
  id: string
  kind: BetKind
  label: string
  numbers: number[]
  returnMultiplier: number
}

export interface BetPlacement {
  target: BetTarget
  stake: number
}

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
])

export function getPocketColor(number: number): PocketColor {
  if (number === 0) return 'green'
  return RED_NUMBERS.has(number) ? 'red' : 'black'
}

function target(
  kind: BetKind,
  numbers: number[],
  label: string,
  returnMultiplier: number,
): BetTarget {
  const sortedNumbers = [...numbers].sort((left, right) => left - right)
  return {
    id: `${kind}-${sortedNumbers.join('-')}`,
    kind,
    label,
    numbers: sortedNumbers,
    returnMultiplier,
  }
}

function shareEdge(first: number, second: number): boolean {
  if (first === 0) return second >= 1 && second <= 3
  if (second === 0) return first >= 1 && first <= 3

  const firstRow = Math.floor((first - 1) / 3)
  const secondRow = Math.floor((second - 1) / 3)
  const firstColumn = (first - 1) % 3
  const secondColumn = (second - 1) % 3

  return (
    (firstRow === secondRow && Math.abs(firstColumn - secondColumn) === 1) ||
    (firstColumn === secondColumn && Math.abs(firstRow - secondRow) === 1)
  )
}

export function createInsideTarget(
  kind: InsideBetKind,
  selection: number[],
): BetTarget | undefined {
  const numbers = [...new Set(selection)]
  const [first, second] = numbers

  if (kind === 'straight') return target(kind, [first], `Straight ${first}`, 36)

  if (kind === 'split') {
    return numbers.length === 2 && shareEdge(first, second)
      ? target(kind, numbers, `Split ${first} / ${second}`, 18)
      : undefined
  }

  // Streets and six lines are the run of 3 or 6 containing the picked number; zero is in neither.
  if (first === 0) return undefined
  const size = kind === 'street' ? 3 : 6
  const start = Math.floor((first - 1) / size) * size + 1
  return target(
    kind,
    Array.from({ length: size }, (_, index) => start + index),
    `${kind === 'street' ? 'Street' : 'Six line'} ${start}-${start + size - 1}`,
    36 / size,
  )
}

const ORDINALS = ['1st', '2nd', '3rd']

const POCKETS = Array.from({ length: 36 }, (_, index) => index + 1)

/** Which pockets each outside bet covers, and its label. A dozen or column is the `group`th of three. */
const OUTSIDE: Record<OutsideBetKind, { covers: (number: number, group: number) => boolean; label: (ordinal: string) => string }> = {
  red: { covers: (number) => RED_NUMBERS.has(number), label: () => 'Red' },
  black: { covers: (number) => !RED_NUMBERS.has(number), label: () => 'Black' },
  even: { covers: (number) => number % 2 === 0, label: () => 'Even' },
  odd: { covers: (number) => number % 2 === 1, label: () => 'Odd' },
  low: { covers: (number) => number <= 18, label: () => '1-18' },
  high: { covers: (number) => number > 18, label: () => '19-36' },
  dozen: { covers: (number, group) => Math.ceil(number / 12) === group, label: (ordinal) => `${ordinal} 12` },
  column: { covers: (number, group) => (number - 1) % 3 === group - 1, label: (ordinal) => `${ordinal} column` },
}

export function createOutsideTarget(kind: OutsideBetKind, group: 1 | 2 | 3 = 1): BetTarget {
  const { covers, label } = OUTSIDE[kind]
  const numbers = POCKETS.filter((number) => covers(number, group))
  return target(kind, numbers, label(ORDINALS[group - 1]), 36 / numbers.length)
}

export function formatChips(amount: number): string {
  return amount.toLocaleString('en-US')
}

const UINT32_RANGE = 0x1_0000_0000

export function randomPocket(randomUint32?: () => number): number {
  const limit = Math.floor(UINT32_RANGE / 37) * 37
  const randomValue = randomUint32 ?? (() => crypto.getRandomValues(new Uint32Array(1))[0])
  let value = randomValue()

  while (value >= limit) value = randomValue()
  return value % 37
}
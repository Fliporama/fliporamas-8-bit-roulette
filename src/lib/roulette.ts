export type PocketColor = 'green' | 'red' | 'black'

export type InsideBetKind = 'straight' | 'split' | 'street' | 'sixLine'
export type OutsideBetKind =
  | 'red'
  | 'black'
  | 'even'
  | 'odd'
  | 'low'
  | 'high'
  | 'dozen'
  | 'column'
export type BetKind = InsideBetKind | OutsideBetKind

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

function validNumbers(numbers: number[]): boolean {
  return numbers.length > 0 && numbers.every((number) => Number.isInteger(number) && number >= 0 && number <= 36)
}

function target(
  kind: BetKind,
  numbers: number[],
  label: string,
  returnMultiplier: number,
): BetTarget {
  const sortedNumbers = [...new Set(numbers)].sort((left, right) => left - right)
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
  if (!validNumbers(selection)) return undefined
  const numbers = [...new Set(selection)]

  if (kind === 'straight' && numbers.length === 1) {
    return target(kind, numbers, `Straight ${numbers[0]}`, 36)
  }

  if (kind === 'split' && numbers.length === 2 && shareEdge(numbers[0], numbers[1])) {
    return target(kind, numbers, `Split ${numbers[0]} / ${numbers[1]}`, 18)
  }

  const positiveNumbers = numbers.filter((number) => number > 0)
  if (kind === 'street' && numbers.length === 3 && positiveNumbers.length === 3) {
    const rowStart = Math.floor((positiveNumbers[0] - 1) / 3) * 3 + 1
    const street = [rowStart, rowStart + 1, rowStart + 2]
    if (street.every((number) => numbers.includes(number))) {
      return target(kind, street, `Street ${rowStart}-${rowStart + 2}`, 12)
    }
  }

  if (kind === 'sixLine' && numbers.length === 6 && positiveNumbers.length === 6) {
    const blockStart = Math.floor((positiveNumbers[0] - 1) / 6) * 6 + 1
    const sixLine = Array.from({ length: 6 }, (_, index) => blockStart + index)
    if (sixLine.every((number) => numbers.includes(number))) {
      return target(kind, sixLine, `Six line ${blockStart}-${blockStart + 5}`, 6)
    }
  }

  return undefined
}

export function createOutsideTarget(
  kind: OutsideBetKind,
  group?: number,
): BetTarget | undefined {
  let numbers: number[]
  let label: string
  let returnMultiplier = 2

  switch (kind) {
    case 'red':
      numbers = [...RED_NUMBERS]
      label = 'Red'
      break
    case 'black':
      numbers = Array.from({ length: 36 }, (_, index) => index + 1).filter(
        (number) => !RED_NUMBERS.has(number),
      )
      label = 'Black'
      break
    case 'even':
      numbers = Array.from({ length: 18 }, (_, index) => (index + 1) * 2)
      label = 'Even'
      break
    case 'odd':
      numbers = Array.from({ length: 18 }, (_, index) => index * 2 + 1)
      label = 'Odd'
      break
    case 'low':
      numbers = Array.from({ length: 18 }, (_, index) => index + 1)
      label = '1-18'
      break
    case 'high':
      numbers = Array.from({ length: 18 }, (_, index) => index + 19)
      label = '19-36'
      break
    case 'dozen':
      if (group !== 1 && group !== 2 && group !== 3) return undefined
      numbers = Array.from({ length: 12 }, (_, index) => (group - 1) * 12 + index + 1)
      label = `${group}${group === 1 ? 'st' : group === 2 ? 'nd' : 'rd'} 12`
      returnMultiplier = 3
      break
    case 'column':
      if (group !== 1 && group !== 2 && group !== 3) return undefined
      numbers = Array.from({ length: 12 }, (_, index) => index * 3 + group)
      label = `${group}${group === 1 ? 'st' : group === 2 ? 'nd' : 'rd'} column`
      returnMultiplier = 3
      break
  }

  return target(kind, numbers, label, returnMultiplier)
}

export function calculateReturns(
  number: number,
  placements: readonly BetPlacement[],
): number {
  return placements.reduce(
    (total, placement) =>
      placement.target.numbers.includes(number)
        ? total + placement.stake * placement.target.returnMultiplier
        : total,
    0,
  )
}

const UINT32_RANGE = 0x1_0000_0000

export function randomPocket(randomUint32?: () => number): number {
  const limit = Math.floor(UINT32_RANGE / 37) * 37
  const randomValue = randomUint32 ?? (() => crypto.getRandomValues(new Uint32Array(1))[0])
  let value = randomValue()

  while (value >= limit) value = randomValue()
  return value % 37
}
import { createOutsideTarget, formatChips, getPocketColor } from '../lib/roulette'
import type { BetTarget, InsideBetKind } from '../lib/roulette'

// Streets in order, each listed 3-2-1, so the grid reads like a real table in either orientation.
const NUMBERS = Array.from({ length: 36 }, (_, index) => index + 3 - 2 * (index % 3))
const COLUMNS = ([3, 2, 1] as const).map((group) => createOutsideTarget('column', group))
const DOZENS = ([1, 2, 3] as const).map((group) => createOutsideTarget('dozen', group))
const EVEN_MONEY = (['low', 'even', 'red', 'black', 'odd', 'high'] as const).map((kind) =>
  createOutsideTarget(kind),
)

interface RouletteTableProps {
  mode: InsideBetKind
  numberStakes: Record<number, number>
  stakes: ReadonlyMap<string, number>
  selectedNumbers: number[]
  winner: number | undefined
  disabled: boolean
  onPocketClick: (number: number) => void
  onBet: (target: BetTarget) => void
}

export default function RouletteTable({
  mode,
  numberStakes,
  stakes,
  selectedNumbers,
  winner,
  disabled,
  onPocketClick,
  onBet,
}: RouletteTableProps) {
  const pocket = (number: number) => {
    const stake = numberStakes[number] ?? 0
    const selected = selectedNumbers.includes(number)
    return (
      <button
        className={`pocket pocket-${getPocketColor(number)}${selected ? ' is-pending' : ''}${stake ? ' has-chip' : ''}${number === winner ? ' is-winner' : ''}`}
        type="button"
        aria-label={`${mode} bet on pocket ${number}${stake ? `, ${stake} chips placed` : ''}`}
        aria-pressed={selected}
        key={number}
        disabled={disabled}
        onClick={() => onPocketClick(number)}
      >
        <span>{number}</span>
        {stake > 0 && <small>{formatChips(stake)}</small>}
      </button>
    )
  }

  const outside = (target: BetTarget, label = target.label) => {
    const stake = stakes.get(target.id)
    const odds = `${target.returnMultiplier - 1}:1`
    return (
      <button
        className={`outside-button outside-${target.kind}${stake ? ' has-bet' : ''}`}
        type="button"
        aria-label={`${target.label}, pays ${odds.replace(':', ' to ')}${stake ? `, ${stake} chips placed` : ''}`}
        key={target.id}
        disabled={disabled}
        onClick={() => onBet(target)}
      >
        {label && <span>{label}</span>}
        <small>{stake ? formatChips(stake) : odds}</small>
      </button>
    )
  }

  return (
    <div className="roulette-table" aria-label="European roulette table">
      {pocket(0)}
      <div className="number-grid">{NUMBERS.map((number) => pocket(number))}</div>
      <div className="column-bets">{COLUMNS.map((target) => outside(target, ''))}</div>
      <div className="dozen-bets">{DOZENS.map((target) => outside(target))}</div>
      <div className="even-money-bets">{EVEN_MONEY.map((target) => outside(target))}</div>
    </div>
  )
}

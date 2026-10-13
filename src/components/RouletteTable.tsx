import ChipLayer from './ChipLayer'
import type { PlacedBet } from '../lib/chips'
import { createOutsideTarget, formatChips, getPocketColor, isInside } from '../lib/roulette'
import type { BetTarget, InsideBetKind } from '../lib/roulette'
import type { TallyStep } from '../lib/tally'

// Streets in order, each listed 3-2-1, so the grid reads like a real table in either orientation.
const NUMBERS = Array.from({ length: 36 }, (_, index) => index + 3 - 2 * (index % 3))
const COLUMNS = ([3, 2, 1] as const).map((group) => createOutsideTarget('column', group))
const DOZENS = ([1, 2, 3] as const).map((group) => createOutsideTarget('dozen', group))
const EVEN_MONEY = (['low', 'even', 'red', 'black', 'odd', 'high'] as const).map((kind) =>
  createOutsideTarget(kind),
)

interface RouletteTableProps {
  mode: InsideBetKind
  bets: readonly PlacedBet[]
  numberStakes: Record<number, number>
  stakes: ReadonlyMap<string, number>
  selectedNumbers: number[]
  /** Numbers an example bet of the picked kind covers, lit for a moment. */
  preview: readonly number[]
  winner: number | undefined
  scoring: TallyStep | undefined
  /** The landed pocket while the round is being tallied. */
  result: number | undefined
  collecting: boolean
  losing: boolean
  disabled: boolean
  onPocketClick: (number: number) => void
  onBet: (target: BetTarget) => void
}

export default function RouletteTable({
  mode,
  bets,
  numberStakes,
  stakes,
  selectedNumbers,
  preview,
  winner,
  scoring,
  result,
  collecting,
  losing,
  disabled,
  onPocketClick,
  onBet,
}: RouletteTableProps) {
  const straight = new Set(bets.filter((bet) => bet.target.kind === 'straight').map((bet) => bet.target.numbers[0]))
  const scoringInside = scoring && isInside(scoring.target.kind) ? scoring : undefined

  const pocket = (number: number) => {
    const stake = numberStakes[number] ?? 0
    const selected = selectedNumbers.includes(number)
    return (
      <button
        className={`pocket pocket-${getPocketColor(number)}${straight.has(number) ? ' has-chip' : ''}${selected ? ' is-pending' : ''}${preview.includes(number) ? ' is-preview' : ''}${number === winner ? ' is-winner' : ''}${scoringInside?.target.numbers.includes(number) ? ' is-scoring' : ''}`}
        type="button"
        aria-label={`${mode} bet on pocket ${number}${stake ? `, ${stake} chips placed` : ''}`}
        aria-pressed={selected}
        key={number}
        data-spot={`n${number}`}
        disabled={disabled}
        onClick={() => onPocketClick(number)}
      >
        <span>{number}</span>
      </button>
    )
  }

  const outside = (target: BetTarget, label = target.label) => {
    const stake = stakes.get(target.id)
    const odds = `${target.returnMultiplier - 1}:1`
    const isScoring = scoring?.target.id === target.id
    return (
      <button
        className={`outside-button outside-${target.kind}${stake ? ' has-bet' : ''}${isScoring ? ' is-scoring' : ''}`}
        type="button"
        aria-label={`${target.label}, pays ${odds.replace(':', ' to ')}${stake ? `, ${stake} chips placed` : ''}`}
        key={target.id}
        data-spot={target.id}
        disabled={disabled}
        onClick={() => onBet(target)}
      >
        {label && (
          <span>
            {(target.kind === 'red' || target.kind === 'black') && <i className={`swatch swatch-${target.kind}`} />}
            {label}
          </span>
        )}
        <small>{stake ? formatChips(stake) : odds}</small>
      </button>
    )
  }

  return (
    <div className={`roulette-table${losing ? ' is-losing' : ''}`} aria-label="European roulette table">
      {pocket(0)}
      <div className="number-grid">{NUMBERS.map((number) => pocket(number))}</div>
      <div className="column-bets">{COLUMNS.map((target) => outside(target, ''))}</div>
      <div className="dozen-bets">{DOZENS.map((target) => outside(target))}</div>
      <div className="even-money-bets">{EVEN_MONEY.map((target) => outside(target))}</div>
      <ChipLayer bets={bets} scoring={scoring} result={result} collecting={collecting} />
    </div>
  )
}

import { createOutsideTarget, formatChips, getPocketColor } from '../lib/roulette'
import type { BetTarget, InsideBetKind } from '../lib/roulette'
import type { TallyStep } from '../lib/tally'

// Streets in order, each listed 3-2-1, so the grid reads like a real table in either orientation.
const NUMBERS = Array.from({ length: 36 }, (_, index) => index + 3 - 2 * (index % 3))
const INSIDE_KINDS = ['straight', 'split', 'street', 'sixLine']
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
  scoring: TallyStep | undefined
  losing: boolean
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
  scoring,
  losing,
  disabled,
  onPocketClick,
  onBet,
}: RouletteTableProps) {
  const scoringInside = scoring && INSIDE_KINDS.includes(scoring.target.kind) ? scoring : undefined
  const payoutPop = scoring && (
    <em className="payout-pop" key={scoring.target.id}>
      <span>
        {formatChips(scoring.stake)} × {scoring.target.returnMultiplier}
      </span>
      <span>+{formatChips(scoring.payout)}</span>
    </em>
  )

  const pocket = (number: number) => {
    const stake = numberStakes[number] ?? 0
    const selected = selectedNumbers.includes(number)
    return (
      <button
        className={`pocket pocket-${getPocketColor(number)}${selected ? ' is-pending' : ''}${stake ? ' has-chip' : ''}${number === winner ? ' is-winner' : ''}${scoringInside?.target.numbers.includes(number) ? ' is-scoring' : ''}`}
        type="button"
        aria-label={`${mode} bet on pocket ${number}${stake ? `, ${stake} chips placed` : ''}`}
        aria-pressed={selected}
        key={number}
        disabled={disabled}
        onClick={() => onPocketClick(number)}
      >
        <span>{number}</span>
        {stake > 0 && <small>{formatChips(stake)}</small>}
        {scoringInside && number === winner && payoutPop}
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
        disabled={disabled}
        onClick={() => onBet(target)}
      >
        {label && <span>{label}</span>}
        <small>{stake ? formatChips(stake) : odds}</small>
        {isScoring && payoutPop}
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
    </div>
  )
}

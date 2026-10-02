import { getPocketColor } from '../lib/roulette'
import type { InsideBetKind } from '../lib/roulette'

interface RouletteTableProps {
  mode: InsideBetKind
  numberStakes: Record<number, number>
  selectedNumbers: number[]
  disabled: boolean
  onPocketClick: (number: number) => void
}

function PocketButton({
  number,
  mode,
  stake,
  selected,
  disabled,
  onClick,
}: {
  number: number
  mode: InsideBetKind
  stake: number
  selected: boolean
  disabled: boolean
  onClick: () => void
}) {
  const color = getPocketColor(number)
  return (
    <button
      className={`pocket pocket-${color}${selected ? ' is-pending' : ''}${stake ? ' has-chip' : ''}`}
      type="button"
      aria-label={`${mode} bet on pocket ${number}${stake ? `, ${stake} chips placed` : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <span>{number}</span>
      {stake > 0 && <small>{stake}</small>}
    </button>
  )
}

export default function RouletteTable({
  mode,
  numberStakes,
  selectedNumbers,
  disabled,
  onPocketClick,
}: RouletteTableProps) {
  const rows = Array.from({ length: 12 }, (_, rowIndex) => [
    rowIndex * 3 + 3,
    rowIndex * 3 + 2,
    rowIndex * 3 + 1,
  ])

  return (
    <div className="roulette-table" aria-label="European roulette numbers">
      <PocketButton
        number={0}
        mode={mode}
        stake={numberStakes[0] ?? 0}
        selected={selectedNumbers.includes(0)}
        disabled={disabled}
        onClick={() => onPocketClick(0)}
      />
      <div className="number-grid">
        {rows.flatMap((row) =>
          row.map((number) => (
            <PocketButton
              key={number}
              number={number}
              mode={mode}
              stake={numberStakes[number] ?? 0}
              selected={selectedNumbers.includes(number)}
              disabled={disabled}
              onClick={() => onPocketClick(number)}
            />
          )),
        )}
      </div>
    </div>
  )
}
import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import RouletteTable from './components/RouletteTable'
import {
  calculateReturns,
  createInsideTarget,
  formatChips,
  getPocketColor,
  randomPocket,
} from './lib/roulette'
import type { BetPlacement, BetTarget, InsideBetKind } from './lib/roulette'
import { isMuted, setMuted } from './lib/sound'

const STARTING_BANKROLL = 1000
const CHIP_VALUES = [1, 5, 10, 25, 100]
const INSIDE_MODES: { kind: InsideBetKind; label: string }[] = [
  { kind: 'straight', label: 'Straight' },
  { kind: 'split', label: 'Split' },
  { kind: 'street', label: 'Street' },
  { kind: 'sixLine', label: 'Six-line' },
]

function App() {
  const [balance, setBalance] = useState(STARTING_BANKROLL)
  const [chipValue, setChipValue] = useState(5)
  const [mode, setMode] = useState<InsideBetKind>('straight')
  const [bets, setBets] = useState<BetPlacement[]>([])
  const [pendingSplit, setPendingSplit] = useState<number[]>([])
  const [lastSpin, setLastSpin] = useState<{ number: number; change: number } | undefined>()
  const [isSpinning, setIsSpinning] = useState(false)
  const [message, setMessage] = useState('PICK A CHIP, THEN PLACE YOUR BET')
  const [muted, setMutedState] = useState(isMuted)
  const spinTimer = useRef<number | undefined>(undefined)

  const totalStake = bets.reduce((total, bet) => total + bet.stake, 0)
  const betStakeById = new Map(bets.map((bet) => [bet.target.id, bet.stake]))
  const numberStakes: Record<number, number> = {}

  for (const bet of bets) {
    if (INSIDE_MODES.some((item) => item.kind === bet.target.kind)) {
      for (const number of bet.target.numbers) {
        numberStakes[number] = (numberStakes[number] ?? 0) + bet.stake
      }
    }
  }

  useEffect(
    () => () => {
      if (spinTimer.current !== undefined) window.clearTimeout(spinTimer.current)
    },
    [],
  )

  function placeBet(target: BetTarget | undefined) {
    if (!target || isSpinning) return
    if (balance < chipValue) {
      setMessage('NOT ENOUGH CHIPS FOR THAT BET')
      return
    }

    setBalance((current) => current - chipValue)
    setBets((current) => {
      const existing = current.find((bet) => bet.target.id === target.id)
      if (!existing) return [...current, { target, stake: chipValue }]
      return current.map((bet) =>
        bet.target.id === target.id ? { ...bet, stake: bet.stake + chipValue } : bet,
      )
    })
    setLastSpin(undefined)
    setMessage(`${target.label.toUpperCase()} +${chipValue} CHIPS`)
  }

  function placeInsideBet(number: number) {
    if (mode === 'split') {
      if (pendingSplit.length === 0) {
        setPendingSplit([number])
        setMessage(`SPLIT: PICK A NEIGHBOR OF ${number}`)
        return
      }

      const split = createInsideTarget('split', [pendingSplit[0], number])
      if (!split) {
        setPendingSplit([number])
        setMessage('NOT ADJACENT. PICK A NEIGHBORING POCKET')
        return
      }

      setPendingSplit([])
      placeBet(split)
      return
    }

    placeBet(createInsideTarget(mode, [number]))
  }

  function chooseMode(nextMode: InsideBetKind, label: string) {
    setMode(nextMode)
    setPendingSplit([])
    setMessage(nextMode === 'split' ? 'PICK TWO ADJACENT POCKETS' : `${label.toUpperCase()} BET SELECTED`)
  }

  function removeBet(targetId: string) {
    const removed = bets.find((bet) => bet.target.id === targetId)
    if (!removed || isSpinning) return
    setBalance((current) => current + removed.stake)
    setBets((current) => current.filter((bet) => bet.target.id !== targetId))
    setMessage(`${removed.target.label.toUpperCase()} REMOVED`)
  }

  function clearBets() {
    if (isSpinning || bets.length === 0) return
    setBalance((current) => current + totalStake)
    setBets([])
    setPendingSplit([])
    setMessage('BETS CLEARED. CHIPS RETURNED')
  }

  function spin() {
    if (isSpinning || bets.length === 0) return
    setIsSpinning(true)
    setMessage('THE WHEEL IS SPINNING')
    const result = randomPocket()

    spinTimer.current = window.setTimeout(() => {
      const returned = calculateReturns(result, bets)
      setBalance((current) => current + returned)
      setLastSpin({ number: result, change: returned - totalStake })
      setBets([])
      setPendingSplit([])
      setIsSpinning(false)
      setMessage(returned > 0 ? `NICE HIT. ${formatChips(returned)} CHIPS RETURNED` : 'NO WIN THIS ROUND. PLACE NEW BETS')
      spinTimer.current = undefined
    }, 1050)
  }

  function toggleMute() {
    setMuted(!muted)
    setMutedState(!muted)
  }

  function resetSession() {
    if (spinTimer.current !== undefined) window.clearTimeout(spinTimer.current)
    spinTimer.current = undefined
    setBalance(STARTING_BANKROLL)
    setBets([])
    setPendingSplit([])
    setLastSpin(undefined)
    setIsSpinning(false)
    setMessage('FRESH SESSION. GOOD LUCK')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#game" aria-label="Fliporama Roulette home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span className="brand-name">FLIPORAMA</span>
        </a>
        <div className="session-status">
          <span className="status-lamp" />
          <span>FREE PLAY</span>
          <span className="status-divider">/</span>
          <span>LOCAL SESSION</span>
          <button className="icon-action" type="button" title={muted ? 'Unmute sound' : 'Mute sound'} aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={muted} onClick={toggleMute}>
            {muted ? <VolumeX size={15} aria-hidden="true" /> : <Volume2 size={15} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="game">
        <section className="game-heading" aria-labelledby="game-title">
          <div>
            <p className="eyebrow">ARCADE TABLE 01 <span>/</span> EUROPEAN WHEEL</p>
            <h1 id="game-title">ROULETTE</h1>
          </div>
          <div className="heading-stamp" aria-label="37 pockets, virtual chips only">
            <span>37</span>
            <small>POCKETS</small>
          </div>
        </section>

        <div className="game-layout">
          <section className="table-section" aria-label="Roulette betting table">
            <div className="section-heading">
              <h2>PLACE YOUR BETS</h2>
              <span>0-36 <i /> SINGLE ZERO</span>
            </div>

            <div className="table-frame">
              <div className="bet-mode-bar">
                <span className="control-label">INSIDE BET</span>
                <div className="mode-switch" role="group" aria-label="Inside bet type">
                  {INSIDE_MODES.map((item) => (
                    <button
                      className={mode === item.kind ? 'mode-button is-active' : 'mode-button'}
                      type="button"
                      aria-pressed={mode === item.kind}
                      key={item.kind}
                      disabled={isSpinning}
                      onClick={() => chooseMode(item.kind, item.label)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <RouletteTable
                mode={mode}
                numberStakes={numberStakes}
                stakes={betStakeById}
                selectedNumbers={pendingSplit}
                winner={lastSpin?.number}
                disabled={isSpinning}
                onPocketClick={placeInsideBet}
                onBet={placeBet}
              />
            </div>
            <div className="table-note" aria-live="polite">
              <span className="note-marker" />
              <span>{message}</span>
            </div>
          </section>

          <aside className="console" aria-label="Game controls">
            <section className="bankroll-panel" aria-label="Chip balance">
              <div className="panel-kicker"><span>YOUR BANK</span><span>CHIPS</span></div>
              <div className="bankroll-value" aria-live="polite">{formatChips(balance)}</div>
              <div className="bankroll-footer">
                <span>ON TABLE <b>{formatChips(totalStake)}</b></span>
                <button className="icon-action" type="button" title="Start a new chip session" aria-label="Start a new chip session" onClick={resetSession}>
                  <RotateCcw size={15} aria-hidden="true" />
                </button>
              </div>
            </section>

            <section className="chip-section" aria-labelledby="chip-title">
              <div className="section-heading compact">
                <h2 id="chip-title">CHOOSE CHIP</h2>
                <span>{chipValue} PER CLICK</span>
              </div>
              <div className="chip-picker" role="group" aria-label="Chip denomination">
                {CHIP_VALUES.map((value, index) => (
                  <button
                    type="button"
                    className={`chip-choice chip-tone-${index}${chipValue === value ? ' is-selected' : ''}`}
                    aria-label={`${value} chips`}
                    aria-pressed={chipValue === value}
                    key={value}
                    disabled={isSpinning}
                    onClick={() => setChipValue(value)}
                  >
                    <span className="chip-token">{value}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bets-section" aria-labelledby="bets-title">
              <div className="section-heading compact">
                <h2 id="bets-title">BET SLIP</h2>
                <button className="icon-action" type="button" title="Clear all bets and return chips" aria-label="Clear all bets and return chips" disabled={isSpinning || bets.length === 0} onClick={clearBets}>
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
              {bets.length === 0 ? (
                <p className="empty-slip">NO BETS PLACED</p>
              ) : (
                <ul className="bet-list">
                  {bets.map(({ target, stake }) => (
                    <li className="bet-line" key={target.id}>
                      <span className="bet-line-label">{target.label}</span>
                      <span className="bet-line-stake">{formatChips(stake)}</span>
                      <button
                        className="remove-bet"
                        type="button"
                        title={`Remove ${target.label} bet`}
                        aria-label={`Remove ${target.label} bet`}
                        disabled={isSpinning}
                        onClick={() => removeBet(target.id)}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="slip-total"><span>TOTAL STAKE</span><b>{formatChips(totalStake)}</b></div>
            </section>

            <button className={`spin-button${isSpinning ? ' is-spinning' : ''}`} type="button" disabled={isSpinning || bets.length === 0} onClick={spin}>
              <Play size={17} fill="currentColor" aria-hidden="true" />
              <span>{isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL'}</span>
            </button>

            <section className="result-panel" aria-live="polite" aria-label="Last spin result">
              <span className="control-label">LAST SPIN</span>
              {lastSpin ? (
                <div className="result-content">
                  <span className={`result-number pocket-${getPocketColor(lastSpin.number)}`}>{lastSpin.number}</span>
                  <div>
                    <strong>{getPocketColor(lastSpin.number).toUpperCase()}</strong>
                    <span className={lastSpin.change >= 0 ? 'result-change is-positive' : 'result-change'}>
                      {lastSpin.change >= 0 ? '+' : ''}{formatChips(lastSpin.change)} CHIPS
                    </span>
                  </div>
                </div>
              ) : (
                <p className="result-placeholder">WAITING FOR THE FIRST SPIN</p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <span>FLIPORAMA <i /> FREE-PLAY TABLE</span>
        <span>NO CASH VALUE <i /> CHIPS RESET EACH SESSION</span>
      </footer>
    </div>
  )
}

export default App

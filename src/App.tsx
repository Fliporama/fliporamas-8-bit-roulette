import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Play, RotateCcw, Trash2, Volume2, VolumeX, X } from 'lucide-react'
import CountUp from './components/CountUp'
import RouletteTable from './components/RouletteTable'
import RouletteWheel from './components/RouletteWheel'
import WinTally from './components/WinTally'
import {
  createInsideTarget,
  formatChips,
  getPocketColor,
  randomPocket,
} from './lib/roulette'
import type { BetTarget, InsideBetKind } from './lib/roulette'
import { CHIP_VALUES } from './lib/chips'
import type { ChipValue, PlacedBet } from './lib/chips'
import { isMuted, setMuted } from './lib/sound'
import { buildTally } from './lib/tally'
import type { Tally, TallyStep } from './lib/tally'

const STARTING_BANKROLL = 1000
const INSIDE_MODES: { kind: InsideBetKind; label: string }[] = [
  { kind: 'straight', label: 'Straight' },
  { kind: 'split', label: 'Split' },
  { kind: 'street', label: 'Street' },
  { kind: 'sixLine', label: 'Six-line' },
]

type Phase = 'betting' | 'spinning' | 'tallying'

function App() {
  const [balance, setBalance] = useState(STARTING_BANKROLL)
  const [chipValue, setChipValue] = useState<ChipValue>(5)
  const [mode, setMode] = useState<InsideBetKind>('straight')
  const [bets, setBets] = useState<PlacedBet[]>([])
  const [pendingSplit, setPendingSplit] = useState<number[]>([])
  const [lastSpin, setLastSpin] = useState<{ number: number; returned: number; change: number } | undefined>()
  const [phase, setPhase] = useState<Phase>('betting')
  const [round, setRound] = useState<{ id: number; result: number; tally: Tally; staked: number } | undefined>()
  const [scoring, setScoring] = useState<TallyStep | undefined>()
  const [message, setMessage] = useState('PICK A CHIP, THEN PLACE YOUR BET')
  const [muted, setMutedState] = useState(isMuted)

  const roundCount = useRef(0)
  const chipCount = useRef(0)
  const isLocked = phase !== 'betting'
  // The balance is settled the moment spin is pressed; the display holds the win back until the round ends.
  const shownBalance = balance - (round?.tally.returned ?? 0)
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

  function placeBet(target: BetTarget | undefined) {
    if (!target || isLocked) return
    if (balance < chipValue) {
      setMessage('NOT ENOUGH CHIPS FOR THAT BET')
      return
    }

    chipCount.current += 1
    const chip = { id: chipCount.current, value: chipValue }
    setBalance((current) => current - chipValue)
    setBets((current) => {
      const existing = current.find((bet) => bet.target.id === target.id)
      if (!existing) return [...current, { target, stake: chipValue, chips: [chip] }]
      return current.map((bet) =>
        bet.target.id === target.id
          ? { ...bet, stake: bet.stake + chipValue, chips: [...bet.chips, chip] }
          : bet,
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
    if (!removed || isLocked) return
    setBalance((current) => current + removed.stake)
    setBets((current) => current.filter((bet) => bet.target.id !== targetId))
    setMessage(`${removed.target.label.toUpperCase()} REMOVED`)
  }

  function clearBets() {
    if (isLocked || bets.length === 0) return
    setBalance((current) => current + totalStake)
    setBets([])
    setPendingSplit([])
    setMessage('BETS CLEARED. CHIPS RETURNED')
  }

  function spin() {
    if (isLocked || bets.length === 0) return
    const result = randomPocket()
    const tally = buildTally(result, bets)
    setBalance((current) => current + tally.returned)
    roundCount.current += 1
    setRound({ id: roundCount.current, result, tally, staked: totalStake })
    setPhase('spinning')
    setMessage('THE WHEEL IS SPINNING')
  }

  function startTally() {
    if (!round) return
    setPhase('tallying')
    setMessage(`${round.result} ${getPocketColor(round.result).toUpperCase()}`)
  }

  function finishRound() {
    if (!round) return
    const { returned } = round.tally
    setLastSpin({ number: round.result, returned, change: returned - round.staked })
    setScoring(undefined)
    setBets([])
    setPendingSplit([])
    setRound(undefined)
    setPhase('betting')
    setMessage(returned > 0 ? `NICE HIT. ${formatChips(returned)} CHIPS RETURNED` : 'NO WIN THIS ROUND. PLACE NEW BETS')
  }

  function toggleMute() {
    setMuted(!muted)
    setMutedState(!muted)
  }

  function resetSession() {
    setBalance(STARTING_BANKROLL)
    setBets([])
    setPendingSplit([])
    setLastSpin(undefined)
    setRound(undefined)
    setScoring(undefined)
    setPhase('betting')
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
                      disabled={isLocked}
                      onClick={() => chooseMode(item.kind, item.label)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <RouletteTable
                mode={mode}
                bets={bets}
                numberStakes={numberStakes}
                stakes={betStakeById}
                selectedNumbers={pendingSplit}
                winner={phase === 'tallying' && round ? round.result : lastSpin?.number}
                scoring={scoring}
                result={phase === 'tallying' ? round?.result : undefined}
                collecting={Boolean(lastSpin)}
                losing={phase === 'tallying' && round?.tally.tier === 'none'}
                disabled={isLocked}
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
              <div className="bankroll-value" aria-live="polite">
                <CountUp value={shownBalance} />
                {phase === 'betting' && lastSpin && lastSpin.returned > 0 && (
                  <motion.span className="bank-flash" layoutId="win-total" aria-hidden="true">
                    +{formatChips(lastSpin.returned)}
                  </motion.span>
                )}
              </div>
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
                    data-chip={value}
                    disabled={isLocked}
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
                <button className="icon-action" type="button" title="Clear all bets and return chips" aria-label="Clear all bets and return chips" disabled={isLocked || bets.length === 0} onClick={clearBets}>
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
                        disabled={isLocked}
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

            <button className={`spin-button${isLocked ? ' is-spinning' : ''}`} type="button" disabled={isLocked || bets.length === 0} onClick={spin}>
              <Play size={17} fill="currentColor" aria-hidden="true" />
              <span>{isLocked ? 'SPINNING...' : 'SPIN THE WHEEL'}</span>
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

      <AnimatePresence>
        {/* Keyed per round: a wheel still fading out must not be reused by the next spin. */}
        {phase === 'spinning' && round && <RouletteWheel key={round.id} result={round.result} onLanded={startTally} />}
      </AnimatePresence>
      {phase === 'tallying' && round && <WinTally tally={round.tally} onStep={setScoring} onDone={finishRound} />}

      <footer className="site-footer">
        <span>FLIPORAMA <i /> FREE-PLAY TABLE</span>
        <span>NO CASH VALUE <i /> CHIPS RESET EACH SESSION</span>
      </footer>
    </div>
  )
}

export default App

import { useEffect, useRef } from 'react'

const GUARD_MS = 300 // the press that skipped the boot must not also start the game

export default function Title({ onStart }: { onStart: () => void }) {
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  // A click on the card, or Enter or Space on the button, which arrives here as a click.
  function start() {
    if (performance.now() - shownAt.current >= GUARD_MS) onStart()
  }

  return (
    <div className="title-card" role="dialog" aria-modal="true" aria-label="Fliporama Roulette" onClick={start}>
      <p className="title-logo">ROULETTE</p>
      <button className="title-start" type="button" autoFocus>PRESS START</button>
      <p className="title-note">FREE PLAY / NO CASH VALUE</p>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { emit } from '../lib/particles'

const GUARD_MS = 300 // the press that skipped the boot must not also start the game
const DIP = 12 // px: four art pixels down before the card goes up
const LIFT_MS = 450

export default function Title({ onStart }: { onStart: () => void }) {
  const reduced = useReducedMotion()
  const shownAt = useRef(0)
  const started = useRef(false)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])

  // A click on the card, or Enter or Space on the button, which arrives here as a click.
  function start(event: React.MouseEvent<HTMLElement>) {
    if (started.current || performance.now() - shownAt.current < GUARD_MS) return
    started.current = true
    const box = event.currentTarget.querySelector('.title-start')?.getBoundingClientRect()
    if (box) emit('start', box.left + box.width / 2, box.top + box.height / 2)
    onStart()
  }

  return (
    <motion.div
      className="title-card"
      role="dialog"
      aria-modal="true"
      aria-label="Fliporama Roulette"
      onClick={start}
      exit={reduced ? undefined : { y: [0, DIP, -window.innerHeight], transition: { duration: LIFT_MS / 1000, times: [0, 0.25, 1] } }}
    >
      <p className="title-logo">ROULETTE</p>
      <button className="title-start" type="button" autoFocus>PRESS START</button>
      <p className="title-note">FREE PLAY / NO CASH VALUE</p>
    </motion.div>
  )
}

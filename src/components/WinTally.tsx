import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import CountUp from './CountUp'
import { emit } from '../lib/particles'
import { play } from '../lib/sound'
import { stepDuration } from '../lib/tally'
import type { Tally, TallyStep } from '../lib/tally'
import { useSkip } from '../lib/useSkip'

const LOSS_MS = 500
const END_HOLD_MS = 700

interface WinTallyProps {
  tally: Tally
  onStep: (step: TallyStep | undefined) => void
  onDone: () => void
}

export default function WinTally({ tally, onStep, onDone }: WinTallyProps) {
  const reducedMotion = useReducedMotion()
  const { steps, tier, returned } = tally
  const [total, setTotal] = useState(reducedMotion ? returned : 0)
  const [celebrating, setCelebrating] = useState(false)
  const banner = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onStep, onDone })
  useEffect(() => {
    callbacks.current = { onStep, onDone }
  })
  const finish = useRef(() => {})

  useEffect(() => {
    let done = false
    const timers: number[] = []
    const later = (run: () => void, ms: number) => timers.push(window.setTimeout(run, ms))
    const shell = document.getElementById('game')

    finish.current = () => {
      if (done) return
      done = true
      callbacks.current.onStep(undefined)
      callbacks.current.onDone()
    }

    if (tier === 'none') {
      play('loss')
      later(finish.current, LOSS_MS)
    } else {
      const stepMs = reducedMotion ? 0 : stepDuration(steps.length)
      if (!reducedMotion) {
        steps.forEach((step, index) =>
          later(() => {
            callbacks.current.onStep(step)
            play('tick', index)
            setTotal(step.runningTotal)
          }, index * stepMs),
        )
      }
      later(() => {
        callbacks.current.onStep(undefined)
        play(tier === 'small' ? 'win' : 'bigWin')
        if (tier !== 'small' && !reducedMotion) {
          shell?.classList.add(`shake-${tier}`)
          setCelebrating(true)
          // Chips go up from behind the banner; with effects off nobody is listening and nothing flies.
          const box = banner.current?.getBoundingClientRect()
          if (box) emit(tier === 'huge' ? 'jackpot' : 'win', box.left + box.width / 2, box.top + box.height / 2)
        }
        later(finish.current, END_HOLD_MS)
      }, steps.length * stepMs)
    }

    return () => {
      done = true
      timers.forEach((timer) => window.clearTimeout(timer))
      shell?.classList.remove('shake-big', 'shake-huge')
    }
  }, [steps, tier, reducedMotion])

  useSkip(() => finish.current())

  if (tier === 'none') return null

  return (
    <div className={celebrating ? 'tally-banner is-celebrating' : 'tally-banner'} ref={banner} aria-hidden="true">
      <span>WIN</span>
      <motion.b layoutId="win-total">
        +<CountUp value={total} />
      </motion.b>
      {celebrating && tier === 'huge' && <i className="gold-flash" />}
    </div>
  )
}

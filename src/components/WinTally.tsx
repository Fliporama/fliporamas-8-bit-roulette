import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import CountUp from './CountUp'
import { play } from '../lib/sound'
import { stepDuration } from '../lib/tally'
import type { Tally, TallyStep } from '../lib/tally'
import { useSkip } from '../lib/useSkip'

const LOSS_MS = 500
const END_HOLD_MS = 700
const BURST_MS = 700
const BURST_REACH = 260
const BURST_COUNT = { big: 14, huge: 32 }
const CHIP_COLORS = ['#d5544e', '#438fd0', '#5d9c6a', '#bd8c37', '#8d668f']

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
  const [sparks] = useState(() =>
    Array.from({ length: BURST_COUNT.huge }, (_, index) => ({
      x: (Math.random() - 0.5) * 2 * BURST_REACH,
      y: (Math.random() - 0.5) * 2 * BURST_REACH,
      color: CHIP_COLORS[index % CHIP_COLORS.length],
    })),
  )
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
    <div className="tally-banner" aria-hidden="true">
      <span>WIN</span>
      <motion.b layoutId="win-total">
        +<CountUp value={total} />
      </motion.b>
      {celebrating &&
        sparks.slice(0, BURST_COUNT[tier === 'huge' ? 'huge' : 'big']).map((spark, index) => (
          <motion.i
            className="spark"
            key={index}
            style={{ background: spark.color }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: spark.x, y: spark.y, opacity: 0 }}
            transition={{ duration: BURST_MS / 1000, ease: 'easeOut' }}
          />
        ))}
      {celebrating && tier === 'huge' && <i className="gold-flash" />}
    </div>
  )
}

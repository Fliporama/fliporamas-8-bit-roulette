import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react'
import { getPocketColor } from '../lib/roulette'
import { play } from '../lib/sound'
import { useSkip } from '../lib/useSkip'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from '../lib/wheel'

const SPIN_MS = 4500
const DROP_AT = 0.8 // fraction of the spin at which the ball has settled in its pocket
const HOLD_MS = 800
const CLICK_GAP_MS = 40

// Radii in SVG units; the wheel's viewBox is 200 wide.
const RIM = 96
const POCKET_OUTER = 92
const POCKET_INNER = 62
const NUMBER_AT = 80
const BALL_REST = 70
const HUB = 30
const FILL = { red: '#b9433e', black: '#192622', green: '#21865f' }

/** A point at `radius`, `degrees` clockwise from the top. */
function point(radius: number, degrees: number): string {
  const radians = (degrees * Math.PI) / 180
  return `${(radius * Math.sin(radians)).toFixed(2)} ${(-radius * Math.cos(radians)).toFixed(2)}`
}

const WEDGES = WHEEL_ORDER.map((number, index) => {
  const from = (index - 0.5) * POCKET_ARC
  const to = (index + 0.5) * POCKET_ARC
  return {
    number,
    angle: index * POCKET_ARC,
    path: `M ${point(POCKET_OUTER, from)} A ${POCKET_OUTER} ${POCKET_OUTER} 0 0 1 ${point(POCKET_OUTER, to)} L ${point(POCKET_INNER, to)} A ${POCKET_INNER} ${POCKET_INNER} 0 0 0 ${point(POCKET_INNER, from)} Z`,
  }
})

interface RouletteWheelProps {
  result: number
  onLanded: () => void
}

export default function RouletteWheel({ result, onLanded }: RouletteWheelProps) {
  const reducedMotion = useReducedMotion()
  const [landed, setLanded] = useState(Boolean(reducedMotion))
  const wheelTurn = useMotionValue(0)
  const armTurn = useMotionValue(0)
  const ballRadius = useMotionValue(RIM)
  const ballTop = useTransform(ballRadius, (radius) => `${(100 - radius) / 2}%`)
  const skipRoll = useRef(() => {})
  const lastClick = useRef({ pocket: 0, at: 0 })
  const done = useRef(false)

  const finish = useRef(() => {})
  useEffect(() => {
    finish.current = () => {
      if (done.current) return
      done.current = true
      onLanded()
    }
  })

  useEffect(() => {
    if (reducedMotion) return

    let cancelled = false
    const laps = 5 + Math.floor(Math.random() * 3)
    const settle = (SPIN_MS * DROP_AT) / 1000
    wheelTurn.set(0)
    armTurn.set(0)
    ballRadius.set(RIM)
    // The ball arm is a child of the wheel, so its angle is relative to the wheel:
    // it runs against the wheel, stops over the winning pocket, then rides round with it.
    const controls = [
      animate(wheelTurn, 540 + Math.random() * 360, { duration: SPIN_MS / 1000, ease: 'easeOut' }),
      animate(armTurn, pocketAngle(result) - 360 * laps, { duration: settle, ease: 'easeOut' }),
      animate(ballRadius, [RIM, RIM, 74, 80, BALL_REST, 73, BALL_REST], {
        duration: settle,
        times: [0, 0.69, 0.82, 0.88, 0.94, 0.97, 1],
        ease: 'linear',
      }),
    ]
    controls[0].then(() => {
      if (!cancelled) setLanded(true)
    })
    skipRoll.current = () => controls.forEach((control) => control.complete())

    return () => {
      cancelled = true
      controls.forEach((control) => control.stop())
    }
  }, [result, reducedMotion, wheelTurn, armTurn, ballRadius])

  useEffect(() => {
    if (!landed) return
    const hold = window.setTimeout(() => finish.current(), HOLD_MS)
    return () => window.clearTimeout(hold)
  }, [landed])

  useMotionValueEvent(armTurn, 'change', (angle) => {
    const pocket = Math.floor(angle / POCKET_ARC)
    const now = performance.now()
    if (pocket === lastClick.current.pocket || now - lastClick.current.at < CLICK_GAP_MS) return
    lastClick.current = { pocket, at: now }
    play('ballClick')
  })

  useSkip(() => (landed ? finish.current() : skipRoll.current()))

  return (
    <motion.div
      className="wheel-overlay"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="wheel-frame"
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        {!reducedMotion && (
          <motion.div className="wheel" style={{ rotate: wheelTurn }}>
            <svg viewBox="-100 -100 200 200">
              <circle r={RIM + 3} fill="#080e0d" />
              <circle r={RIM} fill="#3a2a1c" stroke="var(--gold)" strokeWidth="1.5" />
              <circle r={POCKET_INNER} fill="var(--felt-deep)" />
              {WEDGES.map(({ number, angle, path }) => (
                <g key={number}>
                  <path d={path} fill={FILL[getPocketColor(number)]} stroke="var(--gold)" strokeWidth="0.4" />
                  <text transform={`rotate(${angle}) translate(0 ${-NUMBER_AT})`}>{number}</text>
                </g>
              ))}
              <circle r={HUB} fill="var(--ink)" stroke="var(--gold)" strokeWidth="1.5" />
            </svg>
            <motion.div className="ball-arm" style={{ rotate: armTurn }}>
              <motion.i className="ball" style={{ top: ballTop }} />
            </motion.div>
          </motion.div>
        )}
        {landed && (
          <motion.span
            className={`wheel-result pocket-${getPocketColor(result)}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 14 }}
          >
            {result}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}

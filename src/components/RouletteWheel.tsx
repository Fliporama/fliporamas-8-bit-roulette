import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import type { Easing } from 'motion/react'
import { getPocketColor } from '../lib/roulette'
import { play } from '../lib/sound'
import { useSkip } from '../lib/useSkip'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from '../lib/wheel'

const SPIN_MS = 4500
const DROP_AT = 0.8 // fraction of the spin at which the ball has settled in its pocket
const HOLD_MS = 800
const CLICK_GAP_MS = 40

// Anticipation: the wheel winds back and the ball is drawn back before both are let go.
const WIND_UP = 0.08 // fraction of the spin
const WIND_BACK = 25 // degrees
const BALL_DRAW = 12 // degrees
// Follow through: the wheel runs past its stop and eases back; the ball rocks in its pocket.
const OVERSHOOT = 4 // degrees
const SETTLE_FROM = 0.92 // fraction of the spin at which the wheel starts easing back
const ROCK = { velocity: 80, stiffness: 520, damping: 18 }
const SPOKE_LAG = { stiffness: 40, damping: 9 } // the hub spokes trail the wheel and arrive late
const BUMP = 0.03 // how far each bounce jolts the wheel
const RUN: [number, number, number, number] = [0.25, 0, 0.1, 1] // quick away, long slow down
const BADGE_MS = 450

// Radii in SVG units; the wheel's viewBox is 200 wide.
const RIM = 96
const POCKET_OUTER = 92
const POCKET_INNER = 62
const NUMBER_AT = 80
const BALL_REST = 70
const HUB = 30
const SPOKE = 22
const FILL = { red: '#b9433e', black: '#192622', green: '#21865f' }

// The ball is a hard marble: it never deforms. It leaves the rim, takes two short, sharp
// bounces and comes to rest; each impact jolts the wheel instead.
const DROP = {
  times: [0, 0.69, 0.82, 0.88, 0.94, 0.97, 1],
  radius: [RIM, RIM, 73, 76.5, BALL_REST, 71.5, BALL_REST],
  ease: ['linear', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'] as Easing[],
  impact: [0, 0, 1, 0, 1, 0, 0.6],
}

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
  // Once landed: where the ball came to rest, as an offset from the centre of the frame.
  const [landed, setLanded] = useState(reducedMotion ? { x: 0, y: 0 } : undefined)
  const frame = useRef<HTMLDivElement>(null)
  const wheelTurn = useMotionValue(0)
  const armTurn = useMotionValue(0)
  const rock = useMotionValue(0)
  const ballRadius = useMotionValue(RIM)
  const impact = useMotionValue(0)
  const ballTop = useTransform(ballRadius, (radius) => `${(100 - radius) / 2}%`)
  const armAngle = useTransform(() => armTurn.get() + rock.get())
  const wheelBump = useTransform(impact, (amount) => 1 + amount * BUMP)
  const spokeTurn = useSpring(wheelTurn, SPOKE_LAG)
  const spokeLag = useTransform(() => spokeTurn.get() - wheelTurn.get())
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
    const spin = SPIN_MS / 1000
    const settle = spin * DROP_AT
    const stop = 540 + Math.random() * 360
    wheelTurn.set(0)
    armTurn.set(0)
    rock.set(0)
    ballRadius.set(RIM)
    impact.set(0)
    // The ball arm is a child of the wheel, so its angle is relative to the wheel:
    // it runs against the wheel, stops over the winning pocket, then rides round with it.
    const land = () => {
      if (cancelled) return
      const degrees = wheelTurn.get() + armTurn.get()
      const reach = ((frame.current?.offsetWidth ?? 0) * BALL_REST) / 200
      const radians = (degrees * Math.PI) / 180
      setLanded({ x: reach * Math.sin(radians), y: -reach * Math.cos(radians) })
    }
    const controls = [
      animate(wheelTurn, [0, -WIND_BACK, stop + OVERSHOOT, stop], {
        duration: spin,
        times: [0, WIND_UP, SETTLE_FROM, 1],
        ease: ['easeOut', RUN, 'easeInOut'],
        onComplete: land,
      }),
      animate(armTurn, [0, BALL_DRAW, pocketAngle(result) - 360 * laps], {
        duration: settle,
        // The wheel's wind-up, on the ball's shorter clock.
        times: [0, WIND_UP / DROP_AT, 1],
        ease: ['easeOut', RUN],
        onComplete: () => {
          if (!cancelled) animate(rock, 0, { type: 'spring', ...ROCK })
        },
      }),
      animate(ballRadius, DROP.radius, { duration: settle, times: DROP.times, ease: DROP.ease }),
      animate(impact, DROP.impact, {
        duration: settle,
        times: DROP.times,
        ease: 'linear',
        onComplete: () => {
          if (!cancelled) animate(impact, 0, { duration: 0.12 })
        },
      }),
    ]
    skipRoll.current = () => {
      controls.forEach((control) => control.complete())
      land()
    }

    return () => {
      cancelled = true
      controls.forEach((control) => control.stop())
      rock.stop()
      impact.stop()
    }
  }, [result, reducedMotion, wheelTurn, armTurn, rock, ballRadius, impact])

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
        ref={frame}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        {!reducedMotion && (
          <motion.div className={`wheel${landed ? ' is-landed' : ''}`} style={{ rotate: wheelTurn, scale: wheelBump }}>
            <svg viewBox="-100 -100 200 200">
              <circle r={RIM + 3} fill="#080e0d" />
              <circle r={RIM} fill="#3a2a1c" stroke="var(--gold)" strokeWidth="1.5" />
              <circle r={POCKET_INNER} fill="var(--felt-deep)" />
              {WEDGES.map(({ number, angle, path }) => (
                <g className={number === result ? 'wedge is-winner' : 'wedge'} key={number}>
                  <path d={path} fill={FILL[getPocketColor(number)]} stroke="var(--gold)" strokeWidth="0.4" />
                  <text transform={`rotate(${angle}) translate(0 ${-NUMBER_AT})`}>{number}</text>
                </g>
              ))}
              <circle r={HUB} fill="var(--ink)" stroke="var(--gold)" strokeWidth="1.5" />
              <motion.g className="spokes" style={{ rotate: spokeLag }}>
                <path d={`M 0 ${-SPOKE} V ${SPOKE} M ${-SPOKE} 0 H ${SPOKE}`} />
                <circle r="5" />
              </motion.g>
            </svg>
            <motion.div className="ball-arm" style={{ rotate: armAngle }}>
              <motion.i className="ball" style={{ top: ballTop }} />
            </motion.div>
          </motion.div>
        )}
        {landed && (
          <motion.span
            className={`wheel-result pocket-${getPocketColor(result)}`}
            initial={{ ...landed, scale: 0.15 }}
            animate={{ x: 0, y: 0, scale: 1 }}
            // Different easing on each axis carries the badge in along a curve.
            transition={{
              x: { duration: BADGE_MS / 1000, ease: 'easeOut' },
              y: { duration: BADGE_MS / 1000, ease: 'easeIn' },
              scale: { type: 'spring', stiffness: 400, damping: 14 },
            }}
          >
            {result}
          </motion.span>
        )}
      </motion.div>
    </motion.div>
  )
}

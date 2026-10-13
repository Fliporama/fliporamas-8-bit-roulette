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
import type { Easing, MotionStyle } from 'motion/react'
import { getPocketColor } from '../lib/roulette'
import { play } from '../lib/sound'
import { useSkip } from '../lib/useSkip'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from '../lib/wheel'
import { RADII } from '../lib/wheelPixels'
import WheelCanvas from './WheelCanvas'

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
const JOLT_ABOVE = 0.5 // how hard an impact must be to knock the wheel down one art pixel
const RUN: [number, number, number, number] = [0.25, 0, 0.1, 1] // quick away, long slow down
const BADGE_MS = 450
const NUMBERS_INSET = `${(100 - RADII.numbers) / 2}%` // from the wheel's edge to the middle of the number band, as a share of its width

// The ball is a hard marble: it never deforms. It leaves the rim, takes two short, sharp
// bounces and comes to rest; each impact jolts the wheel instead.
const DROP = {
  times: [0, 0.69, 0.82, 0.88, 0.94, 0.97, 1],
  radius: [RADII.rim, RADII.rim, 73, 76.5, RADII.ballRest, 71.5, RADII.ballRest],
  ease: ['linear', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'] as Easing[],
  impact: [0, 0, 1, 0, 1, 0, 0.6],
}

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
  const ballRadius = useMotionValue(RADII.rim)
  const impact = useMotionValue(0)
  // The ball arm turns with the wheel, so the ball's place on screen is the sum of the two.
  const ballAngle = useTransform(() => wheelTurn.get() + armTurn.get() + rock.get())
  // A hard wheel does not flex: an impact knocks it down a whole art pixel, or not at all.
  const jolt = useTransform(impact, (amount) => (amount > JOLT_ABOVE ? 'var(--px)' : '0px'))
  const spokeTurn = useSpring(wheelTurn, SPOKE_LAG)
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
    ballRadius.set(RADII.rim)
    impact.set(0)
    // The ball's angle is kept relative to the wheel: it runs against the wheel,
    // stops over the winning pocket, then rides round with it.
    const land = () => {
      if (cancelled) return
      const degrees = wheelTurn.get() + armTurn.get()
      const reach = ((frame.current?.offsetWidth ?? 0) * RADII.ballRest) / 200
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
          <motion.div className="wheel" style={{ y: jolt }}>
            <WheelCanvas
              turn={wheelTurn}
              hubTurn={spokeTurn}
              ballAngle={ballAngle}
              ballRadius={ballRadius}
              winner={landed ? result : undefined}
            />
            <motion.div className="wheel-numbers" style={{ rotate: wheelTurn, '--numbers-inset': NUMBERS_INSET } as MotionStyle}>
              {WHEEL_ORDER.map((number, index) => (
                <span key={number} style={{ rotate: `${index * POCKET_ARC}deg` }}>
                  {number}
                </span>
              ))}
            </motion.div>
          </motion.div>
        )}
        {landed && (
          <motion.span
            className={`wheel-result pocket pocket-${getPocketColor(result)}`}
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

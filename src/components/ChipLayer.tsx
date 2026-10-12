import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { TargetAndTransition, ValueTransition } from 'motion/react'
import { CHIP_VALUES, stackAnchor, tossDuration } from '../lib/chips'
import type { Chip, PlacedBet, Point } from '../lib/chips'
import { formatChips } from '../lib/roulette'
import type { BetTarget } from '../lib/roulette'
import { play } from '../lib/sound'
import type { TallyStep } from '../lib/tally'

const WIND_UP_MS = 90 // the picker chip crouches before the throw
const SETTLE_MS = 220 // squash and recover after landing
const LIFT = { min: 40, max: 120, perPixel: 0.15 } // height of the arc
const PICKER_SCALE = 1.7 // a chip leaves the picker at the picker's size...
const APEX_SCALE = 1.9 // ...swells towards the viewer at the top of the arc...
const SQUASH = { x: 1.35, y: 0.7 } // ...and flattens on impact
const HEAVY_SQUASH = { x: 1.5, y: 0.6 } // the top denomination lands harder
const STACK_RISE = 3
const STACK_CAP = 6
const OUTSIDE_INSET = 16 // outside bets stack at the right of their box, clear of the label
const STAGGER_MS = 30
const SWEEP_PX = 90

const INSIDE_KINDS = ['straight', 'split', 'street', 'sixLine']
const CROUCH = [
  { transform: 'none' },
  { transform: 'translateY(4px) scale(1.15, 0.8)' },
  { transform: 'translateY(-3px) scale(0.92, 1.1)' },
  { transform: 'none' },
]
const THUNK = [
  { transform: 'translateY(0)', filter: 'brightness(1)' },
  { transform: 'translateY(2px)', filter: 'brightness(1.6)' },
  { transform: 'translateY(0)', filter: 'brightness(1)' },
]
const COMPRESS = [
  { transform: 'none' },
  { transform: 'translateY(2px) scale(1.12, 0.8)' },
  { transform: 'none' },
]
const HOP = [
  { transform: 'none' },
  { transform: 'translateY(-12px) scale(0.9, 1.15)' },
  { transform: 'translateY(0) scale(1.15, 0.85)' },
  { transform: 'none' },
]

type Leaving = 'return' | 'sweep' | 'collect'

function tiles(table: HTMLElement, target: BetTarget): HTMLElement[] {
  const spots = INSIDE_KINDS.includes(target.kind) ? target.numbers.map((number) => `n${number}`) : [target.id]
  return spots.flatMap((spot) => table.querySelector<HTMLElement>(`[data-spot="${spot}"]`) ?? [])
}

function anchorOf(table: HTMLElement, target: BetTarget): Point | undefined {
  const found = tiles(table, target)
  if (found.length === 0) return undefined
  if (!INSIDE_KINDS.includes(target.kind)) {
    const [box] = found
    return { x: box.offsetLeft + box.offsetWidth - OUTSIDE_INSET, y: box.offsetTop + box.offsetHeight / 2 }
  }
  return stackAnchor(
    target.kind,
    found.map((tile) => ({ x: tile.offsetLeft + tile.offsetWidth / 2, y: tile.offsetTop + tile.offsetHeight / 2 })),
  )
}

/** The centre of an element elsewhere on the page, in the layer's own coordinates. */
function pointAt(layer: HTMLElement | null, selector: string): Point {
  const box = layer?.getBoundingClientRect()
  const rect = document.querySelector(selector)?.getBoundingClientRect()
  if (!box || !rect) return { x: 0, y: 0 }
  return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top }
}

const pickerChip = (value: number) => `[data-chip="${value}"] .chip-token`

interface ChipLayerProps {
  bets: readonly PlacedBet[]
  scoring: TallyStep | undefined
  /** The landed pocket while the round is being tallied: bets that missed it are swept away. */
  result: number | undefined
  /** True once a round has paid out, so the chips still on the table go to the bank. */
  collecting: boolean
}

export default function ChipLayer({ bets, scoring, result, collecting }: ChipLayerProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const layer = useRef<HTMLDivElement>(null)
  const [anchors, setAnchors] = useState<Record<string, Point | undefined>>({})
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const table = layer.current?.parentElement
    if (!table) return
    setAnchors(Object.fromEntries(bets.map((bet) => [bet.target.id, anchorOf(table, bet.target)])))
  }, [bets, width])

  useEffect(() => {
    const table = layer.current?.parentElement
    if (!table) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(table)
    return () => observer.disconnect()
  }, [])

  const leaving: Leaving = result !== undefined ? 'sweep' : collecting ? 'collect' : 'return'
  const shown = result === undefined ? bets : bets.filter((bet) => bet.target.numbers.includes(result))

  return (
    <div className="chip-layer" ref={layer} aria-hidden="true">
      <AnimatePresence custom={leaving}>
        {shown.flatMap((bet) => {
          const anchor = anchors[bet.target.id]
          if (!anchor) return []
          // ponytail: every chip stays mounted, buried ones included; render only the top few if stacks reach hundreds.
          return bet.chips.map((chip, index) => (
            <TossedChip
              key={chip.id}
              chip={chip}
              index={index}
              stack={bet.chips.length}
              anchor={anchor}
              target={bet.target}
              hopping={scoring?.target.id === bet.target.id}
              layer={layer}
              still={reducedMotion}
            />
          ))
        })}
      </AnimatePresence>
      {shown.map((bet) => {
        const anchor = anchors[bet.target.id]
        if (!anchor) return null
        const top = anchor.y - Math.min(bet.chips.length, STACK_CAP) * STACK_RISE
        const isScoring = scoring?.target.id === bet.target.id
        return (
          <span className="stack-label" key={bet.target.id} style={{ left: anchor.x, top }}>
            {bet.chips.length > 1 && <b>{formatChips(bet.stake)}</b>}
            {isScoring && (
              <em className="payout-pop">
                <span>
                  {formatChips(scoring.stake)} × {scoring.target.returnMultiplier}
                </span>
                <span>+{formatChips(scoring.payout)}</span>
              </em>
            )}
          </span>
        )
      })}
    </div>
  )
}

interface TossedChipProps {
  chip: Chip
  index: number
  stack: number
  anchor: Point
  target: BetTarget
  hopping: boolean
  layer: RefObject<HTMLDivElement | null>
  still: boolean
}

function TossedChip({ chip, index, stack, anchor, target, hopping, layer, still }: TossedChipProps) {
  const hop = useRef<HTMLSpanElement>(null)
  const rise = Math.min(index, STACK_CAP - 1) * STACK_RISE
  const [toss] = useState(() => {
    const from = pointAt(layer.current, pickerChip(chip.value))
    const x = from.x - anchor.x
    const y = from.y - anchor.y + rise
    const distance = Math.hypot(x, y)
    return {
      x,
      y,
      ms: tossDuration(distance),
      lift: Math.min(LIFT.max, LIFT.min + distance * LIFT.perPixel),
      spin: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 180),
      // Chips land a little off-centre and turned, so a stack looks tossed rather than placed.
      tilt: (Math.random() - 0.5) * 20,
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
    }
  })
  const landAt = WIND_UP_MS + toss.ms

  useEffect(() => {
    if (still) {
      play('chip')
      return
    }
    const table = layer.current?.parentElement
    document.querySelector(pickerChip(chip.value))?.animate(CROUCH, { duration: WIND_UP_MS * 2.5 })
    const thunks = table
      ? tiles(table, target).map((tile) => tile.animate(THUNK, { delay: landAt, duration: 180 }))
      : []
    const click = window.setTimeout(() => play('chip'), landAt)
    return () => {
      window.clearTimeout(click)
      thunks.forEach((thunk) => thunk.cancel())
    }
    // Nothing here changes after the throw, so this runs once.
  }, [chip.value, landAt, layer, still, target])

  // Follow through: when a new chip lands on top, the ones beneath give, top first.
  useEffect(() => {
    const depth = stack - 1 - index
    if (still || depth === 0) return
    hop.current?.animate(COMPRESS, { delay: landAt + depth * STAGGER_MS, duration: 200 })
  }, [stack, index, landAt, still])

  useEffect(() => {
    if (!hopping || still) return
    hop.current?.animate(HOP, { delay: Math.min(index, STACK_CAP) * STAGGER_MS, duration: 320, easing: 'ease-out' })
  }, [hopping, index, still])

  const delay = WIND_UP_MS / 1000
  const flight = toss.ms / 1000
  const duration = flight + SETTLE_MS / 1000
  const landed = flight / duration
  const impact = landed + (1 - landed) * 0.35
  const squash = chip.value === CHIP_VALUES.at(-1) ? HEAVY_SQUASH : SQUASH
  const pose: ValueTransition = { delay, duration, times: [0, landed / 2, landed, impact, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'backOut'] }

  const leave = (mode: Leaving): TargetAndTransition => {
    if (still) return { opacity: 0, transition: { duration: 0.01 } }
    if (mode === 'sweep') {
      // The rake comes in from the right: chips nearest it go first, after a small recoil.
      const across = anchor.x / (layer.current?.offsetWidth || 1)
      return {
        x: [0, 6, -SWEEP_PX],
        opacity: [1, 1, 0],
        transition: { duration: 0.3, times: [0, 0.25, 1], ease: 'easeIn', delay: (1 - across) * 0.18 },
      }
    }
    const to = pointAt(layer.current, mode === 'collect' ? '.bankroll-value' : pickerChip(chip.value))
    const x = to.x - anchor.x
    const y = to.y - anchor.y + rise
    const seconds = (tossDuration(Math.hypot(x, y)) * 0.8) / 1000
    const wait = (Math.min(stack - 1 - index, STACK_CAP) * STAGGER_MS) / 1000
    // Different easing on each axis bends the path; backIn pulls away first.
    return {
      x,
      y,
      opacity: [1, 1, 0],
      transition: {
        x: { duration: seconds, delay: wait, ease: 'backIn' },
        y: { duration: seconds, delay: wait, ease: 'easeIn' },
        opacity: { duration: seconds, delay: wait, times: [0, 0.8, 1] },
      },
    }
  }

  return (
    <motion.span
      className="chip-slot"
      style={{ left: anchor.x + toss.dx, top: anchor.y + toss.dy - rise }}
      initial={still ? false : { x: toss.x, y: toss.y }}
      animate={{ x: 0, y: 0 }}
      exit="leave"
      variants={{ leave }}
      transition={{ delay, duration: flight, ease: 'linear' }}
    >
      {!still && (
        <>
          <motion.i
            className="chip-shadow"
            initial={{ scale: PICKER_SCALE, opacity: 0.15 }}
            animate={{ scale: [PICKER_SCALE, APEX_SCALE + 0.3, 1], opacity: [0.15, 0.1, 0.45] }}
            transition={{ delay, duration: flight, times: [0, 0.5, 1] }}
          />
          <motion.i
            className="chip-puff"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 2], opacity: [0.7, 0] }}
            transition={{ delay: landAt / 1000, duration: 0.3, ease: 'easeOut' }}
          />
        </>
      )}
      <span className="chip-hop" ref={hop}>
        <motion.span
          className={`chip-body chip-tone-${CHIP_VALUES.indexOf(chip.value)}`}
          initial={still ? false : { y: 0, scaleX: PICKER_SCALE, scaleY: PICKER_SCALE, rotate: toss.spin }}
          animate={{
            y: [0, -toss.lift, 0, 0, 0],
            scaleX: [PICKER_SCALE, APEX_SCALE, 1, squash.x, 1],
            scaleY: [PICKER_SCALE, APEX_SCALE, 1.15, squash.y, 1],
            rotate: toss.tilt,
          }}
          transition={{ y: pose, scaleX: pose, scaleY: pose, rotate: { delay, duration: flight, ease: 'easeOut' } }}
        >
          <span className="chip-token">{chip.value}</span>
        </motion.span>
      </span>
    </motion.span>
  )
}

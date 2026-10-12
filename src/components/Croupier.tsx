import { useEffect, useState } from 'react'
import type { Look, Reaction } from '../lib/scene'
import { ARMS, BODY, EYES, EYES_AT, HEIGHT, WIDTH } from '../sprites/croupier'
import type { Arms } from '../sprites/croupier'
import Sprite from './Sprite'

const BLINK = { everyMin: 2500, everyMax: 6000, ms: 120 }
const GLANCE = { everyMin: 5000, everyMax: 11000, ms: 900 }
const TIE = { everyMin: 20000, everyMax: 40000, ms: 1100 }
const LOOK_HOLD_MS = 2500 // how long the eyes stay on a chip that has just landed
const LOOK_REACH = 2 // art pixels the eyes move to either side
const TAP_MS = 140 // each half of a tap on the rail
const SHRUG_MS = 900

const between = ({ everyMin, everyMax }: { everyMin: number; everyMax: number }) => everyMin + Math.random() * (everyMax - everyMin)

/** Runs `act` again and again at loose intervals, so idle life never looks looped. Returns a stop function. */
function nowAndThen(every: { everyMin: number; everyMax: number }, act: () => void): () => void {
  let timer = window.setTimeout(function tick() {
    act()
    timer = window.setTimeout(tick, between(every))
  }, between(every))
  return () => window.clearTimeout(timer)
}

interface FigureProps {
  arms: Arms
  gaze?: Look
  eyesShut?: boolean
}

/** The croupier in one pose: the layers, stacked. */
export function Figure({ arms, gaze = 0, eyesShut = false }: FigureProps) {
  return (
    <div className="croupier" style={{ width: `calc(var(--px) * ${WIDTH})`, height: `calc(var(--px) * ${HEIGHT})` }}>
      <div className="croupier-torso">
        <Sprite data={BODY} />
        {!eyesShut && (
          <Sprite
            data={EYES}
            style={{ left: `calc(var(--px) * ${EYES_AT.x + gaze * LOOK_REACH})`, top: `calc(var(--px) * ${EYES_AT.y})` }}
          />
        )}
      </div>
      <Sprite data={ARMS[arms]} />
    </div>
  )
}

interface CroupierProps {
  reaction: Reaction
  /** Where the last chip landed; `id` changes with every chip, so two in one place still draw the eye twice. */
  look: { at: Look; id: number }
  live: boolean
}

/** The dealer behind the rail: breathes, blinks and glances while idle, and reacts to the game. */
export default function Croupier({ reaction, look, live }: CroupierProps) {
  const [arms, setArms] = useState<Arms>('rest')
  const [gaze, setGaze] = useState<Look>(0)
  const [eyesShut, setEyesShut] = useState(false)

  // Hands: a gesture for each turn of the game, and now and then a tug at the bow tie.
  useEffect(() => {
    if (!live) return
    const timers: number[] = []
    const later = (run: () => void, ms: number) => timers.push(window.setTimeout(run, ms))
    let stopFidgeting = () => {}
    // Every pose is set from a timer, the first at once: the gesture starts on the next tick.
    if (reaction === 'noMoreBets') {
      later(() => setArms('raised'), 0)
    } else if (reaction === 'win') {
      later(() => setArms('tap'), 0)
      later(() => setArms('rest'), TAP_MS)
      later(() => setArms('tap'), TAP_MS * 2)
      later(() => setArms('rest'), TAP_MS * 3)
    } else if (reaction === 'loss') {
      later(() => setArms('shrug'), 0)
      later(() => setArms('rest'), SHRUG_MS)
    } else {
      later(() => setArms('rest'), 0)
      stopFidgeting = nowAndThen(TIE, () => {
        setArms('tie')
        later(() => setArms('rest'), TIE.ms)
      })
    }
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      stopFidgeting()
    }
  }, [reaction, live])

  // Eyes: to a chip as it lands, then back.
  useEffect(() => {
    if (!live || look.id === 0) return
    const turn = window.setTimeout(() => setGaze(look.at), 0)
    const back = window.setTimeout(() => setGaze(0), LOOK_HOLD_MS)
    return () => {
      window.clearTimeout(turn)
      window.clearTimeout(back)
    }
  }, [look, live])

  // Eyes: blinks, and idle glances to either side.
  useEffect(() => {
    if (!live) return
    const timers: number[] = []
    const later = (run: () => void, ms: number) => timers.push(window.setTimeout(run, ms))
    const stops = [
      nowAndThen(BLINK, () => {
        setEyesShut(true)
        later(() => setEyesShut(false), BLINK.ms)
      }),
      nowAndThen(GLANCE, () => {
        setGaze(Math.random() < 0.5 ? -1 : 1)
        later(() => setGaze(0), GLANCE.ms)
      }),
    ]
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      stops.forEach((stop) => stop())
    }
  }, [live])

  // Still: the idle pose, eyes forward and open.
  return live ? <Figure arms={arms} gaze={gaze} eyesShut={eyesShut} /> : <Figure arms="rest" />
}

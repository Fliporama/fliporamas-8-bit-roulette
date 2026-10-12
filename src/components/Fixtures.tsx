import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { clockHands, untilNextMinute } from '../lib/clock'
import type { SpriteData } from '../lib/sprite'
import { CLOCK, CLOCK_FACE, DOOR, DOOR_WINDOW, FAN, GRAMOPHONE, PATRONS, PENDULUM, RECORD, RECORD_AT, SHELF } from '../sprites/room'
import Sprite from './Sprite'

const GRAMOPHONE_AT = (SHELF.width - GRAMOPHONE.width) / 2 // centred on its shelf
const px = (artPixels: number) => `calc(var(--px) * ${artPixels})`

// Someone passing behind the frosted glass.
const PASS = { everyMin: 8000, everyMax: 20000, stepMs: 160, pauseMs: 1800, pauseOneIn: 3 }

/** A flip-book of sprites, cycled by CSS: see `.frames` in game.css. */
function Frames({ frames, className = '', style }: { frames: readonly SpriteData[]; className?: string; style?: CSSProperties }) {
  return (
    <span className={`frames ${className}`} style={style}>
      {frames.map((frame, index) => (
        <Sprite key={index} data={frame} style={{ '--frame': index } as CSSProperties} />
      ))}
    </span>
  )
}

/** The hands for the visitor's own time of day. */
function Clock({ at }: { at: Date }) {
  const hours = at.getHours()
  const minutes = at.getMinutes()
  // Redrawn only when the minute changes, not each time a silhouette takes a step.
  const hands = useMemo(() => clockHands(hours, minutes), [hours, minutes])
  return (
    <>
      <Sprite data={CLOCK} />
      <Sprite data={hands} style={{ top: px(CLOCK_FACE.y), left: px(CLOCK_FACE.x) }} />
      <Sprite className="clock-pendulum" data={PENDULUM} />
    </>
  )
}

/** The room's furniture: a door with frosted glass, a ceiling fan, a wall clock and a gramophone. */
export default function Fixtures({ live }: { live: boolean }) {
  const [now, setNow] = useState(() => new Date())
  const [passer, setPasser] = useState<{ who: number; x: number } | undefined>()

  useEffect(() => {
    if (!live) return
    // Read at once, since the time went stale while the room was still, then again as each minute turns.
    let timer = window.setTimeout(function tick() {
      setNow(new Date())
      timer = window.setTimeout(tick, untilNextMinute(new Date()))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [live])

  // Now and then a silhouette crosses behind the glass, one art pixel at a time; some stop a while.
  useEffect(() => {
    if (!live) return
    let timer = 0
    const wait = () => PASS.everyMin + Math.random() * (PASS.everyMax - PASS.everyMin)
    const start = () => {
      const who = Math.floor(Math.random() * PATRONS.length)
      const width = PATRONS[who].width
      const direction = Math.random() < 0.5 ? 1 : -1
      const from = direction > 0 ? -width : DOOR_WINDOW.width
      const to = direction > 0 ? DOOR_WINDOW.width : -width
      const middle = Math.round((DOOR_WINDOW.width - width) / 2)
      const lingers = Math.floor(Math.random() * PASS.pauseOneIn) === 0
      const step = (x: number) => {
        if (x === to) {
          setPasser(undefined)
          timer = window.setTimeout(start, wait())
          return
        }
        setPasser({ who, x })
        timer = window.setTimeout(() => step(x + direction), lingers && x === middle ? PASS.pauseMs : PASS.stepMs)
      }
      step(from)
    }
    timer = window.setTimeout(start, wait())
    return () => {
      window.clearTimeout(timer)
      // Nobody is left standing half-way across the glass for the next time the room comes to life.
      setPasser(undefined)
    }
  }, [live])

  return (
    <>
      <div className="fixture fixture-door">
        <div
          className="door-glass"
          style={{ top: px(DOOR_WINDOW.y), left: px(DOOR_WINDOW.x), width: px(DOOR_WINDOW.width), height: px(DOOR_WINDOW.height) }}
        >
          {live && passer && <Sprite data={PATRONS[passer.who]} style={{ left: px(passer.x) }} />}
        </div>
        <Sprite data={DOOR} />
      </div>
      <div className="fixture fixture-fan">
        <Frames frames={FAN} />
      </div>
      <div className="fixture fixture-clock">
        <Clock at={now} />
      </div>
      <div className="fixture fixture-gramophone">
        <Sprite data={GRAMOPHONE} style={{ left: px(GRAMOPHONE_AT) }} />
        <Frames
          frames={RECORD}
          className="gramophone-record"
          style={{ top: px(RECORD_AT.y), left: px(GRAMOPHONE_AT + RECORD_AT.x) }}
        />
        <Sprite className="gramophone-shelf" data={SHELF} />
      </div>
    </>
  )
}

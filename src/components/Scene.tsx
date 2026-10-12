import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Light, Look, Reaction } from '../lib/scene'
import { useLive } from '../lib/useLive'
import { LAMPS, WHEEL_STAND } from '../sprites/room'
import Croupier from './Croupier'
import Fixtures from './Fixtures'
import Smoke from './Smoke'
import Sprite from './Sprite'
import Wall from './Wall'
import WheelCanvas from './WheelCanvas'

const LAMP_AT = { x: 0.5, y: 0.27 } // the bulb, as fractions of the stage
const SKIRT = 0.7 // where the wall's panelling begins
const DRIFT = 2 // art pixels the room shifts as the pointer crosses the screen
const SCROLL = { share: 0.1, repeat: 48 } // the wall follows a tenth of the page's scroll, wrapped to its pattern

interface SceneProps {
  /** The room's light, in light steps: see useRoomLight. */
  light: number
  reaction: Reaction
  /** Where the last chip landed: see Croupier. */
  look: { at: Look; id: number }
  /** Whether room animation is switched on. */
  on: boolean
  /** The title sign's content. */
  children: ReactNode
}

/** The room above the table: wall, lamp and everything that lives there. */
export default function Scene({ light, reaction, look, on, children }: SceneProps) {
  const stage = useRef<HTMLDivElement>(null)
  const live = useLive(stage, on)
  const level: Light = light < 0 ? 'dim' : light >= 1 ? 'flare' : 'normal'

  // Parallax: the room behind the page drifts against the pointer and lags the scroll, in whole art pixels.
  useEffect(() => {
    const root = document.documentElement
    const set = (name: string, value: string) => root.style.setProperty(name, value)
    const rest = () => {
      set('--drift-x', '0')
      set('--drift-y', '0')
      set('--drift-near', '0')
      set('--scroll-y', '0px')
    }
    if (!live) return rest()
    const drift = (event: PointerEvent) => {
      const across = (0.5 - event.clientX / window.innerWidth) * 2 * DRIFT
      set('--drift-x', String(Math.round(across)))
      set('--drift-near', String(Math.round(across / 2))) // the furniture is nearer than the wall behind the page
      set('--drift-y', String(Math.round((0.5 - event.clientY / window.innerHeight) * 2 * DRIFT)))
    }
    const scroll = () => set('--scroll-y', `${-Math.round(((window.scrollY * SCROLL.share) % SCROLL.repeat) / 3) * 3}px`)
    window.addEventListener('pointermove', drift, { passive: true })
    window.addEventListener('scroll', scroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', drift)
      window.removeEventListener('scroll', scroll)
      rest()
    }
  }, [live])

  return (
    <section className={live ? 'scene' : 'scene is-still'} aria-labelledby="game-title">
      <div className="scene-sign">{children}</div>
      <div className="scene-stage" ref={stage} aria-hidden="true">
        <Wall lamp={LAMP_AT} shift={light} skirt={SKIRT} />
        <Fixtures live={live} />
        <div className="scene-wheel">
          <div className="scene-wheel-box">
            <WheelCanvas />
          </div>
          <Sprite data={WHEEL_STAND} />
        </div>
        {/* Behind the croupier: smoke across the face would hide the eyes, the one thing it shows. */}
        <Smoke live={live} />
        <div className="scene-croupier">
          <Croupier reaction={reaction} look={look} live={live} />
        </div>
        <div className="scene-lamp">
          <Sprite data={LAMPS[level]} />
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { LIGHT_SHIFT } from './scene'
import type { Light } from './scene'

const STEP_MS = 100 // a change of level lands in two hard steps this far apart
const FLICKER = { everyMin: 6000, everyMax: 14000, ms: 80, shift: -0.5 }

/**
 * The room's light as a shift in light steps, for the felt, the wall and the lamp to share.
 * Moves to a new level in hard steps, never a fade; flickers now and then at normal when `live`.
 */
export function useRoomLight(level: Light, live: boolean): number {
  const target = live ? LIGHT_SHIFT[level] : 0
  const [shift, setShift] = useState(target)
  const shown = useRef(target)

  useEffect(() => {
    const show = (value: number) => {
      shown.current = value
      setShift(value)
    }
    if (!live) {
      show(0)
      return
    }
    const timers: number[] = []
    const later = (run: () => void, ms: number) => timers.push(window.setTimeout(run, ms))
    if (shown.current !== target) {
      show((shown.current + target) / 2)
      later(() => show(target), STEP_MS)
    }
    if (level === 'normal') {
      const flicker = () => {
        // Not in a hidden tab: a flicker repaints the felt and the wall for nobody.
        if (!document.hidden) {
          show(FLICKER.shift)
          later(() => show(0), FLICKER.ms)
        }
        later(flicker, FLICKER.everyMin + Math.random() * (FLICKER.everyMax - FLICKER.everyMin))
      }
      later(flicker, FLICKER.everyMin + Math.random() * (FLICKER.everyMax - FLICKER.everyMin))
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [level, live, target])

  return shift
}

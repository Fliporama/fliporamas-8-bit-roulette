import { useEffect, useRef, useState } from 'react'
import { LIGHT_SHIFT, runLight } from './scene'
import type { Light } from './scene'

/**
 * The room's light as a shift in light steps, for the felt, the wall and the lamp to share.
 * Moves to a new level in hard steps, never a fade; flickers now and then at normal when `live`.
 */
export function useRoomLight(level: Light, live: boolean): number {
  const [shift, setShift] = useState(live ? LIGHT_SHIFT[level] : 0)
  const shown = useRef(shift)

  useEffect(() => {
    const show = (value: number) => {
      shown.current = value
      setShift(value)
    }
    if (!live) {
      show(0)
      return
    }
    return runLight(shown.current, level, show, () => document.hidden)
  }, [level, live])

  return shift
}

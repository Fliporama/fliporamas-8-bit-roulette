import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { formatChips } from '../lib/roulette'

const COUNT_MS = 600

/** A chip figure that counts up to each new value. Drops, and reduced motion, snap. */
export default function CountUp({ value }: { value: number }) {
  const reducedMotion = useReducedMotion()
  const current = useRef(value)
  const [shown, setShown] = useState(value)

  useEffect(() => {
    const rising = value > current.current && !reducedMotion
    const controls = animate(current.current, value, {
      duration: rising ? COUNT_MS / 1000 : 0,
      ease: 'easeOut',
      onUpdate: (latest) => {
        current.current = latest
        setShown(Math.round(latest))
      },
    })
    return () => controls.stop()
  }, [value, reducedMotion])

  return (
    <>
      <span aria-hidden="true">{formatChips(shown)}</span>
      <span className="sr-only">{formatChips(value)}</span>
    </>
  )
}

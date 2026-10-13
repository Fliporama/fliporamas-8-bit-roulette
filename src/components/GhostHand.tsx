import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import Sprite from './Sprite'
import { HAND_REST_MS, HAND_STEPS } from '../lib/intro'
import { useLive } from '../lib/useLive'
import { HAND } from '../sprites/hand'

const TRAVEL_MS = 500
const ARC = 36 // px the path rises at its middle
const PRESS = 3 // px the hand drops on a tap
const TAP_MS = 140

/** Shows the game's loop without words: travels to a chip, a number and the spin button, tapping each. */
export default function GhostHand({ delayMs }: { delayMs: number }) {
  const layer = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const reduced = useReducedMotion()
  const live = useLive(layer, true)

  useEffect(() => {
    if (!live) return
    let stopped = false
    let tapped: Element | undefined
    const timers = new Set<number>()
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(resolve, ms)
        timers.add(timer)
      })
    const show = (visible: boolean) => {
      if (layer.current) layer.current.style.visibility = visible ? 'visible' : 'hidden'
    }

    async function run() {
      await wait(delayMs)
      while (!stopped) {
        let reached = false
        for (const step of HAND_STEPS) {
          if (stopped) return
          // Measured fresh each step, so the hand follows the layout through a resize.
          const target = document.querySelector(step.target)
          if (!target) continue
          const box = target.getBoundingClientRect()
          const tx = box.left + box.width / 2
          const ty = box.top + box.height / 2
          if (tx < 0 || ty < 0 || tx > innerWidth || ty > innerHeight) continue

          if (!reached) {
            x.set(tx)
            y.set(innerHeight)
            show(true)
          }
          reached = true
          if (reduced) {
            x.set(tx)
            y.set(ty)
          } else {
            const travel = TRAVEL_MS / 1000
            const rise = Math.min(y.get(), ty) - ARC
            animate(x, tx, { duration: travel, ease: 'easeInOut' })
            await animate(y, [y.get(), rise, ty], { duration: travel, ease: 'easeInOut' })
            if (stopped) return
            animate(y, [ty, ty + PRESS, ty], { duration: TAP_MS / 1000 })
          }
          tapped = target
          target.setAttribute('data-tapped', '')
          await wait(step.ms)
          target.removeAttribute('data-tapped')
        }
        if (!reached) show(false)
        await wait(HAND_REST_MS)
      }
    }
    run()

    return () => {
      stopped = true
      timers.forEach(clearTimeout)
      tapped?.removeAttribute('data-tapped')
    }
  }, [live, reduced, delayMs, x, y])

  return (
    <div className="ghost-hand" ref={layer} aria-hidden="true">
      <motion.div style={{ x, y }}>
        <Sprite data={HAND} />
      </motion.div>
    </div>
  )
}

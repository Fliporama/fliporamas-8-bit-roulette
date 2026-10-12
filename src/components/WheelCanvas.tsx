import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { artPixel, paint, paletteOf } from '../lib/palette'
import { WHEEL_TOKENS, wheelPixel } from '../lib/wheelPixels'

const BLINK_MS = 250

interface WheelCanvasProps {
  turn?: MotionValue<number>
  hubTurn?: MotionValue<number>
  /** Degrees clockwise from the top of the screen. The ball is drawn only when both ball values are given. */
  ballAngle?: MotionValue<number>
  ballRadius?: MotionValue<number>
  /** Set once the ball has landed. */
  winner?: number
  className?: string
}

/** The roulette wheel, redrawn pixel by pixel as it turns, filling the smaller side of its parent. */
export default function WheelCanvas({ turn, hubTurn, ballAngle, ballRadius, winner, className = 'wheel-canvas' }: WheelCanvasProps) {
  const reducedMotion = useReducedMotion()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState(0)
  const [lit, setLit] = useState(true)

  useEffect(() => {
    const parent = canvas.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(() => {
      const side = Math.min(parent.clientWidth, parent.clientHeight)
      setSize(Math.floor(side / artPixel(parent) / 2) * 2)
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (winner === undefined || reducedMotion) return
    const blink = window.setInterval(() => setLit((current) => !current), BLINK_MS)
    return () => window.clearInterval(blink)
  }, [winner, reducedMotion])

  useEffect(() => {
    const target = canvas.current
    if (!target || size === 0) return
    const palette = paletteOf(target, WHEEL_TOKENS)
    let frame = 0
    const draw = () => {
      frame = 0
      const view = {
        size,
        turn: turn?.get() ?? 0,
        hubTurn: hubTurn?.get() ?? 0,
        ball: ballAngle && ballRadius ? { angle: ballAngle.get(), radius: ballRadius.get() } : undefined,
        landed: winner === undefined ? undefined : { winner, lit },
      }
      paint(target, size, size, (x, y) => {
        const token = wheelPixel(x, y, view)
        return token ? palette[token] : undefined
      })
    }
    // However many values change in a frame, the wheel is drawn once.
    const schedule = () => {
      frame ||= requestAnimationFrame(draw)
    }
    draw()
    const stops = [turn, hubTurn, ballAngle, ballRadius].map((value) => value?.on('change', schedule))
    return () => {
      cancelAnimationFrame(frame)
      stops.forEach((stop) => stop?.())
    }
  }, [size, turn, hubTurn, ballAngle, ballRadius, winner, lit])

  return (
    <canvas
      className={className}
      ref={canvas}
      aria-hidden="true"
      style={{ width: `calc(var(--px) * ${size})`, height: `calc(var(--px) * ${size})` }}
    />
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { cancelFrame, frame, useReducedMotion } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { artPixel, paletteOf } from '../lib/palette'
import { WHEEL_TOKENS, wheelPainter } from '../lib/wheelPixels'

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

  const painter = useMemo(() => wheelPainter(size), [size])

  useEffect(() => {
    const target = canvas.current
    if (!target || size === 0) return
    target.width = target.height = size
    const context = target.getContext('2d')
    if (!context) return
    // One picture, rewritten in place every frame, a whole pixel at a time.
    // ponytail: packs red first, which is right on little-endian machines, as every browser's host is today.
    const image = context.createImageData(size, size)
    const pixels = new Uint32Array(image.data.buffer)
    const palette = paletteOf(target, WHEEL_TOKENS)
    const colours = Uint32Array.from([0, ...WHEEL_TOKENS.map((token) => (255 << 24) | (palette[token][2] << 16) | (palette[token][1] << 8) | palette[token][0])])
    const draw = () => {
      painter(
        {
          turn: turn?.get() ?? 0,
          hubTurn: hubTurn?.get() ?? 0,
          ball: ballAngle && ballRadius ? { angle: ballAngle.get(), radius: ballRadius.get() } : undefined,
          landed: winner === undefined ? undefined : { winner, lit },
        },
        colours,
        pixels,
      )
      context.putImageData(image, 0, 0)
    }
    // Drawn in motion's own render step, so the wheel and the numbers over it move in the same frame;
    // however many values change in a frame, it is drawn once.
    const schedule = () => frame.render(draw)
    draw()
    const stops = [turn, hubTurn, ballAngle, ballRadius].map((value) => value?.on('change', schedule))
    return () => {
      cancelFrame(draw)
      stops.forEach((stop) => stop?.())
    }
  }, [painter, size, turn, hubTurn, ballAngle, ballRadius, winner, lit])

  return (
    <canvas
      className={className}
      ref={canvas}
      aria-hidden="true"
      style={{ width: `calc(var(--px) * ${size})`, height: `calc(var(--px) * ${size})` }}
    />
  )
}

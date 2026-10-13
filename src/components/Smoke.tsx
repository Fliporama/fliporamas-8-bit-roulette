import { useEffect, useRef, useState } from 'react'
import { artPixel, paint, paletteOf } from '../lib/palette'
import { smokeToken } from '../lib/smoke'

const FRAME_MS = 100 // ten frames a second: cheap, and the stutter suits the pixels

/** Smoke drifting through the room, filling the nearest positioned ancestor. Clear air when not `live`. */
export default function Smoke({ live }: { live: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ cols: 0, rows: 0 })

  useEffect(() => {
    const target = box.current
    if (!target) return
    const observer = new ResizeObserver(() => {
      const px = artPixel(target)
      setSize({ cols: Math.ceil(target.clientWidth / px), rows: Math.ceil(target.clientHeight / px) })
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const target = canvas.current
    if (!target) return
    if (!live) {
      paint(target, size.cols, size.rows, () => undefined)
      return
    }
    const palette = paletteOf(target, ['smoke-0', 'smoke-1'])
    const began = performance.now()
    let image: ImageData | undefined
    const draw = () => {
      const seconds = (performance.now() - began) / 1000
      image = paint(
        target,
        size.cols,
        size.rows,
        (x, y) => {
          const token = smokeToken(x, y, seconds, size.cols, size.rows)
          return token ? palette[token] : undefined
        },
        image,
      )
    }
    draw()
    const timer = window.setInterval(draw, FRAME_MS)
    return () => window.clearInterval(timer)
  }, [size, live])

  return (
    <div className="smoke" ref={box} aria-hidden="true">
      <canvas ref={canvas} style={{ width: `calc(var(--px) * ${size.cols})`, height: `calc(var(--px) * ${size.rows})` }} />
    </div>
  )
}

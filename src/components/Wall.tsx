import { useEffect, useRef, useState } from 'react'
import { artPixel, paint, paletteOf } from '../lib/palette'
import { WALL_TOKENS, wallPixel } from '../lib/wall'

interface WallProps {
  /** Where the lamp's bulb is, as fractions of the wall. Absent: an unlit wall. */
  lamp?: { x: number; y: number }
  /** Light steps added to the lamp's pool. */
  shift?: number
  /** Where the wood panelling begins, as a fraction of the wall's height. Absent: wallpaper throughout. */
  skirt?: number
}

/** The room's back wall, filling the nearest positioned ancestor, one canvas pixel per art pixel. */
export default function Wall({ lamp, shift = 0, skirt }: WallProps) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ cols: 0, rows: 0 })
  const lampX = lamp?.x
  const lampY = lamp?.y

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
    if (!canvas.current) return
    const palette = paletteOf(canvas.current, WALL_TOKENS)
    const view = {
      ...size,
      shift,
      lamp: lampX === undefined || lampY === undefined ? undefined : { x: lampX * size.cols, y: lampY * size.rows },
      skirt: skirt === undefined ? undefined : Math.round(skirt * size.rows),
    }
    paint(canvas.current, size.cols, size.rows, (x, y) => palette[wallPixel(x, y, view)])
  }, [size, shift, lampX, lampY, skirt])

  return (
    <div className="wall" ref={box} aria-hidden="true">
      <canvas ref={canvas} style={{ width: `calc(var(--px) * ${size.cols})`, height: `calc(var(--px) * ${size.rows})` }} />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { feltStep } from '../lib/felt'
import { artPixel, paint, paletteOf } from '../lib/palette'

const TOKENS = ['felt-0', 'felt-1', 'felt-2', 'felt-3']

/** Lamp-lit, worn felt filling the nearest positioned ancestor, one canvas pixel per art pixel. `light` dims or flares it. */
export default function Felt({ light = 0 }: { light?: number }) {
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
    if (!canvas.current) return
    const palette = paletteOf(canvas.current, TOKENS)
    paint(canvas.current, size.cols, size.rows, (x, y) => palette[TOKENS[feltStep(x, y, size.cols, size.rows, light)]])
  }, [size, light])

  return (
    <div className="felt" ref={box} aria-hidden="true">
      <canvas ref={canvas} style={{ width: `calc(var(--px) * ${size.cols})`, height: `calc(var(--px) * ${size.rows})` }} />
    </div>
  )
}

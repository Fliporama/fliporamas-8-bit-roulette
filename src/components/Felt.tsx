import { useEffect, useRef, useState } from 'react'
import { feltStep } from '../lib/felt'
import { artPixel, paint, paletteOf } from '../lib/palette'

const TOKENS = ['felt-0', 'felt-1', 'felt-2', 'felt-3']

/** Lamp-lit, worn felt filling its parent, one canvas pixel per art pixel. The parent must clip it. */
export default function Felt({ className = 'felt' }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ cols: 0, rows: 0 })

  useEffect(() => {
    const parent = canvas.current?.parentElement
    if (!parent) return
    const observer = new ResizeObserver(() => {
      const px = artPixel(parent)
      setSize({ cols: Math.ceil(parent.clientWidth / px), rows: Math.ceil(parent.clientHeight / px) })
    })
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canvas.current) return
    const palette = paletteOf(canvas.current, TOKENS)
    paint(canvas.current, size.cols, size.rows, (x, y) => palette[TOKENS[feltStep(x, y, size.cols, size.rows)]])
  }, [size])

  return (
    <canvas
      className={className}
      ref={canvas}
      aria-hidden="true"
      style={{ width: `calc(var(--px) * ${size.cols})`, height: `calc(var(--px) * ${size.rows})` }}
    />
  )
}

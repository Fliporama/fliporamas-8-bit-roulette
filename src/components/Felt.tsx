import { useEffect, useRef, useState } from 'react'
import { feltStep } from '../lib/felt'
import { artPixel, paint, paletteOf } from '../lib/palette'

const TOKENS = ['felt-0', 'felt-1', 'felt-2', 'felt-3']

/** Lamp-lit, worn felt filling the nearest positioned ancestor, one canvas pixel per art pixel. `light` dims or flares it. */
export default function Felt({ light = 0 }: { light?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ cols: 0, rows: 0 })
  // The felt at each light level it has been shown at, for this size: a flicker then costs one blit, not a repaint.
  const painted = useRef({ size, at: new Map<number, ImageData>() })

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
    if (painted.current.size !== size) painted.current = { size, at: new Map() }
    const kept = painted.current.at.get(light)
    if (kept) {
      target.getContext('2d')?.putImageData(kept, 0, 0)
      return
    }
    const palette = paletteOf(target, TOKENS)
    const image = paint(target, size.cols, size.rows, (x, y) => palette[TOKENS[feltStep(x, y, size.cols, size.rows, light)]])
    if (image) painted.current.at.set(light, image)
  }, [size, light])

  return (
    <div className="felt" ref={box} aria-hidden="true">
      <canvas ref={canvas} style={{ width: `calc(var(--px) * ${size.cols})`, height: `calc(var(--px) * ${size.rows})` }} />
    </div>
  )
}

import type { CSSProperties } from 'react'
import type { SpriteData } from '../lib/sprite'

interface SpriteProps {
  data: SpriteData
  /** Whole-number multiple of the site's art pixel. */
  scale?: number
  className?: string
  style?: CSSProperties
}

export default function Sprite({ data, scale = 1, className, style }: SpriteProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox={`0 0 ${data.width} ${data.height}`}
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        width: `calc(var(--px) * ${data.width * scale})`,
        height: `calc(var(--px) * ${data.height * scale})`,
        ...style,
      }}
    >
      {data.rects.map((rect) => (
        <rect key={`${rect.x},${rect.y}`} x={rect.x} y={rect.y} width={rect.width} height="1" fill={`var(--${rect.token})`} />
      ))}
    </svg>
  )
}

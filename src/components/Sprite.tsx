import { memo } from 'react'
import type { CSSProperties } from 'react'
import type { SpriteData } from '../lib/sprite'

interface SpriteProps {
  data: SpriteData
  /** Whole-number multiple of the site's art pixel. */
  scale?: number
  className?: string
  style?: CSSProperties
}

function sameStyle(before: CSSProperties = {}, after: CSSProperties = {}): boolean {
  const names = Object.keys(before) as (keyof CSSProperties)[]
  return names.length === Object.keys(after).length && names.every((name) => before[name] === after[name])
}

/**
 * Pixel art as crisp inline SVG. A sprite is hundreds of rectangles and its data never changes,
 * so it is drawn once and skipped whenever whatever holds it renders again.
 */
export default memo(
  function Sprite({ data, scale = 1, className, style }: SpriteProps) {
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
  },
  (before, after) =>
    before.data === after.data && before.scale === after.scale && before.className === after.className && sameStyle(before.style, after.style),
)

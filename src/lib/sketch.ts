import type { SpriteData, SpriteRect } from './sprite'

export interface Sketch {
  /** A filled rectangle. Later shapes paint over earlier ones; anything off the edge is ignored. */
  rect(x: number, y: number, width: number, height: number, token: string): Sketch
  /** A filled ellipse about a centre given in art pixels (4.5 is the middle of the fifth pixel). */
  ellipse(centreX: number, centreY: number, radiusX: number, radiusY: number, token: string): Sketch
  /** Cuts a rectangular hole. */
  clear(x: number, y: number, width: number, height: number): Sketch
  /** Fills every empty pixel that touches a drawn one along an edge. */
  outline(token: string): Sketch
  sprite(): SpriteData
}

/**
 * Draws a sprite from shapes instead of a character grid: for art too large to type out row by row.
 * Tokens name palette entries, as in `sprite()`.
 */
export function sketch(width: number, height: number): Sketch {
  const cells: (string | undefined)[] = Array.from({ length: width * height })
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height
  const fill = (x: number, y: number, boxWidth: number, boxHeight: number, token: string | undefined) => {
    for (let row = y; row < y + boxHeight; row++) {
      for (let column = x; column < x + boxWidth; column++) if (inside(column, row)) cells[row * width + column] = token
    }
  }

  const drawing: Sketch = {
    rect(x, y, boxWidth, boxHeight, token) {
      fill(x, y, boxWidth, boxHeight, token)
      return drawing
    },
    clear(x, y, boxWidth, boxHeight) {
      fill(x, y, boxWidth, boxHeight, undefined)
      return drawing
    },
    ellipse(centreX, centreY, radiusX, radiusY, token) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (((x + 0.5 - centreX) / radiusX) ** 2 + ((y + 0.5 - centreY) / radiusY) ** 2 <= 1) cells[y * width + x] = token
        }
      }
      return drawing
    },
    outline(token) {
      const drawn = cells.map((cell) => cell !== undefined)
      const at = (x: number, y: number) => inside(x, y) && drawn[y * width + x]
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!at(x, y) && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1))) cells[y * width + x] = token
        }
      }
      return drawing
    },
    sprite() {
      const rects: SpriteRect[] = []
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const token = cells[y * width + x]
          if (token === undefined) continue
          const last = rects.at(-1)
          if (last && last.y === y && last.token === token && last.x + last.width === x) last.width += 1
          else rects.push({ x, y, width: 1, token })
        }
      }
      return { width, height, rects }
    },
  }
  return drawing
}

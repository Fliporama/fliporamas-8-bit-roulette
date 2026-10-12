type Rgb = readonly [number, number, number]

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

/** The ordered-dither threshold at an art pixel, between 0 and 1. A blend above it takes the other colour. */
export function dither(x: number, y: number): number {
  return (BAYER[y & 3][x & 3] + 0.5) / 16
}

/** A fixed scramble of a pixel's position, so texture never moves between redraws. */
export function hash(x: number, y: number): number {
  let mixed = Math.imul(x, 73856093) ^ Math.imul(y, 19349663)
  mixed = Math.imul(mixed ^ (mixed >>> 13), 1274126177)
  return (mixed ^ (mixed >>> 16)) >>> 0
}

export function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)) as unknown as Rgb
}

/** The current value of each token on `element`, for painting a canvas. */
export function paletteOf(element: Element, tokens: readonly string[]): Record<string, Rgb> {
  const style = getComputedStyle(element)
  return Object.fromEntries(tokens.map((token) => [token, toRgb(style.getPropertyValue(`--${token}`).trim())]))
}

/** One art pixel in screen pixels, as the page currently has it. */
export function artPixel(element: Element): number {
  return parseFloat(getComputedStyle(element).getPropertyValue('--px')) || 1
}

/**
 * Fills a `cols` × `rows` canvas, one canvas pixel per art pixel. `colour` returns nothing for a clear pixel.
 * Returns what it painted, for a caller that wants to show the same picture again without working it out,
 * or to hand it back as `reuse` for the next frame instead of having a new one made.
 */
export function paint(
  canvas: HTMLCanvasElement,
  cols: number,
  rows: number,
  colour: (x: number, y: number) => Rgb | undefined,
  reuse?: ImageData,
): ImageData | undefined {
  if (cols <= 0 || rows <= 0) return
  if (canvas.width !== cols) canvas.width = cols
  if (canvas.height !== rows) canvas.height = rows
  const context = canvas.getContext('2d')
  if (!context) return
  const image = reuse?.width === cols && reuse.height === rows ? reuse : context.createImageData(cols, rows)
  // Written a byte at a time: this runs for every pixel of every frame, so nothing is allocated per pixel.
  const bytes = image.data
  let at = 0
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pixel = colour(x, y)
      if (pixel) {
        bytes[at] = pixel[0]
        bytes[at + 1] = pixel[1]
        bytes[at + 2] = pixel[2]
        bytes[at + 3] = 255
      } else {
        bytes[at + 3] = 0 // a reused picture may have had something here
      }
      at += 4
    }
  }
  context.putImageData(image, 0, 0)
  return image
}

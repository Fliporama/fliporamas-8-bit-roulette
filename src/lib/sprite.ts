export interface SpriteRect {
  x: number
  y: number
  width: number
  token: string
}

export interface SpriteData {
  width: number
  height: number
  rects: SpriteRect[]
}

const TRANSPARENT = '.'

/**
 * Pixel art written as rows of characters. `key` maps each character to a palette token;
 * a dot is always transparent. Horizontal runs of one colour become a single rectangle.
 */
export function sprite(rows: readonly string[], key: Readonly<Record<string, string>>): SpriteData {
  if (rows.length === 0) throw new Error('Sprite is empty')
  for (const character of Object.keys(key)) {
    if (character === TRANSPARENT) throw new Error('Sprite key cannot redefine ".": it is always transparent')
    if (character.length !== 1) throw new Error(`Sprite key "${character}" must be a single character`)
  }

  const width = rows[0].length
  const rects: SpriteRect[] = []
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`Sprite row ${y} is ${row.length} wide, expected ${width}`)
    let run: SpriteRect | undefined
    for (let x = 0; x < width; x++) {
      const character = row[x]
      if (character === TRANSPARENT) {
        run = undefined
        continue
      }
      const token = key[character]
      if (token === undefined) throw new Error(`Sprite row ${y} uses "${character}", which is not in the key`)
      if (run?.token === token) run.width += 1
      else rects.push((run = { x, y, width: 1, token }))
    }
  })
  return { width, height: rows.length, rects }
}

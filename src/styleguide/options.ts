export interface StyleguideOptions {
  palette: 'a' | 'b'
  px: 2 | 3 | 4
  type: 1 | 2 | 3
}

const PALETTES = ['a', 'b'] as const
const PIXELS = [2, 3, 4] as const
const TYPES = [1, 2, 3] as const

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.find((item) => item === value) ?? fallback
}

/** undefined unless the query string has a `styleguide` parameter. */
export function styleguideOptions(search: string): StyleguideOptions | undefined {
  const params = new URLSearchParams(search)
  if (!params.has('styleguide')) return undefined
  return {
    palette: pick(PALETTES, params.get('palette'), 'a'),
    px: pick(PIXELS, Number(params.get('px')), 3),
    type: pick(TYPES, Number(params.get('type')), 1),
  }
}

/** The query string that selects `options`, for links. */
export function styleguideHref({ palette, px, type }: StyleguideOptions): string {
  return `?styleguide&palette=${palette}&px=${px}&type=${type}`
}

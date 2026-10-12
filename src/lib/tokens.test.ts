/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const RAMPS = { ink: 3, felt: 4, wood: 3, brass: 4, oxblood: 3, smoke: 3, paper: 2, lamp: 2 }

// [text, background]: the only pairs the art bible permits for text.
const PAIRS = [
  ['paper-1', 'ink-0'], ['paper-1', 'ink-1'], ['paper-1', 'ink-2'],
  ['paper-1', 'felt-0'], ['paper-1', 'felt-1'], ['paper-1', 'felt-2'], ['paper-1', 'wood-0'],
  ['paper-1', 'oxblood-0'], ['paper-1', 'oxblood-1'],
  ['paper-0', 'ink-1'], ['smoke-1', 'ink-1'], ['smoke-2', 'ink-1'],
  ['brass-2', 'ink-0'], ['brass-2', 'ink-1'], ['brass-2', 'felt-0'], ['brass-3', 'felt-1'],
  ['ink-0', 'brass-2'], ['ink-0', 'brass-3'], ['ink-0', 'paper-1'], ['ink-0', 'lamp-0'],
]

/** The custom properties declared in the first block whose selector is `selector`. */
function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) return {}
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]))
}

function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((at) => {
    const channel = parseInt(hex.slice(at, at + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** WCAG 2 contrast ratio. */
function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

const css = readFileSync('src/tokens.css', 'utf8')
const PALETTES: Record<string, Record<string, string>> = {
  a: block(css, ':root'),
  b: { ...block(css, ':root'), ...block(css, "[data-palette='b']") },
}

describe.each(['a', 'b'])('palette %s', (name) => {
  const palette = PALETTES[name]
  const steps = Object.entries(RAMPS).map(([ramp, count]) =>
    Array.from({ length: count }, (_, step) => palette[`${ramp}-${step}`]),
  )

  it('defines every step of every ramp as a six-digit hex colour', () => {
    expect(steps.flat()).toHaveLength(24)
    for (const colour of steps.flat()) expect(colour).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('gets lighter with each step of a ramp', () => {
    for (const ramp of steps) {
      const lights = ramp.map(luminance)
      expect(lights).toEqual([...lights].sort((a, b) => a - b))
      expect(new Set(lights).size).toBe(lights.length)
    }
  })

  it.each(PAIRS)('%s on %s is readable', (text, background) => {
    expect(contrast(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
  })
})

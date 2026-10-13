/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

// The art bible: no colour is used that is not a token, and tokens.css is the only file that states one.
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|color)\(/

it('knows a colour when it sees one', () => {
  for (const colour of ['#fff', '#0a0f0e', 'rgb(0 0 0)', 'rgba(0, 0, 0, 0.5)', 'hsl(40 80% 50%)', 'hsla(40, 80%, 50%, 1)', 'oklch(70% 0.1 80)', 'oklab(70% 0 0)', 'color(display-p3 1 0 0)']) {
    expect(colour).toMatch(COLOUR)
  }
  for (const fine of ['color: var(--ink-0);', 'background-color: var(--felt-1)', 'calc(var(--px) * 3)', 'const colour = (x: number) => x']) {
    expect(fine).not.toMatch(COLOUR)
  }
})
const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter(
  (file) => /\.(css|tsx?)$/.test(file) && !file.endsWith('.test.ts') && file !== 'tokens.css',
)

it.each(files)('%s states no colour of its own', (file) => {
  const offenders = readFileSync(join('src', file), 'utf8')
    .split('\n')
    .filter((line) => COLOUR.test(line))
  expect(offenders).toEqual([])
})

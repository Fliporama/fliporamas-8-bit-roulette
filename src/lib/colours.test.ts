/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

// The art bible: no colour is used that is not a token, and tokens.css is the only file that states one.
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/
const files = readdirSync('src', { recursive: true, encoding: 'utf8' }).filter(
  (file) => /\.(css|tsx?)$/.test(file) && !file.endsWith('.test.ts') && file !== 'tokens.css',
)

it.each(files)('%s states no colour of its own', (file) => {
  const offenders = readFileSync(join('src', file), 'utf8')
    .split('\n')
    .filter((line) => COLOUR.test(line))
  expect(offenders).toEqual([])
})

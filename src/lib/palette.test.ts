import { expect, it } from 'vitest'
import { rgb } from './palette'

it('reads a six-digit hex colour', () => {
  expect(rgb('#0c3a2e')).toEqual([12, 58, 46])
})

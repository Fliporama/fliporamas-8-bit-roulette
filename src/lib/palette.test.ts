import { expect, it } from 'vitest'
import { toRgb } from './palette'

it('reads a six-digit hex colour', () => {
  expect(toRgb('#0c3a2e')).toEqual([12, 58, 46])
})

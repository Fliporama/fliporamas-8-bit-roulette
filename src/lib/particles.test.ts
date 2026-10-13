/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it, vi } from 'vitest'
import { burst, emit, onEmit, step } from './particles'
import type { Burst } from './particles'

const KINDS: Burst[] = ['land', 'win', 'jackpot']
/** A fixed run of numbers between 0 and 1, so a burst is the same every time. */
const seeded = () => {
  let seed = 7
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

it('starts every particle of a burst where it is set off, moving upward', () => {
  for (const kind of KINDS) {
    const particles = burst(kind, 40, 60, 1, seeded())
    expect(particles.length).toBeGreaterThan(0)
    for (const particle of particles) {
      expect([particle.x, particle.y]).toEqual([40, 60])
      expect(particle.vy).toBeLessThan(0)
      expect(particle.life).toBeGreaterThan(0)
    }
  }
})

it('is the same burst from the same numbers', () => {
  expect(burst('jackpot', 0, 0, 1, seeded())).toEqual(burst('jackpot', 0, 0, 1, seeded()))
})

it('thins a burst by its share, down to nothing', () => {
  for (const kind of KINDS) {
    const all = burst(kind, 0, 0, 1).length
    expect(burst(kind, 0, 0, 0.5).length).toBeLessThan(all)
    expect(burst(kind, 0, 0, 0.5).length).toBeGreaterThan(0)
    expect(burst(kind, 0, 0, 0)).toEqual([])
  }
})

it('throws chips only on a win, and more of them on a jackpot', () => {
  const chips = (kind: Burst) => burst(kind, 0, 0).filter((particle) => particle.chip !== undefined).length
  expect(chips('land')).toBe(0)
  expect(chips('win')).toBeGreaterThan(0)
  expect(chips('jackpot')).toBeGreaterThan(chips('win'))
})

it('a start burst is sparks only', () => {
  const sparks = burst('start', 0, 0)
  expect(sparks).toHaveLength(16)
  expect(sparks.every((spark) => spark.chip === undefined && spark.token.startsWith('lamp-'))).toBe(true)
})

it('sends particles up, then brings them down', () => {
  let [chip] = burst('win', 0, 0, 1, seeded()).filter((particle) => particle.chip !== undefined)
  const heights: number[] = []
  for (let frame = 0; frame < 60 && chip; frame++) {
    heights.push(chip.y)
    ;[chip] = step([chip], 1 / 60, 10_000)
  }
  const apex = Math.min(...heights)
  expect(apex).toBeLessThan(-20)
  expect(heights.indexOf(apex)).toBeGreaterThan(0)
  expect(heights.at(-1)).toBeGreaterThan(apex)
})

it('leaves nothing in the air for long', () => {
  for (const kind of KINDS) {
    let flying = burst(kind, 100, 100, 1, seeded())
    for (let frame = 0; frame < 60 * 3; frame++) flying = step(flying, 1 / 60, 300)
    expect(flying).toEqual([])
  }
})

it('drops a particle once it falls past the floor', () => {
  const [particle] = burst('win', 0, 0, 1, seeded())
  expect(step([{ ...particle, y: 299, vy: 200, life: 5 }], 0.1, 300)).toEqual([])
  expect(step([{ ...particle, y: 10, vy: 0, life: 5 }], 0.1, 300)).toHaveLength(1)
})

it('only uses tokens that exist', () => {
  const css = readFileSync('src/tokens.css', 'utf8')
  for (const kind of KINDS) for (const particle of burst(kind, 0, 0)) expect(css).toContain(`--${particle.token}:`)
})

it('tells whoever is listening about a burst, and nobody once they stop', () => {
  const heard = vi.fn()
  const stop = onEmit(heard)
  emit('land', 3, 4)
  expect(heard).toHaveBeenCalledWith('land', 3, 4)
  stop()
  emit('land', 5, 6)
  expect(heard).toHaveBeenCalledTimes(1)
  expect(() => emit('win', 0, 0)).not.toThrow()
})

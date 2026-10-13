import { afterEach, expect, it, vi } from 'vitest'
import { prefersReducedMotion, stored } from './stored'

afterEach(() => vi.unstubAllGlobals())

const blocked = () => {
  throw new Error('blocked')
}

it('remembers a value and forgets it', () => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  })
  const setting = stored('a-key')
  expect(setting.get()).toBeNull()
  setting.set('1')
  expect(setting.get()).toBe('1')
  setting.set(null)
  expect(setting.get()).toBeNull()
})

it('reads as null, and does not throw, when storage is blocked or missing', () => {
  const setting = stored('a-key')
  expect(setting.get()).toBeNull() // no localStorage at all
  vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
  expect(setting.get()).toBeNull()
  expect(() => setting.set('1')).not.toThrow()
  expect(() => setting.set(null)).not.toThrow()
})

it('asks the system about reduced motion, and assumes motion is welcome when it cannot', () => {
  expect(prefersReducedMotion()).toBe(false) // no matchMedia at all
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  expect(prefersReducedMotion()).toBe(true)
  vi.stubGlobal('matchMedia', blocked)
  expect(prefersReducedMotion()).toBe(false)
})

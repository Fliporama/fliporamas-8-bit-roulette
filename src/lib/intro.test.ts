import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HAND_STEPS,
  PREVIEW_EXAMPLE,
  firstStage,
  forgetIntro,
  introSeen,
  markIntroSeen,
  owesHand,
} from './intro'

afterEach(() => vi.unstubAllGlobals())

describe('firstStage', () => {
  it('boots on a first visit', () => expect(firstStage('', false, false)).toBe('boot'))
  it('opens on the title once seen', () => expect(firstStage('', true, false)).toBe('title'))
  it('never boots under reduced motion', () => expect(firstStage('', false, true)).toBe('title'))
  it('opens the game for ?play', () => {
    expect(firstStage('?play', false, false)).toBe('play')
    expect(firstStage('?x=1&play', true, true)).toBe('play')
  })
})

describe('owesHand', () => {
  it('is owed on a first visit, with or without motion', () => expect(owesHand('', false)).toBe(true))
  it('is not owed once seen or under ?play', () => {
    expect(owesHand('', true)).toBe(false)
    expect(owesHand('?play', false)).toBe(false)
  })
})

describe('the stored flag', () => {
  it('remembers and forgets', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    })
    markIntroSeen()
    expect(introSeen()).toBe(true)
    forgetIntro()
    expect(introSeen()).toBe(false)
  })
  it('reads as not seen, and does not throw, when storage is blocked', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked, removeItem: blocked })
    expect(introSeen()).toBe(false)
    expect(markIntroSeen).not.toThrow()
    expect(forgetIntro).not.toThrow()
  })
})

describe('the examples', () => {
  it('cover what each bet covers', () => {
    expect(PREVIEW_EXAMPLE.straight).toEqual([17])
    expect(PREVIEW_EXAMPLE.split).toEqual([17, 20])
    expect(PREVIEW_EXAMPLE.street).toEqual([16, 17, 18])
    expect(PREVIEW_EXAMPLE.sixLine).toEqual([13, 14, 15, 16, 17, 18])
  })
})

it('every hand step names a target and a wait', () => {
  for (const step of HAND_STEPS) {
    expect(step.target).not.toBe('')
    expect(step.ms).toBeGreaterThan(0)
  }
})

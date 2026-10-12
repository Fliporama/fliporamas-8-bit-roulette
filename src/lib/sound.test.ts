import { describe, expect, it } from 'vitest'
import { isMuted, play, setMuted, tickFrequency } from './sound'

describe('sound', () => {
  it('raises the tick one semitone per step and tops out an octave up', () => {
    expect(tickFrequency(0)).toBe(440)
    expect(tickFrequency(12)).toBeCloseTo(880)
    expect(tickFrequency(40)).toBeCloseTo(880)
    expect(tickFrequency(3)).toBeGreaterThan(tickFrequency(2))
  })

  it('works with no localStorage and no Web Audio', () => {
    expect(isMuted()).toBe(false)
    setMuted(true)
    expect(isMuted()).toBe(true)
    setMuted(false)
    expect(() => play('tick', 3)).not.toThrow()
    expect(() => play('bigWin')).not.toThrow()
  })
})

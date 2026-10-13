import { describe, expect, it } from 'vitest'
import { createInsideTarget, createOutsideTarget } from './roulette'
import { buildTally, stepDuration } from './tally'

const straight7 = createInsideTarget('straight', [7])!
const red = createOutsideTarget('red')
const black = createOutsideTarget('black')
const odd = createOutsideTarget('odd')
const column1 = createOutsideTarget('column', 1)

describe('buildTally', () => {
  it('scores winning bets smallest payout first with a running total', () => {
    const bets = [
      { target: straight7, stake: 5 },
      { target: red, stake: 10 },
      { target: black, stake: 10 },
      { target: column1, stake: 2 },
    ]
    const tally = buildTally(7, bets)
    expect(tally.steps.map((step) => step.target.id)).toEqual([column1.id, red.id, straight7.id])
    expect(tally.steps.map((step) => step.payout)).toEqual([6, 20, 180])
    expect(tally.steps.map((step) => step.runningTotal)).toEqual([6, 26, 206])
    expect(tally.returned).toBe(206)
    expect(tally.tier).toBe('big')
  })

  it('keeps placement order when payouts tie', () => {
    const tally = buildTally(7, [{ target: red, stake: 10 }, { target: odd, stake: 10 }])
    expect(tally.steps.map((step) => step.target.id)).toEqual([red.id, odd.id])
  })

  it('assigns tiers by chips returned over chips staked', () => {
    const tier = (bets: Parameters<typeof buildTally>[1]) => buildTally(7, bets).tier
    expect(tier([])).toBe('none')
    expect(tier([{ target: black, stake: 10 }])).toBe('none')
    expect(tier([{ target: red, stake: 10 }, { target: black, stake: 10 }])).toBe('small') // 1x
    expect(tier([{ target: red, stake: 10 }])).toBe('big') // exactly 2x
    expect(tier([{ target: straight7, stake: 5 }, { target: black, stake: 14 }])).toBe('big') // 9.47x
    expect(tier([{ target: straight7, stake: 5 }, { target: black, stake: 13 }])).toBe('huge') // exactly 10x
  })
})

describe('stepDuration', () => {
  it('is 500 ms up to five steps, then shares 2500 ms, never under 60 ms', () => {
    expect(stepDuration(1)).toBe(500)
    expect(stepDuration(5)).toBe(500)
    expect(stepDuration(10)).toBe(250)
    expect(stepDuration(50)).toBe(60)
  })
})

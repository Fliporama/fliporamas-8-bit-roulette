import type { BetPlacement, BetTarget } from './roulette'

type WinTier = 'none' | 'small' | 'big' | 'huge'

export interface TallyStep {
  target: BetTarget
  stake: number
  payout: number
  runningTotal: number
}

export interface Tally {
  steps: TallyStep[]
  returned: number
  tier: WinTier
}

export function buildTally(result: number, bets: readonly BetPlacement[]): Tally {
  let returned = 0
  const steps = bets
    .filter((bet) => bet.target.numbers.includes(result))
    .map((bet) => ({ ...bet, payout: bet.stake * bet.target.returnMultiplier }))
    .sort((left, right) => left.payout - right.payout)
    .map((bet) => ({ ...bet, runningTotal: (returned += bet.payout) }))

  const staked = bets.reduce((total, bet) => total + bet.stake, 0)
  const ratio = returned / staked
  const tier = returned === 0 ? 'none' : ratio < 2 ? 'small' : ratio < 10 ? 'big' : 'huge'
  return { steps, returned, tier }
}

/** Milliseconds per tally step: a long list of winners shares 2.5 seconds. */
export function stepDuration(stepCount: number): number {
  return Math.min(500, Math.max(60, 2500 / stepCount))
}

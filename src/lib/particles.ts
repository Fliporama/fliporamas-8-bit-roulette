import { CHIP_VALUES } from './chips'
import type { ChipValue } from './chips'

export type Burst = 'land' | 'win' | 'jackpot'

/** One thing in the air. Places are in art pixels and speeds in art pixels a second. */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  /** Seconds left. */
  life: number
  /** The palette token of a square speck `size` art pixels across... */
  token: string
  size: number
  /** ...unless it is drawn as this chip instead. */
  chip?: ChipValue
}

const GRAVITY = 420 // art pixels a second, every second: particles are hard things and fall like them

interface Part {
  count: number
  tokens: readonly string[]
  size: number
  /** The fastest sideways speed, either way. */
  across: number
  /** Slowest and fastest upward speed. */
  up: readonly [number, number]
  /** Shortest and longest life, in seconds. */
  life: readonly [number, number]
  chips?: boolean
}

const SPARKS = ['lamp-0', 'lamp-1']
const CONFETTI = ['paper-0', 'oxblood-1', 'smoke-1', 'felt-2', 'brass-2'] // the five chip faces

const BURSTS: Record<Burst, readonly Part[]> = {
  // A chip lands: dust kicked out along the felt, and a glint.
  land: [
    { count: 4, tokens: ['smoke-1', 'smoke-2'], size: 1, across: 45, up: [10, 40], life: [0.2, 0.35] },
    { count: 2, tokens: ['lamp-1'], size: 1, across: 60, up: [50, 100], life: [0.2, 0.3] },
  ],
  // A big win: chips thrown up from the banner, falling away off the screen.
  win: [
    { count: 14, tokens: ['brass-2'], size: 1, across: 150, up: [140, 260], life: [2.5, 2.5], chips: true },
    { count: 12, tokens: SPARKS, size: 1, across: 200, up: [80, 300], life: [0.4, 0.7] },
  ],
  // A huge win: more of everything, and confetti in the chips' colours.
  jackpot: [
    { count: 32, tokens: ['brass-2'], size: 1, across: 200, up: [160, 300], life: [2.5, 2.5], chips: true },
    { count: 24, tokens: SPARKS, size: 1, across: 240, up: [80, 320], life: [0.5, 0.9] },
    { count: 48, tokens: CONFETTI, size: 2, across: 240, up: [120, 340], life: [2.5, 2.5] },
  ],
}

/** The particles of one burst, all starting at one place. `share` thins it: 1 is all of them, 0 none. */
export function burst(kind: Burst, x: number, y: number, share = 1, random: () => number = Math.random): Particle[] {
  return BURSTS[kind].flatMap((part) =>
    Array.from({ length: Math.ceil(part.count * share) }, (_, index) => ({
      x,
      y,
      vx: (random() * 2 - 1) * part.across,
      vy: -(part.up[0] + random() * (part.up[1] - part.up[0])),
      life: part.life[0] + random() * (part.life[1] - part.life[0]),
      token: part.tokens[index % part.tokens.length],
      size: part.size,
      chip: part.chips ? CHIP_VALUES[index % CHIP_VALUES.length] : undefined,
    })),
  )
}

/** Moves every particle on by `seconds` and returns those still in the air above `floor`. */
export function step(particles: readonly Particle[], seconds: number, floor: number): Particle[] {
  const flying: Particle[] = []
  for (const particle of particles) {
    particle.life -= seconds
    particle.vy += GRAVITY * seconds
    particle.x += particle.vx * seconds
    particle.y += particle.vy * seconds
    if (particle.life > 0 && particle.y < floor) flying.push(particle)
  }
  return flying
}

type Listener = (kind: Burst, x: number, y: number) => void
const listeners = new Set<Listener>()

/** Sets off a burst at a place on screen, in CSS pixels. Nothing happens when no particle layer is listening. */
export function emit(kind: Burst, x: number, y: number): void {
  listeners.forEach((listener) => listener(kind, x, y))
}

/** Hears every burst set off. Returns a function that stops listening. */
export function onEmit(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

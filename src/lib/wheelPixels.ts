import { dither, hash } from './palette'
import { getPocketColor } from './roulette'
import { POCKET_ARC, WHEEL_ORDER } from './wheel'

/** Radii as a percentage of the wheel's half-width. */
export const RADII = {
  rim: 96,
  track: 88,
  pocketOuter: 85,
  well: 72,
  pocketInner: 60,
  turret: 30,
  spoke: 26,
  hub: 12,
  numbers: 78,
  ballRest: 70,
  ball: 3.5,
}

export interface WheelView {
  /** Width and height in art pixels. */
  size: number
  /** Degrees the wheel has turned, clockwise. */
  turn: number
  /** Degrees the spokes have turned, clockwise. */
  hubTurn: number
  /** `angle`: degrees clockwise from the top of the screen. `radius`: as RADII. */
  ball?: { angle: number; radius: number }
  /** Once the ball is down: the losers step back and the winner blinks. */
  landed?: { winner: number; lit: boolean }
}

const RAMPS = { ink: 3, felt: 4, wood: 3, brass: 4, oxblood: 3, paper: 2 }
const POCKET = { red: 'oxblood-1', black: 'ink-1', green: 'felt-2' }
const LIGHT = { edge: 0.35, band: 0.2 } // where a ring turns lit or shadowed, and the width of the dither there
const GRAIN = { arc: 12, oneIn: 5 } // degrees a streak of grain runs, and how common streaks are
const SPOKE_HALF = 1.5 // art pixels
const KNOB = 5
const BALL_MIN = 2 // art pixels

/** Every token `wheelPixel` can return. */
export const WHEEL_TOKENS: readonly string[] = Object.entries(RAMPS).flatMap(([ramp, steps]) =>
  Array.from({ length: steps }, (_, step) => `${ramp}-${step}`),
)

// One step up or down a token's own ramp, stopping at its ends.
const LIGHTER: Record<string, string> = {}
const DARKER: Record<string, string> = {}
for (const [ramp, steps] of Object.entries(RAMPS)) {
  for (let step = 0; step < steps; step++) {
    LIGHTER[`${ramp}-${step}`] = `${ramp}-${Math.min(steps - 1, step + 1)}`
    DARKER[`${ramp}-${step}`] = `${ramp}-${Math.max(0, step - 1)}`
  }
}

const RADIANS = Math.PI / 180
const wrap = (degrees: number) => ((degrees % 360) + 360) % 360

/**
 * The palette token at one art pixel, or undefined outside the wheel.
 * The wheel turns; the light does not: every ring is lighter towards the top of the screen.
 */
export function wheelPixel(x: number, y: number, view: WheelView): string | undefined {
  const half = view.size / 2
  const dx = x + 0.5 - half
  const dy = y + 0.5 - half
  const distance = Math.hypot(dx, dy)
  if (half <= 0 || distance > half) return undefined
  if (distance > half - 1) return 'ink-0'

  let shadowed = false
  if (view.ball) {
    const reach = (half * view.ball.radius) / 100
    const ballX = dx - reach * Math.sin(view.ball.angle * RADIANS)
    const ballY = dy + reach * Math.cos(view.ball.angle * RADIANS)
    const size = Math.max(BALL_MIN, (half * RADII.ball) / 100)
    const away = Math.hypot(ballX, ballY)
    if (away <= size) return ballX + ballY < -size * 0.4 ? 'paper-1' : 'paper-0'
    if (away <= size + 1) return 'ink-0'
    shadowed = Math.hypot(ballX, ballY - 2) <= size + 1
  }

  const radius = (distance / half) * 100
  const angle = Math.atan2(dx, -dy) / RADIANS
  let token: string

  if (radius > RADII.track) {
    const streak = hash(Math.floor(distance), Math.floor(wrap(angle - view.turn) / GRAIN.arc)) % GRAIN.oneIn
    token = streak === 0 ? 'wood-2' : streak === 1 ? 'wood-0' : 'wood-1'
  } else if (radius > RADII.pocketOuter) {
    token = 'brass-2'
  } else if (radius > RADII.pocketInner) {
    const onWheel = wrap(angle - view.turn)
    const index = Math.round(onWheel / POCKET_ARC)
    const toDivider = (POCKET_ARC / 2 - Math.abs(onWheel - index * POCKET_ARC)) * RADIANS * distance
    if (toDivider < 0.5) {
      token = 'brass-1'
    } else {
      const number = WHEEL_ORDER[index % WHEEL_ORDER.length]
      if (view.landed?.lit && number === view.landed.winner) return 'brass-2'
      token = POCKET[getPocketColor(number)]
      if (radius < RADII.well) token = DARKER[token]
      if (view.landed && number !== view.landed.winner) token = DARKER[token]
    }
  } else if (radius > RADII.turret) {
    // The cone, with a dark seam under the pockets and a brass collar round the turret.
    const toPockets = ((RADII.pocketInner - radius) * half) / 100
    const toTurret = ((radius - RADII.turret) * half) / 100
    token = toPockets < 1 ? 'wood-0' : toTurret < 1 ? 'brass-0' : 'wood-1'
  } else if (distance < KNOB) {
    token = 'brass-3'
  } else {
    const hub = view.hubTurn * RADIANS
    const along = Math.abs(dx * Math.cos(hub) + dy * Math.sin(hub))
    const across = Math.abs(dy * Math.cos(hub) - dx * Math.sin(hub))
    const onSpoke = radius <= RADII.spoke && Math.min(along, across) <= SPOKE_HALF
    token = radius < RADII.hub || onSpoke ? 'brass-2' : 'brass-1'
  }

  const light = -dy / distance + (dither(x, y) - 0.5) * LIGHT.band
  if (light > LIGHT.edge) token = LIGHTER[token]
  else if (light < -LIGHT.edge) token = DARKER[token]
  return shadowed ? DARKER[token] : token
}

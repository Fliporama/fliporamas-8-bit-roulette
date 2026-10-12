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
  // Numbers are printed over this band in paper: lamp light must not wash it out beneath them.
  let numbered = false

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
      numbered = radius >= RADII.well
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
  if (light > LIGHT.edge && !numbered) token = LIGHTER[token]
  else if (light < -LIGHT.edge) token = DARKER[token]
  return shadowed ? DARKER[token] : token
}

// The fast path. A token is a code: its place in WHEEL_TOKENS plus one, with 0 for a clear pixel.
const CODE = Object.fromEntries(WHEEL_TOKENS.map((token, at) => [token, at + 1]))
const stepped = (steps: Record<string, string>) => Uint8Array.from([0, ...WHEEL_TOKENS.map((token) => CODE[steps[token]])])
const LIGHTER_CODE = stepped(LIGHTER)
const DARKER_CODE = stepped(DARKER)
const POCKET_CODE = WHEEL_ORDER.map((number) => CODE[POCKET[getPocketColor(number)]])
// What a pixel needs each frame. FIXED never changes; the others depend on how far the wheel or the spokes have turned.
const CLEAR = 0
const OUTLINE = 1
const FIXED = 2
const WOOD = 3
const BAND = 4
const WELL = 5
const SPOKES = 6
const BALL_BOX = 4 // art pixels past the ball's edge that its outline and shadow can reach, rounded up

export type WheelPainter = (view: Omit<WheelView, 'size'>, colours: ArrayLike<number>, out: { [at: number]: number }) => void

/**
 * `wheelPixel` for a whole wheel at once: everything that depends only on where a pixel is gets worked out here, once.
 * The painter sets `out[y * size + x]` to `colours[code]`. It must agree with `wheelPixel` at every pixel; a test holds it to that.
 */
export function wheelPainter(size: number): WheelPainter {
  const half = size / 2
  const count = size * size
  const kind = new Uint8Array(count)
  const fixed = new Uint8Array(count)
  const lights = new Int8Array(count)
  const dxs = new Float64Array(count)
  const dys = new Float64Array(count)
  const distances = new Float64Array(count)
  const angles = new Float64Array(count)

  for (let y = 0, at = 0; y < size; y++) {
    for (let x = 0; x < size; x++, at++) {
      const dx = x + 0.5 - half
      const dy = y + 0.5 - half
      const distance = Math.hypot(dx, dy)
      if (distance > half) continue
      dxs[at] = dx
      dys[at] = dy
      distances[at] = distance
      angles[at] = Math.atan2(dx, -dy) / RADIANS
      if (distance > half - 1) {
        kind[at] = OUTLINE
        continue
      }
      const radius = (distance / half) * 100
      const light = -dy / distance + (dither(x, y) - 0.5) * LIGHT.band
      lights[at] = light > LIGHT.edge ? 1 : light < -LIGHT.edge ? -1 : 0
      let token: string | undefined
      if (radius > RADII.track) {
        kind[at] = WOOD
      } else if (radius > RADII.pocketOuter) {
        token = 'brass-2'
      } else if (radius > RADII.pocketInner) {
        kind[at] = radius >= RADII.well ? BAND : WELL
      } else if (radius > RADII.turret) {
        const toPockets = ((RADII.pocketInner - radius) * half) / 100
        const toTurret = ((radius - RADII.turret) * half) / 100
        token = toPockets < 1 ? 'wood-0' : toTurret < 1 ? 'brass-0' : 'wood-1'
      } else if (distance < KNOB) {
        token = 'brass-3'
      } else if (radius < RADII.hub) {
        token = 'brass-2'
      } else if (radius > RADII.spoke) {
        token = 'brass-1'
      } else {
        kind[at] = SPOKES
      }
      if (token) {
        kind[at] = FIXED
        fixed[at] = lights[at] > 0 ? LIGHTER_CODE[CODE[token]] : lights[at] < 0 ? DARKER_CODE[CODE[token]] : CODE[token]
      }
    }
  }

  const band = new Uint8Array(WHEEL_ORDER.length)
  const well = new Uint8Array(WHEEL_ORDER.length)
  const INK_0 = CODE['ink-0']
  const BRASS_1 = CODE['brass-1']
  const BRASS_2 = CODE['brass-2']
  const WOODS = [CODE['wood-2'], CODE['wood-0'], CODE['wood-1'], CODE['wood-1'], CODE['wood-1']]

  return (view, colours, out) => {
    const { turn, landed } = view
    // A pocket's code in the number band and in the well; 0 marks the winner while it is lit.
    for (let index = 0; index < band.length; index++) {
      const loser = landed !== undefined && WHEEL_ORDER[index] !== landed.winner
      const code = POCKET_CODE[index]
      band[index] = landed?.lit && !loser ? 0 : loser ? DARKER_CODE[code] : code
      well[index] = landed?.lit && !loser ? 0 : loser ? DARKER_CODE[DARKER_CODE[code]] : DARKER_CODE[code]
    }
    const hub = view.hubTurn * RADIANS
    const hubCos = Math.cos(hub)
    const hubSin = Math.sin(hub)
    const ball = view.ball
    const reach = ball ? (half * ball.radius) / 100 : 0
    const ballAcross = ball ? reach * Math.sin(ball.angle * RADIANS) : 0
    const ballDown = ball ? reach * Math.cos(ball.angle * RADIANS) : 0
    const ballSize = Math.max(BALL_MIN, (half * RADII.ball) / 100)
    const box = ballSize + BALL_BOX

    for (let at = 0; at < count; at++) {
      const what = kind[at]
      if (what === CLEAR || what === OUTLINE) {
        out[at] = colours[what === CLEAR ? 0 : INK_0]
        continue
      }
      const dx = dxs[at]
      const dy = dys[at]
      let shadowed = false
      if (ball) {
        const ballX = dx - ballAcross
        const ballY = dy + ballDown
        if (ballX < box && ballX > -box && ballY < box && ballY > -box) {
          const away = Math.hypot(ballX, ballY)
          if (away <= ballSize) {
            out[at] = colours[CODE[ballX + ballY < -ballSize * 0.4 ? 'paper-1' : 'paper-0']]
            continue
          }
          if (away <= ballSize + 1) {
            out[at] = colours[INK_0]
            continue
          }
          shadowed = Math.hypot(ballX, ballY - 2) <= ballSize + 1
        }
      }

      let code: number
      let light = lights[at]
      if (what === FIXED) {
        code = fixed[at]
        light = 0
      } else if (what === WOOD) {
        code = WOODS[hash(Math.floor(distances[at]), Math.floor(wrap(angles[at] - turn) / GRAIN.arc)) % GRAIN.oneIn]
      } else if (what === SPOKES) {
        const along = Math.abs(dx * hubCos + dy * hubSin)
        const across = Math.abs(dy * hubCos - dx * hubSin)
        code = Math.min(along, across) <= SPOKE_HALF ? BRASS_2 : BRASS_1
      } else {
        const onWheel = wrap(angles[at] - turn)
        const index = Math.round(onWheel / POCKET_ARC)
        const toDivider = (POCKET_ARC / 2 - Math.abs(onWheel - index * POCKET_ARC)) * RADIANS * distances[at]
        if (toDivider < 0.5) {
          code = BRASS_1
        } else {
          code = (what === BAND ? band : well)[index % WHEEL_ORDER.length]
          if (code === 0) {
            out[at] = colours[BRASS_2]
            continue
          }
          // Numbers are printed over the band: it is never lightened.
          if (what === BAND && light > 0) light = 0
        }
      }
      if (light > 0) code = LIGHTER_CODE[code]
      else if (light < 0) code = DARKER_CODE[code]
      out[at] = colours[shadowed ? DARKER_CODE[code] : code]
    }
  }
}

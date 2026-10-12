import type { Light } from '../lib/scene'
import { sketch } from '../lib/sketch'
import type { SpriteData } from '../lib/sprite'

// The room's furniture. Each obeys the lighting rule: lit along the top, shadowed along the bottom,
// outlined in ink.

const BULB: Record<Light, { hot: string; warm: string; glow: boolean }> = {
  dim: { hot: 'brass-1', warm: 'brass-0', glow: false },
  normal: { hot: 'lamp-1', warm: 'lamp-0', glow: false },
  flare: { hot: 'lamp-1', warm: 'lamp-1', glow: true },
}

/** The green-shaded lamp over the table, on its cord, with its bulb at one light level. */
function lamp(level: Light): SpriteData {
  const { hot, warm, glow } = BULB[level]
  const drawing = sketch(48, 40).rect(22, 7, 4, 3, 'brass-0')
  // The shade: a cone, lighter where the room's own light catches its crown.
  for (let row = 0; row < 18; row++) {
    const token = row < 3 ? 'felt-3' : row < 10 ? 'felt-2' : 'felt-1'
    drawing.rect(19 - row, 10 + row, 10 + row * 2, 1, token)
  }
  drawing
    .rect(1, 28, 46, 2, 'brass-3')
    .rect(1, 30, 46, 2, 'brass-1')
    .rect(15, 32, 18, 2, hot)
    .rect(16, 34, 16, 2, warm)
    .outline('ink-0')
    .rect(23, 0, 2, 7, 'ink-0') // the cord
  if (glow) drawing.rect(12, 37, 24, 1, 'lamp-0').rect(8, 39, 32, 1, 'lamp-0')
  return drawing.sprite()
}

export const LAMPS: Record<Light, SpriteData> = { dim: lamp('dim'), normal: lamp('normal'), flare: lamp('flare') }

/** A turned wooden pedestal for the wheel at rest. */
export const WHEEL_STAND = sketch(44, 12)
  .rect(1, 1, 42, 2, 'wood-2')
  .rect(1, 3, 42, 1, 'wood-0')
  .rect(13, 4, 18, 2, 'brass-2')
  .rect(16, 6, 12, 6, 'wood-1')
  .rect(16, 6, 2, 6, 'wood-2')
  .rect(26, 6, 2, 6, 'wood-0')
  .outline('ink-0')
  .sprite()

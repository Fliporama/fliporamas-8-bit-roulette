# Art bible

The visual rules for Fliporama Roulette. Every phase of `docs/roadmap.md` obeys them. See them applied at `/?styleguide`; the values live in `src/tokens.css`.

Each rule comes with its reason, so that a case the rule does not cover can be decided the same way.

## Setting

A back-room speakeasy. The room is dim and smoky; one green-shaded lamp hangs over the table; the materials are felt, brass and dark wood.

*Why:* a single strong light in a dark room is where pixel art looks best, and it grows out of the green and gold the game already had instead of replacing it.

## Palette

Twenty-four colours in eight ramps. Step 0 is the darkest of each ramp. A material's light and shadow come from its own ramp.

| Ramp | Steps | Job |
|---|---|---|
| `ink` | 3 | outlines, deepest shadow, background |
| `felt` | 4 | the table, from shadow to lamp-lit |
| `wood` | 3 | rails, wheel body, panelling |
| `brass` | 4 | metal, gold, the primary button |
| `oxblood` | 3 | red pockets, danger, loss |
| `smoke` | 3 | muted text, haze, disabled |
| `paper` | 2 | text, the ball, chip faces |
| `lamp` | 2 | light itself: glow and win flashes |

Tokens are named `--<ramp>-<step>`, for example `--felt-2`.

| Ramp | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| `ink` | `#0a0f0e` | `#121c19` | `#1c2a26` | |
| `felt` | `#0c3a2e` | `#135242` | `#1c6d55` | `#2f8f6c` |
| `wood` | `#2a1a12` | `#4a2e1c` | `#6e4628` | |
| `brass` | `#6b4a1e` | `#a87a2c` | `#dab04a` | `#f4dc8a` |
| `oxblood` | `#5c1a1c` | `#96302e` | `#c8504a` | |
| `smoke` | `#4a5a54` | `#7f9289` | `#aebdb3` | |
| `paper` | `#d9d2ba` | `#f5efdc` | | |
| `lamp` | `#ffd27a` | `#fff3c4` | | |

This is the "lamp-lit" palette, chosen by the owner on 2026-10-13 over a cooler "smoke and oxblood" candidate: its warmer, more saturated felt gives the pool of lamp light more contrast against the shadow.

Rules:

- No colour is used that is not a token. `src/tokens.css` is the only file that states a hex value.
- New colours are not added to solve a local problem. If nothing fits, the ramp is wrong; change the ramp.

*Why:* the game had 40 unrelated hex colours. A small set of ramps is what makes separate screens look like one place, and it is what lets the whole site be re-lit by changing one file.

### Chips

Chips follow real casino colours, taken from the ramps:

| Chip | Face | Stripes |
|---|---|---|
| 1 | `paper-0` (white) | `smoke-0` |
| 5 | `oxblood-1` (red) | `paper-1` |
| 10 | `smoke-1` (blue-grey) | `paper-1` |
| 25 | `felt-2` (green) | `paper-1` |
| 100 | `ink-2` (black) | `brass-2` |

Each chip's lit rim is the next step up its ramp and its edge is the next step down.

*Why:* anyone who has seen a casino reads these values at a glance, and no new hues are needed.

### Text

Text may only be set in these combinations. Each reaches a contrast ratio of at least 4.5:1, checked by `src/lib/tokens.test.ts`.

| Text | On |
|---|---|
| `paper-1` | `ink-0`, `ink-1`, `ink-2`, `felt-0`, `felt-1`, `felt-2`, `wood-0`, `wood-1`, `oxblood-0`, `oxblood-1`, `smoke-0` |
| `paper-0` | `ink-1` |
| `smoke-1` | `ink-1` |
| `smoke-2` | `ink-0`, `ink-1` |
| `brass-2` | `ink-0`, `ink-1`, `felt-0`, `wood-0` |
| `brass-3` | `ink-0`, `ink-1`, `felt-0`, `felt-1`, `felt-2`, `wood-0`, `wood-1` |
| `lamp-0` | `ink-0` |
| `ink-0` | `brass-2`, `brass-3`, `paper-0`, `paper-1`, `lamp-0` |
| `oxblood-1`, `smoke-0` | `paper-1` |

To use a new combination, add it to `PAIRS` in that test first. Disabled controls are the one exception: they are deliberately low in contrast.

*Why:* a dark, moody palette is the easiest kind to make unreadable. Fixing the allowed pairs up front means mood never costs legibility.

## Lighting

- There is one light: the lamp above the centre of the table. Light is warm (`lamp`, `brass`); shadow is cool (`ink`, the dark end of `felt`).
- Light falls from top centre. Every object is lit along its top edge and shadowed along its bottom edge.
- Shadows are hard-edged, fall straight down, and are one ramp step darker than the surface they land on.
- There are no smooth gradients. Light falls off in flat steps of a ramp, and where two steps meet an ordered dither blends them.
- Outlines are one art pixel wide, in `ink-0`.
- The page behind everything is `ink-1`, one step above the darkest ink, so those outlines and hard shadows show against it.

*Why:* consistent light direction is the cheapest way to make flat sprites feel like objects in one room. Stepped, dithered light is what separates pixel art from a blurred photo of it.

## Pixel grid

- The site has one art-pixel size, the token `--px`: 3 screen pixels. Chosen over 2 and 4: pixels stay clearly visible while a 390 px phone still has room for the table.
- Every sprite, border, shadow offset and spacing step is a whole multiple of `--px`.
- Sprites scale by whole numbers only and are never smoothed.
- Anything that needs per-pixel shading, such as a pool of light, is drawn on a canvas with one canvas pixel per art pixel and scaled up unsmoothed. A CSS gradient is not a substitute: its curves are smoothed at screen resolution.
- Page layout (content width, breakpoints, gutters) and font sizes are not bound to the grid.

*Why:* mixed pixel sizes are the most common thing that makes pixel art on the web look cheap. One size, enforced by one token, rules it out.

## Type

- Two faces: a display face (`--font-display`) for titles and numbers that matter, and a text face (`--font-text`) for everything else. The display face is Press Start 2P and the text face is VT323: the strongest arcade title face of the three pairs tried, with mixed-case body text that stays readable, and the game already loads both.
- Five sizes, `--type-1` to `--type-5`: 10, 14, 18, 28 and 44 px. No other sizes are used.
- The text face is never set smaller than `--type-3`. The display face may use all five.

*Why:* two faces and five sizes are enough for a game, and few enough to stay consistent. Pixel text faces have a small x-height and stop being readable below 18 px.

## Motion

- Soft things (chips, badges, pop-ups) squash, stretch, overshoot and settle.
- Hard things (the ball, metal, wood) never deform. Their weight shows in short sharp bounces, damped settles, and the reaction of what they hit.
- Thrown things travel on arcs. Nothing moves in a straight line at constant speed.
- Timing and exaggeration values are named constants at the top of the file that uses them.
- Every animation has a reduced-motion path.

*Why:* these are the 12 principles of animation as this project applies them. The split between soft and hard came from the owner: a roulette ball that squashed looked like rubber, not a marble.

## Drawing in code

All art is drawn in code. A sprite is a grid of characters with a key that maps each character to a palette token:

```ts
import { sprite } from '../lib/sprite'

const GEM = sprite(
  [
    '.xx.',
    'xoox',
    'xoox',
    '.xx.',
  ],
  { x: 'ink-0', o: 'brass-2' }, // '.' is always transparent
)
```

Render it with `<Sprite data={GEM} />` from `src/components/Sprite.tsx`; `scale` takes a whole number. `sprite` throws where the sprite is defined if rows differ in length or a character is missing from the key.

Art too large to type out row by row (the lamp, the croupier, the room's furniture) is drawn from shapes with `sketch()` in `src/lib/sketch.ts`: filled rectangles and ellipses, then an outline. It produces the same data as `sprite()` and is rendered the same way.

Rules:

- Sprite keys name tokens, never colours, so a sprite re-lights when the palette changes.
- Draw objects that stand on the table in three-quarter view: a lit face above a shadowed edge. A chip's edge is two art pixels deep, so chips stacked two pixels apart read as a solid column.

*Why:* text grids keep every piece of art reviewable in a diff and editable without an art tool, which is what lets the look be built and changed across many sessions.

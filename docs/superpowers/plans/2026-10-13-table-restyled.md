# The Table, Restyled Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the art bible to the existing game (felt, tiles, chips, wheel, console) so that a screenshot of the idle table is worth posting on its own.

**Architecture:** Restyle in place: the same components, class names and game logic, with `src/game.css` rewritten onto `src/tokens.css`. Anything that needs per-pixel shading (the felt, the wheel) is a pure function from an art pixel to a palette token, painted onto a low-resolution canvas by a thin component. Chips and icons are sprites.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, `motion`, plain CSS custom properties, canvas 2D, `playwright-core` (`npm run capture`).

**Spec:** `docs/superpowers/specs/2026-10-13-table-restyled-design.md`. Read it and `docs/art-bible.md` before any task; the spec's sections say what each surface looks like, and this plan does not repeat them.

## Global Constraints

- Game rules, bet logic, sound and animation timing do not change, except the two wheel changes in Task 7.
- No hex or `rgb()` colour in any file under `src/` except `src/tokens.css`. Translucency is `color-mix(in srgb, var(--token) N%, transparent)`.
- Borders, shadow offsets, padding and gaps are whole multiples of `var(--px)` (3 px). Outlines are one art pixel in `--ink-0`. Raised surfaces: lit top edge and shadowed bottom edge from their own ramp (inset box-shadows), and a hard drop shadow. No blur, no glow, no smooth gradient, no 1 px hairline.
- Font sizes are only `var(--type-1)` to `var(--type-5)` (10, 14, 18, 28, 44 px). `--font-text` is never below `--type-3`; `--font-display` may use all five.
- Text uses only the pairs in `PAIRS` in `src/lib/tokens.test.ts`.
- Canvases are one canvas pixel per art pixel, `image-rendering: pixelated`, CSS size exactly `size × var(--px)`.
- The ball never scales, squashes or rotates.
- Every animation keeps its reduced-motion path.
- The page never scrolls sideways at 390 px.
- First-load JavaScript stays under 200 kB gzip. Baseline at the start of this phase: `index-*.js` 385.89 kB plus `jsx-runtime-*.js` 8.77 kB (127.30 kB gzip together).
- Conventional Commits; work stays on branch `feat/table-restyled`.
- Visual tasks end by running the captures and reading the PNGs in `captures/` against these constraints before committing.

## Review Focus

1. **The window is resized while the game is open** (or a phone is rotated): the felt and both wheels redraw at the new size, never stretched or blank. Pinned in Task 4 (a resized capture).
2. **Text grown to 10 px pushes the phone layout sideways.** Pinned in Task 4 (the round capture fails on horizontal overflow).
3. **Wheel turns far outside 0 to 360°, and negative** (the spin runs to 900°, winds back to −25°, and the ball arm runs to −2500°): the pocket under the top must still be right. Pinned in Task 3.
4. **A canvas with no room yet** (size 0 before layout, or a 2-pixel box): nothing throws and nothing is drawn. Pinned in Tasks 2 and 3.
5. **Reduced motion:** a full round still plays and shows its result with no wheel on screen and no console error. Pinned in Task 7 (a reduced-motion capture).

---

## File structure

| File | Responsibility |
|---|---|
| `src/sprites/chips.ts` | Chip sprites and the stack shadow (moved from the styleguide) |
| `src/sprites/table.ts` | The rail sprite (moved from the styleguide) |
| `src/sprites/icons.ts` | The six icon sprites |
| `src/lib/palette.ts` (+ test) | Read tokens from the page as RGB, for canvases |
| `src/lib/felt.ts` (+ test) | Pure: art pixel to felt step |
| `src/components/Felt.tsx` | Paints the felt behind its parent |
| `src/lib/wheelPixels.ts` (+ test) | Pure: art pixel to wheel token |
| `src/components/WheelCanvas.tsx` | Paints the wheel from motion values |
| `src/lib/colours.test.ts` | Fails on a colour outside `src/tokens.css` |
| `src/game.css` | Rewritten, area by area, in Tasks 4 to 7 |

---

### Task 1: Sprites, icons and text pairs

**Files:**
- Create: `src/sprites/chips.ts`, `src/sprites/table.ts`, `src/sprites/icons.ts`
- Modify: `src/lib/chips.ts`, `src/styleguide/sprites.ts`, `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`, `src/lib/tokens.test.ts`, `src/main.tsx`, `docs/art-bible.md`, `src/App.tsx` (types only)

**Interfaces:**
- Produces, from `src/lib/chips.ts`:
  ```ts
  export const CHIP_VALUES = [1, 5, 10, 25, 100] as const
  export type ChipValue = (typeof CHIP_VALUES)[number]
  export interface Chip { id: number; value: ChipValue }
  ```
- Produces, from `src/sprites/chips.ts`: `CHIP_SPRITES: Record<ChipValue, SpriteData>` (built once) and `CHIP_SHADOW: SpriteData`.
- Produces, from `src/sprites/table.ts`: `RAIL: SpriteData`.
- Produces, from `src/sprites/icons.ts`: `ICONS: Record<'sound' | 'mute' | 'reset' | 'clear' | 'remove' | 'play', SpriteData>`, each 7 × 7, every filled pixel keyed to the token `icon`, so an icon takes the colour of the `--icon` custom property set by its button.

- [ ] **Step 1: Add the new text pairs** to `PAIRS` in `src/lib/tokens.test.ts`:

```ts
['paper-1', 'wood-1'],
['brass-3', 'ink-0'], ['brass-3', 'ink-1'], ['brass-3', 'wood-0'], ['brass-3', 'wood-1'], ['brass-3', 'felt-0'],
['brass-2', 'wood-0'], ['lamp-0', 'ink-0'], ['ink-0', 'paper-0'],
['oxblood-1', 'paper-1'], ['smoke-0', 'paper-1'], ['smoke-2', 'ink-0'],
```

Run: `npx vitest run src/lib/tokens.test.ts`. Expected: PASS (all were measured at 4.59:1 or better).

- [ ] **Step 2: Mirror them in `docs/art-bible.md`**, in the table under "Text".

- [ ] **Step 3: Type the chip values** in `src/lib/chips.ts` as in Interfaces. In `src/App.tsx`, `chipValue` becomes `useState<ChipValue>(5)`.

- [ ] **Step 4: Move the sprites.** `chip` and `CHIP_SHADOW` go from `src/styleguide/sprites.ts` to `src/sprites/chips.ts`, exported as `CHIP_SPRITES` (the `ChipValue` type now comes from `src/lib/chips.ts`); `RAIL` goes to `src/sprites/table.ts`. `LAMP` and its helpers stay. Update the imports in `Styleguide.tsx`.

- [ ] **Step 5: Draw the icons** in `src/sprites/icons.ts`: a speaker with two sound bars (`sound`), a speaker with a cross (`mute`), a circular arrow (`reset`), a bin (`clear`), a cross (`remove`), a right-pointing triangle (`play`).

- [ ] **Step 6: Show the icons on the styleguide.** In the Sprites section add a row of all six at scale 2, inside a wrapper that sets `--icon: var(--paper-1)`.

- [ ] **Step 7: Import the tokens for the game.** Add `import './tokens.css'` to `src/main.tsx` before `./game.css`, and remove the import from `Styleguide.tsx`.

- [ ] **Step 8: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run (dev server up): `npm run capture -- styleguide`. Expected: exit 0; the PNG shows six legible icons, and the chips, rail and lit sample as before.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: move sprites out of the styleguide and add icons"
```

---

### Task 2: The felt

**Files:**
- Create: `src/lib/palette.ts`, `src/lib/palette.test.ts`, `src/lib/felt.ts`, `src/lib/felt.test.ts`, `src/components/Felt.tsx`
- Modify: `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/palette.ts
  export type Rgb = readonly [number, number, number]
  export function rgb(hex: string): Rgb
  /** The current value of each token on `element`, for painting a canvas. */
  export function paletteOf(element: Element, tokens: readonly string[]): Record<string, Rgb>

  // src/lib/felt.ts
  export type FeltStep = 0 | 1 | 2 | 3
  /** The step of the felt ramp at one art pixel of a `cols` × `rows` felt lit from top centre. */
  export function feltStep(x: number, y: number, cols: number, rows: number): FeltStep
  ```
  and `export default function Felt(props: { className?: string })`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/palette.test.ts
it('reads a six-digit hex colour', () => {
  expect(rgb('#0c3a2e')).toEqual([12, 58, 46])
})

// src/lib/felt.test.ts
const COLS = 96
const ROWS = 44
const block = (left: number, top: number) =>
  Array.from({ length: 81 }, (_, index) => feltStep(left + (index % 9), top + Math.floor(index / 9), COLS, ROWS))

it('is brightest under the lamp and darkest in the bottom corners', () => {
  expect(block(44, 5).filter((step) => step === 3).length).toBeGreaterThan(60)
  expect(block(0, 35).filter((step) => step === 0).length).toBeGreaterThan(60)
  expect(block(87, 35).filter((step) => step === 0).length).toBeGreaterThan(60)
})
it('only ever returns a step of the felt ramp', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) expect([0, 1, 2, 3]).toContain(feltStep(x, y, COLS, ROWS))
})
it('gives the same pixel the same step every time', () => {
  expect(feltStep(17, 9, COLS, ROWS)).toBe(feltStep(17, 9, COLS, ROWS))
})
it('copes with a felt that has no room yet', () => {
  expect([0, 1, 2, 3]).toContain(feltStep(0, 0, 0, 0))
  expect([0, 1, 2, 3]).toContain(feltStep(0, 0, 1, 1))
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/palette.test.ts src/lib/felt.test.ts`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `rgb` and `paletteOf`** in `src/lib/palette.ts`. `paletteOf` reads `getComputedStyle(element).getPropertyValue('--' + token)`.

- [ ] **Step 4: Implement `feltStep`** in `src/lib/felt.ts`, in three layers:
  1. **Light pool:** move `POOL`, `BAND`, `BAYER` and the step-and-dither arithmetic out of `LightPool` in `Styleguide.tsx` unchanged.
  2. **Wear:** `WEAR = 5` art pixels. Within `WEAR` of any edge the step drops by one where the Bayer threshold at that pixel is below `1 - distance / WEAR`.
  3. **Flecks:** `FLECK_ONE_IN = 61`. A fixed integer hash of `(x, y)` picks about one pixel in 61 and moves it one step up or down.
  Clamp to 0 to 3.

- [ ] **Step 5: Run** the two test files. Expected: PASS, 5 tests.

- [ ] **Step 6: Implement `Felt`** in `src/components/Felt.tsx`: a `<canvas aria-hidden="true">` absolutely positioned at its parent's top left. A `ResizeObserver` on the parent sets `cols` and `rows` to the parent's size divided by the computed `--px`, rounded up; the canvas's CSS size is `calc(var(--px) * cols)` by `calc(var(--px) * rows)` and the parent clips it. It paints through one `ImageData`, using `paletteOf(canvas, ['felt-0', 'felt-1', 'felt-2', 'felt-3'])`. With `cols` or `rows` of 0 it paints nothing.

- [ ] **Step 7: Use it on the styleguide.** `LitSample` renders `<Felt />` inside `.sg-lit-felt` (which gets `position: relative; overflow: hidden` and its 96 × 44 art-pixel size); `LightPool` and its constants are deleted.

- [ ] **Step 8: Verify**

Run: `npm run capture -- styleguide`. Expected: exit 0; the lit sample shows four dithered light steps, darker dithered edges and sparse flecks, with no smooth gradient.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add lit, worn felt drawn per art pixel"
```

---

### Task 3: The pixel wheel

**Files:**
- Create: `src/lib/wheelPixels.ts`, `src/lib/wheelPixels.test.ts`, `src/components/WheelCanvas.tsx`
- Modify: `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`

**Interfaces:**
- Consumes: `WHEEL_ORDER`, `POCKET_ARC` from `src/lib/wheel.ts`; `getPocketColor` from `src/lib/roulette.ts`; `paletteOf` (Task 2).
- Produces:
  ```ts
  // src/lib/wheelPixels.ts
  /** Radii as a percentage of the wheel's half-width. */
  export const RADII = { rim: 96, track: 94, pocketOuter: 90, well: 72, pocketInner: 60, turret: 30, spoke: 26, hub: 12, numbers: 81, ballRest: 70, ball: 3.5 }
  export interface WheelView {
    size: number          // width and height in art pixels
    turn: number          // degrees the wheel has turned, clockwise
    hubTurn: number       // degrees the spokes have turned, clockwise
    ball?: { angle: number; radius: number } // angle: degrees clockwise from the top of the screen; radius: as RADII
    landed?: { winner: number; lit: boolean } // once the ball is down
  }
  /** The palette token at one art pixel, or undefined outside the wheel. */
  export function wheelPixel(x: number, y: number, view: WheelView): string | undefined
  export const WHEEL_TOKENS: readonly string[] // every token wheelPixel can return
  ```
  and
  ```ts
  // src/components/WheelCanvas.tsx
  export default function WheelCanvas(props: {
    turn?: MotionValue<number>
    hubTurn?: MotionValue<number>
    ballAngle?: MotionValue<number>
    ballRadius?: MotionValue<number>
    winner?: number      // set once the ball has landed
    className?: string
  })
  ```

- [ ] **Step 1: Write the failing tests** in `src/lib/wheelPixels.test.ts`

```ts
const SIZE = 96
const HALF = SIZE / 2
const view = (extra: Partial<WheelView> = {}): WheelView => ({ size: SIZE, turn: 0, hubTurn: 0, ...extra })
/** The pixel just right of the vertical centre line, in the number band at the top. */
const top = (extra?: Partial<WheelView>) => wheelPixel(HALF, Math.round(HALF * (1 - RADII.numbers / 100)), view(extra))

it('puts pocket 0 at the top of an unturned wheel', () => {
  expect(top()).toMatch(/^felt-/)
})
it('brings the next pocket round as the wheel turns back by one pocket', () => {
  expect(top({ turn: -POCKET_ARC })).toMatch(/^oxblood-/) // 32, red
  expect(top({ turn: -2 * POCKET_ARC })).toMatch(/^ink-/) // 15, black
})
it('reads turns of any size and sign the same way', () => {
  expect(top({ turn: -POCKET_ARC - 720 })).toBe(top({ turn: -POCKET_ARC }))
  expect(top({ turn: 36 * POCKET_ARC + 1080 })).toBe(top({ turn: -POCKET_ARC }))
})
it('draws the ball where it is told to', () => {
  const pixel = wheelPixel(Math.round(HALF * (1 + RADII.ballRest / 100)), HALF, view({ ball: { angle: 90, radius: RADII.ballRest } }))
  expect(pixel).toMatch(/^paper-/)
})
it('has a brass hub and nothing outside the rim', () => {
  expect(wheelPixel(HALF, HALF, view())).toMatch(/^brass-/)
  expect(wheelPixel(0, 0, view())).toBeUndefined()
})
it('dims the losers and lights the winner once the ball is down', () => {
  expect(top({ landed: { winner: 0, lit: true } })).toBe('brass-2')
  expect(top({ turn: -POCKET_ARC, landed: { winner: 0, lit: true } })).not.toBe(top({ turn: -POCKET_ARC }))
})
it('only uses tokens that exist', () => {
  const css = readFileSync('src/tokens.css', 'utf8')
  const used = new Set<string>()
  for (const turn of [0, 13, -200]) {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const token = wheelPixel(x, y, view({ turn, hubTurn: turn / 2, ball: { angle: 40, radius: 96 }, landed: { winner: 7, lit: turn === 0 } }))
      if (token) used.add(token)
    }
  }
  for (const token of used) {
    expect(css).toContain(`--${token}:`)
    expect(WHEEL_TOKENS).toContain(token)
  }
})
it('copes with a wheel that has no room yet', () => {
  expect(wheelPixel(0, 0, view({ size: 0 }))).toBeUndefined()
  expect(() => wheelPixel(1, 1, view({ size: 2 }))).not.toThrow()
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/wheelPixels.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `wheelPixel`.** A pixel's radius and angle are taken from its centre, `(x + 0.5, y + 0.5)`, relative to the wheel's centre. In order:
  1. Outside the wheel: `undefined`. The outermost art pixel: `ink-0`.
  2. The ball, if given: a disc of radius `RADII.ball` (never less than 2 art pixels) in `paper-0`, its upper-left third `paper-1`, edged in `ink-0`.
  3. The base token, by ring, outermost first:
     - beyond `track`: wood rim, `wood-1`, with grain: thin concentric bands of `wood-2` and `wood-0` chosen by a fixed hash of the radius band and a coarse angle bucket, the angle measured on the wheel (so the grain turns with it);
     - `pocketOuter` to `track`: `brass-2`;
     - `pocketInner` to `pocketOuter`: the pocket whose index is `round((angle − turn) / POCKET_ARC)` wrapped into 0 to 36; its colour from `getPocketColor` as `oxblood-1`, `ink-1` or `felt-2`; inside `well` it is one step darker; within half an art pixel of a pocket boundary it is `brass-1`;
     - `turret` to `pocketInner`: the cone, `wood-1`;
     - inside `turret`: `brass-1`; the four spokes (three art pixels wide, out to `spoke`, turned by `hubTurn`) and the hub (inside `hub`) are `brass-2`.
  4. Lighting, fixed to the screen: with `light = −dy / radius`, the base moves one step up its ramp where `light > 0.35` and one step down where `light < −0.35`, each threshold softened by a 4 × 4 Bayer dither over a band of ±0.1. Steps clamp at the ends of the ramp.
  5. `landed`: every pocket except the winner moves one more step down; the winner's pocket is `brass-2` while `lit` is true.

- [ ] **Step 4: Run** the test file. Expected: PASS, 8 tests.

- [ ] **Step 5: Implement `WheelCanvas`.** A `<canvas aria-hidden="true">` centred in its box. A `ResizeObserver` sets `size` to the largest even whole number of art pixels that fits the box's smaller side; the CSS size is `calc(var(--px) * size)`. It draws once on mount and resize and again whenever any given motion value changes, at most once per animation frame, through one `ImageData` and `paletteOf(canvas, WHEEL_TOKENS)`. Missing motion values read as 0; the ball is drawn only when both ball values are given. When `winner` is set, `lit` toggles every 250 ms; with `useReducedMotion` it stays true. With `size` 0 it draws nothing.

- [ ] **Step 6: Show it on the styleguide.** Add a "Wheel" section after "Lit sample" with one `WheelCanvas` in a box 96 art pixels square.

- [ ] **Step 7: Verify**

Run: `npm run capture -- styleguide` and `npm run capture -- styleguide phone`. Expected: both exit 0. Read the PNGs: a round wheel with an ink outline, grained wood rim, brass track, 37 pockets with brass dividers and green at the top, a wood cone, a brass hub with four spokes; lighter towards the top and darker towards the bottom; no blurred edge anywhere.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add pixel wheel drawn per art pixel"
```

---

### Task 4: Page, table and tiles

**Files:**
- Modify: `src/game.css` (the rules from `:root` to `.table-note`, and their media queries), `src/App.tsx`, `src/components/RouletteTable.tsx`, `scripts/capture.mjs`

**Interfaces:**
- Consumes: `Felt` (Task 2), `WheelCanvas` (Task 3), `RAIL` (Task 1).
- Produces: shared classes in `src/game.css` that later tasks and the styleguide use:
  - `.button` (secondary: `--ink-2` face) and `.button.is-primary` (`--brass-2` face), with states `:hover` / `.is-hover`, `:active` / `.is-pressed`, `:disabled`, exactly as `.sg-button` in `src/styleguide/styleguide.css` defines them;
  - `.panel`, as `.sg-panel` defines it;
  - `.pocket`, `.pocket-red`, `.pocket-black`, `.pocket-green`, as `.sg-tile` and its variants define them.
- Produces: the class `has-chip` on a `.pocket` that holds a straight bet.

- [ ] **Step 1: Make the round capture catch overflow and resizing** in `scripts/capture.mjs`. In `captureRound`, after the idle shot, push `Horizontal overflow: <scrollWidth> > <innerWidth>` to `errors` on overflow, as `captureStyleguide` does (share one helper). On desktop only, after the settled shot, call `page.setViewportSize({ width: 700, height: 900 })`, wait 400 ms, save `desktop-8-resized.png` and run the overflow check again.

Run: `npm run capture`. Expected: exit 0 and a new `captures/desktop-8-resized.png`.

- [ ] **Step 2: Rewrite the page rules** in `src/game.css` per the spec's "Rules applied everywhere": `:root`, `body`, focus ring (`--brass-2`, one art pixel offset), `.app-shell`, `.topbar`, `.brand*`, `.session-status`, `.status-*`, `.game-heading`, `.eyebrow`, `h1`, `.section-heading*`, `.site-footer`. Delete the `--ink`, `--panel`, `--panel-light`, `--felt`, `--felt-deep`, `--paper`, `--muted`, `--line`, `--coral`, `--gold`, `--mint` and `--pixel` aliases as their last use goes; rules not yet rewritten (Tasks 5 to 7) keep working by using tokens directly where an alias is removed. `h1` is `--brass-2` at `--type-4`. The brand mark is a brass plate: `--brass-2` face, `--ink-0` letter.

- [ ] **Step 3: Add the shared classes** named in Interfaces.

- [ ] **Step 4: Put the still wheel in the heading.** In `src/App.tsx` replace the `.heading-stamp` element with `<div className="heading-wheel"><WheelCanvas /></div>`; delete the `.heading-stamp` rules. `.heading-wheel` is 72 art pixels square, 48 below 520 px wide.

- [ ] **Step 5: Build the table.** In `src/App.tsx`, `.table-frame` gains a top rail: a `<div className="table-rail" aria-hidden="true">` of `RAIL` sprites, enough to span the frame, clipped by the frame. The other three sides are a `--wood-1` border three art pixels wide with a `--wood-0` inner line; the frame has an `--ink-0` outline and a hard `--ink-0` shadow two art pixels down. In `RouletteTable.tsx`, `<Felt />` is the first child of `.roulette-table`, and the felt area carries `position: relative; overflow: hidden` with the grid above it.

- [ ] **Step 6: Restyle the tiles.** `.pocket` per the spec's "Tiles". In `RouletteTable.tsx` a tile gets `has-chip` when a bet of kind `straight` on its number exists in `bets`; `.pocket.has-chip` aligns its number to the left edge with two art pixels of padding.

- [ ] **Step 7: Restyle the outside bets and the mode switch** per the spec. In `RouletteTable.tsx` the `red` and `black` boxes render `<i className="swatch swatch-red" />` or `swatch-black` before the label; the `.outside-red > span` and `.outside-black > span` colour rules are deleted. In `src/App.tsx` each mode button's class becomes `button mode-button` plus `is-primary` when active.

- [ ] **Step 8: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture` and `npm run capture -- phone`. Expected: both exit 0. Read `desktop-1-idle.png`, `desktop-8-resized.png` and `phone-1-idle.png`: the felt, rail and heading wheel are sharp at every size, with no stretched or blank canvas; every tile is embossed and outlined; no text is smaller than 10 px. The console is not yet restyled.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: restyle the page, table and tiles from the art bible"
```

---

### Task 5: Chips

**Files:**
- Modify: `src/lib/chips.ts`, `src/lib/chips.test.ts`, `src/components/ChipLayer.tsx`, `src/components/WinTally.tsx`, `src/App.tsx`, `src/game.css` (`.chip-*`, `.stack-label`, `.spark`)

**Interfaces:**
- Consumes: `CHIP_SPRITES`, `CHIP_SHADOW`, `ChipValue` (Task 1); `has-chip` (Task 4).
- Produces:
  ```ts
  // src/lib/chips.ts
  export interface Box { x: number; y: number; width: number; height: number }
  /** Where chips sit in a box that also holds a label: `inset` from its right edge, centred vertically. */
  export function boxAnchor(box: Box, inset: number): Point
  ```

- [ ] **Step 1: Write the failing test** in `src/lib/chips.test.ts`

```ts
it('stacks chips at the right of a box, clear of its label', () => {
  expect(boxAnchor({ x: 100, y: 40, width: 66, height: 58 }, 21)).toEqual({ x: 145, y: 69 })
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/chips.test.ts`. Expected: FAIL, `boxAnchor` is not exported.

- [ ] **Step 3: Implement `boxAnchor`** and use it in `anchorOf` in `ChipLayer.tsx` for outside bets (replacing the inline arithmetic) and for straight bets. `OUTSIDE_INSET` is renamed `BOX_INSET` and becomes 21. Splits, streets and six-lines keep `stackAnchor`.

- [ ] **Step 4: Run** the test file. Expected: PASS.

- [ ] **Step 5: Draw chips as sprites.** In `ChipLayer.tsx` the `.chip-token` span becomes `<Sprite data={CHIP_SPRITES[chip.value]} />` and the `.chip-shadow` element becomes `<Sprite className="chip-shadow" data={CHIP_SHADOW} />`; the `chip-tone-*` class goes. `PICKER_SCALE` is 1 and `STACK_RISE` is 6. `pickerChip` selects `[data-chip="<value>"] svg`. In `src/game.css` the chip boxes become 12 × 11 art pixels, centred on the anchor; the `.chip-token` and `.chip-tone-*` rules are deleted; `.stack-label b` is `--lamp-0` on `--ink-0` in the text face at `--type-3`.

- [ ] **Step 6: Build the picker tray** in `src/App.tsx`: each `.chip-choice` holds `<Sprite data={CHIP_SPRITES[value]} />` above `<span className="chip-value">{value}</span>`. `.chip-picker` is a recessed tray (`--felt-0` face, `--ink-0` outline, a shadowed top edge); `.chip-choice.is-selected` sits two art pixels higher with a `--brass-2` bar one art pixel tall beneath its value. Values are `--paper-1` in the display face at `--type-1`.

- [ ] **Step 7: Make the win burst chips.** In `WinTally.tsx` delete `CHIP_COLORS`; each spark renders `<Sprite data={CHIP_SPRITES[CHIP_VALUES[index % CHIP_VALUES.length]]} />`. `.spark` loses its border and size.

- [ ] **Step 8: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture` and `npm run capture -- phone`. Expected: both exit 0. Read `2-mid-toss`, `3-bets-placed` and `6-tally` for both: chips are crisp sprites in the casino colours; the three chips on 17 form a solid column; the number 17 is fully visible beside its stack; chips on Red and Odd do not cover their labels.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: draw chips as sprites and keep tile numbers visible"
```

---

### Task 6: The console

**Files:**
- Modify: `src/App.tsx`, `src/game.css` (`.console` to `.result-placeholder`, `.payout-pop`, `.tally-banner`, `.gold-flash`, `.bank-flash`, and their media queries), `package.json`

**Interfaces:**
- Consumes: `ICONS` (Task 1); `.button`, `.panel`, `.pocket` (Task 4).

- [ ] **Step 1: Swap the icons.** In `src/App.tsx` each `lucide-react` icon becomes `<Sprite data={ICONS.<name>} />` (`Volume2` → `sound`, `VolumeX` → `mute`, `RotateCcw` → `reset`, `Trash2` → `clear`, `X` → `remove`, `Play` → `play`). `.icon-action` and `.remove-bet` are four-art-pixel-padded `.button`s that set `--icon`. Then run `npm uninstall lucide-react`.

- [ ] **Step 2: Build the cabinet** per the spec's "The console". `.console` is the cabinet: `--wood-1` face, a `--brass-2` line one art pixel wide inside an `--ink-0` outline, lit top edge `--wood-2`, hard `--ink-0` shadow. Inside it:
  - `.bankroll-panel`: recessed `--ink-0` window; `.bankroll-value` in `--lamp-0` at `--type-4`; `.panel-kicker` spans are brass plates (`--brass-2` face, `--ink-0` text, `--type-1`).
  - `.bets-section`: the paper ticket (`--paper-1` face, `--ink-0` text, `--smoke-0` dotted rules, stake in `--oxblood-1`). Its serrated bottom edge is a `::after` strip two art pixels tall whose background repeats a triangle of `--paper-1` every four art pixels, made with `conic-gradient` hard stops.
  - `.spin-button`: class becomes `button is-primary spin-button`, full width, `--type-2`. The spinning icon animation steps (`steps(8)`) instead of turning smoothly.
  - `.result-panel`: recessed window; `.result-number` is a `.pocket`. A win is `--lamp-0` text; a loss is `--paper-1` text after an `--oxblood-1` square marker.
  - Headings inside the cabinet are `--brass-3` on the wood.

- [ ] **Step 3: Recolour the overlays.** `.tally-banner` and `.payout-pop` are `.panel`s with a `--brass-2` line; their totals are `--lamp-0`. `.gold-flash` is `--lamp-0`. `.bank-flash` is `--lamp-0`.

- [ ] **Step 4: Keep the narrow layouts working.** Rewrite the 980, 760 and 520 px media queries for the cabinet: below 760 px the cabinet spans the page under the table in the same two-column arrangement as today. Font sizes in the queries use the tokens only.

- [ ] **Step 5: Verify**

Run: `npm test`, `npm run lint`, `npm run build`. Expected: all pass; `lucide-react` is in no chunk; `index-*.js` plus `jsx-runtime-*.js` is below 394.66 kB.
Run: `npm run capture` and `npm run capture -- phone`. Expected: both exit 0. Read every PNG: the console reads as one wooden machine; the bank digits, ticket, tray and spin button match the spec; the tally banner and payout pop-up use the palette; nothing overflows at 390 px or in `desktop-8-resized.png`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: rebuild the console as a wood and brass machine"
```

---

### Task 7: The wheel overlay

**Files:**
- Modify: `src/components/RouletteWheel.tsx`, `src/game.css` (`.wheel-overlay` to `.wheel-result`, `.is-scoring`), `scripts/capture.mjs`

**Interfaces:**
- Consumes: `WheelCanvas`, `RADII` (Task 3).

- [ ] **Step 1: Add a reduced-motion capture** to `scripts/capture.mjs`: with the argument `reduced`, the browser context is created with `reducedMotion: 'reduce'` and file names start `reduced-`.

Run: `npm run capture -- reduced`. Expected: exit 0; `reduced-7-settled.png` shows a settled round.

- [ ] **Step 2: Swap the SVG for the canvas** in `RouletteWheel.tsx`. The `.wheel` element no longer rotates or scales; it holds:
  - `<WheelCanvas turn={wheelTurn} hubTurn={spokeTurn} ballAngle={ballScreen} ballRadius={ballRadius} winner={landed ? result : undefined} />`, where `ballScreen = useTransform(() => wheelTurn.get() + armAngle.get())`;
  - a `<motion.div className="wheel-numbers" style={{ rotate: wheelTurn }}>` with one `<span>` per pocket, placed at `RADII.numbers` percent of the wheel's radius and turned to its pocket's angle.
  The SVG, the `.ball-arm` and `.ball` elements, `FILL`, `WEDGES`, `point`, `spokeLag`, `ballTop` and the local radius constants are deleted; `DROP.radius`, `BALL_REST` and the `land` arithmetic read `RADII.rim` and `RADII.ballRest`.

- [ ] **Step 3: Make the two motion changes.**
  1. `wheelBump` and `BUMP` are deleted. The `.wheel` element takes `y: useTransform(impact, (amount) => (amount > 0.5 ? 'var(--px)' : '0px'))`.
  2. The `.is-landed .wedge` rules are deleted; `WheelCanvas` dims the losers and blinks the winner from `winner`.

- [ ] **Step 4: Restyle the rest.** `.wheel-overlay` is `color-mix(in srgb, var(--ink-0) 85%, transparent)`. `.wheel-numbers span` is `--paper-1` in the text face at `--type-3`. `.wheel-result` is a `.pocket` at `--type-5` with a `--brass-2` line. `.is-scoring` is a `--brass-2` outline one art pixel wide; its `!important` opacity and its brightness filter go. The `.ball`, `.spokes` and `.wedge` rules are deleted.

- [ ] **Step 5: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`, `npm run capture -- phone`, `npm run capture -- reduced`. Expected: all exit 0. Read `4-spinning` and `5-landed` for desktop and phone: the wheel is the pixel wheel, numbers sit in their pockets and are readable on desktop, the ball is a crisp disc, and once landed the losers are darker and the ball sits in the pocket whose number matches the badge. `reduced-4-spinning.png` shows no wheel.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: spin the pixel wheel in the overlay"
```

---

### Task 8: Guard, styleguide and sign-off

**Files:**
- Create: `src/lib/colours.test.ts`
- Modify: `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`, `docs/roadmap.md`, anything the guard test finds

- [ ] **Step 1: Write the guard test** in `src/lib/colours.test.ts`

```ts
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/
const files = readdirSync('src', { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.(css|tsx?)$/.test(file) && !file.endsWith('.test.ts') && file !== 'tokens.css')

it.each(files)('%s states no colour of its own', (file) => {
  const offenders = readFileSync(join('src', file), 'utf8').split('\n').filter((line) => COLOUR.test(line))
  expect(offenders).toEqual([])
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/colours.test.ts`. Expected: PASS if Tasks 4 to 7 were complete. Fix every offender it lists by using a token, then re-run until it passes.

- [ ] **Step 3: Check the type scale and the grid.**

Run: `grep -nE "font-size: [0-9]" src/game.css src/styleguide/styleguide.css`
Expected: no matches.
Run: `grep -nE "blur|text-shadow|linear-gradient|radial-gradient| 1px" src/game.css`
Expected: no matches.

- [ ] **Step 4: Point the styleguide at the game's classes.** In `Styleguide.tsx` the buttons use `button` and `button is-primary`, the tiles use `pocket pocket-red` / `pocket-black` / `pocket-green`, and the panel uses `panel`. Delete `.sg-button`, `.sg-tile`, `.sg-panel` and their variants from `styleguide.css`.

- [ ] **Step 5: Verify everything**

Run: `npm test`, `npm run lint`, `npm run build`. Expected: all pass; first-load JavaScript (`index-*.js` plus `jsx-runtime-*.js`) is under 127.30 kB gzip.
Run: `npm run capture`, `npm run capture -- phone`, `npm run capture -- reduced`, `npm run capture -- styleguide`, `npm run capture -- styleguide phone`. Expected: all exit 0. Read every PNG once more against Global Constraints.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "test: guard the palette and share component classes with the styleguide"
git push -u origin feat/table-restyled
```

- [ ] **Step 7: OWNER GATE.** Ask the owner to open `http://localhost:5173/`, place bets, spin, and judge by eye: the idle table as a screenshot (the phase's "done when"), the wheel turning, the one-art-pixel jolt on each bounce, the losers dimming on landing, and a chip toss and stack. Apply what they ask for and repeat until they approve.

- [ ] **Step 8: Close the phase.** Tick Phase 2 in `docs/roadmap.md`, set "Current phase" to 3, and replace "Notes for next session" with what Phase 3 must know: that `LAMP` still lives in `src/styleguide/sprites.ts`; that the felt's light pool in `src/lib/felt.ts` and the wheel's lighting in `src/lib/wheelPixels.ts` are where the room's lights dim and flare; that the brightness flashes in `ChipLayer.tsx` (`THUNK`) and the `winner` keyframes are still off-palette and belong to Phase 4; the measured first-load size; and the Vercel and Phase 7 notes carried over unchanged. Commit, push, and open a pull request into `main` with `gh pr create`.

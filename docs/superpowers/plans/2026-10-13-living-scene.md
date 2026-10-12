# A Living Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the table in a room that looks alive with no input for 30 seconds: a lit wall, a hanging lamp whose light responds to the game, a croupier who reacts, smoke, silhouettes behind frosted glass and clockwork details, with one setting to turn the animation off.

**Architecture:** Game state becomes two pure values, a light level and a croupier reaction (`src/lib/scene.ts`). A hook turns the light level into a stepped number with flicker, which the felt, the wall and the lamp all read. The wall and the smoke are pure pixel functions painted on low-resolution canvases, as the felt and wheel are; the croupier and fixtures are layered sprites. A `Scene` component lays the band out above the table.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, `motion`, plain CSS, canvas 2D, `playwright-core` (`npm run capture`).

**Spec:** `docs/superpowers/specs/2026-10-13-living-scene-design.md`. Read it and `docs/art-bible.md` before any task; the spec says what each thing looks like and does, and this plan does not repeat it.

## Global Constraints

- Game rules, bet logic, sounds and the Phase 2 look of the table, chips, wheel and console do not change.
- No colour outside `src/tokens.css` (`src/lib/colours.test.ts`). Text only on the pairs in `PAIRS` (`src/lib/tokens.test.ts`).
- Page text that sits over the fixed wall (top bar, section heading, table note, footer) must stay readable: the fixed wall uses only `ink-0` and `ink-1`. Wood and lit steps appear only inside the scene band, where no page text sits except the title sign on its own plate.
- Sizes and offsets are whole multiples of `var(--px)`; sprites scale by whole numbers and are never rotated or smoothed; canvases are one canvas pixel per art pixel.
- No blur, glow or smooth gradient. Light changes in hard steps.
- Every moving thing stops when the setting is off, when the system asks for reduced motion, when the tab is hidden, and when the scene is scrolled out of view.
- Timing and exaggeration values are named constants at the top of the file that uses them.
- The croupier, wall, fixtures, smoke and lamp are `aria-hidden`.
- The page never scrolls sideways at 390 px or 360 px.
- 60 fps during a chip toss, a spin and a tally with the scene running; first-load JavaScript under 200 kB gzip (128.5 kB at the start of this phase).
- Conventional Commits; work stays on branch `feat/living-scene`.
- Visual tasks end by running the captures and reading the PNGs in `captures/` before committing.

## Review Focus

1. **A stored setting that is not what we wrote** (`'yes'`, an empty string, storage that throws): the default applies and nothing throws. Pinned in Task 1.
2. **The game jumps state** (a session reset in the middle of a spin, a skipped tally): the light returns to normal and the croupier to idle; nothing stays dim or mid-gesture. Pinned in Task 2 (the scene exposes its light as `data-light`, and the round capture asserts it while spinning and after settling).
3. **A narrow band** (360 px): fixtures are hidden rather than overlapping the croupier or the sign. Pinned in Tasks 3 and 6 (phone capture, read at 390 and 360).
4. **The scene is out of view or the tab is hidden:** animation stops. Pinned in Task 7 (the idle capture scrolls to the foot of the page and asserts the scene is still).
5. **Clock edges** (00:00, 12:00, 23:59) and **smoke after hours of running** (a very large time): hands stay inside the face; density stays in range. Pinned in Tasks 5 and 6.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/scene.ts` (+ test) | Pure: light and reaction for a game state; where a bet is on the table; the setting |
| `src/lib/useRoomLight.ts` | Hook: a light level as a stepped, flickering number |
| `src/lib/useLive.ts` | Hook: whether an element should animate now |
| `src/lib/felt.ts` | Gains a light shift |
| `src/lib/wall.ts` (+ test) | Pure: art pixel to wall token |
| `src/lib/smoke.ts` (+ test) | Pure: art pixel and time to smoke token |
| `src/lib/clock.ts` (+ test) | Pure: a time to a clock-face sprite |
| `src/components/Wall.tsx`, `Smoke.tsx`, `Croupier.tsx`, `Fixtures.tsx`, `Scene.tsx` | As named |
| `src/sprites/room.ts`, `src/sprites/croupier.ts` | The drawings |

---

### Task 1: Scene logic and the setting

**Files:**
- Create: `src/lib/scene.ts`, `src/lib/scene.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Light = 'dim' | 'normal' | 'flare'
  export type Reaction = 'idle' | 'noMoreBets' | 'win' | 'loss'
  export type Look = -1 | 0 | 1 // left, centre, right
  export interface Moment { phase: 'betting' | 'spinning' | 'tallying'; won: boolean }
  /** Light steps added to the lamp's pool at each level. */
  export const LIGHT_SHIFT: Record<Light, number> // { dim: -1, normal: 0, flare: 1 }
  export function lightFor(moment: Moment): Light
  export function reactionFor(moment: Moment): Reaction
  /** Which third of the wide table a bet sits in. */
  export function lookFor(target: Pick<BetTarget, 'kind' | 'numbers'>): Look
  /** Whether room animation starts on: a stored choice wins, otherwise on unless motion is reduced. */
  export function sceneDefault(stored: string | null, reducedMotion: boolean): boolean
  export function isSceneOn(): boolean
  export function setSceneOn(value: boolean): void
  ```
  The setting is stored under `fliporama-scene` as `'1'` or `'0'`, read once at module load inside `try`, exactly as `src/lib/sound.ts` stores mute.

- [ ] **Step 1: Write the failing tests** in `src/lib/scene.test.ts`

```ts
const at = (phase: Moment['phase'], won = false): Moment => ({ phase, won })

it('lights the room for each moment of the game', () => {
  expect(lightFor(at('betting'))).toBe('normal')
  expect(lightFor(at('spinning'))).toBe('dim')
  expect(lightFor(at('tallying', true))).toBe('flare')
  expect(lightFor(at('tallying', false))).toBe('normal')
  expect(lightFor(at('betting', true))).toBe('normal')
})
it('gives the croupier a reaction for each moment', () => {
  expect(reactionFor(at('betting'))).toBe('idle')
  expect(reactionFor(at('spinning'))).toBe('noMoreBets')
  expect(reactionFor(at('tallying', true))).toBe('win')
  expect(reactionFor(at('tallying', false))).toBe('loss')
})
it('looks at the part of the table a bet is on', () => {
  expect(lookFor({ kind: 'straight', numbers: [0] })).toBe(-1)
  expect(lookFor({ kind: 'straight', numbers: [3] })).toBe(-1)
  expect(lookFor({ kind: 'straight', numbers: [17] })).toBe(0)
  expect(lookFor({ kind: 'straight', numbers: [36] })).toBe(1)
  expect(lookFor({ kind: 'street', numbers: [7, 8, 9] })).toBe(-1)
  expect(lookFor({ kind: 'dozen', numbers: Array.from({ length: 12 }, (_, index) => index + 25) })).toBe(1)
  expect(lookFor({ kind: 'column', numbers: [3, 6, 9] })).toBe(1) // the column boxes are at the right end
})
it('starts on unless motion is reduced, and a stored choice wins', () => {
  expect(sceneDefault(null, false)).toBe(true)
  expect(sceneDefault(null, true)).toBe(false)
  expect(sceneDefault('1', true)).toBe(true)
  expect(sceneDefault('0', false)).toBe(false)
})
it('ignores a stored value it did not write', () => {
  expect(sceneDefault('yes', false)).toBe(true)
  expect(sceneDefault('', true)).toBe(false)
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/scene.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/scene.ts`.** `lookFor` returns 1 for `column`; otherwise it takes the mean of `numbers`, and returns -1 below 13, 0 from 13 to 24, and 1 above 24.

- [ ] **Step 4: Run** the test file. Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scene.ts src/lib/scene.test.ts
git commit -m "feat: derive room light and croupier reaction from game state"
```

---

### Task 2: The light reaches the felt

**Files:**
- Create: `src/lib/useRoomLight.ts`
- Modify: `src/lib/felt.ts`, `src/lib/felt.test.ts`, `src/components/Felt.tsx`, `src/App.tsx`, `scripts/capture.mjs`

**Interfaces:**
- Consumes: `Light`, `LIGHT_SHIFT`, `lightFor`, `Moment`, `isSceneOn` (Task 1).
- Produces:
  ```ts
  // src/lib/felt.ts — `shift` moves the lamp's pool by that many light steps
  export function feltStep(x: number, y: number, cols: number, rows: number, shift?: number): FeltStep
  // src/lib/useRoomLight.ts
  /** The room's light as a shift in light steps. Moves to a new level in hard steps; flickers at normal when `live`. */
  export function useRoomLight(level: Light, live: boolean): number
  ```
  `Felt` takes `{ light?: number }` and repaints when it changes. In `App.tsx`: `const moment = { phase, won: Boolean(round && round.tally.tier !== 'none') }`, `const [sceneOn, setSceneOnState] = useState(isSceneOn)`, `const light = useRoomLight(lightFor(moment), sceneOn)`. The `#game` element carries `data-light={lightFor(moment)}`.

- [ ] **Step 1: Write the failing test** in `src/lib/felt.test.ts`

```ts
it('is never brighter when dimmed, nor darker when flared', () => {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const normal = feltStep(x, y, COLS, ROWS)
      expect(feltStep(x, y, COLS, ROWS, 0)).toBe(normal)
      expect(feltStep(x, y, COLS, ROWS, -1)).toBeLessThanOrEqual(normal)
      expect(feltStep(x, y, COLS, ROWS, 1)).toBeGreaterThanOrEqual(normal)
    }
  }
  expect(block(44, 5).filter((step) => step === 3).length).toBeGreaterThan(feltBlock(-1).filter((step) => step === 3).length)
})
```

with `const feltBlock = (shift: number) => Array.from({ length: 81 }, (_, index) => feltStep(44 + (index % 9), 5 + Math.floor(index / 9), COLS, ROWS, shift))`.

- [ ] **Step 2: Run** `npx vitest run src/lib/felt.test.ts`. Expected: FAIL (the extra argument is ignored, so the last assertion fails).

- [ ] **Step 3: Add `shift`** to `feltStep`: it is added to the light value before the value is clamped and stepped. Default 0.

- [ ] **Step 4: Run** the test file. Expected: PASS.

- [ ] **Step 5: Implement `useRoomLight`.** Constants: `STEP_MS = 100`, `FLICKER = { everyMin: 6000, everyMax: 14000, ms: 80, shift: -0.5 }`. When `level` changes it sets the midpoint between the old and new shift, then the new shift after `STEP_MS`. While `live` and at `normal`, a timer at a random interval within `FLICKER` sets `FLICKER.shift` for `FLICKER.ms`. When `live` is false it returns 0 at once and runs no timers. Every timer is cleared on change and on unmount.

- [ ] **Step 6: Wire it** into `App.tsx` and `Felt.tsx` as in Interfaces.

- [ ] **Step 7: Pin the light in the round capture.** In `captureRound` in `scripts/capture.mjs`, read `document.getElementById('game').dataset.light` after the `4-spinning` shot and after the `7-settled` shot; push `Light while spinning: <value>` to `errors` unless it is `dim`, and `Light after the round: <value>` unless it is `normal`. Skip the spinning check when `reduced` is set.

- [ ] **Step 8: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`. Expected: exit 0. Read `desktop-4-spinning.png` (the felt behind the overlay is darker than in `desktop-3-bets-placed.png`) and `desktop-7-settled.png` (back to normal).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: dim the felt for a spin and flare it on a win"
```

---

### Task 3: The wall, the band, the lamp and the setting

**Files:**
- Create: `src/lib/wall.ts`, `src/lib/wall.test.ts`, `src/lib/useLive.ts`, `src/components/Wall.tsx`, `src/components/Scene.tsx`, `src/sprites/room.ts`
- Modify: `src/App.tsx`, `src/game.css`, `src/sprites/icons.ts`, `src/styleguide/sprites.ts` (deleted), `src/styleguide/Styleguide.tsx`, `src/lib/tokens.test.ts`, `docs/art-bible.md`

**Interfaces:**
- Consumes: `Light`, `Reaction`, `Look`, `setSceneOn` (Task 1); `useRoomLight` (Task 2); `paint`, `paletteOf`, `artPixel`, `dither`, `hash` from `src/lib/palette.ts`; `WheelCanvas`.
- Produces:
  ```ts
  // src/lib/wall.ts
  export interface WallView {
    cols: number
    rows: number
    /** The lamp's bulb, in art pixels. Absent: an unlit wall. */
    lamp?: { x: number; y: number }
    /** Light steps added to the lamp's pool. */
    shift: number
    /** The row where wood panelling begins. Absent: wallpaper all the way down. */
    skirt?: number
  }
  export const WALL_TOKENS: readonly string[] // ink-0..2, wood-0..2
  export function wallPixel(x: number, y: number, view: WallView): string
  // src/lib/useLive.ts
  /** True while `on`, the tab is visible and the element is on screen. */
  export function useLive(element: RefObject<Element | null>, on: boolean): boolean
  // src/sprites/room.ts
  export const LAMPS: Record<Light, SpriteData> // the Phase 1 lamp, with its bulb at each level
  export const WHEEL_STAND: SpriteData
  // src/sprites/icons.ts gains
  ICONS.lampOn, ICONS.lampOff
  ```
  `Wall` takes `{ lamp?: { x: number; y: number }; shift?: number; skirt?: number }` (lamp and skirt as fractions of its box, 0 to 1) and fills its nearest positioned ancestor, as `Felt` does.
  `Scene` takes `{ light: number; reaction: Reaction; look: Look; on: boolean; children: ReactNode }`; `children` is the title sign's content. It renders `<section className="scene" aria-labelledby="game-title">`, adding the class `is-still` when `useLive` is false. Tasks 4 to 6 add their components inside it.

- [ ] **Step 1: Write the failing tests** in `src/lib/wall.test.ts`

```ts
const COLS = 120
const ROWS = 80
const band: WallView = { cols: COLS, rows: ROWS, lamp: { x: 60, y: 20 }, shift: 0, skirt: 56 }
const rank = (token: string) => WALL_TOKENS.indexOf(token) % 3 // the step within its ramp

it('uses wallpaper above the skirt and wood below it', () => {
  expect(wallPixel(10, 10, band)).toMatch(/^ink-/)
  expect(wallPixel(10, 70, band)).toMatch(/^wood-/)
  expect(wallPixel(10, 70, { ...band, skirt: undefined })).toMatch(/^ink-/)
})
it('is lighter near the lamp than in the far corners', () => {
  const near = Array.from({ length: 25 }, (_, index) => rank(wallPixel(58 + (index % 5), 22 + Math.floor(index / 5), band)))
  const far = Array.from({ length: 25 }, (_, index) => rank(wallPixel(index % 5, Math.floor(index / 5), band)))
  expect(Math.min(...near)).toBeGreaterThan(Math.max(...far))
})
it('never uses the lightest ink on an unlit wall, so page text over it stays readable', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    expect(['ink-0', 'ink-1']).toContain(wallPixel(x, y, { cols: COLS, rows: ROWS, shift: 0 }))
  }
})
it('dims and flares with the light', () => {
  const count = (shift: number) => {
    let lit = 0
    for (let y = 0; y < 56; y++) for (let x = 0; x < COLS; x++) if (wallPixel(x, y, { ...band, shift }) === 'ink-2') lit++
    return lit
  }
  expect(count(-1)).toBeLessThan(count(0))
  expect(count(1)).toBeGreaterThan(count(0))
})
it('only uses tokens it declares, and copes with no room', () => {
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) expect(WALL_TOKENS).toContain(wallPixel(x, y, band))
  expect(WALL_TOKENS).toContain(wallPixel(0, 0, { cols: 0, rows: 0, shift: 0 }))
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/wall.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `wallPixel`.**
  - **Wallpaper** (above `skirt`): `ink-1`, with a repeating diamond motif every 16 art pixels in `ink-0`.
  - **Panelling** (from `skirt` down): a `wood-2` cap rail two art pixels tall, then `wood-1` boards 12 art pixels wide separated by `wood-0` grooves, with sparse `wood-0` grain from `hash`.
  - **Light,** only when `lamp` is given: distance from the lamp, stretched to reach about 45 % of `cols` sideways and 90 % of `rows` down, gives a light value; `shift` is added; where it passes a threshold softened by `dither`, the token moves one step up its ramp, and where it falls below a lower threshold, one step down. Without a lamp nothing moves up, so an unlit wall is only `ink-0` and `ink-1`.

- [ ] **Step 4: Run** the test file. Expected: PASS, 5 tests.

- [ ] **Step 5: Implement `Wall`** on the pattern of `src/components/Felt.tsx`, painting with `paletteOf(canvas, WALL_TOKENS)` and repainting when its size or props change.

- [ ] **Step 6: Implement `useLive`** with `IntersectionObserver` and the document's `visibilitychange` event.

- [ ] **Step 7: Draw the room sprites** in `src/sprites/room.ts`. Move `LAMP` and its helpers from `src/styleguide/sprites.ts` (delete that file) and build `LAMPS`: at `normal` as drawn; at `dim` the two bulb rows use `brass-1` and `brass-0`; at `flare` both bulb rows use `lamp-1` and a third row of `lamp-0`, two art pixels wider, is added beneath. `WHEEL_STAND`: a turned wooden pedestal about 20 × 10 art pixels, in the `wood` ramp with an `ink-0` outline and a `brass-2` collar.

- [ ] **Step 8: Draw the setting's icons** in `src/sprites/icons.ts`, 7 × 7 like the rest: `lampOn` a lamp shade with rays beneath, `lampOff` the shade alone.

- [ ] **Step 9: Change the layout** in `src/App.tsx` and `src/game.css`.
  - A `<div className="room-wall" aria-hidden="true"><Wall /></div>` is the first child of `.app-shell`: `position: fixed; inset: 0; z-index: -1`.
  - `.game-heading` is removed. Inside `.table-section`, in order: the existing `.section-heading`, then `<Scene>` with the eyebrow and `<h1 id="game-title">` as its children, then `.table-frame`, then `.table-note`.
  - `.scene`: `position: relative`, 80 art pixels tall (60 below 520 px), `overflow: hidden`, with an `ink-0` line down each side joining the table's outline. It holds, in this order: `<Wall lamp={{ x: 0.5, y: 0.3 }} shift={light} skirt={0.7} />`; `.scene-sign` (the children, on an `ink-0` plate with a one-art-pixel `brass-2` line, at the left, six art pixels from the top and side); `.scene-wheel` at the right (a `WheelCanvas` in a box 40 art pixels square, 28 below 520 px, standing on `WHEEL_STAND`); `.scene-lamp` centred at the top (a one-art-pixel `ink-0` cord and `LAMPS[level]` at scale 2, scale 1 below 520 px), where `level` is `dim` for a light below 0, `flare` at 1 or more, and `normal` otherwise.
  - `h1` in the sign is `--type-4` (`--type-3` below 520 px). The `.heading-wheel` rules go.
  - Sway: `.scene-lamp` runs `sway`, a four-second `steps(1)` animation moving it one art pixel left, centre, right, centre. `.scene.is-still *` has `animation-play-state: paused`.
  - If the title sign needs a text pair not in `PAIRS`, add it to the test and `docs/art-bible.md`; `brass-2` and `paper-1` on `ink-0` are already there.

- [ ] **Step 10: Add the setting's button** in the top bar, before the mute button: `className="button icon-action"`, `aria-pressed={sceneOn}`, title and label `Room animation`, icon `ICONS.lampOn` or `ICONS.lampOff`. It calls `setSceneOn` and updates `sceneOn`.

- [ ] **Step 11: Add parallax.** `Scene` listens for `pointermove` on the window while live and sets `--drift-x` and `--drift-y` on `.app-shell` to whole numbers from -2 to 2, from the pointer's position across the viewport. `.room-wall` translates by `calc(var(--drift-x) * var(--px))` and the same for y; the fixed wall is drawn one diamond repeat larger than the viewport on every side so its edge never shows. On scroll, `.room-wall` also moves up by a tenth of the scroll distance, taken modulo one diamond repeat (48 px) and rounded to an art pixel. When not live the properties are 0.

- [ ] **Step 12: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`, `npm run capture -- phone`, `npm run capture -- reduced`. Expected: all exit 0 (the phone run ends at 360 px). Read the idle, spinning, settled and resized PNGs: the band joins the table's rail with no gap; the wall is visibly lit round the lamp and dimmer during the spin; the sign, lamp and wheel-on-stand do not overlap at 390 or 360 px; top bar, section heading, note and footer text are readable over the fixed wall; in `reduced-1-idle.png` the lamp icon is the unlit one.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add the room's wall, a hanging lamp and an animation setting"
```

---

### Task 4: The croupier

**Files:**
- Create: `src/sprites/croupier.ts`, `src/components/Croupier.tsx`
- Modify: `src/components/Scene.tsx`, `src/App.tsx`, `src/game.css`, `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`

**Interfaces:**
- Consumes: `Reaction`, `Look`, `reactionFor`, `lookFor` (Task 1); `Scene` (Task 3).
- Produces:
  ```ts
  // src/sprites/croupier.ts — every layer is 40 × 34 art pixels, so they stack exactly
  export const BODY: SpriteData        // head, visor, torso; no arms, no eyes
  export const EYES: SpriteData        // 9 × 2: two eyes, drawn apart
  export type Arms = 'rest' | 'raised' | 'tap' | 'shrug' | 'tie'
  export const ARMS: Record<Arms, SpriteData>
  // src/components/Croupier.tsx
  export default function Croupier(props: { reaction: Reaction; look: Look; live: boolean })
  ```
  In `App.tsx`: `const [look, setLook] = useState<Look>(0)`; `placeBet` calls `setLook(lookFor(target))`; `<Scene reaction={reactionFor(moment)} look={look} …>`.

- [ ] **Step 1: Draw the layers** per the spec's "The croupier". `BODY`: an `ink-0` head with a `brass-2` visor edge two art pixels below its top; an `ink-2` waistcoat with `oxblood-1` lapels and three `brass-2` buttons; a `paper-0` shirt front and collar; an `oxblood-1` bow tie. `ARMS`: sleeves in `paper-0` with `smoke-1` shadow, rolled to the forearm; hands in `brass-3` with `brass-1` shadow.
  - `rest`: both hands on the rail, at the bottom row.
  - `raised`: the right hand up beside the head, palm out; the left at rest.
  - `tap`: as `rest` with the right hand two art pixels higher.
  - `shrug`: both forearms turned out, hands four art pixels wider and two higher.
  - `tie`: the right hand at the bow tie.

- [ ] **Step 2: Implement `Croupier`.** Constants at the top: `BLINK = { everyMin: 2500, everyMax: 6000, ms: 120 }`, `GLANCE = { everyMin: 5000, everyMax: 11000, ms: 900 }`, `TIE = { everyMin: 20000, everyMax: 40000, ms: 1100 }`, `LOOK_HOLD_MS = 2500`, `TAP_MS = 140`, `SHRUG_MS = 900`.
  - Arms follow `reaction`: `idle` rests; `noMoreBets` raises; `win` alternates `tap` and `rest` twice at `TAP_MS`, then rests; `loss` shrugs for `SHRUG_MS`, then rests.
  - Eyes sit at an offset of `look` art pixels; a change of `look` holds for `LOOK_HOLD_MS`, then returns to 0. While idle and live, glances pick -1 or 1 at random for `GLANCE.ms`; blinks hide the eyes for `BLINK.ms`; `tie` plays occasionally.
  - Breathing is a CSS `steps(1)` animation moving the figure up one art pixel for half of a four-second cycle.
  - When `live` is false: `rest` arms, eyes at 0, no timers, no breathing. All timers are cleared on change and unmount.

- [ ] **Step 3: Place it** in `Scene`, after the wheel and before the lamp: centred, its bottom row on the band's bottom edge, so the table's rail (the next element down) meets its waist.

- [ ] **Step 4: Show every pose on the styleguide:** a "Croupier" section with the figure at scale 2 once per `Arms` value, on a `Wall`.

- [ ] **Step 5: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`, `npm run capture -- phone`, `npm run capture -- styleguide`. Expected: all exit 0. Read: in `1-idle` the croupier rests both hands on the rail, under the lamp; in `4-spinning` one hand is raised; the styleguide shows five distinct, readable poses with no stray pixels; at 390 and 360 px the croupier clears the sign and the wheel.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add a croupier who watches the bets and reacts to the game"
```

---

### Task 5: Smoke

**Files:**
- Create: `src/lib/smoke.ts`, `src/lib/smoke.test.ts`, `src/components/Smoke.tsx`
- Modify: `src/components/Scene.tsx`, `src/game.css`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/smoke.ts
  export type SmokeToken = 'smoke-0' | 'smoke-1'
  /** The smoke at one art pixel of a `cols` × `rows` band at `seconds`, or undefined for clear air. */
  export function smokeToken(x: number, y: number, seconds: number, cols: number, rows: number): SmokeToken | undefined
  // src/components/Smoke.tsx
  export default function Smoke(props: { live: boolean })
  ```

- [ ] **Step 1: Write the failing tests** in `src/lib/smoke.test.ts`

```ts
const COLS = 120
const ROWS = 80
const field = (seconds: number) => {
  const tokens: (string | undefined)[] = []
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) tokens.push(smokeToken(x, y, seconds, COLS, ROWS))
  return tokens
}

it('is thin: mostly clear air, with some smoke', () => {
  const smoky = field(3).filter(Boolean).length
  expect(smoky).toBeGreaterThan(COLS * ROWS * 0.02)
  expect(smoky).toBeLessThan(COLS * ROWS * 0.3)
})
it('only uses the smoke tokens', () => {
  for (const token of field(3)) expect(['smoke-0', 'smoke-1', undefined]).toContain(token)
})
it('is the same at the same moment and different later', () => {
  expect(field(3)).toEqual(field(3))
  expect(field(4)).not.toEqual(field(3))
})
it('leaves the edges of the band clear', () => {
  for (let y = 0; y < ROWS; y++) {
    expect(smokeToken(0, y, 3, COLS, ROWS)).toBeUndefined()
    expect(smokeToken(COLS - 1, y, 3, COLS, ROWS)).toBeUndefined()
  }
})
it('still behaves after hours of running, and with no room', () => {
  const late = field(40000).filter(Boolean).length
  expect(late).toBeGreaterThan(COLS * ROWS * 0.02)
  expect(late).toBeLessThan(COLS * ROWS * 0.3)
  expect(smokeToken(0, 0, 1, 0, 0)).toBeUndefined()
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/smoke.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `smokeToken`.** Constants: `CELL = 9` (art pixels per noise cell), `RISE = 5` and `DRIFT = 2` (art pixels per second, upward and sideways), `THIN = 0.55` and `THICK = 0.8` (densities at which a pixel becomes `smoke-0` and `smoke-1`). Density is two octaves of value noise (smoothed between `hash` values on a grid of `CELL`), sampled at a position moved by time; time is taken modulo a whole number of cells so large values lose no precision. It is multiplied by an envelope that is 1 in the middle of the band and falls to 0 at the left and right edges and at the bottom. A pixel is smoke where the density exceeds its threshold plus a small `dither` term.

- [ ] **Step 4: Run** the test file. Expected: PASS, 5 tests.

- [ ] **Step 5: Implement `Smoke`** on the pattern of `Felt`: a canvas filling the band, painted with `paint` and `paletteOf(canvas, ['smoke-0', 'smoke-1'])`. `FRAME_MS = 100`. While `live`, an interval repaints with the seconds since it mounted; when not live the canvas is cleared and no interval runs.

- [ ] **Step 6: Place it** in `Scene` after the croupier and before the lamp, with `pointer-events: none`.

- [ ] **Step 7: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`, `npm run capture -- reduced`. Expected: both exit 0. Read `desktop-1-idle.png` (thin dithered wisps in the lamp's light, none at the band's edges, the croupier and sign still readable through them) and `reduced-1-idle.png` (no smoke).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: drift smoke through the lamp light"
```

---

### Task 6: The door and the clockwork

**Files:**
- Create: `src/lib/clock.ts`, `src/lib/clock.test.ts`, `src/components/Fixtures.tsx`
- Modify: `src/sprites/room.ts`, `src/components/Scene.tsx`, `src/game.css`, `src/styleguide/Styleguide.tsx`

**Interfaces:**
- Produces:
  ```ts
  // src/lib/clock.ts
  export const FACE = 11 // art pixels across; odd, so it has a centre pixel
  /** The hands of a clock at a time of day, as a FACE × FACE sprite: the minute hand in `ink-0`, the hour hand in `oxblood-0`. */
  export function clockHands(hours: number, minutes: number): SpriteData
  // src/sprites/room.ts gains
  export const DOOR: SpriteData              // frame and panels; its window is left transparent
  export const DOOR_WINDOW: { x: number; y: number; width: number; height: number } // in art pixels within DOOR
  export const PATRONS: readonly SpriteData[] // two silhouettes, head and shoulders
  export const CLOCK: SpriteData             // the case and a `paper-0` face FACE across; no hands
  export const CLOCK_FACE: { x: number; y: number } // where the face sits within CLOCK
  export const PENDULUM: SpriteData
  export const FAN: readonly SpriteData[]     // four frames
  export const GRAMOPHONE: SpriteData        // horn and box; no record
  export const RECORD: readonly SpriteData[]  // four frames
  // src/components/Fixtures.tsx
  export default function Fixtures(props: { live: boolean })
  ```

- [ ] **Step 1: Write the failing tests** in `src/lib/clock.test.ts`

```ts
const CENTRE = (FACE - 1) / 2
const cells = (hours: number, minutes: number, token: string) =>
  clockHands(hours, minutes).rects.filter((rect) => rect.token === token).flatMap((rect) =>
    Array.from({ length: rect.width }, (_, index) => ({ x: rect.x + index, y: rect.y })),
  )

it('points the minute hand straight up on the hour', () => {
  const minute = cells(3, 0, 'ink-0')
  expect(minute.length).toBeGreaterThan(2)
  for (const cell of minute) expect(cell.x).toBe(CENTRE)
  expect(Math.min(...minute.map((cell) => cell.y))).toBeLessThan(CENTRE - 2)
})
it('points the hour hand right at three and left at nine', () => {
  expect(Math.max(...cells(3, 0, 'oxblood-0').map((cell) => cell.x))).toBeGreaterThan(CENTRE)
  expect(Math.min(...cells(9, 0, 'oxblood-0').map((cell) => cell.x))).toBeLessThan(CENTRE)
})
it('reads afternoon hours like morning ones', () => {
  expect(clockHands(15, 20)).toEqual(clockHands(3, 20))
  expect(clockHands(0, 0)).toEqual(clockHands(12, 0))
})
it('keeps both hands on the face at any time', () => {
  for (const [hours, minutes] of [[0, 0], [12, 0], [23, 59], [6, 30], [10, 10]]) {
    const hands = clockHands(hours, minutes)
    expect(hands.width).toBe(FACE)
    expect(hands.height).toBe(FACE)
    for (const rect of hands.rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(FACE)
      expect(rect.y).toBeGreaterThanOrEqual(0)
      expect(rect.y).toBeLessThan(FACE)
    }
  }
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/clock.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `clockHands`.** The minute hand is four art pixels long and the hour hand three; each is the line of whole pixels from the centre towards its angle. The hour hand's angle includes the minutes. Where the two cross, the minute hand wins. Rows are merged into `SpriteRect`s as `sprite()` merges runs.

- [ ] **Step 4: Run** the test file. Expected: PASS, 4 tests.

- [ ] **Step 5: Draw the fixtures** in `src/sprites/room.ts`, per the spec's "Room life" and the lighting rules.
  - `DOOR`: about 26 × 50, panelled, in the `wood` ramp with an `ink-0` outline and a `brass-2` handle; a transparent window about 14 × 16 in its upper half.
  - `PATRONS`: head-and-shoulders silhouettes about 12 × 16, one in a hat, all in `ink-1`.
  - `CLOCK`: about 15 × 26: a `wood-1` case, a `paper-0` face, a glazed lower door for the pendulum. `PENDULUM`: a `brass-2` bob on a one-art-pixel rod.
  - `FAN`: about 40 × 7, four frames of a two-blade ceiling fan seen from below and to the side: blades at full width, three-quarter, edge-on, three-quarter.
  - `GRAMOPHONE`: about 18 × 20, a `brass` horn over a `wood` box. `RECORD`: about 10 × 3, an `ink-0` disc seen edge-on with a one-pixel `paper-0` glint that moves across in four frames.

- [ ] **Step 6: Implement `Fixtures`.** Constants: `PASS = { everyMin: 8000, everyMax: 20000, stepMs: 160, pauseMs: 1800, pauseOneIn: 3 }`.
  - **Door:** the window is a box behind `DOOR` at `DOOR_WINDOW`, `smoke-0`, clipped. A passing silhouette moves across it one art pixel per `stepMs`, from either side; one in `pauseOneIn` stops in the middle for `pauseMs`.
  - **Clock:** `CLOCK`, with `clockHands` for the local time, recomputed each minute; the pendulum swings through three positions (one art pixel left, centre, right) on a two-second CSS `steps(1)` cycle.
  - **Fan and record:** CSS `steps(1)` cycles through their frames (stack the frames; each is visible for its share of the cycle). Fan: 1.2 s. Record: 0.8 s.
  - With `live` false: no silhouettes, and every cycle paused.
  - Placement in the band: the door at the left behind the sign's right-hand neighbour space, the clock between the sign and the croupier, the fan at the top left of centre, the gramophone on a `wood-2` shelf between the croupier and the wheel. Each fixture is hidden with a container query when the band is too narrow for it not to touch its neighbours: below about 900 px the gramophone and fan go; below about 700 px the clock and door go.

- [ ] **Step 7: Place it** in `Scene`, straight after the wall. The fixtures drift with the pointer by `--drift-x` at half the wall's distance, rounded to an art pixel.

- [ ] **Step 8: Show the fixtures on the styleguide:** door, clock at 10:10, each fan frame, gramophone with record.

- [ ] **Step 9: Verify**

Run: `npm test`, `npm run lint`, `npx tsc -b`. Expected: all pass.
Run: `npm run capture`, `npm run capture -- phone`, `npm run capture -- styleguide`. Expected: all exit 0. Read: on desktop all four fixtures are present, lit from the lamp's side, and none touches the sign, croupier, wheel or lamp; in `desktop-8-resized.png` (700 px) and both phone widths the hidden ones are gone and nothing overlaps; the clock shows the time the capture ran.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add a frosted door, a clock, a fan and a gramophone to the room"
```

---

### Task 7: Thirty idle seconds, and sign-off

**Files:**
- Modify: `scripts/capture.mjs`, `src/styleguide/Styleguide.tsx`, `CLAUDE.md`, `docs/roadmap.md`

- [ ] **Step 1: Add the idle capture.** With the argument `idle`, `scripts/capture.mjs`:
  1. loads the page, records video, and saves `idle-0s.png`, `idle-10s.png`, `idle-20s.png` and `idle-30s.png` without touching the page;
  2. pushes `The page did not move in 30 seconds` to `errors` if all four files are byte-identical;
  3. scrolls to the foot of the page, waits 500 ms, and pushes `The scene kept animating out of view` unless `.scene` has the class `is-still`; scrolls back and pushes `The scene did not resume` if it still has it after 500 ms;
  4. turns on four-times CPU throttling through a CDP session (`Emulation.setCPUThrottlingRate`), measures the gaps between animation frames for five seconds, and prints `Frames at 4x slowdown: average <n> ms, worst <n> ms`;
  5. runs the overflow check, and saves the video as `idle.webm`.
  It works with `phone` too (file names start `phone-idle-`).

- [ ] **Step 2: Run it**

Run: `npm run capture -- idle` and `npm run capture -- idle phone`.
Expected: both exit 0 and print frame times. Read the four desktop stills: the smoke has moved between them, and across the four at least one of the croupier's eyes or arms, a silhouette or the clock's pendulum differs.

If the average frame at four-times slowdown is above 16.7 ms on either size, find the cost with the browser's profiler before changing anything, fix the largest item, and run again. Record the final numbers.

- [ ] **Step 3: Finish the styleguide.** Add the wall at each light level with the lamp at that level, and a smoke sample.

- [ ] **Step 4: Verify everything**

Run: `npm test`, `npm run lint`, `npm run build`. Expected: all pass; first-load JavaScript under 200 kB gzip. Record the figure.
Run: `npm run capture`, `-- phone`, `-- reduced`, `-- idle`, `-- styleguide`, `-- styleguide phone`. Expected: all exit 0. Read every PNG once more against Global Constraints. In the reduced run nothing in the room moves between stills.

- [ ] **Step 5: Document the capture** in `CLAUDE.md`: under Commands, `npm run capture -- idle` records 30 untouched seconds and reports frame times.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "test: capture thirty idle seconds and measure the scene's frame cost"
git push -u origin feat/living-scene
```

- [ ] **Step 7: OWNER GATE.** Ask the owner to open `http://localhost:5173/` and leave it alone for 30 seconds (the phase's "done when"), then play a round and judge: the dim and the flare, the croupier's four reactions and where the eyes go when a chip lands, the smoke, the silhouettes, and the setting's button. Offer `captures/idle.webm` as well. Apply what they ask for and repeat until they approve.

- [ ] **Step 8: Close the phase.** Tick Phase 3 in `docs/roadmap.md`, set "Current phase" to 4, and replace "Notes for next session" with what Phase 4 must know: the room's light is a number from `useRoomLight` that the WebGL layer can read; the setting lives in `src/lib/scene.ts` and Phase 4's effects toggle should join it in a settings panel; the measured frame times and bundle size; the Phase 2 items still open (off-palette flashes, the chip puff, the win burst); and the Phase 7 and Vercel notes carried over. Commit, push, and open a pull request into `main` with `gh pr create`.

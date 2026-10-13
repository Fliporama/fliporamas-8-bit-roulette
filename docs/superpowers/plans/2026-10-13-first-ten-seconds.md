# The First Ten Seconds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a boot sequence, a title card with an attract loop, a ghost-hand tutorial and bet-type previews in front of the game, so a stranger has a chip on the felt within 15 seconds.

**Architecture:** One `stage` value in `App` (`boot`, `title`, `play`). `Boot` and `Title` are layers drawn over the real, running game, which is `inert` until `play`. The pure decisions (which stage a visit starts at, what the hand does, which tiles a bet type lights) live in `src/lib/intro.ts`; the components only draw them.

**Tech Stack:** React 19, TypeScript, `motion/react`, vitest, Playwright through `scripts/capture.mjs`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-13-first-ten-seconds-design.md`. Read it and `docs/art-bible.md` before starting.

## Global Constraints

- Colours are palette tokens only; no hex outside `src/tokens.css`. Text and background pairs must be in `PAIRS` in `src/lib/tokens.test.ts`.
- Every size and offset is a whole multiple of `--px`. Motion on screen layers is stepped (`steps()` or discrete keyframes), never a fade or a smooth gradient.
- Type: display face at `--type-1` to `--type-5`; text face never below `--type-3`.
- Timing and exaggeration values are named constants at the top of the file that uses them.
- Every animation has a reduced-motion path (`useReducedMotion` from `motion/react`).
- The hand is rigid: it never squashes or stretches. The title card is soft: it may overshoot.
- No sound is added in this phase.
- First-load JavaScript stays under 200 kB gzipped (138.6 kB before this phase).
- Conventional Commits, on branch `feat/first-ten-seconds`. End each commit message with the `Co-Authored-By` line the session supplies.
- After each task: `npm test`, `npm run lint` and `npm run build` pass.

## Review Focus

1. **Storage is blocked (private mode).** The full intro plays on every load and nothing throws. Pinned in Task 1.
2. **The press that skips the boot also presses start.** A click or Space during the boot must leave the title showing. Pinned in Task 3 and checked by the capture in Task 8.
3. **A hand target is missing or off screen** (phone: the chip tray sits below the fold). That step is skipped; if no target is visible the hand is not drawn. Pinned in Task 5.
4. **The window is resized or rotated mid-demo.** The hand measures its target at the start of every step, so the next step lands correctly. Pinned in Task 5.
5. **Replay intro is pressed mid-spin.** The round is reset and the wheel overlay is gone before the boot shows. Pinned in Task 7.

---

### Task 1: The intro's decisions (`src/lib/intro.ts`)

**Files:**
- Create: `src/lib/intro.ts`
- Test: `src/lib/intro.test.ts`

**Interfaces:**
- Consumes: `createInsideTarget(kind, selection)` and `InsideBetKind` from `src/lib/roulette.ts`.
- Produces:

```ts
export type Stage = 'boot' | 'title' | 'play'
/** `search` is location.search. `/?play` wins; then reduced motion or a seen intro start at the title. */
export function firstStage(search: string, seen: boolean, reducedMotion: boolean): Stage
/** Whether the hand's tutorial run is owed: not seen, and not opened with `?play`. */
export function owesHand(search: string, seen: boolean): boolean
export function introSeen(): boolean      // localStorage 'fliporama-intro' === '1'; false if storage throws
export function markIntroSeen(): void     // swallows a storage error
export function forgetIntro(): void       // swallows a storage error

export interface HandStep { target: string; ms: number } // a CSS selector, and how long the hand stays
export const HAND_STEPS: readonly HandStep[] = [
  { target: '[data-chip="25"]', ms: 900 },
  { target: '[data-spot="n17"]', ms: 900 },
  { target: '.spin-button', ms: 1200 },
]
export const HAND_REST_MS = 1500
export const ATTRACT_AFTER_MS = 8000
export const PREVIEW_MS = 1000
/** The numbers an example bet of each kind covers. */
export const PREVIEW_EXAMPLE: Record<InsideBetKind, readonly number[]>
```

`PREVIEW_EXAMPLE` is built at module load with `createInsideTarget`: straight from `[17]`, split from `[17, 20]`, street from `[17]`, six-line from `[17]`.

- [ ] **Step 1: Write the failing tests**

```ts
describe('firstStage', () => {
  it('boots on a first visit', () => expect(firstStage('', false, false)).toBe('boot'))
  it('opens on the title once seen', () => expect(firstStage('', true, false)).toBe('title'))
  it('never boots under reduced motion', () => expect(firstStage('', false, true)).toBe('title'))
  it('opens the game for ?play', () => {
    expect(firstStage('?play', false, false)).toBe('play')
    expect(firstStage('?x=1&play', true, true)).toBe('play')
  })
})

describe('owesHand', () => {
  it('is owed on a first visit, with or without motion', () => expect(owesHand('', false)).toBe(true))
  it('is not owed once seen or under ?play', () => {
    expect(owesHand('', true)).toBe(false)
    expect(owesHand('?play', false)).toBe(false)
  })
})

describe('the stored flag', () => {
  // vi.stubGlobal('localStorage', ...) with a Map-backed stub, then one whose methods throw.
  it('remembers and forgets', () => { markIntroSeen(); expect(introSeen()).toBe(true); forgetIntro(); expect(introSeen()).toBe(false) })
  it('reads as not seen, and does not throw, when storage is blocked', () => {
    expect(introSeen()).toBe(false); expect(markIntroSeen).not.toThrow(); expect(forgetIntro).not.toThrow()
  })
})

describe('the examples', () => {
  it('cover what each bet covers', () => {
    expect(PREVIEW_EXAMPLE.straight).toEqual([17])
    expect(PREVIEW_EXAMPLE.split).toEqual([17, 20])
    expect(PREVIEW_EXAMPLE.street).toEqual([16, 17, 18])
    expect(PREVIEW_EXAMPLE.sixLine).toEqual([13, 14, 15, 16, 17, 18])
  })
})

it('every hand step names a target and a wait', () => {
  for (const step of HAND_STEPS) { expect(step.target).not.toBe(''); expect(step.ms).toBeGreaterThan(0) }
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/intro.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `src/lib/intro.ts`** to the interface above. Unlike `scene.ts` and `effects.ts`, read storage inside the functions, not at module load, so the tests can stub it.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat: decide the intro's stage, hand steps and bet examples`

---

### Task 2: The stage, the title card and `/?play`

**Files:**
- Create: `src/components/Title.tsx`
- Modify: `src/App.tsx`, `src/game.css`, `scripts/capture.mjs`, `scripts/perf/{grid,idle,profile,round,win}.mjs`

**Interfaces:**
- Consumes: `Stage`, `firstStage`, `introSeen` from Task 1.
- Produces: `<Title onStart={() => void} />`; in `App`, `const [stage, setStage] = useState<Stage>(...)` and `function start()` which sets the stage to `play`.

- [ ] **Step 1: Point every script at the game.** In `capture.mjs`, `captureIdle` and `captureRound` open `` `${url}?play` ``. In the five perf scripts, append `?play` to the URL passed to `page.goto`. `shot.mjs` takes its query from the command line and is left alone.
- [ ] **Step 2: Add the stage to `App`.** Initial value `firstStage(location.search, introSeen(), reduced)`, where `reduced` is read once with `matchMedia('(prefers-reduced-motion: reduce)').matches` in the initialiser (the hook's value is not ready on the first render). Until Task 3 exists, treat `boot` as `title` when rendering.
  - `<header>`, `<main>` and `<footer>` get `inert={stage !== 'play'}`.
  - The light: `useRoomLight(stage === 'play' ? lightFor(moment) : 'dim', sceneOn)`.
  - Render `{stage === 'title' && <Title onStart={start} />}` inside `.app-shell`, before `<Particles>` so the particle and screen layers draw over it.
- [ ] **Step 3: Write `Title.tsx`.** A `<div className="title-card" role="dialog" aria-modal="true" aria-label="Fliporama Roulette">` holding: `<p className="title-logo">ROULETTE</p>`, `<button className="title-start" autoFocus>PRESS START</button>`, `<p className="title-note">FREE PLAY / NO CASH VALUE</p>`. A click anywhere on the card calls `onStart`.
- [ ] **Step 4: Style it in `game.css`.** Fixed, centred, above the game and below the particle and screen layers. Logo: display face, `--type-5` (`--type-4` below 760 px), `brass-3` with a hard `ink-0` shadow one `--px` down. Card ground `ink-0` with a `--px` `brass-1` border. Start: display face, `lamp-0` on `ink-0`, blinking with `steps(1)` at 1 s; no blink under `prefers-reduced-motion`. Note: text face, `--type-3`, `smoke-2` on `ink-0`. All three pairs are already in `PAIRS`.
- [ ] **Step 5: Verify.** `npm run dev`, then `npm run capture` and `npm run capture -- idle`: both pass as before (they use `?play`). Open `http://localhost:5173/` by script (`node scripts/perf/shot.mjs "" body captures/title.png`) and read `captures/title.png`: the card shows over a dim room.
- [ ] **Step 6: Commit** `feat: open on a title card over the dimmed room`

---

### Task 3: The boot

**Files:**
- Create: `src/components/Boot.tsx`
- Modify: `src/App.tsx`, `src/components/Title.tsx`, `src/game.css`

**Interfaces:**
- Consumes: `useSkip` from `src/lib/useSkip.ts`.
- Produces: `<Boot onDone={() => void} />`. `App` renders it when `stage === 'boot'` and `onDone` sets the stage to `title`.

- [ ] **Step 1: Write `Boot.tsx`.** Constants at the top:

```ts
const BLACK_MS = 300    // nothing
const LINE_MS = 250     // the line snaps across
const OPEN_MS = 400     // it opens to full height, in OPEN_STEPS hard steps
const OPEN_STEPS = 4
const FLICKER_MS = 120
const CHECK_MS = 1200   // FLIPORAMA and the row of blocks filling, CHECK_BLOCKS of them
const CHECK_BLOCKS = 8
// about 2.5 s in all, as the spec asks
```

One `phase` state stepped by timers (`black`, `line`, `open`, `flicker`, `check`), then `onDone`. `useSkip(onDone)`. The layer is `<div className="boot" data-phase={phase} aria-hidden="true">`; CSS draws each phase. Clear the timers on unmount.
- [ ] **Step 2: Style it.** `.boot` is fixed, full screen, `ink-0`, above the title's layer and below the screen-effects canvas so scanlines fall on it. The line is one `--px` tall in `lamp-0`; it opens with `steps(4)`. The check line is `brass-2` display type at `--type-3`; blocks are `--px`-multiple squares in `brass-2`.
- [ ] **Step 3: Guard the title against the skipping press.** In `Title.tsx` add `const GUARD_MS = 300`: `onStart` is ignored until that long after mount. *Why:* `useSkip` fires on `pointerdown` and `keydown`; the `click` or the Space key-up that follows would land on the title and start the game in the same press.
- [ ] **Step 4: Verify.** With the dev server up, in a Playwright one-off (or by extending the capture in Task 8): load `/`, click at 500 ms, wait 200 ms: `.boot` is gone and `.title-card` is present. Load again, do nothing for 3 s: `.title-card` is present.
- [ ] **Step 5: Commit** `feat: power the screen on before the title`

---

### Task 4: The transition into play

**Files:**
- Modify: `src/lib/particles.ts`, `src/lib/particles.test.ts`, `src/components/Title.tsx`, `src/App.tsx`, `src/game.css`

**Interfaces:**
- Produces: `Burst` gains `'start'`. `Title` calls `onStart` when its exit has finished, not when it is pressed.

- [ ] **Step 1: Failing test** in `particles.test.ts`:

```ts
it('a start burst is sparks only', () => {
  const sparks = burst('start', 0, 0)
  expect(sparks).toHaveLength(16)
  expect(sparks.every((spark) => spark.chip === undefined && spark.token.startsWith('lamp-'))).toBe(true)
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/particles.test.ts`. Expected: FAIL.
- [ ] **Step 3: Add the kind** to `BURSTS`: `start: [{ count: 16, tokens: SPARKS, size: 1, across: 180, up: [80, 260], life: [0.4, 0.7] }]`. Run again: PASS.
- [ ] **Step 4: The lift.** In `Title.tsx`, make the card a `motion.div`. On press: `emit('start', x, y)` at the centre of the start button, then animate `y` through `[0, DIP, -window.innerHeight]` (`const DIP = 12`, `const LIFT_MS = 450`, times `[0, 0.25, 1]`), then call `onStart`. No opacity change. With `useReducedMotion()`: call `onStart` at once.
- [ ] **Step 5: Hand over focus.** In `App.start()`, after setting the stage, focus the first chip: `document.querySelector<HTMLElement>('.chip-choice')?.focus()` inside a `useEffect` keyed on `stage === 'play'` that skips the first render when the page opened with `?play`.
- [ ] **Step 6: Verify.** `data-light` on `#game` reads `dim` on the title and `normal` 400 ms after the press (`useRoomLight` already steps it). Read a still taken 150 ms after the press: the card is on its way up and sparks are in the air.
- [ ] **Step 7: Commit** `feat: lift the title away and bring the lamp up`

---

### Task 5: The ghost hand

**Files:**
- Create: `src/sprites/hand.ts`, `src/components/GhostHand.tsx`
- Modify: `src/App.tsx`, `src/game.css`

**Interfaces:**
- Consumes: `HAND_STEPS`, `HAND_REST_MS`, `ATTRACT_AFTER_MS`, `owesHand`, `markIntroSeen`, `introSeen` from Task 1; `sprite()` from `src/lib/sprite.ts`; `Sprite`; `useLive`.
- Produces: `export const HAND: SpriteData`; `<GhostHand delayMs={number} />`, which loops while mounted.

- [ ] **Step 1: Draw `HAND`** with `sprite()`: a pointing hand about 12 by 16 art pixels, index finger up and to the left so its tip is the sprite's top-left corner. `paper-1` skin, `paper-0` shade along the bottom edge, `ink-0` outline one pixel wide, a `brass-2` cuff.
- [ ] **Step 2: Write `GhostHand.tsx`.** Constants: `const TRAVEL_MS = 500`, `const ARC = 36` (px the path rises at its middle), `const PRESS = 3` (px the hand drops on a tap), `const TAP_MS = 140`.
  - A fixed, full-screen `<div className="ghost-hand" aria-hidden="true">` with `pointer-events: none`, holding one `motion.div` with `<Sprite data={HAND} />`.
  - After `delayMs`, loop over `HAND_STEPS`. At the start of **each** step, find the target with `document.querySelector` and measure it with `getBoundingClientRect()`. If there is no element, or its centre is outside the viewport, skip the step. If every step in a pass was skipped, hide the hand and try again after `HAND_REST_MS`.
  - Travel: animate `x` and `y` to the target's centre with the `y` keyframes passing through the midpoint raised by `ARC`. Tap: drop by `PRESS` and back over `TAP_MS`, and set `data-tapped` on the target element for the step's `ms`, then remove it. (A data attribute, not a class: React rewrites `className` on these elements.)
  - Reduced motion: no travel and no press; set the position outright at each step.
  - Stop the loop while `useLive(ref, true)` is false, and on unmount remove any `data-tapped` left behind.
- [ ] **Step 3: Style.** `.ghost-hand` sits above the game and below the title card. `[data-tapped]` gets a `--px` `lamp-0` outline that blinks once with `steps(1)`; still under reduced motion.
- [ ] **Step 4: Mount it in `App`.**
  - `const [handOwed, setHandOwed] = useState(() => owesHand(location.search, introSeen()))`.
  - On the title: `<GhostHand delayMs={ATTRACT_AFTER_MS} />`, for every visitor.
  - In play while `handOwed`: `<GhostHand delayMs={600} />`, and a one-time `pointerdown` and `keydown` listener on `<main>` that calls `markIntroSeen()` and `setHandOwed(false)`.
- [ ] **Step 5: Verify.**
  - Desktop, empty storage: after the press, stills at 1.2 s, 2.4 s and 3.6 s show the hand at the 25 chip, at 17 and at the spin button, each with its outline. Click a chip: the hand is gone; reload: it does not come back.
  - Title left for 10 s: the hand is moving behind the card.
  - At 390 px wide no error is logged, whichever targets are off screen.
  - Resize from 1440 to 700 px mid-loop: the next step lands on its target.
- [ ] **Step 6: Commit** `feat: show the game's loop with a ghost hand`

---

### Task 6: Bet-type previews

**Files:**
- Modify: `src/components/RouletteTable.tsx`, `src/App.tsx`, `src/game.css`

**Interfaces:**
- Consumes: `PREVIEW_EXAMPLE`, `PREVIEW_MS` from Task 1.
- Produces: `RouletteTable` prop `preview: readonly number[]`; a pocket whose number is in it gets the class `is-preview`.

- [ ] **Step 1:** Add the prop and the class in `RouletteTable.tsx`.
- [ ] **Step 2:** In `App`, `const [preview, setPreview] = useState<readonly number[]>([])` and `const previewed = useRef(new Set<InsideBetKind>())`. In `chooseMode`, if the mode is not in the set: add it, `setPreview(PREVIEW_EXAMPLE[nextMode])`, and clear it after `PREVIEW_MS` (keep the timer in a ref; clear it when another mode is picked and on unmount). Placing a bet clears the preview at once.
- [ ] **Step 3:** Style `.pocket.is-preview`: a `--px` inset `lamp-0` outline and a one-step-up face, pulsing twice with `steps(2)`; held still under reduced motion.
- [ ] **Step 4: Verify** with a one-off Playwright script against `/?play`: click "Street", and within 300 ms exactly the pockets `n16`, `n17`, `n18` have `is-preview`; after 1.3 s none do; click "Straight" then "Street" again: none do.
- [ ] **Step 5: Commit** `feat: light the tiles a bet type covers the first time it is picked`

---

### Task 7: Replay intro

**Files:**
- Modify: `src/components/Settings.tsx`, `src/App.tsx`, `src/game.css`

**Interfaces:**
- Consumes: `forgetIntro` from Task 1; `resetSession` in `App`.
- Produces: `Settings` prop `onReplay: () => void`.

- [ ] **Step 1:** In `Settings.tsx`, below the three choices: `<button className="button" type="button" popoverTarget={id} popoverTargetAction="hide" onClick={onReplay}>Replay intro</button>`. The browser closes the panel.
- [ ] **Step 2:** In `App`, `replayIntro()`: `forgetIntro()`, `resetSession()`, `previewed.current.clear()`, `setHandOwed(true)`, `setStage(reducedMotion ? 'title' : 'boot')`.
- [ ] **Step 3: Verify** with a one-off script against `/?play`: place a bet, spin, and 1 s into the spin open settings and press "Replay intro". Expected: `.boot` is present, no wheel overlay is in the page, and after the press on the title the bank reads 1,000 with no bets.
- [ ] **Step 4: Commit** `feat: replay the intro from settings`

---

### Task 8: The intro capture, the checks and the hand-over

**Files:**
- Modify: `scripts/capture.mjs`, `CLAUDE.md`, `docs/roadmap.md`

- [ ] **Step 1: Add `captureIntro()`** to `capture.mjs`, run by `npm run capture -- intro` (file prefix `intro`, or `phone-intro`, `reduced-intro`). Three loads in one context:
  1. **The fast path.** Record `started = Date.now()` and open `url` with empty storage. Stills at 400 ms (`1-boot-line`) and 1500 ms (`2-boot-check`). Wait for the `PRESS START` button; still (`3-title`); check `data-light` is `dim`. Press it; still at 150 ms (`4-lift`); still at 2500 ms (`5-hand`). Click `[data-chip="25"]`, then `[data-spot="n17"]`. If `Date.now() - started` is over 15 000, or `.bet-line` does not count 1, push an error. Check `data-light` is `normal`. Still (`6-first-bet`). `checkOverflow()`.
  2. **The skipping press.** Reload (storage is now marked, so clear it first with `localStorage.clear()`), click the middle of the page at 500 ms, wait 200 ms: push an error unless `.title-card` is present and `.boot` is absent.
  3. **Attract.** Wait 10 s on the title; still (`7-attract`); push an error if `.ghost-hand` is not in the page.

  With `reduced`: on load 1, push an error if `.boot` is ever present, skip the boot stills, and skip load 2.
  Add the `intro` line to the comment at the top of the file.
- [ ] **Step 2: Run everything.**

```powershell
npm test; npm run lint; npm run build
npm run capture; npm run capture -- phone; npm run capture -- reduced; npm run capture -- idle
npm run capture -- intro; npm run capture -- intro phone; npm run capture -- intro reduced
```

Expected: all exit 0. Read every `captures/intro*-*.png` and check each against the art bible: tokens only, whole art pixels, no smoothing.
- [ ] **Step 3: Budgets.** From the `npm run build` output, total the gzipped JavaScript of the first load: under 200 kB. With `npx vite preview` running, run `node scripts/perf/idle.mjs` and `node scripts/perf/round.mjs` twice each and record the numbers; they should match the table in `docs/roadmap.md` (both use `?play`).
- [ ] **Step 4: Ask the owner to look.** The boot, the lift and the hand are motion; the owner judges them by eye. Give them `http://localhost:5173/` and `captures/intro.webm`, and change timings on their word before going on.
- [ ] **Step 5: Docs.** In `CLAUDE.md`, add `npm run capture -- intro` and `/?play` to the Commands notes. In `docs/roadmap.md`: tick Phase 5 with the date, set "Current phase" to 6, and rewrite "Notes for next session" (what Phase 5 left: the stage and where it lives, `/?play`, the hand's steps as data, `start` particles; what Phase 6 should pick up: sound for the boot, the start press and the hand's taps; what Phase 7 inherits: on a phone the hand's chip-tray step is skipped because the tray is below the fold; anything the owner asked to change).
- [ ] **Step 6: Commit** `docs: mark phase 5 done and move to phase 6`, push the branch, and open a pull request into `main`. The owner merges.

# Roulette Wheel and Win Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a spin overlay with a wheel whose ball lands on the result, and a Balatro-style win tally with sound, to Fliporama Roulette.

**Architecture:** Three small pure/utility modules (`wheel.ts`, `tally.ts`, `sound.ts`) carry everything that can be unit-tested. `App.tsx` swaps its `isSpinning` flag and timer for a `betting → spinning → tallying` phase and settles the balance the moment spin is pressed; two presentational components (`RouletteWheel`, `WinTally`) play each phase and report back through callbacks.

**Tech Stack:** React 19, TypeScript, Vite, Vitest (node environment, no DOM), `motion` (`motion/react`), Web Audio API, plain CSS.

**Spec:** `docs/superpowers/specs/2026-10-02-wheel-and-win-animations-design.md`

## Global Constraints

- `src/lib/roulette.ts` is not modified. Result selection (`randomPocket`) and payouts (`calculateReturns`) stay as they are.
- `motion` is the only new dependency.
- Keep the retro look: existing palette variables in `src/game.css` (`--gold`, `--coral`, `--mint`, `--felt`, `--ink`, `--paper`), `--pixel` font for numerals, stepped easing (`steps(...)`) for CSS keyframes.
- Every duration is a named constant at the top of the file that uses it.
- Every timer and listener a component starts is cleared in its effect cleanup.
- There is no DOM test environment. Component behaviour is verified by hand in the browser (`npm run dev`); do not add jsdom or a testing library.
- Each task ends with `npx tsc -b`, `npm run lint` and `npm test` passing.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. **Skip pressed twice, or a key held down:** the round must finish exactly once. Guarded in Tasks 4 and 5 (a `done` ref; `event.repeat` ignored) and checked by hand in each.
2. **Reset pressed mid-spin or mid-tally:** no late callback may touch state after the component unmounts, and the balance must read 1,000. Checked by hand in Tasks 4 and 5.
3. **Many winning bets at once (15 or more):** the tally must not drag. Pinned by the `stepDuration` test in Task 2.
4. **Storage blocked or Web Audio missing:** the game must play silently without throwing. Pinned by the `sound.test.ts` cases in Task 3, which run in node where neither exists.
5. **Spin started with the Enter or Space key:** that same key press must not skip the animation it started. Checked by hand in Task 4.

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/wheel.ts` | new | Pocket order and pocket angles |
| `src/lib/tally.ts` | new | Scoring steps, win tier, step pacing |
| `src/lib/sound.ts` | new | Synth blips and the mute setting |
| `src/lib/useSkip.ts` | new | One hook: call a handler on click or Space/Enter/Escape |
| `src/components/RouletteWheel.tsx` | new | Spin overlay |
| `src/components/WinTally.tsx` | new | Tally banner, burst, loss treatment |
| `src/components/CountUp.tsx` | new | A number that animates to its new value |
| `src/App.tsx` | modify | Phase state, round state, mute button |
| `src/components/RouletteTable.tsx` | modify | `scoring` and `losing` props |
| `src/game.css` | modify | Styles for all of the above |

---

### Task 1: Wheel geometry

**Files:**
- Create: `src/lib/wheel.ts`
- Test: `src/lib/wheel.test.ts`

**Interfaces:**
- Produces:
  - `WHEEL_ORDER: readonly number[]`
  - `POCKET_ARC: number` (`360 / 37`)
  - `pocketAngle(number: number): number` — degrees clockwise from the top of the wheel to the centre of that pocket

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { POCKET_ARC, WHEEL_ORDER, pocketAngle } from './wheel'

describe('wheel geometry', () => {
  it('holds every pocket from 0 to 36 exactly once, starting at zero', () => {
    expect(WHEEL_ORDER).toHaveLength(37)
    expect([...WHEEL_ORDER].sort((a, b) => a - b)).toEqual(Array.from({ length: 37 }, (_, i) => i))
    expect(WHEEL_ORDER.slice(0, 4)).toEqual([0, 32, 15, 19])
    expect(WHEEL_ORDER.at(-1)).toBe(26)
  })

  it('places each pocket one arc further clockwise', () => {
    expect(pocketAngle(0)).toBe(0)
    expect(pocketAngle(32)).toBeCloseTo(POCKET_ARC)
    expect(pocketAngle(26)).toBeCloseTo(360 - POCKET_ARC)
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/wheel.test.ts`
Expected: FAIL, cannot resolve `./wheel`

- [ ] **Step 3: Implement `src/lib/wheel.ts`**

`WHEEL_ORDER` is exactly:
`0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26`

`pocketAngle` is `WHEEL_ORDER.indexOf(number) * POCKET_ARC`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/wheel.test.ts`
Expected: PASS, 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/wheel.ts src/lib/wheel.test.ts
git commit -m "feat: add roulette wheel pocket geometry"
```

---

### Task 2: Tally builder

**Files:**
- Create: `src/lib/tally.ts`
- Test: `src/lib/tally.test.ts`

**Interfaces:**
- Consumes from `src/lib/roulette.ts`: `BetPlacement`, `BetTarget`, `calculateReturns`, `createInsideTarget`, `createOutsideTarget`
- Produces:
  - `type WinTier = 'none' | 'small' | 'big' | 'huge'`
  - `interface TallyStep { target: BetTarget; stake: number; payout: number; runningTotal: number }`
  - `interface Tally { steps: TallyStep[]; returned: number; tier: WinTier }`
  - `buildTally(result: number, bets: readonly BetPlacement[]): Tally`
  - `stepDuration(stepCount: number): number` — milliseconds per tally step

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { calculateReturns, createInsideTarget, createOutsideTarget } from './roulette'
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
    expect(tally.returned).toBe(calculateReturns(7, bets))
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/tally.test.ts`
Expected: FAIL, cannot resolve `./tally`

- [ ] **Step 3: Implement `src/lib/tally.ts`**

Tier thresholds, from `returned / total staked`: `0` returned is `none`; under `2` is `small`; under `10` is `big`; otherwise `huge`. `Array.prototype.sort` is stable, so sorting winners by `payout` keeps placement order on ties. `stepDuration` is `2500 / stepCount` clamped to `[60, 500]`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/tally.test.ts`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/tally.ts src/lib/tally.test.ts
git commit -m "feat: add win tally builder with tiers and pacing"
```

---

### Task 3: Sound and the mute button

**Files:**
- Create: `src/lib/sound.ts`
- Test: `src/lib/sound.test.ts`
- Modify: `src/App.tsx` (top bar, inside `.session-status`), `src/game.css`

**Interfaces:**
- Produces:
  - `type SoundName = 'ballClick' | 'tick' | 'win' | 'bigWin' | 'loss'`
  - `play(name: SoundName, step?: number): void`
  - `tickFrequency(step: number): number`
  - `isMuted(): boolean`
  - `setMuted(value: boolean): void`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest'
import { isMuted, play, setMuted, tickFrequency } from './sound'

describe('sound', () => {
  it('raises the tick one semitone per step and tops out an octave up', () => {
    expect(tickFrequency(0)).toBe(440)
    expect(tickFrequency(12)).toBeCloseTo(880)
    expect(tickFrequency(40)).toBeCloseTo(880)
    expect(tickFrequency(3)).toBeGreaterThan(tickFrequency(2))
  })

  it('works with no localStorage and no Web Audio', () => {
    expect(isMuted()).toBe(false)
    setMuted(true)
    expect(isMuted()).toBe(true)
    setMuted(false)
    expect(() => play('tick', 3)).not.toThrow()
    expect(() => play('bigWin')).not.toThrow()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/lib/sound.test.ts`
Expected: FAIL, cannot resolve `./sound`

- [ ] **Step 3: Implement `src/lib/sound.ts`**

- The muted flag lives in a module variable, initialised from `localStorage['fliporama-muted'] === '1'` and written back on `setMuted`. Both storage accesses are wrapped in try/catch.
- `tickFrequency(step)` is `440 * 2 ** (Math.min(step, 12) / 12)`.
- `play` returns at once when muted or when `globalThis.AudioContext` is undefined. Otherwise it lazily creates one shared `AudioContext`, calls `resume()` on it, and plays square-wave notes with a short gain ramp to zero.
- Notes (frequency Hz, length ms):

| Name | Notes |
|---|---|
| `ballClick` | 1200, 25 ms |
| `tick` | `tickFrequency(step ?? 0)`, 70 ms |
| `win` | 523 then 659, 90 ms each |
| `bigWin` | 523, 659, 784, 1047, 90 ms each |
| `loss` | 196 then 147, 140 ms each |

- Peak gain `0.06` for every note.

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run src/lib/sound.test.ts`
Expected: PASS, 2 tests

- [ ] **Step 5: Add the mute button to `src/App.tsx`**

State: `const [muted, setMutedState] = useState(isMuted)`. The button goes last inside `.session-status`, uses the existing `icon-action` class and the `Volume2` / `VolumeX` icons from `lucide-react` at `size={15}`, has `aria-pressed={muted}`, and its `aria-label` and `title` are `Mute sound` when unmuted and `Unmute sound` when muted. Clicking it calls `setMuted(!muted)` and updates the state.

- [ ] **Step 6: Verify by hand**

Run: `npm run dev`. The button appears at the right of the top bar and toggles its icon. Reload the page: the muted state is remembered.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sound.ts src/lib/sound.test.ts src/App.tsx src/game.css
git commit -m "feat: add synth sound module and mute button"
```

---

### Task 4: Round phases and the wheel overlay

**Files:**
- Create: `src/components/RouletteWheel.tsx`, `src/lib/useSkip.ts`
- Modify: `src/App.tsx`, `src/game.css`, `package.json`

**Interfaces:**
- Consumes: `WHEEL_ORDER`, `POCKET_ARC`, `pocketAngle` (Task 1); `buildTally`, `Tally` (Task 2); `play` (Task 3); `getPocketColor` from `roulette.ts`
- Produces:
  - `useSkip(handler: () => void): void` — while mounted, calls `handler` on a window `pointerdown`, or a window `keydown` of Space, Enter or Escape with `event.repeat` false
  - `<RouletteWheel result={number} onLanded={() => void} />`
  - In `App.tsx`: `type Phase = 'betting' | 'spinning' | 'tallying'`; state `phase`; state `round: { result: number; tally: Tally; staked: number } | undefined`; `finishRound()`; derived `shownBalance`

- [ ] **Step 1: Install the dependency**

Run: `npm install motion`
Expected: `motion` appears under `dependencies` in `package.json`.

- [ ] **Step 2: Replace `isSpinning` and the timer in `src/App.tsx`**

- Remove `isSpinning`, `spinTimer` and the unmount effect that clears it.
- `const isLocked = phase !== 'betting'` replaces every use of `isSpinning`.
- `spin()`: returns if locked or there are no bets. Otherwise picks `result = randomPocket()`, builds `tally = buildTally(result, bets)`, credits `tally.returned` to `balance` immediately, sets `round = { result, tally, staked: totalStake }`, sets the message to `THE WHEEL IS SPINNING`, and sets `phase` to `'spinning'`.
- `shownBalance = balance - (round?.tally.returned ?? 0)`. The bankroll panel renders `shownBalance`, not `balance`.
- `finishRound()`: sets `lastSpin` to `{ number: round.result, change: round.tally.returned - round.staked }`, clears `bets` and `pendingSplit`, sets the same win or no-win message as today, clears `round`, and sets `phase` to `'betting'`.
- `resetSession()` also clears `round` and sets `phase` to `'betting'`.
- While `phase === 'spinning'`, render `<RouletteWheel result={round.result} onLanded={finishRound} />` inside `<AnimatePresence>`. (Task 5 changes `onLanded` to start the tally.)

- [ ] **Step 3: Implement `src/lib/useSkip.ts`**

One effect that adds and removes the two window listeners. Keep the latest handler in a ref so the listeners are attached once.

- [ ] **Step 4: Implement `src/components/RouletteWheel.tsx`**

Constants: `SPIN_MS = 4500`, `DROP_AT = 0.8`, `HOLD_MS = 800`.

Structure, all `aria-hidden`:

- `.wheel-overlay`: fixed, full screen, dimmed background, springs in and shrinks out (`initial`/`animate`/`exit` on scale and opacity).
- `.wheel`: a square of `min(78vmin, 520px)`, a `motion.div` that rotates.
  - An `<svg viewBox="-100 -100 200 200">` with 37 wedges from `WHEEL_ORDER`, each `POCKET_ARC` wide, between radius 62 and 92, filled from `getPocketColor`; the pocket number at radius 80, rotated to face outward; a gold rim at radius 96 and a hub at radius 30.
  - `.ball-arm`: a `motion.div` filling the wheel that rotates, containing `.ball`, a `motion.div` at the top centre whose distance from the centre animates.

Because the ball arm is a child of the rotating wheel, its rotation is relative to the wheel. No on-screen angle maths is needed, and once the arm stops the ball rides round with the wheel.

Motion, with `laps = 5 + Math.floor(Math.random() * 3)` and `wheelTurn = 540 + Math.random() * 360`, both chosen once on mount:

- Wheel: rotate from `0` to `wheelTurn` over `SPIN_MS`, ease-out.
- Ball arm: rotate from `0` to `pocketAngle(result) - 360 * laps` over `SPIN_MS * DROP_AT`, ease-out.
- Ball: stays on the track at radius 96 until `SPIN_MS * 0.55`, then moves in to radius 70 by `SPIN_MS * DROP_AT` through keyframes `96 → 74 → 80 → 70 → 73 → 70` (two bounces).
- Ball clicks: in the arm's `onUpdate`, call `play('ballClick')` whenever `Math.floor(angle / POCKET_ARC)` changes, at most once every 40 ms.

Stages: `'rolling'` then `'landed'`. The wheel animation completing moves to `'landed'`, which shows `.wheel-result` (the winning number, large, in its pocket colour) and starts a `HOLD_MS` timeout that calls `onLanded`. `useSkip`: when rolling, jump every animated value to its end and move to `'landed'`; when landed, call `onLanded` now. A `done` ref makes sure `onLanded` is called once. Clear the timeout on unmount.

Reduced motion (`useReducedMotion()` from `motion/react`): render only the overlay and `.wheel-result` with a fade, wait `HOLD_MS`, call `onLanded`.

- [ ] **Step 5: Add the styles to `src/game.css`**

`.wheel-overlay` (fixed, `inset: 0`, `z-index: 10`, `background: rgb(8 14 13 / 82%)`, centred grid), `.wheel`, `.ball-arm` (`position: absolute; inset: 0`), `.ball` (a `--paper` circle about 4.5% of the wheel's width with a dark `box-shadow`), `.wheel-result` (`--pixel` font, about 48px, gold border, centred over the hub).

- [ ] **Step 6: Run the automated checks**

Run: `npx tsc -b && npm run lint && npm test`
Expected: no type or lint errors; all tests pass.

- [ ] **Step 7: Verify by hand**

Run: `npm run dev`, then check each of these:

- Place a bet and spin. The wheel appears, the ball circles against the wheel, drops with two bounces, and sits in a pocket. The number under the ball matches the large result number and the "Last spin" panel.
- Spin ten times. The ball is in the announced pocket every time.
- The bankroll shows the pre-win figure during the spin and the new figure after.
- Click during the spin: it jumps to the landed state. Click again: the overlay leaves.
- Tab to the spin button and press Enter, and again with Space. The spin plays in full; it is not skipped by the key press that started it.
- Hold Escape down during a spin. The round finishes once: one entry in "Last spin", balance changed once.
- During a spin, Tab to the reset button and press Enter. The overlay leaves, the balance reads 1,000, betting is unlocked, and no error appears in the console.
- Turn on reduced motion in the OS or DevTools rendering panel. A spin shows a short fade with the number and no wheel.
- Ball clicks are audible and slow down with the ball; muting silences them.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/App.tsx src/lib/useSkip.ts src/components/RouletteWheel.tsx src/game.css
git commit -m "feat: add spin phases and roulette wheel overlay"
```

---

### Task 5: Win tally

**Files:**
- Create: `src/components/WinTally.tsx`, `src/components/CountUp.tsx`
- Modify: `src/App.tsx`, `src/components/RouletteTable.tsx`, `src/game.css`

**Interfaces:**
- Consumes: `Tally`, `TallyStep`, `stepDuration` (Task 2); `play` (Task 3); `useSkip`, `phase`, `round`, `finishRound`, `shownBalance` (Task 4); `formatChips` from `roulette.ts`
- Produces:
  - `<CountUp value={number} />` — renders `formatChips` of a value that animates to each new `value` over 600 ms; snaps under reduced motion
  - `<WinTally tally={Tally} onStep={(step: TallyStep | undefined) => void} onDone={() => void} />`
  - `RouletteTable` props: `scoring: TallyStep | undefined`, `losing: boolean`

- [ ] **Step 1: Implement `src/components/CountUp.tsx`**

Use `animate` from `motion/react` on a number held in state, rounding each frame. Render two spans: the animated text with `aria-hidden`, and a `.sr-only` span with the final `value`, so screen readers hear one figure and not every frame. Add `.sr-only` to `src/game.css` (the standard visually-hidden rule).

- [ ] **Step 2: Use `CountUp` for the bankroll in `src/App.tsx`**

`.bankroll-value` renders `<CountUp value={shownBalance} />`. When `finishRound` clears `round`, `shownBalance` rises to `balance` and the figure counts up.

- [ ] **Step 3: Implement `src/components/WinTally.tsx`**

Constants: `LOSS_MS = 500`, `END_HOLD_MS = 700`, `SHAKE_MS = { big: 400, huge: 700 }`, `BURST_COUNT = { big: 14, huge: 32 }`.

- Tier `none`: call `play('loss')`, wait `LOSS_MS`, call `onDone`. Renders nothing.
- Otherwise: walk `tally.steps` on a timer of `stepDuration(tally.steps.length)`. For step `i`: call `onStep(step)`, call `play('tick', i)`, and set the banner total to `step.runningTotal`.
- After the last step: call `onStep(undefined)`; play `'win'` for tier `small` and `'bigWin'` for `big` and `huge`; for `big` and `huge` add the class `shake-big` or `shake-huge` to `document.querySelector('.app-shell')` for `SHAKE_MS` and render the burst; for `huge` also render `.gold-flash`. Wait `END_HOLD_MS`, then call `onDone`.
- Banner: `.tally-banner`, fixed at the top centre of the viewport, `pointer-events: none`, showing `WIN` and `<CountUp value={total} />` inside a `motion.span` with `layoutId="win-total"`.
- Burst: `BURST_COUNT` `motion.i` squares in the five chip colours, each flying from the banner to a random offset within 260 px and fading over 700 ms.
- `useSkip`: jump to the end state at once (`onStep(undefined)`, then `onDone`). A `done` ref makes sure `onDone` is called once.
- Reduced motion: no stepping, no burst, no flash. Show the banner with the final total, play the win sound, wait `END_HOLD_MS`, call `onDone`.
- Clear every timer, and remove the shake class, on unmount.

- [ ] **Step 4: Wire the tally into `src/App.tsx`**

- `RouletteWheel`'s `onLanded` becomes `() => setPhase('tallying')`.
- New state `scoring: TallyStep | undefined`.
- While `phase === 'tallying'`, render `<WinTally tally={round.tally} onStep={setScoring} onDone={finishRound} />`. `finishRound` and `resetSession` also clear `scoring`.
- New state `flash: number | undefined`. `finishRound` sets it to `round.tally.returned` when that is above zero, and a 900 ms timeout clears it (cleared on unmount and on reset). While set, the bankroll panel renders `<motion.span className="bank-flash" layoutId="win-total">+{formatChips(flash)}</motion.span>`, so the banner total appears to fly to the bankroll. Both `layoutId` elements sit inside one `<AnimatePresence>`-wrapped tree in `App`.
- `RouletteTable` receives `scoring={scoring}`, `losing={phase === 'tallying' && round.tally.tier === 'none'}`, and `winner={phase === 'tallying' ? round.result : lastSpin?.number}`.

- [ ] **Step 5: Add `scoring` and `losing` to `src/components/RouletteTable.tsx`**

- A pocket gets the class `is-scoring` when `scoring.target.kind` is `straight`, `split`, `street` or `sixLine` and `scoring.target.numbers` includes its number.
- An outside button gets `is-scoring` when `scoring.target.id` equals its target's id.
- The pop-up is `<em className="payout-pop"><span>{stake} × {returnMultiplier}</span><span>+{formatChips(payout)}</span></em>`, rendered inside the scoring outside button, or, for an inside bet, inside the pocket whose number equals `winner`. Give it `key={scoring.target.id}` so its animation restarts for each step.
- The root `.roulette-table` gets the class `is-losing` when `losing` is true.

- [ ] **Step 6: Add the styles to `src/game.css`**

- `.is-scoring`: the gold outline of `.pocket.is-winner` plus a one-shot `bounce` keyframe (`translateY(-6px)` and back, 300 ms, `steps(3, end)`).
- `.payout-pop`: absolutely positioned above its button, `--pixel` font 10px, gold on `--ink`, `z-index: 2`, `white-space: nowrap`. Its first span is visible for the first 45% of the step and its second span for the rest, using two opacity keyframes of 500 ms.
- `.is-losing .pocket small`, `.is-losing .pocket.has-chip::after`, `.is-losing .outside-button.has-bet`: fade to `opacity: 0` (stake badges) or back to the plain border (buttons) over 500 ms.
- `.tally-banner`, `.bank-flash` (mint, `--pixel` 10px), `.gold-flash` (fixed, full screen, `--gold` at 35% fading to 0 over 500 ms, `pointer-events: none`).
- `.shake-big` and `.shake-huge`: `translate` keyframes of ±4 px and ±9 px, `steps(2, end)`, lasting 400 ms and 700 ms.

The existing `prefers-reduced-motion` rule at the end of the file already neutralises the CSS keyframes.

- [ ] **Step 7: Run the automated checks**

Run: `npx tsc -b && npm run lint && npm test`
Expected: no type or lint errors; all tests pass.

- [ ] **Step 8: Verify by hand**

Run: `npm run dev`. To reach each case without waiting on luck, temporarily change `randomPocket()` in `spin()` to a fixed number, and revert it before committing.

- **Small:** result 7, bets Red 10 and Black 10. Red scores, banner counts to 20, no shake.
- **Big:** result 7, bets Straight 7 for 5, Red 10, Black 10, 1st column 2. Order is column, Red, Straight 7; pop-ups read `2 × 3 → +6`, `10 × 2 → +20`, `5 × 36 → +180`; the tick rises in pitch; shake and burst at the end; the bankroll counts up by 206.
- **Huge:** result 7, bet Straight 7 for 5 only. Harder shake, bigger burst, gold flash.
- **Loss:** result 7, bet Black 10. Chips fade, low blip, about half a second, no banner.
- **Inside bet pop-up:** result 7, a Street 7-9 bet. Pockets 7, 8 and 9 glow and the pop-up sits on pocket 7.
- **Many bets:** result 7, straight bets on 7 plus Red, Odd, 1-18, 1st 12, 1st column, Street 7-9, Six line 7-12, Split 7/8, Split 7/4, Split 7/10. The whole tally takes about 2.5 seconds.
- **Skip:** click during the tally. It ends at once and the balance is right. Hold Escape from the spin through to the end: the round finishes once.
- **Reset mid-tally:** the balance reads 1,000, no shake class is left on the page, and the console is clean.
- **Reduced motion:** the banner shows the final total with no stepping, shake or burst.
- **Phone width** (DevTools device toolbar, 390 px): the wheel fits, the banner does not overflow, pop-ups stay inside the felt.
- **Mute:** silences every sound, and the setting survives a reload.

- [ ] **Step 9: Confirm the temporary fixed result is reverted**

Run: `git diff src/App.tsx | grep -n "randomPocket"`
Expected: `spin()` still calls `randomPocket()` with no arguments and no hard-coded number.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/components src/game.css
git commit -m "feat: add Balatro-style win tally with tiers, burst and count-up"
```

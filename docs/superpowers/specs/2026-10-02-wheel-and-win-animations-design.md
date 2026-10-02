# Roulette wheel and win animations — design

Date: 2026-10-02
Status: awaiting review

## Goal

Make a round of Fliporama Roulette feel like something happened. Two additions:

1. A roulette wheel that appears when the player spins, with a ball that travels round and comes to rest in the winning pocket.
2. A win sequence with the punch of Balatro and Slay the Spire 2: winning bets score one at a time, a total counts up, and shake, particles and sound scale with the size of the win.

The game stays free-play, stays in its retro pixel look, and its bet and payout rules do not change.

## Decisions already made

| Question | Decision |
|---|---|
| How a win plays out | Balatro-style tally: each winning bet scores in turn |
| Where the wheel lives | A centre-screen overlay shown only during the spin |
| Sound | Synthesised with the Web Audio API, with a mute button |
| Animation technology | The `motion` library (`motion/react`), added as a dependency |
| Spin length | About 4.5 seconds, skippable |
| Losses | A short, quiet treatment, about half a second |

## Out of scope

- Any change to bet types, payouts or how the result is chosen (`randomPocket`, `calculateReturns`).
- Animated chips when placing bets, hover tilt effects, background music, spin history.
- Physics simulation of the ball. The result is known before the animation starts, so the ball is choreographed to land on it.

## Round flow

`App.tsx` currently has an `isSpinning` flag and a 1050 ms timer. Both are replaced by a phase:

```
betting → spinning → tallying → betting
```

Betting controls are disabled in `spinning` and `tallying`.

One round:

1. Spin is pressed. `randomPocket()` picks the result and `buildTally()` works out the scoring steps.
2. The real `balance` is credited with the full return immediately. The *displayed* bankroll is `balance` minus the amount not yet revealed, so it still shows the pre-win figure. This means a skip, a reset or a closed tab mid-animation can never lose or duplicate chips.
3. Phase `spinning`: the wheel overlay plays and lands on the result.
4. Phase `tallying`: the overlay leaves and the tally plays on the table (or the loss treatment if nothing was returned).
5. Bets clear, `lastSpin` is set as it is today, and the phase returns to `betting`.

A click anywhere, or Space, Enter or Escape, during `spinning` or `tallying` jumps to the end of that phase. Reset during either phase cancels the animation and returns to `betting` with a fresh session, as today.

## New files

### `src/lib/wheel.ts` (pure)

- `WHEEL_ORDER`: the European sequence, clockwise from zero:
  `0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26`
- `pocketAngle(number)`: degrees clockwise from the top of the wheel to the centre of that pocket (`index × 360 / 37`).

The ball is drawn as a child of the rotating wheel, so its angle is relative to the wheel and `pocketAngle` alone positions it. No on-screen angle conversion is needed.

### `src/lib/tally.ts` (pure)

`buildTally(result, bets)` returns:

- `steps`: one entry per winning bet with `target`, `stake`, `payout` (`stake × returnMultiplier`) and `runningTotal`. Ordered by payout, smallest first; ties keep the order the bets were placed.
- `returned`: the sum of payouts. Always equal to `calculateReturns(result, bets)`.
- `tier`, from `returned ÷ total staked`:

| Tier | Ratio | Effect |
|---|---|---|
| `none` | nothing returned | loss treatment |
| `small` | above 0, under 2 | count-up only |
| `big` | 2 to under 10 | screen shake and a chip burst |
| `huge` | 10 or more | harder shake, bigger burst, gold flash |

`stepDuration(stepCount)` gives the time per tally step: 2500 ms shared across the steps, never more than 500 ms or less than 60 ms each.

### `src/lib/sound.ts`

- `play(name, step?)` with names `ballClick`, `tick`, `win`, `bigWin`, `loss`. `tick` takes the step index and rises in pitch with it.
- Square-wave oscillators through one `AudioContext`, created on first use. The first use always follows the spin click, which satisfies browser autoplay rules.
- `isMuted()` and `setMuted(value)`, stored in `localStorage` under `fliporama-muted`. Storage access is wrapped in try/catch; if it fails the setting just doesn't persist.
- If Web Audio is unavailable, `play` does nothing.

### `src/components/RouletteWheel.tsx`

Props: `result`, `onLanded`.

- A full-screen dimmed overlay with an SVG wheel at the centre: 37 wedges built from `WHEEL_ORDER`, coloured with `getPocketColor`, in the existing palette.
- Entrance: the wheel springs in.
- The wheel rotates clockwise and slows. The ball orbits counter-clockwise on the outer track and slows, then moves inward with two small bounces and stops in the winning pocket, after which it turns with the wheel.
- The number of laps varies slightly per spin. This is cosmetic only and uses `Math.random`.
- `ballClick` sounds are spaced to match the ball's speed.
- After landing, the winning number is shown large for about 0.8 seconds, then `onLanded` is called and the overlay shrinks away.
- The overlay is `aria-hidden`. The existing live message region announces the result.

### `src/components/WinTally.tsx`

Props: `tally`, `onStep(step | undefined)`, `onDone`.

- Plays the steps in order, `stepDuration` apart: about 0.5 seconds each, shortening when there are more than five.
- For each step it calls `onStep` (so the table can highlight that bet), plays `tick`, and advances a centre banner showing the running total counting up.
- At the end the total flies to the bankroll panel using a shared `layoutId`, and the displayed bankroll counts up to the real balance (a small `CountUp` component, also used for the banner total).
- Shake and particles follow the tier. Particles are small squares in the chip colours.
- For tier `none` it plays the loss treatment: staked chips fade off the table and `loss` plays.

### `src/lib/useSkip.ts`

A hook shared by the two components above: calls a handler on a click, or on Space, Enter or Escape. Held-down key repeats are ignored, so the key press that starts a spin cannot also skip it.

## Changes to existing files

- `src/App.tsx`: phase state replaces `isSpinning` and the timer; holds the current round (`result`, tally, current scoring step); renders `RouletteWheel` and `WinTally`; adds the mute button to the top bar; the bankroll shows the displayed value.
- `src/components/RouletteTable.tsx`: a new `scoring` prop (the current tally step) and a `losing` flag that fades the staked chips. The scoring bet's spots bounce and glow, reusing the existing gold winner pulse. The `5 × 36 → +180` pop-up is rendered inside the button it belongs to: the bet's own button for outside bets, and the winning pocket for inside bets (every winning inside bet contains the winning number). This needs no position measuring.
- `src/game.css`: overlay, wheel, banner, pop-up, shake and particle styles.
- `package.json`: adds `motion`.
- `src/lib/roulette.ts`: unchanged.

## Reduced motion

When the player has reduced motion turned on (`useReducedMotion` from `motion`):

- The wheel is replaced by a short fade showing the winning number.
- The tally shows the final total at once, with no shake, particles or flying total.
- Sound is unaffected and follows the mute button.

## Timing

All durations live as named constants at the top of the file that uses them, so the feel can be tuned in one place per component.

| Thing | Duration |
|---|---|
| Wheel spin | ~4.5 s |
| Hold on result | ~0.8 s |
| Tally step | ~0.5 s, shorter beyond five steps |
| Loss treatment | ~0.5 s |

## Testing

Unit tests (Vitest, alongside the existing `roulette.test.ts`):

- `wheel.test.ts`: `WHEEL_ORDER` holds 37 unique numbers from 0 to 36; `pocketAngle` advances one pocket arc per position.
- `tally.test.ts`: `returned` matches `calculateReturns`; steps are in ascending payout order with correct running totals; tier boundaries at 0, under 2, exactly 2, just under 10 and exactly 10; `stepDuration` bounds.
- `sound.test.ts`: the tick pitch rises and caps; mute and `play` work with no storage and no Web Audio.

Checked by hand in the browser:

- A win at each tier, and a loss.
- A winning round that returns less than was staked (tier `small`).
- Skipping during the spin and during the tally.
- Reset mid-spin and mid-tally: balance is correct afterwards.
- Mute on and off, and that it is remembered after a reload.
- Reduced motion turned on.
- Phone width.

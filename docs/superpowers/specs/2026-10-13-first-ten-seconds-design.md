# Phase 5: the first ten seconds. Design

Brainstormed with the owner on 2026-10-13. Choices the owner made are marked **Chosen**; the rest follow from them.

## Goal

From `docs/roadmap.md`: an arcade power-on boot sequence, a title screen with attract mode, scene transitions, and a short playable tutorial for the bet types. Done when a stranger understands what this is and places a bet within 15 seconds, with no text explanation.

The four pieces would fight that 15-second target if they queued up in front of the table. So the rule for the whole phase is: **nothing but the boot and one press stands between a visitor and the felt, and nothing after that ever blocks play.**

## Flow

**Chosen: short boot, then press start.** About 2.5 seconds of power-on, a title card over the live room, one press, and the table is playable: about 5 seconds to the felt on a first visit.

One value, the stage, decides what is on screen:

| Stage | What shows | How it ends |
|---|---|---|
| `boot` | A black screen powering on. | By itself after about 2.5 s, or at once on any click, Space, Enter or Escape. |
| `title` | The title card over the dimmed, living room. | The player presses start. |
| `play` | The game, as today. | It does not; "Replay intro" in settings goes back to `boot`. |

**Chosen: return visitors get the title only.** The boot plays once per browser. So does the ghost hand's tutorial run. Both are remembered under `fliporama-intro`, stored the same way as the other settings, and a browser that refuses storage simply sees the full intro each time.

| Visit | Starts at | Ghost hand after start |
|---|---|---|
| First | `boot` | yes |
| Later | `title` | no |
| Reduced motion, first | `title` | yes, still (see below) |
| `/?play` | `play` | no |

`/?play` opens the game directly. It exists for the capture and measuring scripts, which need the table without an intro in front of it, and it is handy in development.

**Built as layers over the live game.** The boot and the title are drawn on top of the real, already-running page; the game beneath is `inert` until the stage is `play`. *Why:* the title needs the room behind it, so the room has to be mounted anyway; nothing in the game is restructured; and the attract mode costs nothing because the room is really there. Separate screens behind a router would mount the same game for the same picture, and a boot drawn in the WebGL layer would need a second version for players who have that layer off.

## Boot

`src/components/Boot.tsx`. A layer in `ink-0` covering the page.

1. Black for a beat.
2. A `lamp-0` line one art pixel tall snaps across the middle of the screen, then opens to full height in a few hard steps: a tube switching on.
3. One flicker.
4. A short line in `brass-2` display type, "FLIPORAMA", with a row of blocks that fills like a memory check.
5. A hard cut to the title.

Every change is a step, not a fade, and every size is a whole number of art pixels, as the art bible asks. The timings are named constants at the top of the file. The boot is never shown when the system asks for reduced motion.

The boot text is decoration. A visitor who reads none of it loses nothing.

## Title

`src/components/Title.tsx`. A card over the room, with the room's light held at `dim` so the card is the brightest thing on screen.

- The logo: ROULETTE in the display face at `--type-5`, `brass-3` with a hard `ink-0` shadow one step down.
- `PRESS START`, blinking in hard steps. It is a real `<button>` that takes focus when the title appears, so Enter and Space work and a screen reader announces it. A click anywhere on the card also starts.
- The line "FREE PLAY / NO CASH VALUE" in the text face.

While the title is up, the page's own headings and controls are `inert`, so a keyboard or screen-reader user meets the start button and nothing else.

**Chosen: the room is the attract mode.** The lamp, the smoke, the croupier and the door are already alive behind the card. After 8 seconds without input the ghost hand begins its demo on the table behind the card and loops until the player starts.

### The transition into play

On start:

1. The card lifts off the top of the screen with a small anticipation dip first and no fade (it is a soft thing; it may overshoot).
2. The room's light goes from `dim` to `normal` through `useRoomLight`, so it lands in its usual two hard steps and the felt, the wall, the lamp and the screen layer all follow the one number they already read.
3. A burst of the new `start` particle kind from where the button was.
4. The game stops being `inert` and focus moves to the first chip in the tray.

With reduced motion the card is simply removed and the light is set to normal.

This is the phase's one scene transition, together with the boot's cut to the title. The wheel overlay and the win tally keep the transitions they have.

## Ghost hand

**Chosen: a ghost hand demo, not a locked guided round.** `src/components/GhostHand.tsx` draws a pixel hand (a new sprite in `src/sprites/`) that shows the whole loop of the game without a word:

1. It travels to a chip in the tray and taps it.
2. It travels to a number on the felt and taps it.
3. It travels to the spin button and taps it.
4. It rests, then starts again.

The steps are data in `src/lib/intro.ts`: a list of targets and dwell times. Targets are found in the page by the attributes the game already has (`data-chip`, `data-spot`) plus the spin button, so the hand follows the layout at any width and in either orientation.

- The hand travels on arcs, never straight lines, and presses down a pixel or two on a tap. It is drawn rigid: a hand is not a chip.
- Each tapped target pulses once, using the palette's `lamp` step, so the eye is left on the control and not on the hand.
- The hand changes no game state. No chip is selected, no bet is placed, no wheel spins. *Why:* a demo that really played would need a scripted player driving the game's state, which is the "self-playing demo rounds" option the owner passed over.
- It ignores the pointer (`pointer-events: none`) and is hidden from assistive technology.
- It stops when unseen, on the same `useLive` signal as the room.

In attract mode it loops behind the card. In play, on a first visit, it loops until the player's first click or key press in the game, then leaves and is not shown again in that browser.

**Reduced motion:** the hand does not travel. It appears, still, at each target in turn.

## Bet types

The four inside bets (straight, split, street, six-line) are the part of roulette a stranger does not know. They are shown, not told: the first time each mode is picked in a visit, the tiles that an example bet of that kind would cover light up together for about a second.

- `RouletteTable` gains a `preview` prop: the numbers to light, or none. The tiles get an `is-preview` class.
- The example for each mode is a fixed, tested entry in `src/lib/intro.ts`, built with `createInsideTarget` so it is always a legal bet.
- With reduced motion the tiles light and unlight with no pulse.

The outside bets already carry their own labels and odds on the felt and are left as they are.

## Settings

The settings panel gains one button below the three choices: **Replay intro**. It forgets `fliporama-intro`, closes the panel and sets the stage to `boot` (or `title` under reduced motion). A round in progress is reset first, as the reset button does.

## Sound

None is added. Phase 6 owns sound; the boot and the start press are obvious places for it and are noted for that phase.

## Files

| File | Change |
|---|---|
| `src/lib/intro.ts`, `intro.test.ts` | New. `Stage`, `firstStage`, the stored flag, the hand's steps, the bet-type examples. |
| `src/components/Boot.tsx` | New. |
| `src/components/Title.tsx` | New. |
| `src/components/GhostHand.tsx` | New. |
| `src/sprites/hand.ts` | New. |
| `src/lib/particles.ts` | A `start` kind. |
| `src/components/RouletteTable.tsx` | The `preview` prop. |
| `src/components/Settings.tsx` | The "Replay intro" button. |
| `src/App.tsx` | The stage; `inert` on the game; the light held dim before play; the preview on a mode's first pick. |
| `src/game.css` | Styles for the three layers and `is-preview`. |
| `scripts/capture.mjs`, `scripts/perf/*.mjs` | Open `/?play`; a new `intro` capture. |

## Checks

- **Tests** (`src/lib/intro.test.ts`): `firstStage` for each row of the visits table, including storage that throws; every hand step names a target; every bet-type example is a legal bet of its kind.
- **`npm run capture -- intro`**: loads the page with empty storage, records the boot, the title, the press and the hand, places a bet, and fails if the first bet could not be placed within 15 seconds of load, or on the usual console-error and sideways-scroll checks. Stills and video land in `captures/`.
- **`npm run capture -- intro reduced`**: no boot is shown, and a bet can be placed.
- **Existing captures and perf scripts** run against `/?play` and must pass unchanged.
- **Budgets:** first-load JavaScript stays under 200 kB gzipped (138.6 kB before this phase); `node scripts/perf/idle.mjs` on the title stays at 16.7 ms.
- **By eye:** the owner judges the boot, the card's lift and the hand's travel before the phase is ticked.

The roadmap's "a stranger" cannot be automated. The capture's 15-second check is the stand-in; a real stranger is the owner's to find.

## Left out

- Self-playing demo rounds behind the title.
- A guided first round with locked controls.
- New transitions for the wheel overlay or the win tally.
- Styleguide entries for the boot, the title and the hand.
- Sound.

Any of these can be added if the title feels empty once it is seen moving.

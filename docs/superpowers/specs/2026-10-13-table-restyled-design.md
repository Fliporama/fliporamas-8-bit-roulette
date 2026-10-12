# The table, restyled — design

Date: 2026-10-13
Status: awaiting review
Roadmap: Phase 2 of `docs/roadmap.md`

## Goal

Apply the art bible (`docs/art-bible.md`, `src/tokens.css`) to the game that already exists, so that a screenshot of the idle table is worth posting on its own.

Today the game breaks the bible almost everywhere: `src/game.css` has about 40 one-off colours, 1 px borders, soft glows and 6 to 9 px text; the chips are CSS circles in blue, orange and purple; the wheel is a smooth vector drawing that is only on screen during a spin.

## Decisions already made

| Question | Decision |
|---|---|
| Where the wheel lives | A still wheel is always on the page, in the heading. Spinning still opens the large overlay |
| How the wheel is drawn | A true pixel wheel: redrawn every frame on a low-resolution canvas, one canvas pixel per art pixel |
| How the work is done | Restyle in place: the same components, class names and game logic; `src/game.css` is rewritten onto the tokens |
| Behaviour | Game rules, bet logic, sound and animation timing do not change, except the two wheel changes listed under "The wheel" |

## Out of scope

- The room, the hanging lamp, the croupier, anything that idles (Phase 3).
- WebGL effects and the particle system (Phase 4). The spark burst in `WinTally.tsx` is only recoloured.
- The phone layout rework (Phase 7). The phone layout is restyled and must not break or scroll sideways.
- The brightness flashes inside animations (`THUNK` in `ChipLayer.tsx`, the `winner` keyframes). They are transient and Phase 4 replaces them.
- New sounds, new bet types, any rule change.

## Rules applied everywhere

- `src/main.tsx` imports `src/tokens.css`. `src/game.css` uses only `var(--token)`; its local aliases (`--ink`, `--gold`, `--mint` and the rest) are deleted.
- A new test fails if a hex colour or an `rgb()` colour appears in any file under `src/` other than `src/tokens.css`. Translucent overlays use `color-mix()` on a token.
- Borders, shadow offsets, padding and gaps are whole multiples of `--px`. Outlines are one art pixel in `--ink-0`. Raised surfaces have a lit top edge and a shadowed bottom edge from their own ramp, and a hard drop shadow.
- No blurred shadows, no glows, no smooth gradients, no 1 px hairlines.
- Type uses only `--type-1` to `--type-5`. The display face may use all five; the text face is never smaller than `--type-3`. Labels that no longer fit at phone width are shortened or allowed to wrap.
- The page background is plain `--ink-0`. The faint grid goes; Phase 3 builds the room.
- Win is `--lamp-0` or `--brass-2` text. Loss is `--paper-1` text beside an `--oxblood-1` marker, because `--oxblood-2` text on ink reaches only 4.3:1.
- Text uses only the pairs in `PAIRS` in `src/lib/tokens.test.ts`. This phase adds, each already checked at 4.5:1 or better: `paper-1` on `wood-1`; `brass-3` on `ink-0`, `ink-1`, `wood-0`, `wood-1` and `felt-0`; `brass-2` on `wood-0`; `lamp-0` on `ink-0`; `ink-0` on `paper-0`; `oxblood-1` and `smoke-0` on `paper-1`; `smoke-2` on `ink-0`. `docs/art-bible.md` is updated to match.

## The table

### Felt

A canvas behind the betting grid, one canvas pixel per art pixel, scaled up unsmoothed and redrawn when the table changes size.

A pure function in `src/lib/felt.ts` returns the felt step (0 to 3) for an art pixel:

- **Light pool:** light falls off from top centre in four flat steps, with an ordered dither where two steps meet. This is the `LightPool` logic from the styleguide, moved here and made size-independent.
- **Texture:** sparse single-pixel flecks one step darker or lighter, placed by a fixed hash so they never move.
- **Wear:** within a few art pixels of the rail the felt dithers down one step.

### Rail

`.table-frame` becomes the table: the wood-and-brass rail from the styleguide (`RAIL`) frames the felt on all four sides, lit along the top rail and shadowed along the bottom, with an `--ink-0` outline and a hard shadow.

### Tiles

- Faces: `--oxblood-1`, `--ink-1` and `--felt-2`, each with its lit top edge and shadowed bottom edge and an `--ink-0` outline. Numbers are `--paper-1` in the display face at `--type-2`.
- Hover lifts the tile one art pixel and moves its face one step up its ramp. A pending split tile and the winning tile get a `--brass-2` outline one art pixel wide.
- **Covered numbers:** when a tile holds a straight bet, its number moves to the tile's left edge and the chip sits on the right. `src/lib/chips.ts` gains the straight-bet anchor, a point in the right half of the tile's box, with a test; `ChipLayer.tsx` uses it. The other bet kinds keep `stackAnchor` as it is.

### Outside bets and the mode switch

- Outside boxes look printed on the felt: a `--paper-0` line one art pixel wide, no face of their own, `--paper-1` labels in the text face and odds in the display face in `--brass-3`.
- "Red" and "Black" show a small `--oxblood-1` or `--ink-1` swatch beside a `--paper-1` label.
- A box holding a bet gets a `--brass-2` line.
- The inside-bet mode switch becomes four small buttons in the secondary button style; the active one uses the primary (brass) style.

## Chips

- The sprite from the styleguide (`chip(value)`, 12 × 11 art pixels) replaces the CSS circles on the table, in the picker and in the win burst. Colours are the bible's: white, red, blue-grey, green, black.
- The chip sprites move from `src/styleguide/sprites.ts` to `src/sprites/chips.ts`. `LAMP` stays in the styleguide until Phase 3 uses it; `RAIL` moves to `src/sprites/table.ts`.
- The sprite carries no number. The picker prints each value under its chip. A stack on the table shows its total as today.
- Picker chips and table chips are the same size, so `PICKER_SCALE` becomes 1. Stacked chips rise two art pixels each (`STACK_RISE` 6), matching the sprite's edge depth. The shadow under a stack is the `CHIP_SHADOW` sprite.
- The toss, squash, stack and sweep animations and their timings are otherwise unchanged. Squash and stretch on a chip in flight is allowed by the bible: chips are soft things.

## The wheel

### Drawing

A pure function in `src/lib/wheelPixels.ts` returns the palette token for one art pixel, given the pixel's position, the wheel's size in art pixels, the wheel's turn, the hub's turn, the ball's position, and the winning pocket once the ball has landed.

From the outside in:

1. An `--ink-0` outline.
2. A wood rim with grain: bands of the `wood` ramp that follow the rim.
3. A brass track, where the ball runs.
4. The pocket ring: `--oxblood-1`, `--ink-1` and `--felt-2` pockets in `WHEEL_ORDER`, separated by brass dividers one art pixel wide.
5. A cone stepping down the `wood` ramp to the hub.
6. A brass hub with four spokes, which turns with its own lagging angle as today.

Lighting is fixed to the screen, not the wheel: the upper part of every ring is one step lighter and the lower part one step darker, with a dithered edge between, and it stays put while the wheel turns under it.

The ball is drawn on the same canvas: a small rigid disc in the `paper` ramp with an ink outline, a highlight at its top left and a shadow one step darker beneath it. It is never scaled, squashed or rotated.

### Component

`src/components/WheelCanvas.tsx` owns the canvas. It reads the palette from the page once, redraws whenever one of its motion values changes, and writes pixels through a single `ImageData`. Its size in art pixels is the largest even number that fits its box.

`RouletteWheel.tsx` keeps all of its timing and motion values and renders `WheelCanvas` in place of the SVG. Pocket numbers stay as real text (the text face at `--type-3`) in an SVG layer over the canvas that turns with the wheel.

### On the page

The heading's "37 pockets" stamp is replaced by a still `WheelCanvas` at zero turn, without numbers or ball, about 72 art pixels across (smaller at phone width). It is decorative and hidden from assistive technology.

### Two motion changes

The owner judges both by eye.

1. Each ball bounce jolts the wheel down by one art pixel and back, instead of scaling it by 3 %. Scaling a canvas by a fraction blurs its pixels, and the bible says hard things do not deform.
2. When the ball lands, the losing pockets are drawn one step darker and the winning pocket blinks to `--brass-2`, instead of fading the losers to 40 % opacity.

Reduced motion is unchanged: no wheel overlay, the result badge only.

## The console

The sidebar becomes a machine: a cabinet with a `--wood-1` body, brass trim, an ink outline and a hard shadow. The controls, their order and their behaviour are unchanged.

- **Bank:** a recessed counter window in `--ink-0` with the balance in the display face at `--type-4` in `--lamp-0`. Its labels are small brass plates with `--ink-0` text.
- **Chip tray:** a recessed `--felt-0` tray holding the five chip sprites. The selected chip sits two art pixels higher with a `--brass-2` marker beneath it.
- **Bet slip:** a paper ticket: `--paper-1` face, `--ink-0` text, dotted row rules in `--smoke-0`, a serrated bottom edge. The empty state and the total are part of the ticket.
- **Spin:** the primary button from the styleguide at full width: brass face, ink text, a hard shadow that pressing removes.
- **Last spin:** a small recessed window showing the result as a tile.
- **Icons:** mute, unmute, reset, clear, remove and play become pixel sprites in `src/sprites/icons.ts`. `lucide-react` is uninstalled.

The top bar, heading and footer are restyled with the same rules. The brand mark becomes a brass plate. The footer keeps the lines "FREE-PLAY TABLE" and "NO CASH VALUE".

The tally banner, payout pop-up, bank flash, gold flash and result badge are recoloured from the tokens and given the panel treatment.

## The styleguide

`/?styleguide` uses the game's real classes for buttons, tiles and panels, and the styleguide's own copies (`.sg-button`, `.sg-tile`, `.sg-panel`) are deleted, so the page cannot drift from the game. Its lit sample uses `src/lib/felt.ts`. It gains the wheel and the icons.

## Changes to existing files

| File | Change |
|---|---|
| `src/game.css` | Rewritten onto the tokens and the grid |
| `src/main.tsx` | Imports `src/tokens.css` |
| `src/App.tsx` | Sprite icons and chips; the heading wheel; markup for the cabinet where a wrapper is needed |
| `src/components/RouletteTable.tsx` | The felt canvas; colour swatches for Red and Black; a class on tiles that hold a straight bet |
| `src/components/ChipLayer.tsx` | Chip sprites; the constants named under "Chips" |
| `src/components/RouletteWheel.tsx` | `WheelCanvas` in place of the SVG wheel; the two motion changes |
| `src/components/WinTally.tsx` | Sparks coloured from the tokens |
| `src/lib/chips.ts` | The straight-bet anchor |
| `src/styleguide/*` | As described under "The styleguide" |
| `docs/art-bible.md` | The added text pairs |
| `package.json` | `lucide-react` removed |

New files: `src/lib/felt.ts`, `src/lib/wheelPixels.ts`, `src/components/WheelCanvas.tsx`, `src/components/Felt.tsx`, `src/sprites/chips.ts`, `src/sprites/table.ts`, `src/sprites/icons.ts`. The two pure modules, `felt.ts` and `wheelPixels.ts`, each have a test beside them.

## Testing

- `src/lib/felt.test.ts`: the brightest step is under the lamp and the darkest in the bottom corners; every result is a step from 0 to 3; the same pixel always gives the same answer.
- `src/lib/wheelPixels.test.ts`: at zero turn the pocket at the top is green (pocket 0); turning the wheel by one pocket's arc brings the next number in `WHEEL_ORDER` to the top; the ball's pixel is paper; the centre is brass; a pixel outside the rim is transparent; every token returned exists in `src/tokens.css`.
- `src/lib/chips.test.ts`: a straight bet's anchor is inside the tile and right of its centre; the other bet kinds are unchanged.
- `src/lib/tokens.test.ts`: the added pairs.
- A new test that scans `src/` for colours outside `src/tokens.css`.
- `npm run capture` and `npm run capture -- phone`: both exit 0; the screenshots are read and checked against "Rules applied everywhere". `npm run capture -- styleguide` on both sizes.
- `npm run build`: the game's first-load JavaScript stays under the 200 kB gzip budget. It should fall, because `lucide-react` goes.
- By eye, by the owner: the wheel turning, the two motion changes, a chip toss and stack, and the idle screenshot itself, which is the phase's "done when".

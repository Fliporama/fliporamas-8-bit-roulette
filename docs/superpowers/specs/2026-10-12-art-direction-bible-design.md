# Art direction bible — design

Date: 2026-10-12
Status: awaiting review
Roadmap: Phase 1 of `docs/roadmap.md`

## Goal

Fix the visual rules that every later phase obeys, and prove them on one page, before any of the game is restyled. Today the game uses 40 different hex colours with no stated system, two stock pixel fonts, and no lighting or pixel-size rule. Award juries score a coherent point of view; this phase creates one.

The owner's brief: elevated pixel art, drawn in code, set in a **back-room speakeasy**: a dim, smoky room, one green-shaded lamp over the felt, brass, dark wood, deep greens and warm gold.

## Decisions already made

| Question | Decision |
|---|---|
| Setting | Back-room speakeasy |
| Art source | Drawn in code; no artist, no asset packs |
| Rendering | Stay with DOM and CSS, plus an effects layer on top in later phases. No comparison spike; the lit sample on the styleguide is the proof |
| What gets restyled now | Nothing in the game. Only the styleguide page uses the new rules |
| How visual choices are made | Options shown side by side on the styleguide; the owner picks |

## Out of scope

- Restyling the table, wheel, chips or console (Phase 2).
- The room, the croupier, parallax (Phase 3).
- WebGL post-processing, CRT, particles (Phase 4).
- Any change to game rules, sound or behaviour.

## Deliverables

1. `docs/art-bible.md`: the rules, in words, with the reason for each.
2. `src/tokens.css`: the palette and sizes as CSS custom properties.
3. A styleguide page at `/?styleguide`.
4. `src/lib/sprite.ts` and a `Sprite` component: the way pixel art is drawn in code.

## The rules the bible sets

### Palette

About 24 colours, organised as ramps so that light and shadow on any material come from the same family:

| Ramp | Steps | Used for |
|---|---|---|
| Ink | 3 | outlines, deepest shadow, body background |
| Felt | 4 | the table surface, from shadow to lamp-lit |
| Wood | 3 | rails, wheel body, panelling |
| Brass | 4 | metal, gold accents, highlights, the primary button |
| Oxblood | 3 | red pockets, danger, the loss state |
| Smoke | 3 | muted text, haze, disabled states |
| Paper | 2 | primary text, the ball, chip faces |
| Lamp | 2 | light itself: glow and win flashes |

Every colour has a token name of the form `--ramp-step` (for example `--felt-2`), a stated job, and no colour appears in the game outside this list once Phase 2 is done. The five chip denominations take their colours from the ramps rather than adding new hues.

`src/tokens.css` is the single source of truth. Nothing else declares a hex value for the styleguide.

**Readability rule:** every text-on-background pair the bible permits reaches a contrast ratio of at least 4.5:1. The permitted pairs are listed in the bible and checked by a test.

### Lighting

- One light: a green-shaded lamp above the centre of the table. Light is warm (Lamp and Brass ramps); shadow is cool (Ink and the dark end of Felt).
- Light falls from top centre. Every object is lit on its top edge and shadowed on its bottom edge.
- Shadows are hard-edged, drop straight down, and are one ramp step darker than the surface they fall on.
- No smooth gradients. Light falls off in visible steps, with a dither band between steps.
- Outlines are one art pixel, in Ink.

### Pixel grid

- One art-pixel size for the whole site, expressed as a single token (`--px`). Every sprite, border, shadow offset and spacing step is a whole multiple of it.
- Sprites scale by whole numbers only and render without smoothing, so nothing blurs.
- Text is exempt from the grid but sits on a baseline that is a multiple of `--px`.

### Type

- Two faces: a display face for titles and numbers that matter, and a text face for everything else.
- A fixed scale of five sizes. No other sizes are used.

### Motion

Written down from what is already built, so later phases stay consistent:

- Soft things (chips, badges, pop-ups) squash, stretch, overshoot and settle.
- Hard things (the ball, metal, wood) never deform. Their weight shows in short sharp bounces, damped settles, and the reaction of what they hit.
- Thrown things travel on arcs; nothing moves in a straight line at constant speed.
- Timing and exaggeration values are named constants at the top of the file that uses them.
- Every animation has a reduced-motion path.

### Drawing in code

A sprite is a small grid of characters in the source, with a key that maps each character to a palette token:

```ts
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

- `src/lib/sprite.ts` (pure): turns a grid and a key into a list of rectangles, merging horizontal runs of the same colour so a sprite is few DOM nodes. It rejects a grid whose rows differ in length or that uses a character missing from the key.
- `src/components/Sprite.tsx`: renders those rectangles as an inline SVG with crisp edges, filled with `var(--token)`, sized in multiples of `--px`. Because fills are CSS variables, a sprite recolours when the palette changes with no code change.

## The styleguide page

Reached at `/?styleguide`. `src/main.tsx` checks the query string and loads the page with a dynamic import, so the game's own bundle does not grow. There is no link to it from the game.

Sections, top to bottom:

1. **Choices** (removed once the owner has picked; see below).
2. **Palette**: every ramp as swatches with token name, hex value and job.
3. **Type**: both faces at all five sizes.
4. **Components**: primary and secondary buttons in rest, hover, pressed and disabled states; a red, a black and the zero tile; all five chips, single and stacked; a panel.
5. **Lit sample**: a small scene (a patch of felt, a brass rail, a chip stack and the lamp) drawn with the lighting rules. This is the proof that DOM and CSS can deliver the look.
6. **Sprites**: the sample sprites at 1×, 2× and 4×, to show that scaling stays crisp.

The page works at desktop and phone widths.

### The three choices

Each is shown as options side by side, applied to the same sample so only the choice differs:

| Choice | Options |
|---|---|
| Palette | Two candidate speakeasy palettes, A and B, each a complete set of the ramps above |
| Pixel size | 2, 3 and 4 CSS pixels per art pixel |
| Type pairing | (1) Press Start 2P with VT323, as today; (2) Pixelify Sans with VT323; (3) Jersey 10 with Silkscreen |

Candidate fonts come from Fontsource under open licences. Fonts that are not chosen are uninstalled.

Palette B is defined in `src/tokens.css` as an override block (`[data-palette='b']`) for the duration of the choice.

### Approval in two steps

1. The owner looks at the page and picks one option for each choice.
2. The picks are locked: the alternatives and the Choices section are deleted, `src/tokens.css` holds one palette, `docs/art-bible.md` records the final values, and the owner approves the finished page. That approval completes the phase.

## Changes to existing files

- `src/main.tsx`: the query-string check and dynamic import.
- `scripts/capture.mjs`: a `styleguide` argument that saves a full-page screenshot of `/?styleguide`, at desktop width or with `phone`.
- `package.json`: the candidate fonts, then only the chosen ones.
- `CLAUDE.md`: one line pointing at `docs/art-bible.md` as required reading before visual work.
- `src/game.css` and all game components: unchanged.

## Testing

Unit tests (Vitest):

- `sprite.test.ts`: a grid becomes the expected rectangles; horizontal runs merge; ragged rows and unknown characters are rejected.
- `tokens.test.ts`: reads `src/tokens.css`; every ramp has its stated number of steps; every permitted text-on-background pair reaches 4.5:1, for each candidate palette while two exist.

Checked by eye:

- `npm run capture -- styleguide` and `npm run capture -- styleguide phone`, read before the owner is asked to look.
- The game at `/` looks and plays exactly as before (`npm run capture`).
- The production build's main bundle is no larger than before, within a kilobyte.

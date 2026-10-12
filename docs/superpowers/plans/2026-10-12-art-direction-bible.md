# Art Direction Bible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the speakeasy visual rules (palette, lighting, pixel grid, type, motion, sprites-in-code) in `docs/art-bible.md` and prove them on a hidden styleguide page, without touching the game.

**Architecture:** `src/tokens.css` is the single source of colour and size. Pixel art is written as character grids and turned into inline SVG by a pure helper. The styleguide is a separate lazily loaded chunk reached at `/?styleguide`; while the owner is choosing, palette, pixel size and type are switched by URL parameters that set attributes on the page root.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, plain CSS custom properties, Fontsource fonts, `playwright-core` (existing `npm run capture`).

**Spec:** `docs/superpowers/specs/2026-10-12-art-direction-bible-design.md`

## Global Constraints

- The game at `/` must look and play exactly as before. `src/game.css`, `src/App.tsx` and everything under `src/components/` except the new `Sprite.tsx` are not edited.
- The production build's main JavaScript bundle stays within 1 kB of the baseline: `index-*.js` 392.86 kB (125.96 kB gzip). Nothing the styleguide needs is imported from `src/main.tsx` except through the dynamic import.
- No hex colour appears in any styleguide file except `src/tokens.css`. Everything else uses `var(--token)`.
- Every size, border, offset and spacing on the styleguide is a whole multiple of `var(--px)`, except font sizes.
- Token names are `--<ramp>-<step>`, step 0 darkest. Ramps and step counts: ink 3, felt 4, wood 3, brass 4, oxblood 3, smoke 3, paper 2, lamp 2 (24 colours).
- Every permitted text-on-background pair reaches a contrast ratio of at least 4.5:1.
- Light comes from top centre: lit top edges, shadowed bottom edges, hard shadows one ramp step darker, no smooth gradients, outlines one art pixel in `--ink-0`.
- Conventional Commits; work stays on branch `feat/art-direction-bible`.

## Review Focus

1. **`/` must never load the styleguide, and `/?styleguide=1` or `/?styleguide&x=y` must.** Pinned in Task 3 (`styleguideOptions` tests).
2. **Bad option values in the URL** (`palette=z`, `px=99`, `type=`) fall back to defaults instead of breaking the page. Pinned in Task 3.
3. **A malformed sprite** (ragged rows, a character missing from the key, a key that tries to redefine `.`, an empty grid) fails loudly at definition, not as a blank image. Pinned in Task 1.
4. **Phone width:** the side-by-side Choices must not cause horizontal scrolling at 390 px. Pinned in Task 3 (capture script fails on overflow).
5. **The game's download growing** because a styleguide font or stylesheet leaks into the main bundle. Pinned in Tasks 3 and 6 (build size check).

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/sprite.ts` (+ `.test.ts`) | Pure: character grid and key to merged rectangles |
| `src/components/Sprite.tsx` | Renders a `SpriteData` as crisp inline SVG |
| `src/tokens.css` | The palette, pixel size, type faces and type scale |
| `src/lib/tokens.test.ts` | Ramp completeness and contrast of permitted pairs |
| `src/styleguide/options.ts` (+ `.test.ts`) | Pure: URL query to styleguide options (deleted in Task 6) |
| `src/styleguide/Styleguide.tsx` | The page |
| `src/styleguide/styleguide.css` | The page's layout and component styles |
| `src/styleguide/sprites.ts` | The sample sprites |
| `docs/art-bible.md` | The rules in words |

---

### Task 1: Sprites in code

**Files:**
- Create: `src/lib/sprite.ts`, `src/lib/sprite.test.ts`, `src/components/Sprite.tsx`

**Interfaces:**
- Produces:
  ```ts
  export interface SpriteRect { x: number; y: number; width: number; token: string }
  export interface SpriteData { width: number; height: number; rects: SpriteRect[] }
  export function sprite(rows: readonly string[], key: Readonly<Record<string, string>>): SpriteData
  ```
  and `export default function Sprite(props: { data: SpriteData; scale?: number; className?: string })`.

- [ ] **Step 1: Write the failing tests** in `src/lib/sprite.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { sprite } from './sprite'

const KEY = { x: 'ink-0', o: 'brass-2' }

describe('sprite', () => {
  it('reports the grid size and leaves dots transparent', () => {
    const gem = sprite(['.xx.', 'xoox', '.xx.'], KEY)
    expect(gem.width).toBe(4)
    expect(gem.height).toBe(3)
    expect(gem.rects.filter((rect) => rect.y === 0)).toEqual([{ x: 1, y: 0, width: 2, token: 'ink-0' }])
  })

  it('merges a horizontal run of one colour into one rectangle', () => {
    expect(sprite(['xoox'], KEY).rects).toEqual([
      { x: 0, y: 0, width: 1, token: 'ink-0' },
      { x: 1, y: 0, width: 2, token: 'brass-2' },
      { x: 3, y: 0, width: 1, token: 'ink-0' },
    ])
  })

  it('rejects a malformed sprite where it is defined', () => {
    expect(() => sprite([], KEY)).toThrow(/empty/)
    expect(() => sprite(['xx', 'x'], KEY)).toThrow(/row 1/)
    expect(() => sprite(['x?'], KEY)).toThrow(/"\?"/)
    expect(() => sprite(['x.'], { ...KEY, '.': 'ink-0' })).toThrow(/transparent/)
    expect(() => sprite(['x'], { xy: 'ink-0' })).toThrow(/single character/)
  })
})
```

- [ ] **Step 2: Run** `npx vitest run src/lib/sprite.test.ts`. Expected: FAIL, cannot resolve `./sprite`.

- [ ] **Step 3: Implement `sprite`** in `src/lib/sprite.ts`. `.` is always transparent. Error messages must contain: `empty` for no rows; `row <index>` for a row whose length differs from row 0; the offending character in double quotes for one missing from the key; `transparent` for a key containing `.`; `single character` for a key entry longer than one character.

- [ ] **Step 4: Run** `npx vitest run src/lib/sprite.test.ts`. Expected: PASS, 3 tests.

- [ ] **Step 5: Implement `Sprite`** in `src/components/Sprite.tsx`: an `<svg aria-hidden="true">` with `viewBox="0 0 {width} {height}"`, `shapeRendering="crispEdges"`, CSS width `calc(var(--px) * {width * scale})` and the matching height, `scale` defaulting to 1, one `<rect height="1">` per `SpriteRect` filled with `var(--{token})`.

- [ ] **Step 6: Run** `npm run lint` and `npx tsc -b`. Expected: no output from either.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sprite.ts src/lib/sprite.test.ts src/components/Sprite.tsx
git commit -m "feat: add sprite helper for pixel art drawn in code"
```

---

### Task 2: Tokens and candidate palettes

**Files:**
- Create: `src/tokens.css`, `src/lib/tokens.test.ts`
- Modify: `package.json` (three font packages)

**Interfaces:**
- Produces: the custom properties below, available on `:root`; `[data-palette='b']` overrides the 24 colours; `[data-type='2']` and `[data-type='3']` override the two font tokens.

- [ ] **Step 1: Install the candidate fonts**

Run: `npm install @fontsource/pixelify-sans @fontsource/jersey-10 @fontsource/silkscreen`
Expected: three packages added (all OFL-1.1).

- [ ] **Step 2: Write the failing test** in `src/lib/tokens.test.ts`

The test reads `src/tokens.css` with `node:fs`, extracts the declarations of the `:root` block and of the `[data-palette='b']` block, and checks each palette (B's values layered over A's). Keep the parser and the contrast function local to the test file.

```ts
const RAMPS = { ink: 3, felt: 4, wood: 3, brass: 4, oxblood: 3, smoke: 3, paper: 2, lamp: 2 }

// [text, background]: the only pairs the bible permits for text.
const PAIRS = [
  ['paper-1', 'ink-0'], ['paper-1', 'ink-1'], ['paper-1', 'ink-2'],
  ['paper-1', 'felt-0'], ['paper-1', 'felt-1'], ['paper-1', 'wood-0'],
  ['paper-1', 'oxblood-0'], ['paper-1', 'oxblood-1'],
  ['paper-0', 'ink-1'], ['smoke-1', 'ink-1'], ['smoke-2', 'ink-1'],
  ['brass-2', 'ink-0'], ['brass-2', 'ink-1'], ['brass-2', 'felt-0'], ['brass-3', 'felt-1'],
  ['ink-0', 'brass-2'], ['ink-0', 'brass-3'], ['ink-0', 'paper-1'], ['ink-0', 'lamp-0'],
]

describe.each(['a', 'b'])('palette %s', (name) => {
  it('defines every step of every ramp as a six-digit hex colour', ...)   // 24 tokens, /^#[0-9a-f]{6}$/
  it('gets lighter with each step of a ramp', ...)                        // relative luminance strictly increases
  it.each(PAIRS)('%s on %s is readable', (text, background) => {
    expect(contrast(palette[text], palette[background])).toBeGreaterThanOrEqual(4.5)
  })
})
```

`contrast` is the WCAG 2 contrast ratio from relative luminance.

- [ ] **Step 3: Run** `npx vitest run src/lib/tokens.test.ts`. Expected: FAIL, `src/tokens.css` not found.

- [ ] **Step 4: Write `src/tokens.css`**

`:root` holds palette A, the sizes and type pairing 1:

| Token | A: lamp-lit | B: smoke and oxblood |
|---|---|---|
| `--ink-0` / `-1` / `-2` | `#0a0f0e` `#121c19` `#1c2a26` | `#0b0c12` `#14161f` `#1f2230` |
| `--felt-0` … `-3` | `#0c3a2e` `#135242` `#1c6d55` `#2f8f6c` | `#10362f` `#1a4d44` `#2a6a5b` `#4a8c78` |
| `--wood-0` … `-2` | `#2a1a12` `#4a2e1c` `#6e4628` | `#2b1614` `#4d2620` `#753c2c` |
| `--brass-0` … `-3` | `#6b4a1e` `#a87a2c` `#dab04a` `#f4dc8a` | `#5e4526` `#997238` `#c9a25a` `#ecd79c` |
| `--oxblood-0` … `-2` | `#5c1a1c` `#96302e` `#c8504a` | `#4f1524` `#842238` `#b8404e` |
| `--smoke-0` … `-2` | `#4a5a54` `#7f9289` `#aebdb3` | `#4c5266` `#80879c` `#b0b6c6` |
| `--paper-0` / `-1` | `#d9d2ba` `#f5efdc` | `#d4cfc4` `#f1ece2` |
| `--lamp-0` / `-1` | `#ffd27a` `#fff3c4` | `#ffc98a` `#ffeccc` |

Other tokens on `:root`:

- `--px: 3px`
- `--font-display: 'Press Start 2P', monospace` and `--font-text: 'VT323', monospace`
- `[data-type='2']`: display `'Pixelify Sans'`, text `'VT323'`
- `[data-type='3']`: display `'Jersey 10'`, text `'Silkscreen'`
- Type scale: `--type-1: 10px`, `--type-2: 14px`, `--type-3: 18px`, `--type-4: 28px`, `--type-5: 44px`
- Chips, following real casino colours: `--chip-1: var(--paper-0)`, `--chip-5: var(--oxblood-1)`, `--chip-10: var(--smoke-1)`, `--chip-25: var(--felt-3)`, `--chip-100: var(--ink-2)`

- [ ] **Step 5: Run** `npx vitest run src/lib/tokens.test.ts`. Expected: PASS. If a pair misses 4.5:1, change that colour's lightness only (keep its hue), re-run, and record the changed value in the commit message.

- [ ] **Step 6: Commit**

```bash
git add src/tokens.css src/lib/tokens.test.ts package.json package-lock.json
git commit -m "feat: add speakeasy palette tokens with two candidates"
```

---

### Task 3: The styleguide route, palette and type sections

**Files:**
- Create: `src/styleguide/options.ts`, `src/styleguide/options.test.ts`, `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`
- Modify: `src/main.tsx`, `scripts/capture.mjs`

**Interfaces:**
- Consumes: tokens from Task 2.
- Produces:
  ```ts
  export interface StyleguideOptions { palette: 'a' | 'b'; px: 2 | 3 | 4; type: 1 | 2 | 3 }
  /** undefined unless the query string has a `styleguide` parameter. */
  export function styleguideOptions(search: string): StyleguideOptions | undefined
  /** The query string that selects `options`, for links. */
  export function styleguideHref(options: StyleguideOptions): string
  ```
  `Styleguide.tsx` default-exports `function Styleguide(props: { options: StyleguideOptions })`.

- [ ] **Step 1: Write the failing tests** in `src/styleguide/options.test.ts`

```ts
it('is off unless the styleguide parameter is present', () => {
  expect(styleguideOptions('')).toBeUndefined()
  expect(styleguideOptions('?palette=b')).toBeUndefined()
})
it('opens with defaults however the parameter is written', () => {
  const defaults = { palette: 'a', px: 3, type: 1 }
  expect(styleguideOptions('?styleguide')).toEqual(defaults)
  expect(styleguideOptions('?styleguide=1')).toEqual(defaults)
  expect(styleguideOptions('?x=y&styleguide')).toEqual(defaults)
})
it('reads valid choices and ignores invalid ones', () => {
  expect(styleguideOptions('?styleguide&palette=b&px=4&type=3')).toEqual({ palette: 'b', px: 4, type: 3 })
  expect(styleguideOptions('?styleguide&palette=z&px=99&type=')).toEqual({ palette: 'a', px: 3, type: 1 })
})
it('round-trips through a link', () => {
  const options = { palette: 'b', px: 2, type: 3 } as const
  expect(styleguideOptions(styleguideHref(options))).toEqual(options)
})
```

- [ ] **Step 2: Run** `npx vitest run src/styleguide/options.test.ts`. Expected: FAIL, cannot resolve `./options`.

- [ ] **Step 3: Implement `styleguideOptions` and `styleguideHref`** in `src/styleguide/options.ts` using `URLSearchParams`.

- [ ] **Step 4: Run** `npx vitest run src/styleguide/options.test.ts`. Expected: PASS, 4 tests.

- [ ] **Step 5: Wire the route** in `src/main.tsx`. When `styleguideOptions(location.search)` is defined, render `<Styleguide options={...} />` from `lazy(() => import('./styleguide/Styleguide'))` inside `<Suspense>`; otherwise render `<App />` exactly as now. `./game.css` and the two existing font imports stay in `main.tsx` untouched, so the game cannot change; their global rules (body background, base font) therefore also reach the styleguide page, and the `.styleguide` root must set its own background, colour and font and fill the viewport. `options.ts` is the only styleguide module imported statically.

- [ ] **Step 6: Build the page shell** in `Styleguide.tsx` and `styleguide.css`. `Styleguide.tsx` imports `../tokens.css`, `./styleguide.css` and the font stylesheets (`@fontsource/<name>/latin-400.css` for Pixelify Sans, Jersey 10 and Silkscreen). The root element is `<main className="styleguide" data-palette={palette} data-type={type} style={{ '--px': `${px}px` }}>` with background `--ink-0`, text `--paper-1` in `--font-text`. Add two sections:
  - **Palette:** one row per ramp; each swatch shows the token name, its hex value (read with `getComputedStyle`) and its job. Jobs, verbatim: ink "outlines, deepest shadow, background"; felt "the table, from shadow to lamp-lit"; wood "rails, wheel body, panelling"; brass "metal, gold, the primary button"; oxblood "red pockets, danger, loss"; smoke "muted text, haze, disabled"; paper "text, the ball, chip faces"; lamp "light itself: glow and win flashes".
  - **Type:** the display face and the text face, each at `--type-1` to `--type-5`, labelled with the token and pixel size, using the sample line "FLIPORAMA ROULETTE 0123456789".

- [ ] **Step 7: Add styleguide capture** to `scripts/capture.mjs`. With the argument `styleguide`, go to `<url>?styleguide` plus any `key=value` arguments as extra query parameters, wait 800 ms, save a full-page screenshot to `captures/<desktop|phone>-styleguide.png`, record no video, and exit non-zero with the message `Horizontal overflow: <scrollWidth> > <innerWidth>` if `document.documentElement.scrollWidth > window.innerWidth`. The existing round capture is unchanged.

- [ ] **Step 8: Verify**

Run (dev server up): `npm run capture -- styleguide` then `npm run capture -- styleguide phone`
Expected: both exit 0; read both PNGs and confirm eight ramps with 24 swatches and both faces at five sizes.

Run: `npm run capture`
Expected: exit 0; `captures/desktop-1-idle.png` shows the game as before.

Run: `npm run build`
Expected: `index-*.js` between 391.9 and 393.9 kB, and a separate `Styleguide-*.js` chunk.

- [ ] **Step 9: Commit**

```bash
git add src/main.tsx src/styleguide scripts/capture.mjs
git commit -m "feat: add hidden styleguide page with palette and type"
```

---

### Task 4: Components, sprites and the lit sample

**Files:**
- Create: `src/styleguide/sprites.ts`
- Modify: `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`

**Interfaces:**
- Consumes: `sprite`, `Sprite` (Task 1); tokens (Task 2).
- Produces: from `sprites.ts`, `LAMP: SpriteData`, `RAIL: SpriteData`, and `chip(value: 1 | 5 | 10 | 25 | 100): SpriteData`; from `Styleguide.tsx`, an exported `function LitSample()` that Task 5 reuses as the comparison sample.

- [ ] **Step 1: Draw the sprites** in `src/styleguide/sprites.ts`, obeying the lighting rules in Global Constraints:
  - `chip(value)`: 12 × 12, round, `ink-0` outline, face in `chip-<value>`, a lighter top rim and darker bottom rim, four edge stripes in `paper-1` (`brass-2` for the 100).
  - `LAMP`: 24 × 14, a green shade (`felt` ramp) with a `brass` rim and a `lamp-1` bulb edge showing beneath.
  - `RAIL`: 16 × 6, a tileable piece of `wood` with a `brass-3` top highlight and an `ink-0` bottom line.

- [ ] **Step 2: Add the Components section**: a primary button (`brass-2` face, `ink-0` text, hard `ink-0` shadow offset by `--px` × 2) and a secondary button (`ink-2` face, `paper-1` text), each shown in rest, hover, pressed (shadow gone, face moved down by the shadow offset) and disabled (`smoke-0`); a red, a black and a zero tile (`oxblood-1`, `ink-1`, `felt-2`) with `paper-1` numbers in the display face, a lit top edge and a shadowed bottom edge; the five chips singly and as a stack of five, each chip raised `--px` × 2 above the one below; a panel (`ink-1` face, `ink-2` top edge, `ink-0` shadow).

- [ ] **Step 3: Add the Sprites section**: `LAMP`, `RAIL` and `chip(25)` at `scale` 1, 2 and 4.

- [ ] **Step 4: Build `LitSample`**: a felt patch about 96 × 56 art pixels with `RAIL` tiled along its top, `LAMP` centred above it and a chip stack on it. The light pool is a `radial-gradient` centred under the lamp with hard stops stepping `felt-3`, `felt-2`, `felt-1`, `felt-0`; between each pair of steps a band two art pixels wide carries a 2 × 2 checker of the two neighbouring colours (a repeating background sized `calc(var(--px) * 2)`, limited to the band with a radial `mask-image`). The stack casts a hard shadow in the next darker felt step, straight down.

- [ ] **Step 5: Verify**

Run: `npm run capture -- styleguide` and `npm run capture -- styleguide phone`
Expected: both exit 0. Read the PNGs and check, against Global Constraints: no blurred sprite edges at any scale; light on top edges and shadow on bottom edges everywhere; the light pool shows four steps with dithered bands and no smooth gradient.

Run: `grep -rnE "#[0-9a-fA-F]{3,8}\b" src/styleguide src/components/Sprite.tsx`
Expected: no matches.

- [ ] **Step 6: Commit**

```bash
git add src/styleguide
git commit -m "feat: add components, sprites and lit sample to styleguide"
```

---

### Task 5: The choices and the draft bible

**Files:**
- Create: `docs/art-bible.md`
- Modify: `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`

**Interfaces:**
- Consumes: `LitSample` (Task 4); `StyleguideOptions`, `styleguideHref` (Task 3).

- [ ] **Step 1: Add the Choices section** as the first section. Three groups, each showing its options side by side (stacked on a narrow screen), every option rendering `LitSample` plus one line of display and one line of text type inside a wrapper that overrides only that group's attribute (`data-palette`, `--px`, or `data-type`) and inherits the page's other two:
  - Palette: "A: Lamp-lit", "B: Smoke and oxblood"
  - Pixel size: "2 px: fine", "3 px: medium", "4 px: chunky"
  - Type: "1: Press Start 2P + VT323", "2: Pixelify Sans + VT323", "3: Jersey 10 + Silkscreen"

  Each option is a link built with `styleguideHref` that applies it to the whole page; the current selection is marked with a `brass-2` outline and `aria-current="true"`. Under the groups, show the current combination as text, for example `palette=b px=3 type=2`, so the owner can read their pick back.

- [ ] **Step 2: Write `docs/art-bible.md`** with these sections, each rule followed by its reason: Setting; Palette (the ramp table with jobs, the chip colours, the permitted text pairs copied from `PAIRS` in `src/lib/tokens.test.ts`); Lighting; Pixel grid; Type (the five-size scale); Motion (the five rules from the spec's Motion section); Drawing in code (how to add a sprite, with the `GEM` example from the spec). Mark Palette values, pixel size and type faces as "pending the owner's choice".

- [ ] **Step 3: Verify**

Run: `npm run capture -- styleguide`, `npm run capture -- styleguide phone`, and `npm run capture -- styleguide palette=b px=4 type=3`
Expected: all exit 0 (no horizontal overflow on phone). Read the PNGs: every option differs from its neighbours only in its own dimension, and the third capture shows the whole page in palette B, 4 px, type 3.

Run: `npm test`, `npm run lint`, `npm run build`
Expected: all pass; `index-*.js` between 391.9 and 393.9 kB.

- [ ] **Step 4: Commit and push**

```bash
git add docs/art-bible.md src/styleguide
git commit -m "feat: add side-by-side art direction choices to styleguide"
git push -u origin feat/art-direction-bible
```

- [ ] **Step 5: OWNER GATE.** Ask the owner to open `http://localhost:5173/?styleguide`, click through the options, and reply with one pick per group. Do not start Task 6 until they have.

---

### Task 6: Lock the choices

**Files:**
- Delete: `src/styleguide/options.ts`, `src/styleguide/options.test.ts`
- Modify: `src/tokens.css`, `src/lib/tokens.test.ts`, `src/main.tsx`, `src/styleguide/Styleguide.tsx`, `src/styleguide/styleguide.css`, `scripts/capture.mjs`, `package.json`, `docs/art-bible.md`, `CLAUDE.md`, `docs/roadmap.md`

- [ ] **Step 1: Reduce `src/tokens.css` to the picks**: `:root` holds the chosen palette, pixel size and font pair; the `[data-palette]` and `[data-type]` blocks are deleted.

- [ ] **Step 2: Update `src/lib/tokens.test.ts`** to check the single `:root` palette (drop `describe.each`).

- [ ] **Step 3: Remove the choosing machinery**: delete the Choices section and its styles; `Styleguide` takes no props; `src/main.tsx` checks `new URLSearchParams(location.search).has('styleguide')` directly; delete `options.ts` and its test; `scripts/capture.mjs` drops the extra `key=value` handling.

- [ ] **Step 4: Uninstall unchosen fonts** with `npm uninstall`, and remove their imports. If the chosen pair does not use Press Start 2P or VT323, leave those installed: the game still uses them until Phase 2.

- [ ] **Step 5: Finalise `docs/art-bible.md`**: replace every "pending the owner's choice" with the chosen values and one sentence on why it was chosen (the owner's words if they gave a reason).

- [ ] **Step 6: Point later sessions at it.** In `CLAUDE.md`, under "Checking visual work", add: "Read `docs/art-bible.md` before any visual work; it fixes the palette, lighting, pixel grid, type and motion rules. See them applied at `/?styleguide`."

- [ ] **Step 7: Verify**

Run: `npm test`, `npm run lint`, `npm run build`
Expected: all pass; `index-*.js` between 391.9 and 393.9 kB.

Run: `npm run capture -- styleguide`, `npm run capture -- styleguide phone`, `npm run capture`
Expected: all exit 0; the styleguide shows one palette with no Choices section; the game is unchanged.

Run: `grep -rn "data-palette\|data-type\|pending the owner" src docs/art-bible.md`
Expected: no matches.

- [ ] **Step 8: Commit and push**

```bash
git add -A
git commit -m "feat: lock art direction choices into the bible"
git push
```

- [ ] **Step 9: OWNER GATE.** Ask the owner to approve the finished page at `/?styleguide`. On approval: tick Phase 1 in `docs/roadmap.md`, set "Current phase" to 2, replace "Notes for next session" with what Phase 2 must know (the chosen palette, pixel size and fonts; that `src/game.css` still holds 40 untokenised colours to migrate; that a chip on a straight bet covers the tile's number), commit, push, and open a pull request into `main` with `gh pr create`.

# Phase 4: screen effects and juice. Design

Written during the overnight run of 2026-10-13. The owner was not available, so where the roadmap protocol says to brainstorm, the assistant chose what it would have recommended. Each choice is marked **Decided** with its reason, so the owner can overrule it in review.

## Goal

From `docs/roadmap.md`: a WebGL layer over the page (CRT curvature and scanlines, bloom on gold, chromatic split on big wins, film grain) with a settings toggle and a low-power fallback, and a particle system for chips, sparks and confetti that replaces the stopgaps left by Phase 2. Done when effects hold 60 fps on a phone and the game is fully playable with them off.

## What a layer over the page can and cannot do

The game is DOM and CSS (the choice made in Phase 1). A canvas laid over it cannot read the pixels beneath it, so it cannot bend, blur or recolour the page. It can only add light and add darkness. That fixes how each effect is made:

| Effect | How | Honest limit |
|---|---|---|
| Scanlines | The layer darkens one screen row in every art pixel. | None. |
| Film grain | The layer darkens each art pixel by a small amount that changes twelve times a second. | Grain only darkens; it never adds bright specks. |
| CRT curvature | The layer draws the tube's rounded corners in `ink-0` and a vignette whose bands bow like a curved screen. | The page itself stays flat. Straight lines do not bend. |
| Bloom on gold | The layer adds `lamp-0` light in stepped, dithered rings round the lamp's bulb and, during a win, round the win banner. Strength follows the room's light number. | Light is added where the layer is told gold is, not wherever gold happens to be. |
| Chromatic split | An SVG filter on the game area and the win banner pulls red and blue apart by whole art pixels for a quarter of a second. | Only on big and huge wins, only at the "full" setting. |

**Decided: keep the DOM and draw over it.** True curvature and true bloom need the whole game drawn into a texture, which means moving the table to canvas and giving up the accessibility and the code that Phases 1 to 3 kept. *Why:* Phase 1 already made this choice for that reason, and Phase 7 needs the DOM for keyboard and screen-reader play.

**Decided: the layer obeys the art bible.** Its darkness is `ink-0` and its light is `lamp-0`, read from the tokens. Its vignette and glow fall off in flat steps joined by ordered dither, one cell per art pixel, never a smooth gradient. *Why:* a soft photographic vignette over hard pixels is exactly the "blurred photo of pixel art" the bible rules out.

## Settings

Three settings now exist, so they move into one panel behind a single top-bar button, as the Phase 3 notes asked.

- **Sound:** on or off (as before, `fliporama-muted`).
- **Room animation:** on or off (as before, `fliporama-scene`).
- **Screen effects:** full, low or off (`fliporama-effects`).

| | Full | Low | Off |
|---|---|---|---|
| Scanlines, corners, vignette | yes | yes | no |
| Glow that follows the light | yes | yes | no |
| Moving grain | yes | no: the layer is redrawn only when something changes | no |
| Chromatic split | yes | no | no |
| Particles | yes | half as many | no |

**Decided: effects start "off" when the system asks for reduced motion, otherwise "full".** *Why:* the same rule and default as room animation, as the Phase 3 notes asked. With reduced motion on and effects switched on by hand, the still parts of the layer show; grain, the split and particles stay off.

**Decided: an automatic step down.** At "full" the grain is redrawn twelve times a second. If those redraws arrive more than half late on average for two two-second stretches in a row, the layer drops to "low" for the rest of the visit without changing the stored choice. The settings panel then shows "Low". If WebGL is missing, the layer is simply absent. *Why:* the roadmap asks for a low-power fallback, and a player should not need to find a setting to stop a stutter.

**Decided: the panel is a native popover.** *Why:* focus handling, Escape and click-away come from the browser; no library and little code. Browsers from before 2024 without popover support get the three controls inline in the top bar's place, because an unsupported `popover` attribute is ignored and the panel is then just visible.

The layer stops when the tab is hidden. It does not stop when the scene scrolls out of view, because the layer covers the whole screen.

## Particles

One 2D canvas over the page, one canvas pixel per art pixel, drawn in palette tokens. The simulation is a pure module, `src/lib/particles.ts`, with a test beside it; `emit(kind, x, y)` works like `play(name)` in `sound.ts` and does nothing when no canvas is listening.

| Burst | When | What flies |
|---|---|---|
| `land` | a chip lands | a few `smoke` specks kicked out sideways and two `lamp` sparks |
| `win` | a big win is counted out | chip sprites thrown up from the banner on arcs, falling off the screen, with `lamp` sparks |
| `jackpot` | a huge win | more of the same, plus confetti in the five chip colours |

Particles are hard things in the art bible's sense: they do not squash or fade; they fly on arcs under gravity, on whole art pixels, and are gone when their time is up or they leave the screen.

They replace three stopgaps:

- the win burst in `WinTally.tsx`, which flung DOM chips in straight lines and covered the banner;
- the chip-landing puff (`.chip-puff`), a smooth ring;
- the two off-palette `brightness()` flashes: the tile under a landing chip keeps its one-pixel dip and gets sparks instead, and the winning pocket blinks between two palette colours.

**Decided: with effects off there is no burst at all.** *Why:* "off" should mean off, and the win is still told by the banner, the count-up, the sound and the shake.

## Performance

Measured as in "Budgets, as measured": `node scripts/perf/round.mjs` and `idle.mjs`, twice each, production preview, 4x slowdown, compared with the follow-ups branch this phase starts from.

The layer is one full-screen quad with a short fragment shader, drawn at one canvas pixel per CSS pixel regardless of device pixel ratio, twelve times a second. The particle canvas runs a frame loop only while something is in the air.

**Decided after measuring: the grain holds still while the wheel spins.** With the grain moving through the spin, a round at desktop size averaged 20.4 and 19.3 ms a frame with 81 and 56 frames over 20 ms; with it held still, 18.2 and 18.4 ms with 36 and 37, the same as before this phase. *Why:* the wheel's overlay darkens the page behind it, so moving grain is hardly seen there, and the spin is the one moment with no frame time to spare. Scanlines, corners and vignette stay.

## Left to the owner's eye

Everything here is built to the owner gate and not past it: how strong the scanlines, grain, vignette and glow are, how long the split lasts, how many particles fly and how they arc. Each strength is a named constant at the top of its file.

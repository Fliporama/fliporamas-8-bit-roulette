# Roadmap: Fliporama Roulette to an award-grade site

**Current phase:** 5 (The first ten seconds), not started
**To resume in a new session:** say "continue the roadmap". The session protocol is in `CLAUDE.md`.

## Brief

Agreed on 2026-10-12.

- **Goals, in order:** (1) a design-award submission (Awwwards, FWA, CSS Design Awards), (2) a portfolio showpiece, (3) a game people share.
- **Look:** elevated pixel art. Pixel art stays the identity, made rich with lighting, a living scene and a CRT treatment. References: Balatro, Celeste.
- **Art source:** drawn in code (SVG, canvas, shaders). No outside artist, no asset packs.
- **Motion:** smooth and cartoony, built on the 12 principles of animation. The roulette ball is the exception: it is a rigid marble and never deforms.
- **Assumed, not yet confirmed:** stays free-play with no real money; hosted on Vercel; no backend until Phase 9 needs one.

No one can promise an award. The roadmap aims at what juries score: design, creativity, usability and content, on desktop and phone.

## Budgets

Every phase must stay inside these. Phase 7 enforces them.

- 60 fps on a mid-range phone during a chip toss, a spin and a win tally.
- Lighthouse 95 or higher in all four categories.
- First load under 200 kB of JavaScript, gzipped. At the start of Phase 0 it was 126 kB.

## Phases

One phase is one session. Each gets its own brainstorm, spec (`docs/superpowers/specs/`) and plan (`docs/superpowers/plans/`) when its session starts.

### Part A: award-grade experience

- [x] **Phase 0. Foundations** (done 2026-10-12)
  - Roadmap, `CLAUDE.md` and memory entry.
  - Playwright, so a session can take real screenshots and record animations.
  - Pull request for `feat/pixel-roulette` into `main`.
  - Vercel preview so every phase has a shareable link.
  - Done when: a fresh session can run, test, screenshot and deploy from `CLAUDE.md` alone.

- [x] **Phase 1. Art direction bible** (done 2026-10-13)
  - One page of rules everything else obeys: a limited palette (about 24 colours), one pixel grid with integer scaling, two typefaces, a lighting model, and the motion language.
  - A small spike to choose the rendering approach: keep DOM and CSS with a canvas effects layer on top (recommended: it keeps accessibility and today's code), or move the table to a low-resolution canvas.
  - A hidden `/styleguide` page showing palette, type, buttons, chips and tiles in the new style.
  - Done when: the owner approves the styleguide page. Nothing else is restyled yet.

- [x] **Phase 2. The table, restyled** (done 2026-10-13)
  - Apply the bible to what exists: felt with texture and worn edges, embossed tiles, chips with edge stripes, a wheel with wood grain, metal and depth, a console that looks like a machine rather than a web sidebar.
  - Done when: a screenshot of the idle table is worth posting on its own.

- [x] **Phase 3. A living scene** (done 2026-10-13)
  - A casino room around the table in parallax layers: lamp light pooling on the felt, drifting smoke, a croupier who reacts to the game, background life that idles.
  - The room responds: lights dim when the wheel spins and flare on a win.
  - Done when: the page looks alive with no input for 30 seconds.

- [x] **Phase 4. Screen effects and juice** (done 2026-10-13)
  - A WebGL post-processing layer over the page: CRT curvature and scanlines, bloom on gold, chromatic split on big wins, film grain. A settings toggle and a low-power fallback.
  - A particle system for chips, sparks and confetti, replacing the simple burst in `WinTally.tsx`.
  - Done when: effects hold 60 fps on a phone and the game is fully playable with them off.

- [ ] **Phase 5. The first ten seconds**
  - An arcade power-on boot sequence, a title screen with attract mode, scene transitions, and a short playable tutorial for the bet types.
  - Juries decide early; this phase is the biggest single lever on a score.
  - Done when: a stranger understands what this is and places a bet within 15 seconds, with no text explanation.

- [ ] **Phase 6. Sound and music**
  - An adaptive chiptune soundtrack built on `src/lib/sound.ts`: a calm loop while betting, rising tension during the spin, a sting per win tier.
  - Richer effects, and volume controls beside the mute button.
  - Done when: playing with sound on feels clearly better than with it off, and nothing clips or overlaps.

- [ ] **Phase 7. Phone, accessibility and performance**
  - Touch-first layout, haptics, landscape and portrait.
  - Full keyboard play, screen-reader announcements, reduced motion, colour-blind-safe red and black.
  - Meet the budgets above; test on real Safari and Android Chrome.
  - Done when: Lighthouse is 95 or higher in all categories and a full round can be played by keyboard alone.

- [ ] **Gate A: submission-ready.** The owner plays it end to end on desktop and phone and signs off before anything is submitted.

### Part B: portfolio showpiece

- [ ] **Phase 8. Packaging**
  - A case-study page: the idea, the art bible, the 12 principles breakdown, before and after.
  - Custom domain, social preview image, favicon set, a 20-second capture video and GIFs.
  - A clean README and privacy-friendly analytics.
  - Done when: the link pasted into a chat or a CV shows a good preview and the case study reads well in two minutes.

### Part C: a game people share

- [ ] **Phase 9. Reasons to come back**
  - Saved bankroll and statistics, achievements, a daily seeded challenge, a shareable result card.
  - A global leaderboard is the one item that needs a backend; decide on it at the start of this phase.
  - Done when: there is a reason to open it tomorrow and a one-click way to show a result to a friend.

- [ ] **Phase 10. Launch**
  - Submit to Awwwards, FWA and CSS Design Awards. Awwwards charges a submission fee; the owner decides at the time.
  - Post to itch.io, Show HN and relevant subreddits, with the capture video.
  - Check each venue's rules on gambling-themed content first. The game is free-play with no cash value, and the footer must keep saying so.

## Order and dependencies

- Phases 0 to 2 are strictly in order: everything later builds on the bible and the restyled table.
- Phases 3, 4 and 6 are independent of each other and can be reordered.
- Phase 5 follows 3 and 4, because the intro uses the scene and the effects.
- Phase 7 is last in Part A, because it tunes everything before it.
- Phase 9 can be pulled earlier if the owner would rather have the hook before the polish.

## Notes for next session

Update this section at the end of every session: what was finished, what was left half-done, and anything the next session must know.

### Before Phase 6: the audit fixes

The owner asked for these once the Phase 5 pull request has merged, on their own branch off `main`. They come from a whole-tree audit for over-engineering on 2026-10-13; about 125 lines go and no dependency does.

1. Four hand-written copies of "a stored setting that survives blocked storage" (`src/lib/scene.ts`, `effects.ts`, `sound.ts`, `intro.ts`) and three separate reads of the reduced-motion media query (the third is in `src/App.tsx`). One `stored(key)` helper and one `prefersReducedMotion()`.
2. The frame-gap measuring loop and the browser set-up are written out in `scripts/capture.mjs`, `scripts/perf/idle.mjs` and `scripts/perf/round.mjs`. One shared helper.
3. `createOutsideTarget` in `src/lib/roulette.ts` is a 40-line switch that picks numbers, a label and a multiplier. A lookup table.
4. `calculateReturns` in `src/lib/roulette.ts` is called only by tests; the game uses `buildTally().returned`. Delete it and its two tests, and assert the number directly in `tally.test.ts`.
5. The list of inside bet kinds is declared in `RouletteTable.tsx`, `ChipLayer.tsx` and `App.tsx`. Export one `isInside(kind)` from `roulette.ts`.
6. `HandStep`, `EyesEvent`, `WallView` and `WheelView` are exported but used only in their own files or tests. Drop the `export`.

### How Phase 5 was run, and how to run Phase 6

The owner is trying subagent-driven execution for Phases 5 and 6: a fresh subagent builds each task of the plan, a fresh reviewer checks it, and one reviewer reads the whole branch at the end. Run Phase 6 the same way, with every subagent on Opus 5.5 (the owner asked for that part-way through Phase 5, whose tasks had run on Sonnet).

What the trial showed in Phase 5: the per-task reviewers read diffs and caught logic and checks that could not fail, but every visual fault was found by the controller reading a screenshot (a title card that hid the room; a phone page that loaded scrolled half-way down). Keep reading the stills yourself.

### What Phase 5 left

- **The stage.** `App` holds one value, `boot`, `title` or `play` (`Stage` and `firstStage` in `src/lib/intro.ts`). The header, the game and the footer are `inert` until `play`, and the room's light is held at dim.
- **The layers** are `src/components/Boot.tsx`, `Title.tsx` and `GhostHand.tsx`. They render as siblings after `.app-shell`, not inside it: the shell's entrance animation makes it the containing block for fixed-position children for its first 420 ms, which once put the title half-way down a phone page. Any new full-screen layer belongs there too. Stacking order in `src/game.css`: hand 7, title 8, boot 9, wheel overlay 10, particles 11, screen effects 12.
- **One stored flag,** `fliporama-intro`, set at the player's first click or key press in the game. Until then a reload boots again. "Replay intro" in the settings panel clears it and resets the session.
- **`/?play`** opens the game with no intro. The round and idle captures and every script in `scripts/perf/` use it.
- **The title ignores a press for its first 300 ms,** so the click or key that skips the boot cannot also start the game. A script must wait 400 ms after the title appears before pressing start.
- **The hand's steps are data:** `HAND_STEPS` in `src/lib/intro.ts` (the 25 chip, number 17, the spin button). It measures its target at the start of each step, skips one that is off screen, and marks what it taps with a `data-tapped` attribute. It changes no game state.
- **Bet-type previews:** the first time a mode is picked, `RouletteTable` lights the numbers in `PREVIEW_EXAMPLE` for a second through its `preview` prop.
- **A `start` particle burst,** set off from the start button.
- **`npm run capture -- intro`** (also `phone` and `reduced`) plays a first visit and fails if a bet cannot be placed within 15 seconds. Measured: 7.3 s on desktop, 7.1 s at phone size.
- **For Phase 6 (sound):** nothing in the intro makes a sound. The boot's line and flicker, the start press, the card's lift and the hand's taps are the places for it.
- **For Phase 7 (phone):** at 390 px the hand skips number 17 because it is below the fold, and the title card covers the croupier's face.
- **Not done:** nothing was added to `/?styleguide` for the boot, the title or the hand. No stranger has tried it; the 15-second capture is the stand-in.
- **Budgets, as measured for Phase 5:** first load is 140.2 kB of JavaScript gzipped. The title at rest measures 16.7 ms a frame at 4x slowdown (`TITLE=1 node scripts/perf/idle.mjs`; one row of eight read 16.9 ms). Frame times for a round could not be compared with the table below: the machine was slow and noisy that day, and `main` itself measured 21 to 24 ms at desktop size against the 18.4 ms recorded, with this branch between 20 and 38 ms over five runs. With `/?play` none of the intro's layers is mounted, and the review found nothing that adds work per frame in play. Measure a round again on a quiet machine before trusting either number.
- **Small things left by the review:**
  - A held Enter on the start button can dismiss the tutorial hand before it shows: key repeats land in the game once focus moves to the first chip.
  - On a phone the tiles a bet-type preview lights are at or below the fold when the mode is picked from the top of the page.
  - A click on a disabled control (the spin button before any bet) does not dismiss the hand.
  - The boot's durations are stated in both `Boot.tsx` and `src/game.css`; change them together.
  - `scripts/capture.mjs` still appends `?styleguide` to a URL without checking for an existing query.
  - The hand rests at fractional screen coordinates, not on the art-pixel grid.

### Overnight run, 2026-10-13 (finished 05:30)

Unattended, at the owner's request. It produced two pull requests, both merged by the owner's instruction later the same day:

- **#6:** the wheel painter and the review backlog.
- **#7:** Phase 4. Its spec (`docs/superpowers/specs/2026-10-13-screen-effects-design.md`) marks each choice made in the owner's place as "Decided", with its reason.

**Phase 4 was ticked without the owner judging it by eye.** They merged it and moved on to Phase 5. Every strength and timing of the screen layer, the colour split and the particles is still open to change if they ask, and "60 fps on a phone" has not been checked on a real phone.

### What Phase 4 left

- **Three settings, one panel.** `src/components/Settings.tsx` is a native popover behind one top-bar button: sound, room animation, screen effects (full, low, off; `src/lib/effects.ts`, stored as `fliporama-effects`). Phase 6's volume controls belong in it.
- **The screen layer** is `src/components/ScreenEffects.tsx`: one WebGL canvas over the page. It can only add darkness and add light; it cannot bend or blur the page, so "CRT curvature" is rounded corners and a bowed vignette, and "bloom" is lamp light added round the bulb and the win banner. Every strength is a constant at the top of that file. It reads the room's light number, holds its grain still during a spin, and steps down to "low" by itself if it cannot keep pace.
- **Particles:** `emit(kind, x, y)` from `src/lib/particles.ts` works like `play(name)`; `src/components/Particles.tsx` draws them. Bursts are `land`, `win` and `jackpot`. Phase 5's boot sequence and transitions can add kinds there.
- **The colour split** on big and huge wins is two SVG filters in `ScreenEffects.tsx` and the `split` keyframes in `src/game.css`.
- **Looking at a win:** `node scripts/perf/win.mjs` plays rounds until a big win and saves stills to `captures/win-*.png`, with the settings panel in `win-0-settings.png`. A huge win (the `jackpot` burst and the wide split) has not been seen in a capture: it needs a single straight bet to come in.
- **Not done:** nothing was added to `/?styleguide` for the layer or the particles. No real phone was tested; "60 fps on a phone" rests on the 4x-slowdown numbers below.

- **2026-10-13, Phase 3 done.** The owner approved the room: a lit wall behind the page, and above the table a scene with a hanging lamp, a croupier, smoke, a frosted door with passing silhouettes, a clock, a fan and a gramophone. Read `docs/art-bible.md` before any visual work.

### What Phase 4 was built on

- **The room's light is one number.** `useRoomLight` in `src/lib/useRoomLight.ts` returns a shift in light steps (-1 dim, 0 normal, 1 flare, with a brief -0.5 flicker) derived from game state by `lightFor` in `src/lib/scene.ts`. The felt, the scene's wall and the lamp all read it, and `#game` carries the shown level as `data-light`. A WebGL layer (bloom on a flare, a darker vignette on a dim) should read the same number rather than derive its own.
- **Settings.** Room animation is one top-bar button, stored as `fliporama-scene` by `src/lib/scene.ts`, beside mute (`fliporama-muted` in `src/lib/sound.ts`). Phase 4's effects toggle and low-power fallback make three settings: that is the point to build a settings panel and move all of them into it.
- **What "off" means.** With room animation off the room is still drawn but nothing moves and the light stays at normal. It starts off when the system asks for reduced motion. Screen effects should follow the same rule and the same default.
- **Stop when unseen.** `useLive` in `src/lib/useLive.ts` is true only while the setting is on, the tab is visible and the element is on screen. The scene adds the class `is-still` when it is false. Any effects loop should stop on the same signal; `npm run capture -- idle` fails if the scene keeps animating out of view.
- **How art is made.** Per-pixel pictures are pure functions painted by `paint` in `src/lib/palette.ts` (`felt.ts`, `wall.ts`, `smoke.ts`, `wheelPixels.ts`). Large sprites are drawn from shapes with `sketch()` in `src/lib/sketch.ts` (`src/sprites/room.ts`, `src/sprites/croupier.ts`); small ones are character grids. `Sprite` is memoised: never mutate sprite data in place.
- **Particles replace three stopgaps** from Phase 2: the win burst in `src/components/WinTally.tsx` (chip sprites flung from the banner, briefly covering it), the chip-landing puff (`.chip-puff`, a smooth ring), and the off-palette brightness flashes (`THUNK` in `src/components/ChipLayer.tsx`, the `winner` keyframes in `src/game.css`).
- **Furniture is not relit.** Only the wall, felt and lamp change with the light; the door, clock, fan, gramophone and croupier keep their colours. A post-processing pass is the natural place to dim or flare them together.
- **Captures:** `npm run capture` (round, then a 700 px resize), `-- phone` (390 px, then 360 px), `-- reduced`, `-- idle` (30 untouched seconds, the out-of-view check, and frame times at 4x CPU slowdown) and `-- styleguide`. The round capture also asserts the light is dim during a spin and normal afterwards.

### Budgets, as measured

Production build, 4x CPU slowdown, on the owner's machine:

| | Desktop size | Phone size |
|---|---|---|
| Room idle, animation on or off | 16.7 ms average, no frame over 20 ms | 16.7 ms average, no frame over 20 ms |
| A full round, before the overnight run | 26.5 and 23.5 ms average; 139 of 572 and 175 of 626 frames over 20 ms | 18.3 and 18.3 ms; 46 of 778 and 36 of 782 |
| A full round, now | 18.4 and 19.0 ms average; 34 of 816 and 44 of 782 frames over 20 ms | 18.4 and 18.2 ms; 28 of 795 and 22 of 803 |

Each cell gives two runs of `node scripts/perf/round.mjs` against the production preview.

- **The spin is close to 60 fps but does not hold it.** The wheel is now painted by `wheelPainter` in `src/lib/wheelPixels.ts`, which works out each pixel's geometry once per size; a test holds it to `wheelPixel` at every pixel. What is left is a handful of long frames (the worst is 130 to 200 ms) and about one frame in twenty-five over 20 ms. In a profile of a spin (`SPIN=1 node scripts/perf/profile.mjs 1440 900`, dev build) the painter is still the largest script cost at about a seventh of the time, and the browser's own work (style, paint, compositing) is twice that. The long single frames have not been traced; the likely places are the overlay opening and React re-rendering the table when a bet is placed or the tally starts.
- **With Phase 4's effects at "full"**: a round measures 18.2 and 18.4 ms at desktop size with 36 and 37 frames over 20 ms, and 17.6 and 18.1 ms at phone size with 15 and 23; the idle page stays at 16.7 ms. That is the same as without them, because the grain holds still during the spin. With the grain left moving, the desktop round was 20.4 and 19.3 ms with 81 and 56 slow frames. These runs use a headless browser, whose graphics are drawn in software; a real GPU should do no worse.
- **Measuring:** `scripts/perf/round.mjs` and `idle.mjs`, twice each, against `vite preview` rather than the dev server (the dev build is slower and noisier).
- **First load:** 135.0 kB of JavaScript gzipped before Phase 4 and 138.6 kB with it, in three files, against the 200 kB budget.

### Left for later phases

- **Phase 7 (phone, accessibility, performance):**
  - The long frames in a round, as above.
  - On a phone the title sign and the scene put about 490 px above the table, so a player scrolled down to the felt sees little of the croupier or the wall's dim and flare. The scene is 288 px tall at every width because the croupier is drawn 204 px tall.
  - Reading order: the "PLACE YOUR BETS" heading now comes before the page's main "ROULETTE" heading, and the scene is a named region whose only exposed content is its own label.
  - With the system's reduced motion on and room animation turned on by hand, the CSS cycles (sway, breathing, fan, record, pendulum) stay off while smoke, blinks, silhouettes and light changes run.
  - A tile's focus ring may be partly hidden by its neighbours. Below 760 px the console is a single centred column.
  - Never exercised by hand: resetting the session mid-spin (traced in review as clean, not played).
- **Small things, any phase:**
  - Pausing holds CSS cycles (sway, breathing, fan, record, pendulum) mid-frame rather than resetting them; the comments in `src/game.css` now say so. With room animation off the clock shows the time the page loaded.
  - Pieces placed from the right edge of the stage (the fan, the wheel on its stand) can still sit off the art-pixel grid when the stage is not a whole number of art pixels wide. The centred pieces are snapped; `node scripts/perf/grid.mjs` checks them.
  - The fixtures' sizes (door, fan, clock, gramophone boxes) are still stated in `src/game.css` as well as by their sprites.
  - No tests for `useLive`, or for the timers in `Croupier.tsx` and `Fixtures.tsx` themselves; the decisions they make are tested in `src/lib/gaze.ts`, `runLight` in `src/lib/scene.ts` and `untilNextMinute` in `src/lib/clock.ts`. The colour test does not catch named colours.
  - From Phase 2: the circling ball rides the wood rim and loses two pixels at the wheel's outline.

### Standing facts

- **Vercel:** project `fliporama-roulette` in team `choy-lee` deploys every push; production is `fliporama-roulette-choy-lee.vercel.app`, built from `main`. Every URL sits behind Vercel login; opening them up is a project setting for the owner (needed by Phase 8 at the latest).
- **Sessions:** `CLAUDE.md` says one phase per session. Phases 1 to 3 were done in a single session at the owner's request.

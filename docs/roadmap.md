# Roadmap: Fliporama Roulette to an award-grade site

**Current phase:** 3 (A living scene), not started
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

- [ ] **Phase 3. A living scene**
  - A casino room around the table in parallax layers: lamp light pooling on the felt, drifting smoke, a croupier who reacts to the game, background life that idles.
  - The room responds: lights dim when the wheel spins and flare on a win.
  - Done when: the page looks alive with no input for 30 seconds.

- [ ] **Phase 4. Screen effects and juice**
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

- **2026-10-13, Phase 2 done.** The owner approved the restyled game. Every colour in `src/` now comes from `src/tokens.css` (a test, `src/lib/colours.test.ts`, fails otherwise), and `/?styleguide` uses the game's real `.button`, `.pocket` and `.panel` classes. Read `docs/art-bible.md` before any visual work.

### What Phase 3 builds on

- **The page background is `--ink-1`, not `--ink-0`**, so ink outlines and hard shadows show against it. The room goes behind `.app-shell`; anything drawn there should stay dark enough that the table and cabinet outlines still read.
- **The lamp is drawn but not hung.** `LAMP` is in `src/styleguide/sprites.ts`; move it to `src/sprites/` when the game uses it. The felt is already lit as if it hangs above the table's top centre.
- **Where the light is decided.** The felt's pool of light is `feltStep` in `src/lib/felt.ts` (`POOL` sets its centre and reach). The wheel's lighting is the last few lines of `wheelPixel` in `src/lib/wheelPixels.ts` (`LIGHT`). To dim the room during a spin and flare it on a win, give both a brightness input and redraw; `Felt` only redraws on resize today, and `WheelCanvas` redraws when a motion value changes.
- **Canvases:** per-pixel art is a pure function from an art pixel to a palette token, painted by `paint` in `src/lib/palette.ts`, one canvas pixel per art pixel. Smoke and light shafts should be made the same way. Sprites (chips, rail, icons) are in `src/sprites/`.
- **The heading holds a still wheel** (`.heading-wheel` in `src/App.tsx`) and the spin opens the large one in an overlay. If the croupier or scene needs that space, the heading is the place to rearrange.
- **Contrast is tested.** Text may only use the pairs in `PAIRS` in `src/lib/tokens.test.ts`. Labels on the felt (the outside bets) are readable only where the felt is `felt-2` or darker, so a brighter or wider light pool can break them: check before changing `POOL`.
- **Three checks exist for layout:** `npm run capture` (ends with a live resize to 700 px), `-- phone` (ends at 360 px) and `-- reduced`. All fail on sideways scrolling or a console error.

### Left for later phases

- **Phase 4:** the brightness flashes inside animations are still off-palette (`THUNK` in `src/components/ChipLayer.tsx`, the `winner` keyframes in `src/game.css`), and the chip-landing puff is a smooth ring. The win burst is chip sprites flung from the banner and covers it briefly.
- **Phase 7:**
  - Painting the wheel allocates on every frame. It measured fine for a phone-sized wheel, but a slow tablet or laptop drawing the full 172-pixel wheel may miss 60 fps: reuse the `ImageData`, write its bytes directly, and profile with CPU throttling.
  - At peak spin speed the wheel is drawn one frame behind its number overlay.
  - Below 760 px the console is a single centred column; the phone layout as a whole is still the old one, restyled.
  - A tile's focus ring may be partly hidden by its neighbours; the active bet-mode button looks like the others while a spin locks them.
  - Never exercised by hand: resetting the session mid-spin.
- **Small things, any phase:** the circling ball rides the wood rim and loses two pixels at the wheel's outline; the number overlay's radius is a fixed 11 % in CSS rather than `RADII.numbers`; the colour test does not catch named colours, `hsl()` or `oklch()`; no test pins that the ball comes to rest in the winning pocket.

### Standing facts

- **First load:** 128.5 kB of JavaScript gzipped, in three files, against the 200 kB budget.
- **Vercel:** project `fliporama-roulette` in team `choy-lee` deploys every push; production is `fliporama-roulette-choy-lee.vercel.app`, built from `main`. Every URL sits behind Vercel login; opening them up is a project setting for the owner (needed by Phase 8 at the latest).

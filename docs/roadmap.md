# Roadmap: Fliporama Roulette to an award-grade site

**Current phase:** 4 (Screen effects and juice), not started
**To resume in a new session:** say "continue the roadmap". The session protocol is in `CLAUDE.md`.
**An overnight run is in progress:** say "continue the overnight run". Its queue and rules are under "Notes for next session".

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

### Overnight run, 2026-10-13 (in progress)

The owner asked for unattended work until 09:00 local time, and said to follow the assistant's own recommendations without asking. Nothing on the queue has been started: the session that wrote this handed over to a fresh one, to keep usage low. Whoever picks this up continues from the first unticked item.

Rules for the run:

- Decide instead of asking; record each decision where the owner will read it (the pull request description, and here).
- Never merge and never push to `main`. Every piece of work ends as an open pull request for the owner to judge.
- Anything that can only be judged by eye or ear is built to the owner gate and left there.
- Stop starting new work at 09:00. Leave the tree clean and this list accurate.
- The owner's plan has a tight usage limit. Work in the main session rather than spawning subagents. If the limit stops the run, the next session resumes from this list, so keep it true after every item.
- When the run ends, replace this block with a short dated note of what was done, and remove the "overnight run is in progress" line at the top of this file.

Queue:

- [ ] **1. Follow-ups branch** (`fix/overnight-followups`): the measurable backlog from "Budgets, as measured" and "Left for later phases" below. Speed up the wheel painter until a round holds 60 fps at 4x slowdown, or as near as it gets, with before and after numbers; fix the deferred review findings that have an objective check; add the missing tests. The full brief is `docs/superpowers/plans/2026-10-13-overnight-followups.md`. Open a pull request; do not merge.
- [ ] **2. Phase 4, Screen effects and juice**, only if item 1 is finished before about 07:00. Branch from the follow-ups branch, not from `main`. Follow the roadmap protocol in `CLAUDE.md`, but where it says to brainstorm with the owner, choose what you would recommend and write the choice and its reason into the spec. Build to the owner gate. Open a pull request; do not merge, and do not tick the phase.

- **2026-10-13, Phase 3 done.** The owner approved the room: a lit wall behind the page, and above the table a scene with a hanging lamp, a croupier, smoke, a frosted door with passing silhouettes, a clock, a fan and a gramophone. Read `docs/art-bible.md` before any visual work.

### What Phase 4 builds on

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
| Room idle, animation on | 16.7 ms average, no frame over 20 ms | 16.7 ms average, no frame over 20 ms |
| A full round | about 23 ms average; about 160 of 650 frames over 20 ms | about 18 ms average; about 25 of 800 frames over 20 ms |

- **The spin misses 60 fps, and it is the wheel, not the room.** A round measures the same with room animation off. In a profile of the spin, `wheelPixel` in `src/lib/wheelPixels.ts` is the largest single cost (about a fifth of the time): it works out each pixel's radius, angle and lighting from scratch on every frame. The owner chose to leave this for Phase 7. The fix is to precompute per-pixel geometry once per wheel size and reuse one `ImageData`.
- **Phase 4 adds a full-screen effect on top of this.** Measure a round before and after, the same way, and do not accept a result that hides behind the wheel's existing cost. The two scripts used here were throwaway; the method is: Playwright, `Emulation.setCPUThrottlingRate` at 4, collect the gaps between animation frames while bets are placed and the wheel spins, against `vite preview` rather than the dev server (the dev build is slower and noisier).
- **First load:** 133.8 kB of JavaScript gzipped, in three files, against the 200 kB budget.

### Left for later phases

- **Phase 7 (phone, accessibility, performance):**
  - The wheel painter, as above. Also at peak spin speed the wheel is drawn one frame behind its number overlay.
  - On a phone the title sign and the scene put about 490 px above the table, so a player scrolled down to the felt sees little of the croupier or the wall's dim and flare. The scene is 288 px tall at every width because the croupier is drawn 204 px tall.
  - Reading order: the "PLACE YOUR BETS" heading now comes before the page's main "ROULETTE" heading, and the scene is a named region whose only exposed content is its own label.
  - With the system's reduced motion on and room animation turned on by hand, the CSS cycles (sway, breathing, fan, record, pendulum) stay off while smoke, blinks, silhouettes and light changes run.
  - A tile's focus ring may be partly hidden by its neighbours; the active bet-mode button looks like the others while a spin locks them. Below 760 px the console is a single centred column.
  - Never exercised by hand: resetting the session mid-spin (traced in review as clean, not played).
- **Small things, any phase:**
  - The croupier's eyes, or a silhouette half-way across the glass, can stay frozen across a pause; each resume glances again at the last chip. An idle glance and a look at a chip share one state and can cut each other short.
  - The clock can run up to a minute behind, and is stale after a pause or with animation off.
  - Centred sprites (lamp, croupier, clock, gramophone) can land on half pixels at odd scene widths; pausing holds CSS cycles mid-frame rather than resetting them.
  - Several fixture offsets are repeated between `src/game.css` and `src/sprites/room.ts`; `RECORD_AT` is unused. The parallax hard-codes 3 and 48 where `--px` and the wall's repeat are meant.
  - Smoke allocates an `ImageData` per frame and its top edge is not faded.
  - No tests for `useRoomLight`, `useLive`, or the croupier's and fixtures' timers; that is where this phase's review found its bugs. The colour test does not catch named colours, `hsl()` or `oklch()`; no test pins that the ball rests in the winning pocket.
  - From Phase 2: the circling ball rides the wood rim and loses two pixels at the wheel's outline; the number overlay's radius is a fixed 11 % in CSS rather than `RADII.numbers`.

### Standing facts

- **Vercel:** project `fliporama-roulette` in team `choy-lee` deploys every push; production is `fliporama-roulette-choy-lee.vercel.app`, built from `main`. Every URL sits behind Vercel login; opening them up is a project setting for the owner (needed by Phase 8 at the latest).
- **Sessions:** `CLAUDE.md` says one phase per session. Phases 1 to 3 were done in a single session at the owner's request.

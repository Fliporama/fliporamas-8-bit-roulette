# Roadmap: Fliporama Roulette to an award-grade site

**Current phase:** 1 (Art direction bible), not started
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

- [ ] **Phase 1. Art direction bible**
  - One page of rules everything else obeys: a limited palette (about 24 colours), one pixel grid with integer scaling, two typefaces, a lighting model, and the motion language.
  - A small spike to choose the rendering approach: keep DOM and CSS with a canvas effects layer on top (recommended: it keeps accessibility and today's code), or move the table to a low-resolution canvas.
  - A hidden `/styleguide` page showing palette, type, buttons, chips and tiles in the new style.
  - Done when: the owner approves the styleguide page. Nothing else is restyled yet.

- [ ] **Phase 2. The table, restyled**
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

- **2026-10-12, Phase 0 done.** This roadmap, `CLAUDE.md`, the memory entry and `npm run capture` (Playwright driving the installed Edge; desktop and phone both verified) are in place. Budgets are recorded above.
- **Pull request #2** (`feat/pixel-roulette` into `main`) is open with all checks passing. It is the owner's to squash-merge. Until it is merged, `main` holds only the initial commit, so start Phase 1 on a new branch cut from `feat/pixel-roulette`, or from `main` once #2 is merged.
- **Vercel:** project `fliporama-roulette` in team `choy-lee` is linked to the GitHub repo, so every push deploys. Two things to know. The first deployment was created as production, not preview, so `fliporama-roulette-choy-lee.vercel.app` currently serves the feature branch. And every URL sits behind Vercel login, so links are not shareable with outsiders yet; opening them up is a project setting for the owner to change (needed by Phase 8 at the latest).
- The chip toss and wheel rework (commit `7d2ebf6`) have been seen in screenshots but the narrow layout after a live resize, reduced motion, and resetting mid-spin were never exercised. Check them in Phase 7 at the latest.
- A chip on a straight bet covers the tile's number. Revisit in Phase 2 when tiles are redrawn.

# Overnight follow-ups: brief

The work for item 1 of the "Overnight run" queue in `docs/roadmap.md`. It is written for a session that has seen none of the earlier ones. The owner is asleep: decide for yourself and do not ask questions.

Read first, fully: `CLAUDE.md`, `docs/art-bible.md`, and in `docs/roadmap.md` the "Overnight run" block, "Budgets, as measured" and "Left for later phases".

The branch is `fix/overnight-followups`. It already exists and is pushed. Stay on it.

## Hard rules

- Never merge. Never push to `main`. Never force-push. The work ends as an open pull request.
- Do not change game rules, bet logic, sounds, or how anything looks or moves, except where an item below says so. If a fix can only be judged by eye, skip it and list it in the pull request.
- No new npm dependencies unless a task is impossible without one; say so if you add one.
- No colour outside `src/tokens.css` (a test enforces it). Sizes are multiples of `var(--px)`.
- Conventional Commits, one commit per item or small group.
- Test-first for every logic change: write the test, see it fail, implement, see it pass.
- After each item `npm test`, `npm run lint` and `npx tsc -b` must be clean.
- Use the dev server at `http://localhost:5173/` if it is running; start it with `npm run dev` in the background if it is not. For measurements, build and run `npx vite preview --port 4173 --strictPort`, and stop it when done.
- Do not edit settings or permission files, or anything outside this repository.
- Keep usage low: the owner is on a plan with a tight usage limit. Do the work in the main session rather than spawning subagents, and do not re-read files you have already read.

## Environment quirks

- The shell is Git Bash on Windows and the project path contains an apostrophe. Shell commands with several heredocs fail unpredictably. Create and edit files with the file tools, not with `cat <<EOF`.
- There is no Python. Use Node for scripts.
- After a file is written, Vite's dev server sometimes serves a stale or empty module for a moment. If a capture reports a missing export straight after an edit, wait two seconds and run it again.
- Measurement scripts are in `scripts/perf/`. Run them from the project root:
  - `node scripts/perf/round.mjs` plays a round at 4x CPU slowdown and prints frame-gap statistics for desktop (1440 × 900) and phone (390 × 844). `URL=http://localhost:4173/` targets the production preview; `SCENE=0` turns room animation off.
  - `node scripts/perf/idle.mjs` prints the same statistics for the idle page, room animation on and off.
  - `node scripts/perf/profile.mjs [width] [height]` profiles eight idle seconds and lists the top functions by self time.
  - `node scripts/perf/shot.mjs <query> <css selector> <out.png> [width] [scale]` screenshots one element from the dev server.
- Frame measurements are noisy. Take each at least twice, on the production preview, and report both runs. The first run after a rebuild is often slower.

## A. Make the spin hold 60 fps (the main item)

Measured before (production build, 4x slowdown): a full round averages about 23 ms a frame at desktop size, with about 160 of 650 frames over 20 ms, and about 18 ms at phone size. A profile shows `wheelPixel` in `src/lib/wheelPixels.ts` as the largest single cost: `src/components/WheelCanvas.tsx` calls it for every pixel of a 172 × 172 canvas on every frame, working out each pixel's radius, angle, lighting and dither from scratch.

1. Measure first, twice, and record the numbers.
2. Speed up the painting without changing a single output pixel. The expected approach: work out per-pixel geometry once per wheel size (distance, angle, the screen-fixed lighting decision, which ring the pixel is in) and reuse one `ImageData` between frames, so a frame is table lookups plus the pocket lookup. Keep `wheelPixel` as the tested reference. Add a test that the fast path returns exactly what `wheelPixel` returns for every pixel, at several sizes (include 96, 100 and 172), several turns (include negative ones and ones over 360), with and without a ball, and with `landed` set both lit and unlit.
3. If cheap and safe: the canvas is drawn one frame behind the number overlay, because `WheelCanvas` schedules its own `requestAnimationFrame`. Scheduling the draw on `motion`'s frame loop (`frame.render` and `cancelFrame` from `motion/react`) keeps them in step. Check that the wheel still draws at rest (the still wheel in the scene has no motion values) and that cleanup cancels a pending draw.
4. Profile a spin again to find the next largest cost. If something else in the spin is cheap to fix without changing how it looks, fix it and measure again. Do not chase gains under about 5 %.
5. Measure twice more and report before and after. Say so plainly if it still misses 60 fps, and what remains.

## B. Review findings that have an objective check

Fix each, with a test where the logic can be tested without a browser. Where React timers are involved, prefer moving the scheduling decision into a pure function in `src/lib/` that a test can drive, over adding a React testing library.

1. **State that survives a pause** (`src/components/Croupier.tsx`, `src/components/Fixtures.tsx`): when `live` turns false the croupier's eyes must not stay shut and the gaze must return to centre; a silhouette part-way across must be removed; resuming must not glance again at a chip already looked at.
2. **Glance against look** (`Croupier.tsx`): an idle glance must not cut short the look at a chip that has just landed, and a chip landing during a glance must win.
3. **The clock** (`Fixtures.tsx`): update on the minute boundary, and refresh the time when the scene becomes live again.
4. **Half pixels** (`src/game.css`): the lamp, croupier, clock and gramophone are placed at `left: 50%`, which lands off the art-pixel grid at odd widths. Snap them to the grid in CSS. Confirm with screenshots of `.scene` at two widths that differ by an odd number of pixels.
5. **Paused is not reset:** the comments near `.scene.is-still` and `.frames` in `src/game.css` say more than the code does. Correct the comments or make the behaviour match; say which.
6. **Duplicated constants:** fixture offsets repeated between `src/game.css` and `src/sprites/room.ts` (`DOOR_WINDOW`, `CLOCK_FACE`, the record's position); the hard-coded `3` and `48` in the parallax code in `src/components/Scene.tsx`; the fixed `11%` for the wheel's number overlay against `RADII.numbers` in `src/lib/wheelPixels.ts`. Give each one source. Remove exports nothing uses.
7. **Smoke** (`src/lib/smoke.ts`, `src/components/Smoke.tsx`): fade the top edge as the sides and bottom already fade, with a test for the top and bottom rows; reuse one `ImageData` between frames.
8. **The disabled active mode button:** while a spin locks the bet-mode buttons, the active one looks the same as the others. Give `.button.is-primary:disabled` a face of its own from the palette (for example `--brass-0`). This one is visual: keep it minimal and name it in the pull request.
9. **A test for the light hook:** `src/lib/useRoomLight.ts` has none. Move its step-and-flicker sequencing somewhere a test can drive with fake timers, and test the sequence of values for a change of level, an interrupted change and a flicker, and that a hidden document skips the flicker.
10. **Test gaps:** the felt test's "normal is unchanged" assertion only pins the default parameter; make it pin something real or delete it. Add a test that for every result the ball's resting pixel lies in the winning pocket (see how `RouletteWheel.tsx` gets the ball's final angle from `pocketAngle(result)`). Extend `src/lib/colours.test.ts` to catch `hsl(`, `hsla(`, `oklch(`, `oklab(` and `color(`.

Leave alone, because they need the owner's eye: the heading order and the scene's landmark; the ball riding the wood rim; the scene's height on phones; anything about how the croupier or furniture is drawn.

## C. Check and hand over

1. `npm test`, `npm run lint` and `npm run build` clean. Note the test count and the first-load JavaScript size (the gzip sizes of `index-*.js`, `table-*.js` and `rolldown-runtime-*.js` added together).
2. Each of these must exit 0: `npm run capture`, `-- phone`, `-- reduced`, `-- idle`, `-- idle phone`, `-- styleguide`, `-- styleguide phone`. Read `captures/desktop-1-idle.png`, `desktop-4-spinning.png`, `desktop-5-landed.png` and `phone-1-idle.png` and confirm nothing changed that was not meant to: a lit room above the table, a croupier under a lamp, the pixel wheel in the overlay with the ball in a pocket once landed.
3. In `docs/roadmap.md`: tick item 1 of the "Overnight run" queue, and bring "Budgets, as measured" and "Left for later phases" up to date (remove what was fixed, keep what was not, add the before and after numbers). Do not tick a phase. Commit.
4. Push, and open a pull request into `main` with `gh pr create`, titled `fix: speed up the wheel and clear the review backlog`. Its description lists in plain language: what changed; the before and after frame numbers, both runs of each; every item skipped and why; every decision the owner might have made differently; and the checks run. Do not merge it.
5. Stop the preview server. Leave the working tree clean.

If time or usage runs out part-way, stop at a clean commit, push, and write exactly where things stand in the "Overnight run" block of `docs/roadmap.md`.

# Fliporama Roulette

A free-play European roulette game: React 19, Vite, TypeScript, `motion` for animation, Web Audio for sound. Virtual chips only, no cash value; keep it that way.

## The roadmap

This project is being taken to award grade over many sessions. The plan and its status live in `docs/roadmap.md`.

When asked to "continue the roadmap":

1. Read `docs/roadmap.md`. Take the first unchecked phase and read "Notes for next session".
2. Brainstorm that phase only with the owner. Write its spec to `docs/superpowers/specs/` and its plan to `docs/superpowers/plans/`.
3. Build it, check it against the phase's "done when" line, and commit.
4. Tick the phase, update "Current phase" and "Notes for next session" in `docs/roadmap.md`, commit, and stop.

One phase per session. If a phase runs long, stop at a commit and record exactly where in the notes.

When asked to "continue the overnight run": read the "Overnight run" block in `docs/roadmap.md` and carry on from its first unticked item, under the rules written there. The owner is not available to answer questions during it.

## Commands

```powershell
npm run dev       # dev server at http://localhost:5173/
npm test          # vitest
npm run lint      # oxlint
npm run build     # typecheck and production build
npm run capture   # play one round in a real browser; screenshots and video land in captures/
```

`npm run capture` needs the dev server running. Add `-- phone` for a 390 px wide phone, `-- reduced` to ask for reduced motion, or `-- <url>` to capture a deployed preview. `npm run capture -- idle` instead leaves the page untouched for 30 seconds, saves stills and a video, and prints frame times at four-times CPU slowdown. Every capture exits non-zero if the page logged a console error or scrolls sideways.

## Deploying

The repo is linked to the Vercel project `fliporama-roulette` (team `choy-lee`). Pushing a branch deploys a preview; merging to `main` deploys production. There is no Vercel CLI on this machine; use the Vercel MCP tools to inspect deployments. Deployments are behind Vercel login unless the owner has turned that off.

## Checking visual work

Read `docs/art-bible.md` before any visual work; it fixes the palette, lighting, pixel grid, type and motion rules. See them applied at `/?styleguide`.

Look at the result before calling visual or animation work done: run `npm run capture` and read the PNGs in `captures/`. The Claude-in-Chrome extension window renders at about one frame a second on this machine, so it cannot judge motion and its screenshots time out; use the capture script instead. The owner judges the feel of motion by eye, so ask them to look at anything that moves.

## Conventions

- Branch per change, Conventional Commits, squash-merge to `main` through a pull request. Never push to `main` directly. See `CONTRIBUTING.md`.
- Pure logic goes in `src/lib/` with a test beside it; components go in `src/components/`.
- Timing and exaggeration amounts are named constants at the top of the file that uses them.
- Every animation needs a reduced-motion path (`useReducedMotion` from `motion/react`).
- Stay inside the budgets listed in `docs/roadmap.md`.

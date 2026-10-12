# Phase 4: screen effects and juice. Plan

Spec: `docs/superpowers/specs/2026-10-13-screen-effects-design.md`. Branch `feat/screen-effects`, cut from `fix/overnight-followups`. One commit per task; `npm test`, `npm run lint` and `npx tsc -b` clean after each.

1. **The effects setting.** `src/lib/effects.ts`: `'full' | 'low' | 'off'`, stored as `fliporama-effects`, starting off under reduced motion; `particleShare(level)`. Test beside it.
2. **The settings panel.** `src/components/Settings.tsx`: a top-bar button and a native popover holding sound, room animation and screen effects. The two old top-bar buttons go. A gear icon in `src/sprites/icons.ts`.
3. **Particles.** `src/lib/particles.ts` (pure: bursts, stepping under gravity, culling) with tests; `src/components/Particles.tsx` (the canvas and its frame loop). Wire `emit` into `ChipLayer.tsx` and `WinTally.tsx`; remove the DOM sparks, `.chip-puff`, and both `brightness()` flashes.
4. **The screen layer.** `src/lib/screen.ts` (pure helpers the shader's inputs come from, tested) and `src/components/ScreenEffects.tsx` (WebGL: scanlines, grain, corners, vignette, glow; the automatic step down). It reads the room's light number.
5. **Chromatic split.** SVG filters in `ScreenEffects.tsx`, a stepped CSS animation on `#game` and `.tally-banner` during a big or huge win, at "full" only.
6. **Check.** All seven captures exit 0, read the stills; `round.mjs` and `idle.mjs` twice each against the preview, before and after; first-load size. Show the layer and a burst on `/?styleguide` if cheap.
7. **Hand over.** Update the roadmap's notes (not the phase's tick), push, open a pull request, do not merge.

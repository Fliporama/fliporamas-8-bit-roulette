# A living scene — design

Date: 2026-10-13
Status: awaiting review
Roadmap: Phase 3 of `docs/roadmap.md`

## Goal

Put the table in a room that is alive: with no input for 30 seconds, the page should still look like a place where something is happening. Today the restyled table and console sit on a plain dark background and nothing moves until the player acts.

## Decisions already made

| Question | Decision |
|---|---|
| How the room relates to the page | The room sits behind the page. The page keeps scrolling as now |
| The croupier | A dealer half in shadow: lit waistcoat, sleeves and hands; a dark head with a brass visor edge and two eyes |
| Background details | All four: lamp sway and flicker, drifting smoke, silhouettes behind frosted glass, clockwork (clock, fan, gramophone) |
| Control | One setting turns room animation on and off, and is remembered |
| How it is drawn | In code, as in Phase 2: sprites for objects; per-pixel canvases for the wall, the light and the smoke |

## Out of scope

- WebGL screen effects and the particle system (Phase 4).
- The intro, title screen and tutorial (Phase 5).
- Music and new sounds (Phase 6). The room is silent.
- The phone layout rework (Phase 7). The scene must not break the phone layout or scroll sideways.
- A settings panel. This phase adds one button; Phases 4 and 6 bring the settings that justify a panel.
- Game rules, bet logic, existing sounds, and the Phase 2 look of the table, chips, wheel and console.
- Relighting the spinning wheel in the overlay: the room behind it is already dimmed.

## Layout

One structural change. Today `.game-heading` spans the page above both columns. It moves into the table's column, so the page is:

- left column: the scene, then the table, then the table note;
- right column: the console, running beside both.

**The wall** is a fixed layer behind the whole page: dark panelling that the page scrolls over.

**The scene** is a band about 80 art pixels tall (60 at phone width) directly above the table's top rail. It holds, from back to front:

1. the wall, lit by the lamp;
2. wall fixtures: the door with frosted glass (left), the wall clock, the ceiling fan (top), a shelf with the gramophone (right);
3. the title sign: the eyebrow line and "ROULETTE" on a dark plate with a brass edge, hung on the wall at the left. It remains the page's `h1`;
4. the wheel on a stand at the right (the still wheel from Phase 2, same size rules);
5. the croupier, centred, behind the rail;
6. smoke;
7. the lamp on its cord, centred over the table.

Fixtures are placed from the band's centre and edges. Where the band is too narrow for a fixture, the fixture is hidden rather than squeezed; at phone width the lamp, croupier, title sign and smoke always remain.

**Parallax.** The wall layer and the scene's fixtures shift with the pointer by at most two art pixels, in whole art pixels, and the fixed wall moves at a fraction of the page's scroll. The croupier, lamp, table and console do not shift.

## The light

One value, the room's light level, is derived from the game's state by a pure function:

| Game state | Level |
|---|---|
| Betting | normal |
| The wheel is spinning | dim |
| A win is being tallied | flare |
| A loss is being tallied | normal |

- **Felt:** `feltStep` takes the level. Dim drops the pool by about one step; flare raises it by about one step.
- **Wall:** lit the same way from the lamp's position, in the `ink` and `wood` ramps.
- **Lamp:** its bulb edge uses `lamp-0`/`lamp-1` at normal, the `brass` ramp when dim, and `lamp-1` with a wider glow row on a flare.
- **Transitions** happen in two or three hard steps over about 200 ms, never a fade.
- **Flicker:** at normal level, every 6 to 14 seconds, the light drops half a step for about 80 ms.
- **Sway:** the lamp and cord shift one art pixel left and right on a slow cycle.

A flare lasts less than a second. While it lasts, labels printed on the felt may fall below the 4.5:1 contrast rule; this is accepted as a flash, like the existing win flashes.

## The croupier

Waist-up, about 40 art pixels wide, standing behind the rail so the rail overlaps the waist.

**Built from layers,** each a sprite, so poses combine: the body (waistcoat in the `ink` and `oxblood` ramps, shirt in `paper` and `smoke`, bow tie in `oxblood`, brass buttons), the head (a dark `ink` shape with a `brass` visor edge), the eyes, the left arm and the right arm. Hands are drawn in the `brass` and `lamp` ramps: warm, lit skin without adding a colour.

**Idle,** on loose timers so it never looks looped:
- breathing: the shoulders rise one art pixel;
- blinking;
- glancing left, right and back;
- occasionally straightening the bow tie.

**Reactions,** from a pure function of the game's state:

| Event | Reaction |
|---|---|
| A chip is placed | The eyes move to that third of the table (left, centre, right) and stay for a moment |
| The wheel is spinning | One hand raised, palm out: no more bets |
| A win is being tallied | Taps the rail twice |
| A loss is being tallied | A small shrug, both hands briefly out |

The croupier is decorative: hidden from assistive technology. The table note already announces every event in text.

## Room life

- **Smoke:** a low-resolution canvas over the scene. A pure function of position and time gives each art pixel a density; pixels above an ordered-dither threshold are drawn in `smoke-0` or `smoke-1`, the rest are clear. It drifts upward and sideways and is redrawn about ten times a second. It is densest in the lamp's light and absent at the band's edges.
- **Frosted glass:** the door's window is `smoke-0`. Every 8 to 20 seconds a silhouette one step darker crosses behind it in steps; about one in three stops for a moment.
- **Clock:** the pendulum swings through three positions; the hands show the visitor's local time, to the minute.
- **Fan:** four frames, slowly.
- **Gramophone:** the record turns through four frames; the arm bobs one art pixel.

Everything that animates stops while the tab is hidden or the scene is scrolled out of view.

## The setting

- A button beside the mute button in the top bar: "Room animation", with `aria-pressed`. Its icon is a pixel sprite of the lamp, drawn lit when on and dark when off.
- Stored in `localStorage` under `fliporama-scene`, in the same way as the mute setting. With nothing stored it starts on, unless the system asks for reduced motion, in which case it starts off.
- **Off:** the wall, fixtures, croupier and lamp are still drawn, but nothing moves: no smoke, no silhouettes, no sway, flicker or clockwork; the croupier holds the idle pose with eyes forward; the light stays at normal; no parallax.

## Structure

| File | Responsibility |
|---|---|
| `src/lib/scene.ts` (+ test) | Pure: the light level and the croupier's reaction for a game state; which third of the table a point is in; reading and storing the setting |
| `src/lib/wall.ts` (+ test) | Pure: art pixel to wall token, given the lamp's position and the light level |
| `src/lib/smoke.ts` (+ test) | Pure: art pixel and time to smoke density |
| `src/lib/felt.ts` | Gains the light level |
| `src/components/Scene.tsx` | The band: lays out the layers and fixtures |
| `src/components/Wall.tsx` | Paints a wall canvas; used for the fixed layer and for the band |
| `src/components/Smoke.tsx` | Paints the smoke canvas on a timer |
| `src/components/Croupier.tsx` | The layered figure, its idle timers and its reactions |
| `src/components/Fixtures.tsx` | Door and silhouettes, clock, fan, gramophone |
| `src/sprites/room.ts` | Lamp (moved from the styleguide), door, clock, fan, gramophone, silhouettes, wheel stand |
| `src/sprites/croupier.ts` | The croupier's layers and poses |
| `src/App.tsx` | The layout change; passes game state to the scene; the setting's button |
| `src/game.css` | The scene's layout and step animations |
| `scripts/capture.mjs` | An idle capture |

Timing and exaggeration values are named constants at the top of the file that uses them. Simple cycles (pendulum, fan, record, sway) are CSS step animations; anything irregular (blinks, glances, flicker, silhouettes) is a timer in its component.

The styleguide gains the croupier in each pose, the fixtures, and the wall and smoke at each light level.

## Testing

- `src/lib/scene.test.ts`: each game state gives the level and reaction in the tables above; points across the table map to left, centre and right; the setting defaults on, defaults off under reduced motion, and a stored choice wins.
- `src/lib/felt.test.ts`: at every pixel, dim is never brighter than normal and flare never darker; normal is unchanged from Phase 2.
- `src/lib/wall.test.ts`: brightest near the lamp and darkest in the far corners; only `ink` and `wood` tokens that exist; safe at size zero.
- `src/lib/smoke.test.ts`: density stays in range; the same position and time give the same density; a later time gives a different field; the band's edges are clear; safe at size zero.
- The colour test and the contrast test from Phase 2 keep passing. The title sign's text and plate are a pair in `PAIRS`.
- `npm run capture -- idle`: loads the page, touches nothing for 30 seconds, records a video and saves stills at 0, 10, 20 and 30 seconds; fails on a console error or sideways scrolling. Two stills must differ, or the page did not move.
- The existing captures (round, phone, reduced) still pass. Under reduced motion the room is still.
- Frame cost is measured with the smoke running at desktop and phone sizes, with the CPU throttled four times, and recorded in the roadmap notes.
- `npm run build`: first-load JavaScript stays under 200 kB gzip.
- By eye, by the owner: the 30-second idle recording and the live page, which are the phase's "done when"; the croupier's reactions; the dim and the flare.

## Build order

So that stopping early still leaves something whole: (1) the layout change and the wall; (2) the lamp and the light level; (3) the setting; (4) the croupier; (5) smoke; (6) the door and the clockwork. If the phase runs long it stops at a commit after any of these, and the roadmap notes record which.

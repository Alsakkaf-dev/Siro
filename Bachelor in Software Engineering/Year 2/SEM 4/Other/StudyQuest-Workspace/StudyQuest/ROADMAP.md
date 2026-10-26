# StudyQuest — Status & NEXT TASK

> Read `../CLAUDE.md` first (boot protocol, hard rules, architecture map).
> Last session: 2026-06-11 night — built the Pacing Calibrator. App is BUILT, RUNNING and verified at http://localhost:5050.

## ✅ Everything that exists and works (as of 2026-06-11)

**Core game** (all verified): 5 countries · 26→23 cities · PDF-only READ missions · PRACTICE stop-on-wrong drills · GATE exams (≥70% unlocks next city) · 50 banks / 415 questions from his real drills · honest time telemetry (visible-tab + activity, 15s heartbeats → daily ledger) · progress server-persisted with backups · full Library browser with deep-link (`/browse?subject=X&file=<relPath>`) · continuous-scroll PDF reader (wheel scroll, auto page tracking, lazy rendering) · 45/45 pptx converted to PDF.

**Living world**: animated ocean (parallax waves ×5, caustics), clouds w/ sea shadows, bird flocks, wind streaks, day/night scene phases from the live clock, 3D extruded islands that float, 3D candy roads + beveled nodes, glass HUD. **World map is FULL-BLEED** (2026-06-11): `.world-stage` fixed inset 0, svg `preserveAspectRatio="xMidYMid slice"` covers any window size, ocean runs under the glass topbar, banner + quota strip float on the scene (`.world-overlay`), depth vignette (`worldVignette` in MapDefs), lightning flashes in storms (`anim-lightning`/`anim-storm-flash`, seeded delays, in reduced-motion list), islands repositioned in world.json (pentagon, top-center open for the floating banner; right-edge islands anchor their boat on the left). **LIT ISLAND LAW** (2026-06-11): vignette + scene-tint render UNDER the island layer — the ONE focus island is always bright (`.island-lit` brightness/saturate on the INNER g so the outer `pulse-glow` filter animation can't override it + breathing `focusGlow` light-pool halo `anim-focus-breath`); storms deepen themselves at night via `.phase-night .island-stormy` instead of the global tint.

**The Traveling Scholar** (`journeyState` in src/engine/schedule.js): reads in armchair on the active subject's island w/ ticking countdown · sails his book-boat between islands (position = gap-time fraction, correct direction) · anchors offshore for same-subject gaps · mock-week camps on next exam island. **Focus island bright; all other islands get black storm clouds + rain + dim** (`StormOverlay`, `.island-stormy`).

**Timers/clocks (12h AM/PM everywhere)**: scenic clock pill top-left (dawn/day/dusk/night scenes, big bold hour, day name on the left) · SessionCup water glass top-middle (drains with remaining session time) · boxless halo-text exam timers on islands — **hidden until Jun 29** (`examTimersOn`) · MissionTimer ring (gold→green) on READ missions reading `goal.minSeconds`.

**Content decisions**: markdown docs are NEVER missions (Library only) · PSDA formula card = `reference` button in country.json (pattern reusable for other subjects) · pages goal removed — READ missions are time-based only.

## ✅ The Pacing Calibrator (built + verified 2026-06-11 night)

**What it does**: distributes each subject's remaining slides over its remaining schedule windows (now → Jun 28) → exact per-slide pace (clamped 25–120s, surplus = buffer, too-fast = `tight` flag), rewrites every remaining READ `goal.minSeconds` (= secondsSpent + remainingPages × pace, so remaining effort is exact), and emits a session-by-session itinerary.

**Pieces**:
- `server/lib/calibrate.js` — pure logic; reuses `src/engine/unlock.js` `missionDone` + `src/engine/schedule.js` `windowsForDay`/`dateKey` (now exported). Backs up country.json to `data/backups/content/<S>/` before patching; writes `content/plan.json` `{ calibratedAt, from, subjects: { pace, totalPages, donePages, remainingPages, practiceGateMin, budgetMin, bufferMin, tight, sessions[], cityDue{}, expected[] } }`. Throws if non-tight plan exceeds budget.
- `npm run calibrate` (`scripts/calibrate-plan.js`, supports `--from=` + `--dry`) · `POST /api/calibrate` (body `{ from? }` — frontend sends clock-store now so `?fakeNow=` re-balances from the fake moment).
- Frontend: `useGameStore` loads `plan.json` (tolerates missing) + `recalibrate()` action · WorldView **quota strip** under banner (this/next session's exact pages + drills + buffer, ⚖️ Re-balance button) · **island pace chips** ("✓ on plan" / "↘ N slides behind" vs `expected[]` curve, halo text) · CountryView **"⏳ by Jun 17"** city due tags from `cityDue` (hidden on done cities). MissionTimer unchanged (reads goal.minSeconds).

**Current real numbers** (calibrated 2026-06-11 ~7:27 PM): all 5 subjects pace capped at 120s/slide, zero `tight` — NC 421 slides/1400m (buffer 435m) · Cross 206/1560m · SDA 250/1320m · PSDA 376/1760m · BI 337/980m (smallest buffer 192m). NC city dues: ch4 Jun 18 · ch5 Jun 20 · ch6 Jun 24.

**Re-balance after a missed session**: click ⚖️ in the world view or `npm run calibrate` — quotas redistribute over the remaining sessions.

## 🎯 NEXT TASK: none queued — user-driven (see Later)

## Later / user-driven
- Delete `COMMAND_CENTER.html` after Mohammed confirms.
- Cross Ch12–13 cities when he downloads those slides.

# MY SPACE — workspace guide for Claude

Mohammed Alsakkaf's finals-preparation workspace. Two things live here:

- **`Resource/Finals Subjects/`** — his REAL course materials for 5 subjects (NC, Cross, SDA, PSDA, BI). **READ-ONLY, never modify.** Slides (pdf/pptx), past exams, tutorials, plus AI-generated study assets in each `Learning space/`. `Resource/Times Allowed for each subject.txt` = the human source of truth for study windows + exam dates.
- **`StudyQuest/`** — the adventure web-game built to study with (replaced the deleted-soon `COMMAND_CENTER.html`). React 18 + Vite + zustand + react-pdf frontend; Express backend (port 5050) that serves resources read-only and persists progress.

## ⚡ Session boot protocol
1. Read **`StudyQuest/ROADMAP.md`** — current feature state + the NEXT TASK (full spec saved there).
2. The approved plan file also lives at `~/.claude/plans/on-this-folder-resource-delightful-minsky.md`.
3. Exams: NC Jul 7 9AM · Cross Jul 7 2:30PM · SDA Jul 9 2:30PM · PSDA Jul 11 2PM · BI Jul 14 9AM. All slides must be read **before Jun 29** (break week Jun 29–Jul 5 = past-papers only).

## Run / build
```powershell
cd StudyQuest
npm start              # production: http://localhost:5050 (serves dist/ + API)
npm run dev            # dev: vite :5173 + api :5050
npm run build          # rebuild dist (server picks it up, just hard-refresh)
npm run validate-banks # lint all question banks
npm run convert        # pptx→pdf via PowerPoint COM (idempotent; already done 45/45)
# Test any moment in time:  http://localhost:5050/?fakeNow=2026-06-30T10:00
```

## Architecture map (StudyQuest/)
- `server/` — Express: `routes/` (tree, file streaming w/ Range + pptx→PDF swap, content, progress, events, time), `lib/` (safePath, atomicWrite **strips BOM**, treeCache, ledger). Writes ONLY into `data/`.
- `content/` — AUTHORED game data: `world.json` (subjects/islands/examAt), `schedule.json` (machine copy of the Times txt), `subjects/<S>/country.json` (cities→missions) + `banks/*.json` (50 banks, 415 questions, all from his real drills with verbatim answers).
- `converted/` — pptx→pdf cache + conversion-manifest.json (originals untouched).
- `data/` — runtime state: progress.json (atomic + backups), events NDJSON, per-subject daily time ledger.
- `src/engine/` — PURE logic: `schedule.js` (windows, countdowns, 12h formats, `dayPhase`, `journeyState` for the scholar), `unlock.js` (lock state always computed), `grading.js`, `xp.js`.
- `src/store/` — zustand: `useGameStore` (progress, throttled 2s save), `useClockStore` (1s tick + `?fakeNow=`), `useSessionStore` (honest per-second time: tab visible + activity <60s, 15s heartbeats → server ledger).
- `src/views/` — WorldView (living ocean) / CountryView / CityView / `missions/` (Read/Practice/Gate).
- `src/components/` — `map/` (MapDefs SVG kit, Ambient clouds-birds-storms, Scholar, CandyPath, IslandBlob, CountdownPlate, nodes), `hud/` (TopBar scenic clock pill, SessionCup water timer, ScheduleStrip), `reader/` (PdfReader continuous-scroll + telemetry, MarkdownReader), `quiz/`, `browser/`.

## Hard rules (learned the hard way — do not violate)
1. **No checklists ever.** Progress derives ONLY from real in-app actions (honest time, pages, drills, gates).
2. **READ missions = real PDF slides only.** Markdown docs are Library-only, never missions. The PSDA formula card is a `reference` button (country.json `reference` field), never a mission.
3. **NC slide files are MISLABELED**: file "Chapter_5*" = Control Plane; real Link Layer = "Chapter_6*"; Wireless = "Chapter_7*". The corrected mapping in `content/subjects/NC/country.json` is law — never "fix" it.
4. **Hover must NEVER move geometry** (scale on hover ⇒ infinite flicker loop). Hover = `filter` only.
5. **All animation is CSS keyframes on transform/opacity** — no JS loops, no new deps. `prefers-reduced-motion` honored. Animated class goes on an INNER `<g>`, never on the positioned (transform-attribute) group.
6. **All clocks are 12-hour AM/PM** with the day name. Malaysia local = PC clock.
7. PowerShell 5.1 writes UTF-8 **with BOM** → `readJsonSafe` strips it; keep that.
8. Exam countdown plates on islands are HIDDEN until Jun 29 (`examTimersOn` in WorldView).
9. The save in useGameStore is a trailing **throttle** (not debounce) — continuous 1s updates must still persist every 2s.
10. Express 4 + react-pdf v9 + `useId` colons must be stripped for SVG url() ids.

## The Traveling Scholar (core UX)
`journeyState(schedule, world, now)` drives everything: `studying` (reads in armchair ON the island, countdown to window end) · `sailing` (rowboat between islands, position = elapsed gap fraction) · `anchored` (same-subject gap, bobbing offshore) · `mockweek` / `done`. The ONE focus island stays bright; ALL others get `StormOverlay` (black wind-clouds + rain) + `.island-stormy` dim. Top bar: scenic clock pill (dawn/day/dusk/night scenes change live) + SessionCup (water drains with session time left).

## User preferences
- Mohammed wants game-feel, pro polish, simple non-boxy timers, halo text over pills.
- Iterates by screenshots; expects hard-refresh after `npm run build` (server keeps running).
- Don't delete `COMMAND_CENTER.html` until he confirms StudyQuest covers him.

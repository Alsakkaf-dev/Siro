# REDESIGN_PROGRESS — HCI audit + Work-OS evolution

Branch: `redesign/hci-work-os` (from `claude/great-newton-p1ds60` @ 672a17f). Instructions: `docs/MASTER_PROMPT_HCI_REDESIGN.md`.
Resume rule: read the decision log + the first unchecked step below, continue from there.

## Steps (§11)
- [x] 1. Bootstrap + baseline
- [x] 2. Phase A audit (§5) + competitive teardown (§4)
- [x] 3. Phase B designs (§6–§9) + ADRs + traceability skeleton
- [x] 4. Foundation: Work-OS core migration + adapters + API + tests
- [x] 5. Shell & navigation rebuild (metro IA, breadcrumbs, Create +, palette verbs, mobile bar, redirects)
- [x] 6. Views engine + specialized views registered
- [x] 7. Universal CRUD (inline edit, bulk, undo, history, relations, side panel)
- [x] 8. Custom types/fields/templates (My Spaces) + automations
- [x] 9. Design-system pass + a11y + responsive + dark parity
- [x] 10. Re-audit (crawler, axe, CW, KLM before/after)
- [x] 11. Deploy (deploy/platform → Vercel production) + online verification
- [x] 12. Final report (Arabic)

## Phase 2 — AI core (owner request 2026-10-27; plan: ADR-0009, docs/AI_CORE_AR.md)
- [x] A1. Research: strongest free model → Qwen3.5 (2B/4B/9B by RAM) via Ollama; online = any OpenAI-compatible key, or the owner's own Ollama from the browser
- [x] A2. Server gateway `/api/ai` (status/config/keys/models/test/chat SSE/threads/runs), 3 adapters, fallback chain, daily cap, online lock, actor=ai, migration 6
- [x] A3. Agent loop + 32 tiered tools + small-model routing + preview/confirm/undo
- [x] A4. Entry points: panel (Ctrl+J), palette, Create menu, Home, course, library file, spaces, automations, life; Settings › الذكاء
- [x] A5. Background daily brief (PC, free only)
- [x] A6. Tests (+31), AI e2e (10 flows × 2 widths), full crawl ALL CLEAN, `npm run ai:eval`
- [x] A7. Paid providers (Anthropic Opus/Sonnet/Haiku 5.5 + paid OpenAI-compatible) — last step, as requested
- [x] A8. Deploy + online verification — deploy/platform efd8780 → Vercel production dpl_2jPCkHrCxDXJyMSv9djFnfqrdR9o READY; online: health schema 6, /api/ai/gate gated, /api/ai/status 503 until AI_ACCESS_KEY is set (by design)
- [x] A9. Online AI live: Vercel AI Gateway via OIDC (no key), access code set by owner request, free-tier eligible model auto-picked (`/v1/models?include_availability`) → `/api/ai/check` ok with alibaba/qwen3.7-flash; gateway usage counted in the daily token cap

## Baseline (2026-10-26)
- Node 22.22.0. `tsc` server + web: clean.
- Vitest: 13 files / 182 tests green on **both** drivers (`PLATFORM_DB_DRIVER=better-sqlite3` and `node:sqlite`).
- Build (`npm run build`): OK in ~17 s. Main bundle `index` 330.5 KB (104.2 KB gz); PdfViewer 435 KB (lazy); forms 103 KB (lazy). Precompress: 61 files, raw 2580 KB → br 664 KB.
- Real DB (data/platform.db, schema 3 on disk → 4 after boot): semesters 2, courses 7, assessments 47, notes 30, lib_files 2899, lib_meta 3, lib_youtube 1, core_settings 5, core_events 4, workouts 0.
- Crawl baseline: 37 routes × 3 widths × 2 themes = 222 page-states; 105 with problems (axe serious/critical 101, console/failed 6, overflow 0). Avg load 1.4 s @1280 (max 15.3 s: missing-file PDF). Details: docs/audit/ISSUES.md.

## Container notes (for a resumed session)
- Committed node_modules are Windows-only. Linux bindings were copied in untracked (`@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`, `better-sqlite3` prebuilt, `axe-core`); install them in a scratch dir with npm and copy into node_modules.
- `git update-index --skip-worktree` is set on all tracked files under node_modules/ and dist/ so local builds can never be committed. Stage by explicit path.
- Run the local server against a COPY of data/ (`PLATFORM_DATA_DIR`), never the tracked data/platform.db.
- e2e: `BASE=http://127.0.0.1:4310 E2E_OUT=<dir> node scripts/e2e/crawl.mjs [--quick] [--clicks]`.
- AI e2e: `node scripts/e2e/fake-qwen.mjs &` (mock Ollama on :11434) then `node scripts/e2e/ai.mjs --width=1280|390`. For a clean crawl set the scratch DB roots: library → `/home/user/Siro/Bachelor in Software Engineering`, life → `/home/user/Siro/Platform/exchange/rashed`.

## Decision log
- D1 (owner, mid-session): **Keep the existing visual style.** The redesign improves quality, usability, efficiency, performance, maintainability, interaction (UX actions) and functionality, and refines the style — it does not replace the look. Tokens, fonts, card/pill language, accent system stay; new components reuse them.
- D1b (owner): D1 adds emphasis, it does not narrow scope — every other §11/§12 item is still delivered in full.
- D2: Owner identity on all commits; no AI attribution in commits/PR (master prompt §2.4 overrides the default attribution).
- D3: Keep existing URLs canonical (no path renames) and add aliases for the new IA — zero broken deep links, least risk (§10 tie-break rule 1).
- D4: Trash is now persistent (`wos_trash`, 30 days) and stores raw row snapshots restored with INSERT OR IGNORE. Fixes a latent bug: undoing a semester/course delete lost `acad_results` (official grades) and could overwrite later edits of the parent semester (old applyImport-merge path). `server/trash.ts` (in-memory) removed; `/api/undo/:token` API unchanged.
- D5: Owner display name moved to setting `profile.name` (migration 5 seeds «محمد»); no hard-coded name in logic.
- D7–D9: see sections below.
- D10 (AI): agent loop in the browser, server = model gateway only (ADR-0009) — every AI action reuses the UI's own API → validation/history/trash/undo for free; same code PC + Vercel.
- D11 (AI): honesty on «900×»: measured KLM shows up to ~8× on bulk/compose tasks and impossible→1-click on reading tasks; single-click edits are slower via AI, so AI is additive (no control removed). Documented in HCI_EVALUATION «AI CORE».
- D12 (AI): no real model can be downloaded in this container (network policy blocks ollama.com / Hugging Face) → verified with mock providers (unit/API) and `scripts/e2e/fake-qwen.mjs` (browser). Real-model quality is measured on the owner's PC with `npm run ai:eval`.
- D13 (AI): Playwright flags streamed POSTs with bodies > ~3 KB as ERR_ABORTED although the body is fully received (verified with curl + in-page byte count) — `scripts/e2e/ai.mjs` reports them separately as artifacts.
- D6: Academic deletes keep relations (they show as «عنصر محذوف» until restored); space-item deletes snapshot + drop their relations.

## Step 4 result
- Migration 5 (13 wos_* tables, additive). shared/wos.ts (types, zod, field kinds, filters/sort), shared/formula.ts (safe parser), shared/templates.ts (7 built-ins), server/wos/{core,repo,automations,agenda,routes}.ts.
- New API: /api/wos/* (spaces, type, items, bulk, views, automations, templates, refs, relations, links, history+revert, trash, inbox, agenda, everything, shares, profile), /api/public/:token, /api/assessments/bulk, /api/notes/bulk, /api/library/bulk, /api/library/youtube/bulk-delete, /api/sports/workouts/bulk-delete. DELETE for YouTube/bookmark/workout now return `undo`.
- Tests: 210/210 on both drivers (+28: tests/wos.test.ts, tests/formula.test.ts, tests/migration.test.ts on a copy of the real DB).

## Step 5–7 result (shell, views engine, universal CRUD — committed together)
- Shell v2 generated from the line registry (`web/src/core/plugins.config.tsx` + `metro.ts`): 7 lines; sidebar = metro map (line rail + stations + «تقاطعات»); one breadcrumb «أنت هنا» for every page (pages publish crumbs via PageHead → shell); global Create (+) (`n`) with quick forms (item / assessment / note) + links; mobile bottom bar; palette with verbs («أنشئ …», backup now, scan library) + every station + spaces/items search; keyboard map extended (old keys unchanged).
- New pages: Today (home rebuilt, old hero/cards/tiles kept below), /week, /everything, /inbox, /map, /trash, /activity, /spaces, /spaces/templates, /spaces/automations, /spaces/:id, /review/progress, /p/:token (public read-only). Aliases: /today, /study, /settings/trash, /spaces/new.
- Views engine (`web/src/views/`): List, Board (drag + keyboard alternative), Table (inline edit, sort), Calendar, Timeline, Gallery, Dashboard; saved views with filters/sort/group; item side panel (fields, sub-items, relations, activity); space settings (fields incl. formula/rollup, statuses + transitions); automation editor (sentence UI); share/export/template/duplicate/archive/delete.
- Interchanges: course page ↔ «ملفات المادة» + «مرتبط بـ»; library item ↔ «المادة» + «مرتبط بـ».
- Confirmation policy applied: single deletes (video, workout, bookmark) no longer ask; undo toast + trash instead.
- D7: Line switcher moved from topbar into the sidebar metro list (7 lines + global tools did not fit at 1280; topbar keeps only global tools).
- D8: Done items visible by default in board/calendar/gallery/dashboard (an always-empty «Done» column misled users); hidden by default in list/table.
- Bugs found by e2e and fixed: mobile search input had ~0px writable width (text typed reversed); modals rendered inside the page stacking context (mobile bottom bar covered Save) → Modal/Drawer now portal to body; automation form saved null for date fields; CSS class collisions (.tl/.kpi/.rel/.tpl-card/.week-grid) renamed.
- a11y: quick crawl ALL CLEAN (axe 0 serious/critical, 0 overflow, 0 console) on 50 routes @1280/390 light; scenarios ALL PASSED (11) @1280 and @390.

## Steps 6–10 result
- View registry (`web/src/views/registry.ts`): 7 generic view kinds + 27 specialized views in 9 places (semester, library, finance, worship, routine, habits, sports, horizons, review); shell renders a view switcher on every page of a place.
- Bulk + undo for every user-owned entity: semesters, courses (new endpoints), assessments, notes, YouTube, workouts, library meta (tag/done), space items. Package export from the UI (`/api/packages/export/:semId`, round-trip test with the v1 importer).
- Settings hub: profile name, sources & management links, density (comfortable/compact).
- Design-system pass: zero-specificity base style for unclassed controls (dark-mode parity), 24 px selection targets, contrast tokens (danger/warn/accent-text light), heatmap dark mid-tones, link underlines in text blocks, terminology unified (تماريني، مسودات الأوامر، الفصول).
- Re-audit written (HCI_EVALUATION § RE-AUDIT, ISSUES statuses). T-01 re-measured honestly (0.9 s visible error; crawler artefact).
- Tests: vitest 216/216 both drivers; smoke 39/39; scenarios 11/11 @1280 & @390.
- D9: No Blob token on Vercel (checked env): online edits stay ephemeral until the owner creates a Blob store — reported, not worked around.

## Step 11 — deploy
- `deploy/platform` → d3a6bd8 (from 6ca34a8); Vercel production `dpl_7EvX5kXATKYSev2utVBhFHxHR3Yq` READY, aliased to https://siro-platform.vercel.app.
- Verified online: `/api/health` schema 5; `/api/semesters` 5 semesters (cold-start package import still works); `/api/wos/templates` 7 templates; `/api/wos/agenda`; SPA route `/spaces/templates` serves the shell.
- Persistence across redeploy: NOT verifiable — project has no `BLOB_READ_WRITE_TOKEN` (owner action; see final report).

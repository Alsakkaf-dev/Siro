# REDESIGN_PROGRESS — HCI audit + Work-OS evolution

Branch: `redesign/hci-work-os` (from `claude/great-newton-p1ds60` @ 672a17f). Instructions: `docs/MASTER_PROMPT_HCI_REDESIGN.md`.
Resume rule: read the decision log + the first unchecked step below, continue from there.

## Steps (§11)
- [x] 1. Bootstrap + baseline
- [x] 2. Phase A audit (§5) + competitive teardown (§4)
- [x] 3. Phase B designs (§6–§9) + ADRs + traceability skeleton
- [x] 4. Foundation: Work-OS core migration + adapters + API + tests
- [ ] 5. Shell & navigation rebuild (metro IA, breadcrumbs, Create +, palette verbs, mobile bar, redirects)
- [ ] 6. Views engine + specialized views registered
- [ ] 7. Universal CRUD (inline edit, bulk, undo, history, relations, side panel)
- [ ] 8. Custom types/fields/templates (My Spaces) + automations
- [ ] 9. Design-system pass + a11y + responsive + dark parity
- [ ] 10. Re-audit (crawler, axe, CW, KLM before/after)
- [ ] 11. Deploy (deploy/platform → Vercel production) + online verification
- [ ] 12. Final report (Arabic)

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

## Decision log
- D1 (owner, mid-session): **Keep the existing visual style.** The redesign improves quality, usability, efficiency, performance, maintainability, interaction (UX actions) and functionality, and refines the style — it does not replace the look. Tokens, fonts, card/pill language, accent system stay; new components reuse them.
- D1b (owner): D1 adds emphasis, it does not narrow scope — every other §11/§12 item is still delivered in full.
- D2: Owner identity on all commits; no AI attribution in commits/PR (master prompt §2.4 overrides the default attribution).
- D3: Keep existing URLs canonical (no path renames) and add aliases for the new IA — zero broken deep links, least risk (§10 tie-break rule 1).
- D4: Trash is now persistent (`wos_trash`, 30 days) and stores raw row snapshots restored with INSERT OR IGNORE. Fixes a latent bug: undoing a semester/course delete lost `acad_results` (official grades) and could overwrite later edits of the parent semester (old applyImport-merge path). `server/trash.ts` (in-memory) removed; `/api/undo/:token` API unchanged.
- D5: Owner display name moved to setting `profile.name` (migration 5 seeds «محمد»); no hard-coded name in logic.
- D6: Academic deletes keep relations (they show as «عنصر محذوف» until restored); space-item deletes snapshot + drop their relations.

## Step 4 result
- Migration 5 (13 wos_* tables, additive). shared/wos.ts (types, zod, field kinds, filters/sort), shared/formula.ts (safe parser), shared/templates.ts (7 built-ins), server/wos/{core,repo,automations,agenda,routes}.ts.
- New API: /api/wos/* (spaces, type, items, bulk, views, automations, templates, refs, relations, links, history+revert, trash, inbox, agenda, everything, shares, profile), /api/public/:token, /api/assessments/bulk, /api/notes/bulk, /api/library/bulk, /api/library/youtube/bulk-delete, /api/sports/workouts/bulk-delete. DELETE for YouTube/bookmark/workout now return `undo`.
- Tests: 210/210 on both drivers (+28: tests/wos.test.ts, tests/formula.test.ts, tests/migration.test.ts on a copy of the real DB).

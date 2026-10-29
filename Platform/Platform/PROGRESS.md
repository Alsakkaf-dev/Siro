
### Cycle 4 — CP2 (v6 sports safety) ✅
- Types for Rashed v6 (beginner_safe / safety_note_ar / safer_alternative_id, safety_review, plans disclaimer/changelog, session safety pairs).
- UI: «ليس للمبتدئ»/«للمبتدئ» badges, "مناسب للمبتدئ فقط" filter, disclaimer banner (injuries shown as «غير مسجلة», never "none"), detail safety block with clickable safer alternative, session safety notes, v2 changelog card, «تماريني» warning + one-click swap to the safer alternative.
- Tests: real-data v6 consistency test (29 unsafe, ids resolve, pairs align); e2e_sports v6 step green at 1280/390. vitest 117, smoke 39.

### Cycle 4 — CP3 (weekly review model) ✅
- shared/weekly.ts: pure model for «مراجعة الأسبوع» per docs/WEEKLY_REVIEW_SPEC_AR.md (window Sun–Sat KL [افتراض], missing ≠ 0, weakest-tag rule, «ما ينقص» list). 21 tests incl. real-data invariants (conditional). UI next.

### Cycle 4 — CP4 (مراجعة الأسبوع per spec) ✅
- `/review` rebuilt from docs/WEEKLY_REVIEW_SPEC_AR.md: Sun–Sat KL window [افتراض] + «يوم السبت ما انتهى» + last-week toggle; sections in spec order (prayer → habits → weight → money → routine/next week → «ما ينقص»); every number has a confidence tag (glossary popover); missing = «غير مسجل» (never 0); review-day note (Sat 09:00 [افتراض] vs Sun, unresolved); per-file generated_at + «قديم» badge. Read-only; no commands sent.
- Old Saturday-first helpers removed from shared/review.ts. Tests: vitest 135 (both DB drivers), e2e_c4 ALL PASSED at 1280/390.

### Cycle 4 — CP5 (chunk 1 closed) ✅
- v6 safety UI verified end-to-end (badges, note, safer-alternative link, disclaimer, injuries «غير مسجلة», session notes, changelog, swap in «تماريني»); e2e_sports ALL GREEN 1280/390.
- /review audited line-by-line against WEEKLY_REVIEW_SPEC_AR.md; added relapses line + time on as_of. Removed content-visibility (broke innerText/copy). e2e_c4 ALL PASSED. vitest 135 (both drivers), smoke 39.
- Boot prefetch added for /sports*, /review (content + bundle); life chunk preloads. Mobile Lighthouse: 20 pages 93–100 (noise ±3; life/glossary occasionally 93–94 → chunk 2).
- README_AR + DESIGN_REFERENCES updated (safety, review, palette, bell, appearance, glossary, offline).
- Pending from parent: v7/v8 files (ledger_full.json, ROUTINE_BLOCKS_AR.json, FINANCE_INSIGHTS_AR.json, PRAYER_QADA_PLAN_AR.json).

### Chunk 2 — v8/v9 integration + Rashed cross-check fixes ✅ (checkpoint)
- New read-only pages: `/life/ledger` (ledger_full.json: search/type/wallet/date filters, sort, total_rows, local-only note, redaction note), `/life/routine-map` (ROUTINE_BLOCKS_AR: 7-day lanes, overlaps outlined + list, points, conflicts, holidays), `/life/insights` (FINANCE_INSIGHTS_AR: ready value_text_ar / missing_text_ar only), `/life/qada-plan` (3 scenarios; choice stored only in site DB `life.qada_scenario` via GET/PUT /api/life/qada-choice). FIELD_LABELS_AR.json whitelisted + used for the 17 missing-data card titles.
- Cross-check items: (1) exact kg (kgText, v9 goal_progress; baseline change 0.65 and remaining 20.65 shown separately); (2) daily-spend chart from full ledger + Rashed's own spend_adjustments (13 Oct 10.00) + «تقديرية» note; (3) safety UI re-verified; (4) habit counters list «نتيجته غير معروفة» + explanation; (5) freshness: generated_at without zone = KL, future = inconsistent, «الآن» only <2 min; (6) daily rate = Rashed's finance.daily_box_rate 20.05 / 0.98 day with explanation_ar verbatim; (7) prayers today row «غير معروف», done_today of another day shown as unknown; (8) plainText/plainDeep hide R-/D-R-/RC-, file & field names, no raw ids in UI, Arabic units, weight chart axis fitted (not from 0), «اليوم N في الجدول المقترح» wording, templates use latest weight; (9) all four v8 files + labels used.
- Tests: tests/crosscheck.test.ts (+ endpoint tests in sports.test.ts), e2e_v8.mjs (1280/390).

## FINAL (safe stop ordered by Mohammed, 2026-10-26 23:0x UTC+8)
- Complete: Cycle 4 incl. chunk 2 (ledger table, routine map, insights, qada plan, FIELD_LABELS, all 9 cross-check items with regression tests). No half-built pages: every nav link/route resolves; all four content whitelist entries have finished pages.
- Not done: Cycle 5 deep self-review; mobile Lighthouse re-measure for the 4 new pages; real PC-folder test.
- Tests: vitest 163/163 on both DB drivers; smoke 39/39; typecheck clean; Playwright e2e_v8, e2e_c4, e2e_sports, e2e_life, e2e, e2e_library ALL PASSED at 1280/390 (axe included).

## FINAL VERIFICATION (after safe stop)
- Lighthouse mobile: life 93, finance 93, ledger 94, routine-map 90–100 (a11y 96: tiny blocks target-size), insights 100, qada 93–95. Fix applied: lifeKit chunk 35→12.5 KB (fieldLabel moved to shared/labels.ts, indicatorView to shared/insights.ts so life pages no longer pull weekly/v8), boot prefetch for /life/finance content.
- Missing-folder test (e2e_missing.mjs): Rashed folder absent + library folder absent/removed → 20 routes × 1280/390 ALL CLEAN; library rescan after folder removal stays clean.
- Cycle 5 deep review NOT done.
- Fix: glossary term click no longer closes the popover that hover just opened (flaky e2e + real UX bug).

## STOP (urgent): build OK, vitest 163/163 both drivers, smoke 39/39, e2e_c4 ALL PASSED after last fix. Final e2e sweep and clean-install re-check NOT re-run after the last glossary click fix (all passed before it). Cycle 5 not done.


## الخطة الموحدة — المرحلة 2 (2026-10-29) ✅
- P4–P8 (التنقل) مكتملة: المادة محور (`?tab=`)، التقييمات بعروض `?view=list|weeks|gantt|weights`، «مُصحَّح» يتطلب درجة، المكتبة/الحياة/الرياضة بتبويبات، الإعدادات `?tab=general|data|sources`، حالة الفلاتر في الرابط (`useUrlParam`)، المراجعة بفهرس. توثيق: `docs/nav-restructure/NAVIGATION_AR.md`.
- المطبخ K-M3/K-M4/K-M5: ترحيل `id: 4` (جداول `kitchen_*` فقط) + `server/kitchenRoutes.ts` (أسعار مبذورة من `SEED_PRICES` + تدقيق وتراجع، سلة، «اشتريت» ذرّي بـ`db.tx`، مخزن، محفظة، طلبات مكوّنات، SSE `/api/kitchen/stream`) + صفحات المتجر والسلة والمخزن والمحفظة والأسعار والقاموس.
- اختبارات: vitest 256 ناجح (الأساس 221) منها 18 API للمطبخ بالسائقين (better-sqlite3 وnode:sqlite)، و17 للمحركات الجديدة؛ `browser-smoke --strict`: 48 مسارًا × 2 عرض + سيناريوهات J1/J2/J3/J8 وAC-01…04 بأزمنة مقيسة، 0 أخطاء.

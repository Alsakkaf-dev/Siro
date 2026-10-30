# HCI_EVALUATION — baseline (before) and re-audit (after)

Method: expert heuristic evaluation (Nielsen 0–4), cognitive walkthrough (CW) of 7 top tasks, KLM-GOMS estimates, Fitts/Hick/Gestalt/scent/wayfinding checks, WCAG 2.2 AA via axe (crawler) + manual keyboard pass. Evidence: `ISSUES.md` IDs.

KLM operators used: K 0.28 s (avg typist), P 1.10 s (point), B 0.10 s (button press; click = BB 0.20 s), H 0.40 s (home hands), M 1.35 s (mental prep). Typing n chars = n·K. Page load excluded (local server ≈ 100–300 ms).

## 1. Nielsen heuristics (baseline)

| # | Heuristic | Violations (severity 0–4) |
|---|---|---|
| N1 | Visibility of system status | Home hides deadlines/today (H-01, **4**); no history of changes (H-15, 2); missing-file spinner for 15 s (T-01, **3**) |
| N2 | Match with real world | "لا إنترنت" claim in online mode (H-20, 2); good Arabic domain language otherwise |
| N3 | User control & freedom | Undo only 9 s, only academic (H-05/T-03, **4**); no bulk undo |
| N4 | Consistency & standards | 5 parallel navigation systems; 3 settings pages (H-09, 2); missing breadcrumbs on 9 routes (H-07, **3**); label drift (H-17, 2); two different "unknown" counts (T-04, 2) |
| N5 | Error prevention | Good: confirmations, zod validation, merge-by-default import. Gap: deleting a semester deletes all its courses with only a toast to recover (**3**) |
| N6 | Recognition rather than recall | Cross-domain "today" requires remembering where each thing lives (H-03, **3**); workout invisible (H-23, 2) |
| N7 | Flexibility & efficiency | No global create (H-06, **3**), no bulk (H-14, 2), palette verbs missing (H-13, 2), CLI-only package export (H-18, 2) |
| N8 | Aesthetic & minimalist | Visual design is strong (kept, owner decision D1). Duplicate nav buttons (H-16, 2); Life sidebar 17 items (H-08, 2) |
| N9 | Recognize/diagnose/recover from errors | Messages are Arabic & specific (good); unrecoverable deletes after toast (**3**) |
| N10 | Help & documentation | Glossary + shortcuts modal exist (good); no map of the site (H-22, 2) |

Severity ≥ 3 (must be resolved): **9** — H-01, T-01, H-05/T-03, H-07, semester cascade delete recovery, H-03, H-06, unrecoverable deletes (N9), + H-04 (wide-imagination, task impossible → 4).

## 2. Cognitive walkthroughs (baseline)

Four questions per step: Q1 will the user try to achieve the right effect? Q2 notice the correct action is available? Q3 associate action with effect? Q4 see progress?

### CW-1 "What do I have due this week across all courses?"
1. Home → sees semester hero; no deadlines. Q2 ✗ (nothing says "this week"). User guesses «افتح اللوحة».
2. Dashboard → «المواعيد القادمة» list (all upcoming, not week-bounded). Q3 partial: must compute "this week" mentally from relative days.
3. Alternative: bell icon (not labeled; Q2 ✗ for a novice).
**Failure points:** 2 (Q2 at step 1, Q3 at step 2).

### CW-2 "Add a new assessment and see its effect on my grade target"
1. Navigate: Home → dashboard → المواد → course card (3 clicks). 2. «إضافة تقييم» → form (kind, title, weight, timing…) → save. 3. Navigate to حاسبة الدرجات (sidebar) → choose course. Q2 ✗: no hint after saving that the calculator reflects it.
**Failure points:** 1 (step 3 Q2).

### CW-3 "Find last semester's lecture slides for course X and resume where I stopped"
1. Library → facets: semester, course, type=slides (3 facet clicks) or type a query. 2. Open item → PDF resumes at last page ✓ (good existing feature). Q2 ✗ from the course page: there is **no** link to its files.
**Failure points:** 1.

### CW-4 "Log/see today's prayers, habits, workout and money in one place"
Impossible on one page: /life (prayer qada, habits, balances) + /sports/mine (workout). Q1 ✗ — "one place" does not exist.
**Failure points:** task fails as specified.

### CW-5 "Start SEM-6 from scratch and later archive it to Drive as a package"
1. /academic → «فصل جديد» → form ✓. 2. Add courses/assessments ✓. 3. Archive: no UI. The package format exists (`SEMESTER_PACKAGE_SPEC.md`) but export is a CLI script. Q2 ✗.
**Failure points:** step 3 fails.

### CW-6 "Create something the site wasn't designed for (reading list, job-application tracker)"
No affordance at all. Q1 ✗ / Q2 ✗. **Task impossible.**

### CW-7 "Undo a mistaken delete"
Academic: toast «تراجع» for 9 s ✓, then gone. YouTube/workout/bookmark: no undo. Q4 ✗ after toast expiry. **Fails** in 2 of 3 situations.

## 3. KLM-GOMS (baseline)

| Task | Operator sequence (baseline) | Clicks | Est. time |
|---|---|---|---|
| T1 due this week | M P BB (open dashboard) M + scan list & compute week M | 1 | 5.4 s |
| T2 add assessment + effect | M + 3·PBB (dash→courses→course) + PBB (add) + M + form[3·PBB + 12K] + PBB (save) + M + PBB (calculator) + PBB (pick course) | 7 + form | 20.4 s |
| T3 find slides & resume | M PBB (library) 3·(M PBB) facets PBB (open) | 5 | 11.6 s |
| T4 today's 4 things | M PBB (life) M scan, PBB (sports) PBB (mine) M scan | 3 | 10.0 s |
| T5 new semester + archive | M PBB PBB form(6 fields ≈ 6·(PBB)+30K) PBB … archive **impossible** | ∞ | — |
| T6 custom tracker | impossible | ∞ | — |
| T7 undo after 9 s | impossible (restore full backup = M PBB(settings) PBB(restore) M PBB(confirm), loses other work) | 3+ | lossy |

## 4. Laws & principles (baseline findings)

- **Fitts:** topbar targets 40 px ✓; mobile: platform switch hidden behind burger (far, 2 taps) ✗; routine-map blocks < 24 px ✗.
- **Hick:** Life sidebar 17 items (log2(18) ≈ 4.2 bits per decision) ✗; Academic 9 ✓; palette top list 8 ✓.
- **Miller/chunking:** Dashboard groups into cards ✓; Life flat list ✗.
- **Gestalt:** strong card grouping ✓; same-looking links in different nav systems blur hierarchy ✗.
- **Scanning (RTL F-pattern):** page titles right-aligned with actions on the left ✓ consistent.
- **Information scent:** «الفصول» used for both the platform and the semester list; «مراجعة الأسبوع» under "عام" with weak scent; bell icon unlabeled.
- **Wayfinding:** Where am I? (switcher highlight + sidebar ✓, crumbs inconsistent ✗). Where can I go? (no map ✗). How back? (browser back ✓, crumbs partial). What happened? (toasts ✓, no history ✗).
- **Error prevention/recovery:** see N3/N5/N9.
- **Responsiveness/offline:** PWA shell ✓, offline page ✓, no horizontal overflow ✓ (crawler 0).
- **Emotional/motivational:** calm tone, honest confidence tags (مثبت/محسوب/افتراض) ✓ — keep. No sense of daily progress on Home ✗.

---

## RE-AUDIT (after the redesign)

Evidence: full crawler (37 baseline + 13 new routes, incl. a space with items, an item panel and saved views) × 1280/768/390 × light/dark; functional scenarios `scripts/e2e/scenarios.mjs` (11 flows, UI-only) at 1280 and 390; unit/API/migration tests (226). Same KLM operators as the baseline.

### A. KLM-GOMS before → after

| Task | After (best path) | Clicks before → after | Time before → after |
|---|---|---|---|
| T1 due this week (all courses + spaces) | Home «المواعيد» shows overdue / today / 7 days: M | 1 → **0** | 5.4 s → **1.4 s** |
| T2 add assessment + see effect | `n` (K) + M + PBB (تقييم) + PBB (course) + PBB (متابعة) + form + PBB (save) + PBB (toast «الحاسبة» opens that course) | 7 → **5** (+form) | 20.4 s → **17.2 s** (and no recall of where the calculator is) |
| T3 resume last semester's slides | Home «تابع من حيث توقفت»: M + PBB (resumes at last page) · not-recent: course page «ملفات المادة» 1 click · palette 5.2 s (unchanged) | 5 → **1** | 11.6 s → **2.7 s** |
| T4 today's prayers + habits + workout + money | Home «الحياة اليوم» + «تمرين اليوم»: M | 3 → **0** | 10.0 s → **1.4 s** |
| T5 new semester → archive as package | `n` → فصل دراسي (form) … archive: الدراسة › استيراد وتصدير الحزم → «تنزيل semester.json» + listed folders | impossible → **2** | ∞ → **2.6 s** (+ upload outside the app) |
| T6 create a custom tracker (reading list / job hunt) | `n` (K) + M + PBB (مساحة جديدة) + PBB (استخدم) + PBB (إنشاء) | impossible → **3** | ∞ → **5.5 s** |
| T7 undo a delete after the toast expired | sidebar «سلة المحذوفات» PBB + M + PBB «استعادة» | lossy backup restore → **2** | lossy → **4.0 s**, nothing else lost |

Every top task improved; none regressed.

### B. Cognitive walkthroughs (after)

| CW | Failure points before | After |
|---|---|---|
| CW-1 due this week | 2 | **0** — Home answers it at first glance; `/week` for detail; bell lists deadlines + inbox |
| CW-2 add assessment + effect | 1 | **0** — global (+) with course picker; success toast offers «الحاسبة» pre-selected on that course |
| CW-3 find & resume slides | 1 | **0** — course page shows «ملفات المادة»; file page shows «المادة»; Home «تابع» |
| CW-4 one place for today | task failed | **0** — Home Today cards (agenda, workout, life today, reading, inbox, alerts) |
| CW-5 start SEM-6 → archive | step failed | **0** — (+) فصل دراسي; package export card with folder list and steps |
| CW-6 something new | impossible | **0** — مساحاتي › القوالب (7 built-ins + «مساحة فارغة»), fields/statuses/views/automations editable from the UI |
| CW-7 undo a delete | fails 2/3 | **0** — every delete (12 entity kinds) → toast «تراجع» + 30-day trash |

### C. Nielsen severity ≥ 3 — all resolved

| Violation (before) | Resolution |
|---|---|
| H-01 Home is a launcher (N1, 4) | Home = Today/This-week central station; old hero/cards kept below |
| T-01 missing file (N1, rated 3 at baseline) | re-measured: the viewer error appears after 0.9 s (the 15 s was crawler network-idle, re-rated S3); Home «تنبيهات» now names the cause and links to Library settings |
| H-05/T-03 undo only 9 s, academic only (N3, 4) | persistent trash (wos_trash) for academic, library, sports, spaces, views, automations, relations; `/trash`; history revert for item edits |
| H-07 breadcrumbs missing on 9 routes (N4, 3) | one shell breadcrumb «أنت هنا» on every page (line chip + stations) |
| Semester cascade delete recovery (N5, 3) | snapshot restore incl. official results (regression test) + confirmation for bulk semester/course deletes |
| H-03 today spread over pages (N6, 3) | Home Today cards |
| H-06 no global create (N7, 3) | (+) button, `n`, palette verbs, contextual default in spaces |
| N9 unrecoverable after toast (3) | trash + activity log |
| H-04 no user-defined anything (4) | My Spaces: types, 17 field kinds, statuses+transitions, 7 view kinds, templates, automations |

### D. WCAG 2.2 AA (axe, serious + critical)

| | Baseline | After |
|---|---|---|
| Page-states with serious/critical | 101 / 222 | **0** (see `ISSUES.md` § C for the final crawl numbers) |
| Rules hit | button-name, color-contrast, target-size, label-content-name-mismatch, aria-required-children, scrollable-region-focusable | none |

Manual keyboard pass: skip link; `/` and `n` from anywhere; every overlay (modal, drawer, menus) traps focus, closes on Esc and restores focus; board drag has a select alternative; routine-map blocks have an equivalent per-day list; calendar day «+» buttons are reachable.

### E. Laws & principles (after)
- **Hick:** 7 lines; Life split into 5 groups of 2–3 stations (max decision set 3 instead of 17).
- **Fitts:** mobile bottom bar (5 targets ≥ 48 px, Create in the thumb zone); checkboxes 24 px; routine map equivalent list.
- **Wayfinding:** line chip + crumbs + metro sidebar + view switcher + `/map`; same placement on every page.
- **Consistency:** one Create, one undo model, one status-pill, one view switcher, one terminology glossary (`NAVIGATION_SPEC.md §4`).
- **Emotional design:** calm Today page; honest «≈» for approximate dates and «غير معروف» kept (no guessing).

## AI CORE (ADR-0009) — KLM with the assistant

Same operators (K 0.28 s, P 1.10 s, BB 0.20 s, M 1.35 s). **R** is model response time. It is measured per machine by `npm run ai:eval`, which reports the average. Ranges assumed below:

- Qwen3.5-4B, CPU only: 2–6 s per step.
- Qwen3.5-4B, GPU: under 1.5 s.
- Cloud providers: 1–3 s.
- The fake model used in CI: 0.1 s.

Typing an Arabic sentence of n characters costs n·K.

| Task | Without AI (best UI path) | With AI | Verdict |
|---|---|---|---|
| A1 add **one** assessment | 17.2 s (T2 after redesign) | Ctrl+J K + M + 38 chars + K + R + M (preview) + PBB = **15.2 s + R** | ≈ equal — the form is just as good for one item |
| A2 enter a syllabus of **12** assessments | 12 × (PBB + 3·PBB + ~12K + PBB + M) + nav ≈ **125 s** | PBB «التقاط ذكي» + paste (2K) + K + R + M (review list) + PBB = **4.8 s + R** (R ≈ 10–20 s for 12 items on CPU) | **≈ 5–8× faster** |
| A3 design a tracker (5 fields + 4 statuses) | template + settings modal: 5×(PBB + 8K + 2·PBB) + 4×(PBB + 8K) + 5.5 ≈ **50 s** | PBB «صمّمها بالذكاء» + 60 chars + K + R + M + PBB = **21 s + R** | **≈ 2× faster**, plus no need to know field kinds |
| A4 "what do I need for 70% in every course" (6 courses) | 6 × (PBB pick + M) + nav ≈ **18.5 s** | PBB (suggestion chip) + R + M = **2.7 s + R** | **≈ 3–6× faster** |
| A5 log 3 prayers + 1 expense | 4 × (type + 4 fields + submit + M) ≈ **48 s** | 60 chars + K + R + 4·PBB (policy «ask») = **24 s + R** · policy «auto» **19 s + R** | **≈ 2× faster** |
| A6 summarise / quiz me on a 40-page PDF | not possible inside the app (manual reading) | PBB «لخّص» + R + M | impossible → **1 click** |
| A7 daily brief | Home already 1.4 s | arrives in the Inbox each morning (background, free provider only) | 0 interaction |
| A8 change one item's status | 4 PBB + M = **6.6 s** | 35 chars + K + R ≈ **10 s + R** | **slower** — direct UI stays the right tool |

Conclusion: the assistant is **additive**. It wins on multi-entity, compositional and reading tasks: up to ~8× faster, and some tasks that were impossible become one click. It loses on single-click edits, so every existing control stays. A literal "900×" is not supported by any measurement. The real ceiling is the ratio between the number of form operations and one sentence plus R.

Evidence for safety and UX:

- `tests/ai.test.ts` (14) and `tests/ai-agent.test.ts` (17) cover: the tiers, that a refusal is reported to the model, the loop guard, the step cap, text-tool-call recovery, fallback, the cap, the online lock, actor tagging, and keys never echoed.
- `scripts/e2e/ai.mjs` runs 10 UI-only flows at 1280 and 390, with axe clean on the panel.
- The full crawler is ALL CLEAN after the change.

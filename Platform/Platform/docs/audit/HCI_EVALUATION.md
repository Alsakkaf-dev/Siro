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
| T2 add assessment + effect | M PBB PBB PBB (dash→courses→course) PBB (add) M + 3 fields (≈ 3·(P BB) + 12K) PBB (save) M PBB (calculator) PBB (course) | 7 + form | 25.6 s |
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

## RE-AUDIT (after) — see bottom of this file (filled in step 10)

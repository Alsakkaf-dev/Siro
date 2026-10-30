# IA_DIAGNOSIS — information architecture (baseline)

## 1. Card sort by proxy
All 41 routes + 12 major widgets clustered by the student's mental model (domains × time horizons).

| Cluster (mental model) | Today | This week | This semester | Archive / reference |
|---|---|---|---|---|
| **Study** | next deadline, today's lectures | due this week, week load | dashboard, courses, calculator, weights, timeline, unknowns | past semesters, packages, official results, print |
| **Library** | continue reading (recent) | — | course files | all files, folders, YouTube |
| **Life** | now/next routine, prayers today, daily budget, habits | weekly routine map | qada plan, body goal | ledger, insights, glossary, Rashed docs |
| **Sports** | today's workout | weekly plan | templates | exercise library |
| **Review** | — | weekly review | — | — |
| **System** | — | — | — | settings, backups, import/export, appearance, sources |
| **(missing) user-defined** | — | — | — | — |

Finding: the *Today* and *This week* columns are spread across 6 pages in 4 platforms → the strongest user question ("what now?") has no home. The IA is organized only by **data source** (Rashed files → Life, folder scan → Library), not by **user goal**.

## 2. Tree test by proxy (first-time user)

| Task | Expected path | Likely first click | Result |
|---|---|---|---|
| Due this week | Dashboard → upcoming | Home hero «افتح اللوحة» | success with detour (list not week-bounded) |
| Today's workout | Sports → تمريني | «الرياضة» → lands on exercise library (wrong default for this task) | detour (+1) |
| Daily money left | Life → overview tile | Life → «المال» (finance page; daily box is on overview) | detour |
| Weekly review | sidebar «عام» → مراجعة الأسبوع | Life (reviews life data) | **failure** (Review not under Life nor in switcher) |
| Back up data | Settings | sidebar card «النسخ الاحتياطي» | success |
| Library folder location | Library → الإعدادات | Settings (global) | **failure** (settings split) |
| Make a reading list | — | — | **failure** (no place) |
| Change semester | topbar chip | chip (hidden label on mobile) | success desktop / weak mobile |

## 3. Structural defects

- **Duplicated entry points:** platforms reachable from switcher + Home cards + palette; library sub-pages from sidebar + header buttons; life alternatives/body/glossary from Life *and* Sports sidebars (cross-links presented as if they were Sports pages — mixed ownership).
- **Orphans / weak scent:** `/academic/s/:id/print` (only from dashboard button), `/life/glossary` (deep in Life though used site-wide), `/review` (only in "عام").
- **Dead ends:** course page (no files), library item (no course link back), review (no actions), insights (text only).
- **Mixed metaphors:** "platforms" (منصات) vs pages vs tabs: Timeline uses tabs for *views* (heatmap/gantt/scatter/cumulative — correct), Courses uses Segmented for views (cards/list/table — correct), but Library uses sidebar pages for what are views (folders, YouTube).
- **Inconsistent depth:** Academic depth 3 (semester → course → assessment anchor); Life depth 1 (14 siblings); Sports 1.
- **Tabs that should be views:** Library folders/YouTube; Life finance/insights/ledger (one finance place with three views).
- **Pages that should be filters:** `/academic/s/:id/unknowns` is a filter "unknown" over assessments + notes (kept as a specialized view).
- **Settings scattered:** `/settings`, `/library/settings`, `/life/settings`, sports template/location choice inline.

## 4. Conclusions → design inputs
1. Organize by **lines** (user goal domains) with **Home = central station** answering Today/This week.
2. Treat per-domain alternatives as **views** of one station (view switcher), keep URLs.
3. Add the missing line **مساحاتي** for user-defined spaces.
4. One **Settings & data** hub linking every settings surface; one **map** page; consistent breadcrumbs from a single route registry.

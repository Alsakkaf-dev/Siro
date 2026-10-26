# ISSUES — baseline defect register

Severity: **S0** blocker · **S1** major (task failure / data-loss risk / WCAG A-AA serious) · **S2** moderate (friction, inconsistency) · **S3** cosmetic.
Evidence: crawler report `scripts/e2e/crawl.mjs` (baseline run 2026-10-26: 37 routes × 1280/768/390 × light/dark = 222 page-states, **105 with problems**), screenshots under the crawl output `shots/` (not committed; regenerate with the crawler), code references.
Status column is filled during the re-audit (§ RE-AUDIT in `HCI_EVALUATION.md`).

## A. Accessibility / technical (crawler + axe)

| ID | Sev | Cat | Problem | Repro / evidence | Req | Status |
|---|---|---|---|---|---|---|
| A-01 | S1 | a11y | `button-name` (critical) on **every page at 768/390**: the semester chip loses its visible label (`.sem-chip .lbl {display:none}`) and has no `aria-label` | crawl: 74 page-states; `.sem-chip` | I1 | open |
| A-02 | S1 | a11y | `aria-required-children` (critical) on calculator: `.targets` has `role` list/radiogroup without owned children roles | `/academic/s/:id/calculator` all widths | I1 | open |
| A-03 | S1 | a11y | `label-content-name-mismatch` on course cards: `aria-label="افتح X"` does not contain visible text (WCAG 2.5.3) | `/courses` 6 cards × 6 states | I1 | open |
| A-04 | S1 | a11y | `target-size` on routine map: 20-minute blocks are < 24 px (WCAG 2.5.8) | `/life/routine-map` 43–73 nodes | I1 | open |
| A-05 | S1 | a11y | `scrollable-region-focusable` at 390: timetable/calculator/print wrappers scroll horizontally but are not keyboard-focusable | `.tt-wrap` etc. | I1 | open |
| A-06 | S1 | a11y | `color-contrast`: `.core` badge on /academic; danger badge inside `h1` on /life (390); several life/unknowns badges | 17 page-states | I1 | open |
| A-07 | S2 | a11y | Keyboard `g x` shortcuts cover only academic + review + settings; no shortcut to library/life/sports/create | Shell.tsx | I6 | open |
| T-01 | S1 | technical | Missing local file → PDF viewer waits ~15 s (network-idle never reached) and logs a console 404; user sees a spinner instead of an explanation | `/library/f/:id` when library root is absent (crawl ms=15 287) | I1 | open |
| T-02 | S2 | technical | Library root stored in DB overrides `PLATFORM_LIBRARY_ROOT`; on a new machine every file is "missing" until the user finds Library → Settings | `/api/library/status` root_exists=false | I1 | open |
| T-03 | S1 | data | Undo exists only for academic deletes and only for 10 min **in server memory** (lost on restart); YouTube, bookmark, workout deletes have **no undo** | routes.ts Trash, libraryRoutes/sportsRoutes DELETE | I4 | open |
| T-04 | S2 | technical | `unknownCount` badge (sidebar "40") and dashboard tile "غير معروف 16" count different things under the same label | sem-context.tsx:97 vs Dashboard.tsx:117 | I2 | open |
| T-05 | S2 | perf | Main bundle 330 KB (104 KB gz) contains Dashboard eagerly; fine on desktop, heavy on mobile 3G | build output | I2 | open |
| T-06 | S3 | technical | Duplicate API fetch on boot for semesters (index prefetch + context) mitigated by `__pre`; OK | — | — | n/a |

## B. HCI / usability

| ID | Sev | Cat | Problem | Evidence | Heuristic | Req | Status |
|---|---|---|---|---|---|---|---|
| H-01 | S1 | HCI | **Home is a launcher, not a dashboard**: no deadlines, no today's prayers/habits/workout/money; on 390 px the first useful item is below 4 large platform cards | home__390 screenshot | N1 visibility, N6 recognition | I3 I6 | open |
| H-02 | S1 | HCI | "What's due this week across all courses?" requires opening the semester dashboard and scanning a list that is not filtered to *this week* | CW-1 | N1, N7 | I2 | open |
| H-03 | S1 | HCI | Today's prayer, habits, workout and money live on 3 different pages in 2 lines | CW-4 | N6, N8 | I5 | open |
| H-04 | S0 | IA/func | Nothing user-defined can be created: no generic list/tracker, no custom fields, no templates — the "wide imagination" requirement is unmet | CW-6 | — | I7 | open |
| H-05 | S1 | HCI | Undo is a 9-second toast only; after that, a mistaken delete is unrecoverable from the UI (only backups) | CW-7 | N3 user control, N9 recovery | I4 | open |
| H-06 | S1 | IA | No global "Create": each entity has its own add button deep inside its page | — | N7 flexibility | I4 | open |
| H-07 | S2 | IA | Breadcrumbs missing on 9 routes (`/`, `/library`, `/life/ledger`, `/life/routine-map`, `/life/insights`, `/life/qada-plan`, `/review`, `/settings`, `/search`) and present but inconsistent elsewhere | crawl `crumbs=false` | N4 consistency | I6 | open |
| H-08 | S2 | IA | Life sidebar: 14 entries in one flat list + 3 global = 17 choices (Hick); finance split over 3 pages (المال/مؤشرات/السجل) | screenshot life__1280 | Hick, chunking | I3 | open |
| H-09 | S2 | IA | Three separate settings pages (global / library / life) + sports settings inline | — | N4 | I3 | open |
| H-10 | S2 | IA | Review & Settings are neither platforms nor in the switcher; "عام" block repeated at the bottom of every sidebar | Shell.tsx | N4 | I6 | open |
| H-11 | S2 | IA | Mobile (<961 px): the platform switcher disappears from the topbar; switching platforms needs burger → switcher (2 taps, hidden) | shell.css | Fitts, N6 | I6 | open |
| H-12 | S2 | HCI | No link course ↔ its library files ↔ its assessments; the library knows `course_code` but the course page never shows the files | CW-3 | information scent | I5 | open |
| H-13 | S2 | HCI | Palette knows nouns (pages) but almost no verbs (create assessment, add video, backup now, scan library) | Palette.tsx | N7 | I6 | open |
| H-14 | S2 | HCI | No bulk actions anywhere (mark several assessments done, delete several videos/notes) | — | N7 efficiency | I4 | open |
| H-15 | S2 | HCI | No activity history: the user cannot see what changed or when | — | N1 | I4 | open |
| H-16 | S2 | HCI | Library header duplicates the sidebar (المجلدات / YouTube / الإعدادات buttons) — two navigation systems for the same targets on one screen | library__390 | N8 minimalism | I3 | open |
| H-17 | S2 | content | Terminology drift: «الفصول» = semesters platform *and* page title; «تمريني» vs «تماريني»; «الأوامر (مسودات)» vs «المسودات»; «غير المعروف» vs «غير معروف» | nav vs Palette | N4 | I6 | open |
| H-18 | S2 | HCI | Semester package export/publish exists only as a CLI script (`scripts/package-semester.mjs`) — not discoverable or usable from the UI | CW-5 | N7 | I4 | open |
| H-19 | S3 | HCI | Home greeting hard-codes the owner's name «محمد» — blocks giving the app to a friend | Home.tsx | — | I9 | open |
| H-20 | S3 | HCI | `side-card` «بياناتك عندك فقط — لا إنترنت» is false in online mode | Shell.tsx | N2 match real world | I1 | open |
| H-21 | S2 | HCI | Keyboard shortcut hints `g d` etc. are shown inside nav links, low contrast, ambiguous in RTL | screenshot | N8 | — | open |
| H-22 | S2 | HCI | No "where am I in the whole site" overview; the structure is only learnable by exploring | — | wayfinding | I6 | open |
| H-23 | S2 | HCI | Workout of the day is invisible outside `/sports/mine` | CW-4 | N6 | I5 | open |
| H-24 | S3 | HCI | Empty-state for a brand-new user on Home says "ابدأ بإضافة فصلك الأول" only — no path for non-academic use | — | — | I7 | open |

## C. Counts (baseline)
- Crawl: 222 page-states, 105 with problems (axe serious/critical in 101, console/failed requests in 6, horizontal overflow 0).
- axe serious/critical rules: button-name 74, color-contrast 17, target-size 6, label-content-name-mismatch 6, aria-required-children 6, scrollable-region-focusable 6.
- Nielsen severity ≥ 3 violations: 9 (see HCI_EVALUATION §1).

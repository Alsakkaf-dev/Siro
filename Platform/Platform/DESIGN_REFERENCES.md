# مراجع التصميم — Design References

Source: Mohammed's 22 screenshots in `/workspace/ui_refs/` (copied to `/workspace/platform_refs/` as d01–d14, c01, h01, x01–x06).
**Permanent rule:** these screenshots are the primary visual language. Result: **light "soft dashboard" is the default theme** (a dark twin is available via the sun/moon toggle, modelled on d10/d11), RTL Arabic.

## Global language extracted from all 22

| Trait | Seen in | How we apply it |
|---|---|---|
| Lavender-grey page canvas (#EEF0FA-ish) with white, very rounded (20–24px) cards and large soft shadows; no hard borders | d03 d04 d05 d06 d09 d12 d13 | `--bg`, `--surface`, `--r-xl`, `--shadow-1/2` |
| Indigo/violet primary (#5B45F0) used for the active nav pill, primary buttons, hero KPI; lime highlight in dark | d05 d07 d09 d12 d10 | `--primary`, `--lime` |
| Pastel tinted tiles (orange/purple/blue/green/pink) with an icon in a rounded square | d03 d04 d05 d09 h01 | `.kpi`, `.tile-*`, course cards tinted with the course colour |
| Pill-shaped controls: search with `/` or ⌘K hint, tab pills, filter chips, black "active" pill | d06 d11 d12 d13 h01 x06 | `.search`, `.switcher`, `.chip`, `.seg` |
| Bars with fully rounded ends; inactive bars **hatched**, the selected bar solid with a dark tooltip pill | d06 d10 d12 d13 | `WeekLoadChart` (weekly load), `.hatch` |
| Ring/donut progress, mini rings next to rows | d01 d03 d04 d05 d08 | `Ring` component (calculator, course progress, credits) |
| Weekly heat matrix of rounded squares (purple intensity, lime = peak) | d12 d13 | Timeline heatmap |
| Gantt pills with progress fill + week/day ruler | d02 | Timeline "Gantt" view (assessments spanning from→due week) |
| Sidebar: brand on top, icon + label items, sections with muted headings, promo card at bottom | d05 d06 d07 d09 d10 h01 | `Sidebar`, privacy/backup card at the bottom |
| Segmented progress / many thin ticks | d10 d05(x05 dotted) | `.ticks` segmented week progress |
| Tables: muted header, row dividers, inline progress bar + %, status pills, pagination footer | d06 d07 d08 d09 h01 | `.doc-table`, course table view, assessment table |

## Per image

### Dashboard UI
- **d01 – Task Management (kanban + right profile column).** White cards on pale blue canvas, column headings in spaced caps, avatars A/B/C/D coloured dots, progress bars with gradient fill, right column: profile, bar mini-chart, ring "Efficiency", "Plan" time cards with coloured edge. → *Dashboard*: "next deadlines" cards with coloured edge (course colour), mini rings per course.
- **d02 – Gantt + kanban.** Rounded pill rows (avatar chip at start), progress fill darker than the rest, day ruler on top, right column plan times. → *Timeline page*: Gantt view, one pill per assessment, fill = elapsed weeks, course colour.
- **d03 – Finance dashboard (colour KPI tiles).** 4 solid tiles green/orange/blue/purple with an icon in a translucent square, donut with legend rows + progress lines, area chart with dark tooltip. → *Dashboard KPI row* (tinted version for AA contrast), donut for credits/weights.
- **d04 – Finance dashboard v2.** Compact pastel tiles with sparkline, KPI cards with coloured progress bar under number, grouped bars with rounded tops, donut with centre total. → *StatTile with progress underline*, weights-map donut with centre total.
- **d05 – "Academy" student dashboard.** Left sidebar with active soft-violet pill; "New Courses" pastel cards (orange/violet/blue) each with a large icon tile, title, lessons count, avatar stack, square arrow button; "My Courses" table with icon tile + date/rate/level; right column: profile, month calendar with selected-day dot, "Homework progress" rows with mini rings and one highlighted violet row; promo card. → *Course cards (pastel)*, *dashboard mini month calendar with deadline dots*, *ring progress rows*, *sidebar bottom card*.
- **d06 – Light e-learning dashboard.** Sidebar with section headings (GENERAL / COLLABORATION / SUPPORT), profile switcher on top, top search pill with `/`, 4 KPI cards (icon, big number, tiny progress / link row), bar chart with hatched bars + one solid bar and dark tooltip, "Online classes" rows, "Assignment breakdown" segmented bar with legend, table with progress bar + %. → *Shell structure*, *search `/`*, *weekly-load chart*, *status breakdown bar*, *course progress table*.
- **d07 – "Academia".** Sidebar of rounded buttons, active violet filled; course table with progress and level pills; coloured square stat rows; recommended-course cards with thumbnail, price chip, tag chips, full-width button. → *Course catalog card grid* (tags row: section · credits · day).
- **d08 – "BINUS" student dashboard.** Blue header band, dark info card with carousel dots, GPA card with big number + line chart, bars (green vs yellow), table with ring progress per row. → *Hero info card on dashboard* (current week), ring in table rows.
- **d09 – "Eduvi".** Soft white sidebar with violet filled active, KPI cards with coloured underline, table "Course you're taking" with icon tile + progress text, "Upcoming Tests" list (tinted icon, coloured date, chevron) with a black full-width pill button, promo card. → *Next deadlines panel*, *black pill CTA*, *sidebar promo/privacy card*.
- **d10 – "XCourse" dark.** Near-black glass cards, violet hero KPI, lime highlight bars with hatched inactive capsules, ticks progress bars (64% / 87%), step list with check nodes, lime CTA. → *Dark theme palette and lime accent*, *capsule week bars*, *tick-segment progress*.
- **d11 – "Codename" report.** Floating white app panel on warm grey, pill chips for people, black "Details" pill, red/pink accent, grouped list rows with rounded bars, nested sidebar tree. → *Chips/pills, black primary-secondary button*, nested nav (semester list under Academic).
- **d12 – "Nexora".** Top pill tabs (active violet), first KPI tile violet filled with delta chip, KPIs with arrow button, segmented-arc gauge (74%), weekly heat matrix of rounded squares (violet shades, lime peak), tall capsule bars with hatched fill, promo card. → *Top platform switcher as pill tabs*, *hero KPI tile*, *heatmap cells*, *calculator gauge*.
- **d13 – "zentra".** Black active nav pill, large "Overview" title, funnel bars with hatched fill, dot-matrix peak chart, gradient tile, ask-bar. → *Large page title, hatched bars, dot matrix of assessments per week*.
- **d14 – "cascade".** Underline tabs, sun/moon segmented toggle, filter side panel with check cards and pill chips, donut with dark label pill, Sankey. → *Theme toggle*, *filter panel with pill chips*, donut label.

### Courses Catalog UI
- **c01 – "ELEVATE" faceted search.** Left nav + facet column (collapsible groups with checkboxes) + results list: tinted-blue thumbnail tile with icon, small caps meta line (ONLINE · $100), bold title, date, "Details" link, kebab; header "N results", sort, view-mode toggle. → **Courses page (Course Catalog style)**: facets (status, day, has final, weight check), list rows with colour tile + code, sort, grid/list/table toggle.

### Document Hub UI
- **h01 – "Edaca" course list (table hub).** Sidebar with expandable group (Manage Course / Add…), 5 KPI tiles with icon square, "Course List" card with search ⌘K, Filter, Sort buttons, primary "Add New Course", sortable table with status pills (Active / Upcoming), category chips, pagination footer "Showing result 1–10 of 20 entries" with Previous/Next. → **Course table view**, assessment tables, and the **future Library "Document Hub"** (files table with category chips, status pills, pagination). Design system classes `.doc-table`, `.pill-status`, `.cat-chip`, `.pager` are in place now; the Library placeholder page previews it (no data).

### Loose screenshots
- **x01 – Timeline with milestones.** Breadcrumb header + underline tabs, horizontal stepper: green filled done nodes with date above, grey pending nodes, flags below for side events, "Left: 5 months". → *Dashboard "رحلة الفصل"*: 16 weeks + exams as stepper nodes (done / current / break / exam) and "المتبقي: N أسبوع".
- **x02 – Mohammed's Outlook week view (Arabic).** Dense colour-coded blocks per category (study blue/pink, prayer, free), sticky day headers with date numbers, mini month calendar left. Shows real SEM 5 timetable (Special Topics, Ubiquitous, Cognitive, Instrumentation, French D06-BK12, ProfComm). → *Month mini-calendar, per-course colours matching his calendar's pastel palette, future weekly timetable (Phase 2+ bridge)*. Calendar stays read-only; we did not import it.
- **x03 – Outlook To Do list.** White rows with circle checkbox, title, meta line (due date • reminder • category), star; left list nav. Contains exact due dates that refine the week-level data (e.g. Lab1 Mon 2 Nov, Quiz1 SCSE3203 Mon 23 Nov, Progress Demo 7 Dec, Group Assignment submit 11 Dec). → *Deadline rows design*. **Not imported** (the seed must come only from the dashboard/CI); listed as Phase-2 calendar-bridge candidate.
- **x04 – Time-tracking list.** Day groups ("Wed, June 10" + total), rows with time range, coloured left stripe, tiny progress line, hover row elevated with action tab; right column timer card and "calendar sync" cards with coloured edge. → *Deadline list grouped by week*, *coloured stripe rows*.
- **x05 – "Sprigly" glass.** Soft glassy cards, dotted-matrix bars for progress (modules/lessons/months), left profile card, keyboard-shortcut hints (⌘M, ⌘K) on nav, Tasks/Useful/News side cards. → *Dot-matrix week load*, *shortcut hints in nav*.
- **x06 – "Connect Apps" modal.** Large 24px-radius white modal on dimmed page, close ×, search, pill filters (black active), two-column list with logo tile, name, description, "Add" pill. → *Modal style for all forms*, *chips filter row*, *two-column picker (course colour & template picker)*.

## Decisions summary
1. Default theme **light soft-dashboard**; dark theme derived from d10/d11. Design tokens in `web/src/styles/tokens.css`.
2. Shell = sidebar-with-brand (d05/d07/d09) + pill topbar with search `/` (d06) + pill platform switcher (d12) + sun/moon toggle (d14).
3. Dashboard = hero violet KPI + tinted KPI tiles (d12, d03, d06, d09), week-load capsule chart with hatched bars (d06/d10/d12), stepper journey (x01), month mini calendar (d05), upcoming list (d09/x03), status breakdown bar (d06), ring rows (d05).
4. Courses = **Course Catalog** (c01) with facets + list/grid/table (h01, d05, d07).
5. Timeline = Gantt pills (d02) + rounded heat-matrix (d12/d13) + course filter chips.
6. Calculator/weights = rings & donuts (d03/d04/d05/d12).
7. Library placeholder previews the Document Hub pattern (h01 + c01) for the future platform.

---

## Component inventory (de-duplicated union of all 22 references)

Every component seen in the 22 screenshots was listed, near-duplicates were merged into one variant, and all of them live in one RTL Arabic design system (`web/src/ui`, `web/src/widgets`, tokens in `web/src/styles/tokens.css`).

| Component | Source screenshots | Kept variant | Where used |
|---|---|---|---|
| Page canvas + rounded white cards, soft shadow | d03 d04 d05 d06 d09 d12 d13 | Lavender canvas, 20–24px radius, no hard borders (`Card`) | everywhere |
| Sidebar with brand, section headings, active pill, promo card | d05 d06 d07 d09 d10 h01 | Violet filled active pill; bottom card = "your data is local" + backup button | `Shell` |
| Nested nav tree | d11 h01 | Semesters listed under «الفصول» | `Shell` sidebar |
| Keyboard-shortcut hints in nav | x05 d06 | `g d`, `g c`… small mono hints (AA contrast) | `Shell`, shortcuts modal |
| Top pill search with `/` hint | d06 h01 | Combobox with grouped results, arrow keys | `GlobalSearch` |
| Platform switcher (pill tabs) | d12 d06 | Pill tabs: الفصول active; المكتبة / الحياة «قريبًا» | `PluginSwitcher` |
| Sun/moon theme toggle | d14 d11 | Segmented 2-button toggle, stored locally | topbar |
| Breadcrumb + large page title with icon tile | d13 x01 d05 | `PageHead` | every page |
| Hero KPI / info card (violet gradient) | d12 d08 d10 | `Hero`: current week, progress ticks, countdown | Dashboard |
| Countdown digits | d10 d08 | Days : h : m : s to next deadline | Dashboard hero |
| Tick / segmented progress bar | d10 x05 | `TickBar` (32 ticks) | hero, course cards |
| Pastel KPI tiles with icon square | d03 d04 d05 d09 h01 | `StatTile` in 5 tints, optional sparkline | Dashboard |
| Sparkline | d03 d04 d08 | `Sparkline` inside tile | Dashboard tiles |
| Capsule bars (hatched inactive, solid selected, dark tooltip) | d06 d10 d12 d13 | `CapsuleBars` – weekly load, lime = crowded | Dashboard |
| Heat matrix of rounded squares | d12 d13 | `Timeline` heat view, crowded week outlined | Timeline |
| Gantt pills with ruler | d02 | Timeline "Gantt" view (from→due week) | Timeline |
| Scatter / area line | d03 d04 d08 | Timeline "scatter" and "area" views | Timeline |
| Dot matrix | x05 d13 | `DotMatrix` – ≈6% of weight per dot | Dashboard «نبض الأسابيع» |
| Donut with centre total + legend rows | d03 d04 d14 | `Donut` + `LegendRows` | Dashboard, Weights |
| Ring progress (mini) | d01 d03 d05 d08 | `Ring` | course cards, carousel, calculator targets |
| Segmented-arc gauge | d12 d08 | `Gauge` with target marker at 50 | Calculator |
| Funnel bars (hatched) | d13 | `Funnel` total → graded → earned → remaining | Calculator |
| Grouped bars with rounded tops | d04 d03 | `GroupedBars` CA vs final per course | Weights |
| Sankey | d14 | `Sankey` course → assessment type | Weights |
| Segmented breakdown bar + legend | d06 | `SegBar` | Course page |
| Stepper / milestones | x01 | `Stepper` (done / now / next) for semester journey | Dashboard |
| Vertical steps with check nodes | d10 | `VSteps` | Soon (Library/Life) placeholder pages |
| Mini month calendar with dots | d05 x02 | `MiniCalendar` | Dashboard |
| Weekly timetable blocks | x02 | `WeekTimetable`, per-course pastel colours | Dashboard |
| Deadline rows (colour edge, date, chevron) | d09 x03 x04 d01 | `DeadlineRow` | Dashboard, Timeline cell detail |
| Course card (pastel / gradient, avatar stack, arrow button) | d05 d07 c01 | `CourseCard` grid + list | Courses (catalog) |
| Carousel of course cards | d05 d08 | `Carousel` | Dashboard |
| Facet column with collapsible checkbox groups | c01 d14 | `Facet` (type, credits, status) | Courses (catalog) |
| Filter chips, black active pill | d06 d11 d12 x06 | `FilterChips`, `.chip` | Courses, Timeline, Calculator tabs |
| Result count + sort + grid/list/table toggle | c01 h01 | catalog toolbar | Courses |
| Document-hub table: sortable header, status pills, category chips, pagination | h01 d06 d07 d09 | `DocTable` + `Pager` + `Badge`; `VirtualList` (Timeline cell lists) | Courses table view, Course assessments, Library preview |
| Status pills (Active / Upcoming) | h01 d07 | `Badge` tones ok/warn/danger/unknown | tables |
| Kanban board columns | d01 d02 | Assessments grouped by status | Course page «لوحة» |
| Bulk-selection bar | h01 | `DocTable` selectable + bulk status | Course page |
| Avatar / avatar stack | d01 d05 d11 | `Avatar` (lecturer initials; `AvatarStack` is built but not yet used) | Course cards, courses table |
| Kebab menu | c01 h01 | `KebabMenu` (portal, never clipped) | cards, rows |
| Modal (24px radius, dimmed page) | x06 | `Modal` with focus trap; forms and confirm dialog | all forms |
| Switch toggles | d14 x06 | `Switch` | Timeline options |
| Segmented control | d14 d12 | `Segmented` | Courses, Course page, Timeline, Settings |
| Black pill CTA / lime CTA | d09 d11 d10 | `Button` variants primary / ink | hero, empty states |
| Promo / info card | d05 d09 d12 | Privacy-and-backup card | sidebar |
| Empty state, skeletons, toasts with undo | x04 (list rows), d06 | `EmptyState`, `Skeleton`, `Toast` with «تراجع» | everywhere |
| Dark theme (glass cards, lime accent) | d10 d11 | dark tokens | toggle |
| Trust tags («محسوب», «مثبت», «افتراض») | — (project rule) | `TrustTag` | calculator, hero |
| «غير معروف» badge | — (project rule) | `Unknown` | everywhere data is missing |
| Library hub: facet column + document table (kind tile, course badge, progress, tag chips) + pager | h01 c01 d14 | `Facet`, `DocTable` via `libCols`, `Pager`, `.lib-tile`, `.lib-course`, `.lib-prog`, `.tag-chip`; mobile turns each row into a 2-line card | `/library` |
| Browse-by tiles (course / semester / type) | c01 d05 | `.lib-group` cards with a coloured start-edge | `/library` tabs |
| Recently opened strip | d05 d08 | `.lib-recent` horizontal snap carousel of `.lib-rc` cards | `/library` |
| Folder grid + breadcrumb | h01 | `.lib-folder` cards, `.lib-crumbs` | `/library/folders` |
| Viewer layout: stage + sticky side cards (details, tags, notes, bookmarks) | d09 d12 | `.lib-view` two-column, `.lib-stage` with `.lib-bar` toolbar | `/library/f/:id`, `/library/y/:id` |
| Click-to-load video placeholder | x04 | `.yt-box` dark 16:9 panel + primary pill CTA | YouTube viewer |
| Status banner (folder missing / truncated) | d12 | `.callout.warn.lib-status` | library pages |
| Star / favourite | x03 | **Not adopted** (no use case yet) | — |
| Life KPI card (value + trust tag + coloured start edge) | d01 d03 d07 | `.kpi` in `life.css` — white card, 4px accent edge, trust tag next to every number | `/life/*` |
| Freshness badge + stale / expired banner | d12 (callout) | `FreshBadge`, `.life-alert.warn/.danger` — states: fresh / stale / expired / inconsistent / unavailable | `/life/*` |
| Multi-series line chart (hover tooltip, y-range labels, null breaks the line, hidden data table for screen readers) | d03 d04 d08 | `LineChart` in `life/lifeKit.tsx`, same grid/dash style as `AreaLine`, oldest on the right (RTL) | finance, prayers, body |
| Honest empty-history panel (dashed, explains what is missing and why) | d14 | `.empty-hist` | `/life/finance` balances over time |
| Prayer attendance grid (symbol + colour + sr-only text, never colour alone) | d06 d10 | `.pray-grid` / `.pray-cell` on the heat-0 palette | `/life/prayers` |
| Habit day strip + taper area chart | x05 d06 | `.habit-days` squares (yes / no / unknown dashed) + `AreaLine` | `/life/habits` |
| Routine timeline with live «now» marker | x02 | `.tl` / `.tl-item.now` — vertical timetable, edge colour by block kind | `/life/routine` |
| Command composer: type picker + live JSON preview + confirm dialog | x06 | `.cmd-types`, `.json-pre`, `confirm()` alertdialog — drafts only | `/life/commands` |
| Keyboard-scrollable wide table | h01 | `TblWrap` (`role=region`, `tabIndex=0`) around `.life-tbl` | finance, body, commands, settings |
| «بيانات ناقصة» cards (dashed, hatched when value is null) | x06 d14 | `MissingInputsCards` → `.missing-card.empty`: key + «غير معروف» + Rashed's note + confidence/related badges; value never filled | finance, habits, body, life overview |
| Omitted-ranges disclosure + events table under the balance chart | d14 h01 | `.omit-box` (`<details>`) + `.life-tbl` with date / event / treasury / monthly / daily / total, newest first | `/life/finance` |
| Body highlighter (original SVG, front + back) | d12 d13 | `BodyMap` — hatched/tinted regions with counts, solid coral when selected, click or keyboard chip; no external images | `/sports`, exercise detail, template sessions |
| Muscle / equipment / category filter chips | d14 | `.chip[aria-pressed]` pills with counts, same visual family as Segmented | `/sports` |
| Exercise card (AR title + LTR English subtitle + muscle/equipment badges) | c01 d05 | `.ex-card` grid, whole title is the button | `/sports` |
| Weekly template grid with today marker | x02 d09 | `.week-grid` / `.wk-day.today`, session buttons with kind colour on the inline-start edge | `/sports/templates` |
| «Today's workout» hero + weekly assignment selects | d05 d07 | `.today-card` gradient + `.week-plan` labelled selects | `/sports/mine` |
| Workout editor modal with reorder buttons | x06 | `Modal wide` + `.ed-row` (number inputs, up/down/remove icon buttons — keyboard reorder, no drag) | `/sports/mine` |
| Craving card (3 alternatives per press) | d03 d08 | `.craving` gradient card + `.alt-three`; picked alternatives are preferred | `/life/alternatives` |

| Command palette (Ctrl/Cmd+K): grouped results, pages + commands first | x06 (modal shell) | `shell/Palette.tsx` — combobox/listbox on `Modal` tokens; no direct screenshot reference | everywhere |
| Deadline bell + popover list | x03 x04 (deadline row) | `notify/Bell.tsx` — same row design; week-only (approximate) deadlines never notify | top bar |
| Appearance cards: theme segmented + accent swatches + motion switch | x02 (colour language) | `core/Appearance.tsx`; `--accent-text` keeps contrast in every accent x theme | `/settings` |
| Drag handle for reorder (buttons remain) | x06 | `DragHandle` / `useDragReorder` in `ui/ui.tsx` | `/sports/mine` |
| Glossary term (dotted underline + one-line popover) and glossary page | original, tokens only | `glossary/glossary.tsx`, `pages/Glossary.tsx` | `/life/*`, `/sports/*`, `/life/glossary` |
| Safety badge / safety box / disclaimer note (v6) | d12 (callout) | `SafetyBadge`, `.safety-box`, `SafetyDisclaimer` in `sports/sportsKit.tsx`; only from Rashed's `beginner_safe`, never inferred | `/sports*` |
| Weekly review: confidence-tag badges, 5x7 prayer grid, week strip | d06 d10 (heat matrix) d14 (dashed empty) | `review/kit.tsx`, `review/sections.tsx`, `.rv-*` in `life.css` | `/review` |
| Offline page | d14 (honest empty panel) | `public/offline.html` — shown only when the local server is stopped | PWA shell |

### Which screenshots drove which decisions
- **c01** → Courses page = catalog (facets + results + sort + view toggle).
- **h01** → table pattern, pagination, Library placeholder.
- **d05 d07 d09** → course cards, sidebar, deadline list, black CTA.
- **d06 d10 d12 d13** → hatched capsule bars, heat matrix, dot matrix, gauge, funnel.
- **d02** → Gantt view. **x01** → semester stepper. **x02** → colours + mini calendar + timetable. **x03/x04** → deadline row design. **x05** → dot matrix + shortcut hints. **x06** → modal. **d14** → theme toggle, Sankey, filter chips. **d01/d03/d04/d08** → tiles, sparkline, rings, grouped bars. **d10/d11** → dark theme.

Result screenshots: `/workspace/platform_dist/screens/` (1280 / 390 / 360 px) and side-by-side comparisons in `/workspace/platform_dist/compare/`.

## Chunk 2 additions
- **Ledger table** → dense data table with sticky filter card (Linear-style filters + aria-sort headers); **Routine map** → lane-packed Gantt/timetable strip (d02 Gantt + x02 timetable), overlap = dashed outline; **Insights** → KPI cards with «how computed» disclosure (x05); **Qada plan** → option cards with local selection state (x01 stepper idea).

# MASTER PROMPT — Siro Platform: Full HCI Audit, Information-Architecture Rebuild, and Extensible Work-OS Evolution

> Paste everything below this line into a **new** Claude Code session that has the GitHub repository `Alsakkaf-dev/Siro` attached. It is self-contained: the new session knows nothing else.

---

## 0. Role, mandate, and operating mode

You are a principal-level product engineer who is simultaneously:
- an **HCI researcher** (heuristic evaluation, cognitive walkthrough, GOMS/KLM, Fitts's & Hick's laws, Gestalt, information foraging, mental models, error taxonomy, accessibility),
- an **information architect** (taxonomies, navigation systems, wayfinding, card sorting / tree testing by proxy),
- a **systems architect** (domain modeling, data schemas, migrations, extensibility, plugin systems),
- a **senior full-stack engineer** (TypeScript, React 19, Express 5, SQLite, Vite, Vitest, Playwright),
- a **product designer** who has deeply studied **ClickUp, Monday.com, Asana, Trello, and Jira**.

**Mandate:** Take the existing personal platform ("Siro Platform") and turn it, *without discarding any existing feature or idea*, into a coherent, well-architected, highly usable, extensible "life & study operating system" for a university student, with the structural power of ClickUp/Monday/Asana/Trello/Jira and an interface that never makes the user feel lost.

**Operating mode — non-stop autonomy:**
1. Work **continuously until every acceptance criterion in §12 is met**. Do not stop after an audit, a plan, or a first increment. An audit without implementation is a failure; implementation without verification is a failure.
2. **Do not ask the user questions.** The owner has pre-authorized all work in this repository and its deployment. Make strong, reasoned decisions, record them in the decision log (§10), and continue. Only stop for something that is physically impossible without the owner (e.g. a credential only they can create) — and even then, finish everything else first, then report precisely what is blocked and why.
3. Work in **small, verified, committed increments** (§11). Each increment: implement → typecheck → unit tests → e2e → commit → push. Never leave the repository red.
4. Keep a **living progress file** (`Platform/Platform/docs/REDESIGN_PROGRESS.md`) updated after every increment, so work can resume seamlessly if your context is reset. If you find this file already exists when you start, **read it first and resume from where it stops**.
5. Communicate with the owner **in Arabic** (clear, simple, structured). Code, commit messages, and technical docs may be in English; **all UI text stays Arabic (RTL)**, consistent with the existing product.

---

## 1. The owner's own words (verbatim — the source of truth for intent)

> قد تفعل هذا إذا رأيته مناسبا تفكك بشكل حذر فكريا مفاهيم وكل شيء متعلق بالموقع هذا من طريقة انشائه إلى آخر لأني :
> “أريد تجربة على الموقع بكل شيء فيه تجربه هدفها رصد جميع المشاكل التقنيه وغير التقنيه المتعلقه بالاستخداميه والتي يختصر فيها كل ماهو في علم HCI على الموقع ان يكون قد تم تقييمه من ناحية HCI وفعاليه قصوى من استخدام الموقع بالإضافة لأهم شيء واللذي هو طريقة مسارات هيكلة الموقع من صفحات إلى تبويبات عديده وقوائم ومايجوز في الموقع يجب أخذ العين بالاعتبار انه تم بالعجله ولم يتم بالتخطيط والمنطق والاهم من ذالك ان يسهل على الطالب حياته ليس فقط بما يراه في الموقع بل والأهم صلاحيته وإمكانياته القويه في تعديل وحذف ونشر وإضافة أي أنا أتكلم عن أنظمة متكامله مترابطة لايخلوها عيوب في التشكيل العام للهيكله والأساس في البنيه التحتيه بحيث يسهل للطالب واللذي هو أنا بإدارة جميع أقسام حياته بشكل مسهل وليس معقد ان يقام ترتيب الموقع بشكل منظم وكأنه خريطة مسارات القطارات من الداخل ولكن في الفرونتإند يوجد السهوله وعدم الضياع في الموقع … نقطه اخيره والتي أراها الأكثر اهميه هيه ان الموقع للخيال الواسع اي ان الطالب يمكن ان يقوم باستخدام الموقع باي شيء يريده لديه المميزات الكثيره والموقع يكون قابل للتوسع باي وقت بحيث لايقف عند فقط شيء او عدة أشياء فهو حر بالأخير ولكي اقرب الأشكال المشابهه من المواقع فمثلها الأشهر كليكأب clickUp or Monday.com or Asana or Trello or Jera وأنا هنا لا أقول بس تجيب ريحة هذي التطبيقات بل أقول حرفيا نشرب من حليب هذه المواد لصنع أقوى موقع يمكن في اي يوم ان أقوم أنا بإعطاء اي صديق لي إياه ويقوم بإستخدامه وهذا ليس مهمة اليوم إنما في المستقبل إذا أردت ان اطلب هذا منك بنفسي ولكني لا اطلب إنما أريد ان افهم ما أنى اطلب ان تسمو اليه بترتيب هذي المواد بهيكلتهم وخوارزمياتهم وقوة تنظيمهم وجمالياتها ولكن حذاري ان تتخلى عن هذا الموقع إما تحسين او فلا فالحذف الفكرة او المثيرات الحاليه غير مسموح إنما اعادة تشكيلها بشكل وترتيب ومظهر افضل هو المسموح ”

### 1.1 Intent, decoded into requirements
| # | Owner intent | Engineering requirement |
|---|---|---|
| I1 | Test *everything*; find every technical and non-technical (usability) problem | Exhaustive audit: functional, technical, performance, accessibility, and full HCI evaluation of every page, flow, and state |
| I2 | Evaluate through the whole of HCI; maximum effectiveness of use | Apply the methods in §5; quantify (task steps, clicks, time-on-task estimates via KLM, error opportunities) before and after |
| I3 | **Most important:** the site's structure (pages, tabs, menus) was built in a hurry, not planned | Rebuild the information architecture from first principles (§6); the current IA is presumed flawed until proven otherwise |
| I4 | Not just viewing — strong power to **add, edit, delete, publish** everywhere | Universal CRUD + publish/share semantics across all domains, with undo, bulk actions, and history (§7) |
| I5 | Integrated, interconnected systems with no flaws in the foundation | One coherent domain model and relation graph underneath all sections; no dead ends, no isolated islands (§7) |
| I6 | Internally organized like a **train/metro map**; externally effortless, never lost | Explicit IA "line map": domains = lines, pages = stations, interchanges = cross-links; plus wayfinding UI (breadcrumbs, "you are here", global search, consistent placement) (§6) |
| I7 | **Most important:** "wide imagination" — usable for anything; extensible any time; not limited to a few things | Generic, user-definable building blocks: custom item types, custom fields, custom views, templates, automations — a Work-OS core (§8) |
| I8 | "Drink the milk" of ClickUp / Monday / Asana / Trello / Jira — their structure, algorithms, organization, aesthetics | Deliberate pattern extraction and adaptation from each product (§4) — not imitation, but their proven mechanics |
| I9 | Future: give it to a friend to use | Architect for multi-user/multi-workspace readiness **now** (data scoping, no hard-coded owner assumptions), but do not ship accounts unless trivial (§8.6) |
| I10 | **Never abandon or delete** existing ideas or features — only reshape, reorganize, and improve | Hard constraint (§2). Every existing feature must survive, mapped into the new structure, with a traceability matrix proving it |

---

## 2. Hard constraints (non-negotiable)

1. **No feature or idea may be removed.** Everything that exists today must exist after, possibly renamed, relocated, merged, or redesigned. Produce and maintain `docs/FEATURE_TRACEABILITY.md`: every current route, page, widget, API endpoint, and capability → its new home. A feature with no new home blocks completion.
2. **No user data may be lost.** All schema changes go through numbered migrations in `server/schema.ts` (append-only `MIGRATIONS` array). Take a backup before any destructive transform. Write migration tests on a copy of the real seeded DB. Existing semester packages, library items, life data, sports workouts, tags, notes, bookmarks, and progress must survive.
3. **Never stop the existing deployment from working.** The production site must stay green after every deploy.
4. **Git identity & attribution:** Every commit and push must be authored solely as the owner:
   `git config user.name "MOHAMMED MOHSEN MOHAMMED AL-SAKKAF"` and
   `git config user.email "185142686+Alsakkaf-dev@users.noreply.github.com"`.
   **Never** add `Co-Authored-By`, "Generated with Claude", or any AI attribution to commits, PR titles, or PR bodies. Set this config before your first commit.
5. **`node_modules/` and `dist/` are committed in this repo and contain Windows-native binaries** (the owner runs it on Windows via `start.bat`). **Never commit changes to `Platform/Platform/node_modules/` or `Platform/Platform/dist/`.** If your local install/build modifies them, restore with `git checkout -- Platform/Platform/node_modules Platform/Platform/dist && git clean -fdq Platform/Platform/dist` before committing. Stage files explicitly by path. If you must add a dependency, prefer zero new dependencies; if unavoidable, document it (the Windows launcher auto-installs on next start).
6. **Local tools:** in this container `.bin` shims may lack exec permission; run tools via node, e.g. `node node_modules/typescript/bin/tsc -p tsconfig.server.json --noEmit`, `node node_modules/vitest/vitest.mjs run`, `node node_modules/vite/bin/vite.js build`.
7. **RTL Arabic UI**, the existing "no guessing / غير معروف" data-honesty principle (unknown ≠ 0, every number tagged with its confidence: مثبت / محسوب / افتراض), local-first privacy, and read-only treatment of external sources (the system's exports, library folders) are product values. Preserve them.
8. Keep both runtimes working: **PC mode** (`start.bat` → `node server`, 127.0.0.1:4310) and **online mode** (Vercel).

---

## 3. System context you are inheriting (orient yourself fast, then verify everything yourself)

### 3.1 Repository
- GitHub: `Alsakkaf-dev/Siro` (public). Work branch: create or continue a branch named `redesign/hci-work-os` from the latest of `claude/great-newton-p1ds60` (if merged, from `main`). Open a **draft PR** for it.
- The app lives in **`Platform/Platform/`**. The rest of the repo is the owner's university archive (≈2.8 GB, `Bachelor in Software Engineering/…`) — do not reorganize or delete it.
- the system's (a companion agent's) read-only life exports: `Platform/seed/` (finance, prayers, habits, body, routine, ledger, docs JSON).

### 3.2 Stack
- **Server:** Node ≥ 22, Express 5, SQLite via `better-sqlite3` with fallback to built-in `node:sqlite` (`server/db.ts`), zod validation (`shared/validation.ts`), migrations in `server/schema.ts`.
- **Web:** React 19 + react-router 7 + Vite 8, plain CSS design tokens (`web/src/styles/*.css`), Arabic RTL, lazy routes in `web/src/App.tsx`, shell/nav in `web/src/shell/*`, plugin-style nav registry in `web/src/core/plugins.config.tsx`, command palette `web/src/shell/Palette.tsx`.
- **Tests:** Vitest (`tests/*.test.ts`, ~182 tests, both DB drivers), smoke script `scripts/smoke.mjs`, Playwright available globally (`require('playwright')`, `chromium.launch()`).
- **Build:** `npm run build` (server tsc + vite + inline-html + pdfjs copy + precompress + build stamp).

### 3.3 Current product surface (all of it must survive)
Map these by reading the code; this list is a starting point, not exhaustive:
- **Academic (الفصول):** semester manager, per-semester dashboard (current week, upcoming deadlines, busiest weeks), courses catalog (cards/list/table + filters), course page (assessments, CLOs, notes), timeline heatmap, grade calculator (targets 50/60/70/80), weights map, unknowns list, print summary, official results (`acad_results`), semester import.
- **Semester Packages (حزم الفصول):** `docs/SEMESTER_PACKAGE_SPEC.md`, `shared/package.ts` (checker), `server/package.ts` + `/api/packages` (preview/apply from Drive listing link, uploaded listing, public Drive folder with API key, or local folder), page `/academic/import`. SEM-1…SEM-5 already archived on the owner's Google Drive in `Siro Semesters/SEM-N` (2,858 files) with listings in `Siro Semesters/_index/SEM-N.listing.json`.
- **Library (المكتبة):** file index (local folder scan, Drive-hosted package files, YouTube links), previews (PDF viewer with page resume/bookmarks, docx, images, text, audio/video with resume, Drive iframe), tags, notes, progress, done, recent, folders tree, facets (kind/semester/course/type/tag), settings.
- **Life (الحياة):** overview, finance (balances, history chart, daily spend, insights), full ledger, prayers & qada plan (scenario choice), habits & alternatives ("ماذا أسوي الحين؟"), routine & weekly routine map, body/weight, commands (draft-only commands to the system), glossary, settings, freshness/staleness banners.
- **Sports (الرياضة):** exercise library (81 exercises, body map front/back, filters), weekly templates, "my workouts" builder + weekday assignment, today's workout card, safety notes.
- **Weekly review (مراجعة الأسبوع):** spec-driven Sun–Sat review across prayer/habits/weight/money/routine with "what's missing".
- **Global:** home dashboard, global search + command palette, notifications bell, appearance (theme/accent/motion), backups (daily auto + manual + restore), export/import JSON, offline/PWA, keyboard shortcuts.

### 3.4 Online deployment (keep it working)
- Vercel team `alsakkaf-devs-projects` (`team_fl2HZTn4aLm2loXA9aTnw6Od`), project **`siro-platform`** (`prj_MqjukCuAGhjVuEzUC7JyvASQdTxv`), region `sin1`, Node 24. Production URL: **https://siro-platform.vercel.app**.
- Vercel deploys **only** the branch **`deploy/platform`**, a slim snapshot built by `bash Platform/Platform/scripts/deploy-branch.sh --push` (git plumbing; ~2 s; contains the app + `seed`, excludes node_modules/dist/data/backups). Other branches are skipped by the project's Ignored Build Step. After pushing the deploy branch, trigger production with the Vercel connector `create_deployment` (gitSource `github`, org `Alsakkaf-dev`, repo `Siro`, ref `deploy/platform`, target `production`) and verify with `web_fetch_vercel_url` (this container's network cannot reach `*.vercel.app` or `drive.google.com` directly).
- Runtime: `api/index.mjs` → `server/online.ts` (`PLATFORM_ONLINE=1`): SQLite in `/tmp`, restored from / saved to a **private Vercel Blob** store when `BLOB_READ_WRITE_TOKEN` exists (the owner may not have created it yet — if absent, edits are ephemeral; never assume it exists; check project env), packages auto-imported on cold start from env `PLATFORM_PACKAGE_LISTINGS` (Drive file ids). Online mode accepts any Host but requires same-host Origin.
- Google Drive is reachable through the **Composio** connector (account `mohammed.alsakkaaf@gmail.com`, folder `Siro Semesters` id `1jvePBsCM5uLHntbBBCNqfuLa8b7RXkQ5`, shared "anyone with link → viewer"). Bulk Drive work must run inside the Composio remote workbench in chunks < 50 s per call (the MCP call times out at 60 s).

---

## 4. Competitive teardown: "drink the milk" of ClickUp, Monday, Asana, Trello, Jira

Produce `docs/research/COMPETITIVE_TEARDOWN.md`. For each product, extract **mechanisms**, not looks. At minimum analyze and decide adoption for:

| Product | Mechanisms to study and adapt |
|---|---|
| **ClickUp** | Hierarchy *Workspace → Space → Folder → List → Task → Subtask → Checklist*; custom statuses per list; custom fields; multiple views over the same data (List, Board, Calendar, Gantt/Timeline, Table, Doc, Dashboard); "Everything" view; command center/quick switcher; templates for any level; relationships & dependencies; recurring tasks; reminders; inbox/notifications; dashboards built from widgets. |
| **Monday.com** | Boards as typed tables; column types as a type system (status, date, timeline, people, numbers, formula, link-to-board, mirror); groups within boards; automation recipes "When X, then Y"; dashboards aggregating multiple boards; color-coded status semantics; item updates feed. |
| **Asana** | Clear task ownership; My Tasks (personal triage: Recently assigned / Today / Upcoming / Later); projects in list/board/timeline/calendar; sections; portfolios & goals (outcome tracking); rules; forms that create tasks; inbox as a single triage queue. |
| **Trello** | The Kanban card mental model (lowest cognitive load); drag-and-drop everywhere; card back with checklists/attachments/labels/due dates; Power-Ups as an extension model; Butler automation; card covers & visual scannability. |
| **Jira** | Issue types with schemes; workflows as state machines with transitions & validators; JQL-style powerful filtering/saved filters; epics → stories → subtasks; sprints/iterations; backlog grooming; boards derived from saved filters; issue linking types. |

For every mechanism record: what problem it solves, the cognitive/HCI rationale, whether Siro needs it (now / later / never) and how it maps onto Siro's domains (study, library, life, sports, review). The goal is a **synthesis**: one coherent model, not five bolted-on clones.

---

## 5. Phase A — Deconstruct and audit everything (evidence first)

Before redesigning, build a complete, evidence-backed understanding. Deliverable: `docs/audit/` folder.

### 5.1 System deconstruction (`docs/audit/SYSTEM_MAP.md`)
- Inventory every route (from `web/src/App.tsx`), every nav entry (`plugins.config.tsx`, `Shell.tsx`, sidebar, top tabs), every page's sections/widgets/actions, every API endpoint (`server/*Routes.ts`, `routes.ts`), every DB table & relation (`schema.ts`), every shared model (`shared/*.ts`), every data source (seed, packages, Drive, local folders, the system exports).
- Produce: route tree, navigation graph (which page links to which), data model ERD (as Mermaid), and a **CRUD matrix**: for every entity × {Create, Read, Update, Delete, Bulk, Undo, Share/Publish, Import, Export}, where it is possible in the UI today (page/control) or "missing".

### 5.2 Exhaustive functional & technical test
- Run the app locally (PC mode with real data: `PLATFORM_LIBRARY_ROOT` = the repo's `Bachelor in Software Engineering`, `PLATFORM_LIFE_ROOT` = `Platform/seed`) and online (via Vercel fetch).
- Write a Playwright crawler + interaction suite (keep it in `scripts/e2e/`): every route × widths 1280 / 768 / 390, light & dark, every button/menu/tab/form clicked, every empty/loading/error state forced, console errors, failed requests, horizontal overflow, focus traps, keyboard-only traversal, screenshots.
- Run axe-core (inject from npm `axe-core`) on every page; Lighthouse-equivalent metrics where possible.
- Record every defect in `docs/audit/ISSUES.md` with: id, severity (S0 blocker … S3 cosmetic), category (functional/technical/performance/a11y/HCI/IA/content), reproduction, evidence (screenshot path), affected requirement (I1–I10).

### 5.3 HCI evaluation (`docs/audit/HCI_EVALUATION.md`)
Apply all of the following, systematically, page by page and flow by flow:
1. **Nielsen's 10 heuristics** — each violation logged with a severity rating 0–4.
2. **Cognitive walkthrough** for at least these top tasks (write each as steps, then ask the four CW questions per step):
   - "What do I have due this week across all courses?"
   - "Add a new assessment and see its effect on my grade target."
   - "Find last semester's lecture slides for course X and resume where I stopped."
   - "Log/see today's prayers, habits, workout, and money in one place."
   - "Start a new semester (SEM-6) from scratch and later archive it to Drive as a package."
   - "Create something new that the site wasn't designed for (e.g., a reading list, a job-application tracker)."
   - "Undo a mistaken delete."
3. **KLM-GOMS** time estimates and click counts for the top tasks (before/after table).
4. **Fitts's law** (target sizes/distances, especially mobile 390px), **Hick's law** (menu breadth/depth, number of choices per screen), **Miller/cognitive load** (chunking), **Gestalt** (grouping, proximity, similarity), **visual hierarchy & scanning patterns** (RTL F/Z patterns).
5. **Information scent & foraging** — are labels predictive? Arabic terminology consistency (one concept = one word).
6. **Wayfinding** — can the user always answer: Where am I? Where can I go? How do I get back? What happened?
7. **Error prevention & recovery** — destructive actions, confirmations, undo coverage, validation messages.
8. **Consistency & standards** — same action looks/behaves the same everywhere (buttons, kebab menus, forms, modals, toasts, empty states).
9. **Accessibility (WCAG 2.2 AA)** — contrast, focus visible, target size ≥ 24px (44px mobile), labels, roles, live regions, reduced motion, RTL correctness, screen-reader names in Arabic.
10. **Responsiveness & offline** — mobile first-class, PWA behavior.
11. **Emotional & motivational design** for a student (progress feedback, streaks without guilt, calm tone), aligned with the existing "no guessing" honesty principle.

### 5.4 IA diagnosis (`docs/audit/IA_DIAGNOSIS.md`)
- Card-sort by proxy: cluster all current objects/pages by the user's mental model (student life domains and time horizons: today / this week / this semester / archive).
- Tree-test by proxy: for each top task, trace the path a first-time user would take through current nav; mark failures and detours.
- Identify: duplicated entry points, orphans, dead ends, mixed metaphors, inconsistent depth, tabs that should be views, pages that should be filters, settings scattered across sections.

**Gate A:** Do not start Phase C implementation until §5 deliverables exist. But do not over-polish documents; they serve the build.

---

## 6. Phase B — The new information architecture: the "metro map"

Deliverable: `docs/design/IA_METRO_MAP.md` (with Mermaid diagrams) + `docs/design/NAVIGATION_SPEC.md`.

### 6.1 Principles
- **Inside like a train network, outside effortless.** Domains are **lines**; pages are **stations**; cross-domain links are **interchanges**; the home is the **central station**. Every station shows its line color, its position, and its interchanges.
- **Few top-level choices** (≤ 7), **shallow depth** (≤ 3 levels to any object), **consistent placement** of global tools (search/palette, create (+), inbox/notifications, settings, profile/workspace switcher).
- **Separate "where" from "how to look":** places (spaces/lists) vs **views** (list, board, calendar, timeline, table, dashboard). Many current pages are really *views of the same data* — collapse them into one place with a view switcher, without losing any page's unique capability.
- **Time horizons as first-class navigation:** Today · This week · This semester · Archive — mirroring Asana's My Tasks triage, so the student's daily question "what now?" is one click away.
- **One global "Create" (+)** that can create any item type anywhere, with smart defaults from context.
- **Global search & command palette** reaches every object, page, view, and action (verbs, not just nouns).
- **Breadcrumbs + "you are here" line indicator** on every page; back always works; deep links stable and shareable.

### 6.2 Proposed top-level structure (refine it from your audit; justify every deviation)
1. **الرئيسية / Home (central station):** personal dashboard — Today (due items, today's workout, prayer/habit check-ins, money snapshot), This week, alerts (stale data, unknowns), quick capture.
2. **الدراسة / Study line:** Semesters (current + archive) → Courses → Assessments/Items; views: list, board (by status), calendar, timeline/heatmap, weights, grade calculator, unknowns; semester packages import/export.
3. **المكتبة / Library line:** all files/links/videos as items; views by course/semester/type/folder/recent; previews; reading/watching progress; collections.
4. **الحياة / Life line:** finance, prayers & qada, habits & alternatives, routine & map, body — each a space with its own views; the system's data clearly marked as external read-only sources.
5. **الرياضة / Sports line:** exercise library, templates, my workouts, weekly plan.
6. **مساحاتي / My Spaces (the "wide imagination" line):** user-created spaces of any custom type (reading list, job applications, projects, goals, anything) built from the Work-OS core (§8).
7. **المراجعة / Review & Insights:** weekly review, dashboards, goals/OKR-style progress.
Plus global: Search/Palette, Create (+), Inbox/Notifications, Settings & Data (backups, import/export, appearance, sources, packages).

### 6.3 Required artifacts
- Full route map old → new (with redirects so every old URL still works).
- Navigation component spec (sidebar per line, top line switcher, mobile bottom bar, breadcrumbs, view switcher, page header actions, kebab menus).
- Interaction patterns library (create, edit inline, bulk select, drag & drop, filters/sort/group, saved views, undo toast, confirmation policy, empty/loading/error states).
- Arabic terminology glossary for the UI (one concept = one term), aligned with the existing glossary page.

---

## 7. Phase B — Integrated systems: universal CRUD, relations, and publishing

Deliverable: `docs/design/DOMAIN_MODEL.md` + ADRs.

1. **Unified item model** (without breaking existing tables): introduce a generic core — *Workspace → Space → List/Collection → Item → Subitem/Checklist* — with typed items (assessment, course, file, note, habit-log, transaction, workout, custom…) that **wrap or reference existing domain tables via adapters**, so current features keep their specialized logic while gaining generic powers (tags, comments/notes, attachments, relations, status, due dates, custom fields, history).
2. **Relations graph:** any item can link to any item with typed relations (belongs-to, relates-to, blocks/blocked-by, derived-from, attachment-of). E.g., an assessment links to library files, a study session, a calendar slot, and a goal. Show backlinks everywhere ("مرتبط بـ").
3. **Universal CRUD** on every user-owned entity: create, inline edit, duplicate, move, archive, delete with **undo** (extend the existing undo-token pattern), **bulk actions**, and **activity history**. External read-only sources (the system exports, scanned files) stay read-only but can be *annotated* and *linked*.
4. **Publish/share semantics:** export any space/list/view as JSON/CSV/printable page; generate a read-only public link (online mode) for a view; semester packages remain the canonical archive/publish format for study data (keep `SEMESTER_PACKAGE_SPEC.md` compatible; extend, never break, v1).
5. **Statuses & workflows** (Jira/ClickUp): per-list custom statuses with optional transition rules; assessments' existing statuses map onto this.
6. **Data integrity:** every new capability has zod validation, server-side authorization hooks (single-user now, multi-user-ready), and tests.

---

## 8. Phase B/C — "Wide imagination": the extensible Work-OS core

Deliverable: `docs/design/EXTENSIBILITY.md` + implementation.

1. **Custom item types** defined by the user (name, icon, color, fields, default statuses, default views).
2. **Custom fields** type system (Monday-style): text, long text, number, currency, date, date range, status, select/multi-select, checkbox, rating, progress, URL, file/library link, relation, rollup/formula (safe expression evaluator, no `eval`), person (future multi-user).
3. **Views engine:** List, Board (group by any select/status field), Table (sortable/filterable/inline editable), Calendar, Timeline/Gantt, Gallery, Dashboard (widgets: counts, charts, progress, lists) — each savable with filters/sort/group, pinned per space. Existing specialized pages (heatmap timeline, weights map, grade calculator, body map, routine map, ledger) become **specialized view types** registered in the same view registry — kept intact, now reachable consistently.
4. **Templates:** for spaces, lists, items (e.g., "New semester", "Course", "Reading list", "Job hunt", "Project"), including the semester-package import as a template source.
5. **Automations (lightweight, local, safe):** "When <trigger> then <action>" (e.g., when status → done, set completion date; when due date is tomorrow, notify; recurring items). Deterministic, logged, and undoable.
6. **Plugin/extension contract:** formalize and extend the existing `web/src/core/plugin.ts` registry so new domains/views/field types can be added as modules without touching the shell. Document how a future feature plugs in.
7. **Multi-user readiness (do not over-build):** scope all new tables by `workspace_id` (single default workspace now), no hard-coded owner names in logic, a clean seam where authentication would attach. Do **not** ship accounts unless it falls out trivially; record the plan in an ADR.

---

## 9. Phase C — Design system & aesthetics

- Audit `web/src/styles/tokens.css` and components; produce `docs/design/DESIGN_SYSTEM.md`: color roles (per line/domain colors that form the metro map), type scale for Arabic (Cairo / IBM Plex Sans Arabic already bundled), spacing, radii, elevation, motion (respect reduced-motion), density modes (comfortable/compact), dark mode parity, status color semantics consistent across all views.
- Build/normalize primitives: Button, IconButton, Menu/Kebab, Tabs vs ViewSwitcher (distinct roles), Table, Board column/card, Calendar cell, Field editors per field type, Modal/Drawer (side panel for item details like ClickUp/Jira), Toast with undo, EmptyState, Skeleton, Breadcrumbs, Badge/Status pill.
- Aesthetic bar: calm, modern, legible, scannable; information-dense where useful (tables) and spacious where focus matters (today view). Every screen must pass a 5-second test: purpose, current location, primary action are obvious.

---

## 10. Decision-making & documentation discipline

- **ADRs** in `docs/adr/NNNN-title.md` for every significant decision (context, options, decision, consequences). Minimum: IA structure, item model & adapters, views engine, custom fields storage (EAV vs JSON columns — justify), automation engine, routing/redirect strategy, multi-user seam, online persistence.
- **Decision log** section in `REDESIGN_PROGRESS.md` for smaller calls.
- When two options are close, choose the one that (1) preserves existing features and data with least risk, (2) reduces user cognitive load, (3) maximizes future extensibility — in that order.

---

## 11. Execution plan — increments, verification, delivery

Work in this order, each as one or more small commits on `redesign/hci-work-os` (draft PR open from the first commit):

1. **Bootstrap:** set git identity (§2.4); install; typecheck; run full test suite; record baseline (tests, bundle sizes, Lighthouse-ish metrics, crawl results) in `REDESIGN_PROGRESS.md`.
2. **Phase A audit** deliverables (§5) + competitive teardown (§4).
3. **Phase B designs** (§6–§9) + ADRs + traceability matrix skeleton.
4. **Foundation:** migrations for the generic core (workspace/space/list/item/fields/relations/views/history), adapters for existing domains, API endpoints with zod + tests. Zero UI change yet; all old tests still pass.
5. **Shell & navigation rebuild:** metro-map IA, line switcher, sidebars, breadcrumbs, global Create (+), upgraded palette (verbs), mobile bottom bar, redirects for every old URL. All existing pages reachable.
6. **Views engine** + migrate existing pages into it (one domain at a time: Study → Library → Life → Sports → Review), keeping specialized views.
7. **Universal CRUD** (inline edit, bulk, undo everywhere, history, relations UI, item side panel).
8. **Custom types/fields/templates** ("My Spaces"), then **automations**.
9. **Design system pass** + accessibility fixes + responsive polish + dark mode parity.
10. **Re-audit:** rerun the full crawler, axe, cognitive walkthroughs and KLM; produce before/after tables; fix regressions.
11. **Deploy:** run `deploy-branch.sh --push`, trigger production on Vercel, verify every key route and API online, and verify cold-start + (if Blob token exists) persistence across a redeploy.
12. **Final report to the owner in Arabic** (§13).

**Verification gates for every increment (no exceptions):**
- `tsc` server + web + root clean; full Vitest green on both DB drivers; new code has tests (unit + API).
- Playwright e2e for touched flows at 1280 and 390; zero console errors, zero failed requests, zero horizontal overflow; axe: zero serious/critical.
- Migration tests against a copy of the real DB; old data intact; old URLs redirect.
- Commit (owner identity, no AI attribution), push, update `REDESIGN_PROGRESS.md`.

---

## 12. Acceptance criteria (you are done only when ALL are true)

1. Every existing feature, page, endpoint, and data entity appears in `FEATURE_TRACEABILITY.md` with a working new home — **zero removals**.
2. Every old URL resolves (redirect or same page). No data loss (verified by migration tests and a real-data before/after count of every table).
3. The new IA has ≤ 7 top-level lines, any object reachable in ≤ 3 navigation levels, breadcrumbs everywhere, a global Create, and a palette that reaches every object, view, and action.
4. Universal CRUD + undo + bulk actions exist for every user-owned entity; relations/backlinks work across domains.
5. Users can create a brand-new custom space type (with custom fields, statuses, views, a template, and at least one automation) entirely from the UI, without code — demonstrated by e2e tests creating e.g. "Reading list" and "Job applications".
6. Views engine provides at least List, Board, Table, Calendar, and Dashboard over generic items, plus all existing specialized views registered in it.
7. The HCI re-audit shows measurable improvement for every top task (fewer steps/clicks, lower KLM time) and all Nielsen violations of severity ≥ 3 resolved; WCAG 2.2 AA issues resolved (axe zero serious/critical on all pages).
8. All tests green (unit, API, migration, e2e at 1280/390, light/dark); production deployment green and verified online.
9. Documents complete: audit (`docs/audit/*`), teardown, IA metro map, navigation spec, domain model, extensibility, design system, ADRs, progress log, traceability.
10. PC mode (`start.bat`) unaffected: `node server` still builds and runs locally with real data.

---

## 13. Final report to the owner (in Arabic)

When everything above is done, write to the owner, in simple Arabic, with sections:
- ما الذي وجدته (أهم المشاكل، مرقّمة حسب الخطورة، مع أمثلة).
- كيف أصبح ترتيب الموقع الآن (خريطة الخطوط والمحطات بصورة مبسطة).
- ما الجديد الذي تستطيع فعله (الإنشاء/التعديل/الحذف/النشر، المساحات المخصصة، القوالب، الأتمتة، العروض).
- ما الذي بقي كما هو وأين انتقل كل شيء (رابط ملف التتبع).
- ما يحتاج منك أنت (إن وُجد) وخطوات واضحة.
- الروابط: الموقع، الـ PR، المستندات.

---

## 14. Final instruction

Begin now with §11 step 1. Do not ask for confirmation. Do not stop until §12 is fully satisfied. If your context is ever reset, open `Platform/Platform/docs/REDESIGN_PROGRESS.md`, read the decision log and the next unchecked step, and continue from there.

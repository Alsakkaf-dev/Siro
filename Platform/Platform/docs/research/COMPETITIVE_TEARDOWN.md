# Competitive teardown — "drinking the milk" of ClickUp, Monday, Asana, Trello, Jira

Goal: extract **mechanisms** (the structural ideas that make these tools powerful and learnable), judge each against Siro's user (one university student today, a friend tomorrow), and synthesize **one** model — not five clones.

Legend — *Adopt*: **now** (built in this redesign) · **later** (seam exists, not built) · **never** (rejected, with reason).

## 1. ClickUp

| Mechanism | Problem it solves | HCI rationale | Siro decision | Mapping in Siro |
|---|---|---|---|---|
| Hierarchy Workspace → Space → Folder → List → Task → Subtask → Checklist | One container model for any kind of work | A *single* recursive mental model; users learn it once (consistency, recognition over recall) | **now (flattened)**: Workspace → Space → Item → Sub-item + checklist field. Folder/List collapsed into "Space + saved views" | `wos_workspaces`, `wos_spaces`, `wos_items.parent_id`; checklist = field type `checklist` |
| Custom statuses per list | Every workflow has different stages | Statuses are the vocabulary of progress; forcing a fixed one causes misfit and workaround | **now** | `wos_types.statuses` (per type) with color + category (todo/active/done) |
| Custom fields | Capture domain data without code | Recognition: data lives in labeled slots rather than free text | **now** | Field type system (§ EXTENSIBILITY) |
| Many views over the same data (List/Board/Calendar/Gantt/Table/Doc/Dashboard) | Different questions need different shapes | Separates *where data lives* from *how to look* — reduces duplicate pages | **now** List, Board, Table, Calendar, Timeline, Gallery, Dashboard; Doc = item long-text field | `web/src/views/*` registry; saved views in `wos_views` |
| "Everything" view | Cross-space overview | Information foraging: one patch with all scent | **now** | `/everything` — all generic items + academic assessments via adapters |
| Command center / quick switcher | Fast navigation for experts | Accelerators for frequent users (Nielsen #7) | **now** (already existed; upgraded with verbs) | Palette with "أنشئ…/افتح…/نفّذ…" |
| Templates at any level | Reuse structure | Reduces blank-page anxiety; recognition | **now** | Built-in + user "save as template" |
| Relationships & dependencies | Work is connected | Backlinks make the graph navigable | **now** relations (typed) incl. blocks/blocked-by | `wos_relations` across *any* ref (`acad:assessment:…`, `lib:f:…`, `wos:item:…`) |
| Recurring tasks, reminders | Repeated chores | Offloads memory (externalized cognition) | **now** via automation `recurring` + due-tomorrow notification | automations engine |
| Inbox / notifications | One triage queue | A single place to check removes anxiety of "did I miss something" | **now** | `/inbox` merges deadline bell + automation notices |
| Dashboards from widgets | Executive summary | Glanceability | **now** (Dashboard view: counts/progress/by-status/list widgets) | Dashboard view type |
| Docs, whiteboards, chat, time tracking, goals as separate apps | Breadth | ClickUp's main *failure*: feature sprawl → high cognitive load | **never as separate apps**. Goals = template of a custom type | Templates "أهداف" |

## 2. Monday.com

| Mechanism | Problem | Rationale | Decision | Mapping |
|---|---|---|---|---|
| Boards as typed tables | Structured tracking anybody can design | Spreadsheet familiarity lowers learning cost | **now** | Table view with inline editing per field type |
| Column types as a type system (status, date, timeline, people, numbers, formula, link-to-board, mirror) | Typed data enables validation, aggregation, formatting | Prevents errors (Nielsen #5), consistent editors | **now**: text, long text, number, currency, date, date range, status, select, multi-select, checkbox, rating, progress, URL, library link, relation, rollup, formula; person = **later** | `shared/wos.ts` field registry |
| Groups within boards | Visual chunking | Gestalt proximity/common region; Miller chunking | **now** as "group by" any select/status field in List/Table/Board | view config `groupBy` |
| Automation recipes "When X, then Y" | Remove repetitive manual steps | Recipes are sentence-shaped → readable by non-programmers | **now** with sentence UI («عندما … ثم …») | `wos_automations` |
| Dashboards aggregating boards | Cross-board KPIs | — | **now** (Dashboard view can target "all spaces") | `/everything?view=dashboard` |
| Color-coded status semantics | Instant scanning | Pre-attentive processing of color | **now**: status category → fixed semantic color (todo gray, active blue/accent, done green, blocked red) used everywhere | `.status-pill` tokens |
| Item updates feed | Context of change | Visibility of system status | **now** per item "النشاط" from `wos_history` | Item panel tab |

## 3. Asana

| Mechanism | Problem | Rationale | Decision | Mapping |
|---|---|---|---|---|
| Clear ownership (assignee) | Accountability in teams | — | **later** (single user now; `person` field seam) | ADR-0007 |
| **My Tasks triage: Recently assigned / Today / Upcoming / Later** | "What do I do now?" | Time-horizon chunking matches how people plan | **now** — the core of Home | `/` Today, `/week`, horizon tabs on "كل شيء" |
| Projects in list/board/timeline/calendar | Same as ClickUp views | — | **now** | Views engine |
| Sections | Ordered chunks inside a list | — | **now** = group by + manual sort | `sort` column |
| Portfolios & goals | Outcome tracking above projects | Motivation: progress toward a meaningful outcome | **now (template)** "أهداف" type with progress + rollup from linked items | template `goals` |
| Rules | Automation | — | **now** (same engine) | |
| Forms that create tasks | Structured capture | Reduces input errors | **now (light)**: quick-capture form generated from type fields | Create (+) dialog renders type fields |
| Inbox as single triage queue | — | — | **now** | `/inbox` |

## 4. Trello

| Mechanism | Problem | Rationale | Decision | Mapping |
|---|---|---|---|---|
| Kanban card mental model | Lowest cognitive load for flow work | Spatial metaphor, direct manipulation | **now** Board view (group by status/select) | `BoardView` |
| Drag-and-drop everywhere | Direct manipulation | Fitts-friendly, immediate feedback | **now** board card drag between columns (+ keyboard alternative: status menu on card) | pointer + keyboard |
| Card back: checklists, attachments, labels, due dates | Rich detail without leaving context | Progressive disclosure | **now** item side panel (drawer) | `ItemPanel` |
| Power-Ups as extension model | Optional features without bloat | Keeps core simple | **now** — plugin contract v2 (lines, views, field types register themselves) | `web/src/core/plugin.ts` |
| Butler automation | — | — | **now** (same engine) | |
| Card covers & visual scannability | Recognition | — | **now** Gallery view uses type color/icon + first URL/library preview | `GalleryView` |

## 5. Jira

| Mechanism | Problem | Rationale | Decision | Mapping |
|---|---|---|---|---|
| Issue types with schemes | Different kinds of work in one system | Type determines fields → consistent forms | **now** = custom item types | `wos_types` |
| Workflows as state machines with transitions & validators | Enforce process | Error prevention | **now (optional)**: per-type `transitions` map; empty = free movement (default, low friction) | `statuses[].next` |
| JQL-style filtering, saved filters | Power search | Experts' accelerator | **now (structured, not a language)**: filter builder (field/op/value) + saved views; free-text search | view `filters` |
| Epics → stories → subtasks | Hierarchy of work | — | **now** = parent/sub-items; semester → course → assessment is Siro's natural "epic" chain | `parent_id`, academic adapters |
| Sprints / iterations | Time-boxing | — | **now (natural fit)** = the academic *week*; "This week" horizon. Formal sprints **never** (overkill for one student) | `/week` |
| Backlog grooming | Prioritization | — | **now (light)**: priority field + "Later" horizon | |
| Boards derived from saved filters | Views are queries | Decouples data from presentation | **now** — every view is a saved query | `wos_views.config` |
| Issue linking types | Typed relations | — | **now** | relation kinds: `relates`, `blocks`, `blocked_by`, `belongs_to`, `derived_from`, `attachment_of` |

## 6. Synthesis — the Siro model

```
Workspace (one now; workspace_id on every new row)
 └─ Line (navigation domain: Home · Study · Library · Life · Sports · My Spaces · Review)
     ├─ built-in domains keep their specialized tables + logic  ──┐
     └─ Space (user-created, of an Item Type)                     │ adapters expose both as "items"
          └─ Item ── fields (typed) ── status ── due ── sub-items │ (ref = "<domain>:<kind>:<id>")
                 └─ relations ⇄ any ref (backlinks everywhere) ◄──┘
Views = saved queries over items (List/Board/Table/Calendar/Timeline/Gallery/Dashboard + specialized)
Automations = When(trigger) → Then(action), logged in history, undoable
Templates = serialized Type + Space + Views + Automations (+ sample items)
```

Principles taken from the five, in priority order:
1. **One recursive mental model** (ClickUp) — but **shallow** (Trello): at most Space → Item → Sub-item.
2. **Views are queries** (Jira) presented as **tabs of the same place** (ClickUp/Asana) — never separate pages for the same data.
3. **Typed fields** (Monday) power validation, editors, filters, aggregations from one registry.
4. **Time horizons first** (Asana My Tasks) — Home answers "what now?" in one glance.
5. **Direct manipulation + keyboard parity** (Trello + Jira power users).
6. **Recipes in sentences** (Monday/Butler) for automations.
7. **Avoid ClickUp sprawl**: every new capability lives inside the existing model, never a new "app".

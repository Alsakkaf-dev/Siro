# DOMAIN_MODEL — unified item model, relations, CRUD, publish

## 1. Layers

```
┌──────────────────────── Work-OS core (migration 5, tables wos_*) ────────────────────────┐
│ workspace ─< type (fields, statuses) ─< space ─< item ─< sub-item                          │
│ views (saved queries) · relations (ref ⇄ ref) · history · trash · automations · inbox ·   │
│ shares · user templates                                                                   │
└───────────────▲──────────────────────────────────────────────▲────────────────────────────┘
                │ adapters (server/wos/adapters.ts)            │ refs
┌───────────────┴───────────┐ ┌──────────────┐ ┌──────────────┴─┐ ┌────────────────────────┐
│ academic acad_* (own logic)│ │ library lib_* │ │ sports spt_*    │ │ life: Rashed files (RO) │
└────────────────────────────┘ └──────────────┘ └────────────────┘ └────────────────────────┘
```

Existing domain tables are **not** migrated into `wos_items` (zero data risk, specialized logic intact). Adapters expose them as *items* where generic powers are needed: refs, titles, URLs, due dates, status, backlinks, Everything/Today/Week aggregation, palette.

## 2. Refs (global identity)

| Ref | Entity | Writable via adapter |
|---|---|---|
| `wos:<id>` | space item | full |
| `space:<id>` | space | full |
| `acad:sem:<id>` / `acad:course:<id>` / `acad:asmt:<id>` / `acad:note:<id>` | academic | status (assessment), title via own forms |
| `lib:f:<id>` / `lib:y:<id>` | library file / video | done/progress/tags (own API) |
| `spt:w:<id>` | workout | own API |
| `life:<name>` | Rashed export | read-only (annotate + link only) |

## 3. Tables (migration 5 — all scoped by `workspace_id`, default `'default'`)

| Table | Key columns |
|---|---|
| `wos_workspaces` | id, name |
| `wos_types` | id, name, icon, color, fields JSON, statuses JSON |
| `wos_spaces` | id, type_id, name, icon, color, description, sort, archived |
| `wos_items` | id, space_id, parent_id, title, status, data JSON (field values), start, due, sort, archived, done_at |
| `wos_views` | id, scope (`space:<id>` / `everything`), name, kind, config JSON, sort |
| `wos_relations` | id, src ref, dst ref, kind — unique (src,dst,kind) |
| `wos_history` | id, ref, action, summary, before JSON, after JSON, actor (`user` / `automation:<id>`), at |
| `wos_trash` | token, label, kind, payload JSON, deleted_at, expires_at, restored_at |
| `wos_automations` | id, space_id, name, enabled, trigger JSON, action JSON, runs, last_run |
| `wos_auto_fired` | automation_id, item_id, key (idempotency for time triggers) |
| `wos_inbox` | id, ref, title, body, source, read, at |
| `wos_shares` | token, scope, view_id, revoked |
| `wos_templates` | id, name, description, icon, payload JSON |

## 4. Relations
Kinds: `relates` (symmetric), `blocks` ⇄ `blocked_by`, `belongs_to` ⇄ `contains`, `derived_from`, `attachment_of`. Stored once; the inverse is derived when reading backlinks. Shown in every object page as «مرتبط بـ» with a picker that searches every ref type (palette search backend).

## 5. Universal CRUD

| Entity | C | R | U (inline) | D + undo/trash | Bulk | History | Publish/Export |
|---|---|---|---|---|---|---|---|
| Space item | (+), quick add row, board column add | ✓ | ✓ title/status/fields | ✓ | update/move/archive/delete | ✓ | via space |
| Space | (+), templates | ✓ | ✓ | ✓ (with items/views/automations) | — | ✓ | JSON, CSV, print, public link, save as template |
| Type / fields / statuses | space settings | ✓ | ✓ | ✓ (only unused) | — | ✓ | in template |
| Semester / course / assessment / note | ✓ existing forms + (+) | ✓ | ✓ (+ assessment status inline) | ✓ now persistent trash | assessments: status/delete; notes: resolve/delete | ✓ | JSON (existing), **package export** (new) |
| YouTube / bookmark / workout | ✓ | ✓ | ✓ | ✓ now with undo + trash | videos/workouts delete | ✓ | — |
| Library file meta | — (scan) | ✓ | tags/note/progress/done | — (read-only source) | tag/done | ✓ | — |
| Rashed data | — | ✓ | — | — | — | — | annotate & link via relations |

## 6. Statuses & workflows
Each type defines statuses `{id, name, color, category: todo|active|done|blocked, next?: id[]}`. Empty `next` = free movement. Server rejects a transition not in `next` (validator). Assessment statuses (`pending`, `submitted`, `graded`, …) map to categories in the adapter for Everything/Board views.

## 7. Integrity
zod schemas in `shared/wos.ts` validate every write; `server/wos/auth.ts` exposes `workspaceOf(req)` (single default workspace now) — the seam where authentication attaches (ADR-0007). Every mutation runs in a transaction and writes history.

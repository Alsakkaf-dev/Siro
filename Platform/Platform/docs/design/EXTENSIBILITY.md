# EXTENSIBILITY — the "wide imagination" Work-OS core

## 1. Custom item types
Name, icon, color, fields, statuses, default view. Created implicitly from a template or from "مساحة فارغة", edited in the space's «إعدادات المساحة» (fields & statuses editors).

## 2. Field type system (`shared/wos.ts` FIELD_KINDS)

| Kind | Stored as | Editor | Filter ops | Aggregations |
|---|---|---|---|---|
| text | string | input | contains, =, empty | count |
| longtext | string | textarea | contains, empty | — |
| number | number | number input | =, ≠, <, >, empty | sum, avg, min, max |
| currency | number (+ field.currency, default RM) | number | as number | sum |
| date | `YYYY-MM-DD` | date input | before, after, on, empty | min, max |
| daterange | `{start,end}` | two dates | overlaps | — |
| status | status id | status pill menu | is, is not | count by |
| select | option id | select | is, is not | count by |
| multiselect | option ids[] | chips | has, has not | count by |
| checkbox | boolean | checkbox | is | count true |
| rating | 0–5 | stars (radio group) | ≥ | avg |
| progress | 0–100 | slider | ≥, ≤ | avg |
| url | string | url input (opens new tab) | contains, empty | — |
| library | library ref | library picker | empty | — |
| relation | refs[] (stored in wos_relations) | ref picker | empty | count |
| rollup | computed `{source: children|relation, field, agg}` | read-only | as result | — |
| formula | computed from expression | read-only | as result | — |
| person | (later — multi-user) | — | — | — |

### Formula language (safe; no `eval`)
`shared/formula.ts` — tokenizer + recursive-descent parser → AST → evaluator with a whitelist:
- literals: numbers, `"strings"`, `true/false`; fields: `{اسم الحقل}`; built-ins `{title}`, `{status}`, `{due}`.
- operators: `+ - * / %`, `== != < <= > >=`, `and or not`, `&` (concat).
- functions: `if(c,a,b) round(x,n) abs min max sum avg len lower upper concat coalesce today() days(a,b) year(d) month(d) contains(s,t)`.
- Errors are values (`#خطأ: …`), never exceptions; max depth 64, max length 500.

## 3. Views engine (`web/src/views/`)
Registry: `registerView({id, label, icon, kind: 'generic'|'specialized', component | route})`.
- Generic over items: **List** (grouped), **Board** (group by status/select; drag & keyboard), **Table** (sort, inline edit, column visibility), **Calendar** (month, by any date field), **Timeline** (start→due bars by week), **Gallery** (cards), **Dashboard** (widgets: total, by status, progress, number sum/avg, upcoming list).
- View config: `{filters:[{field,op,value}], sort:{field,dir}, groupBy, dateField, columns, widgets}` — saved in `wos_views`, pinned per space; URL `?view=<id>`.
- Specialized views registered (kept intact, reachable from the view switcher of their place): semester dashboard, courses catalog, course page, **timeline heatmap/gantt/scatter/cumulative**, **grade calculator**, **weights map**, unknowns, print summary, library list/folders/YouTube, **body map** (sports), **routine map**, **ledger**, finance, prayers/qada, weekly review.

## 4. Templates (`shared/templates.ts` built-ins + `wos_templates` user-saved)
Payload = `{type, space, views[], automations[], items[]}`. Built-ins: قائمة قراءة · طلبات التوظيف · مشروع · أهداف · مهام · مذكرات مادة · متتبّع عادة. "New semester" template routes to the existing semester creator / package import (study data keeps the package format). Any space → «حفظ كقالب».

## 5. Automations (`server/wos/automations.ts`)
Sentence UI: «عندما [trigger] ثم [action]».
- Triggers: `item_created`, `status_changed {to?}`, `field_changed {field}`, `due_soon {days}` (time sweep, idempotent via `wos_auto_fired`).
- Actions: `set_status {status}`, `set_field {field, value | "today" | "now"}`, `notify {text}` (→ inbox), `create_next {every: day|week|month}` (recurring), `archive`.
- Deterministic, ordered by creation, max depth 3 (no loops), each run logged in `wos_history` with actor `automation:<id>` and revertible via «تراجع» on the history entry.

## 6. Plugin / extension contract v2 (`web/src/core/plugin.ts`)
A line module exports `PlatformPlugin` with: `id, name, color, icon, basePath, groups (stations), interchanges, create[] (entries for the + menu), verbs[] (palette actions), views[] (specialized views)`. Adding a feature = one module + one line in `plugins.config.tsx`; shell, palette, map, breadcrumbs pick it up. New field kinds register in `FIELD_KINDS` (+ editor component in `web/src/views/fields.tsx`); new view kinds via `registerView`.

## 7. Multi-user readiness
`workspace_id` on every new row; `workspaceOf(req)` seam; owner name from setting `profile.name` (no hard-coded name in logic); public share tokens are read-only. Accounts are **not** shipped (ADR-0007).

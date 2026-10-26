# ADR-0002 — Generic item model + adapters (no migration of domain tables)
**Context.** Need generic powers (relations, Everything, Today, history) across domains without risking existing data/logic.
**Options.** (a) Migrate all domain rows into a generic `items` table. (b) New `wos_*` core for user-defined data; adapters expose domain rows as refs/items.
**Decision.** (b). Refs `acad:asmt:<id>`, `lib:f:<id>`, `spt:w:<id>`, `wos:<id>`…; adapters resolve title/url/due/status.
**Consequences.** Zero data movement; specialized logic untouched; generic features work across domains via refs. Cost: adapter code per domain (small, tested).

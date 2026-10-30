# ADR-0001 — IA as 7 metro "lines" generated from one registry
**Context.** Five overlapping navigation systems, Home/Review/Settings outside the switcher, 17-item Life sidebar, breadcrumbs on 28/37 routes (audit IA_DIAGNOSIS).
**Options.** (a) Patch each nav surface. (b) Rename/move routes into a new hierarchy. (c) Keep URLs; add one registry (`web/src/core/metro.ts`) that generates switcher, sidebar groups, bottom bar, breadcrumbs, palette stations, shortcuts and `/map`.
**Decision.** (c). Lines: الرئيسية, الدراسة, المكتبة, الحياة, الرياضة, مساحاتي, المراجعة.
**Consequences.** One place to edit; drift impossible; URLs stable. Plugins gain `groups`/`interchanges`; old `nav()` kept as a derived adapter for compatibility.

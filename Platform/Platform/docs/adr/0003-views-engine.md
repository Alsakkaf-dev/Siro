# ADR-0003 — Views are saved queries rendered by a view registry
**Decision.** Generic views (List, Board, Table, Calendar, Timeline, Gallery, Dashboard) take `(type, items, config)`; config = filters/sort/group/date field/columns/widgets stored in `wos_views`. Specialized pages register as `kind:'specialized'` views with their existing route so they appear in view switchers and the map without being rewritten.
**Consequences.** New view kinds are one component + one `registerView`. Existing specialized pages keep URLs and behavior.

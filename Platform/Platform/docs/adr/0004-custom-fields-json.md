# ADR-0004 — Custom field values in a JSON column (not EAV)
**Options.** EAV table (`item_id, field_id, value`) vs JSON column `wos_items.data`.
**Decision.** JSON column; field *definitions* in `wos_types.fields` JSON.
**Why.** One row per item → one read per list; SQLite `json_extract` supports filtering/sorting when needed; atomic item updates; simple export/templates. EAV's advantages (per-field indexing, sparse huge schemas) don't matter at personal scale (< 100 k items). Relations are the exception: stored in `wos_relations` because they are graph edges shared with domain refs.
**Consequences.** Field rename = definition change only (values keyed by stable field id). Deleting a field leaves orphan keys, ignored on read and dropped on next write.

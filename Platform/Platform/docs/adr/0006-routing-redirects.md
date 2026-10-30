# ADR-0006 — Routing & redirects: old URLs stay canonical
**Decision.** No existing path changes. New stations get new paths; friendly aliases (`/study`, `/today`, `/settings/trash`, `/spaces/new`) redirect with `<Navigate replace>`. A test asserts every baseline route still renders a non-404 page.
**Consequences.** Bookmarks, PWA shortcuts, deep links and e2e scripts keep working.

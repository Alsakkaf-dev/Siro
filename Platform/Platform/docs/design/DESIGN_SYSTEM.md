# DESIGN_SYSTEM — refine, don't replace (owner decision D1)

The current look (soft lavender canvas, white rounded cards, pill navigation, Cairo + IBM Plex Sans Arabic, accent-filled active states, colored stat tiles) is **kept**. This pass adds missing roles, fixes contrast/target issues, and documents the system.

## 1. Color roles (`web/src/styles/tokens.css`)
- Surfaces: `--bg --bg-elev --surface --surface-2 --surface-3 --border --border-strong`.
- Text: `--text` (≥ 13:1), `--text-2` (≥ 7:1), `--text-3` (≥ 4.5:1 on surface — verified by axe).
- Accent (user-selectable: indigo default, teal, rose, amber, emerald, sky) + `--accent-soft`, `--accent-text`.
- Semantic: `--ok --warn --danger` + `-soft`.
- **Line colors (metro map):** `--core` الرئيسية, `--acad` الدراسة, `--library` المكتبة, `--life` الحياة, `--sports` الرياضة, `--spaces` مساحاتي (new), `--review` المراجعة (new). Used for line dots, sidebar rail, breadcrumb chip, map — never as text color on light surfaces (decorative only), so contrast is unaffected.
- **Status categories:** `--st-todo` (neutral), `--st-active` (accent), `--st-done` (ok), `--st-blocked` (danger). Custom status colors render as a dot + text in `--text` (color is never the only signal — WCAG 1.4.1).

## 2. Typography
Cairo for UI/headings (400/700/800), IBM Plex Sans Arabic for body (400/600). Scale `--fs-xs … --fs-3xl` (12 → 40 px). Line-height 1.6 for Arabic body.

## 3. Spacing, radii, elevation, motion
4-px scale `--s-1…--s-12`; radii `--r-sm 10 … --r-xl 26, pill`; `--shadow-1/2`; motion `--t-fast 140 / base 220 / slow 420` with `--ease-out`; `data-motion=off` and `prefers-reduced-motion` both disable animation.

## 4. Density
`data-density="compact"` (Settings › المظهر) reduces card padding and row heights by ~25 % for tables/lists; default comfortable.

## 5. Primitives (`web/src/ui/*`)
Existing: Button, IconButton, Card/CardHead, Badge, TrustTag, Unknown, Modal, Field, Segmented, Switch, KebabMenu, Pager, Skeleton, EmptyState, DragHandle, PageHead.
Added: **ViewSwitcher** (tablist, distinct from Segmented), **Drawer** (item side panel), **StatusPill** (+ menu), **BulkBar**, **Breadcrumbs** (shell), **LineDot**, **CreateMenu**, **FieldEditor** per field kind, **RefPicker**, **RelationsCard**, **ActivityList**.
Rules: every icon-only control has an Arabic `aria-label`; hit area ≥ 24 px desktop, ≥ 44 px on touch (`@media (pointer: coarse)`); focus ring `--focus` 2 px offset 2 px; Esc closes any overlay and returns focus.

## 6. 5-second test checklist (every screen)
Purpose (h1 + one-line sub), location (breadcrumb with line chip + active sidebar station), primary action (filled button top-left), next step (empty state action).

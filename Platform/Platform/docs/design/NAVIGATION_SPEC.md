# NAVIGATION_SPEC — components, patterns, glossary

All navigation chrome is generated from `web/src/core/metro.ts`. Visual language is the existing one (D1): pill switcher, rounded sidebar card, accent-filled active link — refined, not replaced.

## 1. Components

| Component | Placement | Behavior |
|---|---|---|
| **Line switcher** | topbar (≥ 961 px) | 7 pills with line icon; active pill uses the line color dot + accent fill; overflow scrolls horizontally on medium widths |
| **Sidebar** | left/right per RTL (≥ 961 px; drawer < 961 px) | Brand → line title with colored rail → station groups (≤ 7 items per group) → «تقاطعات» (interchanges, dashed rail) → mode-aware data card |
| **Mobile bottom bar** | < 961 px, fixed bottom, 5 targets ≥ 48 px | الرئيسية · الدراسة · (+) إنشاء · مساحاتي · المزيد (opens sidebar drawer with all lines) |
| **Breadcrumbs ("you are here")** | top of every page, above the title | line chip (color dot + line name) › station › object; built by the shell from the registry + labels pages publish via `PageHead crumbs` (rendered once, by the shell) |
| **View switcher** | under page title, where one place has several looks | `role=tablist`; URL-backed (`?view=` or the existing sub-route) — distinct from in-card Segmented controls (filters/toggles) |
| **Page header actions** | left side of the title (RTL end) | primary action = filled button; secondary = soft buttons; overflow = kebab |
| **Create (+)** | topbar, key `n` | menu of every creatable type: تقييم، مادة، فصل، ملاحظة، عنصر في مساحة…، مساحة جديدة، فيديو YouTube، تمرين، مسودة أمر . Context default: inside a space → that space's item; inside a course → assessment for that course |
| **Palette** | topbar, `/` or Ctrl+K | groups: «افعل» (verbs) · «اذهب إلى» (stations) · objects (courses, assessments, files, videos, items, spaces, exercises, glossary). Verbs: create X, backup now, scan library, toggle theme, open map, open trash … |
| **Inbox bell** | topbar | deadline alerts + automation notifications + stale-data alerts; link «كل الوارد» → `/inbox` |
| **Item side panel** | right drawer (RTL start) | ClickUp/Jira-style details of a space item: title, status, fields, sub-items, relations, activity; Esc closes, focus returns |

## 2. Keyboard map

| Keys | Target |
|---|---|
| `/`, Ctrl+K | palette |
| `n` | Create (+) menu |
| `?` | shortcuts |
| `g h` اليوم · `g j` هذا الأسبوع · `g e` كل شيء · `g i` الوارد | Home line |
| `g s` الفصول · `g d` لوحة الفصل · `g c` المواد · `g t` الجدول · `g k` الحاسبة · `g w` الأوزان · `g u` غير المعروف | Study (unchanged) |
| `g l` المكتبة · `g f` الحياة · `g p` الرياضة · `g m` مساحاتي · `g r` المراجعة · `g ,` الإعدادات | lines |

## 3. Interaction patterns library

| Pattern | Rule |
|---|---|
| Create | Always reachable from (+); in-page "إضافة" buttons remain as shortcuts with context defaults |
| Inline edit | Table cells & item titles edit in place; Enter saves, Esc cancels; optimistic with rollback on error |
| Bulk select | Checkbox per row + "select all"; a sticky **BulkBar** appears with count and actions; Esc clears |
| Drag & drop | Board cards between columns, reorder lists; every drag has a keyboard/menu equivalent |
| Filters / sort / group | Toolbar above a view; chips show active filters; "حفظ كعرض" stores as a saved view |
| Undo toast | Every destructive action → toast with «تراجع» (9 s) **and** the item lands in `/trash` (30 days) |
| Confirmation policy | Confirm only when the action is destructive **and** affects > 1 object or children (semester, space, bulk ≥ 5). Single deletes rely on undo (less friction) |
| Empty states | Icon + one sentence of purpose + the primary action |
| Loading | Skeletons shaped like the content; never blank |
| Errors | Inline under the field (zod messages in Arabic); toasts for server errors |

## 4. UI terminology glossary (one concept = one term)

| Concept | Term | Not |
|---|---|---|
| Top-level domain | خط (internally); shown by its name | منصة (kept only in code comments) |
| Semester | فصل | — |
| Semesters manager | الفصول | مدير الفصول (old label kept as palette keyword) |
| Course | مادة | |
| Assessment | تقييم | بند |
| Unknown | غير معروف | المجهول |
| User space | مساحة | لوحة، مشروع |
| Item in a space | عنصر | مهمة (unless the type itself is named so) |
| Item type | نوع | |
| Field | حقل | عمود |
| View | عرض | تبويب |
| Status | حالة | |
| Relation | ربط / مرتبط بـ | |
| Automation | أتمتة (قاعدة «عندما… ثم…») | |
| Template | قالب | |
| Trash | سلة المحذوفات | |
| Activity | سجل النشاط | |
| My workouts | تماريني | تمريني (old nav label) |
| Drafts to the system | مسودات الأوامر | الأوامر (مسودات) |
| Confidence tags | مثبت · محسوب · افتراض | unchanged |

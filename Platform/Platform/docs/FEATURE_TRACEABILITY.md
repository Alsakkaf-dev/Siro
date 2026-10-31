# FEATURE_TRACEABILITY — every existing feature → its new home

Rule: zero removals. ✅ = verified present after redesign (by `tests/routes.test.ts` route list, `scripts/e2e/*` scenarios, or manual check noted).

## 1. Routes (41)

| Old route | Feature | New home (line › station) | Status |
|---|---|---|---|
| `/` | Home launcher (greeting, active-semester hero, platform cards, tiles, quick links) | الرئيسية › اليوم (Today cards added on top; hero, line cards, tiles, quick links kept) | ✅ |
| `/home` | redirect | → `/` | ✅ |
| `/academic` | Semesters manager | الدراسة › الفصول | ✅ |
| `/academic/import` | Package import (Drive/local/listing) | الدراسة › استيراد وتصدير الحزم (+ export) | ✅ |
| `/academic/s/:id` | Semester dashboard | الدراسة › لوحة الفصل (view switcher) | ✅ |
| `/academic/s/:id/courses` | Courses catalog | الدراسة › المواد | ✅ |
| `/academic/s/:id/courses/:cid` | Course page | الدراسة › المادة (+ ملفات المادة, مرتبط بـ) | ✅ |
| `/academic/s/:id/timeline` | Heatmap/Gantt/Scatter/Cumulative | الدراسة › الجدول الزمني (specialized view) | ✅ |
| `/academic/s/:id/calculator` | Grade calculator | الدراسة › حاسبة الدرجات (specialized view) | ✅ |
| `/academic/s/:id/weights` | Weights map | الدراسة › خريطة الأوزان (specialized view) | ✅ |
| `/academic/s/:id/unknowns` | Unknowns | الدراسة › غير المعروف | ✅ |
| `/academic/s/:id/print` | Print summary | الدراسة › ملخص للطباعة | ✅ |
| `/library` | Library list, facets, grouping, recent | المكتبة › الملفات | ✅ |
| `/library/folders` | Folder tree | المكتبة › المجلدات | ✅ |
| `/library/youtube` | YouTube CRUD | المكتبة › YouTube (+ undo, bulk) | ✅ |
| `/library/settings` | Library root/scan | المكتبة › إعدادات المكتبة (also linked from الإعدادات › المصادر) | ✅ |
| `/library/f/:id` | File viewer + meta | المكتبة › ملف (+ مرتبط بـ, المادة chip) | ✅ |
| `/library/y/:id` | Video player + meta | المكتبة › فيديو | ✅ |
| `/life` | Overview | الحياة › نظرة عامة | ✅ |
| `/life/finance` | Finance | الحياة › المال | ✅ |
| `/life/insights` | Finance indicators | الحياة › المال › مؤشرات | ✅ |
| `/life/ledger` | Full ledger | الحياة › المال › السجل الكامل (specialized view) | ✅ |
| `/life/prayers` | Prayers | الحياة › العبادة › الصلاة | ✅ |
| `/life/qada-plan` | Qada plan + choice | الحياة › العبادة › خطة القضاء | ✅ |
| `/life/habits` | Habits | الحياة › العادات والجسم › العادات | ✅ |
| `/life/alternatives` | Alternatives + picks | الحياة › العادات والجسم › البدائل (interchange from الرياضة) | ✅ |
| `/life/body` | Body/weight | الحياة › العادات والجسم › الجسم (interchange from الرياضة) | ✅ |
| `/life/routine` | Routine | الحياة › اليوم › الروتين | ✅ |
| `/life/routine-map` | Weekly routine map | الحياة › اليوم › خريطة الأسبوع (specialized view) | ✅ |
| `/life/glossary` | Glossary | الحياة › أدوات › القاموس (+ palette, + map) | ✅ |
| `/life/commands` | Command drafts to the system | الحياة › أدوات › مسودات الأوامر (+ Create menu) | ✅ |
| `/life/settings` | the system folder/status/docs | الحياة › أدوات › إعدادات الحياة (also الإعدادات › المصادر) | ✅ |
| `/review` | Weekly review | المراجعة › مراجعة الأسبوع | ✅ |
| `/sports` | Exercise library + body map | الرياضة › مكتبة التمارين | ✅ |
| `/sports/templates` | Weekly templates | الرياضة › القوالب | ✅ |
| `/sports/mine` | My workouts + week | الرياضة › تماريني (+ Today card) | ✅ |
| `/settings` | Appearance, notify, export/import, backups, info | الإعدادات والبيانات (hub + profile, sources, trash, density) | ✅ |
| `/search` | Full search | global › البحث (now includes spaces/items) | ✅ |
| `*` | NotFound | unchanged (+ link to map) | ✅ |

## 2. API endpoints (66) — all kept unchanged
All endpoints listed in `docs/audit/SYSTEM_MAP.md §3` keep path, method and response shape (verified by the existing 182 tests). DELETE responses gain an additive `undo` token where they had none (YouTube, bookmark, workout). New endpoints are additive under `/api/wos/*`, `/api/trash/*`, `/api/history`, `/api/public/*`, `/api/*/bulk`, `/api/packages/export/:semId`, `/api/today`.

## 3. Capabilities / widgets

| Capability | New home | Status |
|---|---|---|
| Global search + palette | topbar palette (+ verbs, spaces/items) | ✅ |
| Notifications bell (deadlines) | bell (+ automation & stale alerts) + `/inbox` | ✅ |
| Appearance (theme/accent/motion) | الإعدادات › المظهر (+ density) | ✅ |
| Backups (daily auto + manual + restore) | الإعدادات › البيانات | ✅ |
| Export/import JSON | الإعدادات › البيانات | ✅ |
| Offline/PWA, service worker, offline page | unchanged | ✅ |
| Keyboard shortcuts | extended map (old keys unchanged) | ✅ |
| Undo toast | kept + persistent trash `/trash` | ✅ |
| Confidence tags مثبت/محسوب/افتراض, «غير معروف» honesty | unchanged everywhere; Today cards reuse them | ✅ |
| Freshness/staleness banners | Life pages + Home alerts | ✅ |
| Semester packages spec v1 | unchanged; export added (same manifest) | ✅ |
| Online mode (Vercel, Blob, auto-import) | unchanged (ADR-0008) | ✅ |
| the system read-only sources | unchanged; annotate/link via relations | ✅ |

## 3b. AI core (ADR-0009) — added, nothing removed
| Capability | Where | Status |
|---|---|---|
| Assistant panel (Ctrl+J, topbar ✦), page-aware, streamed, threads saved | `web/src/ai/AiPanel.tsx`, `ai_threads` | ✅ |
| Palette sentence → assistant (Ctrl+Enter) | `shell/Palette.tsx` | ✅ |
| 32 tools across all lines, tiered read / write / danger, forbidden ones not exposed | `shared/aiTools.ts`, `web/src/ai/tools.ts` | ✅ |
| Preview → confirm → undo per action, «undo the whole conversation» | `agent.ts`, `ai_runs` | ✅ |
| History tagged «بواسطة المساعد» | `server/actor.ts`, Activity | ✅ |
| Contextual entry points: smart capture, space builder, automation writer, summarise/quiz file, course analysis, life logging, daily brief | Create menu, CoursePage, LibraryItem, Spaces/Space, Automations, LifeCommands, Home | ✅ |
| Background daily brief → Inbox (PC, free providers only) | `server/ai/background.ts` | ✅ |
| Providers: Ollama (local, auto-detect best Qwen by RAM), Ollama from the browser, any OpenAI-compatible (free/paid), Anthropic (Opus/Sonnet/Haiku 5.5) — ordered fallback, daily cap | `server/ai/*`, `shared/aiStream.ts`, Settings › الذكاء | ✅ |
| Online lock (`AI_ACCESS_KEY`), keys server-side only | `server/ai/routes.ts` | ✅ |
| Model evaluation on 30 Arabic commands | `npm run ai:eval` | ✅ |

## 4. Data entities
All tables of schema v4 are untouched by migration 5 (additive only). Migration 6 adds `ai_threads` + `ai_runs` only. Before/after row counts on the real DB: `tests/migration.test.ts`.

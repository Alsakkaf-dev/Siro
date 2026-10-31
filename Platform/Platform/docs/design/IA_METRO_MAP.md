# IA_METRO_MAP — the new information architecture

> Inside like a train network, outside effortless. **Lines** = domains, **stations** = pages/views, **interchanges** = cross-domain links, **central station** = Home.

Single source of truth in code: `web/src/core/metro.ts` (lines, stations, interchanges). The sidebar, top line switcher, mobile bottom bar, breadcrumbs, palette, keyboard shortcuts and the `/map` page are all generated from it — they cannot drift apart.

## 1. Lines (7 top-level — Hick budget ≤ 7)

| # | Line | Color token | Base | Purpose (user goal) |
|---|---|---|---|---|
| 1 | **الرئيسية** (central station) | `--core` | `/` | What now? Today · This week · Everything · Inbox |
| 2 | **الدراسة** | `--acad` | `/academic` | Semesters → courses → assessments, grades, packages |
| 3 | **المكتبة** | `--library` | `/library` | Files, folders, videos; reading progress |
| 4 | **الحياة** | `--life` | `/life` | Money, worship, habits, routine, body (Rashed data, read-only) |
| 5 | **الرياضة** | `--sports` | `/sports` | Exercises, templates, my workouts |
| 6 | **مساحاتي** | `--spaces` | `/spaces` | Anything else: user-defined spaces, types, templates, automations |
| 7 | **المراجعة** | `--review` | `/review` | Weekly review, progress dashboard, activity history |

Global (not lines, fixed placement in the topbar): Search/Palette · Create (+) · Inbox bell · Settings & data · theme.

## 2. Stations (≤ 3 levels to any object)

```mermaid
flowchart RL
  subgraph L1[الرئيسية]
    H0((اليوم /)) --- H1[هذا الأسبوع /week] --- H2[كل شيء /everything] --- H3[الوارد /inbox] --- H4[خريطة الموقع /map]
  end
  subgraph L2[الدراسة]
    S0((الفصول /academic)) --- S1[لوحة الفصل] --- S2[المواد] --- S3[المادة] 
    S1 --- S4[الجدول الزمني] --- S5[حاسبة الدرجات] --- S6[خريطة الأوزان] --- S7[غير المعروف] --- S8[ملخص للطباعة]
    S0 --- S9[استيراد/تصدير حزمة /academic/import]
  end
  subgraph L3[المكتبة]
    B0((الملفات /library)) --- B1[المجلدات] --- B2[YouTube] --- B3[ملف / فيديو] --- B4[إعدادات المكتبة]
  end
  subgraph L4[الحياة]
    F0((نظرة عامة)) --- F1[الروتين] --- F2[خريطة الأسبوع]
    F0 --- F3[المال] --- F4[مؤشرات المال] --- F5[السجل الكامل]
    F0 --- F6[الصلاة] --- F7[خطة القضاء]
    F0 --- F8[العادات] --- F9[بدائل العادات] --- F10[الجسم]
    F0 --- F11[الأوامر] --- F12[القاموس] --- F13[إعدادات الحياة]
  end
  subgraph L5[الرياضة]
    P0((مكتبة التمارين)) --- P1[القوالب الأسبوعية] --- P2[تماريني]
  end
  subgraph L6[مساحاتي]
    M0((كل المساحات /spaces)) --- M1[القوالب /spaces/templates] --- M2[مساحة /spaces/:id] --- M3[عنصر ?item=]
    M0 --- M4[الأتمتة /spaces/automations]
  end
  subgraph L7[المراجعة]
    R0((مراجعة الأسبوع /review)) --- R1[لوحة التقدّم /review/progress] --- R2[سجل النشاط /activity]
  end
  H0 -. interchange .- S1
  H0 -. interchange .- P2
  H0 -. interchange .- F0
  H0 -. interchange .- B0
  S3 -. ملفات المادة .- B0
  P2 -. روابط .- F9
  P2 -. روابط .- F10
  R0 -. reads .- F0
  M2 -. relations .- S3
```

Depth check: Home → line → station → object. Deepest object (an assessment) = الدراسة → لوحة الفصل → المادة (#anchor) = 3 levels; a space item = مساحاتي → مساحة → عنصر (drawer) = 3.

## 3. Interchanges (cross-line links, shown as «تقاطعات» in the sidebar and as "مرتبط بـ" on objects)

| From | To | Mechanism |
|---|---|---|
| Today (Home) | due assessments, today's workout, prayers/habits, money, continue reading, inbox | Home cards (each card header links to its station) |
| Course page | library files of that course | "ملفات المادة" card (library query `course=CODE`) |
| Library item | its course | "المادة" chip when `course_code` matches a known course |
| Any object | any object | Relations panel (typed links, backlinks) |
| Sports → Life | alternatives, body | «تقاطعات» group (was mixed into Sports nav) |
| Review | Life, Sports, Study | source links per section |

## 4. Old → new route map (all old URLs kept — D3)

| Old URL | New home | Change |
|---|---|---|
| `/` | الرئيسية › اليوم | content rebuilt (Today); old hero + line cards kept below |
| `/home` | → `/` | redirect (unchanged) |
| `/academic…` (all 10) | الدراسة | same URLs; view switcher added on semester pages |
| `/library…` (6) | المكتبة | same URLs; header duplicate buttons → view tabs |
| `/life…` (14) | الحياة | same URLs; sidebar grouped (4 groups + tools) |
| `/sports…` (3) | الرياضة | same URLs; cross-links moved to «تقاطعات» |
| `/review` | المراجعة › مراجعة الأسبوع | same URL; now a line |
| `/settings` | global › الإعدادات والبيانات | same URL; hub links to library/life settings, trash, profile |
| `/search` | global | same URL |
| new | `/week` `/everything` `/inbox` `/map` `/spaces…` `/review/progress` `/activity` `/trash` `/p/:token` | aliases: `/study`→`/academic`, `/today`→`/`, `/settings/trash`→`/trash` |

# التنقل في المنصة — الخريطة وكيف تُضاف صفحة

> المصدر الوحيد: `web/src/core/registry.ts` (TS صرف بلا JSX ليُختبر في vitest). منه تُشتق القائمة الجانبية والشريط السفلي ولوحة الأوامر والاختصارات وفتات الخبز والعناوين وتبويبات الصفحة. يتحقق `tests/registry.test.ts` من تطابقه مع `App.tsx` و`scripts/smoke-routes.json` و`scripts/inline-html.mjs`.

## الأقسام (`AREAS`) — اختصار `g` ثم الرقم
| # | القسم | المدخل | صفحاته |
|---|---|---|---|
| 1 | الرئيسية | اليوم `/` | اليوم · مراجعة الأسبوع `/review` · **الجدول** `/calendar` (+الوجبات `/calendar/meals` +اقتراحات Outlook `/calendar/proposals`) |
| 2 | الدراسة | لوحة الفصل | المواد · المادة (محور) · التقييمات والمواعيد `timeline` · حاسبة الدرجات · غير المعروف · مدير الفصول · ملخص الطباعة |
| 3 | المكتبة | `/library` | الكل · المجلدات · YouTube · ملف · فيديو |
| 4 | الحياة | `/life` | المال (+المؤشرات +السجل) · الصلاة (+خطة القضاء) · العادات (+البدائل) · الروتين (+خريطة الأسبوع) · طلبات التسجيل |
| 5 | الجسم والرياضة | `/sports/mine` | الجسم والوزن · تمريني · مكتبة التمارين · القوالب |
| 6 | المطبخ | `/kitchen` | نظرة · المتجر (+`/store/:slug`) · السلة · المخزن · المحفظة · الأسعار · القاموس (+`/codex/:slug`) · الطبخ `/kitchen/cook` · الخطة `/kitchen/plan` — خلف العلم `kitchen.enabled` (مفعّل) |
| 7 | النظام | `/settings` | الإعدادات · قاموس المصطلحات · البحث |

اختصارات إضافية: `g j` الجدول، `g d` لوحة الفصل، `g c` المواد، `g t` التقييمات، `g k` الحاسبة، `g u` غير المعروف، `g s` مدير الفصول، `g w` خريطة الأوزان (`KBD_ALIASES`)، `g r` المراجعة، `g h` اليوم، `g ,` الإعدادات، `c` «+ جديد»، `؟`/`?` نافذة الاختصارات، `Ctrl/Cmd+K` اللوحة. تُقرأ بـ`e.code` فتعمل بلوحة مفاتيح عربية، ويظهر مؤشر «g…» لحظة الانتظار.

## كيف تُضاف…
**صفحة:** (1) سطر في `PAGES` (`id`، `path` بمعاملات `:name`، `label`، `area`، `icon`، `surface`: `sidebar` يظهر في الشريط، `tab` تبويب لمجموعة، `hidden` مسار فرعي بلا عنصر شريط ويُعيَّن `parent` للفتات والعنصر النشط، `chunk` = اسم ملف الصفحة الكسولة، `flag` اختياري). (2) `<Route>` في `App.tsx` بالمسار نفسه + `lazy(import('./pages/<chunk>.js'))`. (3) المسار في `scripts/smoke-routes.json` (+ الجلب المسبق في `scripts/inline-html.mjs`: مفتاح في `routes` وحالة في سكربت الإقلاع؛ يفشل البناء إن غاب مقطع معلن). (4) شغّل `npx vitest run tests/registry.test.ts`.
**تبويب:** صفحات بنفس `tabGroup` تُرسم تبويباتها تلقائيًا في `PageHead` (صفحة واحدة على الأقل `surface: 'sidebar'` في المجموعة). عنصر الشريط النشط واحد دائمًا (`sidebarOwner`).
**قسم:** عنصر في `AREAS` (`kbd` فريد، `entry` = id صفحة المدخل، `flag` لإخفائه، `mobile` لظهوره في الشريط السفلي) ثم صفحاته.
**تحويل لرابط قديم:** سطر في `REDIRECTS` (يحافظ `RedirectKeep` على `search` و`hash` ويستبدل `:semId`) + `scripts/smoke-routes.json` (`routes` و`redirects`). لا سلاسل تحويل ولا حذف رابط بلا تحويل.
**عنوان الصفحة:** يحسبه Shell من السجل؛ للتجاوز `usePageTitle(label)` من `core/title.tsx` — لا تضبط `document.title` من صفحة.

## الحالة في الرابط (P7)
`core/useUrlParam.ts`: `useUrlParam(key, default, allowed?)` و`useUrlSet(key)` — `replace` لا يملأ التاريخ، ولا كتابة بلا تغيّر، والافتراضي لا يُكتب. المعتمد: التقييمات `?view=list|weeks|gantt|weights` (+`mode` `kind` `status` `group` `day` `course` `open`)، المادة `?tab=overview|materials|calc|notes`، الحاسبة `?course=`، الإعدادات `?tab=general|data|sources`، المكتبة `?group=`، الرياضة `?q&muscle&level`، السجل المالي، المراجعة `?week=last`، المتجر `?q&cat&sort&only&recipe&diet&pmax`، القاموس `?q&meal&ing&kmin&kmax&cmax&can&status&sort&view`، الأسعار `?tab=matrix|audit|tools|requests`، الجدول `?view=week|day|month|list&date=&hide=&source=`، الوجبات `?tab=day|cycle|shop|log&date=`، الاقتراحات `?status=`. فلاتر المواد الثقيلة تبقى محلية. الإنشاء السريع = انتقال مع `?new=…` يستهلكه `useNewParam` ثم يحذفه.

## سياق الفصل والوارد
`SemChip` في الدراسة فقط؛ تبديل الفصل يحفظ الصفحة الفرعية (`sameSubpage`)، و«تعيين كنشط» منفصل. `core/inbox.tsx` وارد واحد (التنبيهات والعاجل وغير المعروف للفصل النشط) يستهلكه الجرس وبطاقة «يحتاج انتباهك» في اليوم. «اليوم» كل بطاقة فيه مستقلة وتختفي إن غاب مصدرها (مثلًا مجلد راشد).

## الأعلام (`core/flags.ts`)
`kitchen.enabled` و`kitchen.3d` و`calendar.outlook.proposals` (مفعّلة)، و`kitchen.apis.extended` (بطاقة الإثراء) و`calendar.outlook.read` (زر «زامن Outlook») مغلقتان افتراضيًا لأنهما تحتاجان مفاتيح خادم وغير مُتحقَّق منهما (UNVERIFIED). تُعدَّل من الإعدادات ← «ميزات تجريبية»، وصفحة بعلم مغلق تختفي من التنقل (الرابط المباشر يعمل).

## التحقق
التبويبات المشتقة من السجل (`tabGroup: calendar`): الجدول · الوجبات · الاقتراحات. دليل الاستخدام الكامل: `docs/USER_GUIDE_AR.md`.

`npm run smoke` (39 مسارًا API) · `node scripts/browser-smoke.mjs --strict [--shots <dir>]`: 48 مسارًا × (1280، 390) — عنصر نشط واحد، فتات، عنوان، لا تمرير أفقي، لا أرقام هندية، لا أخطاء وحدة التحكم، + سيناريوهات تفاعلية (اختصارات عربية، لوحة الأوامر، «+ جديد»، التحويلات، تبديل الفصل، Back، 404، اليوم بلا راشد، المطبخ J1/J2/J3/J8).

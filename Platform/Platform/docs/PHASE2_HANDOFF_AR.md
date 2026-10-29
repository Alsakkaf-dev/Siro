# تسليم: المرحلة 2 قيد التنفيذ (توقف بطلب المالك)

> المرجع الأعلى يبقى `docs/UNIFIED_PLAN_AR.md`. هذا الملف حالة اللحظة فقط. الـcommit الذي يحمله **WIP** وليس «أكملت المرحلة 2».

## منجز في هذا الـcommit (لم يُراجَع بصريًا بعد)
- **P4 الدراسة:** `Timeline` بعروض في الرابط `?view=list|weeks|gantt|weights` (+`?mode=heat|scatter|area`، `?course=`، `?open=1`، وفي القائمة `?kind=` `?status=` `?group=week|course|status` `?day=YYYY-MM-DD`). `Weights.tsx` صار `WeightsBody` داخل العرض، و`/academic/s/:semId/weights` ← تحويل، و`g w` عبر `KBD_ALIASES`. `CoursePage` محور بـ`?tab=overview|materials|calc|notes` و`?view=`. `widgets/CourseCalcPanel.tsx` مشترك مع `Calculator` (`?course=`) ومعه «احفظ كدرجة حقيقية». `GradeDialog`: «مُصحَّح» يتطلب درجة (الإجراء الجماعي لا يعيّن graded). `Dashboard` مخفّف (حُذفت الدونات والمراحل والنبض والـsparkline)، العدّاد رابط، المواعيد القادمة بإجراءات، التقويم الشهري `onDay` ← `timeline?view=list&day=`، وعدّ «مصحَّح بدرجة» بـ`isGraded`. `WeekTimetable` يرسم الجمعة/السبت عند وجود محاضرة. `Courses`: `?q=` `?sort=`، عمود إجراءات، زر «+ تقييم» ظاهر. `LibCourseRef.id` (إضافة غير كاسرة) فيفتح عنصر المكتبة المادة على تبويب المواد. نموذج YouTube: قائمة رموز المواد و`?course=` مسبق.
- **P5:** المكتبة بلا أزرار مكررة، والتجميع `?group=` (و`?tab=` القديم يُقرأ). الحياة: أزرار «سجّل» (مال/صلاة/انتكاسة)، و«اشتهاء الآن؟» (العادات واليوم)، و`PageLinks` من السجل، و`LifeCommands` بمعاينة JSON مطوية وحالات عربية. الرياضة: حذف أزرار الترويسة المكررة، و«ابدأ بهذا القالب» بخطوة واحدة.
- **P6:** `Settings` بـ`?tab=general|data|sources`، و`LibrarySettings`/`LifeSettings` مضمّنتان (`embedded`)، و`/library/settings` و`/life/settings` ← `/settings?tab=sources`. أُضيفت `core/FlagsCard.tsx` وبطاقة نطاق التصدير، ومرساة `#notify` للإشعارات. **`kitchen.enabled` افتراضيه الآن `true`.**
- **P7:** `core/useUrlParam.ts` (`useUrlParam`/`useUrlSet`) على فلاتر الرياضة (`q` `muscle` `level`) والسجل المالي والمراجعة (`?week=last`). المراجعة فيها فهرس `rv-*`، و«المطلوب» أولًا، والملاحظة مرفوعة، وقسم الدراسة مستقل في الأعلى.

## حالة البوابات لحظة التوقف
typecheck نظيف · vitest 221 ناجح / 18 متخطّى · build ✓ · smoke 39/39 · `browser-smoke --strict`: **خطأ واحد متوقع**، وهو أن سيناريو «المطبخ مخفي من التنقل…» صار قديمًا لأن العلم مفعّل الآن. يجب قلبه إلى «ظاهر + `g 6` يعمل». العناوين الفريدة 35 (≥ 33).

## المتبقي من المرحلة 2 (بالترتيب)
1. إصلاح سيناريو browser-smoke أعلاه، ثم مراجعة بصرية بـ`--shots` لصفحات P4–P7.
2. **خادم المطبخ (K-M3/K-M4):**
   - ترحيل إضافي `id: 4` بجداول `kitchen_*` فقط: الأسعار، التدقيق، السلة، الشراء وبنوده، المخزن وحركاته، المحفظة وحركاتها، طلبات المكونات. لا مساس بالجداول القائمة.
   - بذر الأسعار من `shared/kitchen` `SEED_PRICES`.
   - مسارات `/api/kitchen/*` بتحقق Zod، و«اشتريت» ذرّي بـ`db.tx`.
   - SSE على `/api/kitchen/stream`. انتبه: `compression` مركّب على `/api` في `server/app.ts`، فاستثنِ المسار أو اعمل flush.
   - اختبارات API.
3. **واجهات المطبخ:**
   - المتجر `/kitchen/store` و`/kitchen/store/:slug`، السلة، المخزن، المحفظة، الأسعار (B1) مع التدقيق والتراجع.
   - القاموس `/kitchen/codex` و`/:slug` ببطاقات FIFA ومعادلات MC-10، وظهر البطاقة والمقارنة والفلاتر.
   - الانتشار: نفس التبويب فورًا، و`BroadcastChannel` بين التبويبات، وSSE بين الأجهزة.
   - تسجيل الصفحات في `core/registry.ts` وApp وفي `smoke-routes.json` و`inline-html.mjs`.
4. **E2E في browser-smoke:**
   - الرحلات J1 وJ2 وJ3 وJ8، ومعايير القبول AC-01…04.
   - قياس زمن J2 بأرقام: ≤ 300ms في التبويب نفسه، ≤ 1s في تبويب آخر، ≤ 3s في سياق آخر.
5. **P8:**
   - `docs/nav-restructure/NAVIGATION_AR.md`.
   - تحديث `README_AR.md`، و`DESIGN_REFERENCES.md` (الأسطر 44،61،76،97)، و`PROGRESS.md`.
   - لقطات 1280/390 عبر SendUserFile.
   - وصف PR Alsakkaf-dev/Siro#5.
   - تحديث جداول الحالة.
   - إضافة C19 إلى CONFLICT_REGISTER: A2-01 يطلب ألوان بطاقات في tokens، وهذا ممنوع بقيد المالك، فتُستعمل الرموز الموجودة.
   - commit «المرحلة 2» + push، ثم «أكملت المرحلة 2».

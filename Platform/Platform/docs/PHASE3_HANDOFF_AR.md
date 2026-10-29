# تسليم: المرحلة 3 غير مكتملة (توقف بطلب المالك)

> المرجع الأعلى `docs/UNIFIED_PLAN_AR.md`. هذا الـcommit **WIP** وليس «أكملت المرحلة 3». فرع العمل `claude/eager-lamport-6mk4f5` وPR #6. اقرأ هذا الملف أولًا في المحادثة الجديدة.

## منجز ومختبَر (نسخة العمل: vitest 310 ناجح/18 متخطّى، typecheck نظيف)
- **K-M7 المحاكي** `shared/kitchen/sim/` (`rules` `itemRules` `engine` `host` `bot` `guided` `cookcard`): حتمي، خطوة 0.1 ث، حرارة/نضج (Q10)/تحمير/حرق/امتصاص/عصارة/فوران حليب/قدر ضغط/محمّصة/التصاق/دخان. معايرة SIM-50 بنطاق ±20% (اختبار لكل صف)، سجلات ذهبية `tests/replay/*.json` (`UPDATE_REPLAYS=1` لإعادة توليدها عمدًا)، أداء ≤ 2ms/0.1ث.
- **K-M6 من السجل إلى بطاقة**: أوزان فعلية، تغذية/تكلفة، مسمّي الأطباق MC-20، كاتب الخطوات MC-30، إحصاءات وندرة، اكتشاف التكرار ≥90%، `outlook.ts` (قالب 2.6 + إعادة كتابة أوزان الخطوات للحصص)، `plan.ts` (يوم من 3 خانات، القانون حاجز، 3 حلول)، الوضع الموجّه `guided.ts` (كشف إنجاز الخطوات).
- **الخادم** (ترحيل `id: 5`): `server/kitchenCook.ts` — `POST /cook/serve` (يعيد حساب البطاقة من السجل، خصم المخزن ذرّي، تكرار، تجريبي بتأكيد)، `/cards` (PATCH/DELETE/variant)، `/plan` (PUT/GET/DELETE/preview). AC-07: نقطة كتابة واحدة لجدول الأيام (يثبته اختبار مسح). اختبارات: `kitchen-sim` `kitchen-cook` `kitchen-cook-api` (على السائقين).
- `three@0.184.0` (+ `@types/three`) أُضيفا إلى `package.json`.

## مكتوب ولم يُشغَّل/يُتحقَّق منه (لا تثق به قبل بناءٍ واختبار)
- `web/src/kitchen/cook/`: `sim.worker.ts` `simClient.ts` `Scene3D.ts` (مشهد إجرائي كامل: رفوف الـ26 بملصقات atlas، موقد 4 مواقد بلهب، أوعية، محمّصة، بخار، 3 جودات، التقاط صورة، محطات 1–7) `Stage3D.tsx` `glbContract.ts`. `web/src/pages/KitchenCook.tsx` (HUD، لوحة إجراءات مكافئة، وصفة موجّهة، نافذة «قدّم»). `kitchen/store.ts` أُضيفت له دوال البطاقات والخطة. **typecheck الويب لم يُشغَّل بعد الملفات الأخيرة**، ولا build ولا متصفح.

## المتبقي بالترتيب
1. تشغيل typecheck/build؛ إصلاح أخطاء `KitchenCook.tsx` و`Scene3D.ts` إن وُجدت (مثلًا `TOASTER_POS` معرّفة باسم `TOASTER_POS`، وعدّ `SIZE_AR` معرّف باسم `SIZE_AR`).
2. تسجيل الصفحات في `core/registry.ts` + `App.tsx` + `smoke-routes.json` + `inline-html.mjs`: `/kitchen/cook` (+ `?recipe=&mode=`) و`/kitchen/plan`؛ وصفحة الخطة `KitchenPlan.tsx` (3 خانات ليوم، معاينة حيّة، ملاءمة تلقائية، رفض القانون بالحلول الثلاثة، نص الوصف مع «انسخ»، لا كتابة في Outlook).
3. القاموس: «ابتكاراتي» من `k.cards`، وتفعيل «اطبخها» (`/kitchen/cook?recipe=`) و«ضعها في الجدول» و«نسخة مصغّرة» (`makeVariant`).
4. CSS تخطيط فقط في `styles/kitchen.css` لـ`.kt-cook-grid` `.kt-hud` `.kt-stage` `.kt-canvas` `.kt-side` `.kt-ing-btn` `.kt-vessel` `.kt-review` وغيرها (لا ألوان جديدة).
5. K-M8: `tools/blender/export.py` + `BLENDER_GUIDE_AR.md` + `tools/assets/optimize.mjs` + `public/kitchen/assets.manifest.json` + `CREDITS.md` + اختبار AC-12 (كل أصل بترخيص) + اختبار ميزانيات PERF-20 + اختبار `glbContract` بملف GLB مولَّد؛ قياس الحزمة قبل/بعد (حزمة المطبخ لا تزيد غيره).
6. E2E في `browser-smoke`: VS-1 كاملة (تغيير سعر ← شراء ← مخزن ← طبخ bk-03 يدويًا بتسريع ×60 ← بطاقة 532±2 ← خانة جدول ← قبول/رفض القانون ← نص الوصف)، AC-05/06/07، لوحة A11Y بلا WebGL، الجودات الثلاث، `prefers-reduced-motion`، لقطات 1280/390.
7. P-docs: جدول الحالة في `UNIFIED_PLAN_AR.md`، `README_AR`، `PROGRESS`، `ASSUMPTIONS_LOG` (اقتراحات: الخصم عند «قدّم» لا لحظيًا؛ الطاهي الآلي أداة معايرة؛ الأصول إجرائية حتى تُسلَّم GLB)، حذف هذا الملف ثم «أكملت المرحلة 3».

## ملاحظات
- قيد LAW-01: لا يظهر الرقمان 1200/1500 حرفيًا خارج `law.ts` في `shared/kitchen` و`web/src/kitchen` (اختبار يفحص).
- موصلات 3dCMS/kernelCAD/Three.js Viewer/SketchUp/WalkMyPlan كانت `enabledInChat:false` في الجلسة المجدولة ولم يمكن استدعاؤها؛ فعّلها في المحادثة الجديدة لاستبدال المشهد الإجرائي بـGLB عبر عقد الأسماء (`slot_ing_<slug>`, `burner_1..4`, `cam_station_<name>`…). لا Blender في بيئة السحابة.

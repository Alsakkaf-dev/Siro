# الموصلات ثلاثية الأبعاد في المرحلة 3 — ما استُعمل وما ظهر

> قيد البيئة: سياسة الشبكة في جلسة السحابة حجبت تنزيل ملفات الموصلات إلى المستودع (`api.kernelcad.com` وغيره: 403 من وكيل الخروج)، فلم يُرتكب أي نموذج منها ولم يُلتف على السياسة. كل موصل أدناه أُنتج عنده الناتج فعلًا ويُفتح من حسابك. المشهد في المنصة يبقى **إجرائيًا** حتى تضع GLB في `web/public/kitchen/models/` وتشغّل `node tools/assets/optimize.mjs` (AS-31/AS-33).

| الموصل | ما فُعل | الناتج | حدّ |
|---|---|---|---|
| **kernelCAD** | أوعية المطبخ (مقلاة، قدران، قدر ضغط، وعاء، صحن، لوح) كأجزاء بأسماء العقد `equip_*`/`plate_1`/`board_main`؛ تصدير GLB (230KB، 71 وجهًا) وحفظ المشروع | مشروع: https://app.kernelcad.com/p/kOQpSH6R?version=1 (من «Export» هناك: GLB، المحور Y لأعلى) · المصدر في `tools/kernelcad/kitchen-kit.kcad.ts` | رابط التنزيل المباشر للـGLB (24 ساعة) محجوب عن بيئة العمل؛ الأجزاء متراكبة عند الأصل عمدًا (يضعها المحمِّل بالاسم) |
| **Trimble SketchUp** | تخطيط المطبخ كاملًا: رفوف 3 مستويات + 26 خانة `slot_ing_<slug>` + ثلاجة + جزيرة + لوح + ميزان + 4 مواقد `burner_1..4` + الأوعية؛ قُرئت المهارات الأساسية السبع قبل البناء؛ بوحدات البوصة | `siro-kitchen-layout.skp` (رابط الحفظ في جلسة SketchUp، صالح لفترة محدودة) + معاينة `docs/kitchen/3d/sketchup-kitchen-layout.png` | الملف `.skp` لا GLB؛ الرابط محجوب عن بيئة العمل |
| **3dCMS** | مشهد خاص «Siro Kitchen (reference layout)» بالأبعاد نفسها (5.4×4.6 م) وبإحداثيات three.js | https://3dcms.info/?sourceId=src-c78ee417 (خاص؛ النشر بطلبك وموافقتك فقط) | لم يُستعمل توليد النماذج المدفوع (20 رصيدًا) بلا إذن؛ مواد جاهزة لا مكتبة |
| **WalkMyPlan** | مخطط أرضية للغرفة نفسها | https://www.walkmyplan.com/project/d383ad4a3ffd4ce5813015?src=chat (السكتش: `?view=sketch`) | لم تُطلب صورة/فيديو (يستهلكان رصيدًا) |
| **Three.js Viewer** | معاينة تفاعلية بنفس الإحداثيات والـ26 خانة والأوعية لفحص التناسب | عُرضت في المحادثة | عرض فقط |

## كيف تضع حزمة GLB (3 خطوات)
1. افتح مشروع kernelCAD أعلاه وصدّر GLB (أو شغّل `kernelcad export glb tools/kernelcad/kitchen-kit.kcad.ts` عندك)، أو صدّر من بلندر بـ`tools/blender/export.py`.
2. ضع الملف في `web/public/kitchen/models/kitchen-kit.glb`.
3. `node tools/assets/optimize.mjs` (يحسّن ويتحقق ويكتب البصمة ويضع `delivered: true`). افتح `/kitchen/cook`: الخاصية `data-kit="glb"` على لوحة الرسم تدل أن الحزمة طُبّقت.

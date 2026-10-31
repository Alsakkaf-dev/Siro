# مصفوفة التتبع (TRACEABILITY) — كل نقطة قلتها ← أين نُفّذت

> تُغلق مع المرحلة 4 (2026-10-30). **الحالة:** ✅ منفّذ ومتحقق منه بدليله · PARTIAL منفّذ جزئيًا بما غاب مسمّى · UNVERIFIED سببه صريح (لا ادّعاء نجاح). أرقام الاختبارات في `docs/UNIFIED_PLAN_AR.md` («سجل المرحلة 4»).

| # | النقطة بكلامي | القسم | المعرّفات | الاختبار المطلوب | الملف/المكوّن | الحالة | الدليل / السبب |
|---|---|---|---|---|---|---|---|
| 1 | «منصة كاملة مكتملة» | 1.1–1.3 | HUB، خريطة المنصات | TST-06 | `web/src/pages/Kitchen.tsx` (HUB) + `core/registry.ts` | ✅ | browser-smoke «المطبخ: HUB بـ26 مكوّنًا» |
| 2 | صفحة A1 تشبه متجر تقضّي | 5.1 | A1-01…A1-23 | AC-01، J1 | `web/src/pages/KitchenStore.tsx` | ✅ | J1 (browser-smoke) |
| 3 | كل عنصر فيه اسمه | 5.1، S1 | A1-01 | AC-01 | `shared/kitchen/data/ingredients.ts` | ✅ | tests/kitchen-engines.test.ts |
| 4 | وصورته | 5.1، 8.2 | A1-01، API-22/30 | AC-12 | إيموجي + ألوان البطاقات (AS-13) | UNVERIFIED | صور مرخّصة من APIs أو من لوحتك لم تُسلَّم ولا يمكن التحقق منها هنا؛ الأيقونة/الإيموجي هي التراجع الموثّق (API-22) |
| 5 | ووصف قصير | 5.1، S1 | A1-01 | AC-01 | بيانات محسوبة (AS-12) لا نص مختلق | ✅ | قرار N-09: لا «وصف قصير» مختلق |
| 6 | عند الضغط على العنصر أحدّد الكمية | 5.1 | A1-10/11 | AC-01 | `KitchenStore.tsx` لوحة المنتج | ✅ | J1 |
| 7 | **حسب وحدة العنصر** | 5.1، 4.3 | A1-11، UNIT-xx | AC-01 | `shared/kitchen/units.ts` + `shop.ts` | ✅ | AC-01 |
| 8 | تتحدث العناصر الغذائية **من العنصر نفسه** | 5.1، 4.4 | A1-12، NUT-01…07 | AC-01، TST-01 | `shared/kitchen/nutrition.ts` | ✅ | AC-01 (986 سعرة لدستة بيض) + tests/kitchen-golden |
| 9 | والمبلغ الذي سيكلّفني شراؤه | 5.1، 4.5 | A1-12، COST-01…06 | AC-01 | `shared/kitchen/cost.ts` | ✅ | AC-01 (RM 10.00 من Mydin) |
| 10 | الأسعار مأخوذة من هذه المحادثة | 2.7، S3 | KB-2.7 | TST-02 | `shared/kitchen/data/prices.ts` (S3 تقديرية موسومة) | ✅ | tests/kitchen-api «يبذر الأسعار» |
| 11 | ويمكن تحديثها من B1 | 5.5 | B1-01…B1-12 | AC-03، J2 | `KitchenPrices.tsx` + `server/kitchenRoutes.ts` | PARTIAL | J2/AC-03؛ غير منجز من B1: CSV وضع الإيصال PriceCatcher حجم العبوة تبويب المتاجر (AS-23) |
| 12 | «إضافة» تضيف إلى السلة | 5.1، 5.2 | A1-13، CART-01 | J1 | `KitchenCart.tsx` | ✅ | J1/J8 |
| 13 | المتجر فيه **فلترة** | 5.1 | A1-20 | J1 | `KitchenStore.tsx` فلاتر | ✅ | J1 |
| 14 | وفيه **بحث** | 5.1، 4.9 | A1-21، SRCH-xx | AC-02 | `shared/kitchen/search.ts` | ✅ | AC-02 (بيض/بَيض/egg/telur) |
| 15 | السلة فيها الأغراض التي أضفتها | 5.2 | CART-01 | J8 | `KitchenCart.tsx` | ✅ | J8 |
| 16 | مجموع الأسعار | 5.2 | CART-02/03 | J8 | `shared/kitchen/shop.ts` cartTotals | ✅ | J8 |
| 17 | ومجموع العناصر الغذائية | 5.2 | CART-02 | J8 | `shop.ts` cartTotals.nutrition | ✅ | J8 |
| 18 | **وماهية الوجبات التي يمكن صنعها منها** | 5.2، 4.8 | CART-04، FEA-xx | J8، TST-05 | `shared/kitchen/feasibility.ts` | ✅ | J8 + TST-05 |
| 19 | B1: تحديث أسعار المنتجات التي تظهر في المتجر | 5.5 | B1-01/02 | AC-03 | `KitchenPrices.tsx` | ✅ | AC-03 |
| 20 | أي تحديث يغيّر السعر في المتجر **تلقائياً ومباشرة** | 5.5، 3.9 | B1-03، ARC-05، PERF-05 | AC-03، J2 | `web/src/kitchen/store.ts` (BroadcastChannel+SSE) | ✅ | J2: 5ms/44ms/41ms ≤ 300/1000/3000 |
| 21 | A2: جميع الأطباق التي فُهمت في المحادثة | 6.1، S2 | A2-01…، DEF-xx | TST-02 | `shared/kitchen/data/recipes.ts` (12 حرفيًا) | ✅ | tests/kitchen-golden + J3 |
| 22 | بالصورة التي تخصها | 6.1، 8.2 | A2-05، API-22 | AC-12 | إيموجي/أيقونة (AS-13) | UNVERIFIED | صورة لوحتك المقتطعة لم تُسلَّم؛ لا صور مرخّصة |
| 23 | والمكونات اللازمة لكل وجبة | 6.1، S2 | A2-10 | TST-02 | `KitchenCodex.tsx` ظهر البطاقة | ✅ | J3 |
| 24 | وطريقة التحضير لكل وجبة | 6.1، S2 | A2-11 | TST-02 | `KitchenCodex.tsx` + `steps_original` | ✅ | J3 + golden (عبارات S2 حرفية) |
| 25 | «قاموس وجبات… كتاب وصفات» | 6.1 | A2-01 | J3 | `KitchenCodex.tsx` | ✅ | J3 |
| 26 | فطورية وغدائية وعشائية | 6.1 | A2-20 | J3 | `KitchenCodex.tsx` فلتر نوع الوجبة | ✅ | J3 |
| 27 | **وكأنها بطاقات كروت لاعبين فيفا** | 6.1، 6.2 | A2-01…27، MC-10…12 | J3 | `shared/kitchen/cards.ts` MC-10 | ✅ | J3 + tests (11 بطاقة ذهبية) |
| 28 | كلها في منصة شاملة = **مطبخ** | 1.3، 7.1 | HUB، K | VS-1 | `Kitchen.tsx` + `KitchenCook.tsx` | ✅ | VS-1 |
| 29 | ما ذُكر أعلاه **قوائم**، والصفحة الحقيقية هي المطبخ | 1.3، 7.1 | KIT-01 | VS-1 | `web/src/kitchen/cook/*` | ✅ | VS-1 |
| 30 | طاولة في مطبخ | 7.2 | KIT-10 | J4 | `cook/world/*` + `kitchen-world.glb` | ✅ | WORLD-1 |
| 31 | **أسحب وأرمي** (drag & drop) | 7.3 | KIT-20/25/26 | J4/J5 | `cook/world/Game.ts` إمساك لاصق وإفلات + لوحة الإجراءات | ✅ | WORLD-1 + A11Y-10 (الحركة بالفأرة؛ اللمس على الجوال عبر لوحة الإجراءات) |
| 32 | وأطبخ وأُنشئ الأطباق التي أبقاها | 7.1، 7.4 | KIT-01، SIM-xx | J5 | `shared/kitchen/sim/*` + `server/kitchenCook.ts` | ✅ | VS-1 + tests/kitchen-sim |
| 33 | «وتنظاف وتتحدث» (تُضاف وتُحدَّث في A2) | 6.3 | MC-04/05، A2-25 | TST-05 | `server/kitchenCook.ts` /cook/serve + «ابتكاراتي» | ✅ | VS-1 + tests/kitchen-cook-api |
| 34 | **عدة APIs مجانية**: طعام، مكونات، وصفات، صور | 8.1، 8.2 | API-01…API-32 | TST-08 | `server/enrich.ts` + `shared/kitchen/enrich.ts` + `Enrichment.tsx` | UNVERIFIED | البوابة والمحوّلات (USDA وOpen Food Facts) منفَّذة ومُختبَرة بـfetch وهمي؛ الخدمات الحيّة لم تُتحقَّق (الشبكة محجوبة) فهي معطّلة افتراضيًا. TheMealDB وSpoonacular وPexels وFreesound… غير منفَّذة (انظر API_CATALOG.md) |
| 35 | والموقع يُظهر الطبخة **من خلال عمليات تحركاتي** | 7.4 | SIM-02 (op-log)، MC-20/30 | AC-06 | `sim/opLog` + `phrases.ts` | ✅ | AC-06 (حتمية) + tests/replay |
| 36 | كأني ألعب لعبة 3D | 7.2، 7.7 | KIT-xx، 3D-xx | PERF-03 | `cook/Scene3D.ts` + GLB | ✅ | PERF-20 مقاس (draw calls 43/112 ≤ 150)؛ UNVERIFIED: سرعة GPU الحقيقية (SwiftShader فقط) |
| 37 | **رمز محفظة في الأعلى بالمبلغ المسموح بصرفه** | 5.4، 7.3 | WAL-01…05، KIT-27 | AC-04 | `KitchenChips` + `KitchenWallet.tsx` | ✅ | AC-04 |
| 38 | **ومكوناتي الموجودة معي لأني اشتريتها** | 5.3 | PAN-01…05، KIT-21 | AC-04 | `KitchenPantry.tsx` | ✅ | AC-04 |
| 39 | نهاية السيناريو: **إنشاء بطاقات وجبات** | 6.3 | MC-01…06 | AC-05 | `shared/kitchen/cards.ts` + `server/kitchenCook.ts` | ✅ | AC-05 (532 سعرة) |
| 40 | تُستعمل للإضافة إلى **الجدول** | 8.6 | CAL-30/31 | J6 | `web/src/calendar/DayMeals.tsx` + `pages/CalendarMeals.tsx` | ✅ | J6 (browser-smoke «J6/J7 من الجدول») |
| 41 | منصة أخرى **خارج هذه المنصة** | 8.3 | CAL-01 | — | `docs/kitchen/CONFLICT_REGISTER.md` C5 | ✅ | — |
| 42 | «أعتقد موجودة بس مدري» (الخطة القديمة) | 0.7، 8.3 | CAL-01، CONFLICT_REGISTER | تقرير M0 | `CONFLICT_REGISTER.md` C5/C7 | ✅ | تقرير المرحلة 0 + UNIFIED_PLAN |
| 43 | **منصة جدول مستقلة شاملة لجدولي** | 8.5 | CAL-20…25 | K-M9 | `pages/Calendar.tsx` + `shared/calendar/*` + `server/calendarRoutes.ts` | ✅ | tests/calendar-core + calendar-api + CAL-1/2/3 |
| 44 | **مطابقة تماماً لـOutlook Calendar** | 8.4، 8.5 | CAL-02، CAL-10…19، CAL-23 | CAL-18 | `shared/calendar/laws.ts` (CAL-10…19) + عرض شبكي | UNVERIFIED | لا حساب Outlook حقيقي هنا: القوانين والثلاثية والشبكة منفَّذة ومُختبَرة على بيانات النظام الحقيقية ولقطات ICS، لكن المطابقة البصرية/الزمنية مع Outlook نفسه لم تُجرَّب (Graph UNVERIFIED) |
| 45 | أضيف الوجبات لأحداث فطور/غداء/عشاء | 8.6 | CAL-30…38 | J6، AC-09 | `DayMeals.tsx` + `CalendarMeals.tsx` + `mealEventsOf` | ✅ | J6 + AC-09 + calendar-meals |
| 46 | «وهذا هو الهدف من ذلك» | 1.2، 1.8 | VS-1 | VS-1 | VS-1 كاملة + الجدول + الاقتراحات | ✅ | VS-1 + J6 + PROP-1 |
| 47 | مطبخ **يبدو ممتازاً** | 7.2، 7.7 | KIT-10، 3D-20/30 | K-M8 | `tools/blender/*` + GLB | UNVERIFIED | تقييم «يبدو ممتازًا» ذاتي: الأصول مبنية بالكود/بلندر، والحكم البصري لك على جهازك |
| 48 | **رفوف المكونات** | 7.2 | KIT-10 | J4 | `kitchen-world.glb` رفوف | ✅ | WORLD-1 |
| 49 | المكونات بالأيقونات أو الصور المناسبة | 7.2، 8.2 | KIT-10، API-22 | AC-12 | إيموجي (AS-13) | UNVERIFIED | صور مرخّصة لم تُسلَّم |
| 50 | أسحبها | 7.3 | KIT-20 | J4 | `Game.ts` | ✅ | WORLD-1 |
| 51 | **ويظهر السكين والأدوات الأخرى** | 7.3 | KIT-10، كتالوج الأدوات | J4 | `kitchen-world.glb` أدوات + سكين | ✅ | WORLD-1 (قطع بالسكين) |
| 52 | **وأنواع المعالق** | 7.3 | كتالوج الأدوات (ملاعق) | J4 | `sim/itemRules.ts` + `tools.py` (ملاعق) | ✅ | tests/kitchen-sim + WORLD-1 |
| 53 | كأني في مطبخ حقيقي | 7.4 | SIM-01…19 | SIM-50 | `shared/kitchen/sim/*` | ✅ | SIM-50 ±20% (tests/kitchen-sim) |
| 54 | **أقدر أقطّع الطماطم أو أي شيء يُقطَّع في الحقيقة** | 7.3 | جدول المكونات ← الأفعال | TST-04 | `sim/itemRules.ts` prep | ✅ | TST-04 + WORLD-1 |
| 55 | **الطهي على الموقد** | 7.2، 7.4 | KIT-10، نموذج الحرارة | SIM-50 | `sim/heat.ts` | ✅ | SIM-50 |
| 56 | الموقد **يبدو جميلاً** ويُطهى فيه | 7.2، 7.7 | 3D-30 (لهب، بخار) | K-M8 | لهب ومقبض موقد + بخار (`Scene3D.ts`) | PARTIAL | المقبض واللهب مفحوصان (WORLD-1)؛ جمال المؤثرات UNVERIFIED (حكم بصري) |
| 57 | **العنصر يتغير حسب التأثيرات الحقيقية للطهي** | 7.4 | SIM-10…19، 3D-20 | SIM-50، TST-04 | `sim/*` نضج/تحمير/حرق | ✅ | TST-04 |
| 58 | **ويختلف بحسب المعدّة: مقلاة، قدر ضغط، قدر طهي** | 7.3، 7.4 | كتالوج المعدات، SIM-16 | TST-04 | `sim/*` قدر ضغط/مقلاة/قدر | ✅ | TST-04 + SIM-16 |
| 59 | **رف للمعدات ورف للأدوات** | 7.2 | KIT-10 | J4 | `kitchen-world.glb` | ✅ | WORLD-1 |
| 60 | «لعبة مطبخ كاملة ومكتملة وشاملة» | 7.1 | KIT-01/02 | K-M7 | `web/src/kitchen/cook/*` | ✅ | VS-1 |
| 61 | «هدفها النهائي معروف» | 1.2، 1.8 | VS-1 | VS-1 | VS-1 | ✅ | VS-1 |
| 62 | مفاتيح API **مجانية** وما نقدر عليه | 8.1، 8.2 | API-01…06، API_KEYS_NEEDED | TST-08 | `docs/kitchen/API_KEYS_NEEDED.md` + `server/enrich.ts` | UNVERIFIED | لا مفتاح لميزة P0؛ المفاتيح اختيارية ولم تُجرَّب حيًّا |
| 63 | «أو إذا نقدر نبرمجها بأنفسنا من الأكواد» | 8.1 | API-02 (المسار الحرج محلي) | AC-15 | بذرة محلية بالكامل (API-02) | ✅ | AC-15 جزئيًا: القراءة من البذرة؛ لا outbox بلا اتصال (AS-23) |
| 64 | **الاستعانة ببلندر لتكوين المطبخ 3D** | 7.7 | 3D-10…50، BLENDER_PIPELINE | K-M8 | `tools/blender/*` + `BLENDER_GUIDE_AR.md` | ✅ | tests/kitchen-assets + kitchen-world |
| 65 | **«علينا التفكير بكيفية ربط بلندر»** | 7.7 | جدول خيارات الربط + D-09 | BLENDER_GUIDE_AR | `docs/kitchen/3D_CONNECTORS_AR.md` + `BLENDER_GUIDE_AR.md` | ✅ | D-09 |
| 66 | «والله أعلم في حين أردنا فعل ذلك» (بلندر ليس شرطاً مسبقاً) | 7.7 | سلّم البدائل A…F | RISK-02 | سلّم الأصول (إجرائي ← بلندر) | ✅ | AS-31 |
| 67 | برومبت عميق ومفصّل بشكل ممل، بلا نسيان أي نقطة | 0.5، 10.1 | REQUIREMENTS_REGISTRY | تقرير M0 | هذه المصفوفة | ✅ | — |
| 68 | **قانون السعرات 1200–1500** (قاعدة من مدرّبي) | 2.3، 4.6 | LAW-01…09، N-04، G-05 | AC-07، J7 | `shared/kitchen/law.ts` (الثوابت الوحيدة) | ✅ | AC-07 + LAW-01 (مسح الثوابت) + J7 |
| 69 | «في الجدول أو في أي مكان آخر» | 4.6، 8.6 | LAW-02 (كل السطوح) | AC-07 | كل السطوح: الخطة/الدورة/الاقتراحات/الجدول/Outlook المقروء | ✅ | AC-07 (مسح نقطتي الحفظ) + outlookDayLaw + cycle |
| 70 | قائمة مكوناتي فقط (26) | 2.2، S1 | N-01، G-04، KIT-70 | AC-11 | `shared/kitchen/data/ingredients.ts` (26) | ✅ | AC-11 (DB+بذرة+دورة+تسوّق+مقارنة الإثراء) |
| 71 | «ليش سويت خطة خسارة وزن وأنا ما قلت لك» | 0.12، 2.10 | N-02، RISK-12 | AC (فحص نصي) | اختبار نصي على الشيفرة (N-02) | ✅ | tests/calendar-meals «N-02» |
| 72 | الأسواق الخمسة بالاسم | 2.7، S3 | KB-2.7، B1-11 | CART-03 | `shared/kitchen/data/stores.ts` | ✅ | CART-03 + J8 |

**الملخص:** ✅ 63 · PARTIAL 2 · UNVERIFIED 7 من 72.

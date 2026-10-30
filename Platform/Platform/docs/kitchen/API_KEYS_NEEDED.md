# المفاتيح والمتغيرات المطلوبة (API-32)

> **لا ميزة P0 تطلب مفتاحًا.** كل ما يلي اختياري: بدونه تعمل المنصة 100% من البذرة المحلية. المتغيرات على **الخادم** وحده (لا تصل المتصفح ولا تُرتكب). محليًا: عرّفها في بيئة تشغيل `node server` (أو قبل `start.bat`)؛ على Vercel: Project → Settings → Environment Variables.

| المتغير | الخدمة | لماذا | كيف تحصل عليه | ما يتوقف إن غاب |
|---|---|---|---|---|
| `SIRO_ENRICH_ENABLED=1` | بوابة الإثراء | مفتاح التشغيل العام | قيمة ثابتة | كل `/api/enrich/*` يردّ 503 (لا أثر على غيره) |
| `SIRO_USDA_KEY` | USDA FoodData Central (API-10) | مقارنة قيم الجدول S4 بـUSDA كاقتراحات | سجّل مجانًا في https://fdc.nal.usda.gov/api-key-signup.html ثم انسخ المفتاح من البريد | بحث USDA والمقارنة فقط |
| `SIRO_USDA_DAILY_CAP` | — | سقف يومي محلي (افتراضي 200) | رقم | — |
| `SIRO_OFF_DAILY_CAP` | Open Food Facts (API-11) | سقف يومي محلي (افتراضي 100) | رقم؛ لا مفتاح للخدمة | — |
| `SIRO_GRAPH_TOKEN` | Microsoft Graph (API-19) | قراءة تقويم Outlook (زر «زامن Outlook») | تطبيق Azure AD بنطاق `Calendars.Read` فقط (قراءة)؛ الرمز قصير العمر ولا تجديد تلقائي (AS-44) | المزامنة فقط؛ بقية الجدول يعمل بالاستيراد/القالب |
| `SIRO_GRAPH_CALENDARS` | Microsoft Graph | قائمة التقاويم: `[{"id":"…","name":"دراسة"},…]` | معرّفات التقاويم من Graph Explorer (`/me/calendars`) | المزامنة فقط |

**خطوات الاستيراد اليدوي بلا Graph (الأسهل):** في Outlook صدّر كل تقويم من «ملف ← حفظ التقويم» بصيغة ICS، ثم في `/calendar` اضغط «استيراد لقطة» واختر الملف (يُفرَد المتكرر ضمن 23 أكتوبر 2026 → 7 فبراير 2027).

**أعلام الواجهة** (الإعدادات ← ميزات تجريبية): `kitchen.apis.extended` يُظهر بطاقة الإثراء في `/kitchen`، و`calendar.outlook.read` يُظهر زر «زامن Outlook»، و`calendar.outlook.proposals` (مفعّل) يُظهر اقتراحات Outlook.

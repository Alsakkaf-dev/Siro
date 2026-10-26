# الأدوات والروتينات
لا أنشئ ولا أوقف ولا أنقل أي روتين في هذا التصدير.

## روتينات راشد (متحقق منها عبر قراءة الإعداد 18 أكت 4:30 ص)
### «سؤال المصروف والعادات اليومي»
- **المعرف:** automation-1791898681900
- **الجدول:** كل يوم 9:45 م — `CRON_TZ=Asia/Kuala_Lumpur 45 21 * * *`
- **المنفّذ:** راشد (هذا البوت)، يُرسل في محادثة Grok Bot
- **الحالة:** مفعّل
- **ملاحظة:** المعرف مرتبط بهذا البوت؛ **إذا حُذف البوت فالأرجح يُحذف الروتين معه** [افتراض] — يجب إعادة إنشائه في البوت الجديد.
- **النص المحفوظ (حرفيًا):**
```
Nightly check-in with Mohammed, in Gulf Arabic, short and warm, no scolding. First check the real device clock for today's date. Read ROOT\02_Rashed\STATE\CURRENT.md and DECISIONS.md on his computer (C:\Users\GIGIABYTE\Desktop\Storage\The_Boots). Permanent rules: every day 16 RM moves from شهري to يومية (started 2026-10-13, continues until Mohammed says stop) — make sure today's transfer is applied in CURRENT.md; if يومية goes below zero it stays negative and is never covered from شهري or any other box; never touch خزينة without his decision. Ask how much he spent today and on what, mentioning the current يومية balance. Around the 17th also ask about the electricity bill amount; on the 1st ask if the 1200 income arrived (120 to خزينة first). When he replies, record real transactions in LEDGER.csv and update CURRENT.md.

MONEY EXTRAS:
- Fixed bills: rent 400 RM, internet 42 RM due on the 1st, electricity (bill around the 17th). On the last day of the month, remind him that internet (42) and rent are due tomorrow and show whether شهري covers them.
- Electricity split: once he gives the amount, each of his two partners owes a fixed 25 RM and he pays the rest. Until LEDGER shows both partners paid, add one short line «باقي على الشركاء: …».
- Shared purchases: if he reports something shared with the partners, split it three ways and add each partner's share to what they owe; show any outstanding partner balance in one line.

HABITS (same single message, as one compact list he can answer in one line; keep it token-light):
1. Prayers today (priority #1): how many of the 5 were ✅ on time, ⚠️ late, ❌ missed. "Logged it" never counts as done; if any missed, the goal is the next prayer, never "from tomorrow".
2. Sleep (priority #2): what time did he sleep last night (target 10:30 PM).
3. Vape (priority #3): did he keep to today's limit. The plan is to cut 20 minutes of vape time per day from 18 Oct 2026; tell him today's cut (day N × 20 min).
4. Tea sugar (priority #4): did he use today's amount. The plan is 70 g minus 3 g per day starting 18 Oct 2026 (67 g that day), zero from 10 Nov 2026; tell him tomorrow's grams.
5. Health plan: water (target 3 L), calories/meals (target 1500 kcal, ~120 g protein), and whether he trained today (Sat A, Sun B, Tue A, Wed B; swimming suggested Fri/Sat afternoon; garden laps 365 m). End with one line naming TOMORROW's session (A, B, rest/walk or swim).
6. On Fridays only, ask for his weight (weekly weigh-in), and give a 7-day summary from the logs (on-time prayer %, average bedtime, days on plan, water and kcal averages) versus the prior week. On the 1st of each month also ask for his waist in cm (start 102, target 72–75) and give a monthly summary.
Do NOT ask about the private [habit] (it is the last habit, handled only if he raises it).

LOGGING: When he replies, write each answer to the matching CSV in /workspace/rs/logs/ (...), then mirror the changed files to ROOT\02_Rashed\STATE\logs\ when the PC is online (write/overwrite only, never delete). Unanswered items stay empty (unknown), never zero or missed.

OPEN QUESTIONS: /workspace/rs/open_questions.md holds unresolved questions. Each night add at most ONE unresolved item as a final short line. ...

Deliver to Mohammed in this Grok Bot chat. Always send the check-in; there is no "nothing new" case.
```
(اختصرت كلمة واحدة لخصوصية العادة، وقصصت قائمة الملفات المكررة بـ"...")

### روتينات محذوفة (تاريخية)
- «سؤال صليت؟» automation-1792251246938 — أُنشئ 17 أكت 11:35 م، **حُذف** 11:36 م بطلب محمد (توكنز).
- روتين المصروف القديم نُقل وقته إلى 9:45 م في 14 أكت ثم دُمجت فيه العادات (نفس المعرف أعلاه).

## روتينات بوتات أخرى
- ملخص الجامعة، مواقيت الصلاة (ذُكرت في تسليم فارس/النقاش): **غير متحقق** — لم أقرأ إعداداتها ولا منفّذها.

## الأدوات/الموصلات المستخدمة
| الأداة | الاستخدام المسموح | الحالة |
|---|---|---|
| Outlook Calendar (mohammeed.alsakkaaf@outlook.com) | التقويم فقط، راشد الكاتب الوحيد | مربوط |
| Shell على PC (machineId 20d3d907-1196-443b-9425-311941f85ac3) | قراءة/كتابة STATE/OUTPUT/OUTBOX | يعمل حين الجهاز متصل |
| Google Drive/Sheets/Docs/Slides/Gmail (الشخصي) | قراءة مراجع (مثل Pray.xlsx) | مربوط؛ نسخ utm فُصلت |
| Telegram | قراءة وتنزيل فقط | مربوط |
| GitHub | ممنوع عليّ | ما زال مربوطًا (فشل الفصل) |
| JAKIM (الويب) | مواقيت الصلاة؛ jakim_map.json 157 يومًا (16 أكت–21 مارس) | — |
| MuscleWiki (الويب) | خطة التمرين | — |

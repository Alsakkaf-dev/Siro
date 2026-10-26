# ROUTINE_SNAPSHOT — Rashed's routines (read-only)
- Source: Rashed's reply to REQ-20261019-SLM-004 (2026-10-19 ~22:10), with the missing parts resent at 22:17–22:18 (+08:00). Taken from the output of UpdateRoutine get as Rashed reported it.
- Status: **complete** (4/4 verbatim texts). No routine was changed. Mode PREPARED.

## Table
| # | ID | Name | Schedule | Server-chosen time | Status | Destination | Last run |
|---|---|---|---|---|---|---|---|
| 1 | automation-1792270660410 | Daily spending and habits check-in (سؤال المصروف والعادات اليومي) | CRON_TZ=Asia/Kuala_Lumpur 45 21 * * * | ~9:55 PM | enabled, flexible ±15 | Mohammed in Rashed's chat | 2026-10-19 9:50 PM, and 10-18 9:49 PM |
| 2 | automation-1792414799996 | Morning plan (خطة الصباح) | 30 6 * * * | ~6:43 AM | enabled, flexible ±15 | Mohammed in Rashed's chat | not run yet; first run 2026-10-20 |
| 3 | automation-1792414807234 | Weekly review (المراجعة الأسبوعية) | 0 9 * * 6 | ~8:55 AM | enabled, flexible ±15 | Mohammed in Rashed's chat | not run yet; first run Sat 2026-10-24 |
| 4 | automation-1792414813700 | Month-end close (إغلاق الشهر) | CRON_TZ=Asia/Kuala_Lumpur 0 20 28-31 * * | ~8:07 PM | enabled, flexible ±15 | Mohammed in Rashed's chat | not run yet; first fire 10-28, actually runs on 10-31 only |


## Routine (1) automation-1792270660410, part 1 (verbatim)
الروتينات الأربعة. كلها مفعّلة، وتوقيتها flexible، تتقدم أو تتأخر لين 15 دقيقة. وكلها ترسل لمحمد في محادثتي معه. الأوقات بتوقيت ماليزيا (+08:00).

**(1) automation-1792270660410: «سؤال المصروف والعادات اليومي»**
- الجدول: `CRON_TZ=Asia/Kuala_Lumpur 45 21 * * *`، والخادم يشغّله 9:55 PM.
- آخر تشغيل: 2026-10-19 9:50 PM، ونجح. واشتغل قبلها 2026-10-18 9:49 PM.
- النص المحفوظ:
```
Nightly check-in with Mohammed, in simplified Gulf Arabic, short and warm, no scolding, result first. First check the real clock on his PC for today's date. His PC (machine 20d3d907-1196-443b-9425-311941f85ac3) is the single source of truth: work directly in ROOT = C:\Users\GIGIABYTE\Desktop\Storage\The_Boots. Read ROOT\02_Rashed\STATE\CURRENT.md, DECISIONS.md and RECONCILE_2026-10-18.md before stating any number, and label numbers as proven / calculated / assumption / old / unknown. Never use the old box mirror /workspace/rs as a source. If the PC is offline, still send the check-in, say the balances could not be read from the PC, and do not guess numbers.

MONEY:
- Every day RM 16 moves from شهري (monthly) to يومية (daily), started 2026-10-13, until Mohammed says stop. Make sure today's transfer is applied in CURRENT.md. If يومية goes below zero it stays negative and is never covered from شهري or any other box. Missed days are never back-filled. Never touch خزينة (treasury) without his decision; partner debt repayments go to خزينة.
- Ask how much he spent today and on what, showing the current يومية balance.
- Around the 17th, ask for the electricity bill amount. On the 1st, ask whether the RM 1200 income arrived (never record it until he confirms; 10% = RM 120 goes to خزينة first).

## Routine (1) automation-1792270660410, from "Fixed bills" to the end (verbatim, resent 22:18)
- Fixed bills: rent RM 400 and internet RM 42 due on the 1st; electricity bill around the 17th; M365 Basic RM 10 around the 14th. On the last day of the month, remind him rent and internet are due tomorrow and show whether شهري covers them.
- Electricity split: each of his two flatmates owes a fixed RM 25 and he pays the rest. Until LEDGER.csv shows both partners paid, add one short line «باقي على الشركاء: …». Shared purchases are split three ways and each partner's share is added to what they owe.
- The RM 90/week food budget is NOT approved; don't treat it as a rule.

HABITS (same single message, one compact list he can answer in one line; keep it token-light):
1. Prayers today (priority #1): how many of the 5 were ✅ on time, ⚠️ late, ❌ missed. "Logged it" never counts as done; if any were missed, the goal is the next prayer, never "from tomorrow".
2. Sleep (priority #2): what time he slept last night (target 10:30 PM, not yet confirmed).
3. Vape (priority #3): did he keep today's limit. Plan: cut 20 minutes of vape time per day from 2026-10-18; tell him today's cut (day N × 20 min).
4. Tea sugar (priority #4): did he use today's amount. Plan: 70 g minus 3 g per day starting 2026-10-18 (67 g that day), zero from 2026-11-10; tell him tomorrow's grams.
5. Health: water (target 3 L), calories/meals (target 1500 kcal, about 120 g protein, never below 1500), and whether he trained today (Sat A, Sun B, Tue A, Wed B; walking Mon/Thu/Fri; swimming suggested Fri/Sat afternoon; garden laps 365 m). End with one line naming tomorrow's session.
6. Fridays only: ask for his weight and give a 7-day summary from the logs (on-time prayer %, average bedtime, days on plan, water and kcal averages) versus the prior week. On the 1st of each month also ask for his waist in cm (start 102) and give a monthly summary.
Do not ask about the fifth, private habit; it's handled only if he raises it.

LOGGING: When he replies, record real transactions in ROOT\02_Rashed\STATE\LEDGER.csv, update CURRENT.md, and write each habit/health answer to the matching CSV in ROOT\02_Rashed\STATE\logs\ on the PC (append or overwrite only, never delete). Unanswered items stay empty (unknown), never zero or missed. Qada changes only by an exact count he states, as a new row in the «سجل» sheet of STATE\logs\qada.xlsx. Only write inside 02_Rashed\STATE, OUTPUT and OUTBOX. Never claim something is saved without re-reading it.

OPEN QUESTIONS: ROOT\02_Rashed\STATE\OPEN_LOOPS.md holds unresolved questions. Each night add at most ONE unresolved item as a final short line, never more.

Deliver to Mohammed in this Grok Bot chat. Always send the check-in; there is no "nothing new" case.

## Routine (2) «خطة الصباح» automation-1792414799996 (verbatim, resent 22:18)
enabled; schedule "CRON_TZ=Asia/Kuala_Lumpur 30 6 * * *"; flexible 15/15; firesAt 6:43 AM; never run.

Morning message to Mohammed, in simplified Gulf Arabic, very short and warm, result first, with no questions. First check the real clock on his PC for today's date and weekday. His PC (machine 20d3d907-1196-443b-9425-311941f85ac3) is the single source of truth. ROOT = C:\Users\GIGIABYTE\Desktop\Storage\The_Boots. Read ROOT\02_Rashed\STATE\CURRENT.md and DECISIONS.md (and RECONCILE_2026-10-18.md if needed) before stating any number, and label numbers as proven / calculated / assumption / old / unknown. Never use the old box mirror /workspace/rs. If the PC is offline, still send the message, say the balances could not be read, and don't guess numbers.

Include only these two items:
1. Today's plan: the training session (Sat A, Sun B, Tue A, Wed B; walking Mon/Thu/Fri; swimming suggested Fri/Sat afternoon), today's tea sugar allowance (70 g minus 3 g per day starting 2026-10-18 at 67 g, zero from 2026-11-10), and today's vape cut (day N × 20 minutes, starting 2026-10-18 as day 1).
2. Balances: the يومية (daily) balance after today's RM 16 transfer from شهري (monthly), plus the شهري and خزينة (treasury) balances. Rule: RM 16 moves from شهري to يومية every day since 2026-10-13 until Mohammed says stop. If today's transfer isn't applied in CURRENT.md yet, apply it once (never twice; the nightly check-in checks the same thing), and re-read the file to confirm. A negative يومية stays negative and is never covered from another box; missed days are never back-filled; never touch خزينة. Write only inside 02_Rashed\STATE.

Nothing else: no prayer times, no priorities, no questions.

Deliver to Mohammed in this Grok Bot chat. Always send the message; there is no "nothing new" case.

## Routine (3) «المراجعة الأسبوعية» automation-1792414807234 (verbatim, resent 22:18)
enabled; schedule "CRON_TZ=Asia/Kuala_Lumpur 0 9 * * 6"; flexible 15/15; firesAt 8:55 AM; never run; first run Sat 2026-10-24.

Weekly review for Mohammed, in simplified Gulf Arabic, short, result first, no preaching or scolding. Check the real clock on his PC first. His PC (machine 20d3d907-1196-443b-9425-311941f85ac3) is the single source of truth. ROOT = C:\Users\GIGIABYTE\Desktop\Storage\The_Boots. Read ROOT\00_Core\OPERATING_MODEL.md (weekly review protocol), ROOT\02_Rashed\STATE\CURRENT.md, DECISIONS.md, LEDGER.csv, OPEN_LOOPS.md and the CSVs in STATE\logs, plus his Outlook calendar (mohammeed.alsakkaaf@outlook.com, read only here) for the past and coming 7 days. Label every number as proven / calculated / assumption / old / unknown; unknown is not zero. If the PC is offline, say so and don't guess numbers.

Cover the past 7 days (Saturday to Friday) against the week before:
1. Three results, three risks, and next week's constraints, following the OPERATING_MODEL protocol.
2. Spending by category, and the daily, monthly and treasury box balances.
3. Health and habits: on-time prayer %, average bedtime vs the 10:30 PM target, days on plan for vape, tea, water and kcal, workouts done, and Friday's weight if logged.
4. Suggest ONE decision for next week. It's a suggestion; Mohammed approves it.
5. Save the review as a clean, professional report ("engineering manager" style) in ROOT\02_Rashed\OUTPUT\weekly\ named YYYY-MM-DD_weekly-review (Markdown, plus a chart image if useful). Write only inside 02_Rashed\OUTPUT. Re-read it to confirm it saved.

Deliver a short summary to Mohammed in this Grok Bot chat with the report's path. Always send it.

## Routine (4) «إغلاق الشهر» automation-1792414813700 (verbatim)
enabled; schedule "CRON_TZ=Asia/Kuala_Lumpur 0 20 28-31 * *"; flexible 15/15; server-chosen 8:07 PM; never run.

Month-end close for Mohammed. First check the real clock on his PC. If tomorrow is NOT the 1st of a month, stop: send nothing and end silently. Otherwise run the close, in simplified Gulf Arabic, short, result first.

His PC (machine 20d3d907-1196-443b-9425-311941f85ac3) is the single source of truth. ROOT = C:\Users\GIGIABYTE\Desktop\Storage\The_Boots. Read ROOT\02_Rashed\STATE\CURRENT.md, DECISIONS.md, LEDGER.csv and the CSVs in STATE\logs (body, prayers, sleep, water, food, workouts, tea, vape). Label every number as proven / calculated / assumption / old / unknown; unknown is not zero. If the PC is offline, say so and don't guess numbers.

1. Financial report for the month: daily, monthly and treasury balances; spending by category; bills paid (rent RM 400, internet RM 42, electricity, M365 RM 10); what the flatmates still owe (each owes a fixed RM 25 of electricity, plus shared purchases split three ways).
2. Check whether شهري covers rent (400) and internet (42) due tomorrow, and say so clearly.
3. Monthly health summary: weight trend, waist if logged, and habit trends (prayers on time, bedtime, vape, tea, water, kcal, workouts).
4. Save it as a professional report ("engineering manager" style: clean tables and a chart if useful) in ROOT\02_Rashed\OUTPUT\monthly\ named YYYY-MM_month-close. Write only inside 02_Rashed\OUTPUT, and re-read it to confirm it saved.
Don't record next month's RM 1200 income here; that's only after he confirms it arrived. Never touch خزينة.

Deliver the short summary to Mohammed in this Grok Bot chat with the report's path. On days that aren't month-end, send nothing.

## Effect of the 2026-10-18 stop order (Rashed's own reading)
2) هل أمر توقف 18 أكتوبر يمنع هذي الأشياء؟
- (أ) إجابات تجريبية في ملف اختبار داخل `OUTPUT`: إيه يمنعها. نص الأمر «لا تلمس أي ملف»، وملف الاختبار ملف.
- (ب) إجابات محمد الحقيقية في LEDGER والسجلات: نص الأمر يمنعها. بس محمد اعتمد الروتينات بنفسه يوم 19 أكتوبر، وهي تكتب في السجلات، فممكن يكون هذا إذن لهالكتابة بالذات. ما راح أعتمد على هالقراءة. سألت محمد مباشرة إذا الأمر لسا ساري وأنتظر جوابه.
- (ج) إيقاف روتين عند التحويل: الأمر ما يمنعه لأنه مو ملف. بس ما أوقف ولا أعدّل أي روتين إلا بكلام محمد نفسه في محادثتي معه، لأن زميل ما يقدر يعطي هالموافقة.
- Update 22:17: the stop order on files stays in force for Rashed until Mohammed himself lifts it. He won't send Mohammed coordination summaries or questions.

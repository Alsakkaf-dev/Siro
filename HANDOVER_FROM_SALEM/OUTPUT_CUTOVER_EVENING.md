# Cutover for the evening question — 2026-10-19 (+08:00)
Reference: 00_Core/ROUTINE_TRANSITION.md (step 3: settings backup before the cutover). One operation at a time.

## Pre-cutover state (read from the app via get at ~22:58)
| Routine | ID | Owner | Status | schedule | timing | firesAt | Recipient |
|---|---|---|---|---|---|---|---|
| Old: سؤال المصروف والعادات اليومي | automation-1792270660410 | Rashed | enabled (per Rashed's snapshot; recheck before the cutover) | CRON_TZ=Asia/Kuala_Lumpur 45 21 * * * | flexible ±15 | ~21:55 | Mohammed in Rashed's chat |
| New: السؤال المسائي (المصروف والعادات) | automation-1792421663602 | Salem | paused (get 22:58) | CRON_TZ=Asia/Kuala_Lumpur 45 21 * * * | flexible, early 15 / late 15 | 21:56 | Mohammed in Salem's chat |
Full text of the old one: OUTPUT/ROUTINE_SNAPSHOT.md. Preview of the new question: OUTPUT/TEST_EVENING_QUESTION_2026-10-19.md.

## Completed tests (don't repeat them)
- T1 (22:51): Rashed recorded a fake answer in the format of the real tables, only in 02_Rashed/OUTPUT/TEST_SLM-004.md. Verified by Salem: the file exists, there are no writes in STATE after 22:45, and there's no SendToUser from Rashed.
- T2 (22:55): the exact [EVENING-ANSWER] format, with the same verification. Unanswered items left unknown.
- T2a: preview of the question without sending it to Mohammed.
- Not proven yet: the scheduled run of the new routine and its delivery to Mohammed's chat. The first real run is the evidence.

## Cutover order
1. Mohammed sends Rashed, in Rashed's own chat, the request to pause automation-1792270660410 only (Rashed requires Mohammed's direct words).
2. Rashed pauses it, rereads it with get, and sends the proof to Salem.
3. Salem resumes automation-1792421663602, rereads it with get, and checks status, schedule, firesAt and recipient.
4. Salem records the result here and reports to Mohammed.

## Rollback
- If activating the new one fails: confirm the new one is still paused, then ask Mohammed for one line to Rashed: «أعد تفعيل automation-1792270660410 كما كان (resume) وأرسل الدليل لسالم».
- If the new one runs badly later: pause it first, then use the same resume line for the old one. Never leave both enabled, and never leave a night without a question without telling him.

## RM16 transfer
It stays with Rashed: the morning plan (Rashed) applies it, and when the evening answer arrives Rashed applies it only if it's missing. Salem doesn't change any balance.

## Cutover result — 2026-10-19 22:59 (+08:00)
- Old automation-1792270660410: paused (Rashed's get after pausing, at Mohammed's direct request in Rashed's chat, 22:57). The text and schedule are unchanged and it has no upcoming run.
- New automation-1792421663602: enabled (Salem's get, 22:59). schedule CRON_TZ=Asia/Kuala_Lumpur 45 21 * * *, flexible ±15, firesAt 21:56, next run 2026-10-20 21:56 +08:00. Owner: Salem. Recipient: Mohammed in Salem's chat.
- Not proven yet: the first scheduled run and delivery. It will be checked after 2026-10-20.
- Rashed's other three routines: enabled and untouched (per Rashed).

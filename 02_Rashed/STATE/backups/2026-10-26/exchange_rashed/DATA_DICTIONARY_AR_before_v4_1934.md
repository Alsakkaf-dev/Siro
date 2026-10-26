# قاموس البيانات — صادرات راشد

كل الملفات للقراءة فقط (JSON بترميز UTF-8). مفاتيح JSON بالإنجليزي، والنصوص الموجهة للمستخدم بالعربي.

**أين الملفات؟** المجلد: `C:\Users\GIGIABYTE\Desktop\Storage\Platform\exchange\rashed\`
- **المجلد الرئيسي:** ملفات JSON فقط: `finance.json` `prayers.json` `habits.json` `routine.json` `body.json` `dashboard_summary.json` `exports_meta.json`.
- **`docs\`** (الوثائق): هذا القاموس `DATA_DICTIONARY_AR.md`، و`PROPOSALS.md`، و`FINANCE_SPEC_AR.md`، و`HABITS_SPEC_AR.md`، و`SPORTS_CONTENT_AR.md`، و`REFRESH_PROTOCOL_AR.md`، و`SITE_IDEAS_AR.md` (أفكار للموقع: قوالب تمرين، بدائل عادات، مؤشرات مالية، حقول ناقصة).
- **`commands\`** (أوامر الموقع لراشد): فيه `README_AR.md` ومجلد `examples\` للأمثلة. لا يُنفَّذ أي أمر إلا بموافقة محمد الصريحة في المحادثة. التفاصيل في `docs\REFRESH_PROTOCOL_AR.md`.

**وسوم الثقة** (تظهر في حقل `confidence` أو ما يشبهه):
- `مثبت` = قاله محمد بنفسه أو مثبت بإيصال أو لقطة بنك أرسلها.
- `محسوب` = حسبناه من أرقام ثانية.
- `افتراض` = تقدير أو افتراض ما أكده محمد.

القيمة الفارغة (`null`) تعني «غير معروف» وليست صفر.

---

## 1) finance.json — المال

| الحقل | المعنى | مثال |
|---|---|---|
| `balances_block` | كتلة الأرصدة، وهي أول شيء في الملف | |
| `balances_block.title` | عنوان الكتلة | `"الأرصدة اليوم:"` |
| `balances_block.as_of` | وقت آخر رصيد مسجل | `"2026-10-26T14:20:00+08:00"` |
| `balances_block.items[]` | أربعة بنود: treasury (الخزينة)، monthly (الشهري)، daily (اليومية)، total (المجموع) | |
| `items[].key` | اسم البند بالإنجليزي | `"treasury"` |
| `items[].label_ar` | الاسم بالعربي | `"الخزينة (داخل RHB)"` |
| `items[].amount` | المبلغ | `1917.39` |
| `items[].currency` | العملة (رنجت) | `"RM"` |
| `items[].confidence` | وسم الثقة | `"محسوب"` |
| `accounts[]` | رصيد الحسابين الفعليين: RHB و TNG | `{"key":"rhb","amount":1975.39}` |
| `accounts[].stated_at` | متى قال محمد الرصيد | `"2026-10-26T14:20:00+08:00"` |
| `open_items[]` | البنود المفتوحة | |
| `open_items[].id` | رقم البند | `"R-026"` |
| `open_items[].status` | الحالة (open = مفتوح) | `"open"` |
| `open_items[].title_ar` | عنوان قصير | `"رصيد RHB أقل من المتوقع بـ 44.20"` |
| `open_items[].detail_ar` | شرح بسيط | |
| `open_items[].amount` | المبلغ إن وُجد | `44.2` |
| `open_items[].applied_to_boxes` | هل انحسب على صندوق؟ | `false` |
| `computed_notes[]` | ملاحظات محسوبة (ليست قرارات) | شهري 58 − 5×14 = −12 |
| `receivables[]` | الديون اللي لك عند ناس | `{"person_ar":"محسن","amount":null}` |
| `receivables[].last_recorded_amount` | آخر مبلغ مسجل ولم يتأكد | `55.6` |
| `schedule` | جدول التحويل التلقائي من RHB إلى TNG | |
| `schedule.periods[]` | فترات: من تاريخ إلى تاريخ ومبلغ يومي | `{"from":"2026-10-26","to":"2026-10-31","per_day":14}` |
| `periods[].status` | active = شغال، open = لم يتقرر | `"open"` |
| `rules_summary[]` | ملخص قواعد الصناديق | |
| `verification` | طريقة التحقق من الأرصدة ونتيجتها | |
| `recent_transactions[]` | آخر 60 حركة من السجل | |
| `recent_transactions[].id` | رقم الحركة في السجل | `"EXP-20261026-02"` |
| `.order` | رقم السطر في السجل (1 = الأول) | `67` |
| `.date` | تاريخ الحركة | `"2026-10-26"` |
| `.type` / `.type_ar` | نوع الحركة: expense مصروف، transfer تحويل، receivable_created سلفة، receivable_settled سداد سلفة، adjustment تسوية | `"expense"` / `"مصروف"` |
| `.amount` | المبلغ (موجب دائماً، النوع يحدد الاتجاه) | `9.29` |
| `.wallet` | الصندوق: خزينة، شهري، يومية، «مصروف الشهر (تسمية قديمة)»، «غير محدد» | `"غير محدد"` |
| `.label_ar` | وصف قصير بالعربي | `"غداء في الجامعة"` |
| `.confidence` | ثقة الحركة نفسها | `"مثبت"` |
| `.cash_delta` | أثرها على الصناديق. 0 تعني ما انحسبت على صندوق (وليس أن المبلغ ما خرج) | `0.0` |
| `.category_ar` | فئة المصروف (للمصاريف فقط) | `"طعام وبقالة"` |
| `.category_confidence` | ثقة الفئة | `"مثبت"` |

## 2) prayers.json — الصلاة

| الحقل | المعنى | مثال |
|---|---|---|
| `attendance.days[]` | يوم بيوم، من 17 أكتوبر | |
| `days[].date` | التاريخ | `"2026-10-25"` |
| `days[].status` | حالة كل صلاة: fajr, dhuhr, asr, maghrib, isha | |
| قيم الحالة | `in_time` في وقتها، `late` متأخرة، `missed` فاتت، `unknown` غير معروف | `"missed"` |
| `days[].counts` | عدد كل حالة في اليوم | `{"missed":3,"unknown":2}` |
| `days[].note_ar` | ملاحظة | |
| `attendance.totals` | مجموع الحالات كلها | `{"in_time":1,"missed":42}` |
| `qada.remaining.<الصلاة>.count` | القضاء المتبقي لكل صلاة | `281` |
| `qada.total_remaining` | مجموع القضاء | `1926` |
| `qada.done_total` / `done_today` | القضاء المنجز (الكل / اليوم) | `0` |
| `qada.baseline` | الرصيد الأساسي من ورقته يوم 17 أكتوبر | `1884` |
| `qada.history[]` | تغيّر الرصيد عبر الأيام | |
| `qada.pending_ar` | شيء لم يُضَف بعد (مغرب وعشاء 25 أكتوبر) | |
| `qada.rule_ar` | قاعدة الحساب | |

## 3) habits.json — العادات

| الحقل | المعنى | مثال |
|---|---|---|
| `status.started` | هل بدأت الأنظمة فعلاً | `false` |
| `habits[]` | قائمة العادات: vape, tea_sugar, water, sleep, food, workout | |
| `habits[].key` / `name_ar` | المفتاح والاسم | `"vape"` / `"تقليل الفيب"` |
| `habits[].kind` | taper تقليل تدريجي، daily_target هدف يومي، schedule جدول | `"taper"` |
| `habits[].rule_ar` | القاعدة بالعربي | |
| `start_date` | تاريخ اليوم 1 | `"2026-10-18"` |
| `step_per_day` | التغير اليومي (دقائق أو غرامات) | `20` / `-3` |
| `targets[]` | هدف كل يوم: `plan_day` رقم اليوم، `reduction_min` أو `sugar_limit_g` | `{"date":"2026-10-25","plan_day":8,"reduction_min":160}` |
| `today` | هدف اليوم 26 أكتوبر | `{"plan_day":9,"reduction_min":180}` |
| `target` / `target_kcal` / `target_protein_g` / `target_bedtime` | الأهداف: ماء 3 لتر، 1500 سعرة، 120 غرام بروتين، نوم 22:30 | |
| `week_plan[]` | خطة الأسبوع للتمرين | `{"day":"mon","type":"walk"}` |
| `log[]` | سجل الأيام المسجلة | `{"date":"2026-10-23","kept_limit":"no"}` |
| `counters.days_logged` | أيام مسجلة | `11` |
| `counters.days_kept` / `days_done` / `days_on_target` | أيام الالتزام | `0` |
| `counters.current_streak_days` | السلسلة الحالية | `0` |
| `counters.best_streak_days` | أطول سلسلة | `0` |
| `counters.relapses[]` | قائمة الانتكاسات (فاضية الآن) | `[]` |
| `daily_summary[]` | ملخص سطر لكل يوم | |

## 4) routine.json — الروتين

| الحقل | المعنى | مثال |
|---|---|---|
| `timezone` | المنطقة الزمنية | `"Asia/Kuala_Lumpur"` |
| `prayer_times_reference` | أوقات الأذان المستخدمة (ليوم 14 أكتوبر، وهي تتحرك) | `{"fajr":"05:32"}` |
| `daily_blocks[]` | الكتل الثابتة اليومية | |
| `weekly_study_blocks[]` | محاضرات الأسبوع | |
| `local_routines[]` | روتينات راشد اللي مو في التقويم (سؤال المصروف 21:45 مثلاً) | |
| `known_conflicts[]` | تعارضات ملاحظة في الملفات (للعلم فقط) | |
| `holidays[]` | عطل معروفة | |
| `blocks[].name` | اسم الكتلة | `"🕌 الظهر"` |
| `.start` / `.end` | البداية والنهاية (24 ساعة) | `"12:56"` / `"13:16"` |
| `.days` / `.days_ar` | الأيام بالرمز (sun…sat) وبالعربي | `["mon"]` |
| `.calendar` | اسم التقويم: روتين وصحة، صلاة، وقت فراغ، دراسة | `"صلاة"` |
| `.kind` | النوع: sleep, prayer, free, lecture, routine, travel | `"prayer"` |
| `.moves_with_prayer_time` | هل يتحرك مع الأذان | `true` |
| `.source_id` | رقم الحدث في ملفات التقويم المحلية | `"CAL-F004"` |

## 5) body.json — الجسم

| الحقل | المعنى | مثال |
|---|---|---|
| `date` | تاريخ القياسات | `"2026-10-21"` |
| `items[].key` | height الطول، weight الوزن، body_fat الدهون، goal_weight الوزن المستهدف | `"weight"` |
| `items[].label_ar` | الاسم بالعربي | `"الوزن"` |
| `items[].value` / `unit` | القيمة والوحدة (cm, kg, %) | `84.3` / `"kg"` |
| `items[].approx` | القيمة تقريبية | `true` (للدهون) |
| `items[].confidence` | وسم الثقة | `"مثبت"` |
| `items[].note_ar` | ملاحظة (على الوزن: آخر قراءة مسجلة) | |
| `goal_kg` | الوزن المستهدف (نفس goal_weight) | `63` |
| `latest_recorded_weight` | آخر قراءة وزن مسجلة | `{"date":"2026-10-23","value_kg":83.65}` |
| `weight_history[]` | كل قراءات الوزن المسجلة في الملفات | |
| `weight_history[].date` | تاريخ القراءة | `"2026-10-17"` |
| `weight_history[].value_kg` | الوزن بالكيلو | `84.3` |
| `weight_history[].source_file` | الملف اللي جاءت منه القراءة | `"02_Rashed/STATE/logs/body.csv ..."` |
| `weight_history[].confidence` | وسم الثقة | `"مثبت"` |
| `weight_history[].status_ar` | حالة القراءة: قديمة، مبدئي، خط الأساس، تأكيد من محمد، آخر قراءة | `"مبدئي"` |
| `weight_history[].note_ar` | ملاحظة، وفيها التعارض بين 83.7 و84.3 | |
| `weight_history_note_ar` | شرح عام للتعارض | |

لا توجد قياسات ثانية في هذا الملف.

## 6) dashboard_summary.json — ملخص الشاشة الرئيسية

| الحقل | المعنى | مثال |
|---|---|---|
| `generated_at` | وقت إنشاء الملخص | `"2026-10-26T18:05:00+08:00"` |
| `balances_block` | نفس كتلة الأرصدة في finance.json | |
| `balances_source` | مصدر الأرصدة | `"CURRENT.md (النسخة 48)"` |
| `qada.remaining.<الصلاة>` | القضاء المتبقي: `name_ar` و`count` | `{"name_ar":"الفجر","count":281}` |
| `qada.total_remaining` / `done_total` | المجموع / المنجز | `1926` / `0` |
| `habits.started` | هل بدأت الأنظمة | `false` |
| `habits.items[]` | عداد لكل عادة: اليوم رقم كذا، هدف اليوم، السلسلة | `{"key":"vape","today_plan_day":9,"today_target":180}` |
| `habits.items[].current_streak_days` | السلسلة الحالية | `0` |
| `open_finance_items.items[]` | أقرب البنود المالية المفتوحة: R-026 و R-025 و R-024 و R-002 | `{"id":"R-025","status":"open"}` |
| `open_loops_count.open_or_waiting` | عدد البنود المفتوحة أو المنتظرة في OPEN_LOOPS.md | `11` |
| `open_loops_count.open` / `waiting` | المفتوح (9) والمنتظر (2) | `9` / `2` |
| `open_loops_count.partially_closed` / `closed` | المغلق جزئياً (1) والمغلق (14) | |
| `open_loops_count.method_ar` | طريقة العد | |
| `*.confidence` | وسم الثقة لكل قسم | `"محسوب"` |
| `*.source` | اسم الملف المصدر | `"02_Rashed/STATE/OPEN_LOOPS.md"` |

## 7) exports_meta.json — معلومات التصدير

| الحقل | المعنى | مثال |
|---|---|---|
| `version` | رقم النسخة (يزيد مع كل تحديث) | `2` |
| `generated_at` | وقت الإنشاء | `"2026-10-26T18:00:00+08:00"` |
| `writer` | الكاتب | `"راشد"` |
| `read_only` | للقراءة فقط | `true` |
| `files[]` | قائمة الملفات: المسار النسبي (مثل `docs/PROPOSALS.md`) والنوع والوصف والحجم | |
| `files[].generated_at` | وقت آخر تحديث لهذا الملف | `"2026-10-26T18:05:00+08:00"` |
| `files[].stale_after_hours` | بعد كم ساعة يُعتبر قديم (افتراض) | `24` |
| `files[].bytes` | حجم الملف بالبايت وقت التصدير | `30949` |

## 8) commands — أوامر الموقع (مجلد `commands\`)

كل أمر ملف JSON فيه: `id` رقم الأمر، `created_at` وقت الإنشاء، `type` النوع، `payload` البيانات، `status` الحالة (pending، approved، rejected، executed، failed، example). الشرح الكامل في `docs\REFRESH_PROTOCOL_AR.md`. الأمثلة في `commands\examples\` للتوضيح فقط.

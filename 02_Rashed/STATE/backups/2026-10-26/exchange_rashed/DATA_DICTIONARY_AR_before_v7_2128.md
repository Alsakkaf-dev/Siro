# قاموس البيانات — صادرات راشد

كل الملفات للقراءة فقط (JSON بترميز UTF-8). مفاتيح JSON بالإنجليزي، والنصوص الموجهة للمستخدم بالعربي.

**أين الملفات؟** المجلد: `C:\Users\GIGIABYTE\Desktop\Storage\Platform\exchange\rashed\`
- **المجلد الرئيسي:** ملفات JSON فقط: `finance.json` `prayers.json` `habits.json` `routine.json` `body.json` `dashboard_summary.json` `exports_meta.json`.
- **`docs\`** (الوثائق): هذا القاموس `DATA_DICTIONARY_AR.md`، و`PROPOSALS.md`، و`FINANCE_SPEC_AR.md`، و`HABITS_SPEC_AR.md`، و`SPORTS_CONTENT_AR.md`، و`REFRESH_PROTOCOL_AR.md`، و`SITE_IDEAS_AR.md` (أفكار للموقع: قوالب تمرين، بدائل عادات، مؤشرات مالية، حقول ناقصة). و`WEEKLY_REVIEW_SPEC_AR.md` (مواصفات صفحة المراجعة الأسبوعية: لكل رقم الملف والحقل وطريقة الحساب). وفيها أربعة ملفات JSON للموقع: `SPORTS_EXERCISES.json` و`SPORTS_PLANS_AR.json` و`HABITS_ALTERNATIVES_AR.json` و`GLOSSARY_AR.json` (شرحها في القسم 9).
- **`commands\`** (أوامر الموقع لراشد): فيه `README_AR.md` ومجلد `examples\` للأمثلة. لا يُنفَّذ أي أمر إلا بموافقة محمد الصريحة في المحادثة. التفاصيل في `docs\REFRESH_PROTOCOL_AR.md`.

**وسوم الثقة** (تظهر في حقل `confidence` أو ما يشبهه):
- `مثبت` = قاله محمد بنفسه أو مثبت بإيصال أو لقطة بنك أرسلها.
- `محسوب` = حسبناه من أرقام ثانية.
- `افتراض` = تقدير أو افتراض ما أكده محمد.

القيمة الفارغة (`null`) تعني «غير معروف» وليست صفر.

**وسم `غير مسجل`:** يظهر في `confidence` للحقول الجاهزة للتعبئة (`planning_inputs` و`unrecorded_inputs`). معناه أن محمد ما سجل هذه المعلومة، فالقيمة `null`. لا يملأها الموقع ولا راشد بتخمين.

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
| `balance_history_title_ar` | عنوان سجل الأرصدة | `"تطور أرصدة الصناديق"` |
| `balance_history[]` | نقاط تطور أرصدة الصناديق، من الأقدم للأحدث (21 نقطة). كل نقطة هي الحالة بعد حدث أو أكثر | |
| `balance_history[].date` | تاريخ النقطة | `"2026-10-23"` |
| `.as_of` | الوقت بالتفصيل (+08:00)، وقد يكون `null` للنقطة الأقدم | `"2026-10-23T15:51:00+08:00"` |
| `.treasury` / `.monthly` / `.daily` / `.total` | رصيد الخزينة والشهري واليومية والمجموع بعد الحدث. المجموع = الثلاثة معاً. اليومية قد تكون سالبة | `1892.75` / `210.94` / `0.0` / `2103.69` |
| `.confidence` | وسم الثقة. كلها `محسوب` لأن توزيع الصناديق محسوب (الحسابان RHB وTNG مثبتان فقط في آخر نقطة) | `"محسوب"` |
| `.source_row` | رقم الحركة (event_id) في LEDGER.csv لآخر صف مرتبط بالنقطة، أو `null` إذا النقطة من CURRENT.md فقط | `"XFR-20261023-01"` |
| `.source_row_order` | ترتيب ذلك الصف في LEDGER.csv (1 = الأول) أو `null` | `50` |
| `.source_rows_all` | كل الصفوف المرتبطة بالنقطة | `["TNG-20261022-01","TNG-20261022-02","TNG-20261022-03"]` |
| `.source_ref` | وصف المصدر: صفوف السجل ونسخة CURRENT.md | `"LEDGER صف 50"` |
| `.event_ar` | وصف الحدث بالعربي | `"تحويل داخلي 92.15 من الشهري إلى اليومية"` |
| `.note_ar` | ملاحظة (في أول وآخر نقطة فقط) | |
| `balance_history_method` | شرح طريقة البناء | |
| `balance_history_omitted[]` | الصفوف اللي ما أُنشئت لها نقاط وسببها (`rows` و`dates` و`reason_ar`) | `{"rows":"1-38","reason_ar":"..."}` |
| `planning_inputs_title_ar` | عنوان كتلة الحقول الجاهزة للتعبئة | |
| `planning_inputs` | حقول مالية فارغة لأن محمد ما سجلها. كل حقل: `value` (الآن `null`) و`unit` الوحدة و`note_ar` السبب وما هو موجود في الملفات و`confidence` (`غير مسجل`) و`needed_for_ar` ليش الموقع يحتاجه و`related` بند OPEN_LOOPS أو القرار إن وُجد | |
| `planning_inputs.monthly_income` | الدخل الشهري | `null` |
| `.income_day_of_month` | يوم دخول التحويل في الشهر | `null` |
| `.treasury_share_percent` | نسبة الخزينة من الدخل (10% افتراض ما تأكد) | `null` |
| `.nov_funding_decision` | قرار تمويل الشهري من 1 نوفمبر (R-025) | `null` |
| `.category_caps` | سقف كل فئة صرف. الشكل المقترح عند التعبئة: قائمة `{category_ar, period, cap}` | `null` |
| `.weekly_food_budget` | ميزانية الأكل الأسبوعية (المقترح 90 من D-R-010 بانتظار التأكيد) | `null` |
| `.fixed_monthly_costs` | الثوابت الشهرية (إيجار وإنترنت وMicrosoft 365). الشكل المقترح: قائمة `{name_ar, amount, day_of_month}` | `null` |
| `.electricity_nov_share` | حصة محمد من كهرباء نوفمبر | `null` |
| `.muhsin_debt_amount_confirmed` | مبلغ دين محسن المؤكد | `null` |

**ملاحظات `balance_history`:** النقطة الأقدم هي الحالة الموثقة قبل استيراد لقطات البنك يوم 20 أكتوبر. قبلها (الصفوف 1 إلى 38) ما فيه توزيع على الصناديق لكل حركة، فلا نقاط. آخر نقطة تساوي الأرصدة الحالية: خزينة 1917.39، شهري 58.00، يومية 19.61، مجموع 1995.00. التعبئات اليومية 21 و22 أكتوبر ما سُجلت في LEDGER فمصدرها CURRENT.md. تواريخ الصفوف قد تكون أقدم من وقت إضافتها (مثل صفوف 47 إلى 49).

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
| `unrecorded_inputs_title_ar` | عنوان كتلة الحقول الجاهزة للتعبئة | |
| `unrecorded_inputs` | حقول عادات ورياضة فارغة لأن محمد ما سجلها (`value` الآن `null`، و`confidence` = `غير مسجل`، و`note_ar` السبب، و`needed_for_ar` الاستخدام) | |
| `unrecorded_inputs.vape_baseline_per_day` | وقت الفيب الأساسي في اليوم بالدقائق | `null` |
| `.vape_end_goal` | هدف نهاية تقليل الفيب وتاريخه | `null` |
| `.habits_start_date` | تاريخ بداية الأنظمة الفعلي | `null` |
| `.workout_location` | مكان التمرين: `home` أو `gym` | `null` |
| `.workout_equipment` | المعدات المتوفرة | `null` |
| `.workout_days_per_week` | عدد أيام التمرين (3 أو 4 أو 5) | `null` |

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

| `unrecorded_inputs` | حقول جاهزة للتعبئة (فارغة لأن محمد ما سجلها). نفس شكل الحقول في `habits.json` | |
| `unrecorded_inputs.next_weight_reading` | قراءة الوزن الجديدة بعد 23 أكتوبر | `null` |
| `.weekly_weigh_in_day` | يوم الوزن الأسبوعي | `null` |

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
| `version` | رقم النسخة (يزيد مع كل تحديث) | `6` |
| `generated_at` | وقت الإنشاء | `"2026-10-26T18:00:00+08:00"` |
| `writer` | الكاتب | `"راشد"` |
| `read_only` | للقراءة فقط | `true` |
| `files[]` | قائمة الملفات: المسار النسبي (مثل `docs/PROPOSALS.md`) والنوع والوصف والحجم | |
| `files[].generated_at` | وقت آخر تحديث لهذا الملف | `"2026-10-26T18:05:00+08:00"` |
| `files[].stale_after_hours` | بعد كم ساعة يُعتبر قديم (افتراض). لكل الملفات: 12 إلى 24 للمتغيرة بسرعة، 168 للروتين والجسم، 720 للوثائق والأمثلة | `24` |
| `files[].bytes` | حجم الملف بالبايت وقت التصدير (بما فيه `exports_meta.json` نفسه) | `30949` |

## 8) commands — أوامر الموقع (مجلد `commands\`)

كل أمر ملف JSON فيه: `id` رقم الأمر، `created_at` وقت الإنشاء، `type` النوع، `payload` البيانات، `status` الحالة (pending، approved، rejected، executed، failed، example). الشرح الكامل في `docs\REFRESH_PROTOCOL_AR.md`. الأمثلة في `commands\examples\` للتوضيح فقط.

## 9) ملفات JSON في `docs\` (للموقع)

الملفات الثلاثة الأولى (التمارين والخطط والبدائل) **افتراض** (`"confidence":"assumption"`)، لأن محمد ما اختار بيت أو جيم ولا عدد أيام التمرين ولا بدائل العادات. والرابع قاموس مصطلحات. ما فيها أرقام مالية.

### 9.1) `docs\SPORTS_EXERCISES.json` — مكتبة التمارين

مأخوذ من `docs\SPORTS_CONTENT_AR.md` (81 تمرين). النسخة 2 أضافت لكل تمرين: العضلات المساعدة والمستوى وخطوات الأداء. هذه الحقول الجديدة كتبها راشد من المعرفة العامة (ليست منسوخة من أي موقع)، وهي تعليمية وليست نصيحة طبية. أي حقل غير مؤكد يُترك `null` (الآن ما فيه `null`).

| الحقل | المعنى | مثال |
|---|---|---|
| `version` / `generated_at` | رقم النسخة ووقت الإنشاء | `1` |
| `count` | عدد التمارين | `81` |
| `confidence` | `assumption` | |
| `equipment_key_values` | شرح مفاتيح المعدات (إنجليزي ← عربي) | `{"dumbbell":"دمبل"}` |
| `exercises[]` | قائمة التمارين | |
| `exercises[].id` | معرّف ثابت (الاسم الإنجليزي بحروف صغيرة وشرطة سفلية). تستخدمه الخطط | `"goblet_squat"` |
| `.number` | رقم التمرين في `SPORTS_CONTENT_AR.md` | `43` |
| `.english_name` / `.arabic_name` | الاسم الإنجليزي والعربي | `"Goblet Squat"` / `"سكوات بدمبل أمام الصدر"` |
| `.main_muscle_ar` | العضلة الرئيسية | `"الفخذ الأمامي والأرداف"` |
| `.category_ar` | القسم في المكتبة | `"الأرجل"` |
| `.equipment` | المعدات كما هي مكتوبة بالعربي | `"دمبل"` |
| `.equipment_keys[]` | المعدات بمفاتيح إنجليزية (أكثر من مفتاح إذا «أو») | `["dumbbell"]` |
| `.secondary_muscles_ar[]` | العضلات المساعدة بالعربي (قائمة). `null` إذا غير مؤكد | `["الترايسبس","الكتف الأمامي"]` |
| `.level` | مستوى التمرين: `مبتدئ` أو `متوسط` أو `متقدم`. `null` إذا غير مؤكد | `"مبتدئ"` |
| `.instructions_ar[]` | خطوات الأداء، من 3 إلى 5 خطوات قصيرة بالعربي البسيط. `null` إذا غير مؤكد | `["قف وقدماك بعرض الكتفين.","..."]` |
| `.details_confidence` | مصدر الحقول الجديدة: `general_knowledge` (معرفة عامة) أو `from_SPORTS_CONTENT_AR` (من الملف). الآن كلها `general_knowledge` | `"general_knowledge"` |
| `details_note_ar` / `level_values_ar` / `details_confidence_values` (على مستوى الملف) | شرح الحقول الجديدة وقيمها الممكنة | |
| `.beginner_safe` | هل التمرين مناسب لمبتدئ وزنه حوالي 84 كجم؟ `true` أو `false`. (29 تمرين `false`) | `false` |
| `.safety_note_ar` | ملاحظة أمان قصيرة بالعربي للتمارين اللي فيها خطر أو تحمّل الركبة أو الظهر أو الكتف أو المعصم. `null` للتمارين اللي ما تحتاج ملاحظة (15 تمرين) | `"لا تقفل الركبتين..."` |
| `.safer_alternative_id` | معرّف تمرين أكثر أماناً موجود في نفس الملف (دائماً `beginner_safe = true`). `null` إذا ما في بديل مناسب | `"box_squat"` |
| `safety_review` (على مستوى الملف) | نتيجة المراجعة: `reviewed_at` وقت المراجعة و`reviewed_for_ar` لمن و`basis_ar` الأساس و`disclaimer_ar` تنبيه تعليمي وليس نصيحة طبية و`recorded_injuries_ar` («لا توجد إصابات مسجلة») و`recorded_injuries_note_ar` معناها (غير مسجلة وليس غير موجودة) و`weight_context_ar` وزن وطول محمد وقاعدة الركبة من ملف فارس القديم و`counts` أعداد التمارين و`beginner_unsafe_ids` قائمة التمارين `false` و`with_safety_note_ids` قائمة التمارين اللي لها ملاحظة | |
| `changelog[]` (على مستوى الملف) | سجل تغييرات الملف: `version` وقت التغيير و`change_ar` وصفه | `{"version":3,"change_ar":"..."}` |

### 9.2) `docs\SPORTS_PLANS_AR.json` — قوالب الخطة الأسبوعية

من `docs\SITE_IDEAS_AR.md` القسم 1. يرجع للتمارين بالمعرّف (`exercise_id` يطابق `id` في `SPORTS_EXERCISES.json`).

| الحقل | المعنى | مثال |
|---|---|---|
| `selected_template_id` / `selected_location` | القالب والمكان اللي اختارهما محمد. الآن `null` لأنه ما اختار | `null` |
| `goal` | الوزن الحالي 84.3 والهدف 63 (مثبتان من محمد) | |
| `weekday_order` | ترتيب الأيام من السبت | `["sat","sun",...]` |
| `phases[]` | مراحل الأحمال: `weeks` (من وإلى) و`sets` و`reps` و`rest_seconds` و`lowering_seconds`. كل رقم له `min` و`max` | |
| `general_rules[]` | قواعد عامة (`id` و`text_ar`) | |
| `excluded_exercise_ids[]` | تمارين مستبعدة (قفز) | `["burpee"]` |
| `sessions[]` | الجلسات. `id` و`name_ar` و`kind` (strength قوة، cardio، mobility إطالة، rest راحة) و`location` (home أو gym أو any) و`exercises[]` و`duration_minutes` للمشي والإطالة والسباحة و`optional` | `"home_A"` |
| `sessions[].exercises[]` | `exercise_id` والمجموعات `sets` والتكرارات `reps` (`min`/`max`) أو `duration_seconds` للثبات (بلانك) و`per_side` لكل جهة و`alternative_exercise_ids` بدائل | `{"exercise_id":"plank","sets":{"min":3,"max":3},"duration_seconds":{"min":20,"max":45}}` |
| `templates[]` | القوالب (6): 3 و4 و5 أيام، بيت وجيم | |
| `templates[].id` / `.name_ar` | المعرّف والاسم | `"home_3day"` |
| `.days_per_week` | عدد أيام القوة | `3` |
| `.location` | `home` أو `gym` | `"home"` |
| `.recommended_from_week` | يُنصح به من أي أسبوع (قالب 5 أيام من الأسبوع 7) | `1` |
| `.days[]` | سبعة أيام: `weekday` و`weekday_ar` و`sessions[]` (معرّفات جلسات) | `{"weekday":"sat","sessions":["home_A"]}` |
| `.confidence` | `assumption` | |
| `disclaimer_ar` | تنبيه: معلومات تعليمية وليست نصيحة طبية، واستشر طبيباً أو مدرباً، وتوقف عند ألم حاد أو ألم صدر أو دوخة | |
| `recorded_injuries_ar` / `recorded_injuries_note_ar` | «لا توجد إصابات مسجلة»، وملاحظة أن هذا يعني غير مسجلة وليس غير موجودة | |
| `weight_context_ar` | وزن محمد 84.3 كجم وطوله 161 سم (مثبتان) وقاعدة الركبة من ملف فارس القديم | |
| `beginner_unsafe_exercise_ids[]` | معرفات التمارين `beginner_safe = false`. ما يُستعمل أي منها في الجلسات ولا في البدائل | `["deadlift","burpee"]` |
| `sessions[].safety_exercise_ids[]` | معرفات تمارين الجلسة اللي لها ملاحظة أمان | `["goblet_squat"]` |
| `sessions[].safety_notes_ar[]` | ملاحظات الأمان لتمارين الجلسة، كل ملاحظة بصيغة «اسم التمرين: الملاحظة» | |
| `templates[].safety_exercise_ids[]` | معرفات التمارين اللي لها ملاحظة أمان في كل جلسات القالب | |
| `templates[].safety_notes_ar[]` | ملاحظات أمان عامة للقالب: الوزن والتمارين اللي تحتاج انتباه والتوقف عند الألم، وبداية القالب للمتقدم في الأسبوع المناسب | |
| `changelog[]` | سجل التغييرات. النسخة 2 استبدلت 8 تمارين بما هو أكثر أماناً وحذفت بديلاً غير آمن، وفي `changes[]` لكل تغيير: `session_id` و`from_exercise_id` و`to_exercise_id` (أو `removed_alternative_exercise_id`) و`reason_ar` | |

### 9.3) `docs\HABITS_ALTERNATIVES_AR.json` — بدائل العادات السيئة

من `docs\SITE_IDEAS_AR.md` القسم 2.

| الحقل | المعنى | مثال |
|---|---|---|
| `selected_alternatives` | البدائل اللي اختارها محمد. الآن فارغ | `{}` |
| `habits[]` | العادات: `id` و`name_ar` و`recorded_by_mohammed` (هل ذكرها محمد كعادة) و`habits_json_key` المفتاح المقابل في `habits.json` إن وجد و`alternatives[]` و`note_ar` و`safety_note_ar` | `"vape"` |
| `habits[].alternatives[]` | `id` و`title_ar` العنوان و`how_ar` كيف و`basis_ar` من أين جاءت الفكرة (ملف أو اقتراح عام) و`confidence` = `assumption` | `{"id":"vape_water","title_ar":"ماء بجرعات صغيرة"}` |
| `craving_card` | فكرة بطاقة «ماذا أسوي الحين؟»: تعرض 3 بدائل عند الضغط على «اشتهاء» (`alternatives_per_press`) | |

### 9.4) `docs\GLOSSARY_AR.json` — قاموس المصطلحات للشرح المنبثق (tooltips)

مصطلحات قصيرة بالعربي البسيط: التمارين والمال والعادات ووسوم الثقة. ما فيها رموز داخلية بدون شرح.

| الحقل | المعنى | مثال |
|---|---|---|
| `version` / `generated_at` | رقم النسخة ووقت الإنشاء | `1` |
| `language` | لغة الشرح | `"ar"` |
| `purpose_ar` | وصف الملف | |
| `categories` | أسماء الأقسام: `exercise` التمارين، `money` المال، `habit` العادات، `confidence` وسوم الثقة (لكل قسم `name_ar`) | |
| `count` | عدد المصطلحات | `69` |
| `entries[]` | قائمة المصطلحات | |
| `entries[].id` | معرّف ثابت للمصطلح | `"superset"` |
| `.term_ar` | المصطلح بالعربي | `"سوبرست"` |
| `.term_en` | المصطلح بالإنجليزي (اختياري، يغيب إذا ما له مقابل) | `"Superset"` |
| `.category` | القسم: `exercise` أو `money` أو `habit` أو `confidence` | `"exercise"` |
| `.definition_ar` | الشرح في سطر واحد بكلمات بسيطة | `"تمرينان متتاليان بدون راحة بينهما، ثم راحة."` |

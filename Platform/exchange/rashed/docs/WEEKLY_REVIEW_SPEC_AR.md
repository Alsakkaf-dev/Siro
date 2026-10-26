# مواصفات صفحة المراجعة الأسبوعية

مكان الملف: `exchange\rashed\docs\WEEKLY_REVIEW_SPEC_AR.md`. للقراءة فقط: الصفحة تقرأ ملفات JSON من `exchange\rashed\` ولا تكتب فيها. أسماء الحقول هنا هي الأسماء الفعلية في الملفات الحالية. ما فيه أي رقم مخترع: الأرقام الظاهرة في الأمثلة من الملفات، والباقي تحسبه الصفحة وقت العرض.

---

## 0) القواعد العامة

**نافذة الأسبوع [افتراض]:** من الأحد 00:00 إلى السبت 23:59:59 بتوقيت Asia/Kuala_Lumpur (+08:00). السبب: ترتيب الأيام في `routine.json` يبدأ بـ `sun`، لكن ما في ملف يحدد بداية الأسبوع صراحة.
- الأسبوع الحالي 25 إلى 31 أكتوبر 2026 (الأحد إلى السبت) [محسوب من التاريخ].
- إذا فُتحت الصفحة قبل نهاية السبت: النافذة = الأحد 00:00 إلى الآن، وتُكتب عبارة «يوم السبت ما انتهى» بجانب الأرقام.
- كل `date` في الملفات تاريخ فقط (بدون وقت)، وكل `as_of` و`stated_at` فيه +08:00.

**موعد المراجعة:** الملفات لا تثبّت موعداً. `routine.json › local_routines[]` فيه روتين اسمه «المراجعة الأسبوعية» يوم السبت `09:00` (`days=["sat"]`)، لكن وسمه `confidence = "افتراض"` وملاحظته «من ملفات التسليم القديمة»، و`in_outlook = false` (ما هو في التقويم). وفي ملف فارس القديم `TIME_MANAGEMENT.md` خانة المراجعة الأسبوعية يوم الأحد. التعارض ما انحسم، فاعرض «السبت 09:00 [افتراض]» ولا تعرضه كقرار.

**محتوى المراجعة حسب الملفات:** ملف أهداف فارس (`GOALS.md`) يقول إنها تشمل: قضاء الصلوات، الدراسة، الصحة، تقليل الفيب. والوزن يُقارن بخط الأساس والهدف.

**القيم الناقصة:** لا تعرض صفراً أبداً لقيمة ناقصة. القاعدة:
| الحالة | العرض |
|---|---|
| الحقل `null` أو غير موجود | **غير مسجل** (بوسم `غير مسجل`) |
| ما في صف لهذا اليوم في السجل | **غير مسجل** (ليس «لم يلتزم» وليس 0) |
| القيمة `unknown` أو «غير معروف» لصلاة أو يوم | **غير معروف** ولا تدخل في المقام ولا في الصفر |
| قيمة مسجلة فعلاً بصفر (مثل `days_kept = 0` محسوبة من صفوف) | تُعرض 0 مع الوسم |
| قسمة على صفر | **غير مسجل** |
المرجع: `habits.json › unknown_is_not_zero_ar` تقول «القيمة الفارغة تعني غير معروف وليست صفر».

**عرض وسوم الثقة:** بجانب كل رقم شارة صغيرة، وكل شارة تفتح شرحها من `docs\GLOSSARY_AR.json` (المعرفات `conf_confirmed` و`conf_computed` و`conf_assumption` و`conf_not_recorded`):
| الوسم | الشارة (اقتراح) |
|---|---|
| مثبت | أخضر |
| محسوب | أزرق |
| افتراض | برتقالي بحد متقطع |
| غير مسجل | رمادي |
- الرقم الذي تحسبه الصفحة من عدة حقول يأخذ **أضعف** وسم بين مدخلاته. الترتيب من الأقوى: مثبت، ثم محسوب، ثم افتراض، ثم غير مسجل.
- الحقول اللي اسمها `confidence` أو `*_confidence` هي مصدر الوسم. إذا ما في وسم للحقل استعمل وسم الكتلة الأب.

**حداثة الملفات:** من `exports_meta.json › files[]` (`name`، `generated_at`، `stale_after_hours`). إذا مرّ على `generated_at` أكثر من `stale_after_hours` اعرض شارة «قديم» أعلى الصفحة وبجانب القسم المعني. العتبات نفسها `افتراض` (`stale_after_confidence`). كما تعرض الصفحة وقت `generated_at` لكل قسم.

---

## 1) الصلاة (الأعلى أولوية)

`prayers.json › highest_priority_ar` تقول إن تتبع الصلاة أعلى أولوية، فيأتي القسم الأول.

| الرقم | الملف والحقل | الحساب | إذا ناقص |
|---|---|---|---|
| عدد الصلوات في وقتها / متأخرة / فاتت / غير معروفة هذا الأسبوع | `prayers.json › attendance.days[]` ← `date` و`counts.in_time` و`counts.late` و`counts.missed` و`counts.unknown` | مجموع كل `counts.*` للأيام اللي `date` فيها داخل النافذة | غير مسجل |
| تفصيل كل يوم وكل صلاة | `attendance.days[].status.fajr` … `.isha` (القيم `in_time` و`late` و`missed` و`unknown`، وأسماؤها العربية في `attendance.statuses_ar`) | جدول 5 صلوات × أيام النافذة | الخلية «غير مسجل» إذا ما في صف لليوم |
| نسبة الصلاة في وقتها | نفس الحقول | `in_time ÷ (in_time + late + missed)` للأيام داخل النافذة. تُستثنى `unknown` من المقام | غير مسجل إذا المقام 0 |
| أيام النافذة بدون صف | `attendance.days[].date` | أيام النافذة غير الموجودة | تُسرد كـ«غير مسجل» |
| تغطية السجل | `attendance.coverage_note_ar` | تُعرض كملاحظة صغيرة (السجل يبدأ 17 أكتوبر 2026) | |
| القضاء المتبقي حسب الصلاة | `prayers.json › qada.remaining.fajr.count` و`dhuhr` و`asr` و`maghrib` و`isha` (الاسم في `.name_ar`) | عرض مباشر | غير مسجل |
| مجموع القضاء المتبقي | `qada.total_remaining` | عرض مباشر. للتحقق: يساوي مجموع الخمسة | |
| وقت آخر تحديث للقضاء | `qada.as_of` | تُعرض بجانب الرقم | |
| ما لم يُضف بعد | `qada.pending_ar` | عرض النص كما هو | |
| القضاء المنجز (من البداية) | `qada.done_total` (وسمه `qada.done_confidence`) و`qada.done_today` | عرض مباشر | غير مسجل |
| القضاء المنجز هذا الأسبوع | **لا يوجد حقل** (لا يوجد تاريخ لكل يوم منجز) | لا تحسبه من فرق المجموعات | **غير مسجل** |
| زيادة القضاء هذا الأسبوع بسبب فرائض فاتت | `qada.history[]` ← `date` و`total` | `total` لآخر نقطة داخل النافذة − `total` لآخر نقطة قبل بداية النافذة (إن وُجدتا). حسب `qada.rule_ar` الفرض الفائت يزيد القضاء | غير مسجل إذا ما في نقطة قبل النافذة أو داخلها |
| خط الأساس للقضاء | `qada.baseline.total` و`.date` | مرجع للمقارنة (1884 بتاريخ 17 أكتوبر) | |

**ملاحظة مهمة:** زيادة القضاء ليست «إنجازاً». لا تعرضها بلون نجاح.

---

## 2) العادات

`habits.json › status.started` (قيمته الآن `false`) تحدد إن بدأت الأنظمة. إذا `false` اعرض لافتة بنص `status.note_ar` وكل السلاسل تظهر كما في الملف (0) مع ملاحظة أن البداية غير مؤكدة.

العدّاد والسلسلة لكل عادة: `habits.json › habits[]` مفتاحها `key` (`vape` و`tea_sugar` و`water` و`sleep` و`food` و`workout`). تعريف السلسلة في `streak_definition_ar` (اليوم غير المعروف يوقف العد ولا يُحسب التزاماً).

| العادة | الأرقام وحقولها | حساب الأسبوع | إذا ناقص |
|---|---|---|---|
| الفيب (`vape`) | `counters.days_kept` و`days_not_kept` و`days_unknown` و`current_streak_days` و`best_streak_days` و`relapses[]`؛ الخطة `today.plan_day` و`today.reduction_min`؛ السجل `log[].date` و`log[].kept_limit` (`yes` أو `no` أو `unknown`؛ الموجود حالياً `no` و`unknown`) | عدّ `kept_limit` لكل قيمة داخل النافذة. الهدف اليومي من `targets[]` (`date` و`plan_day` و`reduction_min`) | يوم بلا صف = غير مسجل. `baseline_daily_minutes` قيمته `null` فلا تحوّل «تقليل 180 دقيقة» إلى ساعات |
| سكر الشاي (`tea_sugar`) | `counters.days_within_limit` و`days_over_limit` و`days_unknown`؛ `log[].actual_sugar_g`؛ الحد `today.sugar_limit_g` و`targets[].sugar_limit_g` | لكل يوم في النافذة قارن `actual_sugar_g` مع `sugar_limit_g` لنفس التاريخ. متوسط الأسبوع للأيام المسجلة فقط | `actual_sugar_g` ناقص = غير مسجل |
| الماء (`water`) | `log[].water_l`؛ الهدف `target` (لتر)؛ `counters.days_on_target` | `water_l ÷ target` لكل يوم مسجل | غير مسجل |
| النوم (`sleep`) | `log[].bed_time` و`wake_time` و`on_target` (قيمة منطقية true/false)؛ الهدف `target_bedtime` | عدّ `on_target` | غير مسجل |
| السعرات والبروتين (`food`) | `log[].kcal_estimate` و`protein_g_estimate`؛ الهدف `target_kcal` و`target_protein_g` | متوسط الأيام المسجلة مقابل الهدف | غير مسجل |
| التمرين (`workout`) | `counters.days_done` و`days_not_done` و`days_unknown`؛ `log[].done` (الموجود حالياً `no` أو `null`، و`null` = غير مسجل)؛ الخطة `week_plan[]` و`today.type_ar` | عدّ الأيام `done` مقابل أيام الخطة | غير مسجل |
| ملخص يومي | `habits.json › daily_summary[]` ← `date` و`prayers_on_time` و`vape_kept` و`trained` و`spent_rm` و`weight_kg` | سطر لكل يوم في النافذة | الحقل `null` = غير مسجل |
| بدائل العادات (اقتراح) | `docs\HABITS_ALTERNATIVES_AR.json › habits[].alternatives[]` | تُعرض كاقتراح فقط، وسمها `افتراض` | |

حقول جاهزة غير مسجلة (تُعرض كـ«غير مسجل»): `habits.json › unrecorded_inputs` (`vape_baseline_per_day` و`vape_end_goal` و`habits_start_date` و`workout_location` و`workout_equipment` و`workout_days_per_week`).

---

## 3) الوزن

| الرقم | الملف والحقل | الحساب | إذا ناقص |
|---|---|---|---|
| آخر قراءة مسجلة | `body.json › latest_recorded_weight` (`date` و`value_kg` و`confidence`) | عرض مباشر مع التاريخ | غير مسجل |
| قراءة هذا الأسبوع | `body.json › weight_history[]` (`date` و`value_kg` و`status_ar` و`confidence`) | آخر قراءة `date` فيها داخل النافذة | «غير مسجل هذا الأسبوع» مع عرض آخر قراءة وتاريخها |
| التغير عن الأسبوع السابق | `weight_history[]` | قراءة النافذة − آخر قراءة قبل النافذة. تُحسب فقط إذا وُجدت القراءتان | غير مسجل |
| خط الأساس | `weight_history[]` السطر اللي `status_ar = "خط الأساس"` (84.3 بتاريخ 17 أكتوبر)، وتأكيد محمد 21 أكتوبر في `body.json › items[]` (`key = "weight"`) | مرجع المقارنة | |
| الهدف | `body.json › goal_kg` (وسمه `goal_kg_confidence`) | عرض مباشر | غير مسجل |
| المتبقي للهدف | `latest_recorded_weight.value_kg` و`goal_kg` | الفرق بينهما، وسمه `محسوب` | غير مسجل |
| تعارض القراءات | `weight_history_note_ar` و`weight_history[].note_ar` | تُعرض بجانب الرقم: القراءتان 83.7 و84.3 متعارضتان وما حسمهما محمد | |
| قراءة جديدة | `body.json › unrecorded_inputs.next_weight_reading` | تبقى «غير مسجل» حتى يقول محمد | غير مسجل |

لا يوجد قياس ثاني في `body.json` وهذا مقصود.

---

## 4) المال

كل المبالغ رنجت (`currency = "RM"`).

| الرقم | الملف والحقل | الحساب | إذا ناقص |
|---|---|---|---|
| الأرصدة اليوم | `finance.json › balances_block.items[]` (`key` = `treasury` و`monthly` و`daily` و`total`، والمبلغ `amount`) والوقت `balances_block.as_of` | عرض مباشر. هذه الكتلة أول شيء في قسم المال | غير مسجل |
| الحسابان | `finance.json › accounts[]` (`key` = `rhb` و`tng`، `amount`، `stated_at`) | عرض مباشر (وسمهما `مثبت`) | |
| تغير الأرصدة هذا الأسبوع | `finance.json › balance_history[]` (`date` و`treasury` و`monthly` و`daily` و`total` و`as_of`) | لكل صندوق: آخر نقطة داخل النافذة − آخر نقطة قبلها. النقاط تُنشأ عند الأحداث فقط، فبداية الأسبوع = آخر نقطة قبل الأحد | إذا ما في نقطة قبل النافذة: غير مسجل (أقدم نقطة 2026-10-20) |
| الصرف المبلغ عنه | `finance.json › recent_transactions[]` ← `type = "expense"` و`date` داخل النافذة | مجموع `amount`. عدد الحركات | غير مسجل إذا النافذة قبل أقدم صف في القائمة |
| الصرف المطبق على الصناديق | نفس الصفوف | مجموع `-cash_delta` للصفوف اللي `cash_delta` سالب. الصف اللي `cash_delta = 0.0` يعني «ما انحسب على صندوق» وليس أن المبلغ ما خرج، فيُعرض منفصلاً «بدون صندوق» | |
| الصرف حسب الفئة | `recent_transactions[].category_ar` و`category_confidence` | تجميع `amount` لكل فئة. الفئة `null` = «غير مصنف». الفئات أغلبها `افتراض` فاعرض وسمها | غير مسجل |
| صرف اليومية ومعدله | `recent_transactions[]` ← `wallet = "يومية"` و`cash_delta` سالب | مجموع `-cash_delta` ÷ عدد أيام النافذة المنقضية. محسوب | غير مسجل إذا ما في صفوف |
| أيام تغطية اليومية | `balances_block.items[key="daily"].amount` ومعدل الصرف أعلاه | الرصيد ÷ المعدل. إذا الرصيد سالب اعرض «سالبة» | غير مسجل إذا المعدل 0 أو ناقص |
| تعبئات اليومية المجدولة | `finance.json › schedule.periods[]` (`from` و`to` و`per_day` و`status` و`confidence`) | `per_day × عدد أيام النافذة داخل الفترة`. فترة `status = "open"` (من 1 نوفمبر) تُعرض «مفتوح [افتراض]» | |
| أيام تغطية الشهري | `balances_block.items[key="monthly"].amount` و`schedule.periods[].per_day` | الرصيد ÷ `per_day` للفترة الفعالة. وتُعرض معها `finance.json › computed_notes[].text_ar` كما هي (فيها حساب النقص) | |
| البنود المالية المفتوحة | `finance.json › open_items[]` (`id` و`status` و`title_ar` و`amount` و`confidence`) | قائمة وعددها | إذا فاضية: «لا بنود» |
| الديون عند الناس | `finance.json › receivables[]` (`person_ar` و`amount` و`last_recorded_amount`) | عرض. `amount = null` يعني غير مؤكد فاعرض «غير مسجل» مع آخر مبلغ مسجل ووسمه | |
| الدخل الشهري | `finance.json › planning_inputs.monthly_income.value` | لا يُحسب شيء | **غير مسجل** (قيمته `null`) |
| سقوف الفئات | `planning_inputs.category_caps.value` | بدون سقف لا تعرض شريط تقدم | **غير مسجل** |
| قرار تمويل 1 نوفمبر | `planning_inputs.nov_funding_decision.value` | | **غير مسجل** |
| عدد البنود المفتوحة (كل المجالات) | `dashboard_summary.json › open_loops_count` (`open_or_waiting` و`open` و`waiting` و`method_ar`) | عرض مباشر مع طريقة العدّ | |

ملاحظة: `recent_transactions` فيها آخر 60 حركة فقط من 67 (`recent_transactions_note_ar`). تاريخ الحركة ليس وقت تسجيلها (مثلاً صرف يوم 25 أكتوبر سُجل يوم 26).

---

## 5) الروتين

`routine.json` يصف الجدول الثابت، وما فيه سجل التزام. فلا تعرض «نسبة التزام بالروتين».

| الرقم | الملف والحقل | الحساب | إذا ناقص |
|---|---|---|---|
| كتل الدراسة للأسبوع القادم | `routine.json › weekly_study_blocks[]` (`name` و`start` و`end` و`days` و`days_ar` و`kind`) | قائمة حسب اليوم. مجموع الساعات = مجموع (`end − start`) × عدد الأيام. محسوب | غير مسجل |
| الكتل اليومية الثابتة | `routine.json › daily_blocks[]` (`name` و`start` و`end` و`days` و`kind`: `sleep` و`routine` و`prayer` و`free`) | تُعرض كشريط الأسبوع. الكتل اللي `moves_with_prayer_time = true` تتحرك مع وقت الصلاة | |
| الروتينات المحلية (ومنها المراجعة نفسها) | `routine.json › local_routines[]` (`name` و`time` و`flex_min` و`days` و`in_outlook` و`confidence`) | قائمة. تذكير بأن `in_outlook = false` يعني ليست في التقويم | |
| الإجازات والعطل في الأسبوع القادم | `routine.json › holidays[]` (`name_ar` و`from` و`to` و`confidence`) | إذا تقاطع `from`..`to` مع الأسبوع القادم اعرضها | «لا إجازات مسجلة» |
| التعارضات المعروفة | `routine.json › known_conflicts[]` (`id` و`text_ar`) | عدد وقائمة | |
| مرجع أوقات الصلاة | `routine.json › prayer_times_reference` (`date` و`zone` و`fajr` … `isha`) | تُعرض مع تاريخها لأنها قديمة نسبياً (14 أكتوبر) | |
| خطة التمرين | `habits.json › habits[key="workout"].week_plan[]` ثم `docs\SPORTS_PLANS_AR.json` | الخطة المختارة فقط. `unrecorded_inputs.workout_location` و`workout_days_per_week` قيمتهما `null` فلا قالب مختار | **غير مسجل** |

---

## 6) ترتيب الصفحة المقترح

1. **الرأس:** نافذة الأسبوع (من أي تاريخ إلى أي تاريخ) وملاحظة «السبت ما انتهى» إن لزم، ووقت آخر تحديث لكل ملف (`exports_meta.json`) وشارة «قديم».
2. **الصلاة:** الحضور في الأسبوع، ثم القضاء المتبقي حسب الصلاة والمجموع.
3. **العادات:** سلسلة كل عادة وعدّاد الأسبوع.
4. **الوزن:** آخر قراءة، التغير، المتبقي للهدف، وتنبيه التعارض.
5. **المال:** كتلة الأرصدة أولاً، ثم تغير الأسبوع، الصرف حسب الفئة، اليومية، البنود المفتوحة.
6. **الروتين والأسبوع القادم:** الدراسة، الإجازات، التعارضات.
7. **ما ينقص:** قائمة موحدة بكل «غير مسجل» (مع اسم الحقل) حتى يعرف محمد ماذا يعطي راشد.

حسب `OPERATING_MODEL.md` عندما يعمل البوت المراجعة الأسبوعية فهو يلخّص 3 نتائج و3 مخاطر وقيود الأسبوع القادم وقراراً واحداً ومصدر آخر تحديث. هذا مصدر فكرة اختيارية، ولا تحتاجه الصفحة. الصفحة تعرض الأرقام فقط.

---

## 7) ما لا تفعله الصفحة

- لا تكتب في أي ملف في `exchange\rashed\`.
- لا ترسل أمراً إلى راشد بدون موافقة محمد الصريحة في المحادثة (انظر `docs\REFRESH_PROTOCOL_AR.md` ومجلد `commands\`).
- لا تعرض رقماً بدون وسم ثقة، ولا تخفي «غير مسجل».
- لا تحسب أرقاماً لم تُسجل (الدخل، السقوف، القضاء المنجز الأسبوعي، وقت الفيب الأساسي).

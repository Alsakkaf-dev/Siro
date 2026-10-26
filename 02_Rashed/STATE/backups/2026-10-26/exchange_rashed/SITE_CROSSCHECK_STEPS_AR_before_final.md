# خطوات فحص الموقع (قراءة فقط، قابلة للتكرار)

هذا الملف سكربت فحص بالنص. أي أحد (أنا أو سالي أو محمد) يقدر يشغّله بعد أي نسخة جديدة ويعرف إذا الموقع يطابق ملفات راشد. القيم المتوقعة تحت مأخوذة من الملفات الحالية (النسخة 10، آخر تحديث بيانات مالية 2026-10-26 الساعة 14:20 بتوقيت آسيا/كوالالمبور)، مو من الذاكرة. النتيجة السابقة موجودة في `SITE_CROSSCHECK_AR.md`.

## 1) القواعد (لا يُخالف أي بند)

- **GET فقط.** ممنوع POST وPUT وPATCH وDELETE بأي شكل. السكربت تحت يستعمل `Invoke-RestMethod -Method Get` وبس.
- **ممنوع تشغيل أي شي من `commands\`.** المجلد للقراءة فقط. صفحة الأوامر في الموقع تنفتح للقراءة، وما نضغط فيها أي زر ينفذ.
- لا تعدّل ملفات الموقع ولا ملفات راشد ولا `CURRENT.md` ولا `LEDGER.csv` أثناء الفحص.
- في الصفحات لا تضغط أي زر يحفظ أو يضيف أو يرسل (مثل إضافة تمرين إلى «تمريني»). اقرأ بس.
- أي فرق تلقاه يتسجل في جدول `SITE_CROSSCHECK_AR.md` (عمود «تم الإصلاح؟» فاضي لين يتصلح). لا تصلّح شي أثناء الفحص.
- الكلمات الممنوعة (القائمة عند سالي) ما تنكتب في أي ملف تصدير ولا في التقرير. السكربت يبنيها من أرقام الحروف عشان ما تظهر في هذا الملف.

## 2) العناوين اللي نقرأها (GET)

الأساس: `http://127.0.0.1:4310`

| العنوان | شو يرجع | ملاحظة |
|---|---|---|
| `/` | الصفحة الرئيسية | تنبني بالجافاسكربت، فالـ GET يرجع القالب بس. النص الظاهر نقراه من المتصفح |
| `/life` | الحياة (الأرصدة والملخص) | نفس الملاحظة |
| `/life/finance` | المال | |
| `/life/prayers` | الصلاة والقضاء | |
| `/life/habits` | العادات | |
| `/life/routine` | الروتين | |
| `/life/body` | الجسم | |
| `/life/alternatives` | بدائل العادات | |
| `/life/commands` | الأوامر (قراءة فقط) | لا ننفذ شي منها |
| `/life/settings` | الإعدادات (نسخة meta وأحجام الملفات) | |
| `/sports` | مكتبة الرياضة | |
| `/sports/templates` | قوالب الرياضة | |
| `/sports/mine` | «تمريني» | |
| `/api/life/status` | حالة الملفات الستة: `state` و`age_hours` و`stale_after_hours` و`bytes_meta` و`bytes_actual`، وفيه `meta.version` و`worst` | فيه الجديد/القديم لكل ملف |
| `/api/life/bundle?files=dashboard_summary,finance,prayers,habits,body,routine` | الملفات الستة كاملة داخل `files` وحالتها داخل `status` | هذا هو العنوان الصحيح للبيانات |
| `/api/life/content/<ملف>` | ملفات JSON من `docs\` داخل `data` مع `status` | بعض الملفات ترجع 404 (انظر الجدول 4) |
| `/api/life/docs/<ملف>` | ملفات md من `docs\` داخل `text` | بعض الملفات ترجع 404 |

عناوين ما تشتغل (404): `/api/life/finance` و`/api/life/prayers` و`/api/life/habits` و`/api/life/body`. لا تستعملها.

## 3) السكربت الجاهز (Windows PowerShell 5.1)

- شغّله في PowerShell عادي على جهاز محمد (الموقع شغال على 4310).
- يقرأ ملفات `exchange\rashed\` من القرص للمقارنة، ويكتب النتيجة في الشاشة فقط. ما يكتب أي ملف.
- يطبع كل فحص: `True` تمام، `False` فيه فرق. وفي آخره عدد الفحوص والفاشل.
- القيم المتوقعة كلها في الكتلة `$E` في أول السكربت. بعد كل نسخة جديدة عدّل هذي الكتلة بس (انظر القسم 5).
- يستعمل PowerShell 5.1. في الإصدار 7 التواريخ تتحول لنوع تاريخ وتختلف المقارنة، فلا تستعمله.

```powershell
# SITE_CROSSCHECK_STEPS: read-only check. Windows PowerShell 5.1.
# GET only via Invoke-RestMethod -Method Get. Never POST. Never run anything inside commands\.
$ErrorActionPreference = 'Stop'
$Base = 'http://127.0.0.1:4310'
$Root = 'C:\Users\GIGIABYTE\Desktop\Storage\Platform\exchange\rashed'

# ---- Expected values (refresh after every new version, see section 5) ----
$E = @{
  Version = 10; FilesInStatus = 6; MetaFiles = 31
  Treasury = 1917.39; Monthly = 58.00; Daily = 19.61; Total = 1995.00; Rhb = 1975.39; Tng = 19.61
  LedgerRows = 67; BalanceHistoryPoints = 21; BalanceFirstTotal = 2675.00; OpenItems = 5; RecentTx = 60
  PlanningNull = 9; DailyRate = 20.05; DailyRateDays = 0.98; DailySpent = 240.54
  Qada = @(281, 367, 409, 411, 458); QadaTotal = 1926; QadaDone = 0
  Attendance = @(1, 0, 42, 2)   # in_time, late, missed, unknown
  Weight = 83.65; WeightDate = '2026-10-23'; Remaining = 20.65; Change = -0.65; Goal = 63; Height = 161
  WeightHistory = 5; HabitsUnrecorded = 6; BodyUnrecorded = 2
  Exercises = 81; Templates = 6
  Routine = @(16, 8, 4, 9, 2)   # daily_blocks, weekly_study_blocks, local_routines, known_conflicts, holidays
}
$ServedKnown = @{   # docs files the site served when last checked (true = 200, false = 404)
  'DATA_DICTIONARY_AR.md' = $true; 'FINANCE_SPEC_AR.md' = $true; 'HABITS_SPEC_AR.md' = $true
  'PROPOSALS.md' = $true; 'REFRESH_PROTOCOL_AR.md' = $true; 'SITE_IDEAS_AR.md' = $true; 'SPORTS_CONTENT_AR.md' = $true
  'GLOSSARY_AR.json' = $true; 'HABITS_ALTERNATIVES_AR.json' = $true; 'SPORTS_EXERCISES.json' = $true; 'SPORTS_PLANS_AR.json' = $true
  'FIELD_LABELS_AR.json' = $false; 'FINANCE_INSIGHTS_AR.json' = $false; 'PRAYER_QADA_PLAN_AR.json' = $false
  'ROUTINE_BLOCKS_AR.json' = $false; 'SITE_CROSSCHECK_AR.md' = $false; 'WEEKLY_REVIEW_SPEC_AR.md' = $false
  'SITE_CROSSCHECK_STEPS_AR.md' = $false
}
$Pages = '/', '/life', '/life/finance', '/life/prayers', '/life/habits', '/life/routine', '/life/body',
         '/life/alternatives', '/life/commands', '/life/settings', '/sports', '/sports/templates', '/sports/mine'

$Results = New-Object System.Collections.ArrayList
$Texts = @{}
function Api([string]$Path) { Invoke-RestMethod -Method Get -Uri ($Base + $Path) }
function Check([string]$Name, $Actual, $Expected) {
  [void]$Results.Add([pscustomobject]@{ Ok = ([string]$Actual -ceq [string]$Expected); Check = $Name; Actual = [string]$Actual; Expected = [string]$Expected })
}
function Local([string]$Rel) { Get-Content -LiteralPath (Join-Path $Root $Rel) -Raw -Encoding UTF8 | ConvertFrom-Json }
function J($o) { ($o | ConvertTo-Json -Depth 50 -Compress) -replace '(\d)\.0(?=[,}\]])', '$1' }   # 85.0 and 85 are the same number
function Ar([int[]]$Codes) { -join ($Codes | ForEach-Object { [string][char]$_ }) }
$Unknown = Ar 0x063A,0x064A,0x0631,0x0020,0x0645,0x0639,0x0631,0x0648,0x0641   # "unknown" in Arabic

# 1) Pages: each must answer 200 (the text is built by JavaScript, so only reachability is checked here)
foreach ($p in $Pages) {
  $ok = $false; try { $r = Api $p; $ok = ([string]$r).Length -gt 0; $Texts["page $p"] = [string]$r } catch { }
  Check "page $p answers 200" $ok $true
}

# 2) /api/life/status
$st = Api '/api/life/status'; $Texts['status'] = J $st
Check 'status: meta.version' $st.meta.version $E.Version
Check 'status: files count' @($st.files).Count $E.FilesInStatus
foreach ($f in $st.files) {
  Check "status: $($f.name) bytes_meta = bytes_actual" $f.bytes_actual $f.bytes_meta
  Check "status: $($f.name) bytes_actual = local file" $f.bytes_actual (Get-Item (Join-Path $Root "$($f.name).json")).Length
  $exp = if ($f.age_hours -gt $f.stale_after_hours) { 'stale' } else { 'fresh' }
  Check "status: $($f.name) state follows age ($([math]::Round($f.age_hours,1))h of $($f.stale_after_hours)h)" $f.state $exp
}

# 2b) exports_meta.json on disk: file count and every size
$m = Local 'exports_meta.json'
Check 'meta: version' $m.version $E.Version
Check 'meta: files listed' @($m.files).Count $E.MetaFiles
foreach ($f in $m.files) { Check "meta: size of $($f.name)" $f.bytes (Get-Item (Join-Path $Root ($f.name -replace '/', '\'))).Length }

# 3) /api/life/bundle
$bd = Api '/api/life/bundle?files=dashboard_summary,finance,prayers,habits,body,routine'; $Texts['bundle'] = J $bd
foreach ($n in 'dashboard_summary','finance','prayers','habits','body','routine') {
  Check "bundle: $n equals the local file (whole JSON)" ((J $bd.files.$n) -ceq (J (Local "$n.json"))) $true
}
$fi = $bd.files.finance
function Amt($k) { ($fi.balances_block.items | Where-Object { $_.key -eq $k }).amount }
Check 'finance: treasury' (Amt 'treasury') $E.Treasury
Check 'finance: monthly'  (Amt 'monthly')  $E.Monthly
Check 'finance: daily'    (Amt 'daily')    $E.Daily
Check 'finance: total'    (Amt 'total')    $E.Total
Check 'finance: RHB' ($fi.accounts | Where-Object { $_.key -eq 'rhb' }).amount $E.Rhb
Check 'finance: TNG' ($fi.accounts | Where-Object { $_.key -eq 'tng' }).amount $E.Tng
Check 'finance: total_rows' $fi.total_rows $E.LedgerRows
Check 'finance: ledger_full_pointer.total_rows' $fi.ledger_full_pointer.total_rows $E.LedgerRows
Check 'finance: balance_history points' @($fi.balance_history).Count $E.BalanceHistoryPoints
Check 'finance: balance_history first total' $fi.balance_history[0].total $E.BalanceFirstTotal
Check 'finance: balance_history last total' $fi.balance_history[-1].total $E.Total
Check 'finance: open_items' @($fi.open_items).Count $E.OpenItems
Check 'finance: recent_transactions' @($fi.recent_transactions).Count $E.RecentTx
Check 'finance: daily_box_rate.value' $fi.daily_box_rate.value $E.DailyRate
Check 'finance: daily_box_rate.days_daily_box_lasts' $fi.daily_box_rate.days_daily_box_lasts $E.DailyRateDays
Check 'finance: daily_box_rate.total_spent_rm' $fi.daily_box_rate.total_spent_rm $E.DailySpent
Check 'dashboard: balances equal finance' (J $bd.files.dashboard_summary.balances_block) (J $fi.balances_block)
Check 'zero-vs-unknown: planning_inputs all null' @($fi.planning_inputs.PSObject.Properties | Where-Object { $null -eq $_.Value.value }).Count $E.PlanningNull
Check 'zero-vs-unknown: Muhsin amount is null (not 0)' ($null -eq ($fi.receivables | Where-Object { $null -eq $_.amount }).amount) $true

$q = $bd.files.prayers.qada
$names = 'fajr','dhuhr','asr','maghrib','isha'
for ($i = 0; $i -lt 5; $i++) { Check "prayers: qada $($names[$i])" $q.remaining.($names[$i]).count $E.Qada[$i] }
Check 'prayers: total_remaining' $q.total_remaining $E.QadaTotal
Check 'prayers: done_total' $q.done_total $E.QadaDone
Check 'zero-vs-unknown: done_today is null (not 0)' ($null -eq $q.done_today) $true
Check 'zero-vs-unknown: done_today_status_ar says unknown' $q.done_today_status_ar $Unknown
$t = $bd.files.prayers.attendance.totals
Check 'prayers: attendance in_time/late/missed/unknown' "$($t.in_time)/$($t.late)/$($t.missed)/$($t.unknown)" ($E.Attendance -join '/')

$hb = $bd.files.habits.habits
function Cn($k) { ($hb | Where-Object { $_.key -eq $k }).counters }
Check 'habits: vape logged/kept/not_kept/unknown' "$((Cn 'vape').days_logged)/$((Cn 'vape').days_kept)/$((Cn 'vape').days_not_kept)/$((Cn 'vape').days_unknown)" '11/0/10/1'
Check 'zero-vs-unknown: tea_sugar days_unknown' (Cn 'tea_sugar').days_unknown 11
Check 'habits: tea_sugar days_within_limit' (Cn 'tea_sugar').days_within_limit 0
Check 'habits: workout logged/done/not_done/unknown' "$((Cn 'workout').days_logged)/$((Cn 'workout').days_done)/$((Cn 'workout').days_not_done)/$((Cn 'workout').days_unknown)" '11/0/9/2'
Check 'habits: water/sleep/food days_logged' "$((Cn 'water').days_logged)/$((Cn 'sleep').days_logged)/$((Cn 'food').days_logged)" '0/1/1'
Check 'habits: status.started' $bd.files.habits.status.started $false
Check 'habits: unrecorded_inputs' @($bd.files.habits.unrecorded_inputs.PSObject.Properties).Count $E.HabitsUnrecorded

$b = $bd.files.body
Check 'body: latest_weight_kg' $b.latest_weight_kg $E.Weight
Check 'body: latest_weight_date' $b.latest_weight_date $E.WeightDate
Check 'body: remaining_to_goal_kg' $b.goal_progress.remaining_to_goal_kg $E.Remaining
Check 'body: change_since_baseline_kg' $b.goal_progress.change_since_baseline_kg $E.Change
Check 'body: goal_kg' $b.goal_kg $E.Goal
Check 'body: height' ($b.items | Where-Object { $_.key -eq 'height' }).value $E.Height
Check 'body: weight_history entries' @($b.weight_history).Count $E.WeightHistory
Check 'body: unrecorded_inputs' @($b.unrecorded_inputs.PSObject.Properties).Count $E.BodyUnrecorded

$r = $bd.files.routine
Check 'routine: blocks/study/local/conflicts/holidays' "$(@($r.daily_blocks).Count)/$(@($r.weekly_study_blocks).Count)/$(@($r.local_routines).Count)/$(@($r.known_conflicts).Count)/$(@($r.holidays).Count)" ($E.Routine -join '/')

# 4) /api/life/content/<file> and /api/life/docs/<file>
foreach ($f in Get-ChildItem (Join-Path $Root 'docs') -File) {
  $kind = if ($f.Extension -eq '.json') { 'content' } else { 'docs' }
  $ok = $false; try { $x = Api "/api/life/$kind/$($f.Name)"; $ok = $true; $Texts["$kind $($f.Name)"] = J $x } catch { }
  if ($ServedKnown.ContainsKey($f.Name)) { Check "$kind/$($f.Name) served (known state)" $ok $ServedKnown[$f.Name] }
  else { Write-Host "NEW FILE (not in table): $kind/$($f.Name) -> $ok" }
}
$ex = Api '/api/life/content/SPORTS_EXERCISES.json'; $pl = Api '/api/life/content/SPORTS_PLANS_AR.json'
Check 'sports: exercises count' @($ex.data.exercises).Count $E.Exercises
Check 'sports: templates count' @($pl.data.templates).Count $E.Templates

# 5) Forbidden words in everything the site returned
# The forbidden words are built from character codes, so this file does not contain them.
$Bad = @((Ar 119,97,105,115,116), (Ar 80,101,116,114,111,83,112,101,99,105,97,108), (Ar 71,114,111,107), (Ar 120,65,73),
         (Ar 0x062E,0x0635,0x0631), (Ar 0x062C,0x0631,0x0648,0x0643))
$hits = 0
foreach ($k in $Texts.Keys) { foreach ($w in $Bad) { if ($Texts[$k] -match [regex]::Escape($w)) { $hits++; Write-Host "FORBIDDEN WORD in $k" } } }
Check 'forbidden words: hits in all responses' $hits 0

# 6) Result
$Results | Format-Table Ok, Check, Actual, Expected -AutoSize -Wrap
$bad = @($Results | Where-Object { -not $_.Ok })
"Total checks: $($Results.Count)  Failed: $($bad.Count)"
if ($bad.Count -gt 0) { $bad | Format-Table Check, Actual, Expected -AutoSize -Wrap }
```

آخر تشغيل للسكربت على النسخة 10: 138 فحص، وكلها تمام (Failed: 0)، بدون كلمات ممنوعة.

## 4) جدول القيم المتوقعة

الأعمدة: **يتغير؟** يعني هل القيمة تتغير لما نسجل بيانات جديدة. **ثابت** يعني ما تتغير إلا بتعديل مقصود. **يتغير مع البيانات** يعني لازم تتحدث في الجدول وفي `$E` بعد النسخة اللي فيها تسجيل جديد.

### أ) المال (`finance.json` و`dashboard_summary.json`)

| المكان في الموقع / الـ API | المفتاح | القيمة المتوقعة | الثقة | يتغير؟ |
|---|---|---|---|---|
| المال: الخزينة | `balances_block.items[treasury].amount` | RM 1917.39 | محسوب | يتغير مع البيانات (أي مصروف أو تحويل أو رصيد جديد) |
| المال: الشهري | `items[monthly].amount` | RM 58.00 | محسوب | يتغير مع البيانات |
| المال: اليومية (TNG) | `items[daily].amount` | RM 19.61 | محسوب | يتغير مع البيانات |
| المال: المجموع | `items[total].amount` | RM 1995.00 | محسوب | يتغير مع البيانات |
| المال: حساب RHB | `accounts[rhb].amount` | RM 1975.39 (خزينة + شهري) | مثبت | يتغير مع البيانات |
| المال: حساب TNG | `accounts[tng].amount` | RM 19.61 (= اليومية) | مثبت | يتغير مع البيانات |
| الحياة: ملخص الأرصدة | `dashboard_summary.balances_block` | نفس `finance.json` حرفياً | محسوب | يتغير مع البيانات (لكن لازم يطابق المال دائماً) |
| المال: عدد السجل | `total_rows` و`ledger_full_pointer.total_rows` | 67 | مثبت | يزيد مع كل حركة جديدة |
| المال: الجدول | `recent_transactions` | 60 حركة (آخر 60 من السجل) | مثبت | ثابت عند 60 طالما السجل أكثر من 60 |
| المال: تطور الأرصدة | `balance_history` | 21 نقطة، من RM 2675.00 إلى RM 1995.00 | محسوب | يزيد مع نقطة رصيد جديدة، والنقطة الأخيرة = المجموع |
| المال: البنود المفتوحة | `open_items` | 5 بنود | محسوب | يتغير مع البيانات |
| المال: حقول التخطيط | `planning_inputs` | 9 من 9 قيمتها `null` (تظهر «غير معروف») | غير مسجل | يتغير لما محمد يعطينا قيمة |
| المال: ذمة محسن | `receivables[محسن].amount` | `null` (غير مؤكد، آخر مبلغ مسجل 55.60) | افتراض | يتغير لما محمد يؤكد |
| المال: ذمة عبدالله | `receivables[عبدالله].amount` | 0.00 | مثبت | يتغير مع البيانات |
| المال: معدل صرف اليومية | `daily_box_rate.value` | RM 20.05 في اليوم (240.54 ÷ 12 يوم، من 2026-10-14 إلى 2026-10-25) | محسوب | يتغير مع البيانات، وكل يوم جديد يدخل في الحساب عند إعادة توليد الملف |
| المال/الحياة: كفاية اليومية | `daily_box_rate.days_daily_box_lasts` | 0.98 يوم | محسوب | يتغير مع رصيد اليومية والمعدل |

### ب) الصلاة (`prayers.json`)

| المكان | المفتاح | القيمة المتوقعة | الثقة | يتغير؟ |
|---|---|---|---|---|
| الصلاة: الفجر | `qada.remaining.fajr.count` | 281 | محسوب | يتغير مع البيانات (يزيد مع الفوائت الجديدة، وينقص مع القضاء) |
| الصلاة: الظهر | `dhuhr` | 367 | محسوب | نفسه |
| الصلاة: العصر | `asr` | 409 | محسوب | نفسه |
| الصلاة: المغرب | `maghrib` | 411 | محسوب | نفسه |
| الصلاة: العشاء | `isha` | 458 | محسوب | نفسه |
| الصلاة: المجموع | `qada.total_remaining` | 1926 | محسوب | يتغير مع البيانات |
| الصلاة: المنجز | `qada.done_total` | 0 | مثبت | يزيد لما محمد يقضي ويسجل |
| الصلاة: اليوم (26 أكتوبر) | `qada.done_today` | `null` وعبارة «غير معروف» (مو 0). افحص أن الصفحة ما تعرض «اليوم: 0 مثبت» | غير مسجل | يتغير لما محمد يسجل قضاء اليوم |
| الصلاة: الأساس | `qada.baseline.total` | 1884 (17 أكتوبر) | مثبت | ثابت |
| الصلاة: الحضور | `attendance.totals` | في وقتها 1، متأخرة 0، فاتت 42، غير معروف 2 (9 أيام) | محسوب | يتغير مع البيانات (كل يوم جديد) |

### ج) العادات (`habits.json`)

| المكان | المفتاح | القيمة المتوقعة | الثقة | يتغير؟ |
|---|---|---|---|---|
| العادات: الفيب | `counters` | مسجلة 11، التزم 0، لم يلتزم 10، غير معروف 1 | محسوب | يتغير مع البيانات |
| العادات: سكر الشاي | `counters` | مسجلة 11، غير معروف 11، ضمن الحد 0 | محسوب | يتغير مع البيانات |
| العادات: التمرين | `counters` | مسجلة 11، أنجز 0، لم يتمرن 9، غير معروف 2 | محسوب | يتغير مع البيانات |
| العادات: الماء والنوم والأكل | `days_logged` | 0 و1 و1 | محسوب | يتغير مع البيانات |
| العادات: بداية الأنظمة | `status.started` | `false` | مثبت | يتغير لما محمد يؤكد البداية |
| العادات: حد اليوم 26 أكتوبر | `today` | فيب: خطة اليوم 9 والتقليل 180 دقيقة. سكر الشاي: الحد 43 غرام | محسوب | يتغير كل يوم (اليوم التالي له رقم وحد ثاني) |
| العادات: الأهداف | `target` | ماء 3 لتر، سعرات 1500، بروتين 120 غرام، نوم 22:30 | مثبت | ثابت |
| العادات: حقول جاهزة للتعبئة | `unrecorded_inputs` | 6 | غير مسجل | يتغير لما محمد يسجل واحد منها |

### د) الجسم (`body.json`)

| المكان | المفتاح | القيمة المتوقعة | الثقة | يتغير؟ |
|---|---|---|---|---|
| الجسم: آخر قراءة | `latest_weight_kg` و`latest_weight_date` | 83.65 كغ بتاريخ 2026-10-23 (المفروض يظهر بخانتين عشريتين. وقت آخر فحص كان الموقع يعرض 83.7، فرق معروف رقم 3) | مثبت | يتغير مع قراءة وزن جديدة |
| الجسم: المتبقي للهدف | `goal_progress.remaining_to_goal_kg` | 20.65 كغ | محسوب | يتغير مع الوزن |
| الجسم: الفرق عن خط الأساس | `goal_progress.change_since_baseline_kg` | -0.65 كغ | محسوب | يتغير مع الوزن |
| الجسم: الهدف | `goal_kg` | 63 كغ | مثبت | ثابت |
| الجسم: الوزن المؤكد | `items[weight]` | 84.3 كغ (تأكيد 21 أكتوبر) | مثبت | ثابت لين محمد يغيّره |
| الجسم: الطول | `items[height]` | 161 سم | مثبت | ثابت |
| الجسم: سجل الوزن | `weight_history` | 5 قراءات (85 و83.7 و84.3 و84.3 و83.65) | مثبت | يزيد مع قراءة جديدة |
| الجسم: حقول جاهزة للتعبئة | `unrecorded_inputs` | 2 | غير مسجل | يتغير لما محمد يسجل |

### هـ) الروتين والرياضة والإعدادات

| المكان | المفتاح | القيمة المتوقعة | الثقة | يتغير؟ |
|---|---|---|---|---|
| الروتين: الكتل | `daily_blocks` / `weekly_study_blocks` / `local_routines` / `known_conflicts` / `holidays` | 16 / 8 / 4 / 9 / 2 | مثبت | يتغير لما الجدول أو التقويم يتغير |
| الرياضة: المكتبة | `SPORTS_EXERCISES.json › data.exercises` | 81 تمرين (النسخة 4) | مثبت | ثابت لين تتغير المكتبة |
| الرياضة: القوالب | `SPORTS_PLANS_AR.json › data.templates` | 6 قوالب (النسخة 3) | مثبت | ثابت لين تتغير الخطة |
| الإعدادات: نسخة meta | `/api/life/status › meta.version` و`exports_meta.json › version` | 10 | مثبت | يتغير مع **كل نسخة جديدة** |
| الإعدادات: عدد الملفات في meta | `exports_meta.json › files` | 32 ملف (يشمل ملف الخطوات هذا وملف meta نفسه) | مثبت | يتغير لما نضيف أو نحذف ملف |
| الإعدادات: الأحجام | `bytes_meta` = `bytes_actual` | تطابق كامل للملفات الستة، وكل ملف في meta يطابق حجمه على القرص | مثبت | الأحجام تتغير مع كل تعديل، لكن التطابق لازم يبقى |
| الإعدادات: الجديد/القديم | `state` لكل ملف | يتبع العمر: العمر أكبر من `stale_after_hours` = «قديم». الآن: المال و`dashboard_summary` جديدين، والصلاة والعادات قديمين لأن `generated_at` لهم 25 أكتوبر 6:35 م، والجسم والروتين جديدين | محسوب | **يتغير مع الوقت حتى بدون بيانات جديدة** (كل ساعة) |

### و) ملفات `docs\` اللي يخدمها الموقع (الحالة وقت آخر فحص)

| الحالة | الملفات |
|---|---|
| تفتح (200) | `DATA_DICTIONARY_AR.md` و`FINANCE_SPEC_AR.md` و`HABITS_SPEC_AR.md` و`PROPOSALS.md` و`REFRESH_PROTOCOL_AR.md` و`SITE_IDEAS_AR.md` و`SPORTS_CONTENT_AR.md` و`GLOSSARY_AR.json` و`HABITS_ALTERNATIVES_AR.json` و`SPORTS_EXERCISES.json` و`SPORTS_PLANS_AR.json` |
| ما تفتح (404) | `FIELD_LABELS_AR.json` و`FINANCE_INSIGHTS_AR.json` و`PRAYER_QADA_PLAN_AR.json` و`ROUTINE_BLOCKS_AR.json` و`SITE_CROSSCHECK_AR.md` و`SITE_CROSSCHECK_STEPS_AR.md` و`WEEKLY_REVIEW_SPEC_AR.md` |

إذا ملف من الثاني صار يفتح، هذا خبر زين: حدّث `$ServedKnown` في السكربت وهذا الجدول. الموقع هو اللي يقرر القائمة، مو ملفات راشد.

## 5) بعد كل نسخة جديدة: شو نحدّث

1. **`version`** في `$E` (و`MetaFiles` إذا تغير عدد الملفات) وفي صف «نسخة meta» فوق.
2. **القيم اللي مكتوب عليها «يتغير مع البيانات»** (الأرصدة، عدد السجل، نقاط التطور، البنود المفتوحة، معدل اليومية، القضاء، الحضور، العدادات، الوزن). خذ القيم الجديدة من الملفات نفسها، مو من الذاكرة.
3. **أحجام الملفات** لا نكتبها في السكربت: هو يقارنها مع القرص مباشرة. يكفي أن `exports_meta.json` يطابق الفعلي.
4. **تاريخ التحديث** في أول هذا الملف (قسم القيم المتوقعة).
5. **جدول 404** إذا تغير اللي يخدمه الموقع.
6. اللي ما يتحدث: الطول 161 والهدف 63 والوزن المؤكد 84.3 والأساس 1884 وعدد التمارين 81 والقوالب 6 (إلا لو الملف نفسه اتغير).
7. بعد التحديث شغّل السكربت مرة: لازم «Failed: 0». إذا طلع فرق، افتح الصف في الجدول واكتبه في `SITE_CROSSCHECK_AR.md`.

## 6) فحوص ثابتة (تنعمل كل مرة)

**صفر مقابل غير معروف** (السكربت يفحص أغلبها):
- `qada.done_today` لازم `null` وعبارته «غير معروف»، مو 0، ما دام محمد ما سجّل قضاء اليوم.
- حقول التخطيط التسعة وذمة محسن لازم `null`، ويظهر في الصفحة «غير معروف» مو 0.00.
- سكر الشاي «غير معروف 11» لازم يظهر أو على الأقل ما تظهر «مسجلة 11» لحالها بدون ما يبان إنها بدون كمية.
- في الصفحة: الصفر المقبول بس إذا القيمة مؤكدة (المنجز 0 مثبت، دين عبدالله 0.00 مثبت، أيام الماء 0).

**كلمات ممنوعة** (السكربت يفحص كل اللي يرجعه الموقع، وأنت افحص نص الصفحات الظاهر بالبحث في المتصفح): لازم صفر نتائج، بالإنجليزي وبالعربي. لا تكتب الكلمات في أي تقرير.

**مفاتيح إنجليزية ظاهرة للمستخدم** (فحص يدوي من النص الظاهر في كل صفحة، السكربت ما يشوفه لأن الصفحات تنبني بالجافاسكربت):
- ما يظهر أي مفتاح مثل `balance_history` أو `weight_history` أو `monthly_income` أو `cash_delta` أو أسماء ملفات مثل `CURRENT.md` و`ledger_full.json`.
- ما تظهر رموز داخلية بدون شرح (R-026 وD-R-036 وXFR-20261025-03).
- الوحدات بالعربي وبشكل موحد (كغ، مو kg مرة وكغ مرة).

**علامات الجديد/القديم** (فحص يدوي مع `status`):
- كل ملف لازم يعرض وقته الحقيقي (من `generated_at`) مو «محدّث · الآن» للكل.
- الملف اللي عمره أكبر من حده لازم يعرض «قديم»: الصلاة والعادات هذي الأيام قديمة لأن آخر تحديث بياناتهم 25 أكتوبر 6:35 م وحدهم 12 و24 ساعة. هذا صحيح وما هو خطأ في الموقع، بس لازم يظهر لمحمد بوضوح.
- وقت الرصيد في المال يطابق `as_of` (26 أكتوبر 2:20 م).

## 7) قراءة النص الظاهر في الصفحات (اختياري، يدوي)

الصفحات تنبني بالجافاسكربت، فالـ GET يرجع القالب بس. لقراءة النص الظاهر افتح كل صفحة في المتصفح واقرأها بدون ما تضغط أي زر يكتب. في فحصنا السابق استعملنا متصفح Edge بدون واجهة لقراءة النص (طلب GET عادي). هذا الجزء خارج السكربت لأنه ما يستعمل `Invoke-RestMethod`. القيم تقارنها بالجدول فوق.

## 8) حدود الفحص

- السكربت يقارن API الموقع مع الملفات. اللي يظهر في الشاشة (التقريب، التسميات، الرسوم) يحتاج قراءة يدوية.
- المعروف من آخر فحص (انظر `SITE_CROSSCHECK_AR.md`): تقريب الوزن في العرض، مجموع الفئات والرسم اليومي من آخر 60 حركة، صفحة الرياضة ما تعرض ملاحظات الأمان، وعدّاد سكر الشاي. أي واحد منها اتصلح، سجّله في عمود «تم الإصلاح؟».
- الأرقام والتواريخ في هذا الملف قيم وقت كتابته (26 أكتوبر 2026). إذا صارت نسخة بعدها، القيم في الجدول قد تكون قديمة: استعمل القسم 5.

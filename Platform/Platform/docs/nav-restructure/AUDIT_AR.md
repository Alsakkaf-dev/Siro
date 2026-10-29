# نتائج فحص التنقل والتنظيم (مرجع الحقائق)

مصدرها ثلاث جولات قراءة للشيفرة (دون تشغيل متصفح إلا حيث ذُكر «خط الأساس»). المسارات نسبة إلى `Platform/Platform`، ومسارات الواجهة نسبة إلى `web/src` ما لم يُذكر غير ذلك. ما وُسم «استنتاج» لم يُختبر في متصفح. أرقام الأسطر قد تزحف بعد أي تعديل: تحقق قبل الاستشهاد.

## 1) خط الأساس المقيس (scripts/browser-smoke.mjs، 37 مسارًا × 1280 و390)
- أخطاء console/صفحة: 0؛ تمرير أفقي على الجوال: 0؛ كل صفحة لها h1 عدا 404.
- **العناوين الفريدة 5 فقط** من 37 مسارًا (`المنصة الشخصية` ×5، `الفصول · …` ×9، `المكتبة · …` ×6، `الحياة · …` ×14، `الرياضة · …` ×3).
- **عنصران نشطان في الشريط الجانبي** على 7 مسارات للفصل (`/academic/s/:id` وفروعه الستة): عنصر الصفحة + رمز الفصل تحت «مدير الفصول».
- **لا عنصر نشط** على `/library/f/:id`، `/library/y/:id`، `/search`، و404.
- **بلا فتات خبز (crumbs)**: `/`، `/library`، `/life/ledger`، `/life/routine-map`، `/life/insights`، `/life/qada-plan`، `/review`، `/settings`، `/search`، 404.
- هدف ما بعد P1: عناوين فريدة ≥ 33، عنصر نشط واحد بالضبط لكل صفحة مسجلة، فتات خبز لكل صفحة عمقها > 1.

## 2) المسارات (App.tsx) — 36 صفحة + إعادة توجيه + صيد الكل
كلها تحت مسار تخطيط بلا مسار `<Route element={<Shell/>}>` (App.tsx:53). متحمّلة بكسل `lazy` عدا Shell وSemesterLayout وDashboard (eager).

| المسار | المكوّن |
|---|---|
| `/` | Home (يُستبدل بـ Today) |
| `/academic` | Semesters (عبر AcademicIndex) |
| `/academic/s/:semId` (تخطيط SemesterLayout يوفّر `useSem()`) | Dashboard · `courses` Courses · `courses/:courseId` CoursePage · `timeline` Timeline · `calculator` Calculator · `weights` Weights · `unknowns` Unknowns · `print` PrintSummary |
| `/library` · `/library/folders` · `/library/youtube` · `/library/settings` · `/library/f/:id` · `/library/y/:id` | Library · LibraryFolders · LibraryYoutube · LibrarySettings · LibraryItem(source=file|youtube) |
| `/life` + `finance` `prayers` `habits` `routine` `body` `alternatives` `ledger` `routine-map` `insights` `qada-plan` `glossary` `commands` `settings` | Life · LifeFinance · LifePrayers · LifeHabits · LifeRoutine · LifeBody · LifeAlternatives · LifeLedger · LifeRoutineMap · LifeInsights · LifeQadaPlan · Glossary · LifeCommands · LifeSettings |
| `/review` `/settings` `/search` | Review · Settings · SearchPage |
| `/sports` `/sports/templates` `/sports/mine` | Sports · SportsTemplates · SportsMine |
| `/home` | `<Navigate to="/" replace>` (الوحيدة) |
| `*` | NotFound (داخل Shell، والشريط الجانبي يتبع بادئة الرابط) |

معرّفات الفصل: `sem5` (بذرة) أو 16 hex عشوائية (`server/repo.ts:5`). `LibraryItem` يقبل معرّفات قديمة بالبادئة `f:`/`y:` (`LibraryItem.tsx:212`). لا يوجد `navigate(-1)` في أي مكان؛ لا زر رجوع داخل التطبيق.

## 3) الصدفة والتنقل الحالي
- `shell/Shell.tsx`: الشريط الجانبي = قائمة المنصة المطابقة لبادئة الرابط (`:45`)، وإن لم تطابق (`/`، `/review`، `/settings`، `/search`، 404) فقائمة الأكاديمي (`:46`) دون تمييز منصة. مجموعة «عام» (الرئيسية/مراجعة الأسبوع/الإعدادات والنسخ) تُلحق بكل قائمة (`:110-115`). مبدّل المنصات يظهر مرتين: الشريط العلوي (≥961px) وأعلى الدرج (≤960) (`:100,127,187-204`)، ويستعمل `startsWith` غير واعٍ بالمقاطع.
- الشريط العلوي (بالترتيب): burger (≤960) · مبدّل المنصات · مساحة · Palette · SemChip · الجرس · مفتاحا فاتح/داكن · زر «#» للاختصارات · صورة «م» غير تفاعلية (`:125-140`).
- محتوى قوائم المنصات (`core/plugins.config.tsx`):
  - الفصول: «الفصل الحالي»: لوحة الفصل `g d`، المواد `g c`، الجدول الزمني `g t`، حاسبة الدرجات `g k`، خريطة الأوزان `g w`، غير المعروف `g u` (شارة العدد تحل محل التلميح)؛ «الفصول»: مدير الفصول `g s` وأبناؤه رموز الفصول (تظهر عند `/academic` أو تحت أحدها).
  - المكتبة: المكتبة، المجلدات، YouTube، إعدادات المكتبة.
  - الحياة (12 + «أدوات» 2): نظرة عامة، المال، مؤشرات المال، السجل الكامل، الصلاة، خطة القضاء، العادات، الروتين، خريطة الأسبوع، الجسم، بدائل العادات، قاموس المصطلحات؛ الأوامر (مسودات)، إعدادات الحياة.
  - الرياضة: مكتبة التمارين، القوالب الأسبوعية، تمريني؛ «روابط»: بدائل العادات، الوزن والجسم، قاموس المصطلحات (كلها `/life/*` فتقلب المنصة).
- `core/plugin.ts`: `PlatformPlugin {id,name,tagline,color,version,basePath,icon,status,nav(ctx)}` — سجل قوائم وبطاقات فقط. المسارات والـPalette والاختصارات والبحث والجلب المسبق وPWA مكتوبة يدويًا في أماكن أخرى. العقد الأصلي (`01_Sally/PLATFORM/PLATFORM_BLUEPRINT.html`) يتضمن `routes/widgets/search/calendar/…` ولم يُنفَّذ.
- كود ميت: `pages/Soon.tsx` (لا يستورده أحد)، فروع `status:'soon'` (`Shell.tsx:192-195`، `Home.tsx:47`)، CSS: `.tabs/.tab`، `.nav-link.disabled`.
- العنوان: `document.title = «اسم المنصة · المنصة الشخصية»` (`Shell.tsx:49-51`). لا إدارة تمرير ولا تركيز عند التنقل. رابط التخطي `#main` يضيف hash يفسره CoursePage/Glossary كعمق رابط.
- **ترتيب التأثيرات في React**: تأثير الابن يسبق تأثير الأب، فأي `document.title` يضعه ابن يطغى عليه تأثير Shell. الحل المخطط: سياق عنوان تضع فيه الصفحة تجاوزًا ويحسب Shell العنوان النهائي.
- `BrowserRouter` يلف التنقل بـ`startTransition`: الرابط إلى مقطع lazy غير محمَّل يُبقي الصفحة القديمة دون مؤشر انتظار.

## 4) الاختصارات والبحث
- `Shell.tsx:53-87`: Ctrl/Cmd+K يركّز البحث؛ `/` يركّزه؛ `g` ثم (خلال 1200ms) `h s d c t k w u r ,`؛ `?` يفتح النافذة؛ Esc يغلق النوافذ والقوائم (الدرج لا). كلها `e.key` لاتيني (تفشل بلوحة عربية)؛ التلميح يعرض «؟» (U+061F) والمعالج يتوقع `?`. بلا فصل: `g c` يذهب إلى `/academic/courses` (404). لا شيء للمكتبة/الحياة/الرياضة.
- `shell/Palette.tsx`: `PAGES` يدوية 21 صفحة (`:14-36`)، `TOP` 8 (`:13`). تنقصها: `/life/commands`، `/life/settings`، `/library/folders`، `/library/settings`، وكل صفحات `/academic/s/:id/*`. الاستدعاءان `/api/search` (أكاديمي، ≤60، يُعرض 12) و`/api/search/more` (≤6 لكل نوع) بعد debounce 160ms. Enter يذهب إلى `rows[sel]` و`sel=0` وأول الصفوف أوامر صفحات. لا رمز فصل في نتائج المواد/التقييمات. تُصفَّر عند تغيّر `pathname` أو `search` (`:52-55`). `/search` بلا حقل إدخال.
- `server/searchRoutes.ts`: `to` يبنيه الخادم: `/library/f|y/:id`، `/life/finance?q=`، `/life/finance`، `/sports?q=<english_name>`، `/sports/mine`، `/life/glossary#id`. مجموعة أنواع `MoreHit`: library|youtube|life|sports|workout|glossary. لا يفهرس: وسوم/ملاحظات المكتبة، الدفتر، العادات، الصلاة، الجسم، الروتين، ملاحظات الأكاديمي، الفصول.
- روابط التفاصيل تُبنى عند العميل في 6 أماكن: `SearchPage.tsx:40`، `Palette.tsx:95`، `Bell.tsx:102`، `Review.tsx:97`، `Timeline.tsx:157,176`، `Unknowns.tsx:58`، `Dashboard.tsx:143` (صيغة `/academic/s/${sem}/courses/${course}[#a-${id}]`).

## 5) الحالة والاستمرارية
- localStorage: `platform.theme|accent|motion`، `platform.notify|notify.fired`، `platform.coursesView`، `platform.review.note.<أسبوع>`، `lib.rate`. DB (`core_settings`): `active_semester_id`، `lib.root`، `lib.auto_minutes`، `lib.last_scan`، `life.root`، `life.qada_scenario`، `sports.template`، `sports.location`، `seed:sem5-dashboard`. لا كاش بيانات في العميل سوى دمج الطلبات المتزامنة المتطابقة (`lib/api.ts:13-28`) والجلب المسبق عند الإقلاع (`window.__pre`، يُستهلك مرة، التطابق نصي على الرابط).
- في الرابط (تنجو من التحديث/الرجوع): المكتبة (`tab,kind,sem,course,type,tag,q,sort,dir,page` بـ replace)، `/library/folders?p=`، `courses?new=1` (يُستهلك)، `#a-<id>`، `/life/glossary#id`، `/settings#appearance`، `?q=` في finance/ledger(قراءة أولى فقط)/sports/search، `/life/commands?type=`.
- تضيع عند الرجوع/التحديث: فلاتر/فرز Courses، عرض/فلاتر Timeline، مادة وفرضيات Calculator، `selWeek` في Dashboard، فلاتر Sports، فلاتر Ledger/Finance، يوم Routine، أسبوع Review، عرض CoursePage. النوافذ (Modal) والدرج ليست في التاريخ.
- **ثلاثة معاني للفصل**: (1) فصل الرابط (2) الفصل «النشط» من الخادم، يعيّنه مدير الفصول («تبديل إليه»/kebab) أو أول فصل يُنشأ (`routes.ts:80`) (3) «SEM n» المستنتج من أسماء مجلدات المكتبة. الرئيسية والجرس والمراجعة تتبع النشط؛ الشريط والاختصارات يتبعان الرابط. `SemChip` يظهر في كل المسارات؛ مخفي ≤560px. اختيار فصل من الشريحة يذهب إلى لوحته دائمًا (يُسقط الصفحة الفرعية).
- `unknownCount` يُكتب فقط من `SemesterLayout` (`core/sem-context.tsx:96-98`) فشارة «غير المعروف» تبقى 0 حتى تزور صفحة فصل ثم تتقادم.
- الجرس (`notify/Bell.tsx`): فصل نشط فقط، تواريخ محددة فقط، 7 أيام، يستمع لحدث `platform:bundle` أو يجلب بعد 3.5s وكل 10 دقائق.

## 6) تدقيق الصفحات (الأسطر تقريبية)
| الصفحة | الحجم | أهم العلل |
|---|---|---|
| Home | 70 | مُطلِق بلا بيانات؛ شارة «جاهزة» دائمة؛ بلاطتان بلا قيمة، «اختصارات» غير قابلة للنقر؛ «إضافة فصل جديد» لا يفتح النموذج؛ كل الإجراءات أكاديمية |
| Dashboard | 209 | 14 كتلة؛ حمل الأسابيع يظهر 4 مرات (`:114,126,199` + بلاطة)؛ دونات الأوزان تكرار Weights؛ التقويم الشهري بلا `onDay`؛ العدّاد ليس رابطًا؛ «جاهز للتقييم» تعدّ graded من الحالة؛ حالة فارغة بلا زر (`:139`)؛ نص «صفًّا» يسرّب نموذج البيانات |
| Semesters | 108 | الإنشاء يهبط على لوحة فارغة؛ لا نسخ مواد من فصل سابق؛ أسابيع الإجازة تُكتب نصًا |
| Courses | 233 | فلاتر/فرز/3 عروض لعناصر قليلة؛ عرض الجدول بلا عمود إجراءات (`:133-138`)؛ «إضافة تقييم» مخبأة في kebab؛ تأكيد + تراجع مكرران عند الحذف (`:128-129`)؛ لا روابط للحاسبة/المكتبة |
| CoursePage | 239 | لا روابط خارجية؛ الملاحظات للعرض فقط والإضافة من Unknowns؛ `setStatus` شرطي بلا أثر (`:60`) و«تم التصحيح» بلا درجة؛ تعديل الدرجة kebab→تعديل→نموذج 15 حقلًا؛ عرض «لوحة» بلا سحب |
| Calculator | 164 | تفاعل «ماذا لو» فقط؛ الحالة محلية ولا `?course=`؛ `CourseTabs` معرَّف داخل الرسم (`:32`) فيُعاد تركيبه ويضيع التركيز؛ لا يحفظ درجة فعلية |
| Timeline | 205 | اسم «الجدول الزمني» لمصفوفة مادة×أسبوع؛ لا قائمة زمنية مسطحة بإجراءات؛ 4 عروض محلية الحالة؛ حالة فارغة بلا إجراء (`:95`) |
| Weights | 80 | 4 تصييرات لبيانات واحدة؛ لا يرتبط به شيء؛ فارغ بلا إجراء (`:24`) |
| Unknowns | 96 | الصندوق الحقيقي للمهام لكنه آخر قائمة الأكاديمي؛ NoteForm هنا فقط؛ نقص المحاضر يُعرض ولا يُعد |
| PrintSummary | 39 | مسار كامل لإجراء؛ لا ملاحظات/غير معروف في الطباعة؛ تُبلَغ فقط من زر في Dashboard |
| Review | 202 (+sections 263 + kit 52) | مرتّب حسب المصدر؛ الدراسة آخر كتلة داخل «الروتين والأسبوع القادم»؛ الملاحظة آخرًا وفي localStorage فلا تدخل النسخ؛ معرّفات `rv-*` بلا روابط؛ خلاف السبت/الأحد يطبع مرتين؛ القِدم يطبع مرتين |
| Settings | 188 | 5 مداخل؛ التصدير/الاستيراد أكاديمي فقط (`server/exportImport.ts:9-20`) والصفحة لا تقول ذلك؛ «استبدال الكل» بجوار «دمج (آمن)»؛ الجرس والـPalette يهبطان على بطاقة المظهر لا الإشعارات |
| Library | 238 | أزرار الترويسة تكرر 3 من 4 عناصر القائمة؛ تبويبات «حسب …» تكرر الفلاتر؛ الإحصاءات فوق المحتوى؛ لا رابط وارد من المادة؛ الحالة الفارغة بلا إجراء (`:172`) |
| LibraryFolders | 69 | صفحة منفصلة لما هو عرض؛ بلا بحث؛ فلتر `folder` موجود في API بلا واجهة |
| LibraryItem | 347 | رابط المادة يذهب للقائمة (`:329`) لأن `LibCourseRef` بلا id (`shared/library.ts:186`)؛ crumb المكتبة يُسقط الفلاتر؛ لا سابق/لاحق؛ ≤1000px تنزل البطاقات تحت الـPDF |
| LibraryYoutube | 100 | الإضافة 3+ نقرات؛ العنوان يدوي؛ المادة نص حر (`:45-47`) مع شارة «رمز مستنتج» مضللة |
| Life / Finance(384) / Insights / Ledger / Prayers / QadaPlan / Habits / Alternatives / Routine / RoutineMap / Body / Commands(211) / Settings | — | يتيمات: QadaPlan، RoutineMap، Ledger، Insights؛ تكرار: القضاء ×4، الوزن ×4، التعارضات/العطل ×3، القِدم ×4+؛ Finance 12 كتلة؛ «اشتهاء» 3-4 نقرات ولا رابط من Habits؛ الأوامر: تأكيد على كل حفظ + معاينة JSON نصف الشاشة + حالة خام (`pending`) + صلاة واحدة بالمسودة؛ لا أمر لتسجيل الوزن (`shared/life.ts:24`) ولا رابط للأوامر من Prayers/Habits/Body |
| Sports(298) / SportsTemplates(250) / SportsMine(257) | — | «اعتمد هذا القالب محليًا» يضبط `mine.template` الذي لا يُقرأ في غير تلك الصفحة؛ تحقيق قالب = 15-25 نقرة؛ لا إنجاز لتمرين اليوم ولا ظهور على الرئيسية؛ «المعدات المتاحة» لا تُحفظ |
| Glossary | 70 | تحت `/life` فيقلب المنصة عند فتحه من الرياضة/المراجعة؛ crumb بلا أب |
| NotFound / SearchPage | — | «الرئيسية» فقط؛ لا حقل بحث؛ لا إجراء في الفارغ |

### نفس الشيء في أماكن متعددة
حمل الأسابيع: 7 تصييرات (Dashboard ×4 + Timeline + Weights + …). المواعيد القادمة: الجرس، Hero، بطاقة Dashboard، Timeline، Review، بطاقة المادة. الفصول: الشريط، الشريحة، Home، Semesters. الإعدادات: 5 مداخل. طباعة/تصدير: 3. أسماء لوجهة واحدة: الجسم/الوزن والجسم/الجسم والوزن؛ الإعدادات (5 صيغ)؛ الفصول (7 صيغ)؛ الصلاة/الصلاة والقضاء؛ السجل الكامل/السجل المالي الكامل؛ تمريني/تماريني؛ أيقونة `sliders` للإعدادات الثلاثة و`target` للجسم والقضاء.

## 7) البيانات المتاحة لتركيب «اليوم» (بلا خلفية جديدة)
- لا نقطة «upcoming/agenda» في الخادم؛ المنطق عند العميل من حزمة الفصل `GET /api/semesters/:id` = `{semester, courses, assessments, notes, is_active}` (`routes.ts:85`).
- مساعدات جاهزة: `shared/semester.ts` (`todayMs` بتاريخ الجهاز المحلي، `weekOf`، `phaseOf`، `upcomingDeadlines`، `weekLoads`، `dueSortMs`)، `shared/review.ts` (`deadlineAlerts`, `daysLeftText`, `notifiable`, `assessmentsInRange`)، `shared/weekly.ts` (`klToday`, `reviewWindow` أحد–سبت بتوقيت كوالالمبور, `routineWeek`)، `shared/life.ts` (`blocksForDay`, `nowAndNext` بتوقيت KL، `missingInputs`)، `shared/sports.ts` (`WEEKDAYS` تبدأ sat، `weekdayKL`)، `lib/format.ts` (`parseSlots` يستخرج حصص `course.schedule` ويقبل الجمعة/السبت).
- واجهات: الحياة `GET /api/life/bundle?files=…` (6 ملفات)، `/api/life/content/*`؛ الرياضة `GET /api/sports/mine` → `{workouts, week{sat..fri}, template, location}`؛ المكتبة `GET /api/library/recent`, `/api/library/items?course=CODE` (facets.course = عدد لكل مادة)؛ البحث `/api/search`, `/api/search/more`.
- أدوات واجهة قابلة لإعادة الاستعمال: `ui/ui.tsx` (Card, CardHead, Badge, EmptyState, Skeleton, Segmented, Modal, KebabMenu, Button, Field, Pager, useDebounced)، `ui/page.tsx` (PageHead)، `widgets/tiles.tsx` (StatTile, Hero, Countdown, DeadlineRow, Carousel, MiniCalendar, WeekTimetable, useNow)، `widgets/catalog.tsx` (CourseCard, Facet, FilterChips, DocTable, VirtualList)، `forms/lazy.tsx` (CourseForm, AssessmentForm, NoteForm, SemesterForm)، `life/lifeKit.tsx` (useLife — يستعلم كل 60s —, LifePage, PageLinks, FreshBadge, StaleBanner, MissingInputsCards)، `life/v8Kit.tsx` (ContentPage، بلا crumbs).
- تنبيهات: الأسبوع الأكاديمي من `start_date` (اثنين في البذرة)، ونافذة المراجعة أحد–سبت KL، والرياضة تبدأ سبت؛ الأكاديمي بتاريخ الجهاز والباقي بتوقيت KL. **قاعدة الحياة**: «غير معروف» ليس صفرًا؛ لا تخمين؛ كل رقم له وسم (مثبت/محسوب/افتراض/غير مسجل).
- في قاعدة البيانات حاليًا فصلان «حاليان» (SEM 5 يبدأ 2026-10-12 وSEM 6 يبدأ 2026-10-26 بلا تواريخ امتحانات) — كل المساعدات تعمل على فصل واحد.

## 8) حدود التأثير (ما ينكسر بصمت)
- **`scripts/inline-html.mjs`**: يتطلب النص `<script src="/theme-init.js"></script>` وإلا `exit(0)` بلا سكربت إقلاع. `file(name)` يطابق `^name-[A-Za-z0-9_-]+\.js$` ويُسقط الغائب بصمت (`:67`). خريطة المقاطع (`:21-51`) بأسماء ملفات الصفحات: Home, Semesters, Courses, CoursePage, Timeline, Calculator, Weights, Unknowns, PrintSummary, Settings, SearchPage, Glossary, Review, Life, LifeFinance, LifePrayers, LifeHabits, LifeRoutine, LifeBody, LifeCommands, LifeSettings, LifeAlternatives, LifeLedger, LifeRoutineMap, LifeInsights, LifeQadaPlan, Sports, SportsTemplates, SportsMine + مشتركات catalog, lifeKit, sportsKit, v8Kit, kit, life. (Library* وNotFound وDashboard خارجها.) سلسلة `if` بمسارات حرفية (`:74`): `/`, `/academic`, `/settings`, `/search`, `/review`, 14 مسار `/life*`, `/sports*`، ومقاطع الفصل بمفتاح اسم الجزء الثالث من الرابط (`courses→course`, `timeline`, `calculator`, `weights`, `unknowns`, `print`). روابط الجلب المسبق يجب أن تطابق نص ما يطلبه المكوّن (`Life.tsx:10`، `Review.tsx:24`). يحقن السكربت CSS للمفاتيح التي تبدأ بـ`life` أو `sports` أو تساوي `review`. لا `manualChunks` في `vite.config.ts`: أسماء المقاطع = أسماء ملفات المصدر.
- **CSP** (`server/app.ts:28-44,57-69`): يجزّئ كل `<script>` مضمّن بلا سمات؛ يجب أن يبقى سكربت الإقلاع علامة واحدة بلا سمات. المسارات بلا امتداد تعود إلى `index.html` (`:135-137`) فالمسارات الجديدة لا تحتاج خادمًا. `/assets/` immutable.
- **Service worker** (`web/public/sw.js`): لا مسارات مكتوبة؛ التنقل network-first مع `offline.html`. **manifest**: اختصارات `/review`, `/library`, `/life`.
- **الاختبارات**: لا اختبار يتحقق من تسميات التنقل (vitest بيئة node بلا React). المرتبطة بالمسارات فقط: `tests/lib-paths.test.ts:12-14` (`/library/f|y/:id`)، `tests/sports.test.ts:229,232` (`/sports?q=` وقائمة الأنواع)، `tests/api.test.ts:162-175` و`scripts/smoke.mjs:56-63` (رجوع SPA عند `/academic/s/sem5/courses`، ونمط `src="/assets/index-….js"` الذي يطابق السكربت المضمّن). نتائج حالية: 148 ناجح / 18 متخطّى (تحتاج `RASHED_FIXTURE_DIR`).
- ملفات Playwright الأصلية (`e2e_*.mjs`) المذكورة في `PROGRESS.md` **غير موجودة** في أي مكان. آثارها الوحيدة لقطات إمكانية الوصول في `/home/user/Siro/.playwright-mcp/*.yml` (جذر المستودع الأكبر): أسماء مثل `complementary "القائمة الجانبية"`، `navigation "التنقل"`، `navigation "المنصات"`، `combobox "بحث شامل"`، `button "المواعيد القريبة"`، وروابط بتلميح الاختصار داخل الاسم («الرئيسية g h»).
- `build:web` يبدأ بـ`tsc -p tsconfig.web.json --noEmit` فخطأ نوع يفشل البناء؛ الاستيراد بلاحقة `.js`؛ `dist/` و`node_modules/` (ثنائيات Windows) و`data/platform.db*` و`backups/` **متتبَّعة في Git — لا تُعدَّل ولا تُرتكب**.

## 9) CSS (التخطيط فقط؛ ممنوع لمس الألوان/الخطوط)
`styles/shell.css` (110 سطرًا): `.app` `.sidebar` `.brand` `.nav-sec` `.nav-title` `.nav-link` (النشط `[aria-current='page']`) `.nav-sub` `.side-card` `.main` `.topbar` `.switcher` `.search` `.search-pop` `.hit` `.icon-btn` `.burger` `.theme-toggle` `.avatar` `.sem-chip` `.menu` `.page` `.page-head` `.crumbs` `.backdrop`. نقاط الكسر: ≤1180 (تصغير البحث)، ≤960 (الدرج + burger + إخفاء مبدّل الأعلى + إظهار مبدّل الدرج)، ≤640 (الجرس ثابت)، ≤560 (إخفاء SemChip والصورة). متغيرات: `--sidebar-w:264px`, `--topbar-h:72px`. `widgets.css:300-311,373-375` يمس `.plugin-card/.quick/.hub/.nav-sub/.switcher`. لا شريط سفلي. خارج التنقل: 1000/900/800/760/700/600/560 في widgets/components/life/sports/library.

## 10) استنتاجات الجوال (لم تُقِس بمتصفح)
عند 390px: عناصر الشريط الثابتة ≈194px + فجوات 48px فتبقى ≈114px للبحث وبداخلها 94px حشوة (نص ≈20px)؛ نافذة `.search-pop{min-width:320px}` تُرجَّح أن تفيض؛ لوحات `.lib-side/.sticky-side` تلتصق بنفس إزاحة الشريط العلوي فتنزلق تحته؛ قائمة الحياة ≈19 صفًا فتحتاج تمريرًا داخليًا في نوافذ قصيرة؛ الدرج المغلق يبقى في DOM وترتيب Tab.

## 11) علل صغيرة تُدمج مع المراحل
`WeekTimetable` يرسم أحد–خميس فقط (`widgets/tiles.tsx:195`) فتُسقط محاضرة الجمعة (SKEX2123 الجمعة 15:00)؛ `CourseTabs` داخل الرسم؛ `setStatus` بلا أثر؛ تعريف «مُصحَّح» متناقض بين Calculator وDashboard؛ MiniCalendar بلا `onDay`؛ خطأ `SemesterLayout` بلا زر؛ Home «إضافة فصل» لا يفتح النموذج؛ التلميحات «g d…» تختفي حين تظهر شارة العدد؛ الصورة «م» غير تفاعلية؛ ازدواج تأكيد + تراجع للحذف؛ النقر على الخلفية يرمي نموذجًا غير محفوظ (`ui/ui.tsx:139`)؛ لا «حفظ وإضافة آخر» (`forms/forms.tsx:45-65`).

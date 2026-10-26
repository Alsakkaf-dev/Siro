# دليل دراسة SCSE3143 Ubiquitous Computing
الفصل الأول 2026/2027 (3 ساعات معتمدة). المتطلب السابق: SCSR2143 Operating System.
المنسّق: Dr Muhammad Khatibsyarbini Abd Rahim (N28-402-09، khatibsyarbini@utm.my).
المحاضِرة: Prof Dr Dayang Norhayati Abang Jawawi (N28-305-03، dayang@utm.my).
المصادر: CI (Course Information) وشرائح Week01. سنضيف المحاضرات القادمة إلى هذا الملف.

---
## 1. خريطة المادة
| الأسبوع | الموضوع | CLO | التقييم |
|---|---|---|---|
| W1 | Introductory Concepts | CLO1 | |
| W2 | Internet of Things (IoT) | CLO1 | |
| W3 | Embedded Real-Time Systems | CLO1 | |
| W4–5 | Concurrent Programming & RTOS | CLO2 | (Deepavali 8–9 Nov) |
| W6 | Real-Time Analysis | CLO1 | إعلان Group Assignment |
| W7 | Real-Time Analysis | CLO1 | **Mid-Term Test** |
| W8 | Mid-Sem Break | | |
| W9 | Context-Aware Computing | CLO1 | تسليم Group Assignment |
| W10 | Wearable & Mobile Computing | CLO2 | Quiz 1 |
| W11 | Human-Computer Interaction | CLO3 | Quiz 2 (Christmas 25 Dec) |
| W12 | Project Development | CLO2 | إعلان Project Proposal |
| W13 | Project Development | CLO2 | تسليم Project Proposal |
| W14 | Project Development | CLO2 | |
| W15 | Demo | CLO3 | العرض (Demo) وتسليم Full Project Report |

التواريخ التقريبية (على افتراض أن W1 = 12 Oct 2026، من تقويم الكلية): W7 من 23 إلى 27 Nov ← Mid-Term. W9 من 7 إلى 11 Dec. W10 من 14 إلى 18 Dec. W11 من 21 إلى 25 Dec. W13 من 4 إلى 8 Jan 2027. W15 من 18 إلى 22 Jan 2027. الـ CI نفسه يذكر أرقام الأسابيع فقط ولا يذكر تواريخ.

## 2. التقييم (لا يوجد Final Exam)
| البند | % | CLO |
|---|---|---|
| Quiz ×2 | 10 | CLO1 |
| Problem Solving ×3 | 15 | CLO1 |
| Mid-Term Test | 25 | CLO1 |
| Project Assignment (Group) | 20 | CLO2 |
| Project Development | 20 | CLO2 |
| Project Proposal | 10 | CLO3 |

- CLO1: حل مشاكل ubiquitous في تطوير IoT و embedded software (مستوى C3).
- CLO2: استخدام الطرق والأدوات المناسبة لحل مشاكل معقدة في تطوير ubiquitous software (مستوى P4).
- CLO3: عقلية ريادية (entrepreneurial mindset) في إدارة المشاريع (مستوى A5).
- القواعد: علامة النجاح 40%. الحضور الإلزامي 80%. التسليم المتأخر تُخصم منه علامات، وما يتأخر أكثر من 3 أيام لا يُقبل. لا يوجد make-up إلا بشهادة طبية من UTM panel. المشاريع جماعية بفرق من 4 طلاب (project-based learning). التمارين التي تُحل في الصف قد تُحسب من الدرجات.
- المراجع: Krumm 2009 *Ubiquitous Computing Fundamentals*، Cooling 2003، Khan et al. 2014، Ben-Ari 2006، Minh Duc 2007. المعمل: Java و RTOS و IoT kits.

---
## 3. Week 1: Introduction to Ubiquitous Computing: Core Concepts & Applications
### الفكرة الرئيسية
الحوسبة تخرج من "الصندوق" (الـ PC) وتنتشر في كل الأشياء حولنا، وتعمل في الخلفية دون أن نلاحظها (invisible). الإنسان يعيش حياته، والكمبيوتر هو الذي يتكيّف معه.

### المفاهيم
**تعريف Ubiquitous Computing:** يُسمّى أيضاً pervasive computing و ambient intelligence. هو تضمين أجهزة الحوسبة داخل الأشياء والبيئات اليومية بحيث تندمج بسلاسة (seamlessly) في الحياة وتبقى غير مرئية للمستخدم.
- **الهدف (Goal):** دمج الحوسبة في البيئة، وتفاعل مستمر وغير مزعج (unobtrusive)، وراحة دون أن يحتاج المستخدم إلى توجيه انتباهه.
- **الرؤية (Vision):** خدمات anytime/anywhere، وتفاعل طبيعي وبديهي، وتقنية invisible لكنها متاحة دائماً.
- **مقارنة مع Non-Ubiquitous:** UbiComp "تُخرج الكمبيوتر ليعيش في العالم مع الناس"، وهذا صعب لأنه يدمج human factors و CS و social science و engineering. أما Virtual Reality / Non-UbiComp فهي "تُدخل الناس داخل عالم الكمبيوتر"، وتعتمد أساساً على قوة الحوسبة فقط.

**التطور (Evolution)، شرح للمخطط:**
- 1st Era Mainframe: كمبيوتر واحد يستخدمه أشخاص كثيرون (many-to-one).
- 2nd Era PC: شخص واحد لكل كمبيوتر (one-to-one).
- 3rd Era UbiComp: شخص واحد يستخدم أجهزة كثيرة (one-to-many).
- مخطط السُّلّم الزمني: Centralized/Mainframe (1970s–80s) ← Distributed client-server (1990s) ← Internet/WWW (2000s) ← Mobile "anytime, anywhere" (2010s) ← Cloud & UbiComp: embedded processors في كل شيء، cloud، grid (2020s).
- مثال الهاتف: الهاتف "الطوبة" في الثمانينات ← الهاتف القلاب في الألفينات ← اليوم: نظارات ذكية (display)، و earphone، وتفاعل مع بيئة تستنتج السياق، وكاميرات محيطية.

**خصائص Weiser الثلاث (1991)** (احفظها، سؤال امتحان شبه مؤكد):
1. الكمبيوترات تكون networked و distributed ويمكن الوصول إليها بشفافية (transparently accessible).
2. تفاعل الإنسان مع الكمبيوتر يكون أكثر خفاءً (hidden / implicit).
3. الكمبيوترات تكون واعية بسياق البيئة (context-aware).
والغرض من ذلك تحسين عملها في البيئة المادية والبشرية.

**المعماريات (Architectures):**
- **3-Layer** (الأكثر شيوعاً): Perception (حساسات تجمع البيانات) ← Network (الاتصال، ونقل البيانات ومعالجتها) ← Application (تقديم الخدمة للمستخدم عبر الواجهات).
- **SOA-based:** Perception ← Network ← **Service** (ينشئ ويدير الخدمات التي يحتاجها المستخدمون والتطبيقات) ← Application (واجهات للتفاعل مع خدمات الـ service layer).
- **Middleware-based** (5 طبقات): Perception ← Network/Transport (ينقل من perception إلى middleware) ← **Middleware** (تخزين البيانات وتحليلها ومعالجتها) ← Application ← **Business** (يدير نظام IoT كله، بما فيه التطبيقات و profit models).
- نصيحة للامتحان: قد يطلب منك رسم المعماريات ومقارنتها، أو تحديد الطبقة المسؤولة عن وظيفة معيّنة.

**Computing Technologies:**
- العلاقة بين المفاهيم: **UbiComp** هو الفلسفة (الحوسبة في كل مكان). وتحقيقها يحتاج **Embedded Real-Time (ERT) systems**، أي أجهزة مخصصة بقيود منها التوقيت. أما **IoT** فهو البنية الشبكية الفعلية للأجهزة المتصلة التي تجعل الفلسفة ممكنة.
- مخطط تطور التقنيات: Embedded systems ← Embedded real-time ← IoT ← UbiComp ← Mobile ← Wearable ← Edge computing ← Intelligent edge devices، أي من أنظمة معزولة إلى أجهزة edge ذكية تستشعر وتتواصل وتعالج وتقرر ذاتياً.
- **Cloud:** البيانات والتطبيقات مجمّعة في data center مركزي، ويوفّر الموارد الـ CSP (Cloud Service Provider). يتسع لآلاف الـ data centers.
- **Fog:** طبقة لا مركزية بين مصدر البيانات والـ cloud (ملايين الـ nodes).
- **Edge:** المعالجة والتخزين أقرب ما يمكن إلى الجهاز الذي يولّد البيانات (مليارات الأجهزة)، وهذا يقلل وقت المعالجة.

| | Cloud | Fog | Edge |
|---|---|---|---|
| Latency | الأعلى | متوسط | الأقل |
| Scalability | عالية وسهلة | ضمن الشبكة | صعبة |
| Distance | بعيد عن الـ edge | قريب من الـ edge | عند الـ edge |
| Data analysis | معالجة أقل حساسية للوقت، وتخزين دائم | real-time: يقرر محلياً أو يرسل إلى الـ cloud | real-time وقرار فوري |
| Computing power | عالية | محدودة | محدودة |
| Interoperability | عالية | عالية | منخفضة |

مثال: سيارة ذاتية القيادة تقرر الفرملة عند الـ edge، وتجمّع بيانات الحي عند الـ fog، وتدرّب نموذج الـ AI في الـ cloud. فكرة Edge: الجهاز لم يعد يرسل البيانات فقط، بل "يفكر ويقرر محلياً" (IoT ← Smart Connected ← Intelligent Edge).

**إطار UbiComp (Framework)** له ثلاثة أبعاد:
| Design framework (Smart DEI): كيف يُصمَّم؟ | Core properties: ما الخصائص الأساسية؟ | Interaction: كيف يتفاعل؟ |
|---|---|---|
| Smart Device | Distributed system | CCI: Computer-Computer |
| Smart Environment | iHCI | HCI: Human-Computer |
| Smart Interaction | Context awareness | CPI: Computer-Physical |
| | Autonomy | HPI: Human-Physical |
| | Artificial Intelligence | HHI: Human-Human |

**Smart DEI** (تُنطق "day"):
- **Smart Device:** أجهزة متعددة الوظائف، متنقلة، وشخصية (مثل الـ smartphone) "تجسّد الخدمات" بدلاً من أن تجعلها افتراضية فقط.
- **Smart Environment:** البيئة نفسها تستشعر الأحداث وتتفاعل معها، مثل دخول شخص إلى غرفة أو خروجه منها.
- **Smart Interaction:** أجهزة بسيطة الوظائف تتعاون معاً (interoperate)، والذكاء يكون في التفاعل بينها.
- المخطط يذكر أنواعاً فرعية: MTOS و RTOS و ASOS و VM و MEMS.
- دور الأجهزة المحمولة والقابلة للارتداء (mobile/wearable):
  1. Pervasive services و personal information cloud: بياناتك تتبعك أينما ذهبت.
  2. Calm/invisible technology: الملابس والإكسسوارات تعمل في الخلفية.
  3. Augmented/mediated reality: الـ HUD (head-up display) في الصيانة والجراحة.
  4. Posthuman/implanted: أجهزة مزروعة تمد قدرات الإنسان.

**Core properties بالتفصيل:**
- **Distributed:** universal و seamless و heterogeneous و networked (غالباً wireless) و open. المكوّنات تُكتشف ديناميكياً وتُضاف أو تُزال، والتنسيق synchronous أو asynchronous. النظام transparent (يبدو كنظام افتراضي واحد)، وكل شيء mobile: المستخدمون والخدمات والبيانات والكود والأجهزة.
- **iHCI (Implicit HCI):** يقلل الأوامر الصريحة. خصائصه: non-intrusive، و calm، و natural (gesture وصوت ولمس وتتبع النظر eye gaze)، و anticipatory/proactive (يتوقع ما يحتاجه المستخدم)، و affective (عاطفي)، و user-aware، و post-human، و sense of presence / mediated reality (دمج الافتراضي بالواقعي).
- **Context awareness:** اكتشاف السياق (location و time و user activity) والاستفادة منه. أنواعه:
  - Physical: المكان والحرارة والوقت (spatial/temporal).
  - User: التفضيلات والنشاط.
  - Virtual: حالة الشبكة والخدمات.
  - **Active** (النظام يتصرف تلقائياً) مقابل **Passive** (يُبلغ المستخدم فقط). مثال: هاتف يكتم الصوت تلقائياً في المسجد (active)، أو يقترح عليك كتم الصوت (passive).
  - يشمل التخصيص الشخصي (personalised/tailored).
- **Autonomy:** يعمل دون تحكم بشري حسب goals/policies، ويخطط ويعيد التخطيط. يرفع الكفاءة لكنه قد يقلل تحكم المستخدم وفهمه لما يجري (trade-off).
- **AI:** التعامل مع عدم اليقين والبيانات الناقصة والبيئات الديناميكية، و environment modelling، وفهم سلوك المستخدم، و semantic interaction.

**Interaction framework:** ثلاث بيئات:
1. Human: أفراد ومؤسسات تحكمها نماذج اقتصادية واجتماعية.
2. Computer/ICT: بنية تحتية و middleware.
3. Physical world: أنظمة بيئية وبيولوجية تحكمها قوانين الفيزياء.
والتفاعلات الخمسة هي التي تربط بين هذه البيئات: CCI و HCI و CPI و HPI و HHI.

**المشاريع المبكرة (Early projects):**
| المشروع | DEI | الخاصية | التفاعل |
|---|---|---|---|
| Smart Boards/Pads/Tabs (1990s, Xerox PARC) | D | Distributed | CCI |
| Active Badge/Bat/Floor (1992): تتبع موقع المستخدم | D | Context | CCI |
| Classroom 2000 (1999): تسجيل المحاضرات | E | Context | CCI, CPI |
| Smart Space & Meeting Room (2003) | E | Context + Distributed | CCI, CPI |
| iRoom / Interactive Workspaces (2002) | E | Context + Distributed | CCI, CPI |
| Cooltown (2003, HP): يربط الأماكن الحقيقية بالويب | E | Context | CCI, CPI |
| EasyLiving (Microsoft 2002) | E | Context + iHCI | CCI, CPI |
| SPOT (Microsoft 2003) | E | iHCI | CCI, CPI |
| HomeLab / Ambient Intelligence (Philips 2003–04) | E | Context + iHCI | CCI, CPI |
| Unimate & MH-1 robots | D | Distributed | CPI |
| Smart Dust & TinyOS (2001) | D | Distributed + Context | CPI |
| Calm Computing (1997) | D | iHCI | HPI |
| Things That Think / Tangible Bits (1995, MIT) | D | iHCI | HPI |
| DataTiles (Sony) | D | iHCI | HPI |
| AmbientWood (2004) | D | Context + iHCI | HPI |
| WearComp/WearCam (Steve Mann) | D | iHCI | HPI |
| Cyborg 1.0/2.0 (Kevin Warwick، شرائح مزروعة) | D | iHCI | HPI |

**التطبيقات حسب نوع التفاعل:**
- CCI: GPS والشبكات الخلوية.
- HCI: الوصول إلى الصوت والفيديو والمعلومات في كل مكان، و ebooks، والتحكم المحلي الشامل، و personalized spaces.
- HHI: M-commerce و U-commerce، و mobile worker، و community care.
- HPI/CPI: smart utilities، و smart buildings/home automation، و smart street، و smart vehicles، و pervasive games.

**التطبيقات حسب المجال:**
| المجال | التطبيق | الحساسات | الهدف |
|---|---|---|---|
| Healthcare | wearable health monitoring | نبض القلب، الحرارة، الحركة، biosensors | مراقبة لحظية (real-time) |
| Smart Home | الإضاءة الذكية / إدارة الطاقة | light و motion و occupancy، و smart meters | ضبط الإضاءة وتوفير الكهرباء |
| Smart City | مراقبة المرور / البيئة | كاميرات، GPS، جودة الهواء، الرطوبة | تحسين النقل والاستدامة |
| Education | تعلّم context-aware | الموقع، النشاط، تفاعل الأجهزة | تكييف المحتوى حسب الطالب |

**مقارنة UbiCom مع الحوسبة التقليدية (Conventional):**
| | UbiCom | Conventional |
|---|---|---|
| نسبة المستخدم إلى الجهاز | many-to-many | one-to-one |
| الشكل | أجهزة متنوعة مدمجة (dust/tabs/pads/boards) | desktop أو laptop قياسي |
| محور التفاعل | human-centric: التقنية "تختفي" | computer-centric |
| الشبكة | ad hoc و volatile و wireless | ثابتة و wired |
| السياق | context-aware | context-blind |
| الهدف | يعيد الوظيفة الرقمية إلى العالم المادي (smart book) | virtualization (أيقونة الـ desktop) |

الخاتمة: التطبيقات واسعة. السؤال المفتوح في الشرائح: ما التحديات (Issues & Challenges)؟ من الإجابات المتوقعة: privacy، و security، و energy/battery، و heterogeneity/interoperability، و scalability، و reliability، وفقدان تحكم المستخدم.

### نقاط امتحان محتملة
1. تعريف UbiComp وأسماؤه الأخرى، وهدفه ورؤيته.
2. خصائص Weiser الثلاث.
3. العصور الثلاثة (Mainframe و PC و UbiComp) مع نسب المستخدمين إلى الأجهزة.
4. رسم 3-layer و SOA و Middleware architectures ووظيفة كل طبقة.
5. Cloud مقابل Fog مقابل Edge (الجدول).
6. العلاقة بين UbiComp و ERT و IoT.
7. Smart DEI وأمثلة عليه.
8. الخصائص الأساسية الخمس، و Active مقابل Passive context awareness.
9. التفاعلات الخمسة وتصنيف مشروع أو تطبيق تحت أحدها.
10. مقارنة UbiCom مع Conventional.

### اختبر نفسك
1. س: ما الفرق بين UbiComp و Virtual Reality حسب الشرائح؟ ج: UbiComp يُخرج الحوسبة لتعيش مع الناس في العالم، أما VR فتُدخل الناس في عالم الكمبيوتر.
2. س: اذكر خصائص Weiser الثلاث. ج: networked/distributed/transparent، و hidden interaction، و context-aware.
3. س: أي طبقة في الـ Middleware architecture تخزّن البيانات وتحللها؟ ج: Middleware layer.
4. س: ما الطبقة الموجودة في SOA وغير الموجودة في 3-layer؟ ج: Service layer.
5. س: لماذا نستخدم Edge بدل Cloud في نظام إنذار حرائق؟ ج: latency أقل وقرار فوري محلي، ولا يعتمد على الاتصال بالـ cloud.
6. س: أيهما أعلى interoperability، Edge أم Fog؟ ج: Fog (عالية)، بينما Edge منخفضة.
7. س: مكيّف يطفئ نفسه تلقائياً عند خروجك من الغرفة: أي نوع context؟ ج: Physical/user context بنمط Active، ومن نوع Smart Environment.
8. س: صنّف Active Badge. ج: Smart Device، و Context awareness، و CCI.
9. س: ما عيب الـ Autonomy؟ ج: قد يقلل تحكم المستخدم وفهمه لما يفعله النظام.
10. س: ما معنى iHCI؟ أعطِ مثالاً. ج: تفاعل ضمني دون أوامر صريحة، مثل أبواب تفتح عند الاقتراب، أو تتبع النظر.
11. س: ما نسبة المستخدم إلى الجهاز في UbiCom؟ ج: many-to-many.
12. س: اذكر 3 تحديات في UbiComp. ج: privacy و security و energy، ويمكن أيضاً interoperability.

---
## 4. المحاضرات القادمة
(W2 IoT، و W3 ERT …) تُضاف هنا عند رفعها.

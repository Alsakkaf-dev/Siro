# دليل المذاكرة — SCSE3103 Cognitive Computing
الفصل الأول 2026/2027 — Faculty of Computing, UTM
المحاضرون: Dr Norsham binti Idris (المنسّقة) و Dr Sim Hiew Moi
المصادر: `CI_SCSE3103 COGNITIVE COMPUTING.pdf` (Course Information) و `Chapter_1_Computers_and_Intelligence.pdf` (43 شريحة)

> هذا الدليل مكتوب ليستخدمه المساعد كمعلّم خاص. المصطلحات التقنية باقية بالإنجليزية كما في الامتحان.

---

## 0. خريطة المقرر (Course Map)

| الأسبوع | التاريخ | الموضوع | CLO |
|---|---|---|---|
| W1 | 12–16 Oct 2026 | Ch1: Computers and Intelligence | CLO1 |
| W2–W3 | 19–30 Oct 2026 | Ch2: Knowledge, Reasoning & Decision Making (Knowledge Representation, Rule-based systems, Inference, Search algorithms, Intro to Fuzzy Logic) | CLO1 |
| W4–W5 | 2–13 Nov 2026 (Deepavali 8–9 Nov) | Ch3: Machine Learning Fundamentals (Supervised vs Unsupervised, Classification, Clustering, Reinforcement, Regression, Model evaluation) | CLO1 |
| W6 | 16–20 Nov 2026 | Ch4: Cognitive Computing Concepts & Applications, Basic cognitive system architecture | CLO1 |
| W7 | 23–27 Nov 2026 | Ch5: Artificial Neural Network (Perceptron, ANN structure, Activation functions) | CLO2 |
| W8 | 30 Nov–4 Dec 2026 | **MID-SEM BREAK** | |
| W9 | 7–11 Dec 2026 | Ch5 (cont): Multilayer Perceptron, Backpropagation | CLO2 |
| W10–W11 | 14–25 Dec 2026 (Christmas 25 Dec) | Ch6: Deep Learning & DNN (structure, functions, classification using DNN) | CLO2 |
| W12–W13 | 28 Dec 2026–8 Jan 2027 | Ch7: CNN (architecture, convolution operation, training, applications) | CLO2 |
| W14 | 11–15 Jan 2027 | Special topic: Data Mining with DNN, Sentiment Analysis | CLO2 |
| W15 | 18–22 Jan 2027 | Project Presentation & Demonstration | CLO3 |

ملاحظة: جدول الـ CI مبعثر في النص المستخرج؛ ترتيب W4–W6 مأخوذ من أقرب قراءة منطقية (Ch3 ثم Ch4). تأكد من المحاضرة.

### الـ CLOs
- **CLO1** (C4, PLO2): Design cognitive architectures, knowledge models, and non-deterministic systems — تقييمه: Quiz, Test, Final, Project.
- **CLO2** (C5, PLO3): Develop cognitive applications using a range of intelligent methods to solve a domain problem.
- **CLO3** (C6, PLO4): Collaborate and implement trustworthy and ethical cognitive systems in team-based workflows — Project + Presentation.

### التقييم (Assessment) — 60% مستمر / 40% نهائي
| البند | الوزن |
|---|---|
| Quiz 1 / Quiz 2 / Quiz 3 | 5% لكل واحد (15%) |
| Test 1 | 15% |
| Project Proposal | 5% |
| Project Design | 10% |
| Project Prototype | 10% |
| Project Presentation | 5% |
| Final Exam | 40% |

- لا توجد تواريخ محددة للـ Quiz أو Test في الـ CI. تاريخ الـ Final غير مذكور.
- المشروع جماعي، والعرض في W15 (18–22 Jan 2027).
- المراجع: Velankar, Mahalle & Shinde (2024) *Cognitive Computing for Machine Thinking*, Springer؛ Russell & Norvig (2021) *AIMA* 4th ed.
- تحذير الانتحال (plagiarism): العمل المنسوخ = صفر.

---

## Chapter 1: Computers and Intelligence (W1)

### الفكرة الرئيسية
متى نعتبر الحاسوب "ذكياً"؟ الذكاء ليس شيئاً واحداً، بل مجموعة قدرات (تعلّم، استدلال، تخطيط، لغة، إدراك، حكم اجتماعي)، ويجب الحكم عليه **حسب السياق**. يغطي الفصل: أسس AI وأنواعه، Responsible AI والحوكمة، Computational Intelligence، وتطبيقات AI.

### 1) Thinking and Intelligence
**التفكير كمعالجة معلومات (Thinking as information processing)** — أربع مراحل:
1. **Perception**: التقاط الإشارات من البيئة (نص، صور، صوت، حساسات).
2. **Representation**: تنظيمها إلى concepts / symbols / features / internal states.
3. **Reasoning**: دمج الأدلة والمعرفة لـ infer, compare, predict, plan.
4. **Action and learning**: اختيار فعل، ملاحظة نتيجته، تحديث السلوك.
مثال: تطبيق الملاحة — يستقبل GPS وحركة المرور (perception)، يمثّلها كخريطة/graph (representation)، يحسب أقصر طريق (reasoning)، يقترح مساراً ويعدّله عند الزحام (action & learning).

**أشكال التفكير البشري:**
- **Fast and intuitive**: التعرف على الأنماط، العادات — سريع لكنه عرضة لـ bias.
- **Deliberate and analytical**: خطوة بخطوة، حساب، مقارنة.
- **Creative and reflective**: توليد بدائل، إعادة صياغة المشكلة، مراجعة الذات.
- نقطة مهمة: الأداء الجيد في مهمة واحدة **لا يثبت فهماً عاماً** (general understanding).

**تعريفات الذكاء:**
- **Psychological view**: القدرة على التعلم، الاستدلال، حل المشكلات، التكيّف مع مواقف جديدة، واستخدام المعرفة بفعالية.
- **Agent view**: القدرة على تحقيق الأهداف عبر بيئات متنوعة باختيار أفعال من المعلومات المتاحة (Legg & Hutter 2007).
- التعريف الجيد يحدد: **القدرة (capability) + السياق (context) + معيار النجاح (standard of success)**.

**أبعاد الذكاء**: Learning, Reasoning, Planning, Language, Perception, Social judgement — النظام قد يكون قوياً في بُعد وضعيفاً في آخر.

**من الحوسبة إلى السلوك الذكي (الحلقة):** Input (data) → Model (rules أو learned parameters أو كلاهما) → Decision (prediction/plan/content/action) → Feedback (تقييم وتحسين). ادعاء الذكاء يحتاج دليلاً عبر **الحلقة كاملة**، خاصة في ظروف جديدة.

**نشاط ترتيب الأدلة** (calculator / robot يتجنب عائقاً / model يشرح صورة طبية / chatbot يسأل سؤالاً توضيحياً): لا توجد إجابة واحدة؛ المهم تبرير المعيار (correctness, adaptation, explanation, social interaction). عادةً الآلة الحاسبة أضعف دليل (لا تكيّف)، والتي تتكيّف أو تشرح أو تسأل أقوى.

### 2) AI Foundations and Types
- **Turing's imitation game (1950)**: استبدل سؤال "Can machines think?" الفلسفي باختبار سلوكي محادثاتي يقيس: language use, context handling, plausible reasoning, human judgement. **اجتياز الاختبار لا يحسم مسألة الوعي أو الفهم.**
- **Dartmouth proposal**: اقتراح 1955 من McCarthy, Minsky, Rochester, Shannon لدراسة صيفية عام **1956** — وُلد مصطلح AI. الطموح: وصف التعلم والذكاء بدقة تكفي لمحاكاته آلياً.
- **تعريف حديث لـ AI (OECD 2024)**: نظام يستقبل inputs ويستنتج (infers) كيف يولّد outputs مثل predictions, content, recommendations, decisions تؤثر على بيئات مادية أو افتراضية. الأنظمة تختلف في **autonomy** و**adaptiveness after deployment**.
- **Cognitive Computing**: أنظمة حاسوبية تحاكي جوانب من العمليات الإدراكية البشرية: learning, reasoning, understanding language, recognizing patterns, interpreting context, supporting decisions. (تعريف مهم جداً للامتحان — هو اسم المادة.)
- **Rational-agent view**: Agent يدرك البيئة عبر **sensors**، يختار **actions** عبر effectors، ويُقيَّم بـ **performance measure**. "Rational" = اختيار الفعل المتوقع أن يحقق الهدف **بناءً على المعلومات المتاحة** (وليس بالضرورة الكمال).

**نطاق القدرة:**
| النوع | الوصف | الحالة |
|---|---|---|
| Narrow AI | مهام محدودة في مجال محدد | موجود اليوم (مثل face recognition) |
| AGI | نقل التعلم والاستدلال عبر مجالات كثيرة | هدف بحثي، لا يوجد إثبات مقبول |
| Superintelligence | يتجاوز البشر في معظم المهام الإدراكية | مفهوم افتراضي/تخميني |

**AI ⊃ ML ⊃ DL ⊃ (كثير من) Generative models** (دوائر متداخلة):
- **AI**: أنظمة تؤدي مهام تحتاج ذكاءً بشرياً؛ تشمل rule-based و learning-based.
- **ML**: التعلم من البيانات بدل برمجة كل قاعدة (spam detection, recommendation, house price prediction).
- **DL**: شبكات عصبية متعددة الطبقات، بيانات كبيرة (image/speech recognition, NLP, autonomous systems).
- **Generative models**: تتعلم توزيع البيانات وتولّد عينات جديدة (LLMs, diffusion models).
- **فخ امتحاني**: ليس كل generative model هو deep learning — Gaussian Mixture Models و Hidden Markov Models توليدية كلاسيكية.

**Symbolic vs Data-driven AI:**
| Symbolic | Data-driven |
|---|---|
| قواعد وتمثيلات صريحة | أنماط متعلمة من الأمثلة |
| Search, logic, planning, expert systems | Statistical models, neural networks, reinforcement learning |
| أسهل في الفحص (interpretable) | ممتاز في الإدراك المعقد (صور، صوت) |
| هش (brittle) عند نقص القواعد | يعتمد على جودة البيانات والتقييم |
**Hybrid systems** تجمع learned perception مع rules/search/human constraints.

**القدرات الأساسية في نظام AI**: Represent (states, objects, relations, goals) — Search and plan — Learn (patterns/policies) — Communicate (language/media). التصميم يسأل: أي قدرات نحتاج وكيف تتفاعل أخطاؤها؟

**Checkpoint — chatbot مكتب مساعدة الجامعة** (يسترجع وثائق، يرتّب المقاطع، يولّد رداً):
- Inputs: سؤال الطالب + وثائق السياسات؛ Output: رد نصي.
- Learned components: ranking model، language generator (LLM)، embeddings.
- Rule-based: قواعد الاسترجاع/التصفية، قوالب، حدود المحتوى.
- Success measure: دقة الإجابة ومطابقتها للسياسة، رضا المستخدم.
- Likely failure: hallucination، وثيقة قديمة، سؤال خارج النطاق.
- Human oversight: تحويل الحالات الحساسة لموظف، مراجعة دورية.

### 3) Responsible AI and Governance
- **Responsible AI**: نهج منضبط لتصميم ونشر وحوكمة AI بحيث تُطلب الفوائد وتُدار المخاطر على الأفراد والمؤسسات والمجتمع.
- **الأسئلة الثلاثة**: هل يجب استخدام AI لهذه المشكلة؟ من يستفيد ومن قد يتضرر؟ كيف نكتشف الفشل ونستجيب ونتعلم منه؟

**مصادر المخاطر (Sources of AI risk):**
| المصدر | أمثلة |
|---|---|
| Data | poor coverage, historical bias, privacy loss, weak provenance |
| Model | error, opacity, instability, security vulnerabilities, misuse |
| Human use | automation bias, inadequate skills, overreliance, malicious use |
| System context | wrong objective, unequal access, feedback loops, weak governance |
الخطر = الأداء التقني + سياق الاستخدام.

**حالة: Fairness في فرز المنح آلياً** — النموذج يتعلم من قرارات سابقة، والفرص التاريخية متفاوتة حسب المنطقة والدخل ⇒ النموذج يعيد إنتاج التحيز. الحل: تحديد أي نتيجة نريدها عادلة، تقييم كل مجموعة على حدة، قياس unequal impact، مراجعة بشرية وحق الاستئناف (appeal). **Fairness خيار يعتمد على السياق ويجب توثيقه واختباره.**

**مبادئ Trustworthy AI العامة**: Human benefit and rights؛ Fairness؛ Transparency؛ Safety and robustness؛ Privacy and security؛ Accountability.

**⭐ مبادئ ماليزيا السبعة AIGE** (National Guidelines on AI Governance and Ethics, MOSTI 2024) — احفظها:
1. Fairness
2. Reliability, safety and control
3. Privacy and security
4. Inclusiveness
5. Transparency
6. Accountability
7. Human benefit and happiness
موجّهة لـ developers و deployers و end users عبر دورة حياة AI.

**Responsible AI عبر دورة الحياة (6 مراحل):**
1. Plan and design — الغرض، أصحاب المصلحة، المخاطر المقبولة
2. Collect and process data — consent, provenance, quality, representation
3. Build and use the model — توثيق الخيارات وتطبيق القيود
4. Verify and validate — اختبار الأداء، fairness، safety، misuse
5. Deploy — أدوار بشرية، تعليمات، fallback
6. Operate and monitor — drift, incidents, complaints, retirement

**AI impact assessment خفيف** (مثال: أداة تتنبأ بالطلاب الذين يحتاجون دعماً): Purpose / People / Risk / Evidence / Control / Monitoring. مثال إجابة: Risk = وصم طالب خطأً ⇒ Preventive control = مستشار بشري يراجع قبل أي إجراء؛ Monitoring signal = تفاوت نسب false positive بين المجموعات.

**Transparency vs Explanation vs Oversight:**
- Transparency: الإفصاح عن استخدام AI، الغرض، حدود البيانات، القيود.
- Explanation: معلومات مناسبة للجمهور ولخطورة القرار.
- Oversight: منح البشر سلطة وكفاءة ووقتاً وطريقة آمنة للتدخل أو الاستئناف. **الإشراف البشري يفشل إذا افتقد المراجع المعلومات أو السلطة أو الوقت.**

### 4) Computational Intelligence (CI)
**التعريف**: أساليب تكيفية تتعلم من البيانات، تتحمل عدم اليقين (uncertainty)، وتبحث في فضاءات حلول معقدة. ثلاث عائلات:
- **Neural computation** — تتعلم representations و mappings.
  - مخطط: Input (x₁,x₂,x₃) → Hidden representation (h₁..h₄) → Output ŷ. التدريب يعدّل الـ parameters لتقليل الخطأ؛ التقييم يتحقق من **generalisation**. (يُفصَّل في Ch5–Ch7.)
- **Fuzzy systems** — استدلال بمفاهيم متدرجة (degrees of membership بين 0 و 1).
  - Crisp rule: T ≥ 30°C ⇒ HOT (تغيّر مفاجئ عند العتبة؛ 29.9 ليس حاراً إطلاقاً!).
  - Fuzzy rule: 29°C قد تكون WARM بدرجة 0.6 و HOT بدرجة 0.4 ⇒ تحكم سلس (مثل مكيّف).
  - ⭐ **Fuzzy logic يمثّل الغموض في المفهوم (vagueness)، بينما Probability يمثّل عدم اليقين حول حدوث حدث (uncertainty about events).** مثال: "الماء دافئ بدرجة 0.7" (fuzzy) مقابل "احتمال المطر 70%" (probability).
- **Evolutionary computation** — بحث بالتنويع والانتقاء:
  1. Population (حلول مرشحة كثيرة) → 2. Evaluate (fitness function) → 3. Vary (mutation + recombination/crossover) → 4. Select (الإبقاء على الأقوى) → تكرار.
  - مفيد عندما يكون فضاء البحث كبيراً/غير منتظم أو صعب التحسين بـ gradients.
- **Hybrid CI** — مثال المبنى الذكي: Neural model يتنبأ بالطلب على الطاقة + Fuzzy controller يوازن الراحة والطاقة + Evolutionary search يضبط الجداول والمعاملات.
- CI هي **عائلة واحدة** من مناهج تحقيق AI (وليست كل AI).

### 5) AI Applications
**الأنماط (input → inference → action):**
| النمط | المدخلات | الفعل |
|---|---|---|
| Perception | images, audio, sensors | detect, classify, estimate |
| Prediction | records, time series | forecast risk/demand/failure |
| Recommendation | preferences, context | rank, personalise |
| Generation | prompts, reference data | text, code, images, designs |
| Autonomous action | state, feedback | plan and act |
- **AlphaFold** (Jumper et al. 2021): deep learning يتنبأ ببنية البروتين من تسلسل amino acids. الاستخدام المسؤول: إيصال الثقة والقيود، التحقق للاستخدام المقصود، حماية البيانات الصحية، إبقاء الحكم البشري. **الدقة العالية لا تعني تلقائياً السلامة السريرية.**
- قطاعات: Education, Business, Public services, Transport & cities, Agriculture, Cybersecurity. القيمة تأتي من ملاءمة النظام لـ workflow حقيقي وليس من إضافة AI لكل شيء.

### ملخص الفصل (Chapter summary)
- الذكاء قدرات متعددة يُحكم عليها في سياقها.
- أنظمة AI تستنتج outputs تؤثر على بيئات مادية/افتراضية.
- Responsible AI يربط المبادئ بضوابط عبر دورة الحياة.
- CI عائلة مناهج (تعلّم، تكيّف، uncertainty، حوسبة مستوحاة من الطبيعة).
- التطبيق الجيد يربط حاجة حقيقية بأدلة وأدوار بشرية ومراقبة.

### ⭐ نقاط امتحانية محتملة
- تعريف Cognitive Computing وتعريف AI (OECD) والـ rational agent.
- الفرق Narrow AI / AGI / Superintelligence.
- العلاقة AI ⊃ ML ⊃ DL و Generative (مع استثناء GMM/HMM).
- مقارنة Symbolic vs Data-driven + Hybrid.
- مبادئ AIGE السبعة + ربط مبدأ بسيناريو.
- مصادر المخاطر الأربعة + مراحل دورة الحياة الست.
- Fuzzy vs Probability، Crisp vs Fuzzy، خطوات Evolutionary computation.
- Turing test وحدوده، Dartmouth 1956.
- سؤال سيناريو: حلّل نظاماً (inputs/outputs، learned vs rule-based، failure، oversight).

### اختبر نفسك (Self-test Q&A)
1. **لماذا قد يكون النظام ذكياً في مهمة واحدة وليس ذكياً بشكل عام؟**
   لأن الذكاء متعدد الأبعاد؛ Narrow AI مُحسَّن لمجال محدد ولا ينقل التعلم لمجالات أخرى (هذا ما يميز AGI). الأداء في مهمة لا يثبت فهماً عاماً.
2. **اذكر فرقاً بين Symbolic AI و ML.**
   Symbolic يعتمد قواعد صريحة يكتبها البشر (سهل التفسير لكنه هش)، و ML يتعلم الأنماط من البيانات (قوي في الإدراك لكنه يعتمد على جودة البيانات).
3. **أي مبدأ AIGE أكثر صلة بعملية الاستئناف (appeal)؟ ولماذا؟**
   **Accountability** — يحدد من المسؤول ويوفر redress (تصحيح/تعويض) للمتضرر. (يمكن ذكر Transparency و Reliability, safety and control كمبادئ داعمة.)
4. **كيف يختلف fuzzy logic عن probability؟**
   Fuzzy يقيس درجة انتماء لمفهوم غامض (vagueness)، والاحتمال يقيس عدم اليقين حول وقوع حدث.
5. **ما معنى "rational" في rational agent؟**
   اختيار الفعل المتوقع أن يحقق الهدف وفق المعلومات المتاحة ومقياس الأداء.
6. **هل كل generative model هو deep learning؟** لا، مثل GMM و HMM.
7. **ماذا يقيس Turing test وما حدّه؟** يقيس السلوك المحادثاتي (اللغة، السياق، الاستدلال المعقول)؛ لا يحسم الوعي أو الفهم الحقيقي.
8. **اذكر 4 مصادر لمخاطر AI مع مثال لكل.** Data (historical bias)، Model (opacity)، Human use (automation bias)، System context (feedback loops).
9. **ما خطوات evolutionary computation؟** Population → Evaluate (fitness) → Vary (mutation, recombination) → Select → repeat.
10. **متى يفشل الإشراف البشري؟** عندما يفتقد المراجع المعلومات أو السلطة أو الوقت.
11. **ما المراحل الست لـ Responsible AI lifecycle؟** Plan & design، Collect & process data، Build & use model، Verify & validate، Deploy، Operate & monitor.
12. **لماذا لا تكفي دقة AlphaFold العالية للاستخدام السريري؟** لأن الدقة التنبؤية لا تثبت السلامة أو الفائدة السريرية؛ يجب التحقق للاستخدام المقصود مع حكم بشري مسؤول.

---

## الفصول القادمة
(سيُضاف شرح Ch2 وما بعده عند رفع الشرائح.)

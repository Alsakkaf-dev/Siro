# SKEX2123 — Measurement and Instrumentation (القياس والأجهزة) — دليل المذاكرة

- **المحاضِرة:** Prof. Ir. Dr. Herlina Abdul Rahim (P19a, Faculty of Electrical Engineering, UTM) — herlina@utm.my
- **المصادر:** Syllabus202627.pdf (course outline)، Group Assignment 1 brief، Individual Assignment brief، قائمة مواضيع Group Assignment 2، فيديو Chapter 1a.
- ملاحظة: الشريحة الأولى في الـ outline عنوانها القديم "SEI 4113 Measurement & Transducer"، وملفات الـ assignment مكتوب عليها "SKEF2123 … SESSION 2025/2026" (قالب قديم). الكود الصحيح للمادة هو **SKEX2123**.

---

## 1. خريطة المادة (Course map)

| CLO | المحتوى | التقييم |
|---|---|---|
| **CLO1** | شرح مبادئ القياس الأساسية والأجهزة، مفهوم **metrology**، ومبدأ استخدام **transducer** | Exams/Tests/Quizzes |
| **CLO2** | تحليل نتائج القياسات الكهربائية (errors، uncertainty، statistics) | Tests + Assignments |
| **CLO3** | تطبيق **signal conditioning** و**data acquisition (DAQ)** و**interfacing** | Tests + Assignments |

التسلسل المنطقي للمادة:
1. Ch1 Introduction: measurement، SI units، أنواع القياس ← (الفيديو)
2. Errors و uncertainty و statistical analysis (gross/systematic/random، mean، standard deviation، Chauvenet)
3. Analog instruments: PMMC، voltmeter/ammeter، loading effect
4. Transducers و sensors
5. Signal conditioning: amplification، filtering، voltage divider، attenuator
6. DAQ و data logger و ADC/DAC و interfaces/protocols

**Student Learning Time:** 120 ساعة (lecture 38، lab/tutorial 4، self-directed 22، revision 38، assessment prep 13.5، continuous assessment 2، final exam 2.5).

**المراجع:** Morris & Langari (2015) *Measurement and Instrumentation*؛ Kalsi (2004) *Electronic Instrumentation*؛ Nakra & Chaudhry (2011)؛ Ghosh (2007)؛ Northrop (2014)؛ Purkait et al. (2013)؛ Joshi (2021)؛ Palanisamy et al. (2021).

---

## 2. التقييمات والمواعيد (Assessments)

حسب الـ course outline (المصدر المعتمد):

| التقييم | الوزن | الموعد |
|---|---|---|
| Test 1 | 20% | **الجمعة 20 Nov 2026** |
| Individual Assignment (Technical paper review) | 10% | **الجمعة 11 Dec 2026** |
| Group Assignment 1 (Errors/uncertainty/analog) | 20% | **الجمعة 18 Dec 2026** |
| Test 2 | 20% | **السبت 09 Jan 2027** ⚠️ |
| Group Assignment 2 (presentation – signal conditioning/DAQ) | 20% | **السبت 16 Jan 2027** ⚠️ |
| Quizzes ×5 | 10% | خلال الفصل |

⚠️ **تعارضات يجب تأكيدها مع الدكتورة:**
- ملف Individual Assignment يقول **20%** و **Deadline: 21 NOV 2025**، لكن الـ outline يقول **10%** و **11 Dec 2026**. الأغلب أن ملف الواجب نسخة من سنة سابقة؛ اعتمد على الـ outline ثم تأكد.
- مجموع الأوزان المذكورة = 110% (20+20+10+20+20+10) — فيه خطأ في أحد الأوزان، وغالبًا لا يوجد final exam بالمعنى التقليدي (رغم ذكر 2.5 ساعة Final Exam في الـ SLT). اسأل.
- 9 Jan 2027 و 16 Jan 2027 يومَا **سبت**، وليسا جمعة.

### تفاصيل الواجبات
**Individual Assignment – Technical Paper Review:** اختر Task واحدًا (حسب توزيع الدكتورة):
- Task A: ≥10 papers من مجلة *Measurement* (sciencedirect.com/journal/measurement)
- Task B: ≥10 papers من *Sensors and Actuators A: Physical*
- Task C: ≥10 papers من *Flow Measurement and Instrumentation*
- الأوراق من 2018–2026، وموضوعها **تطوير وأبحاث sensors**، في موضوع واحد متقارب.
- الهيكل: Background/Introduction، Importance/Objective، Methodology/Literature، Results/Contributions، Conclusion/Discussion، References.
- من 4 إلى 8 صفحات A4، خط 11 (Calibri / Arial Narrow)، أي قالب journal، والأوراق المراجَعة توضع في APPENDIX (لا تُحسب في عدد الصفحات).

**Group Assignment 1 (20%)** — نظري، بدون أدوات معمل. اختر موضوعًا واحدًا:
1. Biomedical: uncertainty في قياس ضغط الدم non-invasive (أنواع errors في الـ analog sphygmomanometer، علاقة PMMC بالإشارات الطبية، uncertainty propagation، مثال رقمي لـ calibration drift).
2. Chemical/Process: thermocouples و analog pressure gauges في المفاعلات، محاكاة خطأ القراءة على منحنى pressure–time، block diagram لـ analog DAQ.
3. AI & IoT: أثر sensor error و ADC resolution على تنبؤات AI، loading effect، مقارنة 8-bit و 12-bit ADC. ← **الأقرب لتخصصك (Computer Science)**.
4. Social Sciences: survey bias، standard deviation، visual analog scale (VAS)، Chauvenet's criterion.
- الهيكل: Cover، Introduction، Theoretical Framework، Application Analysis، Data Simulation/Example، Improvement Recommendations، Conclusion، References (≥3, APA).
- 3–5 صفحات، Times New Roman 12، تباعد 1.5، بصيغة PDF.
- Rubric: Theory 5، Relevance 5، Error/Uncertainty clarity 5، Structure 5.

**Group Assignment 2 (presentation)** — كل مجموعة لها topic:
G1 Signal Conditioning: Definition & Function · G2 Amplification · G3 Filtering · G4 Voltage Divider Method · G5 Attenuator Method · G6 DAQ: Definition & Function · G7 Types of DAQ & Key components · G8 DAQ Hardware (Data Logger) · G9 Interfaces: Definition & Function · G10 Industrial Instrumentation Protocol · G11 ADC · G12 DAC · G13 Communication Interfaces & Protocol.
(اعرف رقم مجموعتك؛ وكل هذه المواضيع تابعة لـ CLO3 ويُحتمل أن تأتي في Test 2.)

---

## 3. Chapter 1 — Introduction to Measurement & Instrumentation

### الفكرة الرئيسية
القياس هو "مقارنة" الشيء بمعيار معروف لإعطائه **رقمًا + وحدة**. بدون وحدة يكون الرقم بلا معنى ("الطول 5" — خمسة ماذا؟).

### تعريفات
- **Measurement:** إعطاء قيمة عددية ووحدة لكمية فيزيائية بمقارنتها بـ **standard** معروف.
- **Instrumentation:** علم وممارسة استخدام الأجهزة لـ measure، monitor، display، record، control.
- **Metrology:** علم القياس (المعايير، المعايرة calibration، traceability).
- **Transducer:** جهاز يحوّل شكلًا من الطاقة إلى آخر (مثل thermocouple: حرارة ← جهد). **Sensor** هو الجزء الذي يستشعر الكمية.

### أنظمة الوحدات (SI)
الكميات الأساسية السبع (**احفظها**):

| Quantity | Unit | Symbol |
|---|---|---|
| Length | metre | m |
| Mass | kilogram | kg |
| Time | second | s |
| Electric current | ampere | A |
| Temperature | kelvin | K |
| Amount of substance | mole | mol |
| Luminous intensity | candela | cd |

الوحدات المشتقة (Derived): N = kg·m/s²، J = N·m، W = J/s، C = A·s، V = W/A، Ω = V/A.

**Prefixes:** G=10⁹، M=10⁶، k=10³، m=10⁻³، µ=10⁻⁶، n=10⁻⁹، p=10⁻¹².

**مثال:** 4.7 kΩ = 4700 Ω. تيار 2.5 mA عبر هذه المقاومة ← V = IR = 2.5×10⁻³ × 4700 = **11.75 V**. القدرة P = VI = 11.75 × 0.0025 = **29.4 mW**.

---

## 4. Errors and Uncertainty (CLO2 — أساس GA1 و Test 1)

### أنواع الأخطاء
- **Gross error:** خطأ بشري (قراءة خاطئة، كتابة 1.83 بدل 1.38، اختيار range خاطئ). الحل: الانتباه وإعادة القياس.
- **Systematic error:** ثابت الاتجاه ومتكرر — instrumental (zero offset، calibration drift)، environmental (الحرارة، الرطوبة)، observational (**parallax**). لا يُزال بالتكرار؛ يُزال بالـ **calibration**.
- **Random error:** تذبذب غير متوقع (noise). يُقلَّل بتكرار القياس وأخذ المتوسط.

### مفاهيم أساسية
- **True value**: القيمة الحقيقية. **Measured value**: القراءة.
- **Absolute error:** e = Yₙ − Xₙ (true − measured)
- **Percent error:** = |Yₙ − Xₙ| / Yₙ × 100%
- **Relative accuracy:** A = 1 − |Yₙ − Xₙ|/Yₙ ، و %Accuracy = 100% − %error
- **Accuracy:** القرب من القيمة الحقيقية. **Precision:** القرب بين القراءات المتكررة.
  - مثال الهدف (dartboard): كل الرميات متجمعة بعيدًا عن المركز = precise but not accurate.
- **Precision of the n-th reading:** P = 1 − |Xₙ − X̄|/X̄
- **Resolution:** أصغر تغيير يستطيع الجهاز كشفه. **Sensitivity:** Δoutput/Δinput.
- **Limiting (guarantee) error:** مثلًا voltmeter بمدى 150 V ودقة ±1% full scale ← الخطأ ±1.5 V عند *أي* قراءة. عند قراءة 75 V يصبح الخطأ النسبي 1.5/75 = **2%**. ⇒ **اقرأ دائمًا قرب نهاية المقياس (full scale)**.

**مثال محلول:** true = 50 V، measured = 49 V.
- e = 1 V، %error = 1/50 = **2%**، accuracy = **98%**.

**مثال precision:** قراءات: 98, 101, 102, 97, 101, 100, 103, 98, 106, 99 ← X̄ = 100.5. Precision للقراءة 106: 1 − |106−100.5|/100.5 = 1 − 0.0547 = **0.945 (94.5%)**.

### Statistical analysis
- Mean: X̄ = ΣX/n
- Deviation: dᵢ = Xᵢ − X̄ (مجموعها = 0)
- Average deviation: D = Σ|dᵢ|/n
- **Standard deviation:** σ = √(Σdᵢ²/n) (n ≥ 20) ، s = √(Σdᵢ²/(n−1)) (عينات صغيرة)
- Variance = σ²
- Probable error = 0.6745σ

**مثال:** 10.1, 9.9, 10.2, 9.8, 10.0 Ω ← X̄ = 10.0 ؛ dᵢ = 0.1, −0.1, 0.2, −0.2, 0 ؛ Σd² = 0.10 ؛ s = √(0.10/4) = **0.158 Ω**؛ D = 0.6/5 = 0.12 Ω.

### Uncertainty propagation (حدود الخطأ المركّب)
- جمع/طرح: الأخطاء المطلقة **تُجمع**: (R₁ ± ΔR₁)+(R₂ ± ΔR₂) ← ΔR = ΔR₁+ΔR₂ (worst case) أو √(ΔR₁²+ΔR₂²) (RSS).
- ضرب/قسمة: الأخطاء **النسبية** تُجمع. P = I²R ← %P = 2·%I + %R.
- **مثال:** I = 2 A ± 1%، R = 10 Ω ± 2% ← P = 40 W، %error = 2(1)+2 = **4%** ← P = 40 ± 1.6 W.
- **مثال جمع:** R₁ = 100 Ω ± 5%، R₂ = 150 Ω ± 5% في series ← 250 Ω ± (5+7.5) = 250 ± 12.5 Ω (أي ±5%).

### Chauvenet's criterion (رفض قراءة شاذة — مطلوبة في GA1 الموضوع 4)
احسب |dᵢ|/σ لكل قراءة، وقارنه بالقيمة الحرجة حسب n (n=5 → 1.65، n=10 → 1.96، n=20 → 2.24). إذا كانت أكبر تُرفض القراءة ثم يُعاد الحساب.

---

## 5. Analog instruments (لـ GA1)

### PMMC (Permanent Magnet Moving Coil — d'Arsonval)
- **المبدأ:** ملف يتحرك في مجال مغناطيس دائم؛ torque = B·A·N·I يقابله spring torque ⇒ الانحراف ∝ التيار (مقياس **خطي**). يعمل على **DC فقط** (مع AC يحتاج rectifier).
- **مخطط:** مغناطيس على شكل حدوة حصان، قلب حديدي بالمنتصف، ملف على إطار ألومنيوم (يعطي **eddy-current damping**)، مؤشر، وزنبركان (springs).
- **مميزات:** دقة عالية، مقياس خطي، استهلاك قليل. **عيوب:** DC فقط، هش، تكلفة.

### DC ammeter (shunt)
R_sh = I_m·R_m / (I − I_m)
**مثال:** I_m = 1 mA، R_m = 100 Ω، المطلوب 1 A ← R_sh = (0.001×100)/(0.999) = **0.1001 Ω**.

### DC voltmeter (multiplier)
R_s = V/I_fs − R_m ، **Sensitivity** S = 1/I_fs (Ω/V)
**مثال:** I_fs = 50 µA، R_m = 1 kΩ، range 10 V ← S = 20 kΩ/V، R_total = 200 kΩ، R_s = **199 kΩ**.

### Loading effect (مهم جدًا)
الـ voltmeter يُوضع على التوازي مع الدائرة فيقلل المقاومة المكافئة ⇒ قراءة أقل من الحقيقة.
**مثال:** مصدر 100 V مع مقسم R₁ = R₂ = 100 kΩ ← الجهد الحقيقي على R₂ = 50 V. voltmeter حساسيته 20 kΩ/V على range 50 V ← R_v = 1 MΩ. R₂‖R_v = 90.9 kΩ ← V = 100×90.9/190.9 = **47.6 V** ⇒ error = 4.8%. الحل: voltmeter بحساسية أعلى (أو digital بـ 10 MΩ).

---

## 6. Transducers & Sensors (CLO1)
- **Active** (يولّد إشارته: thermocouple، piezoelectric) مقابل **Passive** (يحتاج excitation: RTD، strain gauge، thermistor، LVDT).
- **Analog** مقابل **Digital** output.
- خصائص الاختيار: range، sensitivity، linearity، resolution، response time، accuracy، cost، environment.
- **Strain gauge:** GF = (ΔR/R)/ε. مثال: R = 120 Ω، GF = 2، ε = 500×10⁻⁶ ← ΔR = 2×500×10⁻⁶×120 = **0.12 Ω** (تغير صغير جدًا ⇒ نحتاج Wheatstone bridge + amplifier).
- **RTD:** R_T = R₀(1+αΔT). Pt100: R₀=100 Ω، α=0.00385 ← عند 50 °C: R = 100(1+0.1925) = **119.25 Ω**.
- **Thermocouple:** Seebeck effect، V ≈ k·ΔT (Type K ≈ 41 µV/°C ← عند ΔT = 100 °C ≈ 4.1 mV).

---

## 7. Signal Conditioning (CLO3 — GA2: G1–G5)
**التعريف:** معالجة إشارة الـ sensor الخام لتصبح مناسبة للمرحلة التالية (ADC/عرض/تحكم).
**الوظائف:** amplification، attenuation، filtering، isolation، linearization، excitation، conversion (مثل R→V أو 4–20 mA).

- **Amplification:** Non-inverting: G = 1 + R_f/R_in ؛ Inverting: G = −R_f/R_in. **Instrumentation amplifier** (3 op-amps): G = 1 + 2R/R_G، و CMRR عالٍ.
  مثال: إشارة thermocouple 4 mV وADC مداه 5 V ← G ≈ 1000 (مثلًا R_f = 999 kΩ، R_in = 1 kΩ في non-inverting).
- **Filtering:** Low-pass (يزيل الضوضاء العالية)، High-pass (يزيل DC offset)، Band-pass، Notch (50 Hz من شبكة الكهرباء في ماليزيا). RC: f_c = 1/(2πRC). مثال: R = 1.6 kΩ، C = 1 µF ← f_c ≈ **99.5 Hz**.
- **Voltage divider:** V_out = V_in·R₂/(R₁+R₂). مثال: 12 V ← 5 V لـ ADC: R₁ = 7 kΩ، R₂ = 5 kΩ. (احذر الـ loading: مقاومة الحمل يجب أن تكون ≫ R₂.)
- **Attenuator:** يخفض الإشارة بنسبة ثابتة مع الحفاظ على impedance matching. Attenuation dB = 20·log(V_in/V_out). مثال: 10 V ← 1 V ⇒ **20 dB**.
- **Anti-aliasing:** فلتر low-pass قبل الـ ADC.

---

## 8. Data Acquisition & Interfacing (CLO3 — GA2: G6–G13)
- **DAQ:** نظام يجمع إشارات فيزيائية ويحوّلها لبيانات رقمية. **السلسلة:** Sensor → Signal conditioning → (MUX) → Sample & Hold → ADC → Computer/Software.
- **أنواع:** plug-in boards (PCIe)، USB/Ethernet external، wireless، standalone **data logger** (يعمل بالبطارية ويسجل لفترة طويلة بلا كمبيوتر، مثل مراقبة حرارة مخزن).
- **ADC:**
  - Resolution (step size): Q = V_FS / 2ⁿ ؛ أقصى quantization error = ±Q/2.
  - **مثال 8-bit مقابل 12-bit (لـ GA1 الموضوع 3):** V_FS = 5 V ← 8-bit: Q = 5/256 = **19.5 mV** (error ±9.8 mV)؛ 12-bit: Q = 5/4096 = **1.22 mV** (error ±0.61 mV).
  - Digital code: D = V_in/Q. مثال: 2.0 V بـ 8-bit ← 2/0.01953 = 102.4 ← **102** (0x66).
  - **Nyquist:** f_s ≥ 2f_max (وإلا aliasing). إشارة 1 kHz تحتاج ≥ 2 kHz (عمليًا 5–10×).
  - الأنواع: Flash (أسرع)، SAR (شائع)، Dual-slope (دقيق وبطيء — في DMMs)، Sigma-Delta (دقة عالية).
- **DAC:** V_out = V_ref·D/2ⁿ. مثال: 8-bit، V_ref = 10 V، D = 128 ← **5 V**. الأنواع: binary-weighted، **R-2R ladder**.
- **Interfaces & protocols:** Serial (RS-232، RS-485)، USB، Ethernet، I²C، SPI، UART؛ industrial: **4–20 mA current loop**، HART، Modbus، Profibus، CAN، Fieldbus.
  - لماذا 4–20 mA؟ مقاوم للضوضاء والمسافات، و 4 mA = "live zero" (0 mA يعني سلكًا مقطوعًا). مثال: transmitter مداه 0–100 °C ← 12 mA = **50 °C** (T = (I−4)/16 × 100).

---

## Lecture video notes
*(Chapter 1a — Prof Herlina: Chapter 1 Introduction to Measurement and Instrumentation. لا توجد announcements في الفيديو.)*

### 1.1 ما هو القياس ولماذا؟
- **Measurement:** إعطاء قيمة عددية + وحدة لكمية فيزيائية بمقارنتها بـ standard معروف.
- **Instrumentation:** علم/ممارسة استخدام الأجهزة لـ measure, monitor, display, record, control.
- **أهداف القياس الثلاثة:**
  1. **Compare** (نوعي qualitative): "الكرة الحمراء أكبر من الخضراء".
  2. **Quantify** (كمّي): الحمراء 2 cm والخضراء 1 cm.
  3. **Analyze**: إذن الحمراء ضعف عرض الخضراء.
- **مثال البرتقال:** Navel قطره 7 cm ووزنه 250 g مقابل Valencia قطره 6 cm ووزنه 200 g. ويمكن أيضًا مقارنة كمية العصير (mL)، الحلاوة (**°Brix**)، عدد البذور، shelf life (أيام)، السعر (RM)، القيمة الغذائية — **كل خاصية لها وحدتها**.
  - تمرين: Navel أثقل من Valencia بنسبة (250−200)/200 = **25%**.
- **أهمية القياس:**
  - Research و Engineering design.
  - **Quality control** (sensor feedback في خطوط الإنتاج).
  - **Safety:** جرعة paracetamol تُحسب حسب وزن الجسم (مثلًا ~15 mg/kg ← طفل 20 kg ≈ 300 mg) — خطأ في الميزان = خطر.
  - **Environment:** قياس منسوب النهر للإنذار من الفيضانات، ومؤشر **API (Air Pollutant Index)** لجودة الهواء في ماليزيا.

### 1.2 SI units
- 7 base quantities: length **m**، mass **kg**، time **s**، current **A**، temperature **K** (وليس °C أو °F!)، amount **mol**، luminous intensity **cd**.
- أنظمة وحدات أخرى، مثل **MKS** (metre–kilogram–second) و CGS.
- **Derived units:** area m²، volume m³، velocity m/s، acceleration m/s²، force **N = kg·m/s²**، energy **J**، power **W**، charge **C**، voltage **V**، resistance **Ω**.
- **Prefixes:** m = 10⁻³، µ = 10⁻⁶، n = 10⁻⁹، k = 10³، M = 10⁶، G = 10⁹.
- أمثلة: 25 °C = 298.15 K ؛ 3.3 kΩ = 3300 Ω ؛ 470 nF = 0.47 µF ؛ قوة على كتلة 2 kg بتسارع 3 m/s² = **6 N**.

### 1.3 أنواع القياس (Types of measurement) — سؤال امتحان محتمل
| النوع | المعنى | أمثلة المحاضرة |
|---|---|---|
| **Static** | الكمية ثابتة (steady state) | جهد بطارية مشحونة بالكامل، حرارة الغرفة بعد 30 دقيقة من تشغيل الـ AC، طول قضيب |
| **Repeated** | قياس نفس الشيء عدة مرات | قياس مقاومة 10 مرات، الوزن على الميزان عدة مرات، ضغط الدم 3 مرات |
| **Dynamic** | الكمية تتغير مع الزمن | جهد بطارية أثناء الشحن، سرعة المحرك RPM، نبض القلب أثناء التمرين |
| **Sample-based** | قياس جزء (subset) لتمثيل الكل | فحص 20 من 1000 resistor، 10 برتقالات من شاحنة، عمر 5 من 5000 لمبة |

- **نقطة مهمة:** الـ Repeated measurement يحسّن **precision** (يقلل random error بالمتوسط)، لكنه **لا يحسّن accuracy** إلا إذا قورن بـ standard (لأن الـ systematic error يبقى ثابتًا).
  - مثال: ميزان فيه offset +0.5 kg، قسته 10 مرات فكان المتوسط 70.5 kg — القراءات متقاربة جدًا (precise) لكنها كلها خاطئة بـ 0.5 kg (not accurate).
- Sample-based يوفر الوقت والتكلفة، ويُستخدم حين يكون الاختبار مُتلفًا (destructive)، مثل اختبار عمر اللمبة حتى تحترق.

---

## 9. نقاط امتحان محتملة (Likely exam points)
1. تعريف measurement/instrumentation/metrology/transducer.
2. الكميات الأساسية السبع ووحداتها + تحويل الـ prefixes.
3. أنواع القياس الأربعة مع أمثلة.
4. التمييز بين accuracy و precision وresolution وsensitivity.
5. أنواع الأخطاء الثلاثة + كيف نقلل كل نوع.
6. حسابات: %error، precision، mean، standard deviation، limiting error، error propagation.
7. PMMC: المبدأ، shunt/multiplier، sensitivity Ω/V، loading effect.
8. Signal conditioning: الوظائف + حسابات gain/divider/f_c/dB.
9. DAQ block diagram، ADC resolution، Nyquist، DAC output، 4–20 mA.

## 10. اختبر نفسك (Self-test Q&A)
1. **س:** ما الفرق بين static و dynamic measurement؟ **ج:** static: الكمية ثابتة (مثل طول قضيب)؛ dynamic: تتغير مع الزمن (مثل RPM المحرك).
2. **س:** لماذا لا يحسّن التكرار الـ accuracy؟ **ج:** لأنه يقلل random error فقط؛ الـ systematic error يبقى ويحتاج calibration مقابل standard.
3. **س:** ما وحدة الحرارة في SI؟ **ج:** kelvin (K).
4. **س:** القيمة الحقيقية 80 V والقراءة 78 V؛ احسب %error والـ accuracy. **ج:** 2.5%، و 97.5%.
5. **س:** voltmeter مداه 100 V بدقة ±2% FS يقرأ 40 V؛ ما الخطأ النسبي؟ **ج:** ±2 V ← 2/40 = **5%**.
6. **س:** P = V²/R، V ± 1% و R ± 0.5%. **ج:** %P = 2(1)+0.5 = **2.5%**.
7. **س:** step size لـ 10-bit ADC بمدى 5 V؟ **ج:** 5/1024 = **4.88 mV**.
8. **س:** إشارة بتردد 3 kHz؛ أقل sampling rate؟ **ج:** 6 kHz.
9. **س:** meter بـ I_fs = 100 µA؛ ما sensitivity؟ **ج:** 10 kΩ/V.
10. **س:** transmitter 4–20 mA لمدى 0–10 bar يعطي 16 mA؛ ما الضغط؟ **ج:** (16−4)/16 × 10 = **7.5 bar**.
11. **س:** اذكر مثالًا لـ sample-based measurement. **ج:** فحص 20 من 1000 resistor.
12. **س:** 1 N يساوي بالوحدات الأساسية؟ **ج:** kg·m/s².

> ملاحظة للمعلّم: الأقسام 4–8 مبنية على عناوين CLO وواجبات المادة والمراجع القياسية (Kalsi, Morris)؛ لم تُرفع شرائح المحاضرات لهذه الفصول بعد. القسم 3 وملاحظات الفيديو مأخوذة من المحاضرة نفسها.

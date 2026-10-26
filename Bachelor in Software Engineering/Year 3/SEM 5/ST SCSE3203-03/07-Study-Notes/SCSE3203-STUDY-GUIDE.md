# دليل مذاكرة SCSE3203 Special Topics (Java Web Application Development)
**القسم 03 | المحاضرة: Dr Nor Azizah Sa'adon (azizahsaadon@utm.my، مكتب N28) | الفصل الأول 2026/2027**

> الدليل مبني على 6 ملفات: Course Information (CI)، محاضرة Week 1، محاضرة Week 2، Week 2 Guided Lab، Project Brief، و Etiqa Case Study.
> المصطلحات التقنية باللغة الإنجليزية عمدًا لأن الامتحان سيكون بها.

---

## 0) الصورة الكبيرة قبل أي شيء
المادة كلها عن بناء **Java web application** باستخدام **Spring MVC / Spring Boot**، مع التركيز على ممارسات الـ Software Engineering (SDLC) واستخدام الـ AI بشكل مسؤول.
تخيّل الرحلة هكذا:

```
Browser --HTTP request--> Embedded Tomcat --> Spring MVC (DispatcherServlet)
   --> @Controller --> Service --> Repository --> Database (MySQL)
   <-- HTML (Thymeleaf) أو JSON (REST) أو error  <--
```
كل أسبوع يشرح قطعة من هذه السلسلة. الأسبوع 1 = الفكرة العامة + الأخلاقيات، الأسبوع 2 = تجهيز الأدوات وتشغيل أول صفحة.

---

## Week 1: Current Trends and Ethics

### الفكرة الرئيسية
فهم كيف يعمل تطبيق الويب بلغة Java (من HTTP إلى قاعدة البيانات)، وكيف تطوّرت تقنيات Java web، ثم كيف تستخدم AI في البرمجة **دون أن تفقد المسؤولية** (privacy، intellectual property، academic integrity، accountability).

### المفاهيم الأساسية

**1. Static vs Dynamic web pages**
- **Static**: السيرفر يرجّع ملفًا جاهزًا كما هو (مثلًا صفحة "About" ثابتة).
- **Dynamic**: التطبيق يبني المحتوى وقت الطلب باستخدام بيانات الطلب أو قاعدة البيانات (مثلًا صفحة "My registered courses" تختلف لكل طالب).
- كود Java يعمل على **السيرفر**؛ JavaScript يمكن أن يعمل في **المتصفح**. والنتيجة في الحالتين شيء يعرضه المتصفح.

**2. مكوّنات تطبيق الويب (Web application components)**
| المكوّن | دوره |
|---|---|
| Browser (Front-end) | الواجهة: HTML (المحتوى)، CSS (الشكل)، JavaScript (التفاعل) |
| Server (Back-end) | يعالج الطلبات ويطبّق business rules |
| Database | يخزن البيانات الدائمة (persistent) مثل التسجيلات |
| HTTP | البروتوكول الذي يربط client بـ server |

**3. تطوّر Java web (Java web evolution)** — احفظ الترتيب:
1. **Servlets + JSP**: Servlet = Java API يستقبل HTTP request ويرجّع response؛ JSP = صفحة server-side تولّد HTML.
2. **MVC pattern**: فصل معالجة الطلب (Controller) عن business logic (Model) عن العرض (View).
3. **Spring MVC**: framework مبني على Servlet، ينظّم العمل حول controllers و views.
4. **REST APIs**: تبادل بيانات (غالبًا JSON) مع متصفح أو تطبيق موبايل.
- **Thymeleaf**: template engine يرسم HTML باستخدام بيانات من التطبيق (بديل حديث لـ JSP).

**4. Java SE vs Jakarta EE vs Spring**
- **Java SE**: المنصة الأساسية للغة؛ **JDK** هو أداة التطوير.
- **Jakarta EE** (اسمها القديم Java EE): مجموعة specifications للمؤسسات، منها **Servlet**.
- **Spring**: framework يتكامل مع بعض Jakarta APIs.
- نصيحة مهمة: **طابِق إصدارات JDK و Spring و Tomcat** قبل نسخ أي كود مثال (عدم التوافق مصدر أخطاء شائع).

**5. التطبيق النموذجي (Typical Java web app)**
Browser → HTTP → Tomcat/Spring MVC controller → service → repository → database، ثم response للمتصفح (HTML أو JSON أو error).
الفائدة: **Separation of concerns** = كل طبقة مسؤولية واحدة → أسهل في الاختبار والصيانة.

**6. الأدوات باختصار**: IDE (VS Code/STS) للكتابة والـ debugging؛ **Maven** لإدارة dependencies والبناء عبر `pom.xml`؛ **Tomcat** لتشغيل تطبيقات Servlet؛ **MySQL** للبيانات؛ **Git** لتتبع التغييرات و **GitHub** للاستضافة والتعاون.

**7. HTTP request/response** (مهم جدًا للامتحان)
- **Request** = method + path + headers + body (اختياري).
- **Response** = status code + headers + body (اختياري).
- **HTTP is stateless**: السيرفر لا يتذكّر الطلب السابق؛ لذلك نستخدم **sessions** أو **tokens** لتذكّر المستخدم (مثلًا بعد login).

**HTTP methods**
| Method | المعنى | مثال |
|---|---|---|
| GET | جلب بيانات | فتح صفحة قائمة الطلاب |
| POST | إرسال بيانات للمعالجة | إرسال form تسجيل |
| PUT | استبدال resource كاملًا | تحديث كل بيانات طالب |
| PATCH | تعديل جزء | تغيير البريد فقط |
| DELETE | حذف | حذف تسجيل |

**Status codes**
| Code | المعنى |
|---|---|
| 200 OK | نجح |
| 201 Created | تم إنشاء resource (بعد POST غالبًا) |
| 400 Bad Request | الطلب نفسه خاطئ (بيانات غير صالحة) |
| 401 Unauthorized | **يحتاج authentication** (لم تسجّل دخول) |
| 403 Forbidden | **ممنوع** حتى لو سجّلت دخول (لا صلاحية = authorization) |
| 404 Not Found | المسار/الصفحة غير موجودة |
| 500 Internal Server Error | خطأ في السيرفر |
> فخ امتحاني: الفرق بين 401 و 403. الـ 401 = "من أنت؟"، والـ 403 = "أعرفك، لكن ليس لك صلاحية".

**نشاط عملي**: افتح Network panel في المتصفح (F12) → Reload → اختر طلبًا وحدّد method و path و status، وقارن request headers بـ response headers. واسأل: ماذا يخبرني هذا التبادل وماذا **لا** يثبت؟ (مثلًا 200 OK لا يثبت أن التطبيق آمن).

**8. AI-assisted programming vs Vibe coding**
| الجانب | Vibe coding | AI-assisted programming |
|---|---|---|
| المعنى | prompts محادثة تولّد وتعدّل معظم الكود | AI يساعد في التنفيذ والشرح والـ debugging والاختبارات |
| الأسلوب | تكرار prompts ومراقبة النتيجة، أحيانًا مع فحص قليل للكود | مراجعة الاقتراحات وفهمها قبل دمجها |
| المسؤولية | تحقّق من الكود قبل تجاوز مرحلة التجريب | المطوّر يبقى مسؤولًا عن التصميم والاختبار والجودة |
**الفرق الجوهري = مستوى فهم الكود والتحقق منه.** الاستخدام المسؤول: افحص التغييرات، اختبر السلوك، ووثّق المساعدة.

**9. Core software engineering vs AI-accelerated development** (Qualhon Informatics, 2026)
- Core SE: مناسب لـ complex integrations و security-sensitive platforms.
- AI acceleration: مناسب لـ prototypes و MVP و internal automation.
- **الاثنان** يحتاجان architecture decisions و code review و testing. اختر حسب تعقيد المشروع واحتياجاته طويلة المدى.

**لماذا تبقى معرفة SE مهمة؟** صفحة تسجيل "تعمل" ما زالت تحتاج: validation للمدخلات، access checks، و safe database queries (تجنّب SQL injection).

**10. الأخلاقيات الأربع**
- **Privacy**: استخدم **synthetic data**؛ لا تضع passwords أو tokens أو بيانات شخصية في prompts؛ اجمع الضروري فقط (data minimisation)؛ قيّد الوصول وقلّل الـ logging؛ اعرف أين تُرسل البيانات وتُخزّن.
- **Intellectual property**: افحص **licences** قبل إعادة استخدام كود/صور/datasets؛ "متاح للعامة" ≠ "مجاني لإعادة الاستخدام"؛ سجّل المصدر والـ attribution؛ راجع مخرجات AI لاحتمال أنها منسوخة.
- **Academic integrity**: اتبع قواعد AI لكل تقييم؛ صرّح بالمساعدة ونطاقها؛ اشرح كودك وقراراتك؛ لا تخترع نتائج.
- **Developer accountability**: **demo يعمل ≠ برنامج آمن وموثوق**؛ راجع validation و authorisation و database access؛ اختبر المدخلات العادية والخاطئة وغير المتوقعة؛ صرّح بالقيود بصدق.

**حالة نقاش (متوقعة في الامتحان)**: AI ولّد تطبيق تسجيل طلاب، وتم وضع بيانات طلاب حقيقية في الـ prompt، والكود يعمل لكن بلا اختبارات ولا فحص licence. **ثلاثة مخاطر وحلولها:**
1. تسريب بيانات شخصية (privacy) → استخدام synthetic data وحذف البيانات الحقيقية.
2. مشاكل IP/licence → فحص مصدر الكود والـ licences وتوثيقها.
3. أخطاء/ثغرات غير مكتشفة → unit tests، اختبار مدخلات خاطئة، code review، فحص authorisation.

### المتوقع في الامتحان (Week 1)
- تتبّع طلب واحد عبر الـ stack (Browser→Tomcat→Controller→Service→Repository→DB→Response).
- تعريف Servlet / JSP / Spring MVC / Thymeleaf، والترتيب التاريخي.
- HTTP methods و status codes (خصوصًا 401 vs 403، PUT vs PATCH)، ومعنى stateless.
- الفرق بين vibe coding و AI-assisted programming.
- تحليل سيناريو أخلاقي.

### أسئلة تقييم ذاتي (Week 1)
1. ما الفرق بين static و dynamic page؟ ← static ملف جاهز؛ dynamic يُبنى من بيانات الطلب/قاعدة البيانات.
2. لماذا نحتاج sessions؟ ← لأن HTTP stateless.
3. مستخدم مسجّل دخول يحاول فتح صفحة admin. ما الكود المناسب؟ ← 403.
4. ما الذي يحدد Servlet كـ specification؟ ← Jakarta EE.
5. متى نستخدم PATCH بدل PUT؟ ← عند تعديل جزء من resource.
6. اذكر فائدة واحدة لـ AI وخطوة تحقق واحدة. ← توليد test cases؛ مراجعة الكود وتشغيل الاختبارات مقابل التوثيق.
7. لماذا "publicly accessible" لا يعني "free to reuse"؟ ← لأن الحقوق تحكمها الـ licence وليس إتاحة الوصول.
8. ما فائدة separation of concerns؟ ← سهولة الاختبار والصيانة.

---

## Week 2: Java Web Development Environment (+ Guided Lab)

### الفكرة الرئيسية
من جهاز Windows عليه VS Code فقط → إلى صفحة HTML تُرسم على السيرفر (server-rendered) بواسطة Spring Boot + Thymeleaf، ثم packaging كـ JAR ورفع الكود على GitHub.
**نجاح الأسبوع = toolchain يعمل + صفحة محلية server-rendered تعمل.**

### ما داخل النطاق وما خارجه
- داخل: toolchain، Maven، embedded Tomcat، HTML بسيط، Git أساسي، و `@Controller` / `@GetMapping` / logical view names.
- مؤجَّل: Dependency Injection، Thymeleaf forms، persistence، security، REST/JSON/Fetch.

### كل أداة لها مسؤولية واحدة (جدول مهم جدًا)
| Technology | الدور |
|---|---|
| Java / JDK | البرمجة، الـ compilation، أدوات التشغيل |
| VS Code | المحرر + terminal + debugger (ليس هو الـ JDK!) |
| Maven | dependencies، compile، test، package |
| Spring Boot | bootstrap للتطبيق وإعدادات افتراضية (conventions) |
| Embedded Tomcat | يستقبل ويعالج HTTP connections |
| Thymeleaf | يرسم HTML على السيرفر |
| Git / GitHub | تاريخ النسخ / استضافة تعاونية |

### مسارا العمل (Workflows)
**Build-time**: كتابة Java sources → تعريف dependencies → Maven يجلبها → compile إلى **bytecode** (.class) → تشغيل tests → package إلى **executable JAR**. (مجلد `target/` ناتج بناء، لا يُرفع إلى Git.)
**Runtime**: Browser `GET /` → Embedded Tomcat → Spring MVC routing → HomeController → Thymeleaf template → HTML للمتصفح. (المتصفح يستلم **HTML** وليس JSON.)

### JDK و JVM
- **JDK** = أدوات التطوير، منها `javac` (compiler: .java → .class bytecode) و `java` (launcher).
- **JVM** = ينفّذ الـ bytecode ويدير التحميل والتشغيل.
- الإصدار المعتمد: **Java 21 LTS** (Eclipse Temurin من adoptium.net، اختر **JDK وليس JRE**).
- التحقق: `java -version` ، `javac -version` ، `where.exe java` ، `where.exe javac`.
- **JAVA_HOME** يشير إلى جذر الـ JDK، و **PATH** يحتوي مجلد `bin`.
- إذا ظهر "javac is not recognized" ← غالبًا ثبّت JRE بدل JDK أو PATH خاطئ.

### VS Code
تثبيت **Extension Pack for Java** (Microsoft) و **Spring Boot Extension Pack** (VMware). افتح **جذر المشروع** (المجلد الذي فيه `pom.xml`) وليس `src` فقط.

### Maven — لماذا؟
| بدون Maven | مع Maven |
|---|---|
| تنزيل JARs يدويًا | dependencies معرّفة في `pom.xml` |
| صعوبة التوافق | **Transitive dependency resolution** (يجلب تبعيات التبعيات تلقائيًا) |
| compile/package غير موحّد | lifecycle موحّد: compile / test / package |
| builds غير قابلة للتكرار | **reproducible builds** |

**Maven coordinates (هوية المشروع)**:
```xml
<groupId>my.utm.scse3203</groupId>      <!-- namespace / المؤسسة -->
<artifactId>week02-demo</artifactId>   <!-- اسم الناتج -->
<version>0.0.1-SNAPSHOT</version>       <!-- SNAPSHOT = نسخة قيد التطوير -->
```
عناصر POM الأخرى: `dependencies` (المكتبات والـ starters)، `parent` (إدارة مشتركة للإصدارات)، `build/plugins` (أدوات packaging والتشغيل).

**Maven Wrapper** (`mvnw.cmd` + مجلد `.mvn`): يغنيك عن تثبيت Maven عالميًا؛ ينزّل الإصدار المحدد للمشروع.
```
.\mvnw.cmd -version
.\mvnw.cmd compile
.\mvnw.cmd test
.\mvnw.cmd package
.\mvnw.cmd spring-boot:run      <- plugin goal
.\mvnw.cmd clean package
java -jar target\week02-demo-0.0.1-SNAPSHOT.jar
```

### Spring Framework vs Spring Boot
| Spring Framework | Spring Boot |
|---|---|
| البنية التحتية + Web MVC | مبني فوق Spring Framework |
| configuration مرن (لكن يدوي أكثر) | **starter dependencies** و conventions |
| مفاهيم: components و DI | **auto-configuration** |
| يدعم معماريات كثيرة | تشغيل سهل مع **embedded server** |

**Starters** (Spring Boot 4.x): `spring-boot-starter-webmvc` (Spring MVC + embedded Tomcat) و `spring-boot-starter-thymeleaf`.
**Auto-configuration** = Spring Boot يفحص الـ dependencies والإعدادات ويهيّئ المكوّنات الشائعة تلقائيًا (لذلك يعمل Tomcat بدون إعداد يدوي).

**Embedded vs External Tomcat**
| تقليدي | إعدادنا |
|---|---|
| تثبيت servlet container منفصل | لا تثبيت لـ Tomcat |
| رفع **WAR** إلى السيرفر | Tomcat مدمج داخل التطبيق |
| السيرفر والتطبيق يُداران منفصلين | التشغيل عبر Maven أو **executable JAR** |

### Spring Initializr (start.spring.io)
Maven + Java، Spring Boot 4.x، Group `my.utm.scse3203`، Artifact `week02-demo`، Package `my.utm.scse3203.week02`، Packaging **JAR**، Java **21**، Dependencies: **Spring Web MVC + Thymeleaf** → Generate ZIP → فك الضغط → افتح الجذر في VS Code.

### Bootstrap class
```java
@SpringBootApplication
public class Week02DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(Week02DemoApplication.class, args);
    }
}
```
`main()` يطلق Spring Boot (التفاصيل مثل component scanning و IoC لاحقًا في Week 9).

### هيكل المشروع
| المسار | الدور |
|---|---|
| `pom.xml` | Maven metadata و dependencies و build |
| `src/main/java` | الكلاسات والـ controllers |
| `src/main/resources/templates` | قوالب HTML تُرسم على السيرفر (Thymeleaf) |
| `src/main/resources/static` | ملفات ثابتة: CSS/images/JS تُخدم مباشرة |
| `application.properties` | إعدادات خارج الكود (externalised configuration) |
| `src/test/java` | الاختبارات |
| `mvnw.cmd` / `.mvn` | Maven Wrapper |
> فخ: **templates ≠ static**. الـ templates تمر بعملية view rendering؛ الـ static تُرسل كما هي.

### أول Controller
```java
package my.utm.scse3203.week02.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping("/")
    public String home() { return "index"; }   // logical view name

    @GetMapping("/about")
    public String about() { return "about"; }
}
```
- `@Controller` = page controller في Spring MVC.
- `@GetMapping("/")` = يربط طلب GET على المسار `/` بهذه الدالة.
- `return "index"` = **logical view name**، وليس نصًا يُعرض. Thymeleaf يحوّله إلى `templates/index.html`. (لو أردت نصًا/JSON نستخدم `@RestController` لاحقًا في Week 12.)
- يجب أن يكون الـ controller **داخل الـ base package** وإلا لن يُكتشف (→ 404).

**تدفق الصفحة الرئيسية**: GET `/` → routing يجد mapping → دالة @Controller → ترجع "index" → Thymeleaf يحمّل index.html → المتصفح يعرض HTML. (هذه server-rendered page وليست REST endpoint.)

### الإعدادات (application.properties)
```
spring.application.name=week02-demo
server.port=8081
```
يوضّح فكرة الإعداد خارج الكود؛ بعد التجربة أرجِع المنفذ إلى 8080.

### عند الضغط على Run
- في الـ terminal: رسائل بدء Spring Boot، و "Tomcat started on port 8080".
- في المتصفح `http://localhost:8080/`: الصفحة. **ظهور 404 قبل إنشاء mapping طبيعي** = السيرفر يعمل لكن المسار غير موجود.

### Git workflow
Edit → `git status` → `git add .` (stage) → `git commit -m "..."` (حفظ محلي) → `git push` (رفع إلى remote) → تحقق على GitHub.
```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git init ; git branch -M main
git remote add origin <URL> ; git push -u origin main
```
- **Git** = نظام version control موزّع، يعمل بدون إنترنت، يخزن commits محليًا.
- **GitHub** = خدمة استضافة remote + code review + pull requests + automation.
- **commit vs push**: commit يحفظ محليًا؛ push يرسل الـ commits إلى الـ remote.
- لا ترفع `target/` ولا secrets/tokens (تحقق من `.gitignore`). لا تعمل force-push فوق محتوى موجود.

### CI/CD (تعرّف فقط)
**Continuous Integration**: كل push يطلق build آلي (Maven يعمل compile و tests)، والفشل يظهر للفريق. التفاصيل في Week 14.

### Troubleshooting (سؤال امتحاني محتمل جدًا)
| العَرَض | ابدأ من |
|---|---|
| java / javac غير موجود | PATH، JAVA_HOME، تثبيت JDK |
| إصدار Java خاطئ | `where.exe java`؛ اختيار الـ JDK النشط |
| فشل تنزيل dependency | Maven log؛ network/proxy |
| Port 8080 in use | برنامج آخر يستخدم المنفذ أو غيّر `server.port` |
| 404 | الـ controller mapping والمسار المطلوب والـ package |
| 500 / template not found | اسم الـ view ومكان الملف في templates ووجود Thymeleaf dependency |
| git push rejected | remote URL، الصلاحيات، authentication |

**Evidence-based diagnosis**: أعِد إنتاج الخطأ → اقرأ **أول خطأ ذي معنى** → صنّف الخطأ → كوّن فرضية → **غيّر متغيرًا واحدًا فقط** → أعِد التشغيل ووثّق. (لا تعِد تثبيت كل الأدوات عشوائيًا.)

### مهمة SDL بعد المحاضرة (Lab Part K) — مطلوبة منك
أنشئ `/profile` بـ `@GetMapping` و `profile.html` (بيانات طالب **وهمية**) مع روابط Home و About، واعمل commit. بلا REST/JSON.
**دليل التسليم (حسب تعليمات المحاضرة)**: رابط الـ repository، لقطات شاشة للصفحات، لقطة إصدارات الـ terminal، و reflection من 100–150 كلمة عن خطأ واجهته وكيف شخّصته.

### المتوقع في الامتحان (Week 2)
- كيف تعمل JDK + Maven + Spring Boot + Embedded Tomcat + Thymeleaf معًا.
- لماذا `return "index"` يعرض index.html وليس النص "index".
- الفرق commit/push، Git/GitHub، Spring/Spring Boot، embedded/external Tomcat، templates/static، JDK/JVM.
- قراءة `pom.xml` (groupId/artifactId/version/dependencies) ومعنى transitive dependencies.
- تشخيص أخطاء من أعراضها.

### أسئلة تقييم ذاتي (Week 2)
1. ما وظيفة `javac`؟ ← يحوّل .java إلى bytecode (.class).
2. لماذا لا نثبّت Tomcat منفصلًا؟ ← لأن starter الـ webmvc يوفّر embedded Tomcat.
3. ما فائدة mvnw.cmd؟ ← تشغيل Maven بالإصدار المحدد للمشروع بدون تثبيت عالمي.
4. فتحت localhost:8080 فظهر 404 مع أن السيرفر يعمل. لماذا؟ ← لا يوجد mapping للمسار، أو الـ controller خارج الـ base package.
5. ظهر 500 "template cannot be resolved". ما الذي تفحصه؟ ← اسم الـ view يطابق اسم الملف، والملف في `templates/`، ووجود Thymeleaf.
6. لماذا لا نرفع `target/`؟ ← ناتج بناء يُعاد توليده، ليس source code.
7. ما معنى auto-configuration؟ ← Spring Boot يهيّئ المكوّنات تلقائيًا بناءً على الـ dependencies.
8. ما الفرق بين WAR و executable JAR؟ ← WAR يُرفع على سيرفر خارجي؛ JAR يحوي سيرفرًا مدمجًا ويعمل بـ `java -jar`.
9. ما معنى `0.0.1-SNAPSHOT`؟ ← نسخة تطوير غير نهائية.
10. في أي ملف تغيّر المنفذ؟ ← `application.properties` عبر `server.port`.

---

## المشروع الجماعي (Group Project) — Etiqa Digital Payout (eMoney)
### المطلوب
بناء **WEB APPLICATION SYSTEM** لحل مشكلة Etiqa eMoney (نفس القضية من مادة SCSE2123 Software Requirements، فصل 1 2025/2026) بناءً على المتطلبات التي حُددت سابقًا. (يوجد في الـ brief رابط تسجيل Webex لجلسة requirements elicitation مع كلمة مرور.)
### القواعد
1. اسم فريد للتطبيق يعبّر عن وظيفته الرئيسية.
2. أداة إدارة مشاريع (Azure DevOps / Trello / JIRA / GitHub) مع مهام لكل عضو، والبورد مقسّم: To Do / In Progress / Done.
3. **دوران (roles) مختلفان على الأقل** (مثل Customer و Claims Officer/Admin).
4. يجب استخدام **Spring MVC** (Spring Boot مسموح).
5. **8 modules على الأقل**، وكل عضو مسؤول عن **module-ين**. الفريق 3–4 أعضاء.
### المراحل
- **Phase 1 – Progress Demo (Week 9: 7–13 Dec 2026، في وقت المحاضرة)**: 10–15 دقيقة؛ شرح الـ modules والمعمارية؛ **front-end كامل** بـ JSP أو Thymeleaf لكل الـ modules؛ كل عضو يعرض module-يه؛ الكود مدمج كمشروع واحد؛ **الغائب = صفر**. حافظ على UI موحّد وأظهر data flow و navigation.
- **Phase 2 – Final Demo (Week 15: 18–24 Jan 2027)**: يُفحص لكل عضو: Model (DAO, Database)، View (JSP, CSS, Bootstrap)، Controller (CRUD)، Authorization (session/filter)، Personalization & Reporting (Transaction, History).
### الدرجات: Progress 3% + Code 7% + Presentation 5% = **15%**

### ملخص قضية Etiqa (للفهم)
- Etiqa (تابعة لـ Maybank) تدفع حاليًا claims و surrender و surplus sharing و cashback عبر **bank transfer** تقليدي: بطيء، وأنظمة متفرقة، و reconciliation يدوي، وشفافية قليلة للعميل.
- الحل: **eMoney / eWallet** داخل تطبيق Etiqa+ يُودَع فيه المبلغ فورًا، والعميل يختار: **withdraw** للبنك، أو **reinvest** في منتجات تأمين/تكافل، أو **donate**.
- Stakeholders: العملاء، Claims & Finance officers (validate/approve/reconcile)، Compliance & Risk، IT & Integration، Maybank technology partners (payment gateway/API)، و **BNM** (الجهة الرقابية).
- القيود: الالتزام بـ BNM eMoney framework و **RMiT** (Risk Management in Technology): encryption، restricted access، operational continuity، customer disclosures، و closed-loop داخل منظومة Etiqa مع السماح بالسحب للبنك.
- **أفكار modules (8+)**: User Management/Registration & Login، eWallet Balance & Dashboard، Payout Crediting (claims/refund/surplus/cashback)، Payout Approval (officer)، Withdrawal to Bank، Reinvest in Policy، Donation، Transaction History & Reports، Compliance/Audit Reporting، Notifications.

---

## خريطة المادة (Course Map, Weeks 1–15)
| Week | التاريخ | الموضوع | التقييم |
|---|---|---|---|
| 1 | 12–18 Oct | Current Trends & Ethics: HTTP، Java web evolution، AI، privacy، IP، integrity | |
| 2 | 19–25 Oct | Dev Setup: JDK، VS Code، Maven، Tomcat، GitHub، CI/CD | Project briefing + تشكيل الفرق |
| 3 | 26 Oct–1 Nov | SDLC & Project Planning: Agile، scope، roles، JIRA، Git workflow | |
| 4 | 2–8 Nov | Requirements: user stories، use cases، traceability | **Lab Exercise 1** (Deepavali 8 Nov) |
| 5 | 9–15 Nov | Design: MVC، layered architecture، UML class diagram، DB design | **Lab Exercise 2** (Deepavali 9 Nov) |
| 6 | 16–22 Nov | Spring Web MVC: application context، DispatcherServlet، request mapping | **Lab Exercise 3** |
| 7 | 23–29 Nov | Thymeleaf، Model، forms، validation، @ModelAttribute، redirect | **Quiz 1** |
| 8 | 30 Nov–6 Dec | **Mid-sem break** | |
| 9 | 7–13 Dec | Dependency Injection، IoC، controller/service/repository، low coupling/high cohesion | **Project Progress Demo** + **Test: الخميس 10 Dec 2026، 8pm** |
| 10 | 14–20 Dec | Persistence & DB integration، SQL، safe data access | **Assignment** (Code + Video) |
| 11 | 21–27 Dec | JPA & Hibernate: ORM، entity mapping، relationships، CRUD | **Lab Exercise 4** (Christmas 25 Dec) |
| 12 | 28 Dec–3 Jan | REST، @RestController، JSON، @RequestBody، ResponseEntity، Fetch API | **Lab Exercise 5** |
| 13 | 4–10 Jan | Spring Security (BCrypt، RBAC، CSRF)، JUnit، MockMvc، code quality | |
| 14 | 11–17 Jan | Deployment: JAR، profiles، env variables، CI/CD، monitoring | **Quiz 2** |
| 15 | 18–24 Jan | Project demonstration، AI-use declaration | **Final Presentation** (Thaipusam 22 Jan) |
| — | بعد الفصل | | **Final Exam 30%** |

## التقييم (Assessment)
| البند | الوزن |
|---|---|
| Quiz 1 & 2 | 10% |
| Assignment (Code 5% + Video 5%) | 10% |
| Lab Exercises (5 LE) | 15% |
| Group Project (Progress 3%، Code 7%، Presentation 5%) | 15% |
| Test (10 Dec 2026، 8pm) | 20% |
| **Final Exam** | **30%** |
- CLO1 (C3 – تطبيق مبادئ SE)، CLO2 (C5 – تقييم تصاميم آمنة مرتبطة بقاعدة بيانات)، CLO3 (A3 – عرض شفهي واحترافية).
- **شروط النجاح**: النجاح في Continuous Assessment (حد أدنى 30% من درجاته) **و** Final Assessment (حد أدنى 20% من درجاته)، و 40% إجمالي (D+).
- ⚠️ **الحضور إلزامي؛ أقل من 80% = حرمان من الامتحان النهائي.** بما أنك لم تحضر الأسبوعين الأولين، تواصل مع المحاضرة فورًا.
- التسليم المتأخر عليه خصم، وبعد 3 أيام أو أكثر لا يُقبل. الـ Make-up exam فقط بشهادة طبية من طبيب معتمد لدى UTM.
- المرجع الرئيسي: Spilca, *Spring Start Here* (2021)؛ إضافي: *Spring Security in Action* 2nd ed. (2024)، و Spring Framework docs. الـ LMS: elearning.utm.my.

## خطة لحاقك السريع (مقترحة)
1. ثبّت JDK 21 + extensions وشغّل مشروع week02-demo (Lab A→G)، ثم Git/GitHub (H)، ثم مهمة `/profile` (K).
2. انضم لفريق مشروع فورًا (التشكيل كان في Week 2).
3. ابدأ قراءة *Spring Start Here* (الفصول الأولى عن Spring context و Spring MVC) استعدادًا لـ Week 3–6.
4. راجع قضية Etiqa وجهّز قائمة modules مع فريقك.

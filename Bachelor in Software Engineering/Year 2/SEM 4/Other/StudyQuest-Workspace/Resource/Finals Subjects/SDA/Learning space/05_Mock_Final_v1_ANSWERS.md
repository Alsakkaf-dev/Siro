# MOCK FINAL v1 — MODEL ANSWERS + MARKING SCHEME

## SECTION A (2 marks each; no partial credit)

1. **B** — new behavior added by extension (new class against existing abstraction), zero modification of working code = OCP.
2. **C** — Singleton's verbatim purpose. (A = Abstract Factory, B = Builder, D = Adapter.)
3. **B — Builder** — many OPTIONAL parts + step-by-step assembly + finished object returned at the end.
4. **C — Adapter** — interface INCOMPATIBILITY with an unmodifiable library (facade only simplifies, never converts).
5. **A** — Observer; the subject's `Notify()` iterates registered observers calling `Update()`. (D is wrong: Attach is registration, done beforehand, not on change.)
6. **B — 6.** Worked: compound `if (a && b)` = 2 conditions; `while` = 1; `switch` with 3 branches = 3−1 = 2. π = 2+1+2 = 5 → C = π+1 = **6**.
7. **B** — CPI = EV/AC; 0.8 means $0.80 earned per $1.00 spent (his slide phrasing with 0.75).
8. **C** — Class + Component = structural (static); all others listed are behavioral.
9. **C — Microservices** — independent deployment + fault isolation are its defining criteria.
10. **B — Availability** — redundancy and watchdog timers are his listed availability tactics.

*(Q6 lesson: always count compound conditions as 2 and switch branches as n−1 — the distractors 5 and 7 are exactly the values you get by missing one of those rules.)*

## SECTION B

### Question 1 (16m)
a) (6m — 1m name + ½m concern + ½m example, ×3)
- **Creational** — concerned with OBJECT CREATION mechanisms, making the system independent of how objects are instantiated (flexibility, initialization, reuse). Example: Singleton / Factory / Abstract Factory / Builder / Prototype.
- **Structural** — concerned with the COMPOSITION/ORGANIZATION of classes and objects into larger structures optimizing flexibility, scalability, reuse ("integration"). Example: Adapter / Composite / Facade.
- **Behavioral** — concerned with COMMUNICATION and INTERACTION between objects: collaboration, responsibility delegation, loose coupling. Example: Iterator / Observer.

b) (4m — any 4 contrast rows, 1m each)
| Aspect | Factory | Abstract Factory |
|---|---|---|
| Purpose | create a SINGLE product/type | create FAMILIES of related/dependent objects |
| Products | one product or closely related types | a family of related products per factory |
| Complexity/Dependency | simpler; relies on subclassing | more complex; interfaces + multiple factories |
| Flexibility | changes require modifying the factory method | whole families swapped WITHOUT changing client code |

c) (6m) Diagram (2m: private static instance + private constructor + public static accessor):
```
 +--------------------------------------+
 |          ExamConfigManager           |
 +--------------------------------------+
 | -_instance: ExamConfigManager {static}
 | -_lock: object {static, readonly}    |
 | -_settings: Dictionary<string,string>|
 +--------------------------------------+
 | -ExamConfigManager()                 |   <- private constructor
 | +GetInstance(): ExamConfigManager {static}
 | +GetSetting(key: string): string     |
 | +SetSetting(key,value): void         |
 +--------------------------------------+
```
Code (4m: private ctor 1m, lock + lazy null-check 1m, static instance+accessor 1m, working setting methods/syntax 1m):
```csharp
public class ExamConfigManager {
    private static ExamConfigManager _instance;
    private static readonly object _lock = new object();
    private Dictionary<string, string> _settings = new();

    private ExamConfigManager() { }

    public static ExamConfigManager GetInstance() {
        lock (_lock) {
            if (_instance == null)
                _instance = new ExamConfigManager();   // lazy, created on first use
        }
        return _instance;
    }
    public string GetSetting(string key) =>
        _settings.ContainsKey(key) ? _settings[key] : null;
    public void SetSetting(string key, string value) => _settings[key] = value;
}
```

### Question 2 (16m)
a) (4m) GoF intent (2m, near-verbatim): *"Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically."* MVC link (2m): in MVC the VIEWS are observers of the MODEL — when model data changes it notifies all registered views, which refresh automatically; this keeps multiple synchronized views consistent without the model knowing any view's concrete class (and lets views be added/removed freely — modifiability/usability).

b) (8m) This is the Composite pattern's diagram. Model code:
```csharp
public abstract class StorageItem {                       // Component (2m: abstract class
    public abstract int GetSizeKB();                      //  + abstract method)
    public virtual void Add(StorageItem item) {           // (1m: virtual default throws)
        throw new NotImplementedException("Add is not supported by this item.");
    }
}
public class FileItem : StorageItem {                     // Leaf (2m: field private,
    private int sizeKB;                                   //  ctor, override)
    public FileItem(int s) { sizeKB = s; }
    public override int GetSizeKB() => sizeKB;
}
public class FolderItem : StorageItem {                   // Composite (3m: List field,
    private List<StorageItem> children = new List<StorageItem>();   // Add override,
    public override void Add(StorageItem item) => children.Add(item);
    public override int GetSizeKB() {                     //  recursive sum)
        int total = 0;
        foreach (var c in children) total += c.GetSizeKB();
        return total;
    }
}
```
Marking: abstract component + abstract op (2), virtual Add default (1), leaf correct (2), composite list+Add (1), recursive aggregation loop (1), compilable syntax incl. visibility (1).

c) (4m — steps 1m each + participants 1m)
1. **Identify the source and destination interfaces** that need adapting — the **Target** (what clients expect) and the **Adaptee** (the existing incompatible class).
2. **Add an Adapter class that REALIZES the Target interface and implements it in terms of the Adaptee** — realization relationship Adapter→Target, association Adapter→Adaptee.
3. **Use Adapter objects wherever Target objects are expected** in the new system.

### Question 3 (16m)
a) (4m — 1m each component + activity)
**Planning** — scoping (WBS, budgeting) and organizing (LRC, Gantt scheduling); plan to finish within schedule/budget. **Execution/Implementation** — monitoring & controlling against the plan using Gantt + EVM; most effort and deliverables occur here. **Termination** — verify smooth transition to construction: store latest design docs per configuration management, update schedule/cost values, re-evaluate plans, communicate to upper management. **Leadership & Ethics** — ethical, effective leading that conditions the success of every stage.

b) (8m — 1m per parameter with formula, 2m interpretation)
- % complete = 1/5 = 20% → **EV = 0.20 × 15,000 = RM3,000**
- **PV** = 3 months planned = 3 × 3,000 = **RM9,000**
- **AC = RM4,500**
- **SV = EV − PV = 3,000 − 9,000 = −RM6,000** (behind schedule)
- **CV = EV − AC = 3,000 − 4,500 = −RM1,500** (over budget)
- **SPI = EV/PV = 3,000/9,000 = 0.33**
- **CPI = EV/AC = 3,000/4,500 = 0.667**
- **EAC = AC + (BAC−EV)/CPI = 4,500 + 12,000/0.667 = 4,500 + 18,000 = RM22,500** (= BAC/CPI)
Interpretation: the project is critically behind schedule (SPI 0.33 — one-third of planned progress) and over budget (CPI 0.667 — RM0.67 earned per ringgit spent); if performance continues, completion will cost ≈RM22,500, RM7,500 over budget. Management must apply risk mitigation immediately (re-plan, add/redeploy resources, or re-scope) to recover the budgeted path or minimize losses.

c) (4m) π count: `if (hours > 2 && hours <= 8)` compound = **2**; `for` = **1**; `switch` 3 branches = 3−1 = **2**; `if (student)` = **1** → π = 6 → **C = 7**. Threshold: 7 ≤ 10 → **acceptable** by McCabe's guideline. (3m counting with shown work, 1m threshold judgment.)

## SECTION C (32m)

a) (2m) **Microservices architecture** — the platform is a large distributed system whose features are owned by independent teams needing independent deployment, scaling, and fault isolation. (1m style + 1m one-line tie to scenario. Award 1m max for SOA/layered with reasonable defense — but microservices matches "independent release" + "partial failure" directly.)

b) (4m — 1m per quality attribute mapped)
- **Scalability:** each service (Booking, Video-Consultation, ...) scales horizontally and independently; video sessions can scale without scaling billing.
- **Availability:** fault isolation — Pharmacy/Notification are separate services; their failure does not bring down Booking/Consultation (core path keeps serving).
- **Modifiability:** new payment providers/notification channels are added inside (or as) services behind stable interfaces; one team's change does not force redeploying others — deployment independence.
- **Performance:** independent resource allocation + caching/CDN per service keeps booking responsive and consultation setup low-latency; load distributed across services.

c) (8m) Expected diagram (component or class notation accepted; must reflect scenario modules):
```
                          [ API Gateway ]
        ┌──────────┬───────────┼────────────┬──────────────┐
 [Booking      ] [VideoConsult] [Billing   ] [Pharmacy   ] [Notification ]
 [Service      ] [Service     ] [Service   ] [Service    ] [Service      ]
 +Book()         +StartSession() +Pay()       +Dispense()    +Notify()
 +Reschedule()   +EndSession()   +Refund()    +CheckStock()  +Register()
        │              │              │             │              │
   (own DB)       (own media     (provider     (own DB)      (channel
                   servers)       plugins)                    adapters)
   — services communicate via REST/event bus; each independently deployable —
```
Marking: one component per named module (3), gateway or inter-service communication shown (2), independent data/deployability indicated (1), correct UML component/class notation with operations (2).

d) (2m) Behavior 1 → **OCP and LSP** (1m). Behavior 2 → **Observer pattern** (1m).

e) (4m)
- **OCP (1m):** "add new payment providers... WITHOUT ALTERING the existing billing engine logic" = open for extension, closed for modification — new providers plug in as new classes against an abstraction.
- **LSP (1m):** "any provider subclass can REPLACE another WHILE PRESERVING the expected behavior and interface" = subtypes substitutable for their base without affecting correctness (signature + methods rules).
- **Observer (2m):** "all registered channels... must be NOTIFIED AND UPDATED AUTOMATICALLY" on a status change, "WITHOUT the appointment object knowing their concrete classes" = the GoF one-to-many dependency with automatic notification; channels are observers registered (Attach) with the appointment subject.

f) (6m) Two diagrams (or one combined):
```
 BILLING (OCP+LSP):                         NOTIFICATION (Observer):
        <<interface>>                        [Appointment]                <<interface>>
      IPaymentProvider                       -observers: List<IChannel>   IChannel
      +ProcessPayment(amt): Receipt          -status: string              +Update(appt)
       ^         ^          ^                +Attach(c) +Detach(c)          ^    ^    ^
 [FPXProvider][CardProvider][EWalletProvider]+Notify()                 [MobileApp][SmsGateway]
       (identical signatures — LSP)          status setter → Notify()  [EmailService][DoctorDashboard]
 [BillingEngine] ──> IPaymentProvider
 +Charge(IPaymentProvider p, amt)   (depends ONLY on the abstraction — closed)
```
Marking: interface + 3 providers + closed engine (3); subject with observer list, Attach/Notify, IChannel.Update + ≥2 concrete channels (3).

g) (6m) Model code:
```csharp
// ---- Billing: OCP + LSP ----
public interface IPaymentProvider {
    Receipt ProcessPayment(double amount);          // same contract for all (LSP)
}
public class FpxProvider : IPaymentProvider {
    public Receipt ProcessPayment(double amount) {
        Console.WriteLine("FPX payment: " + amount);
        return new Receipt("FPX", amount);
    }
}
public class CardProvider : IPaymentProvider {
    public Receipt ProcessPayment(double amount) {
        Console.WriteLine("Card payment: " + amount);
        return new Receipt("CARD", amount);
    }
}
public class BillingEngine {                         // CLOSED: new providers never change it
    public Receipt Charge(IPaymentProvider provider, double amount)
        => provider.ProcessPayment(amount);
}

// ---- Notification: Observer ----
public interface IChannel { void Update(Appointment appt); }

public class Appointment {                           // Subject
    private List<IChannel> _channels = new List<IChannel>();
    private string _status;
    public void Attach(IChannel c) => _channels.Add(c);
    public void Detach(IChannel c) => _channels.Remove(c);
    public string Status {
        get => _status;
        set { if (_status != value) { _status = value; Notify(); } }
    }
    private void Notify() {
        foreach (IChannel c in _channels) c.Update(this);
    }
}
public class MobileApp : IChannel {
    public void Update(Appointment a) => Console.WriteLine("App push: " + a.Status);
}
public class SmsGateway : IChannel {
    public void Update(Appointment a) => Console.WriteLine("SMS: " + a.Status);
}
// Usage: appt.Attach(new MobileApp()); appt.Attach(new SmsGateway());
//        appt.Status = "Rescheduled";   // all channels notified automatically
```
Marking: provider interface + ≥2 implementations (1½), closed BillingEngine via abstraction (1), subject with list/Attach/Notify in setter (1½), IChannel + ≥2 observers (1), compilable C#/Java syntax throughout (1).

---

## MARK DISTRIBUTION AUDIT
Ch1–4: ~16 marks (A8, A9, A10, parts of C-a/b/c) · Ch5: ~10 (A1, C-d/e/f/g share) · Ch6: ~12 (A2, A3, B1) · Ch7: ~22 (A4, A5, B2, C Observer share) · Ch8: ~8 (A6, B3c) · Ch9: ~14 (A7, B3a/b) — cumulative, weighted to Ch5–9 ≈ 66%, exactly per scope prediction.

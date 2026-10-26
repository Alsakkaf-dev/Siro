# ANSWERS — Drill CH1–4 Foundations

**Q1. B** — Architecture's distinctive focus is non-functional/quality requirements; detailed design picks up the functional requirements (Ch1 design-process slide).

**Q2. C — Content coupling.** The module relies on/modifies another module's INTERNALS — the most severe coupling type. (Common = shared globals; Data = parameters only, the acceptable kind.)

**Q3. B — Blackboard.** Signals: independent knowledge sources, shared central data (working dataset), controller/mediator, opportunistic (no fixed sequence), expert-system domain. Pipes-and-filters would need a fixed sequential transformation; client-server has no collaborative solving; layered is hierarchical separation.

**Q4. B.** `<<include>>` = MANDATORY inclusion: the included use case must execute whenever the base executes. (A describes `<<extend>>`; C is generalization.)

---

**Q5.** Any THREE, ~2 marks each (name + description with consequence):
1. **Requirements (volatility):** requirements change mid-project (customers "want a bigger house with more windows by next week"); designs must absorb change or rework explodes.
2. **Processes (inconsistency):** most companies lack a well-defined development process, so design activities and quality vary unpredictably between projects/teams.
3. **Technology (fast-changing):** technology evolves rapidly and old/new tech must co-exist; chosen stacks can become obsolete during the project.
4. **Ethics:** maintaining ethical and professional practice under tight schedules and negotiation pressure (e.g., not hiding known design flaws).
5. **Management (of design influences):** many stakeholders push competing concerns (performance vs security vs usability); the designer must reach beyond the technical domain and understand the organization as a whole.

**Q6.** (6 marks)
- **Relationship (3m):** Coupling measures interdependence BETWEEN modules; cohesion measures how related the tasks WITHIN one module are. They are complementary: good design = LOW coupling + HIGH cohesion. They reinforce each other — a module focused on a single well-defined task (high cohesion) naturally needs fewer connections into other modules' internals (low coupling). High coupling + low cohesion means responsibilities are smeared across modules, so any change ripples system-wide → poor maintainability/reusability.
- **Strategy + justification (3m):** Refactor by re-modularization guided by abstraction and encapsulation: decompose modules so each performs one well-defined responsibility (raises cohesion to functional cohesion), hide internals behind stable interfaces, and restrict inter-module communication to parameters/interfaces (reduces content/common coupling to data coupling). Justification: changes become localized behind interfaces, improving maintainability and enabling reuse of the now-independent modules. (Also acceptable: apply separation of interface and implementation / layering.)

**Q7.** (4 marks)
- **Structural diagrams** — capture the STATIC aspects (elements and their interrelationships). Examples: Class diagram, Component diagram (also Object, Deployment, Package).
- **Behavioral diagrams** — capture the DYNAMIC aspects (behavior, interactions over time). Examples: Use Case diagram, Sequence diagram (also Activity, State Machine, Communication).
(1 mark per category name + aspect, 1 mark per pair of examples.)

**Q8.** (4 marks, 1 each)
1. **Association** — the Customer actor communicates with/executes the Transfer Funds use case.
2. **<<include>>** — MANDATORY: every execution of Transfer Funds must execute Verify OTP (base points to included).
3. **<<extend>>** — OPTIONAL: Convert Currency MAY extend Transfer Funds (runs only when its condition applies, e.g., foreign-currency transfer); arrow points from extension to base.
4. **Generalization (actor)** — Premium Customer is a specialization of Customer; inherits all of Customer's associations.

**Q9.** (8 marks) C# model answer:
```csharp
public abstract class Payment {
    protected double amount;                       // '#' => protected
    public Payment(double amount) { this.amount = amount; }
    public abstract void Process();                // {abstract} => abstract method
}

public class CardPayment : Payment {               // generalization => inheritance
    private string cardNo;                         // '-' => private
    public CardPayment(double amount, string cardNo) : base(amount) {
        this.cardNo = cardNo;
    }
    public override void Process() {
        Console.WriteLine("Processing card payment of " + amount);
    }
}

public class CashPayment : Payment {
    public CashPayment(double amount) : base(amount) { }
    public override void Process() {
        Console.WriteLine("Processing cash payment of " + amount);
    }
}

public class Invoice {
    private int invoiceId;
    private double total;
    private List<Payment> payments = new List<Payment>();   // 1..* association => collection
    public Invoice(int id) { invoiceId = id; }
    public void AddPayment(Payment p) {
        payments.Add(p);
        total += 0;        // (update logic acceptable; key is the collection + method)
        p.Process();
    }
}
```
Marking: abstract class + abstract method (2), inheritance with base-constructor chaining (2), visibilities translated (- private / # protected / + public) (2), association as `List<Payment>` field + method signature (1), compilable syntax (1).

**Q10.** (10 marks — 2 per view: objective + diagrams + stakeholders)
| View | Objective | Diagrams | Stakeholders |
|---|---|---|---|
| **Logical** | Functional structure — decompose the system into logical components/classes that deliver functionality | Component, Class | End users (functionality), analysts/designers |
| **Process** | Runtime behavior — concurrency, synchronization, interactions, performance | Sequence, Communication | Integrators, performance engineers |
| **Development** | Code organization — modules/packages, team work assignment, build structure | Module/Package | Programmers, software managers |
| **Physical** | Deployment — mapping software to hardware nodes/networks; scalability, availability | Deployment, Infrastructure | System engineers, operators/DevOps |
| **User view / Scenarios (+1)** | Use cases that tie the four views together; validate the architecture against required behavior | Use case diagrams & scenarios | All stakeholders, especially customers/end users |
Add the rationale sentence: each view isolates one stakeholder concern that cannot be evaluated in the others; scenarios are the "+1" because they cut across and validate all four.

**Q11.**
(a) Any THREE (1m each, definition required): **Usability** — complexity involved in learning/using the system; **Modifiability** — complexity of changing the system for current/future needs; **Security** — ability to protect and defend information/system; **Performance** — capacity to do useful work under time/resource constraints; **Reliability** — failure rate; **Availability** — uptime; **Portability** — complexity of adapting to other environments; **Testability** — complexity of verifying/validating functions; **Interoperability** — ability to collaborate with other systems.
(b) Any THREE (1m each): identify **stakeholders' concerns**; select **appropriate architectural representations/views**; manage **influences of architectural decisions** (on organization & quality); design **major components and their interfaces**; **evaluate and validate** the architecture (long, iterative); maintain **design synchronicity** (implementation reflects design).

**Q12.**
(a) (2m) **Microservices architecture** — a distributed, feature-modular platform needing independent deployment, scaling, and fault isolation.
(b) (4m) map each requirement:
- *Millions of concurrent requests* → each service scales horizontally and independently (matching service scaled separately from payments at peak).
- *Independent team updates without full redeploy* → services are independently deployable units behind stable interfaces; pricing can be released without touching matching/payment (deployment independence — the defining criterion).
- *Survive loyalty-module crash* → fault isolation: loyalty is a separate service; core ride-request path (matching, payment) keeps operating (availability).
(c) (6m) Expected sketch:
```
                 [ API Gateway ]
       /        |         |        \         \
 [RideRequest] [Matching] [Pricing] [Payment] [LoyaltyPoints]
   Service      Service    Service   Service    Service
       \          |          |         |          /
        (each owns its own data store; communicate via APIs/events)
```
Marks: one component per scenario module (3), gateway/communication shown (1), independent data/deployment implied (1), correct UML-ish notation labels (1).

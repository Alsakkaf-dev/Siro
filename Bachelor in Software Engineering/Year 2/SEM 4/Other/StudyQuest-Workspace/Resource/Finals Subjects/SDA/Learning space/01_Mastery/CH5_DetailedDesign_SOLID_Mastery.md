# CH5 — Principles of Detailed Design + SOLID (OCP, LSP, ISP focus)
**Source:** Chapter 5.pptx (new) + old Sessions I–II + Robert Martin's lsp.pdf & isp.pdf (provided by the lecturer — he WANTS the Square/Rectangle and Door/TimerClient examples). The midterm already tested OCP twice in MCQs and OCP+LSP in Section C parts (d)–(g). Expect this chapter in the final at FULL weight: spot-the-principle, justify, draw class diagram, write code.

---

## 0. Chapter Mental Model

Architecture drew the big boxes; detailed design goes INSIDE each box, down to classes, and hands construction a design "sufficiently complete to be implemented." The big idea of the whole chapter: **designs must evolve gracefully** — and the SOLID principles are the rules that make class-level designs modifiable without breaking. The exam's mapping reflex you must build:

- "add new types WITHOUT modifying existing code" → **OCP**
- "subclass can REPLACE parent while preserving behavior" → **LSP**
- "class forced to implement methods it doesn't use / fat interface" → **ISP**
- "class has more than one reason to change" → **SRP**
- "high-level module depends on concrete details instead of abstraction" → **DIP**

---

## 1. What is Detailed Design?

**IEEE definition (adapted by his slides):** "The process of refining and expanding the software architecture of a system or component to the extent that the design is **sufficiently complete to be implemented**." Macro-design → **micro-design**: decompose components into fine-grained elements, functions, data variables.

Clements: "**Architecture is design, but not all design is architecture**" — architecture establishes constraints; downstream artifacts must comply, but architecture does not define an implementation. **Architecture bridges requirements→design; detailed design bridges design→code.** Detailed design is the **gatekeeper**: where most problem-solving happens (architecture defers complexity to it via abstraction); ensures specification + design are complete before construction.

**Designer's mental model (slide):** given requirements+architecture → produce code; given code → **reverse engineer** detailed/architectural designs; starting in the middle → produce both. Industry tools essential (modeling, code generation, reverse engineering, SCM).

**Architectural vs Detailed Design (his table — learn as-is):**
| Aspect | Architectural Design (Style) | Detailed Design (Pattern) |
|---|---|---|
| Scope | High-level system structures | Specifics of individual components |
| Abstraction level | Conceptual | Concrete |
| Granularity | Large-scale components & interactions | Finer-grained: algorithms, data structures |
| Decision making | Strategic (system organization) | Tactical (implementation details) |
| Focus | Performance, scalability, flexibility | Functionality & efficiency of modules |
| Documentation | System architecture, interfaces, interactions | Detailed decisions, data structures, algorithms |

---

## 2. Key Tasks in Detailed Design (5 — mirror of architecture's tasks)

1. **Understanding the architecture and requirements** — focus on requirements **allocated to your specific component** (unlike architecture which sees ALL requirements); components are allocated to teams; designers may DERIVE new requirements and impose them on the component's implementation.
2. **Creating the design** — structural + behavioral designs; focus areas: **Interface design** (internal within components, external across components — e.g., message format specs, Interface Design Document), **GUI design** (continuation from architecture), **Internal component design** (structural + behavioral), **Data design**.
3. **Evaluating the design** — **static techniques** (no execution — software doesn't exist yet); main tool = **Internal Technical Review**: send notice early, include a technical expert + stakeholders + SQA/testing member, focus on how the design meets functional & non-functional requirements, document the review.
4. **Documenting the Software Design Document (SDD)** — record structural/behavioral models and decisions.
5. **Managing & monitoring implementation** — keep Architecture → Detailed Design → Code synchronized (design synchronicity from Ch3).

---

## 3. Internal/External Component Design — the OO toolkit (his 4 concepts)

| Concept | His definition | Why it matters for SOLID |
|---|---|---|
| **Classes & Objects** | Objects are instances of classes representing real-world entities with specific characteristics (state) and behaviors | The unit of detailed design |
| **Interfaces, Types, Subtypes** | Interfaces define a **contract** for classes to implement specific methods; subtypes inherit properties/behaviors from parent types or interfaces | Contracts are what OCP/LSP/ISP regulate |
| **Dynamic Binding** | Method calls **resolved at runtime** | Lets client code call `character.Move()` and get the right subtype behavior |
| **Polymorphism** | Objects of different classes treated as objects of a **common superclass** | The mechanism that makes OCP-compliant designs possible |

Component design = defining internal data structures, algorithms, interface details, communication mechanisms. These models are the **most significant mechanism for determining functional correctness before construction** (evaluate alternatives before coding). Process chain (his slide): Architect designs component → Engineer designs class(es) to realize it → code generated from class spec → compiled binary → executed.

---

## 4. THE SOLID PRINCIPLES

### 4.1 SRP — Single Responsibility Principle
**"A well-designed class should have one (and only one) reason to change."** (his ISP slide states this).
- **Violation:** `Report` class that computes data AND formats HTML AND saves to disk — three reasons to change.
- **Fix:** split into `ReportCalculator`, `ReportFormatter`, `ReportSaver`.
- **Exam cue:** "the class handles X and also Y and Z" → SRP. (Sample MCQ #9 used SRP as a distractor for an OCP scenario — know the difference: SRP is about ONE class doing too much; OCP is about modifying vs extending.)

### 4.2 OCP — Open-Closed Principle (Bertrand Meyer)
**"Software entities should be OPEN for extension but CLOSED for modification."** New features = ADD new code; old working code stays untouched. Not contradictory: modifications happen BY ADDING code that plugs in, not by editing what works. Achieved through **abstraction, encapsulation, inheritance/polymorphism** (program against an abstract Character; concrete types plug in).

**His slide story (gaming system) — the canonical violation→fix:**
Violation (type-checking client):
```csharp
// OLD DESIGN — VIOLATES OCP
public class GameEngine {
    public void Add(object character) {
        if (character is TerrestrialCharacter t) { t.Run(); }
        else if (character is AerialCharacter a) { a.Fly(); }
        // Adding AquaticCharacter => MODIFY this working code. Violation!
    }
}
```
Why naive fails: every new character type forces edits to GameEngine (and getType()/if-else chains breed everywhere); ripple risk on working code.
Fix (abstraction + polymorphism — encapsulate the MOVEMENT behavior so one call works for all):
```csharp
public interface ICharacter {            // abstraction = the contract
    void Draw();
    void Move();                         // encapsulated movement behavior
}
public class TerrestrialCharacter : ICharacter {
    public void Draw() { /* ... */ }
    public void Move() { Run(); }
    private void Run() { /* land logic */ }
}
public class AerialCharacter : ICharacter {
    public void Draw() { /* ... */ }
    public void Move() { Fly(); }
    private void Fly() { /* flight logic */ }
}
public class AquaticCharacter : ICharacter {   // NEW: added by EXTENSION
    public void Draw() { /* ... */ }
    public void Move() { Swim(); }
    private void Swim() { /* water logic */ }
}
public class GameEngine {                // CLOSED: never changes again
    public void Activate(ICharacter c) { c.Draw(); c.Move(); }
}
```
```
            <<interface>>
             ICharacter
           + Draw() + Move()
            /     |      \
 Terrestrial  Aerial   Aquatic     [GameEngine] ----> ICharacter
 Character    Character Character        (depends only on abstraction)
```
**Final note from his slide:** no design is 100% closed. OCP = locate the areas **likely to vary**, encapsulate the variation, implement via polymorphism (strategic closure).
- **Exam cues:** "new payment method added by extending abstract Payment class, not modifying old code" = OCP (sample MCQ #9). "Adding new report formats requires MODIFYING existing classes" = OCP **violation** (sample MCQ #10). Section C: "new encoding algorithms can be added without modifying engine code" → answer OCP, draw interface + implementors + closed client, then write the code.

### 4.3 LSP — Liskov Substitution Principle (Barbara Liskov)
**Slide definition:** "Objects of a superclass should be replaceable with objects of a subclass **without affecting the correctness** of the program."
Martin's paraphrase (from his lsp.pdf): **"Functions that use pointers or references to base classes must be able to use objects of derived classes WITHOUT KNOWING IT."**
Pressman phrasing on his slide: a derived class must **honor any implied contract** between the base class and the components that use it. LSP violation ⇒ client must type-check ⇒ OCP violation too (the two principles chain).

**The two rules (HIS slides — likely direct question):**
- **Signature Rule:** subtype keeps the same method signatures, so a program type-correct against the supertype stays type-correct against the subtype (e.g., `draw()`/`move()` identical between supertype and subtype).
- **Methods Rule:** reasoning about supertype method calls stays valid when a subtype actually runs:
  - Subtype may **WEAKEN preconditions** (require LESS, never more).
  - Subtype may **STRENGTHEN postconditions** (deliver MORE, never less).
  - Maintain behavioral consistency (invariants).

**Violation example 1 — type-test dispatch (lsp.pdf):**
```csharp
void DrawShape(Shape s) {
    if (s is Square sq) DrawSquare(sq);       // must know EVERY derivative;
    else if (s is Circle c) DrawCircle(c);    // changes with each new Shape
}   // violates LSP (and therefore OCP)
```
**Violation example 2 — Square : Rectangle (THE classic, in his provided paper AND his new slide table):**
```csharp
public class Rectangle {
    public virtual void SetWidth(double w)  { width = w; }
    public virtual void SetHeight(double h) { height = h; }
    public double GetArea() => width * height;
    protected double width, height;
}
public class Square : Rectangle {            // "a square IS-A rectangle"... or is it?
    public override void SetWidth(double w)  { width = w; height = w; }
    public override void SetHeight(double h) { width = h; height = h; }
}
// Client written against Rectangle:
void G(Rectangle r) {
    r.SetWidth(5); r.SetHeight(4);
    Debug.Assert(r.GetArea() == 20);   // PASSES for Rectangle, FAILS (16) for Square
}
```
Why it fails: client G reasonably assumes setting width leaves height unchanged (Rectangle's implied contract). Square breaks that assumption — *a model can be self-consistent yet inconsistent with its users' expectations*. ISA in BEHAVIOR, not in real-world language, decides inheritance.
**Fix options:** don't derive Square from Rectangle — both implement `IShape { GetArea(); }`; or make them immutable value types; in the exam, state: "Square must not subclass mutable Rectangle because it strengthens the precondition/violates the invariant clients rely on."
- **Exam cues:** "each encoder subclass (H264, H265, AV1) can replace another while preserving expected behavior and interface" = LSP (this EXACT wording was the sample's Section C behavior #2). "Subclass throws NotSupportedException for an inherited method" = LSP violation.

### 4.4 ISP — Interface Segregation Principle (Robert Martin)
**Slide definition:** "Clients should not be forced to depend on methods that they do not use." **Many client-specific interfaces are better than one general-purpose interface.** Smaller, specific interfaces are easier to maintain/reuse and **lead to easier adherence to OCP and LSP**.

**His gaming example:** an advanced enemy can roam land, fly, AND swim; other enemies do only one. Naive design = one **bloated interface**:
```csharp
public interface IEnemyCharacter {        // FAT / BLOATED interface
    void Walk(); void Fly(); void Swim();
}
public class GroundEnemy : IEnemyCharacter {
    public void Walk() { /* ok */ }
    public void Fly()  { throw new NotImplementedException(); }  // forced junk
    public void Swim() { throw new NotImplementedException(); }  // (also LSP risk!)
}
```
Fix — segregate by client need; compose for the advanced enemy:
```csharp
public interface IWalker { void Walk(); }
public interface IFlyer  { void Fly();  }
public interface ISwimmer{ void Swim(); }
public class GroundEnemy : IWalker { public void Walk() { } }
public class AdvancedEnemy : IWalker, IFlyer, ISwimmer {
    public void Walk() { } public void Fly() { } public void Swim() { }
}
```
**Martin's Door/TimedDoor case (isp.pdf — he distributed it, so quotable):** `Door {Lock, Unlock, IsDoorOpen}`; `TimedDoor` needs timer alarms; naive fix makes `Door` inherit `TimerClient {TimeOut()}` → **interface pollution**: ALL doors now depend on timing; timing-free doors implement nil `TimeOut()`s; every new subclass need pollutes the base further, making it "fat" — and nil implementations violate LSP. Rule: **separate clients ⇒ separate interfaces** (Timer uses TimerClient; door-users use Door). Solutions: multiple inheritance of the two interfaces by TimedDoor, or an adapter object.
- **Exam cues:** "implements methods it never uses," "one giant interface IMachine{Print,Scan,Fax} but BasicPrinter only prints," "changes to unused methods force recompilation of clients."

### 4.5 DIP — Dependency Inversion Principle (named in his old slides' principle list + isp.pdf intro)
**"High-level modules (policy) should not depend on low-level modules (details). Both should depend on ABSTRACTIONS."** Abstract classes shouldn't depend on concrete; concrete should depend on abstract. Example from isp.pdf intro: Template Method — high-level algorithm in an abstract base calls abstract operations implemented by derived classes, so details depend on the abstraction.
```csharp
// Violation: high-level depends on concrete detail
public class NotificationService { private EmailSender sender = new EmailSender(); }
// Fix: both depend on abstraction; inject the detail
public interface IMessageSender { void Send(string msg); }
public class EmailSender : IMessageSender { public void Send(string m){ } }
public class SmsSender   : IMessageSender { public void Send(string m){ } }
public class NotificationService {
    private readonly IMessageSender sender;
    public NotificationService(IMessageSender s) { sender = s; }   // injected
    public void Notify(string m) => sender.Send(m);
}
```
- **Exam cues:** "depends on abstraction not concretion," "constructor injection," "swap database/sender without touching business logic." (Sample MCQ #9 used DIP as a distractor.)

---

## 5. How SOLID is Tested (decoder for the professor's wording)

| Exam wording | Principle |
|---|---|
| "extend... instead of modifying the old code" | OCP applied |
| "adding new formats REQUIRES MODIFYING existing classes" | OCP violated |
| "subclass can replace another while preserving expected behavior and interface" | LSP |
| "designed for extension — add new algorithms without altering existing engine logic" | OCP (often paired with LSP in the same scenario) |
| "clients forced to depend on methods they do not use" | ISP |
| "one class, one reason to change" | SRP |
| "depend upon abstractions, not concretions" | DIP |

**Section C drill (parts d–g of the sample = 18 marks):** (d) NAME the principles the behaviors describe (OCP + LSP, 1 line each). (e) Justify: quote the behavior phrase → map to the principle's definition → state the benefit (modifiability/substitutability). (f) Class diagram: interface/abstract base at top (e.g., `IVideoEncoder {Encode()}`), concrete subtypes below realizing it, client (RecommendationEngine/PlaybackEngine) depending ONLY on the abstraction. (g) Code: write the interface, 2–3 implementors, and the closed client exactly as drawn.

---

## 6. Likely Exam Questions

1. *MCQ:* which principle is applied/violated in a one-line scenario (OCP, LSP, SRP, DIP rotations).
2. *Define OCP and LSP and differentiate them* (his slide-8 table: definition/focus/objective/implementation/example).
3. *Spot the violation in given code + redesign + redraw class diagram* (the drills file trains this).
4. *State the LSP Signature Rule and Methods Rule* (weaken pre, strengthen post).
5. *Explain interface pollution and how ISP solves it* (Door/TimerClient or bloated enemy interface).
6. *List the key tasks of detailed design* / *contrast architectural vs detailed design.*
7. *Define dynamic binding and polymorphism* (component design MCQs).
8. *Scenario→principles→diagram→code* (Section C, guaranteed-style).

---

## 7. Top Traps

1. **OCP "closed" ≠ frozen code** — it means change BY ADDING, not editing; and no design is 100% closed (his slide says so — quote it for nuance marks).
2. **LSP Methods Rule direction:** preconditions WEAKEN, postconditions STRENGTHEN in subtypes. Flipping this is the #1 LSP error.
3. Square/Rectangle: the violation appears only because Rectangle is **mutable** and clients assume independent width/height — "a square is a rectangle in math" is NOT a counterargument; behavioral substitutability decides.
4. Throwing `NotImplementedException` in a subtype = **LSP violation symptom caused by an ISP violation** — name both for full marks.
5. SRP vs ISP: SRP = one CLASS, one reason to change; ISP = one INTERFACE per client need. Don't swap.
6. DIP ≠ dependency injection. DIP is the PRINCIPLE (depend on abstractions); injection is one technique to satisfy it.
7. `is`/`typeid`/`getType()` checks in client code = the smell of OCP+LSP violation — say "replace type-testing with polymorphism (dynamic binding)."
8. Detailed-design evaluation is **STATIC** (technical reviews) — there is no code to execute yet.
9. In detailed design you see only requirements **allocated to your component**, not the whole set (contrast with architecture).
10. ISP helps OCP and LSP (his slide links them) — mentioning that chain earns synthesis marks.

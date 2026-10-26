# CH2 — UML (Behavioral + Structural Modeling)
**Source:** SDA (S2).pdf (new) + Ch2 old Sessions I–III (supplements). The midterm sample dedicated a FULL 16-mark question to UML (categories, use-case relationships, class-diagram→code) AND 14 marks of class-diagram drawing/coding in Section C. UML = the professor's favorite practical skill. Master diagram→code both directions.

---

## 0. Chapter Mental Model

UML is the **shared language** of design. Stakeholders speak different languages (his slide: "I want security!" / "Quiero facilidad de uso!"); UML unifies communication. Formally: **a visual language for specifying, analyzing, and documenting design elements essential for modeling the dynamic and static aspects of software systems before construction.**

Everything splits in two — and the exam ALWAYS tests this split:
- **Structural diagrams** = STATIC aspects (what the system IS): class, component, object, deployment, package.
- **Behavioral diagrams** = DYNAMIC aspects (what the system DOES): use case, sequence, communication, state machine, activity.

(Sample MCQ #3: class diagram = structure. MCQ #4: behavioral = dynamic, structural = static. Sample Q2a: name the TWO categories + example each.)

---

## 1. UML Fundamentals

- History: unification of **Booch method (Grady Booch) + OOSE (Ivar Jacobson) + OMT (James Rumbaugh)** → UML 1.0/1.1 accepted by OMG → UML 2.x. UML 2.3 has **14 diagram types**.
- Goals of unification: model systems concept→executable artifact with OO techniques; address scale in complex mission-critical systems; a language usable by humans AND machines.
- Not all diagrams are used in every project — designers pick what helps.

**Building blocks (3 groups):**
1. **Classifiers** — structural things, the main elements: Use Case (ellipse), Component (box + <<component>>), Class (rectangle with compartments), Active Class (double side-lines; owns independent flow of control), Interface (stereotyped class or ball-and-socket), Node (cube; physical computational resource), Artifact (rectangle + <<artifact>>; physical deployable info: .dll/.exe/.jar/script).
2. **Relationships** — Dependency (dashed line, stick arrow: change in one affects the other), Association (solid line: connection exists; can be directed), Generalization (solid line + HOLLOW triangle arrowhead: child inherits parent), Realization (DASHED line + hollow arrowhead: element realizes an interface).
3. **Enhancing features** — Notes (dog-eared rectangle, dashed connector), Stereotypes (<<...>> create semantically new elements), Tagged values ({property = value} on stereotypes), Constraints ({constraint description}).

**Why UML matters (summary slide):** common language for analysis/evaluation/specification; models transfer downstream; main tool for knowledge transfer among stakeholders; enables visualization of complex systems → better problem solving; enhances design documents and reuse.

---

## 2. The Two Categories (Q2a answer, 4 marks)

| Category | Concern | Diagrams (know all, cite 1–2 as examples) |
|---|---|---|
| **Structural** | Static elements + interrelationships supporting the solution | **Class**, **Component**, Object (snapshot of object at runtime: state + attribute values), Deployment (physical realization: nodes, artifacts), Package (decomposition into packages); also Composite Structure, Profile |
| **Behavioral** | Dynamic behavior, complexities of behavior | **Use Case**, **Sequence** (time-order of messages), Communication (structural order of message exchange), State Machine (discrete states + transitions), Activity (flows: conditionals, repetition, concurrency, parallel execution — business workflow→code level); also Timing, Interaction Overview |

One-line definitions (memorize verbatim-ish):
- **Use Case D.** — capture, specify, visualize **required system behavior** (= requirements!).
- **Sequence D.** — interactions with emphasis on **time-order sequence of messages**.
- **Communication D.** — interactions with emphasis on **structural order of entities** participating.
- **State Machine D.** — behavior as **discrete states and transitions** between them.
- **Activity D.** — behavior with conditionals, repetition, concurrency; many abstraction levels.
- **Class D.** — set of classes: operations, attributes, relationships.
- **Component D.** — software as components connected through **well-defined interfaces**.
- **Object D.** — instant snapshot of an object's life during execution.
- **Deployment D.** — physical realization: nodes, interfaces between nodes, artifacts, manifestation of components.
- **Package D.** — decomposition into packages + their relationships.

---

## 3. Use Case Diagrams (sample Q2b tested ALL the relationship connectors)

**Elements:** Actors (users OR other systems interacting with the subject — operators, sensors, client computers), Use cases (ellipses = required behavior, technology-free so all stakeholders can reason), System boundary (optional rectangle = the subject).

**The four relationship connectors — THE 4-mark answer:**
```
  Actor ───────── (Use Case)          Association: actor communicates with /
                                      executes the use case

  (Use Case A) ---<<include>>---> (Use Case B)
      B MUST be executed when A executes (MANDATORY inclusion).
      "A requires the behavior of B."  e.g. Cancel Course includes Authenticate User.

  (Use Case A) ---<<extend>>----> (Use Case B)
      A optionally extends B: A's behavior MAY run when B executes
      (OPTIONAL inclusion). e.g. Search Courses extends Cancel Course
      (you MAY search for the course, or enter its number directly).

  (Use Case A) ──▷ (Use Case B)        Generalization: A is a SPECIALIZATION of B
  (also Actor A ──▷ Actor B, e.g. Administrator ──▷ User)
```
**Memory hook:** include = "I Need Constantly"; extend = "Extra, optional." Arrow directions: <<include>> points base→included; <<extend>> points extension→base.

His worked example (Course Management System): User —(Registers, Drop Course, Search Courses); Administrator ──▷ User (specialized actor); Cancel Course --<<include>>--> Authenticate User ("cannot cancel unless authenticated"); Search Courses <--<<extend>>-- Cancel Course (search optional, may enter course number directly).

ASCII version:
```
            +--------- Course Management System ----------+
   User ----|-- (Register)  (Drop Course)  (Search Courses)
    ^       |        (Cancel Course)--<<include>>-->(Authenticate User)
    |       |             ^
 Administrator            '---<<extend>>--- (Search Courses)
            +---------------------------------------------+
```

---

## 4. Sequence Diagrams

Interaction diagram emphasizing **time order**. Notation: objects at top (`name:Class`), **lifeline** (dashed vertical line), **activation bar** (thin rectangle = period of control), solid arrow = **synchronous** message (caller blocks/lock-step), open/stick arrow = **asynchronous** (caller continues), dashed arrow back = optional **return message**.
```
 :Customer        :ATM            :Account
     |              |                 |
     |--withdraw()-->|                 |
     |              |---debit(amt)--->|
     |              |<- - balance - - |
     |<- - cash - - |                 |
```
**Concurrency modeling (his slides):** Active objects (double-edge boxes) = independent flows of control (processes); stereotype `<<process>>`; tagged values give process location; async messaging lets a SystemManager continue work while nodes power on; sync messaging = lock-step (SiteManager waits for nodeOne before nodeTwo).

**Communication diagram** = same info, emphasis on **structural order**: objects/roles connected by links/connectors (solid lines), messages numbered (1: , 1.1: , 2: ...). Links connect objects; connectors connect roles — look identical, differ semantically.

**Activity vs State Machine (his airport example):**
- **State machine**: states of ONE thing (ticket: VERIFYING → CHECKING → PAYING → ISSUING with transition labels like "Check in luggage", "Paid, get pass").
- **Activity**: the workflow/actions themselves (with swimlanes like Ticket Counter / Luggage Counter / Fee Counter / Boarding Counter).
- Exam line: state machine = event-driven states of an object; activity = flow of actions of a process.

---

## 5. Component Diagrams

- **Component** = modular part of a system that **encapsulates its contents**, whose manifestation is **replaceable within its environment**. Model with <<component>> box.
- Decompose systems; structural architecture from a **logical** perspective.
- **Black-box** approach = hide internals, interact only via interfaces. **White-box** = show internal realization (sub-components, classes).
- **Provided interface** (ball/lollipop ─O) = services the component OFFERS to others. **Required interface** (socket ─C) = services the component NEEDS to function.
```
 [ComponentA] ──C    O── [ComponentB]
   needs ISchedule    provides ISchedule
        \____assembly connector____/
   (ball-and-socket joined = <<assembly>>)
```
- **Assembly connector** = dependency between required and provided interfaces (equivalent to drawing a dependency arrow from required to provided).
- **Ports** — small squares on a component boundary = access points between component and environment; can be named.
- **Delegation connector** (<<delegate>> arrow) — links external port/provided interface to the INTERNAL realization of it (white-box view), or internal required interfaces out to ports.
- UML 1.x components = physical deployable entities; UML 2.x models those as **artifacts on nodes**; logical components live at design-time, physical at run-time.

---

## 6. Class Diagrams (HIGHEST-VALUE SKILL: diagram ↔ code, 8 marks in sample)

Lower abstraction than component diagrams. Two-way mapping with code: **forward engineering** (diagram→code) and **reverse engineering** (code→diagram). "The most powerful tool for modeling OO software before construction."

**Class box — 3 compartments:**
```
 +-----------------------------+
 | <<stereotype>>              |   Name compartment (can qualify: Package::Class;
 |        ClassName            |   stereotypes: <<interface>>, <<utility>> = static class)
 +-----------------------------+
 | +publicAttribute: int       |   Attribute compartment: visibility name: type
 | -privateAttr: string        |
 +-----------------------------+
 | +operation1(p: int): void   |   Operation compartment: visibility name(params): return
 | -operation2(): void         |   (abstract shown in italics; static underlined)
 +-----------------------------+
```

**Visibility table (must know cold):**
| Symbol | Visibility | Meaning |
|---|---|---|
| + | public | accessible to external clients |
| - | private | only inside the class |
| # | protected | class + derived classes |
| ~ | package | entities in same package |
Visibility = how we apply the **Encapsulation principle** in design.

**Relationships on classes and their CODE meaning** ("all of these relationships mean something in code"):
```
 Dependency:      ClassA - - - -> ClassB     uses B transiently (param/local);
                                             usually NOT generated as a field
 Association:     ClassA ────────> ClassB    B is a member field of A
 Aggregation:     ClassA ◇──────── ClassB    whole-part, part can outlive whole
                                             (A holds reference to B)
 Composition:     ClassA ◆──────── ClassB    strong whole-part: A owns B's
                                             lifetime (B created/destroyed with A)
 Generalization:  Child ───────▷ Parent      class Child : Parent (inheritance)
 Realization:     Class - - - -▷ Interface   class Class : IInterface (implements)
 Multiplicity:    1, 0..1, *, 1..*  on association ends ( * → a collection field)
```

**Forward engineering example (the sample's Q2c pattern — Animal class diagram → full code).** Given:
```
 +----------------+        +----------------+
 |    Animal      |        ClassDiagram says:
 +----------------+        - name: string   (private attr)
 | -name: string  |        + Animal(name)
 | -age: int      |        + makeSound(): void
 +----------------+        Dog and Cat inherit Animal (hollow triangle)
 | +makeSound()   |        Dog overrides makeSound()
 +----------------+
        ^
   ┌────┴────┐
 +------+ +------+
 | Dog  | | Cat  |
 +------+ +------+
 | +makeSound() | (each)
 +------+ +------+
```
C#-style answer (Java/C++ accepted; pattern is identical):
```csharp
public class Animal {
    private string name;          // '-' => private
    private int age;
    public Animal(string name, int age) { this.name = name; this.age = age; }
    public virtual void MakeSound() {   // '+' => public
        Console.WriteLine("Some sound");
    }
}
public class Dog : Animal {              // generalization arrow => inheritance
    public Dog(string name, int age) : base(name, age) { }
    public override void MakeSound() { Console.WriteLine("Woof"); }
}
public class Cat : Animal {
    public Cat(string name, int age) : base(name, age) { }
    public override void MakeSound() { Console.WriteLine("Meow"); }
}
```
**Marking checklist for diagram→code (how to harvest all 8 marks):** correct class names (1) + every attribute with correct TYPE and VISIBILITY keyword (2) + every operation with correct signature/return type (2) + inheritance/realization written correctly (`: Base` / `implements`) (2) + clean compilable syntax incl. constructors (1). Notice the visibility symbols MUST translate (+ → public, - → private, # → protected) — the slide stresses exactly this.

**Code→diagram (reverse) checklist:** field of type B in A → association A→B; `List<B>` → multiplicity *; `class A : B` → generalization; `class A : IB` → realization (dashed); method parameter only → dependency (dashed).

---

## 7. Deployment Diagrams

Model **physical realization**: **Nodes** (cubes = computational resources hosting artifacts), **communication paths** between nodes (solid lines), **artifacts deployed on nodes** (<<artifact>> inside node or dashed <<deploy>>), artifact **embodies/manifests** a component (<<manifest>>), artifact-to-artifact dependency. Used to evaluate the environment in which software executes. (Sample MCQ #5: deployment environments → **Physical view** of 4+1 — bridge to Ch3.)

---

## 8. Likely Exam Questions

1. *Name the TWO categories of UML diagrams + one example each.* (4m) — Structural (Class/Component) vs Behavioral (Use Case/Sequence).
2. *Explain the specification of every relationship connector in a given use case diagram.* (4m) — association, <<include>> mandatory, <<extend>> optional, generalization.
3. *Write the FULL code generated from this class diagram (Java or C++).* (8m) — use checklist in §6.
4. *Draw a class diagram for scenario X* (Section C) — boxes, 3 compartments, correct arrows, multiplicities.
5. *MCQ:* which diagram shows structure (Class), behavioral vs structural difference (dynamic vs static).
6. *Differentiate sequence vs communication diagram* (time-order vs structural order).
7. *Component provided vs required interface; what is a port; what is a delegation connector.*
8. *Visibility symbols table* (+ - # ~).

---

## 9. Top Traps

1. **<<include>> = MANDATORY ("must be executed"), <<extend>> = OPTIONAL ("may be executed").** Most-flipped fact in the course; his slide literally bolds this.
2. **<<extend>> arrow points FROM the extension TO the base** use case (Search Courses ←<<extend>>— is wrong; the extending case has the tail).
3. Generalization arrow = **hollow triangle pointing at the PARENT**. Dashed + hollow triangle = realization (interface), not inheritance.
4. Aggregation (hollow ◇) vs composition (filled ◆): the **diamond sits on the WHOLE**, not the part; composition = owner controls part's lifetime.
5. In code generation, **don't forget visibility keywords** — translating `-attribute: int` as just `int attribute;` (package-private in Java) loses marks; write `private int attribute;`.
6. Dependencies usually do **NOT** generate code (his slide: "Notice that dependency on Class6 is not generated!").
7. Sequence diagram solid filled arrow = synchronous; stick/open arrow = asynchronous — concurrency questions hinge on it.
8. Actors can be **non-human** (sensors, server systems).
9. Class diagram = static; do not put message arrows/time into it.
10. UML 2.x physical deployables = **artifacts**, not components (UML 1.x legacy trap).

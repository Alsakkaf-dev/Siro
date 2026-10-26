# 04 — EMERGENCY FINAL REVIEW (All 9 Chapters, last 48 hours)
One pass = 45 minutes. Everything here is from HIS materials. Asterisks (★) mark items that appeared in the midterm sample.

---

## CH1 — Design Process (one screen)

★ **Software design** = transforming requirements into a **blueprint for software construction**.
**SDLC:** Requirements → Design → Implementation → Testing → Deployment/Evolution.
★ **Challenges (R-P-T-E-M):** Requirements volatility · inconsistent Processes · fast-changing Technology · Ethics under pressure · Managing design influences (stakeholder tug-of-war).
**Design process (6):** Architecture (macro, NON-functional) · Detailed design (FUNCTIONAL) · Interface design · Component design · Construction/scoping design · Documentation.
**Roles:** Systems engineer = holistic · ★ Software architect = black-box, external properties, quality · Software engineer/component designer = white-box internals, codes · UI designer = usability.
**Principles:** Modularization (decompose; WHAT) · Abstraction (essentials only; HOW; procedural + data) · Encapsulation (expose no more, no less) · ★ Coupling (BETWEEN modules — content > common > data severity) · ★ Cohesion (WITHIN module — functional/procedural/temporal/communication; HIGH = good) · Separation of interface & implementation (swappable, ≠ encapsulation) · Sufficiency (minimal enough) · Completeness (general enough).
**Golden line:** low coupling + high cohesion = maintainable, reusable design.
**Strategies:** OO (objects: state+behavior+identity) vs Structured (top-down functions). Minimize complexity; design for change.
**Problems:** well-defined / ill-defined / wicked (formulated after solving).

## CH2 — UML Crib

★ **Two categories:** Structural = STATIC (Class, Component, Object, Deployment, Package) · Behavioral = DYNAMIC (Use Case, Sequence, Communication, State Machine, Activity).
**Building blocks:** Classifiers + Relationships + Enhancements (notes, <<stereotypes>>, {tagged=values}, {constraints}).
**Relationship arrows:**
```
A - - -> B dependency | A ───> B association | A ◇── B aggregation | A ◆── B composition
Child ──▷ Parent generalization (hollow) | Class - - ▷ Interface realization (dashed hollow)
```
★ **Use case connectors:** Association (actor—UC) · **<<include>> = MANDATORY** (base→included) · **<<extend>> = OPTIONAL** (extension→base) · Generalization (specialized actor/UC).
**Visibility:** + public · − private · # protected · ~ package.
★ **Class box:** Name / Attributes (vis name: type) / Operations (vis name(params): return).
**Code mapping:** association = field · * multiplicity = List<T> · generalization = `: Base` · realization = `: IFace` · dependency = param only (not generated).
**Sequence:** lifelines, activation bars, solid arrow = sync, stick = async, dashed = return. Communication diagram = same info, structural order, numbered messages.
**Component:** ─O provided, ─C required, assembly connector, ports (squares), <<delegate>>. Black-box vs white-box.
**Deployment:** nodes (cubes), artifacts (<<artifact>> .exe/.jar) deployed on nodes, communication paths.
**State vs Activity:** states of ONE object vs flow of ACTIONS.

## CH3 — Architecture

**Definition:** foundational design activity translating functional + non-functional requirements into design elements specifying structure/behavior of MAJOR components.
★ **Tasks (any 3):** stakeholder concerns · appropriate representations/views · manage influences of decisions (org + quality) · major components & interfaces · evaluate/validate (iterative!) · design synchronicity (code matches design).
★ **Quality attributes:** Usability (learning/using) · Modifiability (changing) · Security (protect/defend) · Performance (work under constraints) · Reliability (failure rate) · Availability (uptime) · Portability (other environments) · Testability (verify/validate effort) · Interoperability (collaborate with other systems). ★ Caching → Efficiency.
**Tactics:** Security = resist (authN, limit exposure/access) + detect (IDS) · Testability = event logging · Modifiability = localize changes, prevent ripples (encapsulation, low coupling) · Availability = redundancy, watchdog · Performance = efficiency, less overhead, concurrency.
**Process (5):** understand/evaluate requirements (scenarios; specific+valid) → design → evaluate → document (sign-off) → monitor/control implementation.

### ★ 4+1 VIEWS TABLE (10-mark banker)
| View | Objective | Diagrams | Stakeholders |
|---|---|---|---|
| Logical | functional structure | component, class | end users, designers |
| Process | runtime: concurrency, performance | sequence, communication | integrators, perf engineers |
| Development | code/module organization | package/module | programmers, managers |
| Physical | deployment on hardware ★ | deployment, infrastructure | system engineers, ops |
| Scenarios (+1) | tie + validate all views | use cases | ALL stakeholders |

## CH4 — Architecture Styles Comparison Table

★ **Style vs Pattern:** style = system-wide blueprint (Client-Server, Layered, Microservices, Event-Driven) · pattern = solution to recurring problem within a style (Facade, Factory, Singleton, Observer).
| System type | Style | Top qualities | Choose when |
|---|---|---|---|
| Data-centred | **Repository / Blackboard** | modifiability, maintainability, reusability | central shared data / opportunistic expert solving (controller + knowledge sources) |
| Data flow | **Pipes-and-Filters / Blockchain** | efficiency, extensibility, security | sequential transformations / immutable verified transactions |
| Distributed | **Client-Server / Broker** | interoperability, availability | central services / many transparent servers ★(C-S limit: server bottleneck) |
| Interactive | **MVC** | usability, modifiability | UI apps, multiple views of same data |
| Hierarchy | **Layered / Main-prog & subroutine** | modifiability, portability, security | separation presentation/logic/data |
| Modern distributed | **Microservices / SOA / Serverless / Event-Driven / Hybrid / Modular Monolith** | scalability, deployment independence ★ | independent teams/deploys, fault isolation, enterprise integration, async events |
**Pipes-and-Filters parts:** source → pipes → filters → sink (compiler example). **Blackboard parts:** blackboard + controller + knowledge sources; no fixed sequence. **MVC:** Model = data+logic, View = display, Controller = input→updates. **Layered code:** each layer holds reference to the one BELOW.

## CH5 — SOLID One-Liners + Micro-Examples

- **SRP:** one class, ONE reason to change. *Violation:* OrderManager validates+taxes+saves+emails → split into 4 classes.
- ★ **OCP:** open for EXTENSION, closed for MODIFICATION (Meyer). *Violation:* if/else on character type in GameEngine. *Fix:* `ICharacter{Draw,Move}` + subtypes; engine calls `c.Move()`. New AquaticCharacter = new class only. No design is 100% closed — encapsulate what varies.
- ★ **LSP:** subtype substitutable for base without breaking correctness (Liskov). *Rules:* Signature (same signatures) + Methods (preconditions may WEAKEN, postconditions may STRENGTHEN — never reverse). *Violation:* Square : Rectangle — SetWidth changes height, client's `w*h==20` assert fails. *Fix:* both implement IShape; no mutable inheritance.
- **ISP:** clients shouldn't depend on methods they don't use; many small interfaces > one fat one. *Violation:* IMachine{Print,Scan,Fax} forces printer to throw. *Fix:* IPrinter/IScanner/IFax; compose. (Door/TimerClient = interface pollution.)
- **DIP:** depend on ABSTRACTIONS, not concretions. *Violation:* `new SqlDatabase()` inside service. *Fix:* IDatabase injected via constructor.
**Detailed design:** IEEE = refine architecture until "sufficiently complete to be implemented"; bridge design→code; gatekeeper; tasks = understand reqs (allocated to YOUR component) → create (interfaces, GUI, internal structure+behavior, data) → evaluate (STATIC technical reviews) → document SDD → monitor. **Component design concepts:** classes/objects, interfaces=contracts, dynamic binding (runtime resolution), polymorphism (common supertype).

## CH6+7 — EVERY PATTERN IN 3 LINES

**SINGLETON** — Intent: one instance + global access. Structure: private ctor, static instance, static GetInstance (lock for threads). Use when: config, logging, registry. (Cons: hard to test, coupling.)
**FACTORY** — Intent: create objects without exposing instantiation; subtype from runtime input. Structure: abstract Product ← concretes; Factory.Create(input) switch → new subtype. Use when: role-based controllers. (Limit: not for families.)
**ABSTRACT FACTORY** — Intent: create FAMILIES of related objects, no concrete classes named. Structure: AbstractFactory{CreateA,CreateB} ← concrete factory per family; abstract products. Use when: consistent families, swap family wholesale (Male/Female fashion).
**BUILDER** — Intent: construct complex object step-by-step; separate construction from representation. Structure: Builder with chained setters (`return this`) + Build() → product. Use when: many optional attributes (orders, reports).
**PROTOTYPE** — Intent: new objects by CLONING existing ones. Structure: abstract Clone() in base; each concrete returns copy of self; holder calls prototype.Clone(). Use when: creation expensive; templates (user defaults, NPCs). (Cons: deep-clone complexity.)
**ADAPTER** — Intent: convert one interface into the one clients expect. Structure: Adapter realizes Target, wraps Adaptee (association), translates calls. Use when: legacy/3rd-party incompatibility. Steps: identify Target+Adaptee → Adapter realizes Target in terms of Adaptee → use Adapter wherever Target expected.
**COMPOSITE** — Intent (GoF): tree structures for whole-part; treat individual & composite UNIFORMLY. Structure: Component (op + virtual Add throwing) ← Leaf (does work) + Composite (List<Component>, op = foreach child.op()). Use when: hierarchies (folders, sensor groups, GUI containers).
**FACADE** — Intent (GoF): unified interface to subsystem interfaces; higher-level, easier to use. Structure: Facade holds/creates subsystem objects; one method orchestrates many. Use when: simplify complex subsystem (kitchen via waiter). (Cons: god-object risk.)
**ITERATOR** — Intent (GoF): access aggregate's elements sequentially WITHOUT exposing representation. Structure: IIterator{First,Next,IsDone,Current} + IAggregate{CreateIterator}; concrete iterator per collection. Use when: uniform traversal over varying collections (his computer stores). Benefit: new stores reuse same display code.
**OBSERVER** — Intent (GoF): one-to-many dependency; state change → all dependents notified automatically. Structure: Subject{Attach,Detach,Notify→foreach Update} + IObserver{Update}; notify fired in state setter. Use when: price feeds, dashboards, events. ★ "Almost always used within MVC" (views observe model).
**Categories:** creational = instantiation · structural = composition/integration · behavioral = communication/interaction (indirectly user-triggered).

## CH8 — Construction Design

**Definition:** LOWEST level of detailed design — modeling/specifying FUNCTION implementations (algorithms). **Algorithmic viewpoint** (IEEE): flow-based (flowcharts/activity diagrams) · state-based (state machines — when states dictate logic) · table-based (decision tables).
**Decision tables:** sections = Conditions | Condition Entries // Actions | Action Entries. **LEDT** Boolean: policies = **2^n** · **EEDT** multi-valued: policies = **Π Vi** (3 types × 2 credit = 6) · **MEDT** mixed. Table→code: lookup array + computed key (lower complexity than nested ifs).
**PDL:** natural-language pseudo-code; "comments-first"; language-independent; design + documentation in one.
**Styles (stylistic viewpoint):** formatting (whitespace, brackets inline/new-line) · naming (self-documenting consistency) · documentation (**comments say WHY, not WHAT**; file banners with classification + change log). Automated checkers (CheckStyle): naming, formatting, line/param limits, Javadoc, duplication, complexity threshold.
**Quality evaluation:** completeness + correctness (peer reviews, unit tests **derived from use cases**, audits) · testability (effort to test) · maintainability (effort to maintain; style compliance).
**McCabe:** `V(G) = e − n + 2p` · `C = π + 1` (if/while/for = 1; compound = 2; switch n branches = n−1) · regions: C = enclosed r + 1. **Threshold ≤ 10.** V(G) = min unit tests for branch coverage. His examples: e10 n7 p1 → 5; r5 → 6.

## CH9 — Design Management Framework Summary

**Framework: Planning → Execution/Implementation → Termination, on a base of Leadership & Ethics.**
- **Planning:** objectives = understand tasks+resources; plan within schedule/budget. Scoping = **WBS** (hierarchical breakdown SOW→tasks→subtasks→work packages; criteria: scope accuracy, completeness, level of detail) + **Budgeting** (forecasting; direct = labor/equipment, indirect = benefits/admin; learning rates). Organizing = **LRC** (task-assignment table) + **Scheduling** (Gantt = bars/durations/flow; network diagrams; critical activities; predecessors). + change control policy.
- **Implementation:** MOST effort/deliverables/completion; monitor & control vs plan; tools = Gantt + **EVM**.
- **Termination:** store latest docs per configuration management; update schedule/cost; re-evaluate plans from performance; report to upper management. (= transition INTO construction.)
- **Leadership & Ethics:** affects every stage.

**EVM FORMULA CARD:** EV = %complete × BAC · PV = planned-by-now · AC = spent · **SV = EV−PV** · **CV = EV−AC** · **SPI = EV/PV** · **CPI = EV/AC** · **EAC = AC + (BAC−EV)/CPI = BAC/CPI**. Negative variance / index <1 = BAD.
*Sara example:* BAC 10k, month 5, 3 of 10 tasks, AC 4k → EV 3k, PV 5k, SV −2k, CV −1k, SPI 0.6, CPI 0.75 ("$0.75 per $1 spent"), EAC 13,333 → over budget + behind schedule → risk mitigation.
**Leadership:** Big Five = agreeableness, **surgency (0.31 top leadership correlation)**, adjustment, conscientiousness (0.28), openness (0.24). **Power:** position (reward, coercive) vs personal (expert, connection) — perception of potential influence. **Skills:** communication (5-step oral: rapport→objective→transmit→check understanding→commitment), networking, motivation (hierarchy of needs), **principled negotiation** (people≠problem · interests not positions · generate options · objective criteria). **Ethics:** moral principles distinguishing right/wrong; lead by example; higher purpose + support network; public/product, judgment, management principles.

---

## LAST-HOUR DRILL (memorize cold)
1. 4+1 table. 2. include vs extend. 3. OCP/LSP definitions + Square-Rectangle. 4. Singleton+Observer code from memory. 5. EVM six formulas. 6. C = π + 1 counting rules. 7. Style table (system type → style → quality). 8. Factory vs Abstract Factory table. 9. Visibility symbols. 10. Framework 4 components.

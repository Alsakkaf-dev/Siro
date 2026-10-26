# CH3 — Principles of Software Architecture (Tasks, Quality Attributes, Process, 4+1)
**Source:** Chapter 3.pdf (new) + old Ch3 sessions. The midterm sample's Q3 was 100% this chapter (quality attributes 3m, main tasks 3m, 4+1 views 10m). The 4+1 question is the single most predictable 10-marker in the course.

---

## 0. Chapter Mental Model

Architecture = the FIRST design decisions, the ones everything else stands on. His definition (memorize):
> **"The foundational software design activity that evaluates and translates software requirements (both functional and non-functional) into a collection of design elements that specify structural and behavioral aspects of the major components of the system."**

Three faces of that definition (his slide):
1. **Foundational design** — groundwork for meeting requirements (functional AND non-functional).
2. **Requirements & design elements** — requirements are tricky; avoid ambiguity; inexperienced engineers miss the traps.
3. **Design quality & construction** — focus on major components, quality properties, services → a design that supports efficient detailed design and construction.

Architecture answers system-wide questions; you can't unit-test your way out of a bad one. The chapter gives you: the architect's TASKS, the QUALITY ATTRIBUTES vocabulary (+tactics), the PROCESS, and the 4+1 VIEW model for documenting it all.

---

## 1. Key Tasks in Architectural Design (sample Q3b: "identify and explain THREE main tasks")

Six on his slide — know all, deploy any three:
1. **Identify stakeholders' concerns** — stakeholders = persons, groups, or organizations with a direct or indirect stake in the system. Their concerns drive quality requirements.
2. **Select appropriate architectural representations** — different representations (views/diagrams) are required to evaluate certain properties of the system; one diagram cannot show everything.
3. **Manage influences of architectural decisions** — decisions impact the organization AND the quality attributes; architecture and organization shape each other.
4. **Design major components and interfaces** — interfaces defined for components within a single physical node (same/different process space) or across different physical nodes.
5. **Evaluate and validate the architecture** — long, ITERATIVE process; failure to do so has significant impact on effort and cost.
6. **(Maintain) design synchronicity** — measurement of the degree to which the software IMPLEMENTATION reflects its DESIGN, in both architectural and detailed-design form (code drifting from design = lost synchronicity).

3-mark pattern: name task (½) + one-sentence explanation (½) × 3.

---

## 2. Quality Attributes (sample Q3a + MCQ #6; learn definitions VERBATIM-ish)

| Quality | His definition |
|---|---|
| **Usability** | Degree of complexity involved when **learning or using** the system |
| **Modifiability** | Degree of complexity involved when **changing** the system to fit current or future needs |
| **Security** | System's ability to **protect and defend** its information or information system |
| **Performance** | System's capacity to accomplish **useful work under time and resource constraints** |
| **Reliability** | The system's **failure rate** |
| **Portability** | Degree of complexity when **adapting to other software/hardware environments** |
| **Testability** | Degree of complexity when **verifying and validating** required functions |
| **Availability** | The system's **uptime** |
| **Interoperability** | Ability to **collaborate with other software or hardware systems** |
| (Efficiency) | Useful work per resource — caching MCQ answer: caching → **Efficiency/Performance** |

**Tactics (how architects ACHIEVE attributes — pairs well with "suggest a tactic" questions):**
- **Security:** Resist attacks (authenticate users, limit exposure, limit access need-to-know); Detect attacks (intrusion detection).
- **Testability:** Event logging — log data/operations system-wide; testers can enable/disable; console insight.
- **Modifiability:** Localize changes (modularization, abstraction, encapsulation); prevent ripple effects (encapsulation, reduce coupling).
- **Availability:** Redundancy, task monitor, watchdog timer.
- **Performance:** Increase computation efficiency, reduce computational overhead, introduce concurrency.

MCQ trap from sample: "architect adds caching" → **Efficiency** (not reliability/security/portability).

---

## 3. Problem Solving During Architecture (IDEF0-style model)

His diagram, as a flow:
```
 INPUTS                       ACTIVITIES                    OUTPUTS
 Requirements, System   -->   Interpret Problem        -->  Architectural Designs,
 Goals, Scenarios             Collaborative Brainstorming   Documentation
 (define problem +            Evaluate Constraints
  product constraints)        Document / Evaluate
        ^                          ^         ^
        |                          |         |
   Schedule / Cost /          RESOURCES   CONTROLS
   Quality constraints        dev team,   dictate how/when/where
   + other project            modeling    activities are performed
   constraints                software,   e.g. design reviews scheduled 1 week
                              IDEs, HW    ahead; SQA present during review;
                                          classified material reviewed in vault
```
- Constraint examples: reuse home-grown class framework (leverage expertise, develop faster); buy & integrate xyz library instead of building.
- Inputs "are rarely complete on the first shot" — iteration is normal.
- **Resources** = team, modeling software, IDEs, hardware. **Activities** = tasks performed to process requirements (e.g., design review). **Controls** = rules dictating how/when/where activities happen.

---

## 4. Software Architecture Process (5 steps — cycle)

1. **Understand and evaluate requirements** — elicit using **scenarios**; classify, prioritize, negotiate requirements; make them **specific and valid**.
2. **Design the architecture** — architecture, design, tech stacks.
3. **Evaluate the architecture** — complete and matched (against requirements).
4. **Document the architecture** — upon completion, all documented and **signed off**.
5. **Monitor and control implementation** — development and monitoring (keeps design synchronicity).

**Good requirements (his examples):** must be **specific** (not "secure and fast" — define WHAT secure/fast mean measurably; not "search the database" — for what?) and **complete** (the product-report requirement was split into two complete requirements specifying report content, removing ambiguity so it can be implemented directly in code). His registration example: error message "this username+password combination is taken" GIVES AWAY someone else's credentials — a security flaw born from a bad requirement.

---

## 5. THE 4+1 VIEW MODEL (10-mark banker — sample Q3c asked objective + stakeholders + rationale per view)

His slide maps views → diagrams:
```
        +----------------+        +-------------------+
        |  LOGICAL VIEW  |        | DEVELOPMENT VIEW  |
        | component dia. |        | module / package  |
        | class diagrams |        | diagrams          |
        +-------+--------+        +---------+---------+
                \                          /
                 +--------USER VIEW-------+
                 | (Scenarios: use cases) |
                 +------------------------+
                /                          \
        +------+---------+        +---------+---------+
        |  PROCESS VIEW  |        |  PHYSICAL VIEW    |
        | sequence dia.  |        | deployment dia.   |
        | communication  |        | infrastructure    |
        +----------------+        +-------------------+
```

Full model answer table (write ALL of this for 10 marks — 2 per view):
| View | Primary objective | UML diagrams (his slide) | Stakeholders | Rationale (why a distinct perspective) |
|---|---|---|---|---|
| **Logical** | Functional structure: decompose system into logical components/classes delivering the functionality | Component, Class | End users (functionality), analysts/designers | Functionality concerns are understood as abstractions independent of code organization or hardware |
| **Process** | Runtime/dynamic behavior: concurrency, synchronization, interactions, performance | Sequence, Communication | Integrators, performance engineers | Static structure cannot show timing, concurrency, throughput — needs its own dynamic perspective |
| **Development** | Organization of code: modules, packages, layers for the build/team structure | Module/Package | Programmers, software managers | Code organization (work assignment, reuse, build) differs from runtime and logical structure |
| **Physical** | Deployment: mapping software onto hardware nodes, networks; scalability/availability | Deployment, Infrastructure | System engineers, operators/DevOps | Hardware topology, distribution, redundancy can only be evaluated against physical resources |
| **User view (+1, Scenarios)** | Use cases/scenarios that tie all views together; validate and illustrate the architecture | Use case diagrams & scenarios | ALL stakeholders, esp. customers/end users | Scenarios cut across the 4 views, proving the architecture satisfies the actual required behavior — that's why it's the "+1" |

(Sample MCQ #5: "deployment environments" → **Physical view**.)

Memory hook: **L**ions **P**lay **D**angerously, **P**eople **S**catter (Logical, Process, Development, Physical, Scenarios).

---

## 6. Architecture history bridge (from old slides, context for Ch4/6/7)

- 1977 Christopher Alexander: pattern language for buildings/towns; 253 patterns — "each pattern describes a problem which occurs over and over... and the core of the solution... usable a million times over, without ever doing it the same way twice."
- 1990s: software community catalogs recurring high-level solutions = **architectural styles**.
- 1994 **Gang of Four** (Gamma, Helm, Johnson, Vlissides): 23 finer-grained OO **design patterns** (detailed-design level).
- 1996 **Buschmann et al.**: documented styles in pattern form = **architectural patterns**; "every architectural style can be described as an architectural pattern"; design patterns are medium-scale, do NOT affect the fundamental system structure (only subsystem level).
- Course convention: architectural style/pattern = reusable solution at the ARCHITECTURE activity; design pattern = reusable solution at the DETAILED DESIGN activity.

---

## 7. Likely Exam Questions

1. *Identify and describe THREE quality attributes.* (3m) — any three definitions from §2 table.
2. *Identify and explain THREE main tasks in developing software architectures.* (3m) — §1.
3. *Describe the 4+1 view model: per view give objective, stakeholders, rationale.* (10m) — §5 table. THE banker.
4. *MCQ: caching → efficiency; deployment → physical view.*
5. *Suggest tactics to improve security/availability/modifiability of a given system.*
6. *Define software architecture* (his exact definition) / *what is design synchronicity?*
7. *Describe the 5-step software architecture process.*
8. *Why must requirements be specific and complete? Give an example of a bad requirement and fix it.*

---

## 8. Top Traps

1. Architecture translates **BOTH functional and non-functional** requirements — but its distinctive focus vs detailed design is **quality/non-functional** (Ch1 framing). Read the question wording.
2. **Reliability = failure rate; Availability = uptime.** Two different attributes — don't merge.
3. **Modifiability vs Portability:** change to fit new NEEDS vs adapt to new ENVIRONMENTS.
4. 4+1: Logical = component+class diagrams, NOT use cases. Use cases belong to the **+1 (User/Scenario) view**.
5. **Development view ≠ Physical view**: code/package organization vs hardware deployment.
6. Evaluation/validation of architecture is **iterative and long** — saying "done once at the end" is wrong.
7. Design synchronicity is about **implementation matching design**, not about concurrent processes.
8. Stakeholders include **indirect** stakes (organizations, regulators), not just users.

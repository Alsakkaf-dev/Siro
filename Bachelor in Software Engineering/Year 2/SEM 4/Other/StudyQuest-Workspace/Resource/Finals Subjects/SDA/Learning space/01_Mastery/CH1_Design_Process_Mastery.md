# CH1 — Introduction to Software Design (Design Process, Roles, Fundamentals)
**Source:** SPACE SDA (S1).pdf (new) + Ch1 old Sessions I–III (supplements). Exam weight: foundations for Section A MCQs + Section B "describe THREE challenges / explain coupling-cohesion" questions (both appeared in the midterm sample).

---

## 0. Chapter Mental Model (plain language)

Software design = the bridge between *what* the customer wants (requirements) and *how* the code will be built (construction). The exam's favorite definition: **"the process of transforming requirements into a blueprint for software construction"** (this was MCQ #1 in the sample, verbatim).

Think of it as building a house:
- Requirements = "I want 3 bedrooms and a garden"
- Architecture = the floor plan (big boxes, quality decisions)
- Detailed design = wiring diagrams and plumbing specs (class-level)
- Construction = laying bricks (code)

The chapter answers four questions: (1) who designs (roles), (2) what makes design hard (challenges), (3) what steps design follows (process), (4) what timeless rules guide every decision (principles: modularization, abstraction, encapsulation, coupling, cohesion...).

---

## 1. Where Design Sits: SDLC Recap

Five phases (his slide's wheel):
1. **Requirement Analysis** — elicitation and analysis. People: Product Owner, Project Manager, Business Analyst, CTO.
2. **Software Design** — architecture, design, tech stacks. People: Software Architect, Solution Architect, Software Engineer, UI/UX Designer.
3. **Implementation** — development, coding, integrations. People: Front-End/Back-End Developers, DevOps.
4. **Testing** — testing and debugging. People: Solution Architect, QA Engineers, Testers.
5. **Deployment & Evolution** — deploy, maintenance, feedback. People: DevOps, Users, Support Managers.

**Common mistakes per phase (slide 7 — likely MCQ fodder):**
| Phase | Mistakes |
|---|---|
| Requirements | Client always "right"; not educating stakeholders; ambiguous requirements |
| Design | Failed timeframe; no risk management; incomplete design; no architecture framework |
| Implementation | Bad task allocation; no team communication; last-minute dev |
| Testing | Small time and budget allocations |
| Deployment | No versioning documentation (patch notes) |

**Software Foundation (why have a process at all):** to accomplish the project quickly/efficiently and reduce frustration/confusion. Three pillars: Requirements (verify & validate with stakeholders), Designs (detailed design, scalability, performance, maintenance), Process & Documentation (clear process, version control).

**Plan & Scope split (his slide 12):** Functional 58%, Design 25%, Non-Functional 12%, Sustainability 5%. Plan = define goals/objectives, define priority and scope, plan first prototype covering business needs.

**Why a roadmap?** (1) Clear outline of product — see all objectives, effective scheduling; (2) manageable timeline & communication; (3) get early buy-in on deliverables (clients, investors); (4) manage stakeholder expectations (avoid chaos).

---

## 2. Hierarchy & Roles of Software Designers (sample Q1b tested architect vs engineer!)

Hierarchy (his slide):
```
        System Engineer / Solution Architect
            |                       |
     Software Architect      Infra/Cloud Architect
        |          |                 |
  Software      UI Designer    Network Engineer
  Engineer
```

| Role | Responsibility (slide wording) |
|---|---|
| **Systems Engineer / Solution Architect** | Designs systems using a **holistic** approach — how software, hardware, people, etc. collaborate to achieve the system's goal. |
| **Software Architect** | Designs software systems using a **black-box** modeling approach; concern on **external properties** of components that determine **system quality** and support further design of functional requirements. |
| **Component Designer / Software Engineer** | Designs the **internal structure and behavior** of components identified during architecture; strong programming skills, implements designs in code (white-box). |
| **User Interface Designer** | Designs the UI; skilled in increasing **usability**. |

**Model answer for "architect vs engineer affects quality" (4 marks, sample Q1b):** The architect works black-box, choosing structures/styles that determine system-wide quality attributes (performance, scalability, maintainability) — wrong choices here are costly to reverse. The engineer works white-box, designing internals + code; their work determines code-level quality (correctness, readability, low coupling/high cohesion). Quality requires both: a sound architecture badly implemented fails, and excellent code on a bad architecture cannot fix systemic flaws. Architect decisions constrain engineers; engineers feed back implementation realities.

---

## 3. Software Design Challenges (sample Q1a: "Describe any THREE")

His five (memorize: **R-P-T-E-M**):
1. **Requirements** — requirement volatility: requirements change mid-project ("Customers now want a bigger house and more windows by next week!"). Design must absorb change.
2. **Processes** — inconsistent development processes; most companies don't have a well-defined process, so design quality varies.
3. **Technology** — fast, ever-changing technology; old and new tech must co-exist; chosen stacks become obsolete.
4. **Ethics** — ethical & professional practice under tight schedules; negotiation; keeping the team motivated without cutting corners.
5. **Management** — managing design influences: many stakeholders pull in different directions ("I want performance!", "I want security!", "I want usability!"). Requires the designer to step outside the technical domain and understand the organization as a whole.

**6-mark answer pattern:** name the challenge (1) + 1–2 sentence description with consequence (1) × 3.

---

## 4. Software Design Process (6 activities, his slide 11)

1. **Software Architecture** — macro design; models depicting the **quality and function** of the system (focus: non-functional/quality requirements).
2. **Detailed Design** — focuses on **functional** requirements (vs architecture = non-functional). Class-level design.
3. **Interface Design** — standardized way of accessing services provided by software components.
4. **Component Design** — typically class diagrams, sequence diagrams, etc.
5. **Scoping/Construction Design** — reason, communicate, and document solutions to complex programming problems.
6. **Documentation** — clear and concise design docs, submitted for approval.

Memory hook: **A-D-I-C-S-D** ("A Designer Is Coding, Sketching, Documenting").
Key contrast the exam loves: **Architecture handles NON-functional (quality) requirements; Detailed Design handles FUNCTIONAL requirements.**

---

## 5. Design Principles (THE core of Ch1 — sample Q1c tested coupling+cohesion)

Six on the new slide + two more from old Session III:

### 5.1 Modularization
Continuous **decomposition** of the system until fine-grained components are created. Specifies **WHAT** needs to be done. Benefits: manageability across the lifecycle (modularizes requirements, programming, test cases too); a roadmap from coarse-grained to fine-grained components; designs easier to understand, develop, maintain. (Sample MCQ #2: modularity "reduces dependencies and improves maintainability.")

### 5.2 Abstraction
Focus on **essential characteristics** of entities in their active context while **deferring unnecessary details**. Guides **HOW** modularization is done (ad-hoc decomposition → incoherent design). Two kinds:
- **Procedural abstraction** — simplify behavior: "Computer1 SENDS a message" instead of "opens TCP/IP connection, transmits, waits, closes."
- **Data abstraction** — simplify data structure: "MESSAGE" without committing to its fields yet.

### 5.3 Encapsulation
Provide access **only to necessary data** of abstracted entities — "no more, no less" — hiding HOW services are carried out. Encapsulation **enforces good abstraction**: abstraction hides details; encapsulation revises the abstraction so it exposes only essentials. In UML/code: visibility modifiers (-, +, #, ~).

### 5.4 Coupling
**Manner and degree of interdependence between modules.** High coupling = high dependency = bad (reusability, maintainability drop; managing units gets complex). Types, most→least severe:
| Type | Meaning | Severity |
|---|---|---|
| **Content coupling** | Module modifies/relies on the INTERNALS of another module | Worst |
| **Common coupling** | Modules share global data; one change ripples to all dependents | Middle |
| **Data coupling** | Modules communicate only via parameters; shielded from others' internals | Best (acceptable) |

### 5.5 Cohesion
**Manner and degree to which the tasks performed by a single module are related to one another.** High cohesion good, low cohesion bad. Types: **Functional** (all tasks contribute to one well-defined task — best), **Procedural/Sequential** (tasks ordered, output of one feeds next), **Temporal** (tasks merely run at the same time, e.g., "initialization"), **Communication** (tasks operate on the same data).

**Q1c model answer (relationship + strategy, 6 marks):** Coupling and cohesion are complementary measures: coupling measures dependency BETWEEN modules, cohesion measures relatedness WITHIN a module. Good design = **low coupling + high cohesion**; they reinforce each other — when a module does one focused job (high cohesion) it needs fewer tentacles into other modules (low coupling). A high-coupling/low-cohesion system tangles responsibilities so any change ripples everywhere. **Strategy:** re-modularize/refactor using modularization + encapsulation — decompose modules so each has a single well-defined responsibility (raises cohesion), hide internals behind stable interfaces and communicate only via parameters/interfaces, i.e., reduce content/common coupling to data coupling (lowers coupling). Justify: improves maintainability and reusability since changes are localized behind interfaces.

### 5.6 Separation of Interface and Implementation
Identify a **stable interface** and separate it from implementation, so different implementations can be **swapped** for modified/new behavior. **NOT the same as encapsulation** (encapsulation = hiding details; this = separating them so they're replaceable). This principle is the seed of OCP/DIP in Ch5 and of design patterns (program to an interface).

### 5.7 Sufficiency
Interface captures **enough** characteristics for meaningful interaction; full set of operations a client needs. Implies a **minimal** interface.

### 5.8 Completeness
Interface captures **all essential** characteristics — general enough for **any prospective client**. Subjective; carried too far → bloated interfaces (foreshadows ISP).

Sufficiency = "enough for THIS client, minimal." Completeness = "everything essential for ANY client." They pull against each other.

---

## 6. Design Strategies + Practical Considerations

- **Object-oriented design strategy:** system expressed in terms of **objects and connections**; object decomposition; objects have **state, well-defined behavior, unique identity**; supports inheritance & polymorphism.
- **Structured (functional) design strategy:** decomposition into single-purpose independent modules, top-down iterative; focuses on functions, decomposing them into modules; largely inappropriate for OO languages.

**Practical considerations:**
- **Design for minimizing complexity** — design IS about minimizing complexity; when options compete, choose the one that minimizes complexity (McConnell).
- **Design for change** — software WILL change; design with extension in mind (→ OCP later).

**Problem-solving framework (old Session I — possible MCQ):** Three states: **Initial** (problem formulated/interpreted) → **Operational** (thinking, candidate solutions surface) → **Goal** (solution identified, evaluated, validated). Problem types: **Well-defined** (clear goals/constraints), **Ill-defined** (ambiguous, undefined goals; may be transformable into well-defined), **Wicked** (no single formulation; solutions "good/bad" not "correct/incorrect"; problem formulated AFTER it's solved — e.g., healthcare, climate change).

**Engineering design (Dym & Little):** "a systematic, intelligent process in which designers generate, evaluate and specify designs... achieving clients' objectives and users' needs while satisfying a specified set of constraints." IEEE Software Engineering: "systematic, disciplined, quantifiable approach to development, operation, and maintenance of software."

---

## 7. Likely Exam Questions (midterm-style)

1. *MCQ:* "Which best defines software design?" → transforming requirements into a blueprint for construction.
2. *MCQ:* "Why is modularity important?" → reduces dependencies, improves maintainability.
3. *Describe any THREE common design challenges.* (6m) → pick 3 of R-P-T-E-M with consequences.
4. *Explain how a software architect and software engineer contribute differently to design quality.* (4m) → black-box/quality/NFR vs white-box/internals/code.
5. *A system has high coupling and low cohesion — explain the relationship and suggest one improvement strategy.* (6m) → answer in 5.5.
6. *Name the types of coupling from most to least severe.* → content > common > data.
7. *Differentiate abstraction vs encapsulation vs separation of interface & implementation.*
8. *List the activities of the software design process and state which requirements (functional/non-functional) architecture vs detailed design addresses.*

---

## 8. Top Traps

1. **Design ≠ coding, testing, or deployment** — it's the blueprint phase (MCQ distractors).
2. **Architecture = NON-functional focus; Detailed design = functional focus.** Easy to flip — don't.
3. **Encapsulation ≠ separation of interface & implementation** — his slide says explicitly "Not the same thing!" Hiding vs swappable separation.
4. **Coupling severity order**: content worst, data best. Writing "data coupling is worst" = instant mark loss.
5. **High cohesion is GOOD, high coupling is BAD** — never say "high cohesion bad."
6. **Sufficiency (minimal) vs Completeness (general)** — opposite pulls; don't merge them into one principle.
7. **Modularization = WHAT to decompose; Abstraction = HOW** — his slides phrase it exactly this way.
8. Software architect works **black-box**, NOT white-box (that's the component designer/engineer).

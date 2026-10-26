# 03 — EXAM INTELLIGENCE: SCSE2233 SDA Final (week of July 6, 2026)
Built from the ONLY available sample: `(Set1) SECJ3323 MidTerm 20252026.docx.pdf` (Dr. Khatibsyarbini's parallel course SECJ3323, 17 Nov 2025, 2 hours) + course info (CLO/assessment mapping) + his slide set structure.

---

## 1. What the Midterm Sample Reveals (deep analysis)

### 1.1 Paper structure (2 hours, 100 marks)
| Section | Format | Marks | Content observed |
|---|---|---|---|
| **A** | 10 MCQs × 2m | 20 | Definitions + scenario-MCQs across Ch1–5 (design definition, modularity, UML structural/behavioral, 4+1 physical view, caching→efficiency, client-server limitation, microservices criterion, OCP applied, OCP violated) |
| **B** | 3 structured questions × 16m, sub-parts (a)(b)(c) of 3–10m | 48 | Q1 = Ch1 (challenges 6m, architect-vs-engineer 4m, coupling/cohesion+strategy 6m); Q2 = Ch2 UML (categories 4m, use-case connectors from a FIGURE 4m, class-diagram→FULL CODE 8m); Q3 = Ch3 (quality attributes 3m, architecture tasks 3m, **4+1 views with objective+stakeholders+rationale 10m**) |
| **C** (labeled "Section B – Problem Solving") | 1 big scenario, parts (a)–(g) | 32 | Video-streaming platform: suggest style 2m → evaluate vs requirements 4m → DRAW class diagram of the style 8m → identify design principles from "System Behaviors" 2m → justify 4m → DRAW class diagram of principles 6m → WRITE FULL CODE from that diagram 6m |

### 1.2 Verb patterns (his exam grammar)
- **MCQ stems:** "Which of the following best defines/describes...", "What does this indicate?", scenario + "which principle/criterion/view?"
- **Low marks (2–4):** *Name, Identify, Describe any THREE, Explain the differences* — count-explicit (THREE (3), TWO (2)) → answer EXACTLY that many, in numbered points.
- **Mid marks (6–8):** *Explain + suggest + justify* (compound verbs = compound answers: state → explain → recommend → justify), *Write the full code* (8m).
- **High marks (10):** *Describe the application of X. For each, specify objective, stakeholders, rationale* — a TABLE-shaped answer.
- **Section C chain:** *analyze and suggest → evaluate/justify → design and draw → evaluate and write code.* Each part feeds the next — a wrong (a) cascades, so the style/principle choice MUST match the scenario's quality-attribute keywords.

### 1.3 Difficulty + marking behavior
- ~40% pure recall of HIS slide tables/definitions (quality attributes, 4+1, UML categories, challenges).
- ~35% application: scenario→selection with justification tied to the scenario's stated quality attributes.
- ~25% production: drawing UML correctly + writing compilable Java/C++/C# from diagrams.
- Mark allocation is granular and predictable: 1m per named item, 1–2m per justified point, diagrams marked per-element (classes, relationships, multiplicity, labels).
- Instructions: answer ALL questions; diagrams must use **UML standard notation BY HAND**.

### 1.4 Hidden signals in Section C
The "System Behaviors" paragraph was written to dictate the answer: "designed for extension... without altering existing engine logic" (=OCP) and "each subclass can replace another while preserving expected behavior and interface" (=LSP). **He embeds the answers in scenario wording — train keyword→concept reflexes and quote the scenario phrase in the justification.**

---

## 2. Scope Prediction for the Final

**Prediction: CUMULATIVE Ch1–9, weighted toward Ch5–9. Confidence: HIGH (~85%) on cumulative+weighting, MODERATE (~65%) on exact section format.**

Rationale:
1. **The midterm covered Ch1–4 (+early Ch5)** — standard UTM practice and CLO mapping make the final assess the REMAINING outcomes: CLO1 (18%) + CLO2 (12%) both map to Final, and CLO2 ("design and construct project design architecture, based on selected architecture style") demands scenario design questions again.
2. **Course info weights Meetings 6–14 (SOLID, patterns, construction, management) AFTER the mid-test point** — untested material is examiner's first pick for a brand-new course where question banks don't exist yet; lecturers recycle their freshest slide decks (the NEW PDFs are Ch4–9 heavy).
3. **Foundations can't disappear:** UML class-diagram→code and architecture-style selection are the connective tissue of HIS Section C format — they will reappear wearing Ch5–7 clothes (draw the PATTERN's class diagram, code the PATTERN).
4. The sample's Section C already previewed the final's likely shape: scenario → style (Ch4) → principles (Ch5) → diagrams+code (Ch2 skills). The final adds: → patterns (Ch6/7), possibly + complexity or EVM mini-computation (Ch8/9) as a structured question.

**Predicted final structure (model to train against — mirrors midterm proportions):**
- Section A: 10 MCQs × 2 = 20m — spread Ch1–9, heavier Ch5–7 (principle/pattern identification one-liners).
- Section B: 3 structured × 16 = 48m — likely one UML/architecture refresher (Ch2/3/4), one patterns question (define/compare/draw/code: Factory vs Abstract Factory, GoF intents, pattern steps), one Ch8/9 (decision table or McCabe computation; EVM calculation; management framework).
- Section C: 32m scenario — suggest style + justify + diagram (Ch4), identify principle/pattern from behaviors + justify + class diagram + FULL CODE (Ch5–7).
- Time discipline: 100 marks/120 min ≈ **1.1 min/mark**. MCQs ≤ 20 min; never exceed 12 min on any 10-marker; reserve 40 min for Section C.

---

## 3. Top-10 Marks-per-Hour Skills (train in this order)

1. **Class diagram → C#/Java code translation** (8m midterm + 6m Section C; reappears with patterns). Mechanical once drilled.
2. **Scenario keywords → SOLID principle** + justification quoting the scenario (2+4m chain; MCQs too).
3. **Pattern recognition table** (§4 below) — scenario→pattern in one line (likely ~10–14 marks total across MCQ+structured).
4. **4+1 views table** (objective/diagrams/stakeholders/rationale) — a guaranteed-style 10-marker, pure recall.
5. **Singleton + Observer + Factory code skeletons from memory** — the three most-coded patterns in his slides.
6. **Scenario → architecture style + per-requirement evaluation** (2+4m, opens Section C; mapping table is finite).
7. **McCabe cyclomatic complexity computation** (both methods + threshold) — 4–6 quick marks if it appears.
8. **EVM calculation set** (EV/PV/SV/CV/SPI/CPI/EAC + interpretation) — formula-plug marks.
9. **Quality attributes + tactics definitions** (3m blocks + MCQ distractor immunity).
10. **Use-case relationship connectors** (include/extend/generalization/association) — 4m of pure notation recall.

---

## 4. PATTERN RECOGNITION MASTER TABLE (scenario → answer → justification)

| # | Scenario signal | Answer | One-line justification |
|---|---|---|---|
| 1 | "Exactly one instance... global access" (config, logger, registry) | **Singleton** | One controlled instance via private constructor + static access point |
| 2 | "Create different subtype based on runtime input/role" | **Factory** | Encapsulates instantiation; client gets abstraction, not concretes |
| 3 | "Families of related products that must stay consistent / swap whole theme" | **Abstract Factory** | One factory per family; swap family without changing client code |
| 4 | "Many optional parts, assembled step by step, fluent chaining" | **Builder** | Separates construction from representation; same process, different configurations |
| 5 | "Creation is expensive; copy a preconfigured object" | **Prototype** | Clone() an existing instance instead of rebuilding from scratch |
| 6 | "Legacy/third-party class has the WRONG interface; can't modify it" | **Adapter** | Converts adaptee's interface to the target the client expects |
| 7 | "Tree / part-whole / folders within folders / treat one and many uniformly" | **Composite** | Component-Leaf-Composite; composite recursively delegates to children |
| 8 | "One simple call hides a complex multi-class subsystem" | **Facade** | Unified higher-level interface making the subsystem easier to use |
| 9 | "Traverse a collection without exposing its internal structure" | **Iterator** | Sequential access via a uniform iterator interface, internals hidden |
| 10 | "When X changes, all dependents update automatically / subscribe" | **Observer** | One-to-many dependency; subject notifies registered observers' Update() |
| 11 | "Add new types WITHOUT modifying existing code" | **OCP** | Open for extension, closed for modification (extend via abstraction+polymorphism) |
| 12 | "Subclass replaces parent while preserving behavior/interface" | **LSP** | Subtypes substitutable for base without affecting correctness |
| 13 | "Forced to implement methods it never uses / fat interface" | **ISP** | Many client-specific interfaces beat one general-purpose interface |
| 14 | "One class changed by many teams for many reasons" | **SRP** | A class should have only one reason to change |
| 15 | "High-level logic hard-wired to a concrete DB/sender; want to swap" | **DIP** | Depend on abstractions, not concretions; inject the implementation |
| 16 | "Thousands of concurrent users; teams deploy features independently; partial failure tolerated" | **Microservices** | Independently deployable/scalable services; fault isolation |
| 17 | "Central shared data store used by many tools" | **Repository style** | Central data management component + worker components |
| 18 | "Independent specialists contribute partial solutions opportunistically (AI/expert system)" | **Blackboard** | Knowledge sources + controller around shared blackboard; no fixed sequence |
| 19 | "Data transformed through sequential stages (compiler/ETL/media)" | **Pipes-and-Filters** | Source→pipes→filters→sink; add/reorder filters freely |
| 20 | "UI app needing multiple synchronized views of the same data" | **MVC** | Model-View-Controller separation; views update when model changes (via Observer) |
| 21 | "Clients must reach many servers transparently, locations unknown" | **Broker** | Broker mediates client-server communication, decoupling locations |
| 22 | "Strict separation: presentation / business / data; portability" | **Layered** | Each layer serves the one above, uses the one below |
| 23 | "Immutable sequential verified transactions, no central authority" | **Blockchain** | Tamper-resistant decentralized data-flow ledger |
| 24 | "Complex nested if/else cause-effect rules" | **Decision table (Ch8)** | LEDT/EEDT formalize conditions×actions; reduces complexity |
| 25 | "Is this function too complex to test/maintain?" | **McCabe V(G) (Ch8)** | V(G)=e−n+2p or π+1; >10 → refactor |

---

## 5. Standing Orders for Answer Quality

1. **Count-matching:** "THREE (3)" = exactly three numbered points; extras waste time, missing ones lose marks.
2. **Quote the scenario** in every justification — his scenarios embed the marking keywords.
3. **Formula before substitution** in ALL calculations (EVM, McCabe, decision-table policies) — method marks survive arithmetic slips.
4. **UML by hand, standard notation:** hollow triangle = inheritance, dashed+triangle = realization, ◇/◆ aggregation/composition, <<include>>/<<extend>> labeled, visibility symbols on every member.
5. **Code answers:** always compile-grade — class headers, constructors, visibility keywords, `override`, return types. He marks per element.
6. **In compare questions, answer in a table** (Aspect | A | B) — mirrors his slides, fast to mark.
7. If unsure between two patterns, state the chosen one + the DISCRIMINATING signal ("Adapter, because the interface is incompatible — a facade would only simplify, not convert").

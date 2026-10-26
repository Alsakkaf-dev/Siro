# CH8 — Principles of Construction Design (Algorithmic Viewpoint, Styles, McCabe)
**Source:** Ch8 Sessions I (MODIFIED) + II pptx (old only — this IS the current material). Computation alert: McCabe cyclomatic complexity and decision tables are the most calculation-friendly questions in the whole course — easy marks if drilled.

---

## 0. Chapter Mental Model

Construction design = the LOWEST level of detailed design: designing the INSIDE of functions before coding them. Two viewpoints:
1. **Algorithmic viewpoint** (IEEE) — model the logic of operations dynamically: **flow-based** (flowcharts/activity diagrams), **state-based** (state diagrams), **table-based** (decision tables).
2. **Stylistic viewpoint** — rules for HOW code is written (formatting, naming, documentation) → consistency → readability → **modifiability/maintainability**.
Then EVALUATE the construction design: completeness, correctness, testability, maintainability — with **McCabe's cyclomatic complexity** as the quantitative tool.

One-liner: "design the algorithm, style the code, measure the complexity."

---

## 1. What is Construction Design?

- Transition design→construction should take **minimal effort**; some component designs are code-ready, others need finer-grained detail.
- Definition: **the lowest level of detailed design, addressing the modeling and specification of FUNCTION implementations** — mostly analysis and design of **algorithms**.
- Needed to evaluate quality at construction level: modifiability, testability, performance, complexity.
- The **algorithmic viewpoint** (IEEE term) = dynamic/behavioral perspective describing operations (methods/functions), internal details and logic of each design entity. Realized via: **Graphical designs** (flow-based, state-based) and **Tabular designs** (table-based). It minimizes complexity during construction by giving programmers the details they need.

**Why study it? (likely 3-mark "explain why")**
- *Algorithmic:* evaluate different implementations of a function BEFORE committing; assess completeness, complexity, testability, maintainability; analyze time-space performance and processing logic pre-implementation; graphical/tabular representation lets **non-programmers** join evaluation; reuse downstream — generate **unit test cases** (testing) and aid understanding (maintenance).
- *Stylistic:* common criteria for evaluating code structure quality → direct effect on **readability** → lower maintenance cost (low readability = higher cost); ensures correct code generation from models; blueprint for **consistency among developer teams**.

---

## 2. Flow-Based Construction Design

Systematic, graphical specification of an operation's logic and structure. Two tools:
- **Flowcharts** — classic boxes/diamonds.
- **UML Activity Diagrams** — same idea with richer constructs (when used for routine logic, "activity diagrams are just another version of flowcharts" — his slide).
Model sequential flows, decisions, loops, complex business logic. Elements to know: initial node (●), action, decision/merge (◇ with guards [x>0]), fork/join (concurrency bars), final node (◉).
```
 ● → [read order] → ◇ paid? ──yes──> [ship] → ◉
                       │no
                       v
                  [send invoice] → ◉
```
Use when: logic is a PROCESS (steps + branches + loops).

## 3. State-Based Construction Design

When operational logic is dictated by the **STATES a system exhibits** — certain activities only allowed in certain states — model as a **state machine** (UML state diagram): states (rounded boxes), transitions (arrows labeled event [guard] / action), initial/final pseudostates.
State diagrams typically model a whole system's behavior, but practically can design **one operation that executes the state machine** (e.g., a controller's `Run()` loop with a `switch` on current state).
```
 ● → [IDLE] --insertCard--> [AUTH] --pinOK--> [READY] --withdraw--> [DISPENSE] → ...
            <----------cancel/timeout-----------
```
Use when: words like "modes," "the system can only X after Y," lifecycle of an entity. (Ties to Ch2's airport example: VERIFYING→CHECKING→PAYING→ISSUING.)

## 4. Table-Based Construction Design (Decision Tables)

**Problem:** complex nested conditionals (cause→effect) are error-prone, hard to read/maintain. **Decision table** = structured way to formulate, evaluate, improve cause-effect logic.

**Four sections:**
```
 +----------------------+-------------------+
 | CONDITIONS           | CONDITION ENTRIES |   (all conditions | their value combos)
 +----------------------+-------------------+
 | ACTIONS              | ACTION ENTRIES    |   (all possible outcomes | which fire per combo)
 +----------------------+-------------------+
```
**Three types (Hurley):**
- **LEDT (Limited Entry):** conditions are **Boolean** (Y/N). Number of elementary policies = **2^n** (n = number of conditions). His example — phone discounts: store discount $15 (Y/N), manufacturer discount $30 (Y/N) → 4 policies: rules (Y,Y)→$45, (Y,N)→$15, (N,Y)→$30, (N,N)→$0.
```
 Conditions          R1  R2  R3  R4
 Store discount?      Y   Y   N   N
 Mfr discount?        Y   N   Y   N
 Actions
 Discount $45         X
 Discount $15             X
 Discount $30                 X
 Discount $0                      X
```
- **EEDT (Extended Entry):** condition/action text EXTENDS into the entry cells — entries hold values, not just Y/N (e.g., "Customer type?" → REG/PRE/VIP; "Credit?" → GOOD/BAD). Policies = **product of each condition's value count**: Π Vi. His example: 3 × 2 = **6 policies**.
- **MEDT (Mixed Entry):** combines both — some Boolean rows, some multi-valued rows.

**Why exam-gold:** his slides literally show "WRITE THE SOURCE CODE BASED ON THE GIVEN DECISION TABLE." Table→code pattern: either nested ifs per rule, or (his preferred punchline) **move the complexity INTO a lookup table** and compute a key:
```csharp
// table-based implementation: discounts indexed by condition bits
double[] discount = { 0, 30, 15, 45 };          // index = store*2 + mfr
int key = (storeDiscount ? 2 : 0) + (mfrDiscount ? 1 : 0);
return discount[key];                            // no nested ifs at all
```
"These are equivalent — notice how much simpler this version looks": table-based design → significantly LOWER complexity (and lower McCabe count).

---

## 5. Programming Design Language (PDL)

**PDL = pseudo-code using natural language** (not computer language, not graphics) to design internal function behavior.
- Easier to create, review, translate to code; "**comments-first approach**" to constructing code for ANY programming language.
- Write WITHOUT concern for the target language, but detailed enough that code generation needs minimal effort.
- Dual use: **design technique AND documentation** (his slide: function comment blocks come "straight from the PDL!").

## 6. Construction (Programming) Styles — the Stylistic Viewpoint

"Not about programming, but about defining rules/guidelines for everyone writing source code." Goal: **consistency, simplicity, clarity**. Big quality link: styles shape the **modifiability** attribute. Three convention families:
1. **Formatting conventions** — whitespace around binary operators/commas/semicolons; whitespace separating keywords/parentheses/braces; indentation in nested statements; matching opening/closing brackets; **inline vs new-line bracket placement**.
2. **Naming conventions** — differentiate program elements consistently → **self-documenting code**; teams understand each other's work; developers/testers/maintainers can make safe assumptions. (camelCase locals, PascalCase classes, _prefix privates, etc.)
3. **Documentation conventions** — what + how to document. KEY rule (favorite exam line): **comments should explain WHY code is written, not WHAT it does** (the "what" is inferable from good naming/syntax; the "why" is not). Also: document FILES (classification banner — classified/unclassified/company-sensitive; change log: who/why/when) and FUNCTIONS (header from PDL).

**Automated style checkers** (e.g., CheckStyle): enforce naming/formatting, parameter-count and line-length limits, required comments (Javadoc), mandatory headers, class-design good practices, duplicate-code detection, **cyclomatic complexity threshold checks**.

---

## 7. Quality Evaluation of Construction Design

Last design step before construction = **last chance to evaluate quality before code exists**. Minimum four attributes (apply to ALL projects):
- **Completeness & Correctness** — degree to which the design meets allocated requirements (complete-but-incorrect / correct-but-incomplete both fail). Evaluated via **peer reviews** (design reviews + code reviews; planned, multi-discipline, collective approval), **unit testing** (ultimate check — unit tests created AS designs are created; **test cases can be derived straight from use cases!**), **audits**.
- **Testability** — effort required to TEST artifacts of construction design.
- **Maintainability** — effort required to MAINTAIN a tested artifact. Also evaluated by **compliance with the project's programming style** (automated checkers).
Both testability & maintainability are commonly quantified via **cyclomatic complexity**, and goals can be turned into requirements based on it.

---

## 8. McCabe's Cyclomatic Complexity (THE calculation — drill until automatic)

Developed by **Thomas J. McCabe**; graph-theory measure of an operation's **decision structure** (NOT lines of code); quantitative justification for design decisions on **maintainability and testability**.

**Three equivalent computations:**
1. **Graph formula:** `V(G) = e − n + 2p` (e=edges, n=nodes/vertices, p=connected components, usually 1).
2. **Conditions count (Harlan Mills):** `C = π + 1`, where π = number of conditions:
   - each `if`, `while`, `for` = **1**
   - **compound** conditions (`if (x && y)`) = **2** (one per simple condition)
   - `case`/`switch` with n branches = **n − 1**
3. **Regions (Euler):** for a planar control graph, `C = r + 1`? No — careful: **regions enclosed by arcs + the outer region = complexity**, i.e., `C = r + 1` where r = enclosed regions (his slide: r=5 → Complexity = 6). [Equivalently total regions including the outside.]

**His worked examples (slide 21):**
- First flow: e=10, n=7, p=1 → V(G)= 10−7+2 = **5**; same program via switch: π = n−1 = 4 → C = 4+1 = **5**. ✓ agree
- Second flow: r=5 → C = 5+1 = **6**.
- Third flow: C = **11**.
**Threshold: V(G) ≤ 10 acceptable** (McCabe). Above 10 → split the function / simplify decisions (e.g., convert to table-based design!).

Worked mini-example to rehearse:
```csharp
if (a && b) x();        // π: 2
for (int i=0;i<n;i++)   // π: +1
    if (c) y();         // π: +1
switch(k){case 1:..case 2:..case 3:..}  // π: +2 (3 branches -1)
// π = 6  =>  C = 7  (≤10 OK)
```
Also remember: **V(G) = number of linearly independent paths = minimum number of unit test cases** for branch coverage — links complexity to TESTABILITY (why his agenda says "used to evaluate testability and maintainability").

---

## 9. Likely Exam Questions

1. *Define construction design and the algorithmic viewpoint; name its three realizations.* (flow/state/table)
2. *Given code or flow graph → compute cyclomatic complexity by 2 methods; state acceptability vs threshold 10.*
3. *Build a decision table (LEDT) from a discount/eligibility scenario; state the number of policies (2^n or ΠVi); write the code from the table.*
4. *Differentiate LEDT vs EEDT vs MEDT.*
5. *What is PDL and why "comments-first"?*
6. *Name the three construction style convention types; why do comments explain WHY not WHAT?*
7. *How are completeness/correctness evaluated?* (peer reviews, unit tests from use cases, audits)
8. *When choose state-based over flow-based modeling?* (logic dictated by states/modes)

---

## 10. Top Traps

1. `V(G) = e − n + 2p` — the **+2p** (not +p, not −2p). With p=1, V(G)=e−n+2.
2. Compound condition = **2 units**; switch with n branches = **n−1**, not n. Most marks die here.
3. Complexity counts the **decision structure, not LOC** — long straight-line code has C=1.
4. Regions method: count enclosed regions **plus the outer region** (his r=5 → C=6).
5. LEDT policies = **2^n**; EEDT = **product of value counts** — don't use 2^n for EEDT.
6. WBS-style confusions: decision TABLE sections are Condition / Action / Condition Entry / Action Entry — four sections, two lists + two matrices.
7. Comments document **WHY** (rationale), naming conventions document **WHAT** — reversing this loses the documentation-convention mark.
8. Construction design evaluation happens **before code exists** (reviews on designs) — unit tests verify once code exists; both belong in the answer.
9. Styles shape **modifiability/maintainability**, not performance.
10. Threshold 10 is a GUIDELINE "based on McCabe's work" — quote it as such.

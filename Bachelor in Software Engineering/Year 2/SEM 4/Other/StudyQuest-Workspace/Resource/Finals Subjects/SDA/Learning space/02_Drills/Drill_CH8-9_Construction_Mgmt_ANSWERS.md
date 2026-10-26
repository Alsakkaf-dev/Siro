# ANSWERS — Drill CH8–9 Construction + Management

**Q1. B.** Lowest level of detailed design; models/specifies FUNCTION implementations (algorithm analysis & design — IEEE "algorithmic viewpoint").

**Q2.** (4 marks)
1. **Flow-based** (flowcharts / UML activity diagrams) — best when logic is a sequential PROCESS with branches and loops (e.g., order processing routine).
2. **State-based** (UML state diagrams) — best when behavior is dictated by the STATES/modes the system exhibits; certain activities only legal in certain states (e.g., ATM session, ticket lifecycle).
3. **Table-based** (decision tables) — best when logic is dense CAUSE-EFFECT conditionals (many combined conditions → actions), where nesting would be error-prone (e.g., discount/eligibility rules).
(1m per name+situation, 1m completeness.)

**Q3.** (6 marks) Count π:
- `if (age > 60 && member)` — compound: **2**
- `for` loop — **1**
- `while` loop — **1**
- `switch` with 4 branches — n−1 = **3**
- `if (member)` — **1**
π = 2+1+1+3+1 = **8** → **C = π + 1 = 9**.
Acceptable: **yes, 9 ≤ 10** (McCabe's threshold) — though close; consider table-driven simplification of the switch.
(Marks: each construct counted correctly ×5 = 4m fractioned, total formula 1m, threshold judgment 1m.)

**Q4.** (4 marks)
(a) V(G) = e − n + 2p = 12 − 9 + 2(1) = **5**.
(b) Euler/regions: enclosed regions r satisfies C = r + 1 → r = **4** enclosed regions (5 total counting the outer region).
(c) V(G) = number of linearly independent paths = the MINIMUM number of test cases needed for branch/path coverage → quantifies TESTABILITY (his agenda: complexity used to evaluate testability & maintainability).

**Q5.** (6 marks)
(a) LEDT (conditions are Boolean):
```
 CONDITIONS              R1   R2   R3   R4
 Member?                  Y    Y    N    N
 Purchase > RM100?        Y    N    Y    N
 ACTIONS
 20% discount             X
 10% discount                  X
 5% discount                        X
 No discount                             X
```
(b) Policies = **2^n = 2^2 = 4** (LEDT rule: n Boolean conditions → 2^n elementary policies).
(c)
```csharp
double[] rate = { 0.00, 0.05, 0.10, 0.20 };          // index = member*2 + over100
int key = (isMember ? 2 : 0) + (total > 100 ? 1 : 0);
double discount = total * rate[key];
```
(Moving the complexity into the table = his slides' exact teaching; nested-if equivalent accepted but note "table version has lower cyclomatic complexity.")

**Q6.** (4 marks — 1 per component+activity)
1. **Planning** — scoping (WBS + budgeting) and organizing (LRC, scheduling/Gantt); develop the plan to finish within schedule/budget.
2. **Execution/Implementation** — monitoring & controlling against the plan (Gantt + EVM); most effort and most deliverables happen here.
3. **Termination** — verify smooth transition to construction: store latest design docs per configuration management, update schedule/cost values, re-evaluate plans, report to upper management.
4. **Leadership & Ethics** — leading by example, ethical conduct; affects the effectiveness of managing every stage.

**Q7.** (8 marks) Formulas first (method marks):
- % complete = 2/8 = 25% → **EV = 25% × 16,000 = RM4,000**
- **PV** = 4 months should mean 4 tasks × 2,000 = **RM8,000**
- **AC = RM6,000** (given)
- **SV = EV − PV** = 4,000 − 8,000 = **−RM4,000** (behind schedule)
- **CV = EV − AC** = 4,000 − 6,000 = **−RM2,000** (over budget)
- **SPI = EV/PV** = 4,000/8,000 = **0.50**
- **CPI = EV/AC** = 4,000/6,000 = **0.667**
- **EAC = AC + (BAC − EV)/CPI** = 6,000 + 12,000/0.667 = 6,000 + 18,000 = **RM24,000** (= BAC/CPI = 16,000/0.667)
Interpretation: the project is severely behind schedule (SPI 0.5 — progressing at half the planned rate) and over budget (CPI 0.667 — only RM0.67 of value earned per ringgit spent); at this performance the project will cost ≈RM24,000, RM8,000 over BAC. Management should trigger risk-mitigation now (re-scope, re-staff, or re-baseline) to return to the budgeted path or minimize losses.
(1m per parameter ≈6m, 2m interpretation.)

**Q8.**
(a) (2m) WBS = a **hierarchical breakdown of a project into smaller, manageable components** (SOW → tasks → subtasks → work packages); purpose: simplify planning/tracking, assign responsibilities. Evaluation criteria: **scope accuracy** (tasks only — no durations/precedence/skills), **completeness** (all necessary tasks), **level of detail** (granular enough to estimate effort).
(b) (2m) With good naming conventions the code already self-documents WHAT it does; the RATIONALE (why this approach, why this constant, why not the obvious alternative) cannot be inferred from syntax — so comments must record the WHY to cut maintenance cost and preserve design intent.
(c) (2m) **Position power** (from hierarchy) — sub-types: reward power, coercive power. **Personal power** (from behavior) — sub-types: expert power, connection power.

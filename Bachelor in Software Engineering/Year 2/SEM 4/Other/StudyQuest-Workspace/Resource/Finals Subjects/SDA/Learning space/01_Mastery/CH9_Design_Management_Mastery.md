# CH9 — Software Design Management, Leadership & Ethics (Framework, WBS, EVM)
**Source:** "Chapter 9.1 - Software Design Management (NEW).pdf" + old Sessions I–III. EVM is the only NUMERIC question Ch9 can produce — his slides contain a fully worked example (Sara's project). Expect: framework stages, WBS definition/purpose, EVM calculation, leadership/ethics short notes.

---

## 0. Chapter Mental Model

Design doesn't manage itself. This chapter = running the DESIGN PHASE as a project:
**Design Management Framework = Planning → Execution/Implementation → Termination, wrapped by Leadership & Ethics** (the wrapper affects the effectiveness of managing EVERY stage).
Plan with WBS + budget + LRC + Gantt; control execution with EVM numbers; terminate by handing a clean baton to construction.

**Definitions (his slide):**
- *Software design* = transforming functional and non-functional requirements into models that describe a technical solution. It's a **complex decision problem**: many possible designs; engineers must decide to achieve goals most effectively.
- *Management* = activities directed at an organization's **resources** to achieve goals **efficiently and effectively**. Activities: **planning & decision making, organizing, leading, controlling**. Resources: **human, financial, physical, information**.
- *Design management* (design phase) = activities required to efficiently create **quality design artifacts within schedule and budget constraints**. (Software Design + Management Practices = Software Design Management.)

---

## 1. The Design Management Framework (4 components — HIS diagram)

```
            +-----------------------------+
            |     Design Management       |
  Planning ─┤        Framework            ├─ Termination
            |   Execution/Implementation  |
            +--------------+--------------+
                           |
                  Leadership & Ethics   (underpins all stages)
```

### 1.1 Planning (initial) stage — two objectives
1. Achieve a **clear understanding of the tasks** to be accomplished and the **resources** necessary.
2. Develop a **plan to complete tasks within schedule and budget constraints**.
Two key functions: **Scoping** (identify tasks + develop budget → WBS, Budgeting) and **Organizing** (responsibility assignments + scheduling → LRC, Gantt/network diagrams). Also: **establish change control policy**.

### 1.2 Execution/Implementation stage
- Where **most effort** is employed, **most deliverables** are achieved (completed design documents), and **percent completion is highest**.
- Managerial core: **monitoring & controlling** that activities follow the plan (schedule + budget): identify deviations → correct them timely to avoid major future problems.
- Tools: **Gantt charts** and **Earned Value Management (EVM)**.

### 1.3 Termination stage
Verify everything is in place for a **smooth transition into code construction**:
- Latest design document versions **securely stored per configuration management** procedures
- **Update schedule and cost** current values
- **Re-evaluate schedule/budget plans** based on the design phase's performance measures
- **Communicate results to upper management**

### 1.4 Leadership & Ethics
"Leadership and good ethical conduct are important factors that affect the effectiveness of managing each lifecycle stage." (Details §4.)

---

## 2. Planning Tools

### 2.1 Work Breakdown Structure (WBS)
- **Definition (new slide):** a **hierarchical breakdown of a project into smaller, manageable components**. Purpose: **simplifies planning and tracking; helps assign responsibilities**.
- Old-slide detail: represent the project (graphically or list) modularized into task activities. Flow: **SOW (statement of work — main objectives) → tasks → subtasks → work packages**. Helps reach **milestones** (= specific events at specific points in time; e.g., completion of architectural design, detailed design, documentation).
- **WBS evaluation criteria:** **Scope accuracy** (a breakdown into tasks and NOTHING else — no precedence, durations, or personnel skills; each element = an activity consuming time/effort), **Completeness** (all tasks needed), **Level of detail** (granular enough to estimate effort per task).
```
 Design Project
 ├─ 1. Architectural Design
 │   ├─ 1.1 Define views      ├─ 1.2 Evaluate styles
 ├─ 2. Detailed Design
 │   ├─ 2.1 Class design      ├─ 2.2 Interface design
 └─ 3. Documentation
     ├─ 3.1 SDD draft         └─ 3.2 Review & sign-off
```

### 2.2 Budgeting
- **Estimating project cost = a forecasting problem** (uncertain parameters). Strategy: **cost each WBS element**.
- **Direct costs** — directly tied to design development: **labor, equipment** (HW/SW). **Indirect costs** — fringe benefits, administrative expenses.
- Staffing cost is hardest: software tasks are **non-repetitive** and involve **learning rates** (new tech/unfamiliar skills) — account for them. Use historical data + experienced personnel input. Once approved, the budget becomes a **control mechanism** (cost threshold).

### 2.3 Linear Responsibility Chart (LRC)
- **Tabular representation of task assignments**: rows = WBS tasks, columns = staff; cells mark who is **responsible**, who **reviews/supports**. Outcome: clear understanding of each member's role per WBS element.

### 2.4 Scheduling — Gantt charts & network diagrams
- Scheduling = **establishing task durations to convert the WBS into an operating timetable**; identifies **critical activities** (cannot delay without delaying the project) and slack activities; orders tasks by predecessors (predecessor = task that must finish before another starts).
- **Gantt chart** = graphical representation of logical flow between tasks and their durations; very simple to follow (bars on a calendar).

---

## 3. EARNED VALUE MANAGEMENT (EVM) — the calculation bank

**Definition (his slide):** project management technique to determine progress of tasks based on **the value of work currently completed VERSUS the work that was expected to be completed at that particular time**.

**Parameters & equations:**
| Symbol | Name | Meaning / formula |
|---|---|---|
| **BAC** | Budget At Completion | total planned budget |
| **PV** | Planned Value | budgeted cost of work SCHEDULED by now |
| **EV** | Earned Value | **% work completed × planned total cost** (budgeted cost of work PERFORMED) |
| **AC** | Actual Cost | what was actually spent so far |
| **SV** | Schedule Variance | **EV − PV** (negative = behind schedule) |
| **CV** | Cost Variance | **EV − AC** (negative = over budget) |
| **SPI** | Schedule Performance Index | **EV / PV** (<1 behind) |
| **CPI** | Cost Performance Index | **EV / AC** (<1 over budget; "$ of earned value per $ spent") |
| **EAC** | Estimate At Completion | **AC + (BAC − EV)/CPI** (= BAC/CPI when current performance continues) |

EV estimation is the crux: hard because tasks are complex, % completion subjective, and **workers tend to INFLATE % complete** to look on-track (guidelines exist, e.g., 0/100 or 50/50 crediting).

**HIS WORKED EXAMPLE (Sara — reproduce this cold):**
10 tasks, $1,000 each → **BAC = $10,000**; 1 task/month → planned 10 months (task = 10% of project). At **month 5**: only **3 tasks complete**, **AC = $4,000**.
- **EV** = 30% × 10,000 = **$3,000**
- **PV** = 5 tasks × 1,000 = **$5,000** (5 months should mean 5 tasks)
- **SV** = EV − PV = 3,000 − 5,000 = **−$2,000** (behind schedule)
- **CV** = EV − AC = 3,000 − 4,000 = **−$1,000** (over budget)
- **SPI** = 3,000/5,000 = **0.60** · **CPI** = 3,000/4,000 = **0.75** ("only $0.75 of earned value per dollar actually spent" — his exact sentence)
- **EAC** = AC + (BAC−EV)/CPI = 4,000 + 7,000/0.75 = 4,000 + 9,333 = **$13,333** (equivalently BAC/CPI = 13,333) → ≈ **$3,333 over** BAC.
  - NOTE: his slide narration says "EAC shows an estimated **$6,333 over budget** amount." With the standard Meredith & Mantel formulas above, EAC−BAC = $3,333. In the exam, SHOW YOUR FORMULA AND WORKING — marks follow the method. (If his table defines EAC differently, the working still earns the marks.)
- Conclusion sentence to write: project is over BOTH budget and schedule; these alarming values let management implement **risk mitigation** to recover the budget path or minimize losses.

---

## 4. Leadership & Ethics (short-note bank)

**Traits & personality:** traits = personal characteristics (e.g., highly sociable; achievement = goes the extra mile); the combination of traits = **personality**, which drives decisions; good decision-making = core of effective leadership.

**Big Five personality dimensions** (know all five + the correlation ranking):
1. **Agreeableness** — getting along: friendly, sociable, compassionate.
2. **Surgency** — dominance: want control, enjoy competition, willing to confront (weak surgency → followers).
3. **Adjustment** — emotional stability: in control, positive, good under pressure (weak → unstable, negative, poor under pressure).
4. **Conscientiousness** — achievement: extra hours, sacrifices for objectives.
5. **Openness to experience** — flexible to change, open-minded, tries new things.
Correlation with leadership (70+ studies): **surgency highest 0.31 → conscientiousness 0.28 → openness 0.24 → agreeableness 0.08**.

**Ethical leadership:** ethics = **set of moral principles to distinguish right from wrong behavior**; positively correlates with leadership effectiveness; lead by example — the leader sets the tone. Challenge: risk of rejection/loss → overcome by **focusing on a higher purpose** and finding **support from other ethical people**; conform to and discuss company ethics guidelines.

**Power** = the POTENTIAL influence leaders have over others (it's the **perception** of power that influences). Two sources:
- **Position power** (hierarchy): **Reward power** (influence via things of value — performance evaluations) and **Coercive power** (punishment / withholding rewards).
- **Personal power** (behavior): **Expert power** (skill/knowledge — stronger as similar experts get scarcer) and **Connection power** (relationships with influential people).

**Key leadership skills (4):**
1. **Communication** — most of a manager's time; effective = info equally and fully understood by all parties; plan message/goal/timing/medium/venue. **Five-step oral process:** develop rapport → state objective → transmit → perceive receiver's understanding (ask questions/read expressions) → get commitment. Written: content + structure; outline main points; short, simple, to the point; have others review.
2. **Networking** — building relationships through effective communication; facilitates meeting objectives; improvable with practice.
3. **Motivation** — motivation correlates with productivity; **hierarchy-of-needs theory** (5 levels of needs motivating employees).
4. **Negotiation** — **Principled negotiation (4 guidelines):** (1) separate the PEOPLE from the PROBLEM; (2) focus on INTERESTS not positions; (3) GENERATE OPTIONS before agreement; (4) insist on OBJECTIVE criteria.

**Ethics in software design:** engineers must abide by the highest standards — principle groups: **Public & Product** (act in the public interest; product meets highest professional standards), **Judgment** (integrity and independence in professional judgment), **Management** (ethical management and promotion of ethical approach). (From the SE Code of Ethics framing in his Session III.)

---

## 5. Likely Exam Questions

1. *Describe the design management framework and its four components, with key activities of each stage.* (the 8–10 mark banker for Ch9)
2. *Define WBS + purpose + its three evaluation criteria.*
3. *EVM calculation:* given BAC, months, tasks done, AC → compute EV, PV, SV, CV, SPI, CPI, EAC and INTERPRET (over/under budget/schedule + recommendation). Sara's numbers may return with different values.
4. *Differentiate direct vs indirect costs; why is budgeting "a forecasting problem"? what are learning rates?*
5. *What is an LRC / Gantt chart / milestone / predecessor?*
6. *List the Big Five dimensions; which correlates most with leadership?* (surgency)
7. *Explain position vs personal power with the four sub-types.*
8. *State the four guidelines of principled negotiation / five-step oral communication process.*
9. *Why are leadership and ethics part of a DESIGN management framework?* (they affect effectiveness of every stage)

---

## 6. Top Traps

1. **SV = EV − PV and CV = EV − AC** — EV comes FIRST in both. Negative = bad (behind/over).
2. **SPI = EV/PV, CPI = EV/AC** — dividing by the wrong denominator flips your conclusion.
3. PV is what SHOULD be done by now; EV is the value of what IS done; AC is what it COST. Three different dollars — label them.
4. EAC uses CPI: **AC + (BAC−EV)/CPI**; write the formula before substituting (method marks).
5. Most effort + most deliverables = **implementation** stage, NOT planning.
6. Termination ≠ end of project — it's the transition INTO construction (configuration management of design docs!).
7. WBS contains **tasks only** — no durations, no precedence, no staff skills (that's scheduling/LRC) — his scope-accuracy criterion tests exactly this.
8. Milestones are **events at points in time**, not tasks with duration.
9. Power is about **perception** of potential influence — quote that nuance.
10. Don't confuse **surgency** (dominance) with conscientiousness (achievement) — surgency is the leadership-correlation winner (0.31).

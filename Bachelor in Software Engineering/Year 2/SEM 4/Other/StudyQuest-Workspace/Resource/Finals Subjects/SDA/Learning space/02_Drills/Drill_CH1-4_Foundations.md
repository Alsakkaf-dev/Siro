# DRILL — CH1–4 Foundations (12 Questions, Midterm Style)
Answer on paper under time pressure. Target: 50 minutes. Marks mirror the midterm sample's allocation style. Answers in `Drill_CH1-4_Foundations_ANSWERS.md`.

---

## Part A — MCQ (1–4, 2 marks each)

**Q1.** Which of the following best describes the focus of software architecture compared to detailed design?
A. Architecture focuses on functional requirements; detailed design on non-functional requirements.
B. Architecture focuses mostly on non-functional (quality) requirements; detailed design focuses on functional requirements.
C. Both focus equally on coding standards.
D. Architecture is performed after detailed design.

**Q2.** A module reads and modifies the internal data of another module directly. This is an example of:
A. Data coupling   B. Common coupling   C. Content coupling   D. Functional cohesion

**Q3.** A startup needs an AI-based medical diagnosis system where independent specialist modules (imaging analyzer, lab-result analyzer, patient-history analyzer) each contribute partial conclusions to a shared working dataset under the coordination of a controller, with no fixed order of operation. The most suitable architectural style is:
A. Pipes-and-Filters   B. Blackboard   C. Client-Server   D. Layered

**Q4.** In a UML use case diagram, the relationship `Checkout --<<include>>--> Authenticate User` means:
A. Authenticate User MAY be executed when Checkout runs.
B. Authenticate User MUST be executed when Checkout runs.
C. Checkout is a specialization of Authenticate User.
D. Authenticate User extends Checkout optionally.

---

## Part B — Structured Questions

**Q5.** (6 marks) Describe any THREE (3) common design challenges faced during software design.

**Q6.** (6 marks) A legacy ERP system suffers from high coupling and low cohesion. Explain the relationship between coupling and cohesion, and suggest ONE design strategy to improve the system structure. Justify your choice.

**Q7.** (4 marks) UML diagrams are categorized into two types. Name BOTH categories, state what aspect of the system each captures, and give TWO example diagrams for each.

**Q8.** (4 marks) Based on the use case diagram below, explain the specification of ALL FOUR relationship connectors (1), (2), (3), (4).
```
            +----------- Online Banking System -----------+
   Customer -----(1)----- (Transfer Funds)
      ^                       |  --(2)--<<include>>--> (Verify OTP)
      |(4)                    |
   Premium Customer        (Convert Currency) --(3)--<<extend>>--> (Transfer Funds)
            +---------------------------------------------+
```

**Q9.** (8 marks) Write the FULL code (C# or Java) that can be generated from the class diagram below:
```
 +---------------------------+        +---------------------------+
 |        <<abstract>>       |        |         Invoice           |
 |          Payment          |        +---------------------------+
 +---------------------------+        | -invoiceId: int           |
 | #amount: double           |        | -total: double            |
 +---------------------------+        +---------------------------+
 | +Payment(amount: double)  |        | +Invoice(id: int)         |
 | +Process(): void {abstract}|       | +AddPayment(p: Payment): void
 +---------------------------+        +---------------------------+
        ^                ^                        |
        |                |                        | (association: Invoice has many Payments,
 +--------------+  +--------------+               |  multiplicity 1 --> *)
 | CardPayment  |  | CashPayment  |               v
 +--------------+  +--------------+            Payment
 | -cardNo: string |                |
 +--------------+  +--------------+
 | +Process(): void| +Process(): void|
 +--------------+  +--------------+
```

**Q10.** (10 marks) Describe the application of the 4+1 architectural view model in software design documentation. For EACH view, state its primary objective, the UML diagrams used, and its intended stakeholders.

**Q11.** (3+3 marks)
(a) Identify and describe THREE (3) quality attributes in software design and architecture.
(b) Identify and explain THREE (3) main tasks in the process of developing software architectures.

**Q12.** (2+4+6 marks) A national e-hailing platform must: handle millions of concurrent ride requests; let separate teams update pricing, matching, and payment features independently without redeploying the whole system; keep accepting rides even if the loyalty-points module crashes.
(a) Suggest the most suitable architectural style.
(b) Evaluate how the style addresses EACH stated requirement.
(c) Sketch a class/component diagram reflecting the style for this scenario (boxes and arrows acceptable; label the modules from the scenario).

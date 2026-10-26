# DRILL — CH8–9 Construction Design + Design Management (8 Questions)
Target: 40 minutes. Calculation questions: ALWAYS write the formula first, then substitute. Answers in `Drill_CH8-9_Construction_Mgmt_ANSWERS.md`.

---

**Q1.** (2 marks, MCQ) Construction design is best described as:
A. The first activity of the design process, focusing on quality attributes.
B. The lowest level of detailed design, modeling and specifying function implementations.
C. The process of deploying compiled binaries.
D. A technique for eliciting requirements.

**Q2.** (4 marks) Name the THREE realizations of the algorithmic viewpoint and state, for each, ONE situation where it is the best choice.

**Q3.** (6 marks) Compute the cyclomatic complexity of this function using the **conditions method (C = π + 1)**, showing the count for every contributing construct, and state whether it is acceptable by McCabe's threshold:
```csharp
public string Categorize(int age, bool member, int points) {
    if (age > 60 && member)            // ...
        return "GoldSenior";
    for (int i = 0; i < points; i++)   // ...
        Accumulate(i);
    while (points > 100)               // ...
        points -= 100;
    switch (age / 10) {
        case 1: return "Teen";
        case 2: return "Twenties";
        case 3: return "Thirties";
        case 4: return "Forties";
    }
    if (member) return "Member";
    return "Guest";
}
```

**Q4.** (4 marks) A control-flow graph of a routine has **e = 12 edges, n = 9 nodes, p = 1** connected component. (a) Compute V(G) with the graph formula. (b) The same routine's planar control graph encloses how many regions? (c) State what V(G) means for unit testing.

**Q5.** (6 marks) A bookstore grants: 20% discount if the customer is a member AND the purchase is over RM100; 10% if member only; 5% if purchase over RM100 only; otherwise none.
(a) Construct the Limited Entry Decision Table (LEDT). (b) State the number of elementary policies and the rule that produced it. (c) Write compact C# implementing the table (lookup-style preferred).

**Q6.** (4 marks) State the FOUR components of the design management framework and ONE key activity for each.

**Q7.** (8 marks) A design project has **8 tasks, each budgeted at RM2,000, each planned to take 1 month** (BAC = RM16,000, planned duration 8 months). At the end of **month 4**, only **2 tasks are complete**, at an actual cost of **RM6,000**.
Compute: EV, PV, SV, CV, SPI, CPI, and EAC. Interpret the results for upper management in two sentences (schedule + budget + recommended action).

**Q8.** (6 marks)
(a) Define WBS and list its three evaluation criteria. (2m)
(b) Explain why comments should describe WHY rather than WHAT, per documentation conventions. (2m)
(c) Name the two main sources of leader power and one sub-type of each. (2m)

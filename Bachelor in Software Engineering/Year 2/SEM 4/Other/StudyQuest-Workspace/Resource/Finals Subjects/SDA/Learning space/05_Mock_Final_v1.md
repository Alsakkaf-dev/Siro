# MOCK FINAL v1 — SCSE2233 Software Design and Architecture
**Format mirrors the only available sample (SECJ3323 midterm): 100 marks, 2 hours.**
Instructions: Answer ALL questions in the answer booklet. All diagrams must use UML standard notation, drawn by hand. Time budget: Section A ≤ 20 min · Section B ≤ 55 min · Section C ≤ 40 min · 5 min check.

---

## SECTION A — MULTIPLE CHOICE QUESTIONS (20 Marks)

**1.** A developer adds support for a new "BNPL" payment option by writing a new class that implements the existing `IPaymentMethod` interface. No existing class is edited. Which principle is being applied?
A. Single Responsibility Principle
B. Open-Closed Principle
C. Interface Segregation Principle
D. Dependency Inversion Principle

**2.** Which of the following best states the purpose of the Singleton pattern?
A. To create families of related objects without specifying concrete classes.
B. To construct complex objects step by step.
C. To ensure a class has only one instance and provide a global point of access to it.
D. To convert the interface of a class into another interface clients expect.

**3.** A report generator must assemble reports with optional charts, optional appendices, an optional executive summary, and varying export targets, then return the finished report object. The most suitable pattern is:
A. Prototype   B. Builder   C. Facade   D. Iterator

**4.** A new analytics engine expects `ISensor.GetReading()`, but the factory's existing hardware library only provides `HwLib.PollRaw()` and cannot be modified. Which pattern integrates the library?
A. Facade   B. Composite   C. Adapter   D. Observer

**5.** In a stock-trading dashboard, fifteen widgets must refresh automatically whenever the `Portfolio` object's value changes, without `Portfolio` knowing their concrete classes. Which pattern applies, and which method does `Portfolio` call?
A. Observer; Update() on each registered observer via Notify()
B. Iterator; Next() on each widget
C. Mediator; Route() on the message bus
D. Observer; Attach() on each widget when the value changes

**6.** A function contains: one `if` with a compound condition (`a && b`), one `while` loop, and one `switch` with 3 case branches. Its cyclomatic complexity (C = π + 1) is:
A. 5   B. 6   C. 7   D. 4

**7.** A design project reports CPI = 0.8. This means:
A. The project is ahead of schedule by 20%.
B. For every dollar actually spent, only $0.80 of earned value was received.
C. The project budget will be underspent by 20%.
D. 80% of tasks are complete.

**8.** Which UML diagram pair belongs to the STRUCTURAL category?
A. Sequence and Activity diagrams
B. Use Case and State Machine diagrams
C. Class and Component diagrams
D. Communication and Timing diagrams

**9.** An online learning platform requires that the video-lecture service stays available even when the quiz and badge services fail, and that each feature team deploys updates independently. Which architectural style best satisfies these needs?
A. Layered   B. Repository   C. Microservices   D. Pipes-and-Filters

**10.** An architect introduces a redundant standby server with a watchdog timer. Which quality attribute is primarily being addressed?
A. Usability   B. Availability   C. Portability   D. Testability

---

## SECTION B — STRUCTURED QUESTIONS (48 Marks)

### Question 1 (16 Marks)
a) Design patterns can be categorized into THREE (3) classifications. Name each classification, describe its concern, and give ONE example pattern for each. (6 Marks)
b) Differentiate between the Factory pattern and the Abstract Factory pattern in terms of purpose, number of products, and flexibility. (4 Marks)
c) The university requires a single, globally accessible `ExamConfigManager` that stores exam settings consistently across all modules, created only when first needed and safe for concurrent access. Draw the UML class diagram of the appropriate pattern AND write the full C# (or Java) code implementing it. (6 Marks)

### Question 2 (16 Marks)
a) State the GoF intent of the Observer design pattern, and explain why observers are "almost always used within the MVC architecture." (4 Marks)
b) Based on Figure 1, write the FULL code (C# or Java) that can be generated from the class diagram. (8 Marks)
```
Figure 1:
                <<abstract>>
               StorageItem
        +--------------------------+
        | +GetSizeKB(): int        |  {abstract}
        | +Add(item: StorageItem): void  {virtual: throws}
        +--------------------------+
                ^                ^
   +------------------+   +---------------------------+
   |   FileItem       |   |        FolderItem         |
   +------------------+   +---------------------------+
   | -sizeKB: int     |   | -children: List<StorageItem> (composition ◆, *)
   +------------------+   +---------------------------+
   | +FileItem(s:int) |   | +Add(item): void          |
   | +GetSizeKB(): int|   | +GetSizeKB(): int  (sums all children)
   +------------------+   +---------------------------+
```
c) The Adapter design pattern is applied using a step-by-step approach. List the THREE (3) steps, naming the participants involved in each step. (4 Marks)

### Question 3 (16 Marks)
a) The design management framework consists of FOUR (4) components. Name each component and state ONE key activity performed in it. (4 Marks)
b) A software design project consists of 5 tasks, each budgeted at RM3,000 and planned to take one month (BAC = RM15,000, planned duration 5 months). At the end of month 3, only 1 task is fully complete, at an actual cost of RM4,500. Calculate EV, PV, SV, CV, SPI, CPI and EAC, and interpret the project's status for upper management. (8 Marks)
c) Using the conditions method (C = π + 1), compute the cyclomatic complexity of the function below, showing the contribution of every construct, and state whether it meets McCabe's acceptability threshold. (4 Marks)
```csharp
public double ComputeFee(int hours, bool student, int day) {
    double fee = 0;
    if (hours > 2 && hours <= 8)  fee = hours * 2.0;
    for (int i = 0; i < hours; i++) Log(i);
    switch (day) {
        case 1: fee *= 0.5; break;
        case 6: fee *= 1.5; break;
        case 7: fee *= 2.0; break;
    }
    if (student) fee *= 0.8;
    return fee;
}
```

---

## SECTION C — PROBLEM SOLVING (32 Marks)

**Project Description**
"MediSync" is a national hospital appointment and telemedicine platform. It must serve tens of thousands of concurrent patients booking appointments, attending video consultations, receiving e-prescriptions, and paying bills. Independent teams maintain the Booking, Video-Consultation, Billing, Pharmacy, and Notification features, and each team must be able to release updates without redeploying the whole platform. The platform must keep accepting bookings and consultations even if the Pharmacy or Notification modules are temporarily down.

**Quality Attributes**
- Scalability: handle growing patient numbers and concurrent video sessions.
- Availability: core booking/consultation continues despite partial module failures.
- Modifiability: new payment providers and notification channels integrate easily.
- Performance: responsive booking and low-latency consultation setup.

**System Behaviors**
- The Billing engine is designed for extension: developers can add new payment providers (FPXProvider, CardProvider, EWalletProvider) without altering the existing billing engine logic, and any provider subclass can replace another while preserving the expected behavior and interface.
- When an appointment's status changes (confirmed, rescheduled, cancelled), all registered channels — mobile app, SMS gateway, email service, and the doctor's dashboard — must be notified and updated automatically, without the appointment object knowing their concrete classes.

a) Based on the project description and requirements, analyze and suggest a suitable architectural style for the platform. (2 marks)
b) Evaluate the suggested architectural style: discuss how it addresses EACH of the four quality attributes. (4 marks)
c) Design and draw the class/component diagram illustrating the suggested architectural style for MediSync, reflecting the modules named in the scenario. (8 marks)
d) Based on the System Behaviors, identify the detailed-design principle(s) described in behavior 1 AND the design pattern described in behavior 2. (2 marks)
e) Evaluate and justify your answers in (d), quoting the behavior phrases that signal them. (4 marks)
f) Design and draw the class diagram(s) illustrating the principle(s) and pattern identified in (d), applied to the billing and notification features. (6 marks)
g) Evaluate and write the full code (C# or Java) that can be generated from the class diagram drawn in (f). (6 marks)

— QUESTIONS END —

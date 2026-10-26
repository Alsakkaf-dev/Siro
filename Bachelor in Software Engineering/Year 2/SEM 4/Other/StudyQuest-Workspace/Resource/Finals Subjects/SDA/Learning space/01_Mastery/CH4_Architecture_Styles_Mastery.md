# CH4 — Architectural Styles (Old + New Catalog, System-Type Mapping)
**Source:** Chapter 4.pdf + "Chapter 4 - Styles in Architecture (NEW).pdf" (both new) + old Sessions I–III (style details). This chapter is the engine of the Section C scenario question: "analyze and suggest a suitable architectural style... evaluate... draw the class diagram of it." The sample's video-streaming scenario was answered with styles from THIS chapter.

---

## 0. Chapter Mental Model

Don't architect from scratch — REUSE proven shapes. A style is a named, documented, system-wide shape with known quality consequences. The selection logic the exam wants:
**System TYPE + required QUALITY ATTRIBUTES → Architectural STYLE.**
That three-column mapping table from his slides is the answer key to every "suggest a style" question.

**Style vs Pattern (his NEW slide — definitional question bait):**
| | Architectural STYLE | Architectural PATTERN |
|---|---|---|
| Definition | **High-level structure** for organizing components and interactions; a general blueprint/strategy | **Detailed solutions to specific, recurring design problems** within a context; works within/across styles to refine the design |
| Focus | **System-wide organization** — how components interact with each other and the environment | Solution to a design problem **within a structure defined by a style** |
| Examples | Client-Server, Layered, Microservices, Event-Driven | Facade, Factory, Singleton, Observer |
| Answers questions like | "Tightly or loosely coupled? Centralized or distributed?" | "How should data flow between modules? How do we ensure a single instance?" |

(Buschmann: "every architectural style can be described as an architectural pattern"; design patterns are medium-scale and don't change the fundamental system structure.)
Styles/patterns give: **Generic view** (standard diagrams), **Solutions** (complete), **Understood** (easy to grasp) — reuse beats invention ("solution a million times over, without doing it the same way twice" — Alexander).

---

## 1. System Types (the input of the selection logic)

Classic five: **Data-Centered, Data-Flow, Distributed, Interactive, Hierarchical.**
Extra three (his NEW slide):
| System type | Description |
|---|---|
| **Real-Time** | Responds to events/inputs within a specified timeframe; stringent timing constraints |
| **Embedded** | Specialized computing inside larger systems/devices; often real-time, limited resources |
| **Adaptive** | Changes behavior/structure based on internal/external conditions; learns, adjusts, optimizes over time |

---

## 2. THE OLD ARCHITECTURAL MAP (memorize this table — it IS the exam)

| # | System Type | Architecture Pattern | Quality Attributes |
|---|---|---|---|
| 1 | **Data-centred** | **Blackboard** (and Repository) | Modifiability, Maintainability, Reusability |
| 2 | **Data flow** | **Pipes and Filters** (and Blockchain) | Efficiency, Modifiability, Extensibility, Maintainability, Reusability, Security |
| 3 | **Distributed** | **Client-Server**, **Broker** | Interoperability, Modifiability, Availability, Reusability |
| 4 | **Interactive** | **MVC** | Modifiability, **Usability**, Reusability |
| 5 | **Hierarchy** | **Layered** (and Main-Program-&-Subroutine) | Modifiability, **Portability**, Reusability, Security |

## 3. THE NEW ARCHITECTURAL MAP

| # | System Type (combos) | Architecture Pattern | Quality Attributes |
|---|---|---|---|
| 1 | Distributed + Interactive + Component-based | **Service-Oriented Architecture (SOA)** | Interoperability, Modifiability, Maintainability, Availability, Reusability |
| 2 | Data flow + Distributed + Interactive + Component-based + Web Services | **Microservices**, **Serverless**, **Event-Driven**, **Hybrid** | Efficiency, Modifiability, Extensibility, Maintainability, Reusability, Security |
| 3 | Hierarchy + Interactive + Component-based | **Modular Monolith** | Modifiability, Portability, Reusability, Maintainability, Availability, Security |

**New-slide mapping (System Types → Suitable Styles):** Data Centred → Blackboard, Repository · Data Flow → Pipe-and-Filter, Blockchain · Distributed → Client-Server, Microservices, Blockchain · Interactive → Layered, Microservices, MVC · Hierarchical → Layered, Component-Based.

---

## 4. Style-by-Style (structure + how it works + when to choose)

### 4.1 Data-Centered: Repository / Blackboard
Decomposed around a **central repository of data**: a **data management component** (controls, provides, manages access to data) + **worker components** (do work based on the data). Communication = **one-to-one bidirectional** worker↔data-manager; workers NEVER talk to each other directly. Issues to handle: data integrity, protocols, transactions & recovery (roll-back), security.
```
        [Worker1]   [Worker2]   [Worker3]
            \           |           /
             \          |          /
            +---------------------+
            |  Data Management /  |
            |  Repository (DB)    |
            +---------------------+
```
- **Repository:** passive data store; workers act on it. Key benefits (his slide): **Decoupling** (data access logic separated from business logic), **Testability** (mock repositories), **Centralized data access** (single point → simpler maintenance). Data centers use it for efficient management, security, quick retrieval for distributed apps.
- **Blackboard:** repository + **controller/mediator** that assigns control; independent **knowledge-source** components contribute **partial solutions opportunistically** (no predetermined sequence of operations). Analogy: scientists sharing one blackboard, a mediator grants the chalk, each scientist advances the solution using what others wrote, until no more progress = solution. **Best for expert systems / AI / complex problems with no deterministic solution path.** Deployment caveat: logical view doesn't show where agents/blackboard reside; distribution adds communication complexity.
- **Choose Repository vs Blackboard:** repository = passive shared data (e.g., databases, IDE toolsets); blackboard = active collaborative solving (e.g., speech recognition, scheduling AI).

### 4.2 Data-Flow: Pipes-and-Filters (+ Blockchain as modern data-flow)
System organized around **transporting and transforming data streams**. Components: **Worker** = transformations (encrypt/decrypt, compress/decompress, format change binary→XML, enhance/modify/store), **Transport** = movement (inter-process: sockets, serial, pipes; intra-process: direct function call).
**Pipes-and-Filters participants:** **Data Source** (produces data) → **Pipes** (connections source→filter, filter→filter, filter→sink) → **Filters** (process/enhance/modify data) → **Data Sink** (consumer).
```
 (Source) ==pipe==> [Filter1] ==pipe==> [Filter2] ==pipe==> (Sink)
```
Classic example: **language processor/compiler** (lexer → parser → semantic analyzer → code gen). His richer example: YouTube video identity system: VideoManager → FaceDetection → FaceRecognition → IdentityManager, with pipes realized via the file system + FileSystemWatcher events (components register for directory monitoring; new file event triggers next filter). Lesson: pipes can be ANY transport mechanism — flexibility of styles.
Qualities: efficiency (streaming, parallelizable filters), modifiability/extensibility (add/swap/reorder filters), reusability (filters independent), security (transformations like encryption stages).
- **Blockchain (modern data-flow):** data processed **sequentially, securely, immutably**; transparent, tamper-resistant, verifiable flow through a **decentralized network**; handles transactional data flows in real time (cryptocurrency).

### 4.3 Distributed: Client-Server and Broker
Distributed systems = multiple processes collaborating **through a network** (also relevant on one multi-core node!). Forms: client processes delegating work to remote servers; or **peer nodes** with similar capabilities (music sharing). Spot them by **multiple physical nodes** in deployment. Examples: internet systems, web services, file-sharing, HPC.
- **Client-Server:**
```
 [Client1] ──┐
 [Client2] ──┼──> [   Server   ]   (clients request; server provides services,
 [Client3] ──┘     centralized data/control)
```
  Qualities: interoperability, centralized control/data access, reusability of server services. **Limitation (sample MCQ #7): server becomes a BOTTLENECK / single point of failure → low scalability** despite maintainability.
- **Broker:** in plain client-server, clients are **tightly coupled** to servers — painful when services live on many servers at many locations. The **Broker mediates**: clients access services of multiple servers **transparently, without knowing server locations or communication details** (separation of concerns → flexibility + interoperability). Brokers can talk to **other brokers** for services they don't manage.
```
 [Client] ──> [ BROKER ] ──> [Server1]
                  │    \────> [Server2]
                  └──> [Broker2] ──> [Server3]
```
  His example: home with 2 DVRs (family room, bedroom) accessed from an office PC browser; broker routes requests to the right DVR; async request/response messaging (request disk space → async response). Qualities: modifiability (add/move servers without touching clients), availability, interoperability.
- **Choose Client-Server vs Broker:** few well-known servers → C/S; many/located-anywhere/changing servers → Broker.

### 4.4 Interactive: MVC
Interactive systems = user interfaces; two prime qualities: **Usability + Modifiability**. MVC decomposes into:
- **Model** — application data + core logic; notifies views of data changes.
- **View** — presentation/UI; renders the model; multiple views of the same data (table + pie chart + bar chart all update when data changes).
- **Controller** — handles user input; translates it into operations on the model and selects/updates views.
```
   User input ──> [Controller] ──updates──> [Model]
                       │                       │ change notification
                       └──selects──> [View] <──┘ (View reads Model state)
```
His NEW-slide Java sketch (translate to C# trivially):
```csharp
public class Model {
    private string data = "Initial Data";
    public string GetData() => data;
    public void SetData(string d) { data = d; }
}
public class View {
    public void DisplayData(string data) => Console.WriteLine("Data: " + data);
}
public class Controller {
    private Model model; private View view;
    public Controller(Model m, View v) { model = m; view = v; }
    public void HandleInput(string data) {
        model.SetData(data);
        view.DisplayData(model.GetData());
    }
}
// Main: new Controller(new Model(), new View()).HandleInput("Updated Data");
```
Why ideal for interactive systems: **Views can be updated/modified easily without affecting Model/Controller** (separation of concerns). Variations: Document-View (Microsoft, view+controller fused), Process-Abstraction-Controller; adapted for the web (JavaScriptMVC, Backbone).

### 4.5 Hierarchical: Layered (+ Main Program & Subroutine, Modular Monolith)
System structured as hierarchy; each **layer has a specific role**; **topmost layers rely on services of lower layers** → separation of concerns, modularity, ease of maintenance.
```
 +----------------------------+
 |  Presentation Layer        |   calls ↓ only
 +----------------------------+
 |  Business Logic Layer      |
 +----------------------------+
 |  Data Access Layer         |
 +----------------------------+
```
His code sketch (C#-ified):
```csharp
public class DataAccessLayer {
    public string FetchData() => "Fetched Data";
}
public class BusinessLogicLayer {
    private DataAccessLayer dal;
    public BusinessLogicLayer(DataAccessLayer d) { dal = d; }
    public string ProcessData() => "Processed " + dal.FetchData();
}
public class PresentationLayer {
    private BusinessLogicLayer bll;
    public PresentationLayer(BusinessLogicLayer b) { bll = b; }
    public void DisplayData() => Console.WriteLine("Displaying: " + bll.ProcessData());
}
```
Qualities: modifiability, **portability** (swap a layer, e.g., new DB → only data layer changes), reusability, security (control at each layer). Cost: performance overhead through layers.
- **Main Program & Subroutine:** classic structured decomposition — main program calls subroutines top-down. Simple, for procedural systems.
- **Modular Monolith (new):** single deployable but strictly modular internally; hierarchy+interactive+component-based; qualities incl. maintainability, portability, security.

### 4.6 The NEW styles (one-paragraph each — definition + when)
- **SOA:** system as **services** with standardized contracts (often enterprise service bus); for **distributed+interactive+component-based** enterprise integration; qualities: interoperability (#1), modifiability, maintainability, availability, reusability.
- **Microservices:** collection of **autonomous, independently deployable** small services communicating over a network; each performs a specific function. Why for distributed systems: services **independently scaled, tested, deployed** → handles large request volumes, meets scalability demands. (Sample MCQ #8: choose microservices over blackboard/repository based on **frequency of updates and deployment independence**.) His Java example: OrderService calls InventoryService.checkInventory() then PaymentService.processPayment() → "Order Confirmed".
- **Serverless:** functions run on demand in cloud-managed infrastructure; no server management; auto-scaling; pay-per-use.
- **Event-Driven:** components communicate by **emitting/consuming events** asynchronously (producers, brokers/buses, consumers); great decoupling, extensibility, real-time reactivity.
- **Hybrid:** combination of styles to balance trade-offs (most real systems).

---

## 5. Scenario→Style Selection Logic (Section C survival kit)

Signal words → style:
| Scenario signals | Pick |
|---|---|
| Central shared data, many tools/apps reading-writing it | **Repository** |
| Complex problem, no deterministic algorithm, independent knowledge sources cooperate (AI/expert system) | **Blackboard** |
| Stream of data through sequential transformation stages (compile, ETL, media processing) | **Pipes-and-Filters** |
| Immutable, sequential, verifiable transactions, decentralized trust | **Blockchain** |
| Many users requesting services from a central provider | **Client-Server** |
| Clients must reach MANY servers transparently, locations unknown/changing | **Broker** |
| UI-heavy app, multiple views of same data, usability+modifiability | **MVC** |
| Clear hierarchy of concerns (UI / logic / data), portability, security boundaries | **Layered** |
| Independent teams, independent deployment/scaling of features, fault isolation, thousands of concurrent users | **Microservices** |
| Enterprise integration of heterogeneous existing systems via service contracts | **SOA** |
| Loose coupling via async notifications, modules react to occurrences | **Event-Driven** |
| Modular but single deployment, small team, simpler ops | **Modular Monolith** |

**The sample's video-streaming scenario answer:** signals were "thousands of concurrent viewers" (scalability), "independent teams enhance features without interfering" (independent deployment), "service continues if analytics/recommendation down" (availability/fault isolation) → **Microservices** (layered also defensible but weaker). Evaluation = map EACH quality attribute in the question to a property of the style, one by one. Then class diagram = one class per service/module (ContentManagement, StreamingEngine, Recommendation, User, Analytics, AdminInterface) with associations to an API gateway/orchestrator — reflect the modules NAMED in the scenario.

**Answer template for "(a) suggest (2m), (b) evaluate (4m)":**
(a) Name style + 1 sentence: "Microservices, because the system is a distributed, feature-modular platform requiring independent deployment and scaling."
(b) 4 bullets, each = requirement→style property: Performance→each service scaled/cached independently, CDN service isolated; Scalability→horizontal scaling per service; Availability→fault isolation, one service down ≠ system down; Modifiability→new codec/algorithm = new/updated service behind stable interface, no core change.

---

## 6. Likely Exam Questions

1. *Differentiate architectural style vs architectural pattern (vs design pattern).*
2. *Given scenario → suggest style + justify against each quality attribute + draw class/component diagram of it.* (Section C pattern, ~14m)
3. *MCQ: client-server limitation = server bottleneck; microservices criterion = deployment independence.*
4. *Fill/recall mapping: system type → style → quality attributes (old + new tables).*
5. *Explain Blackboard components and why it suits expert systems.*
6. *Explain Pipes-and-Filters participants with example (compiler).*
7. *Why does Broker reduce coupling vs plain client-server?*
8. *MVC: name the three components and responsibilities; why usability+modifiability?*
9. *Write code from the layered/MVC class diagram* (his slides contain full code — fair game).

---

## 7. Top Traps

1. **Style = system-wide; design pattern = within-subsystem.** Don't cite Singleton as an architectural style or Microservices as a design pattern.
2. Blackboard ≠ Repository: blackboard adds a **controller** and **opportunistic** knowledge sources; repository is passive storage.
3. In data-centered systems **workers never talk directly to each other** — all via the data manager.
4. Pipes are **components too** (transport) — naming only filters loses marks.
5. Client-server's weakness is the **server bottleneck**, not "no separation of concerns" (sample distractor).
6. Broker's point is clients **don't know server locations** — if you say "broker stores the data," wrong.
7. MVC: **Controller handles input; View displays; Model holds data+logic.** Controller ≠ "the brain that stores data."
8. Layered: dependencies point **downward only**; upper layer uses lower layer's services, never the reverse.
9. Distributed ≠ always many machines — multi-core single node counts (his slide).
10. In "suggest a style" answers, ALWAYS tie justification to the quality attributes LISTED in the scenario — generic praise earns nothing.

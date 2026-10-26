# CH6 — Creational Design Patterns (Singleton, Factory, Abstract Factory, Builder, Prototype)
**Source:** "Chapter 6 - Creational Method in Architecture Design Pattern (NEW).pdf" — all code below is from HIS slides (already C#, Sarkar-aligned). This is prime final-exam ground: scenario→pattern, code completion, comparison tables.

---

## 0. Chapter Mental Model

Creational patterns answer ONE question: **who creates objects, and how, so the rest of the system doesn't care?**
His definition: *concerned with object creation mechanisms, aiming to make the system **independent of how objects are instantiated**; deals with class instantiation and object composition; provides flexibility in creating objects, ensuring proper initialization and object reuse.* They manage/simplify creation focusing on **flexibility, scalability, reusability**, and **decouple the creation process from the system** → easier to maintain and extend (this is OCP applied to `new`).

The five, in one breath (HIS comparison table — memorize verbatim):
| Pattern | Key Purpose | Example Use Case |
|---|---|---|
| **Singleton** | Single instance for global access | Configuration manager or logging system |
| **Factory** | Creates objects dynamically | User controllers based on roles |
| **Abstract Factory** | Creates families of related objects | Product catalog and their UI views |
| **Builder** | Builds complex objects incrementally | Order creation with configurable options |
| **Prototype** | Clones existing objects | User preferences or UI themes |

Selection reflex: ONE shared instance→Singleton · type decided at runtime from input→Factory · FAMILIES that must match→Abstract Factory · many optional parts, step-by-step→Builder · copying is cheaper than building→Prototype.

---

## 1. SINGLETON

**Problem:** several parts of the system need the SAME configuration/log/connection object; naive design lets anyone `new` it → multiple inconsistent instances, wasted memory.
**Why naive fails:** no control point; two ConfigurationManagers can hold different settings; global consistency impossible.
**Pattern:** make the constructor **private**, hold a **private static instance**, expose a **public static access point** that lazily creates it once.
- Purpose (his slide): ensures a class has **only one instance** and provides a **global access point**.
- Use when: managing global state, configuration settings, logging systems.
- Advantages: saves memory, ensures consistency, controlled access, lazy initialization.
- Disadvantages: **hard to test, may introduce tight coupling** (hidden global dependency).

**Structure:**
```
 +-----------------------------+
 |         Singleton           |
 |-----------------------------|
 | -instance: Singleton {static}|
 | -Singleton()   <<private>>  |
 | +GetInstance(): Singleton {static}
 +-----------------------------+
        client --> Singleton.GetInstance()
```
**His code (thread-safe, verbatim from slides):**
```csharp
public class ConfigurationManager {
    private static ConfigurationManager _instance;
    private static readonly object _lock = new object();
    private Dictionary<string, string> _settings = new();

    private ConfigurationManager() { }                  // nobody else can new it

    public static ConfigurationManager GetInstance() {
        lock (_lock) {                                  // thread safety
            if (_instance == null)
                _instance = new ConfigurationManager(); // lazy: created on first use
        }
        return _instance;
    }
    public string GetSetting(string key) => _settings.ContainsKey(key) ? _settings[key] : null;
    public void SetSetting(string key, string value) => _settings[key] = value;
}
```
**Analogy:** a country has ONE government — whoever asks for "the government" gets the same one.
**Vs siblings:** Singleton controls HOW MANY; the others control WHICH TYPE/HOW ASSEMBLED. They combine: factories are often singletons.
**MVC location / microservices (his summary table):** Controller or Model — global objects (config, DB connections, session managers); in microservices: service registry, logging, centralized config.

---

## 2. FACTORY (Factory Method)

**Problem:** client must create different `UserController` types depending on a runtime role string. Naive: `if (role=="Admin") new UserAdmin(); else if...` scattered through client code.
**Why naive fails:** instantiation logic duplicated everywhere; adding a role means hunting every if-chain (OCP violation); client welded to concrete classes.
**Pattern:** one factory class/method encapsulates creation; client receives the abstract type.
- Purpose: creates objects **without exposing the instantiation logic**; defines an interface for creating objects, letting subclasses/branches decide the type.
- Use when: create objects **dynamically based on input** (e.g., user roles).
- Advantages: simplifies creation, reduces duplication, promotes loose coupling.
- Disadvantages: **limited scalability for FAMILIES of related objects** (that's Abstract Factory's job); changes require modifying the factory method.

**Structure:**
```
                 <<abstract>>
                UserController            (Product)
              +HandleRequest()
              +DisplayRole()
                 ^          ^
        UserAdmin          UserCustomer   (Concrete Products)

  [CreateUserFactory] ---creates---> UserController
  +CreateUser(role): UserController
  Client --> factory.CreateUser("Admin")
```
**His code:**
```csharp
public abstract class UserController {
    public abstract void HandleRequest();
    public abstract void DisplayRole();
}
public class UserAdmin : UserController {
    public override void HandleRequest() => Console.WriteLine("Handling admin-specific request...");
    public override void DisplayRole()  => Console.WriteLine("Role: Admin");
}
public class UserCustomer : UserController {
    public override void HandleRequest() => Console.WriteLine("Handling customer-specific request...");
    public override void DisplayRole()  => Console.WriteLine("Role: Customer");
}
public class CreateUserFactory {
    public UserController CreateUser(string role) {
        return role switch {
            "Admin"    => new UserAdmin(),
            "Customer" => new UserCustomer(),
            _ => throw new ArgumentException("Invalid role specified")
        };
    }
}
// Client: var user = new CreateUserFactory().CreateUser("Admin");
//         user.HandleRequest(); user.DisplayRole();
```
Participants (his slide's wording): **Factory class** = CreateUserFactory (encapsulates creation logic by role) · **Product interface** = UserController (common interface) · **Concrete products** = UserAdmin/UserCustomer · **Client** uses the factory, never `new`s products.
**Analogy:** restaurant counter — you say "burger", the kitchen decides which station builds it; you never enter the kitchen.
**Vs siblings:** Factory = ONE product hierarchy chosen at runtime. Abstract Factory = SEVERAL hierarchies that must be consistent. Builder = same type but complex assembly. Prototype = creation by copy.
**MVC/microservices:** Controller decides which service class to instantiate from input/route; in microservices, picks the implementation (DB client, message broker) dynamically.

---

## 3. ABSTRACT FACTORY

**Problem:** product FAMILIES — male fashion line (MaleShirt+MalePant) vs female line (FemaleShirt+FemalePant). Client must never mix MaleShirt with FemalePant.
**Why naive fails:** with one plain factory per product, nothing enforces family consistency; if-chains multiply per product type.
**Pattern:** an abstract factory declares one creation method PER PRODUCT; each concrete factory builds the whole consistent family.
- Purpose: provides an interface for creating **families of related or dependent objects without specifying their concrete classes**.
- Advantages: **ensures consistency among related objects**, promotes scalability; **families can be swapped without changing client code**.
- Disadvantage: more complex — many interfaces/classes.

**Structure:**
```
              <<abstract>> FashionFactory
              +CreateShirt(): Shirt
              +CreatePant():  Pant
                 ^                    ^
   MaleFashionFactory        FemaleFashionFactory
   creates MaleShirt+MalePant   creates FemaleShirt+FemalePant

   <<abstract>> Shirt                <<abstract>> Pant
   +DisplayInfo()                    +DisplayInfo()
      ^        ^                        ^        ^
  MaleShirt FemaleShirt             MalePant FemalePant
```
**His code (condensed, same classes):**
```csharp
public abstract class Shirt { public abstract void DisplayInfo(); }
public abstract class Pant  { public abstract void DisplayInfo(); }

public class MaleShirt : Shirt   { public override void DisplayInfo() => Console.WriteLine("This is a male shirt."); }
public class FemaleShirt : Shirt { public override void DisplayInfo() => Console.WriteLine("This is a female shirt."); }
public class MalePant : Pant     { public override void DisplayInfo() => Console.WriteLine("This is a male pant."); }
public class FemalePant : Pant   { public override void DisplayInfo() => Console.WriteLine("This is a female pant."); }

public abstract class FashionFactory {
    public abstract Shirt CreateShirt();
    public abstract Pant  CreatePant();
}
public class MaleFashionFactory : FashionFactory {
    public override Shirt CreateShirt() => new MaleShirt();
    public override Pant  CreatePant()  => new MalePant();
}
public class FemaleFashionFactory : FashionFactory {
    public override Shirt CreateShirt() => new FemaleShirt();
    public override Pant  CreatePant()  => new FemalePant();
}
// Client: FashionFactory f = new MaleFashionFactory();
//         f.CreateShirt().DisplayInfo(); f.CreatePant().DisplayInfo();
```
**Analogy:** IKEA showroom themes — pick "Scandinavian" and every piece you order (sofa, table, lamp) comes from that matching family.
**Factory vs Abstract Factory (HIS table — a guaranteed compare question):**
| Aspect | Factory | Abstract Factory |
|---|---|---|
| Purpose | Single product/type | **Families** of related/dependent objects |
| Products | One product or closely related types | Family of related products |
| Complexity | Simpler | More complex (multiple interfaces/classes) |
| Example | UserController (Admin/Customer) | ElectronicsProduct, FashionProduct + views |
| Scalability | Limited for related products | Scalable for families |
| Dependency | Relies on subclassing | Relies on interfaces + multiple factories |
| Flexibility | Changes modify the factory method | **Swap whole family without touching client** |
**MVC/microservices:** Model — families of related entities (different DB connection types); factories for API clients/middleware that must match.

---

## 4. BUILDER

**Problem:** an `Order` with items, gift wrap, delivery method... constructors explode: `new Order(items, true, "Express", null, ...)` (telescoping constructor), unreadable and error-prone.
**Why naive fails:** many optional/mandatory attributes → either dozens of constructor overloads or a half-initialized object mutated everywhere.
**Pattern:** a Builder collects configuration **step by step** (fluent chaining), then `Build()` produces the finished object.
- Purpose: constructs complex objects **step by step with varying configurations**; **separates construction from representation** so the same process creates different results.
- Use when: objects with **many optional or mandatory attributes** (orders, reports).
- Advantages: control over the creation process; readability; encourages immutability.
- Disadvantages: extra builder classes → more complexity.

**Structure:**
```
 [Client] -> [OrderBuilder]                    [Order]
              +AddItem(i): OrderBuilder        -items -giftWrap -deliveryMethod
              +SetGiftWrap(b): OrderBuilder    +DisplayOrder()
              +SetDeliveryMethod(m): OrderBuilder
              +Build(): Order   ──creates──────────^
   builder.AddItem("Laptop").SetGiftWrap(true).SetDeliveryMethod("Express").Build()
```
**His code:**
```csharp
public class Order {
    private List<string> items = new List<string>();
    private bool giftWrap;
    private string deliveryMethod;
    public void SetItems(List<string> i) { items = i; }
    public void SetGiftWrap(bool g) { giftWrap = g; }
    public void SetDeliveryMethod(string m) { deliveryMethod = m; }
    public void DisplayOrder() {
        Console.WriteLine("Order Summary:");
        Console.WriteLine("Items: " + string.Join(", ", items));
        Console.WriteLine("Gift Wrap: " + (giftWrap ? "Yes" : "No"));
        Console.WriteLine("Delivery Method: " + deliveryMethod);
    }
}
public class OrderBuilder {
    private List<string> items = new List<string>();
    private bool giftWrap = false;
    private string deliveryMethod = "Standard";

    public OrderBuilder AddItem(string item)        { items.Add(item); return this; }  // chaining
    public OrderBuilder SetGiftWrap(bool g)         { giftWrap = g;    return this; }
    public OrderBuilder SetDeliveryMethod(string m) { deliveryMethod = m; return this; }

    public Order Build() {
        Order order = new Order();
        order.SetItems(items);
        order.SetGiftWrap(giftWrap);
        order.SetDeliveryMethod(deliveryMethod);
        return order;
    }
}
```
**Analogy:** Subway sandwich — you state bread, fillings, sauce step by step; the finished sandwich is handed over only at the end.
**Vs siblings:** Builder varies the CONFIGURATION of one complex product; Abstract Factory varies the FAMILY; Factory just picks a subtype. `return this;` (method chaining) is the Builder's signature in code-completion questions.
**MVC/microservices:** Model constructs complex responses/queries/view-models; building API/pipeline/deployment configuration objects.

---

## 5. PROTOTYPE

**Problem:** creating a configured user (permissions, preferences) is expensive/repetitive; thousands of similar FreeUsers needed.
**Why naive fails:** rebuilding from scratch repeats costly setup; client must know every concrete class and all its init details.
**Pattern:** objects implement `Clone()`; new instances are produced by **copying a prototype**; swap the prototype to change what gets produced.
- Purpose: creates new objects by **cloning existing ones** (copying an existing object instead of building from scratch).
- Use when: object creation is **expensive** and similar objects are reused (user preferences, UI themes).
- Advantages: avoids resource-heavy creation, efficient cloning, simplifies initialization, improves performance.
- Disadvantages: **deep cloning can be complex and error-prone** (objects referencing other objects).

**Structure:**
```
        <<abstract>> FreeUser            (Prototype)
        +Clone(): FreeUser
        +Permission()
           ^               ^
 FreeUserViewer      FreeUserEditor      (Concrete prototypes: Clone() returns a copy of self)
 
 [CollabCanvas] o--- prototype: FreeUser
 +CreateNewFreeUser(): FreeUser  { return prototype.Clone(); }
```
**His code:**
```csharp
public abstract class FreeUser {
    public abstract FreeUser Clone();        // implemented by subclasses
    public abstract void Permission();
}
public class FreeUserViewer : FreeUser {
    public override FreeUser Clone() => new FreeUserViewer();
    public override void Permission() => Console.WriteLine("Permission: Viewer - Can only view content.");
}
public class FreeUserEditor : FreeUser {
    public override FreeUser Clone() => new FreeUserEditor();
    public override void Permission() => Console.WriteLine("Permission: Editor - Can view and edit content.");
}
public class CollabCanvas {                  // client holding the prototype
    private FreeUser prototype;
    public CollabCanvas(FreeUser prototype) { this.prototype = prototype; }
    public FreeUser CreateNewFreeUser() => prototype.Clone();
}
```
Dynamic switching (his slide): change the prototype inside CollabCanvas → it now mass-produces a different user type, no other code changes.
**Analogy:** photocopying a filled-in form instead of re-writing it for every new person.
**Vs siblings:** Prototype creates FROM AN INSTANCE (copy); the rest create from a CLASS. Choose it when state-to-copy is the point or construction cost dominates.
**MVC/microservices:** Model clones sessions/cached objects/templates; replicate stateful service instances, request templates, session state in distributed systems.

---

## 6. The Master Summary (his final table — appears tailor-made for an exam question)

| Pattern | Description | Advantages | Location in MVC | In Microservices |
|---|---|---|---|---|
| Singleton | One instance + global access point | Controlled access, lazy init, low memory | Controller/Model: config, DB connections, session managers | Service registry, logging, config management |
| Factory Method | Interface for creating objects; subclasses alter the created type | Simple creation, loose coupling | Controller: pick service class from input/route | Choose implementation (DB client, broker) dynamically |
| Abstract Factory | Families of related objects w/o concrete classes | Consistency among related objects, scalability | Model: families of related entities | Factories for API clients/middleware families |
| Builder | Separate construction from representation; same process, different results | Handles complexity, readability, immutability | Model: responses, queries, view models | Config/pipeline/deployment-manifest building |
| Prototype | Copy an existing object instead of from-scratch | Avoids heavy creation, efficient cloning | Model: sessions, cache, templates | Replicate stateful instances, request templates |

---

## 7. Likely Exam Questions

1. *Scenario→pattern + justification:* "system must have exactly one logging service" (Singleton); "create admin/customer controllers from login role" (Factory); "UI must render a consistent dark/light family of widgets" (Abstract Factory); "orders with optional gift wrap, delivery, items" (Builder); "onboard 1000 users with identical default preferences" (Prototype).
2. *Compare Factory vs Abstract Factory* (his table).
3. *Code completion:* fill in `GetInstance()` body; add a `return this;` chain step in a builder; implement `Clone()` in a new subclass; add a case to the factory `switch`.
4. *Draw the class diagram of pattern X* and *generate full code from it* (his slides literally pair diagram+code — same as midterm Q2c flow).
5. *Advantages/disadvantages of each pattern* (his Purpose/When/Adv/Disadv slide format).
6. *Where does pattern X live in MVC / how is it used in microservices?* (his summary table is unique to his slides — high-probability source).

---

## 8. Top Traps

1. Singleton needs **all three**: private constructor + private static instance + public static accessor. Forgetting `private` on the constructor = no marks for "ensures one instance."
2. In thread-safe Singleton, the null-check happens **inside the lock** (his code) — copying it outside without a second check is a bug.
3. Factory's weakness (his slide): **doesn't scale to families** — if the question mentions "matching/related sets," upgrade to Abstract Factory.
4. Abstract Factory's selling line: **swap entire family without changing client code** — use that phrase.
5. Builder's `Build()` returns the product; the chained setters return **the builder** (`return this`). Mixing the two breaks the fluent chain.
6. Prototype: `Clone()` is declared in the abstract base, implemented in EVERY subclass; the client (`CollabCanvas`) calls `prototype.Clone()` — it never `new`s concrete users.
7. Shallow vs deep clone: copying references ≠ copying objects — his stated disadvantage, quote it.
8. Don't say "Factory pattern ensures one instance" — that's Singleton. Purposes are one-liners; keep them straight.
9. "Creational" = about INSTANTIATION. If the scenario is about interface mismatch or notification, you're in Ch7 territory — don't force a creational answer.

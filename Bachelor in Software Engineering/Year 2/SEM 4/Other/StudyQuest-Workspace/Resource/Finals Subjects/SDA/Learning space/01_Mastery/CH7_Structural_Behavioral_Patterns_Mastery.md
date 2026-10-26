# CH7 — Structural & Behavioral Design Patterns (Adapter, Composite, Facade, Iterator, Observer)
**Source:** Chapter 7.1 NEW PDF (structural + category summary, C# code) + old Session II pptx (Iterator/Observer with GoF intents + steps) + lecturer's C# txt notes (Adapter/Composite/Facade/Iterator/Observer). Five patterns, all with HIS C# code. With Ch6's five, you carry TEN patterns into the final.

---

## 0. Chapter Mental Model + The Three Categories (his summary slide — likely direct question)

- **Creational** = "adding new object with repetitive procedure steps/methods" → manage INSTANTIATION.
- **Structural** = "integration action... adding new component with different procedure/method" → **composition and organization of classes/objects into larger structures**, optimizing flexibility, scalability, reuse. (How things FIT TOGETHER.)
- **Behavioral** = "system behavior toward data, communication and interaction between objects, normally indirectly triggered by user action" → **how objects collaborate/communicate** with loose coupling and responsibility delegation. (How things TALK.)

GoF context: 23 patterns, Gamma/Helm/Johnson/Vlissides 1994. His covered set: Structural = Adapter, Composite, Facade · Behavioral = Iterator, Observer (others NOT covered but namable: Command, Chain of Responsibility, Interpreter, Mediator, Memento, State, Strategy, Template Method, Visitor).
Behavioral patterns "encapsulate behavior with objects, assign responsibility, and manage object cooperation... making systems independent of specific behavior, which becomes replaceable."

Selection reflex for the five:
- incompatible interface, legacy/3rd-party reuse → **Adapter**
- tree, part-whole, "treat single and group uniformly" → **Composite**
- complex subsystem, "one simple entry point" → **Facade**
- traverse a collection without exposing internals → **Iterator**
- one change → many auto-notified dependents → **Observer**

---

## 1. ADAPTER (structural)

**Problem:** the new system expects interface `Target`, but a useful existing class (`Adaptee` — legacy/outsourced/3rd-party) has a DIFFERENT interface. You cannot or should not modify either.
**Why naive fails:** rewriting the adaptee duplicates tested code; editing client code to special-case the adaptee violates OCP and couples you to its details.
**Pattern (his slide):** *Converts the interface of a class into another interface that clients expect, enabling classes with incompatible interfaces to work together.*
**Pros:** reuse existing code WITHOUT modification; flexibility by decoupling systems. **Cons:** extra layers (performance), more complexity.

**His 3 design steps (quotable):**
1. Identify the **source and destination interfaces** needing adapting (Target and Adaptee — e.g., Character and SpecialCharacter).
2. Add an **Adapter class that REALIZES the Target interface and implements it in terms of the Adaptee** — realization to Target + **association to Adaptee**.
3. Wherever Target objects are expected, Adapter objects can now be used.

**Structure:**
```
 [Client] ---> <<interface>> Target          (e.g., Character)
                  + Request()
                       ^ realizes
                  [Adapter] ◇---------------> [Adaptee]   (the class being adapted,
                  + Request() {                 + SpecificRequest()   e.g., legacy API)
                      adaptee.SpecificRequest(); }
```
**C#-style sketch (lecturer's Meat example, condensed):**
```csharp
// Adaptee — legacy API with an incompatible interface
class MeatDatabase {
    public float GetSafeCookTemp(string meat, TemperatureType t) { /* lookup */ return 145f; }
    public int GetCaloriesPerOunce(string meat) { /* lookup */ return 71; }
}
// Target — what the new system works with
class Meat {
    protected string MeatName;
    protected float SafeCookTempFahrenheit;
    protected double CaloriesPerOunce;
    public Meat(string meat) {
        MeatName = meat;
        var db = new MeatDatabase();                       // Adapter logic:
        SafeCookTempFahrenheit = db.GetSafeCookTemp(meat, TemperatureType.Fahrenheit);
        CaloriesPerOunce = db.GetCaloriesPerOunce(meat);   // translate old calls
    }                                                      // into new structure
}
class Beef : Meat { public Beef() : base("beef") { } }     // client-friendly types
```
**Analogy:** travel power plug adapter — UK plug (adaptee) into MY wall socket (target); neither device changes.
**Vs siblings:** Adapter CONVERTS an interface (mismatch exists); Facade SIMPLIFIES many interfaces (no mismatch, just complexity); Composite arranges into trees. If the word "legacy/incompatible/third-party" appears → Adapter.

---

## 2. COMPOSITE (structural)

**Problem:** part-whole hierarchies — single sensors AND groups of sensors; primitive messages AND composite mission-plan messages; files AND folders. Clients shouldn't care which they hold.
**Why naive fails:** client code forks everywhere (`if (isGroup) loop else single`); adding new group types modifies all clients.
**Pattern (GoF intent, on his slide):** *"Compose objects into tree structures to represent whole-part hierarchies. Composite lets clients treat individual objects and composites of objects uniformly."*
**Pros:** simplifies client code (individual == composite); scales well for hierarchies. **Cons:** can make the design **overly general**; hard to restrict components to certain types.

**Structure:**
```
            <<abstract>> Component        (SensorMessage)
            + Operation()                 (ReadData)
            + Add(c)  [default: throw]
              ^                  ^
        [Leaf]              [Composite] ◆--- children: List<Component>
        Operation() does    Operation() { foreach child -> child.Operation(); }
        the actual work     Add() appends to children
```
**His code (sensors, verbatim shape):**
```csharp
public abstract class SensorMessage {                 // Component
    public abstract void ReadData();
    public virtual void AddSensor(SensorMessage s) {  // default for leaves
        throw new NotImplementedException("AddSensor is not supported by this class.");
    }
}
public class Sensor : SensorMessage {                 // Leaf
    private string _sensorName;
    public Sensor(string name) { _sensorName = name; }
    public override void ReadData() => Console.WriteLine($"{_sensorName} is reading data...");
}
public class CompositeSensor : SensorMessage {        // Composite
    private List<SensorMessage> _sensors = new List<SensorMessage>();
    public override void AddSensor(SensorMessage s) => _sensors.Add(s);
    public override void ReadData() {
        Console.WriteLine("Composite Sensor reading data from all sensors:");
        foreach (var s in _sensors) s.ReadData();     // recursion through the tree
    }
}
// Client: composite.AddSensor(sensor1); composite.AddSensor(sensor2);
//         composite.ReadData();   // one call, whole tree
```
(Other lecturer example: SoftDrink hierarchy — Cola/RootBeer composites containing flavor leaves, DisplayCalories() recursing through `Flavors`. His slide also nods: composite messages can be CLONED — "remember the Prototype pattern?" Patterns combine.)
**Analogy:** military command — order a division (composite) or one soldier (leaf) with the SAME order; the division relays it downward.
**Vs siblings:** the keyword is **tree/hierarchy/uniform treatment**. Facade is one wrapper over DIFFERENT subsystems; Composite is recursion over SAME-typed children.

---

## 3. FACADE (structural)

**Problem:** clients must operate a complex subsystem (many classes, correct order, internal details — kitchen sections, sensor subsystems).
**Why naive fails:** every client re-implements orchestration; clients couple to every subsystem class; subsystem changes ripple to all clients.
**Pattern (GoF intent, on his slide):** *"Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use."*
**Pros:** reduces client-side complexity; promotes loose coupling between subsystem and clients. **Cons:** can become a **bottleneck/god-object** if overloaded; limits flexibility if clients need ALL subsystem features.

**Structure:**
```
 [Client] ---> [ Facade ]
                +AddSensor()      ----> [SubsystemA]
                +ReadAllSensors() ----> [SubsystemB]
                                  ----> [SubsystemC]
 (client never touches subsystem classes directly)
```
**His code (sensor facade, condensed):**
```csharp
public class SensorMessageSubSystem {                   // subsystem class
    private string _sensorName;
    public SensorMessageSubSystem(string name) { _sensorName = name; }
    public void ReadData() => Console.WriteLine($"{_sensorName} is reading data...");
}
public class Facade {                                   // the unified interface
    private List<SensorMessageSubSystem> _sensors = new();
    public void AddSensor(string name) => _sensors.Add(new SensorMessageSubSystem(name));
    public void ReadAllSensors() {
        Console.WriteLine("Reading data from all sensors through the facade:");
        foreach (var s in _sensors) s.ReadData();
    }
}
public class Client {
    public void ViewSensor() {
        Facade facade = new Facade();
        facade.AddSensor("Temperature Sensor");
        facade.AddSensor("Pressure Sensor");
        facade.ReadAllSensors();                        // one simple call
    }
}
```
(Lecturer's restaurant txt: Patron orders via a **Server (facade)** — `PlaceOrder(appetizerID, entreeID, drinkID)` — who coordinates ColdPrep/HotPrep/Bar kitchen sections; the patron never orders from each station.)
**Analogy:** restaurant waiter — one person to talk to; the kitchen's complexity stays hidden.
**Vs siblings:** Facade SIMPLIFIES (interface already compatible, just complex); Adapter CONVERTS (incompatible). Facade does not add tree semantics (Composite) and doesn't forward notifications (Observer).

---

## 4. ITERATOR (behavioral)

**Problem (his computer-store example):** two stores keep products in DIFFERENT collection structures (different interfaces — list, array...). Client display code needs per-store versions; each NEW store forces modifying display code.
**Why naive fails:** clients depend on each collection's internals; traversal logic duplicated; OCP violated on every new collection.
**Pattern (GoF intent):** *"Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation."*

**His 4 design steps:**
1. Identify and design the **Iterator interface** (uniform traversal contract).
2. For each collection class, design a **concrete Iterator** implementing it in terms of that structure.
3. Create the **Aggregate interface** with the method to create iterators (`CreateIterator()`).
4. Each collection implements Aggregate to instantiate and return its concrete Iterator.

**Benefits (his slide):** consistent way to iterate; abstracts collection internals (collection changes → clients unchanged); easy extension — many iterators / different traversals over same collection. ("Used all over Java, C#, C++ STL" — `IEnumerator`, `Iterator`, etc. It's OK to adapt the pattern with helper methods to fit the domain.)

**Structure:**
```
 <<interface>> IAggregate            <<interface>> IIterator
 + CreateIterator(): IIterator      + First()  + Next()
        ^                           + IsDone   + Current
 [ConcreteCollection] --creates--> [ConcreteIterator] ◇--> the collection
 (client loops with the iterator, never sees the internal structure)
```
**His code (JellyBean, condensed):**
```csharp
interface ICandyCollection { JellyBeanIterator CreateIterator(); }   // Aggregate

class JellyBeanCollection : ICandyCollection {                       // ConcreteAggregate
    private ArrayList _items = new ArrayList();
    public JellyBeanIterator CreateIterator() => new JellyBeanIterator(this);
    public int Count => _items.Count;
    public object this[int i] { get => _items[i]; set => _items.Add(value); }
}
interface IJellyBeanIterator {                                       // Iterator
    JellyBean First(); JellyBean Next();
    bool IsDone { get; } JellyBean CurrentBean { get; }
}
class JellyBeanIterator : IJellyBeanIterator {                       // ConcreteIterator
    private JellyBeanCollection _jellyBeans;
    private int _current = 0;
    public JellyBeanIterator(JellyBeanCollection beans) { _jellyBeans = beans; }
    public JellyBean First() { _current = 0; return _jellyBeans[_current] as JellyBean; }
    public JellyBean Next() {
        _current += 1;
        return !IsDone ? _jellyBeans[_current] as JellyBean : null;
    }
    public bool IsDone => _current >= _jellyBeans.Count;
    public JellyBean CurrentBean => _jellyBeans[_current] as JellyBean;
}
// Client: for (var b = it.First(); !it.IsDone; b = it.Next()) Console.WriteLine(b.Flavor);
```
**Analogy:** TV remote's next/prev channel — you surf every channel without knowing how the tuner stores them.
**Vs siblings:** about TRAVERSAL only. If elements also notify (Observer) or form trees (Composite — iterators often traverse composites!), those are separate concerns.

---

## 5. OBSERVER (behavioral)

**Problem:** ONE object's state changes (price, news, sensor reading); MANY others must react. Polling wastes cycles; hard-wiring the subject to call each dependent couples it to all of them.
**Why naive fails:** subject must know every dependent's type (modify subject per new dependent — OCP violation); or dependents poll → stale data + waste.
**Pattern (GoF intent):** *"Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically."* "Standardizes operations between objects that interoperate using a one-to-many relationship."

**His 5 design steps:**
1. Design the **Subject interface**: attach, detach, notify (track observers with a list).
2. Classes managing information of interest **inherit from Subject**.
3. Design the **Observer interface** with abstract `Update()`.
4. All observers implement `Update()`.
5. At runtime: create observers, **attach to subject**; on change, subject iterates its registered list calling each `Update()`.

**Benefits:** flexibility adding new services; compartmentalized services → easier maintenance/modification. **"Observers are almost always used within the MVC architecture"** (views observe the model!) — his slide; high-yield exam line.

**Structure:**
```
 [Subject]                              <<interface>> IObserver
 -observers: List<IObserver>            + Update(subject)
 +Attach(o) +Detach(o)                        ^
 +Notify() { foreach o: o.Update(this); }     |
      ^                                  [ConcreteObserver]
 [ConcreteSubject]                       reacts to subject's new state
 state change ==> Notify()
```
**His code (Veggies/Restaurant, condensed):**
```csharp
abstract class Veggies {                                   // Subject
    private double _pricePerPound;
    private List<IRestaurant> _restaurants = new List<IRestaurant>();
    public Veggies(double price) { _pricePerPound = price; }
    public void Attach(IRestaurant r) => _restaurants.Add(r);
    public void Detach(IRestaurant r) => _restaurants.Remove(r);
    public void Notify() { foreach (IRestaurant r in _restaurants) r.Update(this); }
    public double PricePerPound {
        get => _pricePerPound;
        set { if (_pricePerPound != value) { _pricePerPound = value; Notify(); } }  // auto-notify
    }
}
class Carrots : Veggies { public Carrots(double p) : base(p) { } }    // ConcreteSubject

interface IRestaurant { void Update(Veggies veggies); }               // Observer

class Restaurant : IRestaurant {                                      // ConcreteObserver
    private string _name; private double _purchaseThreshold;
    public Restaurant(string name, double threshold) { _name = name; _purchaseThreshold = threshold; }
    public void Update(Veggies v) {
        Console.WriteLine($"Notified {_name} of {v.GetType().Name}'s price change to {v.PricePerPound:C}.");
        if (v.PricePerPound < _purchaseThreshold)
            Console.WriteLine(_name + " wants to buy some " + v.GetType().Name + "!");
    }
}
// Client: carrots.Attach(rest1); carrots.Attach(rest2); carrots.PricePerPound = 0.79; // all notified
```
**Analogy:** YouTube subscriptions — channel uploads (state change) → all subscribers get notified automatically; channel doesn't know who they are personally.
**Vs siblings:** keyword **notify/subscribe/broadcast/auto-update**. Mediator centralizes many-to-many chatter; Observer is one-to-many state propagation.

---

## 6. Pattern Discrimination Table (the 10-pattern reflex map)

| Scenario smell | Pattern | Category |
|---|---|---|
| exactly one instance, global access | Singleton | Creational |
| create subtype from runtime input | Factory | Creational |
| consistent FAMILIES of products | Abstract Factory | Creational |
| step-by-step assembly, optional parts, fluent chaining | Builder | Creational |
| copy expensive/preconfigured object | Prototype | Creational |
| incompatible/legacy interface must fit new contract | Adapter | Structural |
| tree of parts, treat one==many uniformly | Composite | Structural |
| one simple door into a complex subsystem | Facade | Structural |
| traverse collection without exposing internals | Iterator | Behavioral |
| one change → many auto-updates (publish/subscribe) | Observer | Behavioral |

---

## 7. Likely Exam Questions

1. *Differentiate creational vs structural vs behavioral patterns + one example each* (his summary slide).
2. *Scenario → pattern + justify + draw structure + write/complete C# code* (Section C style; practice all five).
3. *State the GoF intent of Composite/Facade/Iterator/Observer* (his slides quote them verbatim — quote back).
4. *List the design steps for Adapter/Iterator/Observer* (his numbered steps).
5. *Pros & cons of Adapter/Composite/Facade* (his Purpose/Pros/Cons slide format).
6. *Adapter vs Facade comparison* (conversion vs simplification).
7. *Why is Observer "almost always used in MVC"?* (views auto-update when model changes).
8. *Code completion:* fill `Notify()`, `AddSensor()`, `Next()/IsDone`, the adapter's constructor mapping.

---

## 8. Top Traps

1. **Adapter vs Facade:** Adapter fixes INCOMPATIBILITY (interface conversion); Facade fixes COMPLEXITY (simplified unified entry). Look for "legacy/third-party/doesn't match" vs "complex subsystem/simplify."
2. **Composite leaf Add():** in his code the base throws NotImplementedException for leaves — acknowledge the trade-off (uniformity vs type safety = his "overly general" con).
3. **Composite's power = recursion:** the composite's operation loops children calling the SAME operation. Forgetting the loop = no marks.
4. **Iterator:** the Aggregate CREATES the iterator (`CreateIterator()`); the iterator holds a reference back to the collection. Clients depend ONLY on the iterator interface.
5. **Observer:** `Notify()` lives in the SUBJECT; `Update()` lives in the OBSERVER. Swapping them is a classic error. Notify is triggered inside the state setter.
6. **Attach/Detach are subject methods** — observers register themselves WITH the subject, not vice versa.
7. Don't claim Iterator/Observer are structural — they're **behavioral** (communication/traversal, not composition).
8. Strategy/State/Command etc. are GoF behavioral patterns NOT covered in his slides — don't burn time on them, but recognize the names (he listed them as "not covered").
9. In "which pattern" MCQs, the distractor is usually the same-category sibling — decide by the PROBLEM (mismatch? tree? complexity? traversal? notification?), not by the code's surface.
10. Patterns combine (his hint: composite messages built via Prototype's clone; facade can wrap a composite of sensors) — mentioning a sensible combination earns depth marks.

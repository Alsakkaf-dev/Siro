# ANSWERS — Drill CH6–7 Patterns

**Q1. Singleton.** Signal: "exactly ONE instance + global access" (audit logger = his logging-system use case). Private constructor + static GetInstance.

**Q2. Factory (Factory Method).** Signal: subtype chosen DYNAMICALLY from runtime input (destination), client never news concretes — exactly his "user controllers based on roles" case.

**Q3. Abstract Factory.** Signal: consistent FAMILIES of related products that must never be mixed; swap whole family (Dark→Light) without changing client code.

**Q4. Builder.** Signal: complex object, MANY OPTIONAL parts, step-by-step assembly, finished product returned at the end (`Build()`); fluent chaining.

**Q5. Prototype.** Signal: creation is EXPENSIVE; copy preconfigured template objects via `Clone()` instead of rebuilding (his "user preferences/themes" case, game-scaled).

**Q6. Adapter.** Signal: INCOMPATIBLE INTERFACES, neither side modifiable (legacy library) — convert `BillingApi.GetRowsAsXml()` to satisfy `IDataSource.FetchRecords()`.

**Q7. Composite.** Signal: PART-WHOLE TREE (folders contain files and folders) + treat individual and group UNIFORMLY (`GetSize()` on either).

**Q8. Facade.** Signal: ONE SIMPLIFIED ENTRY POINT (`LeaveHomeMode()`) over a COMPLEX SUBSYSTEM of four APIs; no interface mismatch — just complexity reduction.

**Q9. Observer.** Signal: ONE-TO-MANY automatic notification on state change; subject doesn't know concrete dependents (Attach/Notify/Update).

---

**Q10.** (4 marks)
```csharp
(1) private ServiceRegistry() { }                       // private constructor
(2) if (_instance == null)                              // lazy guard inside lock
(3) _instance = new ServiceRegistry();                  // single creation point
```
(1m each + 1m for all-correct/syntax.)

**Q11.** (4 marks)
```csharp
(1) foreach (IRestaurant r in _restaurants) r.Update(this);
(2) Notify();
(3) void Update(Veggies veggies);
```
(Notify lives in the SUBJECT and is fired inside the setter when state actually changes; Update is the observer contract.)

**Q12.** (4 marks)
```csharp
(1) throw new NotImplementedException("AddSensor is not supported by this class.");
(2) _sensors.Add(s);
(3) foreach (var s in _sensors) s.ReadData();
```
(The recursive foreach is the heart of Composite — composite's operation delegates to every child's SAME operation.)

**Q13.** (6 marks, 1 each)
(i) **Factory** — creator method returning subtypes by input.
(ii) **Composite** — Component/Leaf/Composite with child aggregation.
(iii) **Singleton** — static instance + private constructor + static accessor.
(iv) **Observer** — Subject with Attach/Detach/Notify against IObserver.Update.
(v) **Adapter** — realizes Target, wraps (associates to) the Adaptee.
(vi) **Prototype** — Clone() declared in base, implemented per concrete; holder delegates creation to clone.
(Unused: Abstract Factory, Builder, Facade, Iterator.)

**Q14.**
(a) (2m) **Observer** + **Adapter**.
(b) (2m) Observer: "ALL update THE MOMENT a flight's status changes" = one-to-many automatic notification (FlightStatus = Subject; boards/app/gates = observers). Adapter: VendorXPanel's `PushText(string)` is an INCOMPATIBLE interface that must satisfy `IDisplay.Render(FlightInfo)` without modifying the vendor class.
(c) (4m)
```
 [FlightStatus]                    <<interface>> IDisplay
 -observers: List<IDisplay>        +Render(info: FlightInfo)
 +Attach(d) +Notify()                ^            ^           ^
 (on status change: Notify)     [BoardDisplay] [MobileApp] [VendorXAdapter] ◇--> [VendorXPanel]
                                                            +Render(info){          +PushText(s)
                                                              panel.PushText(
                                                               Format(info)); }
```
```csharp
public interface IDisplay { void Render(FlightInfo info); }

public class FlightStatus {                          // Subject
    private List<IDisplay> _observers = new();
    private string _status;
    public void Attach(IDisplay d) => _observers.Add(d);
    public string Status {
        get => _status;
        set { if (_status != value) { _status = value; Notify(); } }
    }
    private void Notify() {
        foreach (var d in _observers) d.Render(new FlightInfo(_status));
    }
}
public class VendorXAdapter : IDisplay {             // Adapter
    private VendorXPanel _panel;                     // the Adaptee
    public VendorXAdapter(VendorXPanel panel) { _panel = panel; }
    public void Render(FlightInfo info) =>
        _panel.PushText(info.FlightNo + " : " + info.StatusText);   // conversion
}
```
Marking: subject with list+attach+notify (1), observers behind one interface (1), adapter realizes IDisplay AND wraps VendorXPanel (1), combined diagram coherent (1).

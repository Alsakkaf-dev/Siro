# DRILL — CH6–7 Design Patterns (14 Questions: Scenario→Pattern, Code Completion, Structure Matching)
Target: 60 minutes. The pattern decision must always come with a one-line WHY (the discriminating signal). Answers in `Drill_CH6-7_Patterns_ANSWERS.md`.

---

## Part A — Scenario → Pattern + Why (Q1–6, 2 marks each)

**Q1.** A hospital system must guarantee that exactly ONE `AuditLogger` instance writes to the secure audit trail, accessible from every module.

**Q2.** An e-commerce checkout creates a different `ShippingCalculator` subtype (`DomesticCalc`, `InternationalCalc`, `ExpressCalc`) depending on the destination entered at runtime.

**Q3.** A theming engine must produce CONSISTENT families of UI widgets: DarkButton+DarkScrollbar+DarkMenu, or LightButton+LightScrollbar+LightMenu — never mixed.

**Q4.** A travel-booking site assembles trip packages step by step: flights, optional hotel, optional car, optional insurance — then returns the finished immutable `TripPackage`.

**Q5.** A game spawns hundreds of enemy NPCs per minute; building each from config files is slow, so the engine keeps fully-configured template NPCs and copies them.

**Q6.** A new analytics module expects `IDataSource.FetchRecords()`, but the company's 10-year-old billing library only exposes `BillingApi.GetRowsAsXml()`. Neither may be modified.

## Part B — Scenario → Pattern + Why (Q7–9, 2 marks each)

**Q7.** A file manager must let users run `GetSize()` on a single file OR an entire folder tree (folders contain files and other folders) through one uniform call.

**Q8.** A smart-home app exposes one `LeaveHomeMode()` call that internally arms the alarm, turns off lights, lowers the thermostat, and locks doors across four different subsystem APIs.

**Q9.** When a stock's price changes, twelve dashboard widgets, an alert service, and a logging service must all refresh automatically — without the stock object knowing their concrete types.

## Part C — Code Completion (Q10–12)

**Q10.** (4 marks) Complete the THREE missing lines of this thread-safe Singleton:
```csharp
public class ServiceRegistry {
    private static ServiceRegistry _instance;
    private static readonly object _lock = new object();
    ____________ ServiceRegistry() { }                    // (1) constructor access
    public static ServiceRegistry GetInstance() {
        lock (_lock) {
            if (________________)                          // (2) the guard
                _instance = ____________________;          // (3) creation
        }
        return _instance;
    }
}
```

**Q11.** (4 marks) Complete the Observer's subject so all registered restaurants are notified when price changes:
```csharp
abstract class Veggies {
    private double _pricePerPound;
    private List<IRestaurant> _restaurants = new List<IRestaurant>();
    public void Attach(IRestaurant r) => _restaurants.Add(r);
    public void Notify() {
        ________________________________________            // (1) iterate + update
    }
    public double PricePerPound {
        get => _pricePerPound;
        set {
            if (_pricePerPound != value) {
                _pricePerPound = value;
                ____________;                                // (2) trigger
            }
        }
    }
}
interface IRestaurant { void ____________________; }         // (3) the observer contract
```

**Q12.** (4 marks) Complete the Composite so a composite sensor reads ALL children:
```csharp
public abstract class SensorMessage {
    public abstract void ReadData();
    public virtual void AddSensor(SensorMessage s) {
        ____________________________________________;        // (1) leaf default behavior
    }
}
public class CompositeSensor : SensorMessage {
    private List<SensorMessage> _sensors = new List<SensorMessage>();
    public override void AddSensor(SensorMessage s) => ____________________;   // (2)
    public override void ReadData() {
        Console.WriteLine("Composite reading all sensors:");
        ________________________________________             // (3) recursive traversal
    }
}
```

## Part D — Structure Matching + Discrimination (Q13–14)

**Q13.** (6 marks) Match each UML fragment (i)–(vi) to its pattern (Singleton, Factory, Abstract Factory, Builder, Prototype, Adapter, Composite, Facade, Iterator, Observer — four are unused):
```
(i)   ClientClass --> SimpleClass ; SimpleClass --> [SubA][SubB][SubC]   (one class with
      "CreateX(type): ProductBase" method returning subtypes by a switch)
(ii)  Component <|-- Leaf ; Component <|-- Composite ; Composite ◆--> Component (children*)
(iii) Class with: -instance {static}, -Constructor(), +GetInstance() {static}
(iv)  Subject(+Attach,+Detach,+Notify) ---> IObserver(+Update) <|.. ConcreteObserver
(v)   ITarget(+Request) <|.. AdapterClass ◇--> LegacyClass(+SpecificRequest)
(vi)  AbstractBase(+Clone():AbstractBase) <|-- ConcreteA(+Clone) ; Holder --> AbstractBase
```

**Q14.** (8 marks — mini Section C) An airport's flight-information system: arrival/departure boards, the mobile app, and gate displays must ALL update the moment a flight's status changes; display hardware from vendor X uses `VendorXPanel.PushText(string)` which doesn't match the system's `IDisplay.Render(FlightInfo)` interface.
(a) (2m) Identify the TWO patterns needed.
(b) (2m) Justify each with the discriminating signal.
(c) (4m) Draw ONE combined class diagram and write the C# skeleton of the two pattern cores.

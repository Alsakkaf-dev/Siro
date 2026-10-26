# ANSWERS — Drill CH5 SOLID

**Q1. C — OCP.** New behavior added by EXTENSION (new subclass), existing code untouched ("open for extension, closed for modification").

**Q2. B.** New formats force modification of working code instead of plugging in new classes — the definitional OCP violation (mirrors sample MCQ #10).

**Q3.** (4 marks) Violation: type-testing dispatch. **LSP** is violated in spirit — `RenderShape` uses references to the base class but MUST know every derivative — and therefore **OCP** is violated too: each new shape (Star, Hexagon...) forces modification of `RenderShape`. (Martin: a function that must know all derivatives of its base violates OCP because it changes whenever a new derivative appears.)
Redesign — replace type tests with polymorphism (dynamic binding):
```csharp
public abstract class Shape { public abstract void Draw(); }
public class Circle : Shape { public override void Draw() { /* circle */ } }
public class Square : Shape { public override void Draw() { /* square */ } }
public class Star   : Shape { public override void Draw() { /* star */ } }
public void RenderShape(Shape s) => s.Draw();   // closed forever
```

**Q4.**
(a) (2m) **LSP violation.** `Resize` was written against `Rectangle`'s implied contract: setting width leaves height unchanged. Substituting a `Square` breaks that reasonable assumption (5×4 becomes 4×4=16, assert fails). A subclass must honor the implied contract between the base class and its clients; "a model that is self-consistent is not necessarily consistent with all its users."
(b) (2m) **Signature Rule:** subtype preserves the supertype's method signatures, so type-correct programs remain type-correct against the subtype. **Methods Rule:** reasoning about supertype calls must stay valid — subtype methods may **weaken preconditions** (require less) and **strengthen postconditions** (deliver more), never the reverse; invariants maintained.
(c) (2m) Compliant redesign: do NOT derive mutable Square from mutable Rectangle. E.g.:
```csharp
public interface IShape { double GetArea(); }
public class Rectangle : IShape {
    public double Width { get; } public double Height { get; }
    public Rectangle(double w, double h) { Width = w; Height = h; }   // immutable
    public double GetArea() => Width * Height;
}
public class Square : IShape {
    public double Side { get; }
    public Square(double s) { Side = s; }
    public double GetArea() => Side * Side;
}
```
(Both substitutable wherever `IShape` is expected; no width/height contract to break.)

**Q5.** (4 marks) **ISP violated** — BasicPrinter is forced to depend on (and implement) `Scan`/`Fax`, methods it does not use; `IMachine` is a fat/polluted interface. Secondary danger: the `NotSupportedException` stubs mean a `BasicPrinter` passed where `IMachine` is expected will blow up — an **LSP** violation (nil/throwing implementations break substitutability; Martin notes exactly this in the ISP paper).
Redesign — segregate by client need; compose for multifunction devices:
```csharp
public interface IPrinter { void Print(Doc d); }
public interface IScanner { void Scan(Doc d); }
public interface IFax     { void Fax(Doc d); }
public class BasicPrinter : IPrinter { public void Print(Doc d) { } }
public class OfficeMFP : IPrinter, IScanner, IFax {
    public void Print(Doc d) { } public void Scan(Doc d) { } public void Fax(Doc d) { }
}
```

**Q6.** (4 marks) **SRP violated** — `OrderManager` has four reasons to change (validation rules, tax law, persistence tech, email content), evidenced by three teams editing one class. Redesign:
- `OrderValidator` — validates order data only.
- `TaxCalculator` — computes tax only.
- `OrderRepository` — persists orders only.
- `CustomerNotifier` — sends emails only.
- `OrderService` (coordinator) — orchestrates the four via their interfaces.
Each class now has exactly one reason to change; team edits no longer collide.

**Q7.** (4 marks) **DIP violated** — high-level `ReportService` (policy) depends on the concrete low-level `SqlDatabase` (detail), constructed internally with `new`. Refactor: both depend on an abstraction; inject the implementation:
```csharp
public interface IDatabase { IEnumerable<Row> Query(string q); }
public class SqlDatabase   : IDatabase { public IEnumerable<Row> Query(string q) { /* SQL */ } }
public class MongoDatabase : IDatabase { public IEnumerable<Row> Query(string q) { /* Mongo */ } }
public class ReportService {
    private readonly IDatabase db;
    public ReportService(IDatabase db) { this.db = db; }     // constructor injection
    public Report Generate() { var rows = db.Query("..."); /* unchanged forever */ }
}
```
New databases = new `IDatabase` implementations; `ReportService` is also now closed (DIP enables OCP).

**Q8.**
(a) (2m) **OCP** (behavior 1) and **LSP** (behavior 2).
(b) (2m) OCP: "designed for extension... add new codec decoders WITHOUT ALTERING existing playback engine logic" = open for extension, closed for modification. LSP: "each decoder subclass CAN REPLACE another WHILE PRESERVING the expected behavior and interface" = substitutability of subtypes for their base without affecting correctness.
(c) (4m) Diagram:
```
                <<interface>>
                IAudioDecoder
                +Decode(stream): PcmAudio
               /        |         \
       MP3Decoder  FlacDecoder  OpusDecoder      [PlaybackEngine] ----> IAudioDecoder
       (each realizes the interface,             +Play(IAudioDecoder d)
        identical signature, honored contract)   (depends ONLY on the abstraction)
```
Code skeleton:
```csharp
public interface IAudioDecoder {
    PcmAudio Decode(Stream input);        // same signature for all (LSP Signature Rule)
}
public class Mp3Decoder : IAudioDecoder {
    public PcmAudio Decode(Stream input) { /* mp3 logic */ return new PcmAudio(); }
}
public class FlacDecoder : IAudioDecoder {
    public PcmAudio Decode(Stream input) { /* flac logic */ return new PcmAudio(); }
}
public class PlaybackEngine {             // CLOSED: new codecs never change this class
    public void Play(IAudioDecoder decoder, Stream file) {
        PcmAudio audio = decoder.Decode(file);
        Output(audio);
    }
    private void Output(PcmAudio a) { /* speakers */ }
}
```
Marking: interface at top + realizations (1), closed client depending on abstraction only (1), correct C# inheritance syntax (1), naming consistent with scenario (1).

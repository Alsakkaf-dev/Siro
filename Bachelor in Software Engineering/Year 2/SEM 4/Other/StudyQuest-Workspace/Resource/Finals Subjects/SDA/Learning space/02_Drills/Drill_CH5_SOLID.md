# DRILL — CH5 SOLID (8 Questions: Spot-the-Violation + Fix-It)
Target: 40 minutes. For every "fix," you must (i) NAME the principle, (ii) QUOTE the evidence in the code/scenario, (iii) REDESIGN (diagram or code). Answers in `Drill_CH5_SOLID_ANSWERS.md`.

---

**Q1.** (2 marks, MCQ) A developer adds support for PayPal by creating a `PayPalPayment` class extending the abstract `Payment` class. No existing file is edited. Which principle is being applied?
A. LSP   B. ISP   C. OCP   D. SRP

**Q2.** (2 marks, MCQ) A code review finds that adding each new export format (PDF, XLSX, CSV) requires editing the `switch` inside `ReportExporter.Export()`. This indicates:
A. Correct OCP application
B. OCP violation — modification instead of extension
C. LSP violation — subtypes not substitutable
D. DIP application

**Q3.** (4 marks) Spot the violation and name the TWO chained principles it breaks:
```csharp
public void RenderShape(Shape s) {
    if (s is Circle c)      DrawCircle(c);
    else if (s is Square sq) DrawSquare(sq);
    else if (s is Star st)   DrawStar(st);
}
```
Then redesign (code).

**Q4.** (6 marks) The classic:
```csharp
public class Rectangle {
    public virtual void SetWidth(double w)  { Width = w; }
    public virtual void SetHeight(double h) { Height = h; }
    public double Width { get; protected set; }
    public double Height { get; protected set; }
}
public class Square : Rectangle {
    public override void SetWidth(double w)  { Width = w; Height = w; }
    public override void SetHeight(double h) { Width = h; Height = h; }
}
void Resize(Rectangle r) { r.SetWidth(5); r.SetHeight(4); Debug.Assert(r.Width * r.Height == 20); }
```
(a) Which principle is violated and WHY does `Resize` expose it? (b) State the LSP Signature Rule and Methods Rule. (c) Propose a compliant redesign.

**Q5.** (4 marks) An office-device interface:
```csharp
public interface IMachine { void Print(Doc d); void Scan(Doc d); void Fax(Doc d); }
public class BasicPrinter : IMachine {
    public void Print(Doc d) { /* works */ }
    public void Scan(Doc d)  { throw new NotSupportedException(); }
    public void Fax(Doc d)   { throw new NotSupportedException(); }
}
```
Name the violated principle, the SECONDARY principle this also endangers, and redesign.

**Q6.** (4 marks) `OrderManager` validates orders, calculates tax, writes to the database, AND emails customers. Each sprint, three different teams edit this one class for unrelated reasons. Name the principle violated and redesign (class list + one-line responsibility each).

**Q7.** (4 marks)
```csharp
public class ReportService {
    private SqlDatabase db = new SqlDatabase();        // concrete!
    public Report Generate() { var rows = db.Query("SELECT ..."); /* ... */ }
}
```
The team now needs the same service to run on MongoDB for one client. Name the violated principle and refactor (code) so both databases work without editing `ReportService` again.

**Q8.** (8 marks — Section-C style) A music-streaming app's System Behaviors state:
- "The AudioDecoder module is designed for extension: developers can add new codec decoders (MP3Decoder, FlacDecoder, OpusDecoder) without altering existing playback engine logic."
- "Each decoder subclass can replace another while preserving the expected behavior and interface, ensuring compatibility in all playback workflows."
(a) (2m) Identify the TWO detailed-design principles described.
(b) (2m) Justify each with the exact phrase from the behaviors.
(c) (4m) Draw the class diagram reflecting both principles and write the C# skeleton (interface + two decoders + the closed PlaybackEngine).

# CHALLENGE SET 3 — Tableau (10 timed builds)
**Dataset for all challenges: `5.1. Lecture Dataset/Dataset/US APAC - Superstore Spreadsheet.xlsx` (sheets Orders / Returns / People), plus `US APAC - Cost of Goods Sold.xlsx` and `US APAC - Superstore Spreadsheet (Returns).csv` where stated.**
**Orders fields: Record ID, Order ID, Order Date, Ship Date, Ship Mode, Customer ID, Customer Name, Segment, City, State, Country, Region, Product ID, Category, Sub-Category, Product Name, Sales, Quantity, Discount, Profit.**
**Method: say the click-path aloud BEFORE touching the mouse. One worksheet per challenge, renamed to the challenge number. Save as .twbx at the end (course submission format).**

---

## C3.1 — Connect & clean (8 min)
Connect to the Superstore Excel, drag **Orders** to the canvas, then: (a) change **Record ID** number → String and justify in one sentence; (b) rename **Ship Date → Shipping Date**; (c) **Split** Order ID and say what the separator was; (d) **Describe** Segment and state its distinct values. Name the page where all of this happens.

## C3.2 — Trend + drill (8 min)
Build the **Sales over time** line chart with mark labels, then drill the date from Year down to **Month** showing Quarter removed. State which pill feature does the drilling and what blue vs green Order Date pills would mean.

## C3.3 — Ranked bars with a twist (8 min)
"Which Sub-Category has the highest sales, and what % of total does each contribute?" — one bar chart, sorted descending, labels showing **percent of total** rather than raw sums. Two distinct steps after the basic bars: name them.

## C3.4 — Scatter detective (8 min)
"Is the highest-sales order also the most profitable?" Build the Profit-vs-Sales scatter at ROW level (not aggregated — what must you untick, and where?), color by **Category**, then split into one panel per Category. Identify visually: which Category shows deep-loss points?

## C3.5 — Heat map + box plot pair (10 min)
(a) Heat map: Profit across **Region × Segment** (which field goes to which shelf/card?). (b) Box-and-whisker: **Discount** across Region within Segment — name the exact shelf arrangement and where Show Me comes in. One sentence: what does the box plot show that the heat map cannot?

## C3.6 — Dual-axis combo (10 min)
"Compare Sales (bars) and Discount (line) by Sub-Category, sorted by Sales descending." Name: the pill right-click option that merges the axes, where you change each measure's mark type, and the sort shortcut. BONUS: the bar-in-bar variant for Sales vs Profit by year — what extra Marks-card adjustment nests the bars?

## C3.7 — Calculated field + sets (12 min)
(a) Create **Margin** = profit over sales as an aggregate calculation — exact formula and why the pill reads AGG(Margin). (b) Build the set "Customers A" = customers with **SUM(Sales) > 5000**, then show what % of all customers qualify (which quick table calculation?). (c) Sketch the combined-set recipe for "customers who purchased in BOTH 2017 and 2018" and the option button you must select; what count did the lecture get?

## C3.8 — Map of losses (10 min)
"Which State has the highest LOSS, and where are sales largest?" Build the filled-then-sized map: how do State coordinates appear automatically, what goes on Color vs Size, how do you spot the worst state instantly, and how do you drill State → City? Add an interactive Category filter (right-click path).

## C3.9 — Trend line + 6-month forecast (10 min)
On the monthly sales line: (a) add a **Linear** trend line via the Analytics pane and read off TWO statistics it reveals on hover; (b) remove it and add a **Forecast**; change the default horizon to exactly **6 months** (where do Forecast Options live?); what does the shaded band represent and at what default confidence?

## C3.10 — Blend, dashboard, story (18 min — the capstone)
(a) Add `US APAC - Cost of Goods Sold.xlsx` as a SECOND data source; fix its mess with **Data Interpreter**, then **Pivot** Jan-15…Dec-18 into **Date / Cost of Goods** columns.
(b) Blend: with the Orders view active, bring in Cost of Goods — how does Tableau link the sources, and what do the blue vs orange ticks mean?
(c) Dashboard "Sales Dashboard": Revenue by City (map), Sales Over Time, Sales vs Profit scatter; make the Category filter drive ALL sheets (exact caret menu path).
(d) Story "APAC Superstore Revenue Analysis": two story points with captions.
**Expected outcome:** one packaged workbook where a single Category click filters the whole dashboard.

# SOLUTIONS — Challenge Set 3: Tableau

---

## S3.1 — Connect & clean
All on the **Data Source page**. (a) Click the data-type icon atop the Record ID column → **String** — it's an identifier, not a quantity; summing it is meaningless. (b) Double-click the field name → type "Shipping Date". (c) Right-click Order ID → **Split** — Tableau detects the **hyphen** and creates new fields per part. (d) Right-click Segment → **Describe** → role/type + distinct values: **Consumer, Corporate, Home Office**.

## S3.2 — Trend + drill
Ctrl-click **Sales** and **Order Date** in the Data pane → **Show Me → line chart** → Marks → **Label → Show mark labels** → rename sheet. Drill: click the **+ on the YEAR(Order Date) pill** → Quarter appears → drag **QUARTER(Order Date)** off the shelf, keep MONTH. Blue Order Date pill = **discrete** date parts (headers); green = **continuous** date axis.
**Correct output:** monthly line labeled with sales values.

## S3.3 — Ranked bars with %
Basic bars: **Sales → Rows, Sub-Category → Columns** (or highlight + Show Me). Then (1) **Sort descending** — right-click Sub-Category pill → Sort → By field / Descending (or the toolbar sort icon); (2) right-click **SUM(Sales)** pill → **Quick Table Calculation → Percent of Total**; Label on.
**Correct output:** descending bars; labels in % (largest sub-category visibly biggest, label = its share of total sales).

## S3.4 — Scatter detective
Highlight **Profit + Sales** → Show Me → scatter → menu **Analysis → untick Aggregate Measures** (this de-aggregates to one mark per row). Drag **Category → Color** (Marks card). Split: drag **Category → Columns** → three panels.
**Correct output:** clouds of points; deep-loss (far-negative-profit) points cluster in furniture-type categories — state what YOU see; the skill is reading quadrants: high sales + negative profit = discount damage.

## S3.5 — Heat map + box plot
(a) **Segment → Columns, Region → Rows, Profit → Color** (Marks) → Entire View = the heat map. (b) **Segment → Columns**, then **Region → Columns to its right**, **Discount → Rows** → **Show Me → box-and-whisker plots**.
Box plot adds the **distribution** (median, quartiles, whiskers, outliers) of Discount per group; the heat map only encodes a single aggregate per cell.

## S3.6 — Dual-axis combo
**Sub-Category → Columns; Sales and Discount → Rows** → right-click the **SUM(Discount)** pill → **Dual Axis** → Marks card has per-measure tabs: **SUM(Sales) → Bar**, **SUM(Discount) → Line** → click the **sort-descending icon on the Sales axis**.
BONUS bar-in-bar: **Order Date → Columns, Sales + Profit → Rows** → right-click 2nd measure → Dual Axis → Marks "All" → type **Bar** → on **SUM(Sales)** card click **Size** and shrink (repeat differently on SUM(Profit)) so one bar nests inside the other; right-click axis → Synchronize Axis.
**Correct output:** bars + overlaid line on two y-axes; bonus = nested bars per year.

## S3.7 — Calculated field + sets
(a) **Analysis → Create Calculated Field** → Name `Margin` → `SUM([Profit])/SUM([Sales])` → OK. Pill shows **AGG(Margin)** because the calculation is **already aggregated** — Tableau can't re-aggregate it (no SUM-of-AGG choices in its menu).
(b) Right-click **Customer Name → Create → Set** → name "Customers A" → General: **Use all** → **Condition tab → By field: Sales / Sum / > / 5000**. View: set → Rows (In/Out), **Sales → Columns**, right-click SUM(Sales) → **Quick Table Calculation → Percent of Total** → Label on. Read the IN bar = % qualifying.
(c) Filter Order Date to 2018 → Ctrl+A in view → right-click → **Create Set** "Customers 2018" → Edit Filter to 2017 → repeat → "Customers 2017" → Ctrl-select both sets in Data pane → right-click → **Create Combined Set** → choose **"Shared members in both sets"** → drag combined set to Filters; Customer Name → **Measure → Count (Distinct)**. Lecture's answer: **605 customers**.

## S3.8 — Map of losses
Double-click **State** → Tableau assigns the **geographic role** and auto-plots generated **Latitude (Rows) / Longitude (Columns)**. **Profit → Color** (filled map; diverging palette — the **darkest orange/most negative** state = biggest loss → hover to confirm). **Sales → Size** (symbol size = revenue). Size slider on the Size card; border via Color → Border. Drill: click **+ on the State pill** in Marks → City. Filter: right-click **Category** in Data pane → **Show Filter**.
**Correct output:** the lecture names this sheet "Revenue by City" — interactive map, color = profit, size = sales.

## S3.9 — Trend + forecast
(a) **Analytics pane → drag Trend Line → drop on Linear** (choices: Linear, Logarithmic, Exponential, Polynomial, Power). Hover reveals **the equation, R-squared, and p-value** (any two).
(b) Right-click trend line → untick Show Trend Lines → **Analytics → drag Forecast onto the canvas** → shaded band appears (default auto ≈ 13 months). Change horizon: right-click the forecast area → **Forecast → Forecast Options** → Forecast Length = **Exactly 6 months**. The band = the **prediction/confidence interval, default 95%**.

## S3.10 — Blend, dashboard, story
(a) Toolbar **Add New Data Source** → More… → `US APAC - Cost of Goods Sold.xlsx` → on its Data Source page tick **Use Data Interpreter** (kills junk headers/nulls) → click **Jan-15**, Shift-click **Dec-18** → right-click → **Pivot** → rename *Pivot Field Names* → **Date**, *Pivot Field Values* → **Cost of Goods**.
(b) On the worksheet, Data tab lists both sources. The active/first-used source = **primary (blue check)**; using a field from the other makes it **secondary (orange check)**. Tableau **auto-links on the common field "Category"** — the orange chain-link icon shows the active link. Drag **Cost of Goods → Columns** from the secondary source.
(c) **New Dashboard** → tick Show dashboard title → drag the three sheets from the Sheets list (grey shading shows drop zones) → on the **Category filter card caret → Apply to Worksheets → All Using Related Data Sources**.
(d) **New Story** → right-click Story 1 title → Edit Title → "APAC Superstore Revenue Analysis" → drag Sales Dashboard into point 1 → click the **Navigator caption** → type the takeaway → **Blank** → drag Category Dashboard → caption. **File → Export Packaged Workbook (.twbx)**.
**Correct output:** clicking any Category value filters map + line + scatter simultaneously; story has 2 captioned points.

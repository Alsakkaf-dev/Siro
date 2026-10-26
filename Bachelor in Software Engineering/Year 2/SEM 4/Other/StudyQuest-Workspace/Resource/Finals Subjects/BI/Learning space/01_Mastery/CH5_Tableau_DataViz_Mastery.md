# CH5 MASTERY — Data Visualization in Tableau (Lab 5, Complete Recipes)
**SCSP3213 Business Intelligence | Source: CH05P1_DataViz in Tableau (Lab 5).pdf**
**Dataset for everything here: `US APAC - Superstore Spreadsheet.xlsx` (sheets: Orders, Returns, People) + `US APAC - Cost of Goods Sold.xlsx` + `US APAC - Superstore Spreadsheet (Returns).csv`.**
**Orders columns: Record ID, Order ID, Order Date, Ship Date, Ship Mode, Customer ID, Customer Name, Segment, City, State, Country, Region, Product ID, Category, Sub-Category, Product Name, Sales, Quantity, Discount, Profit.**

---

## 1. CONCEPTS THE WRITTEN PART CAN ASK

**Tableau** (course quote): *"a trending and market-leading BI tool used to visualize and analyze your data in an easily digestible format… work on live data-sets and spend more time on data analysis rather than data wrangling."*

**Tableau Desktop vs Tableau Public (table is quizzable):**
| | Desktop | Public |
|---|---|---|
| Price | Paid (14-day free) | Free |
| Connections | All kinds (local files + databases) | Local files only |
| Saving | Locally as **.twb / .twbx** | Cannot save locally — must upload to Tableau Public Server |
| Privacy | Private | No privacy |
| Offline | Can work offline | Must be online to save |

**Live vs Extract connection:**
| Live | Extract |
|---|---|
| Maintains live connection; source changes reflected | Copy of data into Tableau; static until refresh |
| Performance = your database's speed | Performance = your PC's resources |
| Secure (credentials to reconnect) | Not secure (data not encrypted) |
| Needs to be online (non-local sources) | Convenient — works offline |

**Dimension vs Measure:**
| Dimension | Measure |
|---|---|
| Qualitative/categorical | Quantitative/numerical |
| String, Boolean, ID, date & time | Numbers, latitude & longitude |
| Usually **discrete (BLUE pill)** | Usually **continuous (GREEN pill)** |
| No aggregation applied | **Auto-aggregated (default SUM)** |

**Discrete vs Continuous:** discrete = individual separate values, **counted** (items in a transaction, persons in class) → blue, creates headers; continuous = any value in a range, **measured** (height, wind speed) → green, creates axes.

**File types:** .twb (workbook, no data) vs **.twbx (packaged workbook — what you SUBMIT in this course)**.

---

## 2. CONNECT & PREP (the Data Source page)

1. Open Tableau → **Connect pane → Microsoft Excel** → open `US APAC - Superstore Spreadsheet.xlsx`.
2. **Drag the Orders sheet onto the canvas** ("Drag tables here"). Preview appears in the data grid.
3. Check assigned **data types** (icon above each column: # number, Abc string, calendar date, globe geographic). Fix wrong ones by clicking the type icon — e.g., **Row/Record ID: number → String** (it's an identifier, not a quantity).
4. **Rename a field:** double-click its name (e.g., Ship Date → Shipping Date).
5. **Split:** right-click field → Split (Order ID splits on hyphens into parts).
6. **Describe (EDA):** right-click field → Describe → role, data type, distinct values (e.g., Segment).
7. **Data Interpreter:** when a workbook has junk headers/nulls (the **Cost of Goods Sold** file!) → tick **Use Data Interpreter** on the left to auto-clean.
8. **Pivot (data source page):** select the month columns **Jan-15 … Dec-18** (click first, Shift-click last) → right-click → **Pivot** → rename *Pivot Field Names* → **Date**, *Pivot Field Values* → **Cost of Goods**. (Columns-to-rows, the Tableau equivalent of Alteryx Transpose.)
9. Joins/Unions: drag a second sheet (e.g., Returns) next to Orders until the "**noodle**" appears → relationship/join on Order ID. **Multiple connections:** Connections pane → **Add** → e.g., the Returns CSV.

---

## 3. THE TEN CHART RECIPES (lecture's exact analyses — drill until automatic)

> Worksheet anatomy: **Data pane** (left: Dimensions/Measures) → drag pills to **Columns / Rows shelves**, **Marks card** (Color, Size, Label, Detail, Tooltip), **Filters card**, **Show Me** (top-right chart picker), **Analytics pane** (left tab).

**1. Line chart — "Trend of sales over time"**
Select **Sales + Order Date** in Data pane (Ctrl-click) → **Show Me → line chart** → Marks: **Label → Show mark labels**. Rename sheet "Sales Over Time". (Dates auto-hierarchy: click **+** on YEAR pill to drill to Quarter/Month.)

**2. Bar chart — "Which Category has the highest sales?"**
Drag **Sales → Rows**, **Category → Columns** → (axis right-click) untick *Show Header* for clean look → Label on. Fit: toolbar dropdown → **Entire View**. Rename "Sales by Category".

**3. Scatter plot — "Is highest sales also highest profit?"**
Highlight **Profit + Sales** → Show Me → **scatter plots** → menu **Analysis → untick Aggregate Measures** (one dot per row instead of one aggregated dot!).

**4. Scatter by category** — drag **Category → Color** on Marks (colored clusters); or **Category → Columns** to split into 3 panels.

**5. Packed bubbles — "Which Segment has the highest sales?"**
Highlight **Sales + Segment** → Show Me → **packed bubbles** → drag **Sales → Label**. F7 = Presentation Mode.

**6. Heat map — "Profit across Region × Segment"**
**Segment → Columns**, **Region → Rows**, **Profit → Color** → Entire View. (Color gradient = highlight table.)

**7. Tree map — "Which Sub-Category has the highest sales?"**
Highlight **Sales + Sub-Category** → Show Me → **treemaps** → optional: Category → Tooltip, Sales → Label.

**8. Box plot — "Discount across Region & Segment"**
**Segment → Columns**, then **Region → Columns** (right of it), **Discount → Rows** → Show Me → **box-and-whisker plots**.

**9. Combination / dual-axis chart — "Sales and Discount by Sub-Category"**
**Sub-Category → Columns**; **Sales and Discount → Rows** → right-click second pill **SUM(Discount) → Dual Axis** → Marks card per measure: SUM(Sales) → **Bar**, SUM(Discount) → **Line** → click the sort-descending icon on the Sales axis.

**10. Bar-in-bar (overlapped) — "Sales vs Profit in one chart"**
**Order Date → Columns**, **Sales + Profit → Rows** → right-click 2nd measure → **Dual Axis** → Marks "All": type **Bar** → on SUM(Sales) card: Size slider down (or on SUM(Profit)) so bars nest. (Also: right-click axis → Synchronize Axis.)

**Map — "Which state has the highest loss?" (Analysis 15)**
Double-click **State** (geo role auto-plots generated Latitude/Longitude) → **Profit → Color** (filled map; darkest negative = biggest loss) → **Sales → Size** → adjust Size slider; Color → Border. Optional: right-click **Category → Show Filter**; click **+** on State pill to drill to City. Rename "Revenue by City".

---

## 4. ORGANIZING DATA

- **Hierarchy & drill-down:** drag **Sub-Category ONTO Category** in the Data pane → name the hierarchy → drag more levels as needed; in the view use **+ / −** on the pill to drill.
- **Sorting:** right-click pill → **Sort** → Sort By **Field**, Order **Descending** (e.g., Sub-Category by Sales). Or the toolbar/axis sort icons.
- **Grouping:** in the view, click first member, Shift/Ctrl-click others (e.g., Binders…Labels) → right-click → **Group**; rename via **Edit Alias** (e.g., "Small Items"). Creates a paper-clip field.
- **Filtering:** drag field (Order Date) → **Filters card**; right-click the pill → **Show Filter** for the interactive control. Filter dialog for dates: Years → tick. Dimension filters: tick members; Measure filters: range.

## 5. CALCULATIONS

- **Quick Table Calculation:** right-click measure pill, e.g., SUM(Sales) → **Quick Table Calculation → Percent of Total** (label switches to %). Used for "Percentage of Sub-Category Sold".
- **Calculated Field:** menu **Analysis → Create Calculated Field** → name it (e.g., **Margin**), expression e.g. `SUM([Profit])/SUM([Sales])` → OK → appears in Measures. An aggregate calc shows as **AGG(Margin)** pill — cannot be re-aggregated.
- **Sets (conditional membership) — "What % of customers have sales > $5000?"**
  Right-click **Customer Name → Create → Set** → name "Customers A" → General tab: **Use all** → **Condition tab → By field: Sales / Sum / > / 5000** → OK. Drag set → Rows (IN/OUT groups); SUM(Sales) → Quick Table Calc → Percent of Total; Label on.
- **Combined Sets — "customers who purchased in BOTH 2017 and 2018":**
  Filter Order Date=2018 → Ctrl+A select all customers in view → right-click → **Create Set** ("Customers 2018") → edit filter to 2017 → repeat ("Customers 2017") → Ctrl-select both sets in Data pane → right-click → **Create Combined Set** → option **Shared members in both sets** → use as filter; **Customer Name → Measure → Count (Distinct)** = 605.

## 6. ANALYTICS TAB

- **Trend Line:** duplicate "Sales Over Time" → drill date to Month (drag Quarter out) → **Analytics pane → drag Trend Line** onto view → drop on **Linear** (options: Linear, Logarithmic, Exponential, Polynomial, Power) → hover the line for **equation, R-squared, p-value**.
- **Forecast:** duplicate sheet → remove trend line (right-click → untick Show Trend Lines) → **Analytics → drag Forecast** onto canvas → shaded band = forecast (auto ≈ next 13 months; **95% confidence interval** default) → right-click forecast → **Forecast → Forecast Options** to change length/seasonality. ("Forecast sales for the next 6 months" = set Forecast Length = 6 months.)

## 7. DATA BLENDING (Analysis: Cost vs Profit)

1. Build a view from Orders (primary): Profit → Rows, Category → Color.
2. **Add the second source:** toolbar **Add New Data Source** icon → More… → `US APAC - Cost of Goods Sold.xlsx` → on its data source page: **Use Data Interpreter** (fix nulls/headers) → select Jan-15…Dec-18 → **Pivot** → rename to **Date / Cost of Goods**.
3. Back on the sheet, the **Data tab now lists two sources** — **blue check = primary**, the other becomes **secondary (orange check)** when you use its fields.
4. Drag **Cost of Goods → Columns** (from secondary): Tableau **auto-links on the common field (Category)** — the orange chain-link icon = active link.
5. Switch back to primary source, drag **State** to the canvas; Marks → Circle; reduce opacity + black border. Rename "Cost vs Profit".
- Blend vs Join (concept): join = row-level merge in ONE source; **blend = aggregate-level link across TWO sources, per sheet, primary+secondary**.

## 8. DASHBOARDS & STORIES

**Dashboard:**
1. **New Dashboard** icon (bottom tabs) → rename "Sales Dashboard"; tick **Show dashboard title**; Size → Automatic.
2. Drag sheets from the **Sheets list** onto the canvas (Revenue by City; Sales Over Time bottom; Scatter bottom-right, retitle "Sales vs Profit") — grey shading previews drop zones.
3. **Interactivity:** on a filter card's caret → **Apply to Worksheets → All Using Related Data Sources** (one filter drives all views). (Also possible: Use as Filter funnel icon on a sheet.)
- Lecture exercise: second dashboard "Category Dashboard" = Sales by Category + Sales and Discount by Sub-Category + Percentage of Sub-Category Sold, with **Sales by Category set as filter**.

**Story:**
1. **New Story** icon → right-click title → Edit title ("APAC Superstore Revenue Analysis").
2. Drag **Sales Dashboard** into the story point; click the **Navigator caption box** → write the takeaway ("This is the overall sales analysis in APAC region"); format via **Story menu → Format**.
3. **Blank** in Story pane = new story point → drag Category Dashboard → caption.

---

## 9. THE 5 OFFICIAL LAB EXERCISES (solve cold before the exam — submission is .twbx)

1. **Top 10 Customers (by Sales) who bought Tables in Southeast Asia** → Customer Name → Rows; Sales → Columns; **Filters: Sub-Category = Tables, Region = Southeast Asia**; sort desc; **Customer Name pill → Filter → Top tab → By field: Top 10 by SUM(Sales)**.
2. **State with the LOWEST Sales for Chairs** → State + Sales bar; Filter Sub-Category = Chairs; sort ascending → first bar. (Or map + color.)
3. **Sub-Category $75,934 below the Average Sales per Category** → Calculated field/LOD or two-step: compute average sales per category, subtract from sub-category sales; find the sub-category where difference = −75,934. Workable route: bar of SUM(Sales) by Sub-Category + reference line at category average; or calc `AVG per category − SUM per sub-category`.
4. **Customer who bought the most Tables (by Quantity) in Southeast Asia in 2016** → Customer Name; SUM(Quantity); Filters: Sub-Category=Tables, Region=Southeast Asia, YEAR(Order Date)=2016; sort desc.
5. **Unprofitable state surrounded by profitable states in China (Furniture)** → Filled map: State + Profit → Color; Filters: Country=China, Category=Furniture → find the orange/negative state amid green/positive neighbours.

## 10. SPEED HABITS
- **Show Me** needs the right pills highlighted (Ctrl-click in Data pane) — fastest route to scatter/bubbles/treemap/box plot.
- Blue/green pill confusion = wrong chart. Right-click pill → Convert to Discrete/Continuous if needed.
- Always **rename worksheets** to the question number — the lab explicitly requires it.
- **Save as .twbx** (File → Export Packaged Workbook) — course submission format.
- Label everything (Marks → Label → Show mark labels) — examiners read values off your chart.

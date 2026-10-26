# CH4.2 MASTERY — ETL in Alteryx Designer (Complete Tool-by-Tool + Lab 1 Workflow)
**SCSP3213 Business Intelligence | Sources: CH04P2_ETL in Alteryx (Lab1).pdf + 1.1. Lab 1 Guideline.pdf + Lab Assignment 1 starter workflow**
**This is the highest-weight exam material. The final is hands-on: you will be GIVEN datasets and asked to BUILD these chains. Every tool below is one the course actually teaches — nothing else will be required.**

---

## 0. ALTERYX DESIGNER ORIENTATION (30 seconds before any task)

- **Canvas** (center): drag tools here, connect left-to-right.
- **Tool Palette** (top): category tabs — **In/Out, Preparation, Join, Parse, Transform, Reporting, Documentation**, plus (after Predictive Tools install) **Data Investigation, Time Series, Predictive, Predictive Grouping**.
- **Configuration pane** (left): changes per selected tool — ALL settings live here.
- **Results pane** (bottom): data preview per anchor after a Run.
- **Run** = Ctrl+R (or the Run button, top-right). Run after EVERY tool you configure — partial credit on a practical comes from visible, verified intermediate results.
- Course marketing line (quotable in written part): Alteryx = single workflow for **Data Blending, Analytics and Reporting** — drag-and-drop visual workflow, **no programming required**, **60+ built-in tools** incl. spatial and **R-based predictive** analytics.

---

## 1. TOOL-BY-TOOL REFERENCE (exactly as the course teaches them)

### A. INPUT / OUTPUT — "2.0 Read Input Data" & "7.0 Write Output Data"

**Input Data** (In/Out palette)
- What: connects a file or database into the workflow.
- Key config: *Connect a File or Database* → browse to file; for Excel, choose the sheet in the *Select Excel Input* box. Config pane shows (a) data connection, (b) preview, (c) result options.
- **Wildcard trick (Lab 1 step a):** select ONE file, then edit the path to `path_to_folder/Customers_*.csv` → reads Customers_Part1/2/3.csv in one tool. Works as long as all files have the **same number of fields with the same data types**.
- When: first tool of every workflow.

**Browse** (In/Out palette)
- What: views the full data (and **data Profile** — type, number of records, data quality, statistics) from any connected tool's anchor.
- When: after every input and any step you must verify. In the professor's own assessment workflows, Browse tools are pre-placed — she expects them.

**Dynamic Input** (Developer palette; course teaches it in the "Read Input Data" section)
- What: reads **multiple sheets from one Excel file** (e.g., Orders.xlsx sheets `2021` and `2022`; GiftRecords.xlsx sheets Year_2010…Year_2015).
- Recipe (two tools):
  1. Input Data → same Excel file, but in the file-selection dialog choose **`<List of Sheet Names>`** → output is one column `Sheet Names`.
  2. Dynamic Input → in config: *Input Data Source Template* = Edit → pick the same workbook and select any ONE sheet (the template); then set *Read a List of Data Sources* → Field = **Sheet Names**, Action = **Change File/Table Name**.
- When: "combine all years/sheets into one table" tasks.

**Text Input** (In/Out palette)
- What: manually typed mini-table saved INSIDE the workflow.
- Key config: type column headers and rows directly in the grid.
- When: **lookup tables** (e.g., Region Code N/S → North/South for Find Replace) and the **Lift Chart dummy quantile input** (0.1…1.0). The professor uses Text Input in her own assessment starter files.

**Output Data** (In/Out palette)
- What: writes workflow results to a file (.csv, .xlsx, .yxdb, …).
- Key config: *Write to File or Database* → path. For Excel with a named sheet use the syntax: `C:\...\FinalOrders.xlsx|||CleanedOrders` (file ||| sheet). Options: overwrite/append.
- **Multi-sheet output trick (Lecture Exercise #3):** check **"Take File/Table Name From Field"** → *Append Suffix to File/Table Name* and pick the grouping field (e.g., SEC) → one Excel file with one sheet per section/group.
- When: final step of ETL tasks; the exam will say "save as .xlsx".

### B. PREPARATION — "3.0 Preparation"

**Filter** (Preparation)
- What: splits rows by a condition. **True anchor** = rows meeting the condition; **False anchor** = the rest.
- Key config: **Basic filter** (pick field, operator, value — e.g., `Status = Cancelled`) or **Custom filter** (expression, e.g., `[Sales] > 5000 AND [Region] = "South"`, `!IsNull([Quantity])`).
- When: "keep only…", "remove…", "exclude Quick Service segments…" tasks. Remember BOTH anchors are usable — "removed" rows are on F.

**Sort** (Preparation)
- What: orders rows alphanumerically by chosen field(s).
- Key config: add field(s) + Ascending/Descending per field.
- When: before Sample (Top-N pattern), before Multi-Row Formula (running totals need correct order), for presentable output.

**Sample** (Preparation)
- What: limits the stream — **First N rows / Last N rows / Skip 1st N rows / 1 of every N / random N%**.
- Key config: sample type + N; optional **Group By** (e.g., First 5 records *per Cust_ID*).
- When: Top-N questions (Sort desc → Sample First N). Lab Assignment Q3 used exactly this: top 10 Casual Dining chains.

**Unique** (Preparation)
- What: splits rows into **U anchor (first occurrence = unique)** and **D anchor (subsequent duplicates)** based on the field(s) you tick.
- Key config: tick the field(s) that define uniqueness (e.g., Order ID).
- When: deduplication ("remove duplicate Order IDs"). Also "how many duplicates?" → count D-anchor rows.

**Select** (Preparation)
- What: rename fields, change **data type & size**, reorder columns, deselect (drop) columns, add description.
- Key config: tick/untick fields; Type dropdown (String, Int16/32/64, Double, Date, …); Rename column.
- When: after input (fix types: Quantity→Int64, TotalSales→Double — Lab 2 does this constantly), renaming ("Product ID"→"Prod_ID"), dropping junk columns before output.

**Auto Field** (Preparation)
- What: scans all records and sets each field to the **smallest possible type/size** (e.g., Double→Int16; string lengths trimmed). Correctly keeps leading-zero "numbers" (e.g., 007) as **string**.
- Key config: tick the fields to process.
- When: optimization after cleaning; before output.

**Imputation** (Preparation)
- What: replaces a specified value in numeric fields with another value.
- Key config: (a) select field(s) to impute; (b) *Incoming value to replace*: **Null()** or a user-specified value; (c) *Replace with*: **Average / Median / Mode / user-supplied value**. Options to output as a new field or flag imputed values.
- When: missing-value cleaning. Lab 1: Quantity NULLs → **Median**. This is the course's flagship "data cleaning" tool — expect it on the exam.

**Formula** (Preparation)
- What: create new columns or update existing ones with expressions.
- Key config: **+ Add Column** (type new name) or select existing; write expression; **set Data type of output** (e.g., Double for Revenue; String for labels). Functions browser on the left of the expression box.
- Must-know expressions (all appeared in his materials):
  - `[Quantity] * [Unit Price]` → Revenue (output type Double)
  - Conditional label (Lecture Exercise #1):
    ```
    IF [Day to ship] = [Day to shipped scheduled] THEN "Shipped On Time"
    ELSEIF [Day to ship] > [Day to shipped scheduled] THEN "Shipped Late"
    ELSE "Shipped Early"
    ENDIF
    ```
  - Region recode alternative to Find Replace:
    ```
    IF [Region] = "N" THEN "North" ELSEIF [Region] = "S" THEN "South" ELSE "Unknown" ENDIF
    ```
  - Date math (Lab Assignment Q2 pattern): `DateTimeDiff([Cancelation Date],[Subscription Date],"months")` → Subscription Length; then `[Subscription Length] * 7.99` → Paid.
- When: any derived field, any business rule.

**Multi-Field Formula** (Preparation)
- What: ONE expression applied to MANY fields at once.
- Key config: tick target fields; expression uses **`[_CurrentField_]`**; option "Copy Output Fields and Add" suffix vs update in place.
- Example (Lab 1): prefix IDs → `"ORD-" + [_CurrentField_]` applied to Order ID.
- When: same change to several columns (trim all strings, scale all numerics).

**Multi-Row Formula** (Preparation)
- What: expressions that reference OTHER ROWS — `[Row-1:Field]`. Creates running totals, averages, percentages; can parse multi-line records. **One field per tool instance.**
- Key config: *Create New Field* (e.g., Running Quantity Total) or update existing; *Num rows* (how far back/forward); *Values for rows that don't exist* (NULL/0); optional Group By.
- Example (Lab 1):
  ```
  IF IsNull([Row-1:Running Quantity Total]) THEN [Quantity]
  ELSE [Row-1:Running Quantity Total] + [Quantity]
  ENDIF
  ```
- When: running totals per group, comparing a row to the previous row (e.g., change vs previous month).

**Create Samples** (Preparation — course note: "under preparation tool palette"; predictive workflow tool)
- What: splits records into **E (estimation/training), V (validation), H (holdout)** random samples.
- Key config: Estimation % (e.g., 70), Validation % (e.g., 30); remainder → holdout. Random seed fixed for reproducibility.
- When: ALWAYS before building predictive models (Lab 3 step 1). On 150 records, 70/30 ≈ 105/45.

**Oversample Field** (Preparation — course teaches with classification)
- What: rebalances a binary target by sampling so the positive class is an elevated share (often 50–50).
- Key config: (a) field to sample on (target, e.g., Response); (b) the level to oversample (the positive value, e.g., 1); (c) desired percentage (≥ its original share).
- When: imbalanced binary classification before Logistic Regression / Decision Tree (Lab 3).

**Tool Container** (Documentation palette) — taught in Lab 1 step c
- What: groups tools in a labeled box; the **toggle (top-left checkbox) enables/disables** the whole group without deleting it.
- How: highlight tools → right-click → **Add to New Container**; double-click label to rename.
- When: organizing exam workflows per question (the professor's starter files are organized in containers per question — mirror her style).
- (Her starter files also use **Comment/Text Box** tools for question text — read every one before building.)

### C. PARSE — "4.0 Parse"

**DateTime** (Parse)
- What: converts **string → Date/Time** or **Date/Time → string** with chosen formats.
- Key config: (a) direction of conversion; (b) field to convert; (c) incoming format from list (e.g., `yyyy-MM-dd`, `dd/MM/yyyy`) or **Custom**; output is a NEW field (default name DateTime_Out — rename it).
- When: Order Date arrives as text and you need date math, time-series grouping, or proper sorting. Required before TS tools if the date is string.

**Text To Columns** (Parse)
- What: splits one column into several columns (or rows) by delimiter(s).
- Key config: (a) field to split; (b) **delimiters** (`\s` = space, `,` = comma — can list several); (c) *Split to Columns* (set # of columns) or *Split to Rows*; advanced: ignore delimiters in quotes.
- Examples from his materials: Customer Name → First/Last (delimiter `\s`, 2 columns, then **Select** to rename `Customer Name1/2` → First Name/Last Name); BizRecords.csv Address `"2316 E 5th Ave,Denver,CO 80206-4205"` → street/city/state-zip (delimiter `,`, 3 columns).
- When: any "split this field" task.

### D. JOIN — "5.0 Join"

**Union** (Join palette)
- What: **stacks rows** of 2+ datasets with (mostly) matching columns.
- Key config: *Auto Config by Name* (default; matches columns by header) / *Auto Config by Position* / *Manually Configure Fields*.
- When: same-schema files (Customers_Part1+2+3; ORDER_2016–2019 + ORDERS_2020–2021). Think "more ROWS".

**Join** (Join palette)
- What: merges 2 inputs on common field(s) (or by record position). Three outputs: **L** (left-only, unmatched), **J** (matched, inner join), **R** (right-only, unmatched).
- Key config: *Join by Specific Fields* → pick left field = right field (e.g., Product ID = Product ID); multiple key pairs allowed. In the embedded Select at the bottom, deselect duplicate key columns.
- When: enrich orders with product/customer attributes. Think "more COLUMNS". **Exam trap:** if asked "which records have no match?" the answer lives on L or R anchor, not J.

**Find Replace** (Join palette)
- What: looks up a value in a reference table and **appends or replaces** with the mapped value (Excel-VLOOKUP-style).
- Key config: top input = data (F anchor); bottom/right input = lookup (R anchor). (a) Find within field = e.g., Region; *Find mode*: any part / beginning / **entire field**; (b) Find value field in lookup; (c) Replace mode: **replace found text** OR **append field(s)** to record (e.g., append Region Name).
- When: code→description mapping (N→North, S→South via a 2-row Text Input lookup). Alternative: Formula IF-chain (course shows both).

**Append Fields** (Join palette)
- What: appends the fields of a SMALL Source input to EVERY record of the Target input = **Cartesian join** (100 × 100 = 10,000!).
- Key config: T input = Target (big), S input = Source (small). *Warn/Error on too many records* — course says LEAVE the protection on.
- When: broadcast one-row info to all rows (PromoNote.csv "Buy 1 Free 1 Promo" onto every order).

### E. TRANSFORM — "6.0 Transform"

**Summarize** (Transform palette)
- What: group-by + aggregations: Sum, Count, CountDistinct, Min, Max, **Average**, Median, Mode, First/Last, Concatenate, GroupBy, percentiles…
- Key config: select field → *Add* → choose action. Order of GroupBy fields = output grouping order. Output column auto-named `Sum_Revenue`, `Avg_Layoff`, etc. (rename via Select if the expected output requires exact headers).
- When: THE aggregation tool. Lab 1: Group By Category + Region Name, Sum Revenue. Professor's Lab Assessment Q1: Group By Month → **Sum_Layoff + Avg_Layoff** (two actions, one tool).

**Transpose** (Transform palette)
- What: pivots **wide → tall**: key column(s) stay; selected data columns become two columns **Name** + **Value**.
- Key config: *Key Columns* (tick e.g. Product, Category) + *Data Columns* (tick the 12 month columns). Result: one row per key × column.
- When: month-per-column layouts (EduFunGames.csv January_Sales…December_Sales) that must become rows for Summarize/TS analysis. **Reverse of Cross Tab.**

**Cross Tab** (Transform palette)
- What: pivots **tall → wide**: values of one column become NEW COLUMN HEADERS; cells aggregated.
- Key config: (a) *Group Data by these Values* = row dimension (Region Name); (b) *Change Column Headers* = field whose values become columns (Category); (c) *Values for New Columns* = the measure (Sum_Total Revenue); (d) *Method for Aggregating* = Sum/First/Concat….
- When: build a pivot-style matrix for reports (Region rows × Category columns of revenue).

### F. REPORTING — "7.0 Write Output Data" (report half)

**Table** (Reporting palette)
- What: turns data into a formatted **report table snippet** (for Render).
- Key config: optional *Group By*; column widths/style rules; default = basic table of incoming fields.

**Report Header** (Reporting palette)
- What: title + optional date + optional logo/image snippet placed above report content.
- Key config: (a) title text ("Sales Summary Report"); (b) tick *Include Date*; (c) image picker.

**Render** (Reporting palette)
- What: converts report snippets into **presentation-quality output**: PDF, Word, Excel, HTML.
- Key config: (a) *Output Mode* = choose format + file path (e.g., SalesSummaryReport.pdf); (b) *Report Data* = which snippet field; (c) include Header (tick); (d) report style options.
- Chain order: data → (Cross Tab) → **Table** → **Report Header** → **Render**. (Header before/joined to Table per Lab 1; both feed Render.)

---

## 2. CANONICAL LAB 1 WORKFLOW — reconstructed end-to-end (WITH THE WHY)

Datasets: `Customers_Part1/2/3.csv`, `Customers.csv`, `Orders.xlsx` (sheets 2021+2022: Order ID, Customer ID, Product ID, Order Date, Quantity, Unit Price, Status), `Products.csv` (Product ID, Product Name, Category), `PromoNote.csv`.

```
STEP 1 IMPORT
 [Input Data: Customers_*.csv] ─ Browse          WHY: wildcard = one tool reads 3 same-schema files
 [Input Data: Orders.xlsx <List of Sheet Names>] → [Dynamic Input] ─ Browse
                                                  WHY: combines sheets 2021+2022 into one stream
 (group each into a renamed Tool Container)      WHY: toggle sections on/off; exam organization

STEP 2 PREPARE (on Orders stream)
 → [Select]      rename Product ID→Prod_ID, Customer ID→Cust_ID; fix types
                 WHY: clean names for joins; correct types for math
 → [Imputation]  Quantity: NULL → Median         WHY: missing-value cleaning (Ch4.1 concept)
 → [Unique]      key = Order ID                  WHY: duplicate orders distort revenue (D anchor = dupes)
 → [Filter]      Basic: Status = "Cancelled"     WHY: T anchor isolates cancelled; analysis stream continues from the anchor the task needs
 → [Multi-Field Formula]  Order ID: "ORD-" + [_CurrentField_]   WHY: standardized ID format
 → [Multi-Row Formula]    Running Quantity Total (IF IsNull([Row-1:…]) THEN [Quantity] ELSE [Row-1:…]+[Quantity] ENDIF)
                 WHY: running totals need row context — normal Formula can't see other rows
 → [Formula]     Revenue = [Quantity] * [Unit Price]  (Double)   WHY: the money column everything aggregates later
 → [Sort]        Order Date ascending            WHY: chronology for running totals/presentation
 → [Sample]      First 5, Group By Cust_ID       WHY: mini-dataset per customer (top-N pattern)
 → [Auto Field]                                  WHY: shrink types after cleaning (Double→Int16 etc.)

STEP 3 PARSE
 → [DateTime]    Order Date string → Date (yyyy-MM-dd)   WHY: real dates enable date math + TS
 → [Text To Columns]  Customer Name, delimiter \s, 2 cols → [Select] rename First/Last Name
                 WHY: split for personalization/grouping

STEP 4 COMBINE
 [Union] Customers_Part1+2+3 (Auto Config by Name)        WHY: stack same-schema rows
 [Join #1] Orders ←Product ID→ Products.csv (J anchor)    WHY: add Product Name/Category columns
 [Join #2] Join#1 ←Customer ID→ Unioned Customers         WHY: add customer attributes
 [Find Replace] Region: N→North, S→South via Text Input lookup (append Region Name)
                 WHY: code→label mapping (or Formula IF-chain)
 [Append Fields] + PromoNote.csv                          WHY: broadcast promo text to every record (Cartesian, source = 1 row)

STEP 5 TRANSFORM
 [Summarize] GroupBy Category, Region Name; Sum Revenue   WHY: the aggregated business answer
 [Transpose] Key = Category, Region; Data = Sum_Revenue   WHY: demo wide→tall reshaping
 [Cross Tab] Group By Region Name; Headers = Category; Values = Sum_Revenue; Method Sum
                 WHY: pivot matrix Region × Category

STEP 6 REPORT
 [Output Data] FinalOrders.xlsx|||CleanedOrders           WHY: deliverable file with named sheet
 [Table] ← after Cross Tab → [Report Header "Sales Summary Report" + date] → [Render → SalesSummaryReport.pdf]
                 WHY: presentation-quality PDF
```

## 3. TOOL SELECTION LOGIC — business phrasing → tool chain

| The question says… | You reach for… |
|---|---|
| "load all the CSV files / all parts" | Input Data with wildcard `*.csv` |
| "combine all sheets / all years in one workbook" | Input Data (List of Sheet Names) + Dynamic Input |
| "combine these separate files into one list" (same columns) | Union (Auto Config by Name) |
| "add product/customer details to each order" | Join on the ID (take J anchor) |
| "which records have no matching X?" | Join → L or R anchor |
| "total/average/count … by …" | Summarize (GroupBy + Sum/Avg/Count) |
| "top/bottom N by …" | Sort (desc/asc) → Sample (First N) |
| "highest single …" per group | Summarize (GroupBy + Max) — or Sort+Sample per group |
| "remove duplicates" | Unique (key fields; D anchor = the dupes) |
| "fill in / replace missing values" | Imputation (Null → mean/median/mode) |
| "keep only… / exclude…" | Filter (Basic or Custom; T/F anchors) |
| "create a new column / calculate…" | Formula (set output type!) |
| "apply the same change to many columns" | Multi-Field Formula (`[_CurrentField_]`) |
| "running total / compare to previous row" | Multi-Row Formula (`[Row-1:Field]`) |
| "convert text dates / format dates" | DateTime |
| "split this column" | Text To Columns |
| "replace codes with names (lookup)" | Find Replace + Text Input lookup (or Formula IF) |
| "attach this note/constant to every row" | Append Fields |
| "months as columns → analyze by month" | Transpose (then Summarize) |
| "make a matrix: X as rows, Y as columns" | Cross Tab |
| "save to Excel with sheet name / sheet per group" | Output Data (`|||Sheet`; Take File/Table Name From Field) |
| "produce a PDF report with a title" | Table → Report Header → Render |

## 4. EXAM-DAY EXECUTION HABITS
1. **Read the expected output first** (the professor provides expected-output screenshots/files — her Lab Assessment gave `Question 1 Output.xlsx`). Reverse-engineer: what are the columns? `Month, Sum_Layoff, Avg_Layoff` → Summarize, GroupBy Month, Sum+Avg. Column names literally encode the tool config.
2. Run (Ctrl+R) after every 1–2 tools; click anchors to verify row counts.
3. Watch the **anchor letters**: Filter T/F, Join L/J/R, Unique U/D, Create Samples E/V/H. Picking the wrong anchor is the #1 silent error.
4. Name/annotate containers per question — that's her own file style.
5. If an expected output has renamed headers, finish with a **Select**.
6. Keep types honest: money = Double, counts = Int, IDs with leading zeros = String.

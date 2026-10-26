# SOLUTIONS — Challenge Set 1: Alteryx ETL

---

## S1.1 — One tool, three files
**Chain A (wildcard):**
1. **Input Data** → browse to `Customers_Part1.csv`, then edit the path to `...\Customers_*.csv`. Works because all three files share the same fields/types.
2. **Unique** → tick **Customer ID**. **U anchor** = unique customers; **D anchor** = duplicates. Run → the D-anchor record count IS the duplicate count (read it off the anchor in the Results pane).
3. **Sort** → Customer Name, Ascending.
4. Highlight all tools → right-click → **Add to New Container** → double-click label → "Customer Master".

**Chain B (alternative asked in task 2):** three **Input Data** tools → **Union** tool, configuration **Auto Config by Name** (headers identical). Then Unique → Sort as above.
**Correct output looks like:** single table, Customer ID/Customer Name/Region, no repeated IDs, alphabetical by name. (Parts overlap — expect the D anchor to be non-empty; say the number you see.)

## S1.2 — Two sheets + revenue
1. **Input Data** → `Orders.xlsx` → in the Excel input dialog choose **`<List of Sheet Names>`** → outputs a `Sheet Names` column.
2. **Dynamic Input** → *Input Data Source Template* = same workbook, any one sheet; *Read a List of Data Sources*: Field = **Sheet Names**, Action = **Change File/Table Name** → both years stream as one table.
3. **Imputation** → field Quantity; *Incoming value to replace* = **Null()**; *Replace with* = **Median**.
4. **Filter** → Basic: **Status Equals Cancelled** → continue from the **F anchor** (we KEEP non-cancelled; T anchor holds the cancelled ones). ⚠ This is the classic anchor trap — Lab 1 practiced "keep cancelled on T"; here the business wants the opposite stream.
5. **Formula** → +Add Column `Revenue` = `[Quantity] * [Unit Price]`, output type **Double**.
6. **Join** → Left = orders stream, Right = Input Data `Products.csv`; *Join by Specific Fields*: Product ID = Product ID. Take the **J anchor**. **L-anchor rows = orders whose Product ID has no entry in Products.csv** (unknown products — worth mentioning for marks).
**Correct output:** 2021+2022 rows, no NULL Quantity, no Cancelled, with Product Name, Category, Revenue (Double).

## S1.3 — Six-year consolidation + shipping verdict
1. Inputs: **Input Data** with wildcard `ORDER_201*.xlsx` only works if sheet structure matches — safer exam play: **4 × Input Data** (one per xlsx) + **Input Data** wildcard `ORDERS_202*.csv` for the two CSVs → **Union** (Auto Config by Name). (Union tolerates extra columns — CSV-only fields like `Days to Ship Scheduled` become Null for xlsx years; for the status label, continue with the 2020–2021 rows or note the limitation.)
2. **Select** first: confirm Order Date / Ship Date are Date/DateTime (if string → **DateTime** tool, format `dd/MM/yyyy HH:mm` per the CSV preview `8/11/2020 0:00`).
3. **Formula** → `Days to Ship Actual` = `DateTimeDiff([Ship Date],[Order Date],"days")` (Int).
4. **Formula** (same tool, second output column) `Shipping Status`:
```
IF [Days to Ship Actual] = [Days to Ship Scheduled] THEN "Shipped On Time"
ELSEIF [Days to Ship Actual] > [Days to Ship Scheduled] THEN "Shipped Late"
ELSE "Shipped Early"
ENDIF
```
5. **Summarize** → GroupBy Region, GroupBy Shipping Status, **Count** (any field, e.g., CountNonNull Order ID → rename Count).
**Correct output:** Region × Shipping Status × Count table (4 regions × 3 statuses typical).

## S1.4 — GiftRecords by college
1. **Input Data** `GiftRecords.xlsx` → **`<List of Sheet Names>`** → **Dynamic Input** (template = Year_2010; read list of Sheet Names; Change File/Table Name) → all six years stacked. (`Record_Year` column already distinguishes years.)
2. **Filter** → Basic: **City Equals San Francisco** → T anchor.
3. **Summarize** → GroupBy **College**; **Max** Gift Amount → output `Max_Gift Amount`.
4. **Sort** → Max_Gift Amount, Descending.
**Correct output (lecture sample):** one row per College (e.g., College of Engineering, College of Business…), each with its single highest gift across 2010–2015, biggest on top.

## S1.5 — EduFunGames reshape
1. **Transpose** → **Key Columns: Product, Category**; **Data Columns: January_Sales … December_Sales** (tick all 12) → output columns: Product, Category, **Name** (month), **Value** (sales).
2. **Summarize** → GroupBy **Category**; **Sum Value** → 3 rows: Educational / Fun and Games / General with Sum_Value. (Matches lecture Exercise #4 sample.)
3. BONUS: **Cross Tab** → *Group Data by* **Category**; *Column Headers* = **Name**; *Values* = **Value**; *Method* = **Sum** → Category rows × 12 month columns. (Cross Tab is the inverse of Transpose — column order is alphabetical, a known quirk.)
**Correct output:** step 2 = 3 rows × 2 cols; bonus = 3 rows × 13 cols.

## S1.6 — BizRecords address split
1. **Text To Columns** → Column to split = **Address**; Delimiters = `,` (comma only); **Split to Columns**, # of Columns = **3**. (Quotes in the CSV are handled at input; the commas inside the field are the split points.) → Address1/2/3.
2. **Select** → rename Address1→Street, Address2→City, Address3→StateZip; untick the original Address if a clean file is required.
3. BONUS: second **Text To Columns** → StateZip, delimiter `\s` (space), 2 columns → rename State, Zip.
4. **Output Data** → path: `...\BizRecords_Clean.xlsx|||Mailing` (the `|||sheet` syntax), format Microsoft Excel (*.xlsx).
**Correct output:** CustomerID, Name, Street, City, State, Zip — e.g., `1, PAMELA WRIGHT, 2316 E 5th Ave, Denver, CO, 80206-4205`.

## S1.7 — Restaurant chains (her assessment pattern)
**Prep common to all parts:**
1. 2 × **Input Data** (Top 100 Chains Sales.csv; Chains and Menu Categories.csv).
2. Money/units arrive as strings (`"$3,101 "`, `"1,600"`) → **Formula** to clean then convert, e.g.
   `ToNumber(Trim(ReplaceString(ReplaceString([2020 U.S. Sales ($000,000)],"$",""),",","")))` → new Double field `Sales_M`; same pattern for `2020 U.S. UNITS` → `Units`. (Select tool alone canNOT strip $ and commas — conversion would yield nulls. This cleaning step is where marks hide.)
3. **Join** on **CHAIN = CHAIN** → J anchor (sales + SEGMENT + MENU CATEGORY together).

**(a)** **Summarize** → GroupBy MENU CATEGORY; Sum Sales_M → **Sort** Sum_Sales_M Desc → top row = answer (category + total).
**(b)** **Filter** before the Summarize → Custom: `[SEGMENT] != "Quick Service"` (or Basic Does Not Equal) → re-run Summarize+Sort on T anchor → new top row.
**(c)** **Filter** → SEGMENT Equals "Casual Dining" → **Sort** Sales_M Desc → **Sample** First **10** → **Summarize** → **Avg Units** → single number.
**Correct output:** (a) one category name + its total $M including Quick Service (burger giants dominate); (b) the answer shifts once Quick Service is gone; (c) a single Avg_Units value for the 10 biggest casual-dining chains.

## S1.8 — Tech layoffs exact reproduction + report
1. **Input Data** `Tech Layoff 2022.xlsx` (Sheet1).
2. **Summarize** → **GroupBy Month**; **Sum Layoff**; **Avg Layoff**. Output columns auto-name **Sum_Layoff, Avg_Layoff** — exactly her headers. (If asked for different header text, append a **Select** to rename.)
3. **Output Data** → `Question 1 Output.xlsx|||Sheet1`.
4. Report branch from Summarize: **Table** (style the grid) → **Report Header** (Title "2022 Tech Layoffs by Month"; tick *Include Date*) → **Render** (Output Mode = PDF, file `Layoffs_Report.pdf`, tick to include header).
**Correct output:** Excel rows like `April 1000 1000 / August 4450 890 / February 4840 1210` (alphabetical by Month, since GroupBy sorts alphanumerically) + a one-page titled PDF. Cross-check against her `Question 1 Output.xlsx` in the same folder.

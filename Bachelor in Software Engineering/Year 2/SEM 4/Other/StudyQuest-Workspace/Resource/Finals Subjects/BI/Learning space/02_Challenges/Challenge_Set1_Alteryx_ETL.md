# CHALLENGE SET 1 — Alteryx ETL (8 timed builds)
**Method per challenge: (1) WRITE the tool sequence on paper first — name every tool and its key config. (2) BUILD it in Alteryx Designer. (3) Compare with `Challenge_Set1_Alteryx_ETL_SOLUTIONS.md`. Target time is per build, assuming datasets already located.**
**All datasets are in `Storage/Materials/LAB MATERIALS/` and `Storage/Materials/ASSIGNMENTS/` — exact filenames given.**

---

## C1.1 — One tool, three files (8 min)
**Dataset:** `1.2. Lab1 Guideline Dataset/Lab1 Guideline Dataset/Customers_Part1.csv`, `Customers_Part2.csv`, `Customers_Part3.csv` (columns: Customer ID, Customer Name, Region)
**Scenario:** Customer records arrive split across three regional extracts. Management wants ONE clean customer list with no duplicate Customer IDs, sorted by Customer Name, in a Tool Container labeled "Customer Master".
**Tasks:**
1. Read all three files with a SINGLE Input Data tool (not three).
2. Also demonstrate the alternative: three Input Data tools combined — which combining tool, and which configuration mode?
3. Remove duplicate Customer IDs and report how many duplicates existed.
4. Sort by Customer Name A→Z; put the whole section in a labeled container.
**Expected outcome:** one stream of unique customers; you can state the duplicate count from a specific anchor.

## C1.2 — Two sheets, one orders table, revenue ready (12 min)
**Dataset:** `Orders.xlsx` (sheets `2021`, `2022`; columns Order ID, Customer ID, Product ID, Order Date, Quantity, Unit Price, Status) + `Products.csv` (Product ID, Product Name, Category)
**Scenario:** Finance needs a combined 2021+2022 order table, enriched with product names/categories, with a Revenue column, excluding cancelled orders.
**Tasks:**
1. Read BOTH sheets of Orders.xlsx with the two-tool pattern taught in Lab 1 (name both tools and the sheet-list trick).
2. Fill any NULL Quantity with the **median**.
3. Remove cancelled orders (Status = "Cancelled") — keep the clean stream.
4. Revenue = Quantity × Unit Price (decimal type).
5. Join to Products.csv to add Product Name and Category. Which anchor do you take, and what would rows on the L anchor mean?
**Expected outcome:** one row per valid order with Product Name, Category, Revenue.

## C1.3 — Superstore six-year consolidation + shipping verdict (15 min)
**Dataset:** `1.3. Lecture dataset 4.2/Dataset/` → `ORDER_2016.xlsx`, `ORDER_2017.xlsx`, `ORDER_2018.xlsx`, `ORDER_2019.xlsx`, `ORDERS_2020.csv`, `ORDERS_2021.csv` (Superstore schema; CSVs include `Days to Ship Scheduled`)
**Scenario:** Operations wants ONE 2016–2021 order history and a shipping-performance label per order.
**Tasks:**
1. Consolidate all six years into one stream (two file formats! — plan the input strategy).
2. Compute actual days to ship from Order Date and Ship Date (which tool/function?).
3. Create `Shipping Status`: "Shipped On Time" / "Shipped Late" / "Shipped Early" comparing actual days vs `Days to Ship Scheduled` (the lecture Exercise #1 rule).
4. Output counts: how many orders per Shipping Status per Region.
**Expected outcome:** a Summarize result Region × Shipping Status with counts.

## C1.4 — GiftRecords: San Francisco's biggest donors by college (12 min)
**Dataset:** `1.3. Lecture dataset 4.2/GiftRecords.xlsx` (sheets `Year_2010`…`Year_2015`; columns: Allocation Subcategory, City, College, Gift Allocation, Gift Amount, Gift Date, Major, Prospect ID, State, Record_Year)
**Scenario (lecture Exercise #2):** The development office asks: *for San Francisco city, what is the HIGHEST Gift Amount received by each College across 2010–2015?*
**Tasks:**
1. Read all six year-sheets into one stream (which two tools?).
2. Restrict to City = "San Francisco".
3. Highest Gift Amount per College.
4. Present sorted, largest first.
**Expected outcome:** one row per College with Max_Gift Amount, descending.

## C1.5 — EduFunGames: months are trapped in columns (12 min)
**Dataset:** `1.3. Lecture dataset 4.2/EduFunGames.csv` (Product, Category, January_Sales … December_Sales)
**Scenario (lecture Exercise #4):** Sales sums are needed per Category (General, Fun and Games, Educational) — but months live in 12 separate columns.
**Tasks:**
1. Reshape so months become rows (tool + exactly which fields are Key vs Data?).
2. Total sales per Category.
3. BONUS: total sales per Category per month, months as columns again (which tool inverts your step 1, and with what aggregation?).
**Expected outcome:** 3-row table Category + Sum_Value; bonus = Category rows × month columns pivot.

## C1.6 — BizRecords: one address field, three business columns (10 min)
**Dataset:** `1.3. Lecture dataset 4.2/Dataset/BizRecords.csv` (CustomerID, Name, Address like `"2316 E 5th Ave,Denver,CO 80206-4205"`)
**Scenario:** Marketing needs Street, City, and State+Zip as separate columns, with clean names, ready for a mail-merge file `BizRecords_Clean.xlsx`, sheet `Mailing`.
**Tasks:**
1. Split Address into 3 columns (tool + delimiter?).
2. Rename the generated columns Street / City / StateZip (which tool?).
3. BONUS: split StateZip on space into State and Zip.
4. Write to the Excel file with the named sheet (exact path syntax?).
**Expected outcome:** 5+ clean columns, one Excel sheet named Mailing.

## C1.7 — Restaurant chains: the professor's own assessment pattern (15 min)
**Dataset:** `ASSIGNMENTS/Lab Assignment 1/Provide to Students/Top 100 Chains Sales.csv` (CHAIN, "2020 U.S. Sales ($000,000)", YOY SALES CHANGE, 2020 U.S. UNITS, YOY UNIT CHANGE) + `Chains and Menu Categories.csv` (CHAIN, SEGMENT, MENU CATEGORY)
**Scenario (real Lab Assessment questions):**
- (a) Which MENU CATEGORY has the highest total 2020 sales, and what is the total?
- (b) Same question after REMOVING all "Quick Service" segments.
- (c) The top 10 Casual Dining chains by sales — what is their AVERAGE number of units?
**Tasks:** plan the chain for each sub-question; note the join key and where Filter sits relative to Summarize; for (c), the Sort→Sample→Summarize pattern.
**Watch out:** sales/units columns contain `$`, commas and quotes — they may parse as strings. What do you do before summing?
**Expected outcome:** three concrete answers you could type into an exam answer box.

## C1.8 — Tech layoffs: reproduce her expected output EXACTLY + PDF report (12 min)
**Dataset:** `ASSIGNMENTS/Lab Assignment 1/Provide to Students/Tech Layoff 2022.xlsx` (Company, Founded, Layoff, Month, Year)
**Scenario (real Lab Assessment Q1):** "Configure a Summarize tool to produce the following output" — expected file has columns **Month, Sum_Layoff, Avg_Layoff** (e.g., April 1000/1000, August 4450/890, February 4840/1210).
**Tasks:**
1. Build the Summarize that yields exactly those three columns/headers.
2. Save as `Question 1 Output.xlsx`.
3. Then dress it as a report: nicely formatted table + header "2022 Tech Layoffs by Month" with today's date + render to `Layoffs_Report.pdf` (name the 3 reporting tools in order).
**Expected outcome:** Excel identical in structure to her sample; one PDF.

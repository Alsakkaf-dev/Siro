# 05 — MOCK PRACTICAL v1 (Hands-On Final Simulation)
**SCSP3213 Business Intelligence | Time allowed: 2 hours 0 minutes | Total: 60 marks (scaled to the 25 hands-on final marks)**

## RULES (simulate exam conditions)
- PC with Alteryx Designer (+ Predictive Tools) and Tableau Desktop open. No notes for the first attempt.
- Create a folder `MOCK1_Answers`. Save every deliverable there with the EXACT filenames requested.
- In Alteryx: organize each task in a labeled **Tool Container**; leave Browse tools where you verified results (the marker follows your evidence).
- In Tableau: one worksheet per sub-question, renamed as instructed; submit ONE packaged workbook.
- Timer suggestion: Task A 30 min, Task B 35 min, Task C 25 min, Task D 25 min, 5 min check.

---

## TASK A — Alteryx ETL: "Restaurant Chains Performance Pack" (15 marks)
**Datasets:** `ASSIGNMENTS/Lab Assignment 1/Provide to Students/Top 100 Chains Sales.csv` and `Chains and Menu Categories.csv`

A1. Load both files and combine them so every chain row carries its SEGMENT and MENU CATEGORY. State (in a comment box on canvas) how many chains failed to match, if any. **(3)**

A2. The sales column (`2020 U.S. Sales ($000,000)`) and units column (`2020 U.S. UNITS`) are not numeric. Make them numeric fields named `Sales_M` and `Units`. **(3)**

A3. Produce `A3_CategoryTotals.xlsx` (sheet `Totals`): total Sales_M per MENU CATEGORY, highest first, EXCLUDING all "Quick Service" segment chains. **(4)**

A4. Answer in a Text/Comment box: the top 10 "Casual Dining" chains by Sales_M — what is their average Units (1 decimal)? Build the chain that proves it. **(3)**

A5. Render a one-page PDF `A5_Report.pdf` titled "Top Menu Categories (excl. Quick Service)" with today's date, containing the A3 table. **(2)**

## TASK B — Alteryx Predictive: "Campaign Response Model" (20 marks)
**Dataset:** `LAB MATERIALS/3.2. Lab 3 Guideline Dataset/0. Lab 3 Guideline Dataset/Customer_Regression_Classification.csv` (+ `LiftChart_Quantiles_DummyInput.csv` if you need it)

B1. Investigate: produce evidence of the dataset's response rate (share of Response = 1) and of Age/Income/PurchaseAmount field quality. Name the two Data Investigation tools you used in a comment. **(3)**

B2. Fix data types for modeling (state which fields you changed and to what). Balance the target so 1s ≈ 50%. **(3)**

B3. Split 70/30 (estimation/validation). Record expected row counts in a comment. **(2)**

B4. Build TWO classifiers on the estimation set predicting **Response** from Age, Income, Region: a Logistic Regression (`LR_Resp`) and a Forest Model (`RF_Resp`). **(4)**

B5. Determine the better model on the validation set with the correct comparison tool; write the winner + its Accuracy (and AUC if shown) in a comment box. **(4)**

B6. Score the validation set with the winning model and produce a Lift Chart (cumulative response). Configure the true response rate with the value from B1. In one canvas comment: "mailing the top 20% captures ≈ ___ % of responders." **(4)**

## TASK C — Tableau Charts & Calculations: "Superstore Quick Answers" (13 marks)
**Dataset:** `LAB MATERIALS/5.1. Lecture Dataset/Dataset/US APAC - Superstore Spreadsheet.xlsx` (Orders sheet)
Workbook: `MOCK1_Tableau.twbx`. One worksheet per item, named C1…C5.

C1. **C1_TrendForecast:** monthly Sales line chart, then forecast the NEXT 6 MONTHS (exactly 6). **(3)**

C2. **C2_TopCustomers:** Top 10 Customers by Sales who bought **Tables** in **Southeast Asia** (chart, labeled). **(3)**

C3. **C3_LossMap:** filled map showing Profit by State for **China, Furniture only** — make the loss-making state(s) instantly visible. **(3)**

C4. **C4_Margin:** create calculated field `Margin = SUM(Profit)/SUM(Sales)`; show Margin by Category and Region (rows/columns view). **(2)**

C5. **C5_PctSubCat:** bar chart of Sales by Sub-Category where labels show **percent of total** (not raw sales), descending. **(2)**

## TASK D — Tableau Dashboard & Story: "Management View" (12 marks)

D1. Heat map worksheet **D1_Heat**: Profit by Region (rows) × Segment (columns), color-encoded, Entire View. **(2)**

D2. Dual-axis worksheet **D2_SalesDiscount**: Sales (bars) + Discount (line) by Sub-Category, sorted by Sales desc. **(3)**

D3. Dashboard **"Mock Dashboard"** containing C2, D1, D2; dashboard title shown; ONE Category filter controls all three sheets. **(4)**

D4. Story **"Mock Story"**: two story points — point 1 = Mock Dashboard captioned with your main insight; point 2 = C3_LossMap captioned with the China takeaway. Export everything as `MOCK1_Tableau.twbx`. **(3)**

---
**STOP. Mark yourself with `05_Mock_Practical_v1_SOLUTIONS.md` → rubric at the end. Log score + time per task in your status file. Anything under 70% on a task = redo that task from blank canvas two days later.**

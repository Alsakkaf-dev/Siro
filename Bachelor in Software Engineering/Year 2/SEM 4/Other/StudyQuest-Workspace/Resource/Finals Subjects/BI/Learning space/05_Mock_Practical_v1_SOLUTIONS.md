# 05 — MOCK PRACTICAL v1: FULL SOLUTIONS + MARKING RUBRIC

---

## TASK A SOLUTION — Restaurant Chains Performance Pack

**A1 (3):**
1. **Input Data** ×2 → the two CSVs.
2. **Join**: Left = Top 100 Chains Sales, Right = Chains and Menu Categories; *Join by Specific Fields*: **CHAIN = CHAIN**.
3. Take **J anchor** onward. Click **L and R anchors** after Run: rows there = chains present in one file only → that count is the "failed to match" answer. **Comment tool** (Documentation palette): "L=…, R=… unmatched."
*Marking: 1 join key correct, 1 anchor reasoning, 1 unmatched count stated.*

**A2 (3):**
**Formula** tool, two new columns (output type **Double**):
```
Sales_M = ToNumber(Trim(ReplaceString(ReplaceString([2020 U.S. Sales ($000,000)],"$",""),",","")))
Units   = ToNumber(ReplaceString([2020 U.S. UNITS],",",""))
```
Verify in Browse: no nulls created; `$3,101` → 3101.
*Marking: 1 strips $ and commas, 1 numeric type set, 1 verified non-null.*

**A3 (4):**
1. **Filter** → Custom: `[SEGMENT] != "Quick Service"` (T anchor onward).
2. **Summarize** → GroupBy **MENU CATEGORY**; **Sum Sales_M**.
3. **Sort** → Sum_Sales_M **Descending**.
4. **Output Data** → `A3_CategoryTotals.xlsx|||Totals`.
*Marking: 1 filter before summarize, 1 correct grouping/sum, 1 sort, 1 file+sheet name exact.*
*Correct output looks like:* a short table, one row per menu category (Varied Menu / Burger / Pizza / Chicken / Mexican…), descending totals — and visibly different from the with-Quick-Service version.

**A4 (3):**
**Filter** `[SEGMENT] = "Casual Dining"` → **Sort** Sales_M Desc → **Sample** First **10** → **Summarize** Avg **Units** → Browse; put the 1-decimal number in a **Comment** box.
*Marking: 1 filter, 1 sort+sample-10, 1 average stated.*

**A5 (2):**
From the A3 stream: **Table** → **Report Header** (Title "Top Menu Categories (excl. Quick Service)", tick *Include Date*) → **Render** (Output mode **PDF**, file `A5_Report.pdf`).
*Marking: 1 correct 3-tool chain, 1 PDF opens with title+date+table.*

## TASK B SOLUTION — Campaign Response Model

**B1 (3):**
- **Frequency Table** on **Response** → counts of 0 vs 1 → response rate = count(1)/150 (expect a minority share — note the exact % for B6).
- **Field Summary** on Age, Income, PurchaseAmount → types, nulls, min/max/mean.
- Comment names both tools + the rate.
*Marking: 1 each tool, 1 rate stated.*

**B2 (3):**
- **Select**: Age → **Int** (Int16/32/64 all acceptable), Income → **Double**, PurchaseAmount → **Double** (Region stays String; Response can stay Int/String consistently).
- **Oversample Field**: field **Response**, level **1**, percentage ≈ **50**.
*Marking: 1 types, 1 correct tool, 1 correct field+level.*

**B3 (2):**
**Create Samples**: Estimation **70**, Validation **30**. After oversampling the row count grows; expected ≈70/30 of the balanced set — quote the actual counts from E and V Browses (on raw 150 it would be ≈105/45).
*Marking: 1 split config, 1 counts evidenced.*

**B4 (4):**
From **E anchor** → **Logistic Regression** (name `LR_Resp`; target Response; predictors Age, Income, Region) and **Forest Model** (name `RF_Resp`; same target/predictors).
*Marking: 1 per model correct wiring/config; 1 names as specified; 1 both fed from E (not the full data).*

**B5 (4):**
**Union** the two model **O** anchors → **Model Comparison**: **M** = unioned models, **D** = **V anchor**. Read the **E anchor** table → Accuracy (+AUC). Comment: "Winner = …, Accuracy = …".
*Marking: 1 union of models, 1 M/D wiring, 1 reads E anchor, 1 winner+metric stated.*

**B6 (4):**
**Score**: D = **V anchor**, M = winning model **O** → adds probability fields. → **Lift Chart**: type **Total cumulative response**; *true response rate* = B1's value; target level = **1**; if the tool requires the bottom input → **Input Data** `LiftChart_Quantiles_DummyInput.csv`. Read the curve at x = 20% → y = % captured; comment the sentence.
*Marking: 1 score wiring, 1 true-rate from B1 (not guessed), 1 dummy-input handling/level, 1 correct read-off sentence.*

## TASK C SOLUTION — Superstore Quick Answers

**C1 (3):** Sales + Order Date → Show Me line → drill pill to continuous Month (or keep Year-Month) → **Analytics → Forecast** drag on → right-click forecast → **Forecast → Forecast Options → Forecast Length: Exactly 6 months**. Shaded band = 95% prediction interval.
*1 line chart, 1 forecast added, 1 horizon exactly 6.*

**C2 (3):** Customer Name → Rows; Sales → Columns; **Filters: Sub-Category = Tables; Region = Southeast Asia**; then **Customer Name pill → Filter → Top tab → By field: Top 10 by SUM(Sales)**; sort desc; labels on.
*1 both filters, 1 Top-10 by-field filter (not manual ticking), 1 labels/sort.*

**C3 (3):** Double-click **State** → map; **Profit → Color**; **Filters: Country = China, Category = Furniture**; diverging palette makes negative-profit state(s) pop (oranges among blues/greens); hover to name it.
*1 map built via geo role, 1 filters, 1 loss state identifiable.*

**C4 (2):** **Analysis → Create Calculated Field** → `Margin` = `SUM([Profit])/SUM([Sales])` → view: Category → Columns, Region → Rows, **AGG(Margin)** → Text/Label (or Rows axis as in lecture).
*1 formula aggregate-correct, 1 view shows margin by both dims.*

**C5 (2):** Sales → Rows, Sub-Category → Columns → sort desc → right-click **SUM(Sales) → Quick Table Calculation → Percent of Total** → labels on.
*1 percent-of-total calc, 1 descending+labeled.*

## TASK D SOLUTION — Management View

**D1 (2):** Segment → Columns, Region → Rows, **Profit → Color**, Entire View. *1 placement, 1 color encoding.*

**D2 (3):** Sub-Category → Columns; Sales + Discount → Rows; right-click SUM(Discount) → **Dual Axis**; Marks: SUM(Sales)=**Bar**, SUM(Discount)=**Line**; sort by Sales desc. *1 dual axis, 1 mark types, 1 sort.*

**D3 (4):** New Dashboard → rename **Mock Dashboard** → tick **Show dashboard title** → drag C2, D1, D2 → add Category filter (on any sheet: right-click Category → Show Filter, or use a filter already on a sheet) → filter card **caret → Apply to Worksheets → All Using Related Data Sources** → test: clicking a Category changes ALL three.
*1 three sheets placed, 1 title, 2 cross-filter actually works.*

**D4 (3):** New Story → Edit title **Mock Story** → drag Mock Dashboard → caption insight ("…Region X drives profit; discounts erode Sub-Category Y…") → **Blank** → drag C3_LossMap → caption ("Furniture in China: state Z unprofitable…") → **File → Export Packaged Workbook → MOCK1_Tableau.twbx**.
*1 two captioned points, 1 captions carry insight (not labels), 1 .twbx exported.*

---

## MARKING RUBRIC SUMMARY

| Task | Marks | Pass signal (≥70%) |
|---|---|---|
| A — ETL | 15 | Files produced with exact names; join anchors explained; $-cleaning done |
| B — Predictive | 20 | Correct E/V discipline; M/D wiring right; lift sentence quantified |
| C — Tableau charts | 13 | Top-N via filter dialog; forecast exactly 6; margin as AGG |
| D — Dashboard/Story | 12 | Cross-filter genuinely drives all sheets; .twbx exported |
| **Total** | **60** | **42+ = on track for the 25 hands-on final marks** |

**Common mark-leaks observed in labs (self-check):**
1. Continuing from the wrong Filter anchor (T vs F).
2. Summing string money columns (silent nulls) — always Browse after conversion.
3. Building models on the FULL dataset instead of the E anchor.
4. Forgetting model NAMES (Stepwise/Compare then can't reference them).
5. Tableau: aggregated scatter (forgot to untick Aggregate Measures) and missing worksheet renames.
6. Forgetting `|||SheetName` syntax or exporting .twb instead of .twbx.

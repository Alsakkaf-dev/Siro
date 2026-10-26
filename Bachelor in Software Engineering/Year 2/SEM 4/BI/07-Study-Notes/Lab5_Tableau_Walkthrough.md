# Lab 5 — Tableau Exercises: Complete Walkthrough
**SECP3213 Business Intelligence | Submit as .twbx before Sat 5:00 pm**

Deliverable: ONE Tableau workbook, 5 worksheets named **Question 1 … Question 5**, exported as `.twbx`, uploaded to e-learning.

---

## PART A — Setup

**A1.** Download **US APAC – Superstore Spreadsheet.xlsx** from e-learning (same section as the Lab 5 PDF). Use ONLY this file.

**A2.** Open **Tableau** (Start menu).

**A3.** Connect the data:
1. Connect pane (left) → *To a File* → **Microsoft Excel** → pick the xlsx → Open.
2. On the Data Source page, drag the **Orders** sheet into the white canvas ("Drag tables here").
3. Bottom-left → click the **Sheet 1** tab.

**A4.** Screen names used below:
- **Data pane** = left column (blue = dimensions/text, green = measures/numbers)
- **Columns / Rows shelves** = two bars at the top
- **Filters card** + **Marks card** (Color, Size, Label, Text) = boxes left of the chart
- **Sort icons** = toolbar, bar-chart icons with ↓ / ↑

**A5.** Ctrl+S → save workbook as `Lab5`.

---

## Question 1 — Top 10 Customers (by Sales) who bought Tables in Southeast Asia

1. New worksheet.
2. **Customer Name** → Rows shelf.
3. **Sales** → Columns shelf (bars appear).
4. **Sub-Category** → Filters card → in dialog: **None** → tick **Tables** → OK.
5. **Region** → Filters → **None** → tick **Southeast Asia** → OK.
6. **CRITICAL:** right-click the **Sub-Category** pill in the Filters card → **Add to Context**. Repeat for **Region**. Both pills turn grey.
   (Without this the Top 10 is computed on ALL sales — wrong answer.)
7. **Customer Name** → Filters (again) → **Top** tab → **By field** → Top **10** by **Sales**, **Sum** → OK.
8. Toolbar → sort **descending** (↓).
9. Marks card → Label → tick **Show mark labels**.
10. Rename sheet tab → **Question 1** → Ctrl+S.

**Answer = the 10 names top-to-bottom.**

---

## Question 2 — State with the lowest Sales for Chairs

1. New worksheet.
2. **State** → Rows. **Sales** → Columns.
3. **Sub-Category** → Filters → **None** → tick **Chairs** → OK.
4. Toolbar → sort **ascending** (↑). First row = lowest.
5. Label on. Rename tab → **Question 2** → Ctrl+S.

**Answer = state in the first row.**

---

## Question 3 — Sub-Category $75,934 below the Average Sales per Category

**Pass 1 — find the average:**
1. New worksheet.
2. **Category** → Rows. **Sales** → Columns (3 bars).
3. Left pane → click the **Analytics** tab.
4. Drag **Average Line** onto the chart → drop on **Table**.
5. Hover the dashed line → note the average value. WRITE IT DOWN.

**Pass 2 — subtract from each sub-category:**
6. Back to the **Data** tab. Clear the sheet (toolbar Clear) or make a new worksheet.
7. **Sub-Category** → Rows. **Sales** → Columns.
8. Menu **Analysis → Create Calculated Field** → name: `Diff from Avg` → formula (your number, no commas):

   `SUM([Sales]) - <average from Pass 1>`

9. OK. Drag **Diff from Avg** → **Label** on the Marks card.
10. Find the sub-category labelled ≈ **−75,934**.
11. Rename tab → **Question 3** → Ctrl+S.

**Answer = the sub-category whose Diff ≈ −75,934.**

---

## Question 4 — Customer who bought the most Tables (Quantity), Southeast Asia, 2016

1. New worksheet.
2. **Customer Name** → Rows. **Quantity** → Columns.
3. **Sub-Category** → Filters → **None** → **Tables** → OK.
4. **Region** → Filters → **None** → **Southeast Asia** → OK.
5. **Order Date** → Filters → choose **Years** → Next → tick **2016** only → OK.
6. Sort **descending**. Label on.
7. Rename tab → **Question 4** → Ctrl+S.

**Answer = customer in the first row.**

---

## Question 5 — Unprofitable state surrounded by profitable states (China, Furniture)

1. New worksheet.
2. Data pane → **double-click State** → map auto-builds.
3. **Country** → Filters → **None** → **China** → OK.
4. **Category** → Filters → **None** → **Furniture** → OK.
5. **Profit** → **Color** on the Marks card. Blue = profit, orange/red = loss.
6. If circles instead of filled regions: Marks dropdown ("Automatic") → **Map**.
7. Find the ONE orange state with blue states all around it. Hover → read its name.
8. If "X unknown" appears bottom-right: click it → **Edit Locations** → Country/Region = **China** → OK.
9. Rename tab → **Question 5** → Ctrl+S.

**Answer = that orange state.**

---

## PART C — Export & Submit

1. Verify tabs: Question 1, Question 2, Question 3, Question 4, Question 5.
2. **File → Export Packaged Workbook…** → `YourName_Lab5.twbx`.
   (Alt: File → Save As → type = Packaged Workbook .twbx)
3. Upload to e-learning. **Deadline Sat 5:00 pm.**

## Remaining checklist (from Dr's message)
- [ ] Topic 5 recorded session (Power BI) — watch
- [x] Power BI installed + gsheet updated
- [ ] Lab 5 .twbx submitted
- [ ] EPPK on UTM portal (5 min)
- [ ] Past year paper — when uploaded, before next week

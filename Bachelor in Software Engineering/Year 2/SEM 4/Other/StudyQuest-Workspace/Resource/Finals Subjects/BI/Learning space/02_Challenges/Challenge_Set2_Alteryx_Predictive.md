# CHALLENGE SET 2 — Alteryx Data Investigation & Predictive (8 timed builds)
**Matches Labs 2–4. Same method: write the tool sequence FIRST (tools + key configs + anchors), then build, then check `Challenge_Set2_Alteryx_Predictive_SOLUTIONS.md`. Predictive Tools must be installed (Lab 2 page 1).**

---

## C2.1 — First contact with a dataset (8 min)
**Dataset:** `2.2 Lab 2 Guideline Dataset/0. Lab 2 Dataset/SalesData.csv` (OrderID, CustomerID, ProductID, OrderDate, Quantity, UnitPrice, TotalSales)
**Scenario:** Before any modelling, management asks for a data-quality memo: types, nulls, min/max/mean/std-dev, distinct counts, and any suspicious values.
**Tasks:**
1. One tool gives ALL of that — which palette and tool? Wire it and run.
2. Explain what comes out of each of its three anchors (O / R / I) and which one you'd Browse for interactive EDA.
3. State one finding about UnitPrice (lab's own observation).
**Expected outcome:** a profile per field + a one-line quality verdict.

## C2.2 — Investigation battery: who buys, where, how related? (15 min)
**Dataset:** `CustomerDemographics_Updated.xlsx` (CustomerID, Age, MonthlyIncome, Gender, Region) + `SalesData.csv`
**Scenario:** Marketing asks four micro-questions:
 (a) Are Age and MonthlyIncome correlated (one number, Pearson)?
 (b) How many customers per Gender?
 (c) How is Gender distributed across Region (matrix)?
 (d) What is the AVERAGE TotalSales per Region (chart)? — needs the two files combined first.
 (e) Does UnitPrice relate to TotalSales (picture)?
**Tasks:** name the one Data Investigation tool per question + its exact config; for (d) name the join key and required type fixes (lab specifies them).
**Expected outcome:** 5 tools correctly chosen; you can read each answer off its Browse.

## C2.3 — Monthly sales line + two forecasting engines (15 min)
**Dataset:** `SalesData.csv`
**Scenario:** Inventory planning needs a monthly TotalSales trend and TWO candidate forecast models built on it.
**Tasks:**
1. Prepare one-row-per-month series (which two prep tools before any TS tool, and why?).
2. Plot the series (tool + the 3 configs: target field, frequency, plot type).
3. Build ETS model `ETS_MonthlySales` and ARIMA model `ARIMA_MonthlySales` (the 3 shared configs).
4. From each model, which anchor shows the forecast table vs the chart?
**Expected outcome:** a TS plot + two named model objects ready for comparison.

## C2.4 — Model bake-off + the actual 6-month forecast (12 min)
**Dataset:** continue from C2.3 (or `3.3. Lecture Dataset 4.3/Dataset 4.3/rossmannstoressales.xlsx`: Date, Sales — the lecture's daily-sales case)
**Scenario:** Management asks: *which forecasting method is more reliable, and what are the next 6 months' expected sales with 95% and 80% bounds?*
**Tasks:**
1. Wire the comparison tool: what goes into its TWO inputs? (Be precise about which anchor of the models, what "holdout" means, and how much data the slides say to hold out.)
2. Name the error metrics you'll quote.
3. Run the final forecast: tool + its 4 configuration items.
**Expected outcome:** a metrics table naming the winner + a 6-row forecast table with point forecast and two confidence-bound pairs.

## C2.5 — Restaurant expenditure regression (18 min)
**Dataset:** `2.2 Lab 2 Guideline Dataset/0. Lab 2 Dataset/0. Restaurant_Survey.csv` (Household_ID, Monthly_Income, Household_Size, Education_Level, Age, Restaurant_Expenditure — 1000 households; the lecture's restaurant use case)
**Scenario:** *How much money do we expect each household to spend on eating out, and which variables best indicate it?*
**Tasks:**
1. Split 70/30 (tool + anchor letters + approximate record counts).
2. Build a linear model `Linear_RestExp` predicting Restaurant_Expenditure from Monthly_Income, Household_Size, Age (type fixes first — name the tool).
3. From which anchor/report do you read R² and coefficients? What does a positive Monthly_Income coefficient mean in one sentence?
4. Let the machine choose the best predictor subset: tool, its two key settings, and the decision rule (AIC direction).
5. Score the validation set; name the new column.
**Expected outcome:** R² + retained predictors + a predictions column on unseen households.

## C2.6 — Will they respond? Balanced logistic + lift (18 min)
**Dataset:** `3.2. Lab 3 Guideline Dataset/0. Lab 3 Guideline Dataset/Customer_Regression_Classification.csv` (CustomerID, Age, Income, Region, PurchaseAmount, Response 0/1 — 150 records) + `LiftChart_Quantiles_DummyInput.csv`
**Scenario:** A campaign can only mail 20% of customers. Build a response model and prove it beats random selection.
**Tasks:**
1. Check imbalance first (which investigation tool tells you the response rate?). Note the rate — you need it later.
2. Balance the data (tool + its 3 configs).
3. 70/30 split, then `Logistic_Regression_Response` on Age, Income, Region — which anchor shows odds ratios?
4. Score the VALIDATION set (which two inputs into Score?).
5. Lift Chart: chart type options (2), where the "true response rate" number comes from, what the dummy quantile file is for, and what "good" looks like in the first two deciles.
**Expected outcome:** a gains chart you can interpret aloud: "mailing the top X% captures Y% of responders."

## C2.7 — Four-model tournament (15 min)
**Dataset:** same `Customer_Regression_Classification.csv` (binary Response) — optional encore with `3.3. Lecture Dataset 4.3/Dataset 4.3/iris.csv` (multiclass)
**Scenario:** The team argues: logistic vs decision tree vs forest vs neural network. Settle it with evidence on held-out data.
**Tasks:**
1. From ONE estimation stream, build all four models (same target/predictors; give each a clean name).
2. Combine the four model objects for judging — which humble ETL tool does that?
3. Wire Model Comparison: which input gets the models, which gets the validation rows; what arrives on its E / P / R anchors?
4. Name the two headline metrics you'd quote for a binary task, and the slide's three-word summary of why Forest beats a single tree.
**Expected outcome:** one error-measures table; you point at the winner and justify in one sentence.

## C2.8 — Customer segmentation, K unknown (18 min)
**Dataset:** `2.2 Lab 2 Guideline Dataset/0. Lab 2 Dataset/0. Customer_Clustering.csv` (Customer_ID, Annual_Income, Spending_Score, Age — 500 customers)
**Scenario:** Marketing wants customer segments for differentiated campaigns — but nobody knows how many segments exist.
**Tasks:**
1. Why is this UNsupervised? (One sentence, slide vocabulary.)
2. Determine a defensible K: tool, its algorithm options (3), standardization options (2), and how you read its output.
3. Run the clustering with your K (tool + 5 config items) — which anchor gives the report with cluster sizes/centroids?
4. Attach each customer's cluster number back onto the data (tool with "no configuration required").
5. Profile the segments: average Income/Spending_Score/Age and count per cluster (which ETL tool?), then christen each segment with a marketing name.
**Expected outcome:** K clusters, a profile table, and names like "young high-spenders / wealthy savers…".

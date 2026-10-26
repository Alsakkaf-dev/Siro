# CH4.3 MASTERY — Data Investigation & Predictive Analytics in Alteryx (Labs 2–4)
**SCSP3213 Business Intelligence | Sources: CH04P3_Data Investigation and Predictive in Alteryx.pdf + 2.1 Lab 2 Guideline(v3).pdf + 3.1. Guideline-Students (4.5).pdf**
**Four palettes (requires Alteryx Predictive Tools installed): Data Investigation, Time Series, Predictive, Predictive Grouping. These tools are R-based — most output through O/R/I anchors. Anchor literacy = marks.**

---

## 0. THE THREE-ANCHOR PATTERN (learn once, use everywhere)

Most investigation/predictive tools output:
- **O (Output / model Object):** the R model object or processed data → feeds Score, Stepwise, TS Compare, Model Comparison, Union of models. *"Continues to next tool."*
- **R (Report):** static summary report — statistics, coefficients, plots → feeds Render/Browse for documentation.
- **I (Interactive):** interactive dashboard/table — EDA, drill-down, forecast values table.
Rule of thumb from Lab 2: **use I to read the numbers, R to put a chart in a report, O to keep building.**

Data Investigation phase goals (slide): **1 Investigation** (discover meaningful data, understand significant relationships) → **2 Preparation** (clean) → **3 Transformation** (consolidate/eliminate/transform for analysis).

---

## 1. DATA INVESTIGATION PALETTE (Lab 2, Exercises 1–6)

**Field Summary**
- What: profiles every selected field — **Type, Nulls/missing, Min, Max, Mean, Std Dev, Cardinality (distinct values)**, histograms; flags remarks.
- Config: tick fields to profile. Outputs O (summary data), R (report), I (interactive profile).
- When: FIRST tool on any unknown dataset. Exam phrasing: "investigate/profile the data quality."
- Lab 2 read-out skill: "Quantity and TotalSales numeric, complete; UnitPrice may have mild outliers."

**Association Analysis**
- What: **correlation matrix** between numeric fields; measures strength of relationships.
- Config: (1) tick fields to analyze (e.g., Age, MonthlyIncome); (2) method = **Pearson** (course default; Spearman/Hoeffding exist); (3) optionally tick **"Target a field for more detailed analysis"** and choose the target (Age) → detailed report w.r.t. that target.
- Output: correlation score; **positive = both rise together; negative = inverse**.
- When: "is X related to Y?", "which variables are associated with spending?" — also pre-model predictor screening.

**Frequency Table**
- What: counts of each unique value of categorical field(s) (+ percentages).
- Config: choose grouping field, e.g., Gender.
- When: "how many records per category?", spotting inconsistent labels and class imbalance.

**Contingency Table**
- What: **joint frequency** of TWO+ categorical fields (cross-classification matrix).
- Config: set row variable (Gender) and column variable (Region).
- When: "how is Gender distributed across Region?" — two categoricals together.

**Plot of Means**
- What: chart of the **average of a numeric variable across category levels**.
- Config: numeric/response field = TotalSales; group/category field = Region.
- When: "compare average sales by region" visually; quick group-difference check.

**Scatterplot**
- What: relationship between TWO numeric variables (with optional smooth line).
- Config: X = UnitPrice, Y = TotalSales (Lab 2). Ensure types are numeric first (Select tool: Quantity→Int64, UnitPrice/TotalSales→Double).
- When: "visualize correlation between price and sales" — pairs with Association Analysis (numbers) as its picture.

> Quick chooser: one numeric profile→Field Summary | numeric↔numeric→Scatterplot/Association | categorical counts→Frequency Table | categorical×categorical→Contingency Table | numeric by category→Plot of Means.

---

## 2. TIME SERIES PALETTE (Lab 2, Exercises 7–11)

**Theory you must recite (slides):**
- A time series forecast uses information in a series (possibly + covariates) to predict its **future values**. Input example: monthly sales.
- TS data often needs cleaning: **frequency** issues (too high / unevenly spaced → resample), **outliers** (corrupt/extreme values), **missing** values (interpolate/impute).
- TS analysis accounts for **internal structure**: **autocorrelation, trend, seasonal variation**.
- **Performance measures: RMSE, MAE, MAPE, MASE** (TS Compare prints these).
- **ETS = exponential smoothing** — weighted average of past observations with **exponentially declining weights**. **ARIMA = AutoRegressive Integrated Moving Average** — "most commonly used, most general class" of TS models; can include covariates.

**Preparation pattern before any TS tool (Lab 2 Ex.7):**
Input → Select/DateTime (OrderDate as Date, money as Double) → **Summarize: GroupBy OrderDate(month), Sum TotalSales** → one row per period. TS tools need one observation per time period.

**TS Plot**
- Config: (a) Target field = Sum_TotalSales; (b) **Target field frequency** = Monthly; (c) Plot type = Time series plot (also: decomposition etc.).
- Anchors: **R** = visual plot for reports; **I** = data table behind the plot.
- When: ALWAYS look at the series first — trend? seasonality? anomalies?

**ETS**
- Config: (a) **Model name** (no spaces, e.g., ETS_MonthlySales); (b) Target field = TotalSales (the summed field); (c) frequency = Monthly. (Model-type tabs auto-select error/trend/seasonality by default.)
- Output: O = model object; R = forecast chart; I = forecast table with prediction intervals.

**ARIMA**
- Config: same trio — Model name (ARIMA_MonthlySales), target field, frequency. Defaults auto-fit (p,d,q). Can use covariates (advanced).
- Output anchors as ETS.

**TS Compare**
- What: compares models (ETS vs ARIMA) on a **holdout** sample using accuracy measures (**MAPE, RMSE, MAE, MASE…**) → pick the better model.
- Wiring (slide-exact): **L input** ← the model objects (O anchors) of ETS and ARIMA **unioned together**; **R input** ← **holdout data (10–20% of total)** — the most recent periods withheld from training.
- When: "which forecasting model is more reliable?"

**TS Forecast**
- What: produces the actual forecast table from the chosen model: **period dates, point forecast, upper & lower confidence bounds** at two confidence levels.
- Config: (a) name for point-forecast field; (b) confidence level 1 (commonly **95 or 99**); (c) confidence level 2 (commonly **80 or 90**); (d) **number of future periods** (e.g., 6 months).
- Wiring: model O anchor → TS Forecast → Browse.
- When: "forecast the next N months for inventory/budget planning." Output is **tabular, not graphical**.

**Canonical Lab 2 chain:**
```
Input SalesData.csv → Select(types) → [DateTime if needed] → Summarize(GroupBy Month(OrderDate); Sum TotalSales)
   → TS Plot (see trend)
   → ETS  (ETS_MonthlySales) ──┐
   → ARIMA (ARIMA_MonthlySales)┴→ Union(O anchors) → TS Compare ← holdout rows (last 10–20%)
   → best model O → TS Forecast (6 periods, 95/80) → Browse  → decision: inventory plan
```

---

## 3. PREDICTIVE PALETTE — REGRESSION (Lab 3, Exercises 1–4)

**Theory:** Regression = predictive modelling of the relationship between a **dependent (target)** variable and **independent (predictor)** variable(s). Clean and prep first. Restaurant use case questions: "How much will each household spend eating out?" and "Which variables best indicate spending?"

**Create Samples**
- Config: Estimation % = 70, Validation % = 30 (Holdout = remainder if <100). Anchors **E / V / H**.
- WHY: train on E, test on V — measuring on training data flatters the model. 150 records → ≈105 E / ≈45 V.

**Linear Regression**
- What: linear model for a **continuous** target.
- Config: (a) Model name = Linear_Purchase_Model; (b) Target = PurchaseAmount (Double); (c) Predictors = Age (Int), Income (Double). (Fix types with Select FIRST — the tool refuses or misbehaves on wrong types.)
- Anchors: **O** model object | **R** report: **coefficients table + R-squared** (fit) + p-values | **I** interactive dashboard.
- Reading skill: coefficient sign/size = direction/strength; R² close to 1 = strong fit; p < 0.05 = significant predictor.

**Stepwise**
- What: automatic **variable selection** — iteratively adds/removes predictors to maximize a fit measure.
- Wiring: **Left/upper input = O anchor of an existing model (Linear Regression)**; **right/lower input = the SAME training data (E anchor)**. (Lab text describes connecting the training data and the Linear Regression output; the model is required, data feeds re-estimation.)
- Config: model name = Stepwise_Purchase_Model; **Search direction = Backward / Forward / Both** (lab uses Both); **fit measure = AICc** (lab default "recommended for small datasets"; alternatives AIC/BIC — **prefer the model with MINIMUM AIC/BIC**).
- Output: reduced model keeping only significant predictors (+ their coefficients).

**Score**
- What: applies a model to data → **new prediction column**. Continuous target → predicted value; categorical target → **probability per class** (fields like `Score_0`, `Score_1` or `Score_yes`).
- Wiring: **D input = data to score (V anchor!)**; **M input = model O anchor** (from Linear Regression/Stepwise/Logistic…).
- Config: Local Model (vs Promote); **new field name**, e.g., PurchaseAmount_StepwiseModel.
- NOTE (slide): Score does NOT evaluate performance by itself — pair with Lift Chart / Model Comparison.

**Canonical regression chain (Lab 3):**
```
Input Customer_Regression_Classification.csv → Select (Age Int; Income, PurchaseAmount Double)
 → Create Samples (70/30)
    E → Linear Regression (target PurchaseAmount; predictors Age, Income) → R: read R², coefficients
         O ┐
    E ─────┴→ Stepwise (Both, AICc) → O ┐
    V ──────────────────────────────────┴→ Score (PurchaseAmount_StepwiseModel) → Browse: predictions on unseen data
```

---

## 4. PREDICTIVE PALETTE — CLASSIFICATION (Lab 3, Exercises 5–11)

**Theory:** Classification predicts a **categorical class label** (binary: respond 0/1; multiclass: Iris Setosa/Versicolour/Virginica). Needs Input/Features + Target/Response. Prep steps named on slides: **data cleaning** (noise, missing), **relevance analysis** (correlation of attributes), **data transformation & reduction** (normalization for neural nets/distance methods, generalization via concept hierarchies; also wavelets, binning, histograms, clustering). **Performance: confusion matrix → Accuracy, F1, AUC.**

**Oversample Field** — (see CH4.2 §B) target = Response, positive level = 1 → ~50/50 balance. Use BEFORE Create Samples in Lab 3's flow.

**Logistic Regression**
- What: binary classifier → **probability of each of two outcomes**; report shows **odds ratios** + model summary.
- Config: model name = Logistic_Regression_Response; Target = Response; Predictors = Age, Income, Region.
- Anchors: O model | R report | I interactive.

**Decision Tree**
- What: **if-then split rules**; highly interpretable tree diagram.
- Config: model name; target; predictors. (Model type auto by target: classification if categorical.)

**Forest Model**
- What: **ensemble of decision trees** built on **bootstrapped** random samples, limited variables per split → **reduces overfitting**; outputs confusion matrix + variable importance.
- Config: model name; target; predictors; (number of trees default 500).

**Naive Bayes Classifier**
- What: probabilistic classifier (binomial or multinomial) **assuming predictors are independent**; gives probability of belonging to each class.
- Config: model name; target; predictors.

**Neural Network**
- What: **feedforward perceptron with a single hidden layer**; hidden neurons use **logistic (sigmoid)** activation; output activation depends on target type. "First machine learning algorithm," mimics brain neurons; captures **complex, nonlinear** patterns.
- Config: model name; target; predictors; (hidden nodes default 10).

**Lift Chart**
- What: evaluates binary classifiers visually — **cumulative captured response (gains) chart** or **incremental response rate chart**; assesses ranking quality and economic implications.
- Wiring: input = **SCORED validation data** (from Score tool). If it demands a bottom input: feed the **dummy quantile Text Input / LiftChart_Quantiles_DummyInput.csv (0.1…1.0)**.
- Config: (a) chart type = **Total cumulative response** OR **Incremental response rate**; (b) **true (original) response rate** of the target — get it from Data Investigation (Frequency Table!); (c) target level (1/yes).
- Reading: **steeper early deciles = better model** (top 10–20% of scored customers capture a disproportionate share of true responders).

**Model Comparison**
- What: compares models on a validation set → **error measures table (Accuracy, AUC, …), predictions, diagnostic report**; best model highlighted.
- Wiring: **M input = model objects unioned** (e.g., Logistic + Decision Tree + Forest + Neural Network); **D input = validation data (V anchor)**.
- Anchors: **E** = error-measures table; **P** = actual vs predicted values; **R** = report with diagnostics.

**Canonical classification chain (Lab 3):**
```
Input CSV → Browse (check imbalance via Frequency Table/Field Summary)
 → Select (types) → Oversample Field (Response, level 1)
 → Create Samples (70/30)
    E → Logistic Regression ─┐
    E → Decision Tree ───────┤
    E → Forest Model ────────┼→ Union (O anchors) → Model Comparison ← V
    E → Neural Network ──────┘        (E anchor: accuracy/AUC table → pick winner)
    V + Logistic O → Score → Lift Chart (true rate from Frequency Table; level 1)
```

---

## 5. PREDICTIVE GROUPING PALETTE — CLUSTERING (Lecture 4.6 / Lab 4)

**Theory:** Clustering = **unsupervised** classification (no target provided). Groups observations so members of a cluster are more similar to each other than to other clusters. Use cases: store grouping by location, **customer segmentation**, insurance fraud detection. Restaurant case: "Which customers are similar? Which stores have similar surrounding demographics?"

**Principal Components**
- What: **dimensionality reduction** — transforms original numeric fields into fewer **factors/principal components** that retain most of the **variance (information)**.
- Config: (a) select numeric fields; (b) **"Scale each field to have unit variance"** = standardize (use the correlation rather than covariance basis — tick when fields have different units); (c) tick output options to **append PC fields to the data** (number of PCs adjustable after first run).
- When: too many numeric variables before clustering.

**K-Centroids Diagnostics**
- What: helps **choose K** (number of clusters) for a chosen algorithm — produces adjusted-Rand / Calinski-Harabasz style plots over a range of K.
- Config: (a) numeric fields; (b) **standardize: z-score OR unit interval**; (c) algorithm: **K-Means / K-Medians / Neural Gas**; (d) range of clusters to test + number of bootstrap replicates.
- Reading: pick K where the diagnostic medians peak / stabilize.

**K-Centroids Cluster Analysis**
- What: performs the **partitioning clustering** — divides records into the "best" K groups.
- Config: (a) **solution name**; (b) numeric fields; (c) standardize (z-score / unit interval); (d) algorithm (**K-Means** default); (e) **number of clusters = K from Diagnostics**.
- Anchors: O = solution object | R = report (cluster sizes, centroids, convex hulls plot).

**Append Cluster**
- What: **adds the cluster assignment** (cluster number) of each record to the data stream — *no configuration required* (name of solution optional).
- Wiring: data + cluster solution O → Append Cluster → downstream profiling.

**Canonical clustering chain:**
```
Input (0. Customer_Clustering.csv: Customer_ID, Annual_Income, Spending_Score, Age)
 → Select (numerics correct) → [Principal Components if many fields]
 → K-Centroids Diagnostics (K-Means, z-score, test K=2..8) → read best K
 → K-Centroids Cluster Analysis (same fields/standardize/algorithm; K = chosen)
 → Append Cluster → Summarize (GroupBy Cluster; Avg Income, Avg Spending_Score, Count) → name the segments
```

---

## 6. WHICH MODEL DO I REACH FOR? (exam decision table)

| Business question | Target type | Tool chain |
|---|---|---|
| "Forecast next 6 months' sales" | time series | Summarize(by month) → TS Plot → ETS + ARIMA → TS Compare → TS Forecast |
| "Predict how much a customer will spend" | continuous number | Create Samples → Linear Regression (→ Stepwise) → Score |
| "Which variables drive spending?" | continuous | Linear Regression R-report (+ Stepwise to select; Association Analysis to screen) |
| "Will the customer respond? (yes/no)" | binary | Oversample Field → Create Samples → Logistic Regression (+DT/Forest/NN) → Score → Lift Chart |
| "Which of several classes is it?" (Iris) | multiclass | Decision Tree / Forest / Naive Bayes / Neural Network → Model Comparison |
| "Which model is best?" | any | Model Comparison (classification/regression) or TS Compare (time series) |
| "Segment customers (no labels)" | none (unsupervised) | (Principal Components) → K-Centroids Diagnostics → K-Centroids Cluster Analysis → Append Cluster |
| "Too many variables" | n/a | Principal Components (numeric) or Stepwise (model-driven) |
| "Is the data imbalanced?" | binary target | Frequency Table → Oversample Field |

## 7. METRIC VOCABULARY (write-up + viva lines)
- **R-squared** — share of target variance explained (regression fit).
- **AIC / AICc / BIC** — model selection criteria; **lower is better** (Stepwise).
- **RMSE / MAE / MAPE / MASE** — forecast error measures (TS Compare); lower is better.
- **Confusion matrix → Accuracy, F1, AUC** — classification quality (Model Comparison).
- **Lift / cumulative gains** — how much better than random the model ranks responders; early-decile lift = campaign targeting value.
- **Estimation vs Validation vs Holdout** — train vs test vs untouched final check.

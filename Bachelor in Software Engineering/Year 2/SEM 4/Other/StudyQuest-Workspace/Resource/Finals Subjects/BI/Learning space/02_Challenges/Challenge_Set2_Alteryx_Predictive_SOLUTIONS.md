# SOLUTIONS — Challenge Set 2: Alteryx Investigation & Predictive

---

## S2.1 — First contact
1. **Data Investigation palette → Field Summary**. Input Data (SalesData.csv) → Field Summary (tick all fields) → Browse on each anchor → Run.
2. **O** = summary dataset (rows = fields, columns = statistics) → feeds further workflow. **R** = static written report (averages, missing, min/max) for documentation/Render. **I** = interactive profiling dashboard → the one to Browse for EDA drill-down.
3. Lab's own verdict: *Quantity and TotalSales are numeric and complete; **UnitPrice may have mild outliers**; TotalSales variability aligns with Quantity.*
**Correct output:** per-field table showing Type / Nulls / Min / Max / Mean / Std Dev / Cardinality.

## S2.2 — Investigation battery
(a) **Association Analysis** — Input = CustomerDemographics_Updated.xlsx → tick fields **Age, MonthlyIncome**; method **Pearson**; tick *Target a field for more detailed analysis* → target **Age**. Browse → one correlation coefficient; positive = income rises with age.
(b) **Frequency Table** — grouping field **Gender** → counts per category.
(c) **Contingency Table** — rows **Gender**, columns **Region** → joint frequency matrix.
(d) **Join** SalesData ←**CustomerID**→ CustomerDemographics (J anchor), with **Select** first per lab: Quantity → Int64, TotalSales → Double, Age → Int64 → **Plot of Means**: group field **Region**, measure **TotalSales** → bar-style chart of averages.
(e) **Scatterplot** — X = **UnitPrice**, Y = **TotalSales** (types already Double) → positive linear pattern.
**Correct output:** five Browses, each answering its micro-question directly.

## S2.3 — Monthly series + two engines
1. **Select/DateTime** (OrderDate must be Date type; UnitPrice/TotalSales Double) then **Summarize**: GroupBy **OrderDate (grouped to month)** + **Sum TotalSales**. WHY: TS tools require exactly one observation per period.
2. **TS Plot**: Target field = **Sum_TotalSales**; Target field frequency = **Monthly**; Plot type = **Time series plot**. R anchor = chart; I anchor = the plotted data table.
3. **ETS**: Model name `ETS_MonthlySales`; Target = Sum_TotalSales; Frequency Monthly. **ARIMA**: Model name `ARIMA_MonthlySales`; same target/frequency. Both fed from the SAME Summarize output.
4. **I anchor = forecast table with prediction intervals; R anchor = chart** (lab: "use R to display the graph and I to examine the data points"). O = the model object for downstream tools.
**Correct output:** monthly line (with the lab's upward/seasonal interpretation) + two named models.

## S2.4 — Bake-off + forecast
1. **TS Compare**. **L input** ← the two model objects: ETS **O** + ARIMA **O** passed through a **Union** first. **R input** ← **holdout data** = the most recent **10–20%** of the periods, withheld from model building (slide-exact figure). Practically: Sample (Last N) or Filter on date for the holdout rows; build the models on the earlier rows.
2. Metrics: **MAPE, RMSE, MAE, MASE** — lower = better; quote MAPE + RMSE (lab names these two).
3. **TS Forecast** from the winning model's O anchor: (a) name for the point-forecast field; (b) confidence level #1 = **95**; (c) confidence level #2 = **80**; (d) periods = **6**.
**Correct output:** comparison table → winner; then 6 rows: period, forecast, 95% high/low, 80% high/low. Tabular, not graphical (slide point).

## S2.5 — Restaurant expenditure regression
1. **Create Samples**: Estimation 70 / Validation 30 → anchors **E/V/H**; 1000 records → ≈700 E / ≈300 V.
2. **Select**: Monthly_Income, Restaurant_Expenditure → Double; Household_Size, Age → Int. Then **Linear Regression** on E: Model name `Linear_RestExp`; Target = Restaurant_Expenditure; Predictors = Monthly_Income, Household_Size, Age (Education_Level optional as categorical).
3. **R (Report) anchor** → coefficients table, p-values, **R-squared**. Positive Monthly_Income coefficient = "each extra RM of monthly income raises expected restaurant spending by ~[coef], holding other variables constant."
4. **Stepwise**: inputs = Linear Regression **O** + the SAME **E** data; configs **Search direction = Both**, **fit measure = AICc** ("recommended for small datasets"); rule: **keep the model with MINIMUM AIC/AICc**.
5. **Score**: **D input = V anchor**, **M input = Stepwise O**; Local Model; New field name `RestExp_StepwiseModel` → Browse shows the prediction column beside actuals.
**Correct output:** R² ≈ a believable 0–1 value, a trimmed predictor list, and ≈300 scored validation rows.

## S2.6 — Balanced logistic + lift
1. **Frequency Table** on Response (or Field Summary / Browse) → note the share of 1s = the **true response rate** for the Lift Chart later. (150 rows; 1s are the minority.)
2. **Oversample Field**: field = **Response**; level to oversample = **1**; percentage ≈ 50 (must not be below the original share).
3. **Select** types (Age Int; Income, PurchaseAmount Double) → **Create Samples** 70/30 → **Logistic Regression** on E: name `Logistic_Regression_Response`; Target Response; Predictors Age, Income, Region. **R anchor = odds ratios + model summary** (I = interactive dashboard).
4. **Score**: D = **V anchor**, M = Logistic **O** → adds probability fields (e.g., Score_0/Score_1).
5. **Lift Chart**: chart types = **Total cumulative response** OR **Incremental response rate**; *true (original) response rate* = the number from step 1 ("can be obtained from the Data Investigation process" — slide); target level = 1. If the tool errors about a missing bottom input → connect **LiftChart_Quantiles_DummyInput.csv** (Quantile 0.1…1.0) — exactly what the lab's note prescribes. GOOD = curve far above the diagonal early: "top 2 deciles capture most responders."
**Correct output:** cumulative-gains chart; exam sentence: "Mailing the top 20% scored customers captures ~Y% of all responders — Z× better than random."

## S2.7 — Four-model tournament
1. From Create Samples **E**: **Logistic Regression**, **Decision Tree**, **Forest Model**, **Neural Network** — all Target = Response; Predictors Age, Income, Region; names like `LR_Resp`, `DT_Resp`, `RF_Resp`, `NN_Resp`.
2. **Union** the four **O** anchors (models stack into one stream — yes, the ETL Union).
3. **Model Comparison**: **M input** = unioned models; **D input** = **V anchor** rows. Anchors: **E = error-measures table** (the scoreboard), **P = actual vs predicted per record**, **R = report with diagnostic plots**.
4. Headline metrics: **Accuracy and AUC** (confusion-matrix family, incl. F1 — slide list). Forest > single tree because bootstrapped trees + limited variables per split **"reduce overfitting"** (lab's phrase: aggregating multiple trees).
**Correct output:** one table ranking 4 models; winner = highest Accuracy/AUC on validation.
*Iris encore:* same pattern, Target = class (3 levels), predictors = the 4 petal/sepal measures; Logistic is replaced by Naive Bayes/Decision Tree/Forest/NN (multiclass-capable tools); goal per slide: "find the model that predicts the class of Iris plant with highest accuracy."

## S2.8 — Segmentation with unknown K
1. Unsupervised because **no target groups are provided** — the algorithm partitions by similarity (slide: "you do not provide the target groups").
2. **K-Centroids Diagnostics**: numeric fields = Annual_Income, Spending_Score, Age (NOT Customer_ID); **Standardize = z-score OR unit interval** (tick z-score); **algorithm options = K-Means / K-Medians / Neural Gas** (pick K-Means); test K range (e.g., 2–8). Read: choose K where the adjusted-Rand / CH median indices peak/stabilize in the report.
3. **K-Centroids Cluster Analysis**: (a) solution name `Cust_Seg`; (b) same 3 fields; (c) z-score standardize; (d) K-Means; (e) **number of clusters = K from Diagnostics**. **R anchor** = report: cluster sizes, mean (centroid) per field, cluster plot. O = solution object.
4. **Append Cluster** — data stream + solution O → adds the cluster number per record; *no configuration required* (slide-verbatim).
5. **Summarize**: GroupBy Cluster; **Avg** Annual_Income, **Avg** Spending_Score, **Avg** Age, **Count** → name segments from the pattern (e.g., "young high-spenders" = low Age, high Spending_Score; "affluent low-engagement" = high income, low score).
**Correct output:** K clusters with a profile row each; every customer carries a cluster label. (Optional: Principal Components first if asked to reduce variables — here only 3, so PCA is for the "many fields" variant.)

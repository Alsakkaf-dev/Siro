# 04 — EMERGENCY FINAL REVIEW (last 48 hours, one document)
**SCSP3213 BI | Print-or-split-screen sheet. Everything here is from HIS course materials only.**

---

## A. ALTERYX TOOL QUICK-REFERENCE (every tool the course teaches)

### In/Out + Documentation
| Tool | Palette | Purpose | Key config / gotcha |
|---|---|---|---|
| Input Data | In/Out | Read file/DB | Wildcard `Customers_*.csv` reads many same-schema files; Excel: pick sheet or `<List of Sheet Names>` |
| Output Data | In/Out | Write results | Excel sheet syntax `file.xlsx|||SheetName`; "Take File/Table Name From Field" = sheet per group |
| Browse | In/Out | View data + profile | Add after anything you must verify; profile tab shows quality/stats |
| Text Input | In/Out | Hand-typed mini table | Lookup tables (N→North), Lift Chart quantiles; saved inside workflow |
| Dynamic Input | Developer (taught with inputs) | Read ALL sheets of one Excel | Needs Input Data feeding `Sheet Names` + template; Action = Change File/Table Name |
| Tool Container | Documentation | Group/disable sections | Right-click selection → Add to New Container; checkbox toggles on/off |

### Preparation
| Tool | Purpose | Key config / gotcha |
|---|---|---|
| Select | Types, rename, reorder, drop | Money=Double, counts=Int, leading-zero IDs=String |
| Auto Field | Auto-shrink types | Run after cleaning; keeps 007 as string |
| Filter | Split rows by condition | Basic or Custom expression; **T = meets condition, F = rest** |
| Sort | Order rows | Multi-field, Asc/Desc each |
| Sample | First/Last/random N | + Group By (first 5 per customer); Top-N = Sort→Sample |
| Unique | Dedup by key fields | **U = first occurrence, D = duplicates** |
| Imputation | Replace values in numerics | Null() → Average/**Median**/Mode/value |
| Formula | New/updated columns | Set output data type! IF/ELSEIF/ELSE/ENDIF; `DateTimeDiff(d1,d2,"days"/"months")` |
| Multi-Field Formula | One expression, many fields | `[_CurrentField_]`, e.g. `"ORD-"+[_CurrentField_]` |
| Multi-Row Formula | Row-aware calc | `[Row-1:Field]`; running totals; one field per tool; Group By resets |
| Create Samples | Train/test split | Estimation/Validation % → anchors **E/V/H** |
| Oversample Field | Balance binary target | Field=Response, level=1, ~50% |

### Parse
| Tool | Purpose | Key config |
|---|---|---|
| DateTime | String↔Date conversion | Direction, field, incoming format (yyyy-MM-dd / custom); makes NEW field |
| Text To Columns | Split one column | Delimiters (`\s` space, `,`), # columns or Split-to-Rows |

### Join
| Tool | Purpose | Key config / gotcha |
|---|---|---|
| Union | Stack rows (same schema) | Auto Config by Name / by Position / Manual |
| Join | Merge on key(s) | **L=left-only, J=matched, R=right-only**; dedupe key columns in embedded select |
| Find Replace | Lookup & replace/append | Find within field; entire field mode; Append vs Replace |
| Append Fields | Small table onto every row | **Cartesian!** keep the error/warn protection on |

### Transform
| Tool | Purpose | Key config |
|---|---|---|
| Summarize | GroupBy + aggregations | Sum/Count/CountDistinct/Min/Max/Avg/Median/First/Concat; outputs `Sum_X`, `Avg_X` |
| Transpose | Wide→tall | Key columns + Data columns → Name/Value pair |
| Cross Tab | Tall→wide pivot | GroupBy rows; header field; value field; aggregation method |

### Reporting
| Tool | Purpose | Key config |
|---|---|---|
| Table | Report-grade table snippet | Optional Group By, column styling |
| Report Header | Title + date + logo | Tick include date |
| Render | Snippets → PDF/Word/Excel/HTML | Output mode + file; chain: Table → Header → Render |

### Data Investigation
| Tool | Purpose | Key config |
|---|---|---|
| Field Summary | Profile all fields (type/nulls/min/max/mean/std/cardinality) | Anchors **O data / R report / I interactive** |
| Association Analysis | Correlation matrix | Method **Pearson**; optional target field for detail |
| Frequency Table | Counts per category | Pick categorical field |
| Contingency Table | Joint counts of 2 categoricals | Row var × column var |
| Plot of Means | Avg of numeric across categories | Group field + measure field |
| Scatterplot | Two numerics relationship | Set X and Y |

### Time Series
| Tool | Purpose | Key config |
|---|---|---|
| TS Plot | See trend/seasonality | Target field, **frequency (Monthly)**, plot type |
| ETS | Exponential-smoothing model | Model name, target, frequency |
| ARIMA | AutoRegressive Integrated Moving Average | Model name, target, frequency |
| TS Compare | Score models on holdout | **L = unioned model O's; R = holdout (10–20%)**; MAPE/RMSE/MAE/MASE |
| TS Forecast | Future N periods table | Field name, conf level 1 (95/99), conf level 2 (80/90), N periods |

### Predictive
| Tool | Purpose | Key config |
|---|---|---|
| Linear Regression | Continuous target | Name/target/predictors; R anchor: coefficients + **R²** |
| Logistic Regression | Binary target probability | Name/target/predictors; report shows odds ratios |
| Stepwise | Auto predictor selection | Inputs: model O + training data; direction Both; fit **AICc/AIC/BIC (min wins)** |
| Decision Tree | If-then split rules | Name/target/predictors; interpretable tree |
| Forest Model | Many bootstrapped trees | Reduces overfitting; variable importance |
| Naive Bayes Classifier | Probabilistic classes | Assumes independent predictors |
| Neural Network | 1 hidden layer, sigmoid | Nonlinear patterns |
| Score | Apply model → prediction column | **D = data (V anchor), M = model O**; new field name |
| Lift Chart | Gains/response-rate chart | Type (cumulative/incremental), **true response rate**, target level; dummy quantile input if asked |
| Model Comparison | Rank models on validation | **M = unioned models, D = validation**; anchors **E errors / P predictions / R report** |

### Predictive Grouping
| Tool | Purpose | Key config |
|---|---|---|
| Principal Components | Reduce numeric dimensions | Fields; scale-to-unit-variance; append PCs |
| K-Centroids Diagnostics | Choose K | Fields; standardize (z-score/unit interval); K-Means/K-Medians/Neural Gas; K range |
| K-Centroids Cluster Analysis | Partition into K clusters | Solution name; fields; standardize; algorithm; **K from diagnostics** |
| Append Cluster | Attach cluster # to rows | No configuration required |

---

## B. TABLEAU QUICK-REFERENCE

| Feature | Where | Recipe |
|---|---|---|
| Connect Excel/CSV | Connect pane | Drag sheet to canvas; check auto data types |
| Live vs Extract | Data source page | Live=fresh+needs connection; Extract=copy, offline, refresh manually |
| Change type / rename / Split / Describe | Data Source page | Type icon click / double-click name / right-click → Split / right-click → Describe |
| Data Interpreter | Left panel of data source | Fixes junk headers/nulls (COGS file) |
| Pivot (cols→rows) | Select columns → right-click → Pivot | Rename Pivot Field Names/Values |
| Dimension vs Measure | Data pane | Blue discrete vs green continuous; measures auto-SUM |
| Line chart | Show Me | Sales + Order Date; + on pill drills Year→Quarter→Month |
| Bar chart | Shelves | Sales→Rows, Category→Columns; sort icon |
| Scatter | Show Me | Profit+Sales; Analysis→untick Aggregate Measures for row-level |
| Packed bubbles / Treemap / Box plot | Show Me | Highlight the right pills first |
| Heat map | Shelves+Marks | Segment→Col, Region→Row, Profit→Color |
| Dual axis combo | Rows pills | Right-click 2nd measure → Dual Axis; per-measure mark types |
| Bar-in-bar | Marks | Dual axis + Bar type + Size slider per measure |
| Map | Double-click State | Profit→Color, Sales→Size; + drills to City |
| Hierarchy | Data pane | Drag Sub-Category onto Category; name it |
| Group | In view | Ctrl/Shift-select marks → right-click → Group; Edit Alias |
| Filter + control | Filters card | Drag field; right-click pill → Show Filter |
| Top-N filter | Filter dialog → Top tab | By field: Top 10 by SUM(Sales) |
| Quick Table Calc | Right-click measure pill | Percent of Total etc. |
| Calculated field | Analysis menu | `SUM([Profit])/SUM([Sales])` = Margin → AGG pill |
| Set (condition) | Right-click dim → Create → Set | Use all + Condition: Sum(Sales)>5000 |
| Combined set | Ctrl-select 2 sets | Shared members in both sets (2017∩2018 = 605) |
| Count Distinct | Right-click pill → Measure | Count (Distinct) |
| Trend line | Analytics pane | Drop on Linear; hover = equation, R², p-value |
| Forecast | Analytics pane | Default ~13 months @95%; Forecast Options → exactly 6 |
| Blend | 2nd data source | Blue=primary, orange=secondary; auto-link on common field (Category) |
| Dashboard | New Dashboard icon | Drag sheets; filter caret → Apply to Worksheets → All Using Related Data Sources |
| Story | New Story icon | Drag dashboard; caption per story point |
| Submit | File menu | Export Packaged Workbook **.twbx** |

---

## C. THE 5 CANONICAL WORKFLOW RECIPES

**R1 — ETL master (Lab 1):**
Input (wildcard / Dynamic Input) → Select(types/rename) → Imputation(Null→Median) → Unique(IDs) → Filter(Status) → Formula(Revenue=[Qty]*[Unit Price]) → DateTime → Text To Columns → Union(parts) / Join(Products; J) → Find Replace(N→North) → Append Fields(promo) → Summarize(GroupBy+Sum) → Cross Tab → Output(`x.xlsx|||Sheet`) + Table→Report Header→Render(PDF).

**R2 — Investigate (Lab 2a):**
Input → Field Summary (profile) → Association Analysis (Pearson) / Frequency Table / Contingency Table → Join demographics → Plot of Means / Scatterplot → verdict on quality + relationships.

**R3 — Forecast (Lab 2b):**
Select/DateTime → Summarize(GroupBy month; Sum sales) → TS Plot → ETS + ARIMA (named models) → Union O's → TS Compare ←holdout(10–20%) → best → TS Forecast(6 periods; 95/80) → table for inventory plan.

**R4 — Predict (Lab 3):**
*Regression:* Select(types) → Create Samples(70/30) → Linear Regression(E) → Stepwise(Both, AICc) → Score(V) → R²/coefficients.
*Classification:* Frequency Table(true rate) → Oversample Field(Response=1) → Create Samples → Logistic + DT + Forest + NN(E) → Union O's → Model Comparison(←V; Accuracy/AUC) → Score(V) → Lift Chart(rate; level 1; dummy quantiles if needed).

**R5 — Segment (Lab 4 / CH4.6):**
Select numerics → (Principal Components) → K-Centroids Diagnostics(K-Means; z-score; pick K) → K-Centroids Cluster Analysis(K) → Append Cluster → Summarize(GroupBy cluster; Avg fields) → name segments.

---

## D. PREPROCESSING DECISION TREE (Ch4.1 theory → tool in one glance)

```
Is the data dirty?
├─ MISSING values?            → Imputation (mean/median/mode) | Filter !IsNull | Formula constant
├─ DUPLICATES?                → Unique (D anchor = dupes)
├─ OUTLIERS / noise?          → SEE: Field Summary / Scatterplot → THEN: Filter out, or smooth (binning/regression idea)
├─ WRONG TYPES / names?       → Select (or Auto Field)
├─ CODES not labels?          → Find Replace + Text Input lookup | Formula IF
├─ DATES as text?             → DateTime
├─ ONE column holds many?     → Text To Columns
Is the data in the wrong SHAPE?
├─ Many same-schema files/sheets → Input wildcard / Dynamic Input + Union
├─ Need columns from another table → Join (watch L/J/R)
├─ Months across columns      → Transpose ; matrix wanted → Cross Tab
├─ Need totals/averages       → Summarize
Is the data too BIG / UNBALANCED for modeling?
├─ Too many variables         → Principal Components | Stepwise
├─ Too many rows              → Sample | Create Samples (E/V/H)
└─ Rare positive class        → Oversample Field
```

## E. BI ARCHITECTURE ASCII (written-part insurance)

```
[Data Sources: ERP/CRM/operational, web logs, social, sensors]
        │ EXTRACT
        ▼
   [ETL / ELT]  ← Transform = most time-consuming
        │ LOAD
        ▼
[Data Warehouse (Inmon 3NF ⇄ Kimball dimensional)] → [Data Marts]
        │
  [Semantic Layer — business terms]
        ▼
[BI Front-End: query/reporting • visual discovery • DASHBOARDS • scorecards]
        ▼                                   (Tableau lives here)
   [Decisions: strategic / tactical / operational]
   Governance & Security wrap every layer; metadata + MDM feed ETL/semantic.
   Alteryx = the course's ETL + analytics engine; Tableau = the front-end.
```

## F. LAST-MINUTE WRITTEN-ANSWER AMMO
- BI def (one to rule them all): *technologies + processes that transform raw data into meaningful information for better decisions at all levels.*
- ETL: Extract → Transform (clean/standardize — slowest) → Load. 3 reasons not to extract all: time window, query performance, cost/priority.
- 4 preprocessing tasks: consolidation, cleaning, transformation, reduction (C-C-T-R).
- Missing-data options: ignore tuple / manual / constant / impute mean-median-mode / remove record.
- Dashboard: most important info, one screen, at a glance. Scorecard: KPIs vs target; balanced = People-Customers-Financial-Operations.
- Classification metrics: confusion matrix → Accuracy, F1, AUC. Forecast metrics: RMSE, MAE, MAPE, MASE. Model pick: min AIC/BIC.
- Clustering = unsupervised (no target); K-Centroids = K-Means/K-Medians/Neural Gas; PCA keeps most variance in fewer factors.
- Tableau: dimension(blue/discrete) vs measure(green/continuous, auto-SUM); Live vs Extract; .twbx = packaged submission.

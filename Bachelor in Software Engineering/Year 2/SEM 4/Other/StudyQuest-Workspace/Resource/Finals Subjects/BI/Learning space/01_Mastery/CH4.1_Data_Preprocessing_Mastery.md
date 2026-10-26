# CH4.1 MASTERY — Data Preprocessing (Every Concept Mapped to Its Alteryx Tool)
**SCSP3213 Business Intelligence | Source: CH04P1 Data Preprocessing.pdf**
**This is the THEORY-TO-TOOL bridge chapter. The written exam asks the concept; the practical exam asks you to DO it in Alteryx. Learn both columns together.**

---

## 1. THE NATURE OF DATA

- **Data = a collection of facts**, usually obtained from experiences, observations, or experiments. May be text, numbers, figures, audio, video, images.
- **Data is the lowest level of abstraction** — information and knowledge are derived FROM it. Data → Information → Knowledge.
- The data-to-knowledge process must be handled carefully to ensure quality: **GIGO — garbage in, garbage out.**
- Process: identify the data source → collect → **pre-process** → model → present outcomes within a context.

### Taxonomy of data
| Type | Target consumer | Examples |
|---|---|---|
| **Structured** | computers to process | numeric vs nominal fields in tables |
| **Unstructured / textual** | humans to process/digest | documents, free text |
| **Semi-structured** | both | **XML, HTML, log files** |

- Structured data splits into **numeric vs nominal**. Levels of measurement: **nominal, ordinal** (categorical) and **interval, ratio** (numeric).

### Metrics for "analytics-ready" data (list — pick any for a 5-mark question)
Data source **reliability**; content **accuracy**; **accessibility**; **security & privacy**; **richness**; **consistency**; **currency/timeliness**; **granularity**; **validity & relevancy**.

## 2. WHY PREPROCESS? (slide-verbatim trio)

Real-world data is dirty, misaligned, overly complex, inaccurate:
1. **Incomplete** — lacking attribute values, lacking attributes of interest, or containing only aggregate data.
2. **Noisy** — containing **errors or outliers**.
3. **Inconsistent** — containing **discrepancies in codes or names**.

→ Not ready for analytics! **No quality data, no quality mining results.** Quality decisions must be based on quality data; the data warehouse needs **consistent integration of quality data**.

## 3. THE FOUR PREPROCESSING TASKS (the course's master table)

> The exam's most likely "explain + give method" structure. Each row below is: concept → method (slides) → **the Alteryx tool the course uses for it**.

### 3.1 DATA CONSOLIDATION (access, collect, select, integrate)
| Subtask | Methods named on slides | Alteryx tool in THIS course |
|---|---|---|
| Access & collect | SQL queries, software agents, web services | **Input Data** (files/DB; wildcard `Customers_*.csv`), **Dynamic Input** (all sheets of one Excel), **Text Input** (manual lookup tables) |
| Select & filter | domain expertise, SQL, statistical tests | **Filter** (condition → T/F anchors), **Select** (drop columns), **Sample** (limit rows) |
| Integrate & unify | SQL, domain expertise, ontology-driven data mapping | **Join** (common key), **Union** (stack rows), **Find Replace** (lookup), **Append Fields** (Cartesian) |

### 3.2 DATA CLEANING (the "dirty data" fixes)
| Subtask | Methods named on slides | Alteryx tool |
|---|---|---|
| Handle **missing values** | imputation with most appropriate value (**mean, median, min/max, mode**); recode with a constant (e.g., "ML"); **remove the record**; do nothing | **Imputation** tool (e.g., Null → Median of Quantity); **Filter** (`!IsNull([field])`) to remove; **Formula** to recode |
| Identify & reduce **noise/outliers** | simple statistics (**averages, standard deviations**) or **cluster analysis**; then remove OR smooth via **binning, regression, simple averages** | **Field Summary** / **Scatterplot** / **Plot of Means** (Data Investigation palette) to SEE them; **Filter** to remove; **Formula** to cap |
| Find & eliminate **erroneous data** | odd values, inconsistent class labels, odd distributions → correct with domain expertise or remove | **Frequency Table** (spot inconsistent labels), **Find Replace** / **Formula** (correct), **Unique** (remove duplicate records) |

**Missing data — why it matters (slide facts):**
- In federated data, **30%–70%** of data points have at least one missing attribute → ignoring all such records = **data wastage**; remaining data is **seriously biased**; lack of confidence in results; the *pattern* of missingness reveals data-integrity issues.
- Causes: equipment malfunction; deleted because inconsistent; not entered due to misunderstanding; considered unimportant at entry; history/changes not registered.
- Handling options (slide list, in order): (a) **ignore the tuple** (usually when class label missing — ineffective when missing % varies per attribute); (b) fill **manually** (tedious/infeasible); (c) **global constant** ("unknown"); (d) **imputation** with mean/median/min/max/mode; (e) **remove the record**.

**Noise vs outlier (definition pair):**
- **Noise** = random error or variance in a measured variable (modification of original values — like distortion on a poor phone line). Causes: faulty collection instruments, data entry problems, data transmission problems, technology limitation, inconsistent naming conventions.
- **Outliers** = data objects with characteristics **considerably different** from most other data objects.
- **How to handle noisy data (4 slide methods):** (1) **Binning** — sort, partition into equal-depth bins, smooth by bin means/median/boundaries; (2) **Clustering** — detect and remove outliers; (3) **Combined computer + human inspection**; (4) **Regression** — smooth by fitting a function.

### 3.3 DATA TRANSFORMATION
| Subtask | Methods named on slides | Alteryx tool |
|---|---|---|
| **Normalize** | scale numeric values to a standard range (0 to 1, −1 to +1) | Standardize option inside **K-Centroids** / **Principal Components** (z-score or unit interval); **Formula** for manual scaling |
| **Discretize / aggregate** | range- or frequency-based **binning**; concept hierarchies for categorical | **Summarize** (aggregate), **Formula**/**Multi-Field Binning** concepts; **Cross Tab** (re-shape + aggregate) |
| **Construct new attributes** | derive more informative variables via math functions (simple + to log transforms) | **Formula** (e.g., `[Quantity]*[Unit Price]` → Revenue), **Multi-Field Formula**, **Multi-Row Formula** (running totals) |

### 3.4 DATA REDUCTION
| Subtask | Methods named on slides | Alteryx tool |
|---|---|---|
| Reduce **attributes** (dimensional reduction / variable selection) | **PCA**, independent component analysis, **chi-square testing, correlation analysis, decision tree induction** | **Principal Components** (Predictive Grouping); **Stepwise** (variable selection for models); **Association Analysis** (correlation) |
| Reduce **records** (cases/samples) | **random sampling, stratified sampling**, expert-driven purposeful sampling | **Sample** tool, **Create Samples** (70/30 estimation/validation) |
| **Balance skewed data** | **oversample** the less-represented OR **undersample** the more-represented class | **Oversample Field** (e.g., Response=1 to ~50/50) |

> MEMORY HOOK — the 4 tasks: **C-C-T-R**: "**C**onsolidate, **C**lean, **T**ransform, **R**educe" = collect it, fix it, reshape it, shrink it.

## 4. RAPID-FIRE DRILL

| Prompt | Answer |
|---|---|
| GIGO | Garbage in, garbage out — quality outcomes need quality data |
| 3 kinds of dirty data | Incomplete, noisy (errors/outliers), inconsistent (codes/names) |
| Semi-structured examples | XML, HTML, log files |
| % data points with a missing attribute (federated) | 30–70% |
| 5 ways to handle missing values | Ignore tuple; fill manually; global constant; impute (mean/median/min/max/mode); remove record |
| Noise definition | Random error/variance in a measured variable |
| Outlier definition | Object considerably different from most others |
| 4 noise-handling methods | Binning; clustering; computer+human inspection; regression |
| Binning procedure | Sort → equal-depth bins → smooth by means/median/boundaries |
| Normalization | Rescale numeric values to standard range (0–1 / −1–+1) |
| New-attribute construction | Derive informative variables with math functions (e.g., Revenue = Qty × Price) |
| 2 ways to reduce variables | Dimensional reduction (PCA), variable selection (stepwise/correlation) |
| 2 ways to reduce cases | Sampling (random/stratified), balancing (over/undersample) |
| Course tool for imputation | Alteryx **Imputation** tool |
| Course tool for balancing | Alteryx **Oversample Field** tool |
| Course tool for PCA | Alteryx **Principal Components** tool |

## 5. PREDICTED QUESTIONS
1. *Explain the FOUR main data preprocessing tasks with one method each.* (Reproduce Table 1.)
2. *List causes of missing data and THREE ways of handling it. Which Alteryx tool performs imputation, and how would you configure it?* (Hybrid theory+tool question — her labs literally do Null→Median on Quantity.)
3. *Differentiate noise vs outliers; describe binning.*
4. *Given dirty sample data (nulls, duplicate Order IDs, inconsistent region codes N/S): name the Alteryx tool chain to clean it.* → Imputation → Unique → Find Replace/Formula. Practice saying this fast.
5. *Why is data preprocessing necessary? ("real-world data is dirty" trio + GIGO.)*

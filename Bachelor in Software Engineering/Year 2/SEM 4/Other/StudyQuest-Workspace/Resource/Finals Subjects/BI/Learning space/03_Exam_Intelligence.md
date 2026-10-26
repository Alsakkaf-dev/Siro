# 03 — EXAM INTELLIGENCE: SCSP3213 Business Intelligence Final
**Final: week of July 6, 2026 | Weight: 30% | Format per student: HANDS-ON, ON PC — solve by USING Alteryx Designer and Tableau live, plus a written component.**

---

## 1. WHAT THE OFFICIAL COURSE INFO REVEALS (hard evidence)

From `CI SCSP3213_Business Intelligence.pdf`, the Final Exam (F) maps to CLOs like this:

| CLO | What it tests | Final-exam share | Translation |
|---|---|---|---|
| CLO1 | *Explain concepts, principles, theories* (BI + architecture) | **F = 5%** | Written/short-answer part — Ch1–3 definitions |
| CLO2 | *Problem-solving + competency in the assigned BI software* | **F = 15%** | **Alteryx execution** (ETL + investigation + predictive) |
| CLO3 | *Construct data-analysis workflow & visualizations → tables, charts, dashboards* | **F = 10%** | **Workflow construction + Tableau output** |

**Read that again: 25 of the 30 final marks are hands-on (CLO2+CLO3). The written part is ~5/30.** This matches the "final is on PC" report. Your 0%-feeling is irrelevant — lab comfort IS the skill being graded.

Other facts worth knowing:
- Quiz (10%, CLO1) already consumed Ch1–2 → the written 5% will likely recycle Ch1–3 definition style (see §4).
- Week 7 of the course = **"Professional Cert (Alteryx Designer – Core Level)"** — the course explicitly trains toward Alteryx Designer Core certification patterns: tool-identification, anchor behavior, config questions. Expect exam tasks phrased like Core-cert micro-tasks.
- Week 14 lists **Power BI** subtopics, but HIS materials folder contains **zero Power BI labs/datasets** — Tableau owns Lab 5 and all CH05 materials. (→ open question, §6.)

## 2. WHAT A HANDS-ON FINAL CAN REALISTICALLY ASK (derived from her own assessment artifacts)

The professor's own practical-assessment style is visible in `ASSIGNMENTS/Lab Assignment 1/` — she provides:
1. a **starter workflow (.yxmd)** with Input Data / Text Input / Browse tools pre-placed in **Tool Containers**, with **question text boxes** on the canvas;
2. **datasets by name** (Top 100 Chains Sales.csv, Chains and Menu Categories.csv, Tech Layoff 2022.xlsx, a bank-marketing Question 4 Input.xlsx);
3. **expected-output files** (Question 1 Output.xlsx = Month/Sum_Layoff/Avg_Layoff; Question 2 Output.xlsx = date-math + Paid column) — *you must reproduce the output exactly*.

Her actual assessment question phrasings (verbatim from the .yxmd):
- "Configure a Summarize tool to produce the following output."
- "Which Menu Category has the highest total sales for 2020 and what is the total?"
- "Which Menu Category has the highest total sales … if you remove all Quick Service Segments?"
- "Identify the top 10 Casual Dining restaurant chains in terms of sales. What is the average number of units for those 10 restaurants?"

**Pattern:** business question → you choose the chain (Join → Filter → Summarize → Sort → Sample) → numeric answer + saved output. Expect the final to be 3–6 such time-boxed tasks across Alteryx and Tableau.

## 3. PREDICTED TASK TYPES WITH LIKELIHOOD

| # | Task type (time-boxed) | Likelihood | Source evidence |
|---|---|---|---|
| T1 | **Alteryx ETL chain**: load file(s) (wildcard / multi-sheet) → clean (Imputation/Unique/Filter) → Formula (Revenue / IF-label) → Join/Union → Summarize → output xlsx matching a given screenshot | ★★★★★ near-certain | Lab 1 + her Lab Assessment Q1–Q3 |
| T2 | **Summarize/Cross Tab pivot**: "total X by Y", "make Y columns" | ★★★★★ | Lab 1 step r–t, assessment Q1 |
| T3 | **Top-N question**: Sort → Sample → (Summarize Avg) | ★★★★☆ | Assessment Q3, lecture GiftRecords ex. |
| T4 | **Date math task**: DateTime + DateTimeDiff (subscription length × fee → Paid) | ★★★★☆ | Assessment Q2 expected output |
| T5 | **Data investigation**: Field Summary / Association / Frequency / Contingency / Plot of Means / Scatterplot — "profile this data; is X related to Y?" | ★★★★☆ | Lab 2 Ex.1–6 |
| T6 | **Time series**: Summarize-by-month → TS Plot → ETS + ARIMA → TS Compare → TS Forecast N periods | ★★★☆☆ | Lab 2 Ex.7–11 |
| T7 | **Regression**: Create Samples 70/30 → Linear Regression → Stepwise (AICc) → Score validation | ★★★★☆ | Lab 3 Ex.1–4 |
| T8 | **Classification + lift**: Oversample → Logistic (or DT/Forest/NN) → Score → Lift Chart / Model Comparison | ★★★★☆ | Lab 3 Ex.5–11 + Question 4 Input.xlsx (bank-marketing "subscribed" = classic classification target) |
| T9 | **Clustering**: K-Centroids Diagnostics → Cluster Analysis → Append Cluster → profile | ★★★☆☆ | CH04P3 + Lab 4 week; Customer_Clustering.csv provided |
| T10 | **Tableau chart battery**: build named chart (line/bar/scatter/bubbles/heat/tree/box/dual-axis/map) answering "which X has highest Y?" | ★★★★★ | Lab 5 Analyses 1–15 + 5 official lab exercises |
| T11 | **Tableau calculated field / set / quick table calc / Top-N filter** | ★★★★☆ | Lab 5 §Sets, Margin, %Total; Lab Ex.1 ("Top 10 customers") |
| T12 | **Tableau forecast/trend line** ("forecast next 6 months") | ★★★☆☆ | Lab 5 Analyses 13–14 |
| T13 | **Dashboard with cross-filter (+ story)** | ★★★☆☆ | Lab 5 Part 2; CLO3 wording "dashboards" |
| T14 | **Blend/second source + Data Interpreter + Pivot** | ★★☆☆☆ | Lab 5 COGS section (fiddly, but it's IN the lab) |

## 4. WRITTEN-COMPONENT PREDICTION (~5 marks; Ch1–3 weighted)

The quiz already hit Ch1–2, so the written slice probably re-tests CLO1 with light variations:
1. Define BI / list the 5 decision-making steps / three decision levels with examples (Assignment 1's exact skeleton).
2. Six components of BI architecture; draw the flow Data Source → ETL → DW → Analysis → Decision.
3. Compare-pair table: Inmon vs Kimball; star vs snowflake; fact vs dimension; report vs dashboard; **dashboard vs scorecard (Ch3, untested by quiz — elevated probability)**; business query vs visual data discovery (Ch3); Live vs Extract; Desktop vs Public (Ch5 written-friendly).
4. ETL: why Transform is most time-consuming; 3 reasons not to extract everything.
5. Preprocessing: 4 tasks (consolidate/clean/transform/reduce) + missing-value handling + noise/outliers + binning — *with the matching Alteryx tool* (her hybrid style).
6. Descriptive vs inferential stats; mean/median/mode; histogram vs bar graph; skewness/kurtosis (Ch3 back-half).
7. Tool-knowledge prose: "Explain the purpose tool of X" — her lab guideline literally writes "Purpose tool:" for every tool; she may ask you to recite Filter T/F anchors, Join L/J/R, Unique U/D, Score inputs, etc.

## 5. TOP-10 MARKS-PER-HOUR SKILLS (train in this order)

1. **Summarize tool fluency** (GroupBy + Sum/Avg/Max/Count, output naming `Sum_X`/`Avg_X`) — appears in EVERY Alteryx task family.
2. **Join + Union with correct anchors** (J vs L/R; Auto Config by Name) — the assessment's first move on chains data.
3. **Filter + Sort + Sample Top-N pattern** — three tools, infinite question coverage.
4. **Formula essentials**: `[Quantity]*[Unit Price]`, IF/ELSEIF/ELSE/ENDIF labels, `DateTimeDiff` — covers T1, T4.
5. **Reproduce-the-output reflex**: read expected columns → infer the config (her signature task style).
6. **Tableau Show Me battery**: all 10 lecture charts in <3 min each, labels on, sheet renamed, Entire View.
7. **Tableau filters + Top-N + sort** (the 5 official lab exercises are literally this).
8. **Create Samples → model → Score → read R²/coefficients** (regression spine, reusable for classification).
9. **Lift Chart wiring quirks** (true response rate from Frequency Table; dummy quantile bottom input) — small detail, disproportionate marks because most students fumble it.
10. **Dashboard cross-filtering** (Apply to Worksheets → All Using Related Data Sources) + .twbx export — quick, visible, CLO3 marks.

## 6. OPEN QUESTIONS — ASK THE PROFESSOR THIS WEEK

1. **"For the final's written part, are we responsible for ALL lecture slides (Ch1–5) or only Ch1–3 concepts, given the labs cover Ch4–5 practically?"** (Slide coverage is the single biggest unknown; the CI mapping suggests concepts = 5% only.)
2. **"Will the practical part include Power BI (Week 14 topic) or is the visualization task in Tableau only?"** — his materials contain NO Power BI labs; confirm before wasting prep time.
3. "Will we get starter workflows (like Lab Assessment 1) or build from blank canvas?" — affects whether to drill container/setup speed.
4. "Is clustering (Lab 4) in scope for the final practical?" — no separate Lab 4 guideline exists in the materials; only CH04P3 slides cover it.
5. "Internet/Help access during the exam? Alteryx tool search allowed?" — changes memorization load for configs.

## 7. EXAM-WEEK BATTLE PLAN (given ~3.5 weeks)
- **Week 1 (now):** Mastery docs CH4.2 + CH4.3 + CH5; rebuild Lab 1 and Lab 5 end-to-end once each.
- **Week 2:** Challenge Sets 1–3 against the clock; redo any challenge missing its time budget.
- **Week 3:** Mock Practical v1 under 2h exam conditions; review CH1–3 written drills (existing CH1–2 file + CH3 file, 1 evening each).
- **Final days:** 04_Emergency_Final_Review.md only + re-run the professor's own Lab Assessment 1 questions cold.

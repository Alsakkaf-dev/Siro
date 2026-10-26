# 03 — EXAM INTELLIGENCE: SCST/SECI 1143/2143 PSDA Final
### Analysis of 8 distinct past papers from your Materials folder (2015/16 → 2023/24)

**Papers cataloged:** 2015/16-S2, 2016/17-S2, 2017/18-S1, 2017/18-S2, 2018/19-S1, 2021/22-S2 (P1+P2+P3 = one exam), 2022/23-S2, 2023/24-S2. (The other PDFs in `Final Exams/` are duplicates of these or pre-2015 papers with older syllabus coverage.)

---

## 1. Question archetypes with frequency counts (8 papers)

| # | Archetype | Appearances | Years | Typical marks |
|---|---|---|---|---|
| 1 | **Paired (dependent) t-test** — before/after | **8 / 8** | every single paper | 8–10 |
| 2 | **One-way ANOVA** (equal n) — always the last question | **8 / 8** | every single paper | 15–20 |
| 3 | **Least-squares regression equation** (b₁, b₀) | **8 / 8** | every single paper | 8–12 |
| 4 | **Chi-square goodness-of-fit** (equal 6×, unequal 3×; both in one paper once) | **8 / 8** | every paper | 8–10 |
| 5 | **Pearson r computation** (5-sums formula) | **7 / 8** | all but 2015/16 (which used Spearman) | 10–11 |
| 6 | **Chi-square test of independence** (2×2 → 3×3) | **7 / 8** | all but 2017/18-S1 | 9–14 |
| 7 | **Prediction from fitted line** ("estimate y when x = ...") | 7 / 8 | — | 1–4 |
| 8 | **CI for mean** (z 3×, t 2×) | 5 / 8 | '16/17, '17/18-S1, '18/19, '21/22, '23/24 | 4–7 |
| 9 | **One-sample mean test** (z if σ known/n>30; t otherwise) | 5 / 8 | — | 3–10 |
| 10 | **χ² test on variance/SD** | 4 / 8 | '17/18-S1, '17/18-S2, '18/19, '22/23 | 6–10 |
| 11 | **CI for proportion** | 4 / 8 | '15/16, '16/17, '17/18-S2, '22/23 | 3–5 |
| 12 | **Two-proportion z-test** (pooled) | 3 / 8 | '17/18-S2, '18/19, '21/22 | 6–10 |
| 13 | **Pooled-variance t-test** ("assume equal variances") | 3 / 8 | '16/17, '17/18-S1, '21/22 | 6–10 |
| 14 | **Slope t-test** (s_b1 GIVEN — quick marks) | 3 / 8 | **'21/22, '22/23, '23/24 — every recent paper** | 3–5 |
| 15 | **ANOVA from summary stats only** (n, x̄, s per group) | 3 / 8 | '15/16, '17/18-S1, '18/19 | 15–20 |
| 16 | **Welch t (unequal variances) + ν formula** | 2 / 8 | '15/16, **'23/24** | 10 |
| 17 | **F-test for two variances** | 2 / 8 | '17/18-S2, **'22/23** | 5–10 |
| 18 | Spearman rank correlation | 1 / 8 (+1 "choose Pearson vs Spearman, justify" in '21/22) | '15/16 | 10–12 |
| 19 | Correlation significance t-test (r-based) | 1 / 8 | '16/17 (recently replaced by slope test) | 3–5 |
| 20 | R² / "% of variation explained" | 1 / 8 | '22/23 (R-output question) | 1 |
| 21 | Sample-size determination (margin of error) | 1 / 8 | '17/18-S2 | 4 |
| 22 | Read b₀/b₁ off software (R) output | 1 / 8 | '22/23 | 2 |

**Reading:** #1–#7 are effectively compulsory marks (~75–80 marks of the paper). #14, #16, #17 are the "modern era" additions — all three appeared in the most recent two papers.

---

## 2. Mark distribution by chapter

### Modern format (2021/22, 2022/23, 2023/24 — identical template, 6 questions, 100 marks)

| Q | Chapter | Content | Marks |
|---|---|---|---|
| Q1 | Ch 5.1/5.2 | CI (mean or proportion) + 1-sample test (z, t, or χ²-variance) | **10** |
| Q2 | Ch 5.3 | Two-sample: independent test (pooled/Welch/F/2-prop) + **paired t** | **20** |
| Q3 | Ch 6 | GOF + independence | **20** |
| Q4 | Ch 7.1 | Correlation (scatter sketch + Pearson r + interpretation) | **15** |
| Q5 | Ch 7.2 | Regression (sums → line → prediction) + slope t-test | **15** |
| Q6 | Ch 8 | One-way ANOVA, equal n | **20** |

**By chapter: Ch5 = 30, Ch6 = 20, Ch7 = 30, Ch8 = 20.** Older papers (2015–2019) shuffle marks (Q4 chi-square was once 25, correlation+regression once 30) but cover the same archetypes.

### Constants across ALL years
- "Answer ALL questions"; structured questions only, no MCQs.
- **"Do all calculations in 3 decimal points"** on the cover (2021+ explicitly).
- **Formula list printed at the back** (z₀, t₀, χ², two-sample formulas incl. Welch ν and s_p², Pearson/Spearman, slope/intercept, F = ns_x̄²/s_p²) plus statistical tables (z, t, χ², F). You do NOT need to memorize formulas — you need to RECOGNIZE which one and execute.
- Subject code drifts (SCSI2143 → SECI1143/2143 → SCST1223) but the course and question bank are the same.

---

## 3. The professor's favorite contexts (recycled datasets — learn these and you've literally seen the exam)

| Context | Where it appeared | Note |
|---|---|---|
| **Engine volume vs mileage** (cars → big bikes → motorbikes) | 2016/17 Q6, 2021/22 Q5a, 2023/24 Q5a | Same numbers reshuffled (x = 97, 85/88, 98... y = 24, 29/21...). Regression sums + line + predict. |
| **Patients' age vs blood pressure** (t vs p, Dr. Alia/Dr. Fatimah) | 2017/18-S2 Q5, 2021/22 Q5b, 2023/24 Q5b | Identical data (35,74,48,60,42,26 / 88,130,120,135,98,80). Slope test with s_b1 = 0.07 given. |
| **Weight before/after exercise program** (12 persons) | 2016/17 Q3b AND 2021/22 Q2c | Identical 12-pair dataset, paired t at α = 0.01. |
| **Memory drug / placebo / no treatment exam scores** | 2016/17 Q7 AND 2018/19 Q5 | Identical ANOVA (70,77,83,90,97 / 37,43,50,57,63 / 3,10,17,23,30). |
| **Headache tablets hours of relief** | 2017/18-S2 Q6 = slide Ch8 Exercise #2 | Slide exercises become exam questions. |
| **Plastic usage vs household size** | 2016/17 Q5 = slide Ch7 Exercise #4 | Verbatim. |
| **Accidents/calls/reservations/donuts equal across days** | GOF in '15/16, '17/18-S1, '18/19, '22/23, '23/24 | The "equally distributed across days" GOF is near-automatic. |
| Malaysian flavor: UTM staff coffee, ChatGPT usage at Faculty of Computing, Senai–Kuching flights, Kembara Motor | 2022/23, 2023/24 | New-era contexts, same mechanics. |

**Implication:** the tutorials and slide exercises in `Materials/Tutorials` + slide "Exercise #N" boxes are a live question bank. Do them all.

---

## 4. Predicted structure of YOUR final (July 2026) + rationale

Six structured questions, 100 marks, formula sheet + tables provided, 3-decimal rule:

| Q | Prediction | Confidence | Why |
|---|---|---|---|
| Q1 [10] | (a) point estimate + CI for μ with t (raw data, n≈10–15) or CI for p̂; (b) short 1-sample z-test or χ²-variance test | High | Template stable 3 exams running; alternates t-CI/p-CI and z/χ² in part (b) |
| Q2 [20] | (a) independent 2-sample t — Welch (df subpart for easy marks) or F-variance test; (b) **paired t before/after** | Very high | Paired t is 8/8; Welch+df appeared '23/24, F appeared '22/23 — expect one of the two |
| Q3 [20] | (a) GOF "equally distributed" (5–7 categories); (b) independence 2×3 or 3×2, possibly "construct the table first" | Very high | 8/8 and 7/8 frequencies; '22/23 added the build-the-table step |
| Q4 [15] | scatter sketch (2m) + Pearson r with Σx², Σy² given (≈11m) + direction/strength interpretation (2m) | Very high | Identical pattern '21/22→'23/24 |
| Q5 [15] | (a) 5 sums + least-squares line + predict (10m); (b) slope t-test with s_b1 given (5m) | Very high | Identical pattern 3 exams running; watch for the recycled engine-volume or blood-pressure data |
| Q6 [20] | one-way ANOVA, 3 groups × n (raw data, s possibly given), itemized: means → between → within → F-test | Very high | 8/8, last question every time; '23/24 itemized the steps exactly like the slides |

Wildcards to be ready for (each ≤ 10 marks): two-proportion z (3/8), Spearman (due for a return — last seen '15/16, choose-and-justify seen '21/22), sample-size determination, R²/R-output reading.

---

## 5. Priority list — top 10 skills by marks-per-hour (study in this order)

| Rank | Skill | Guaranteed marks | Why this order |
|---|---|---|---|
| 1 | **One-way ANOVA 8-step recipe** (incl. from summary stats) | ~20 | Biggest single block, identical recipe every year, zero variation in style |
| 2 | **Paired t-test** (D-table → D̄, s_D → t) | ~10 | 100% hit rate; mechanical once D-direction is fixed |
| 3 | **Pearson r via 5-sums table** | ~11–13 | Q4 is essentially only this; sums often given partially |
| 4 | **Least-squares b₁, b₀ + prediction** | ~10 | Reuses the same sums as r; the numerator is identical |
| 5 | **Chi-square independence** (e_ij = RC/n, df=(r−1)(c−1)) | ~10–12 | Bigger half of Q3; pure procedure |
| 6 | **Chi-square GOF** (E = n/k or n·p) | ~8 | Smaller half of Q3; 10-minute skill |
| 7 | **Independent 2-sample t**: pooled AND Welch (+ν) | ~6–10 | Q2(a); the df formula alone is 2 free marks |
| 8 | **CI for mean (t) and proportion (z)** + interpretation sentence | ~5–7 | Q1(a); fastest marks on the paper |
| 9 | **Slope t-test with given s_b1** (+ what does b₀/b₁ mean) | ~5 | 3 quick marks every recent year; 15-minute skill |
| 10 | **χ²-variance test + F-test for 2 variances** (incl. left-tail/table tricks) | ~5–10 | The two "discriminator" questions most students fumble; appeared in 5 of the last 6 papers combined |

Skills NOT worth deep time: two-way ANOVA / unequal-n ANOVA (explicitly out of syllabus), p-value interpolation beyond table reading, derivations.

---

## 6. Marking-scheme habits worth exploiting

1. **Itemized sub-marks** — recent papers split: hypotheses (1–2m), test statistic (2–4m), df (2m), critical value (1–3m), decision+conclusion (2–4m). Even with a wrong number, the structure earns most marks → ALWAYS write all steps.
2. **Interpretation sentences carry dedicated marks** — "construct AND interpret", "what can you conclude". Templates in 04_Emergency_Final_Review.
3. **"Sketch"** (scatter plot, rejection region) = 2 easy marks; never skip.
4. **Sums are marks** — "Find Σx, Σy, Σx², Σy², Σxy (5 marks)" = 1 mark per sum. Build the columns table neatly.
5. The paper gives the formulas — the exam tests **selection + table lookup + arithmetic discipline (3 d.p.)**, not memory.

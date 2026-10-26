# CH 7 — Correlation & Simple Linear Regression (Mastery)

> Source: `[2021] Chapter 7 (Part 1) Correlation.pdf` + `(Part 2) Linear Regression Model.pdf` + past finals.
> Exam weight: **30 marks every modern year** — Q4 Correlation (15) + Q5 Regression (15). The engine-volume/mileage regression question has literally been recycled in 2016/17, 2021/22 and 2023/24 with tiny changes.

---

## 1. WHY this exists (first principles)

Everything so far compared groups. Chapter 7 asks the analyst's favorite question: **how do two NUMERIC variables move together — and can I predict one from the other?**

- **Correlation (Part 1)** measures the *strength and direction* of a linear relationship with one number r ∈ [−1, 1]. "Do hours on social media and sleep quality move together?" It does NOT say which variable drives which, and it implies **no causation**.
- **Regression (Part 2)** goes further: it fits the best straight line ŷ = b₀ + b₁x so you can *predict* y (dependent) from x (independent) and *quantify the impact* ("each extra 1000 ad impressions adds RM110 in sales").

**Data-analytics scenario:** feature screening before modeling (which variables correlate with churn?), pricing (size → house price), capacity planning (copiers serviced → minutes needed — his 2022/23 exam used exactly this with R output). Simple linear regression is the atom from which all of ML regression grows.

---

## 2. Core concepts in dependency order

1. **Scatter plot** — always the first step; reveals positive/negative/no/curvilinear patterns. (Sketching it = 2 easy marks nearly every year.)
2. **Correlation coefficient r** (sample; ρ for population): unit-free, symmetric in x/y, −1 ≤ r ≤ 1.
   - Strength bands from his slides: |r| ≥ 0.8 strong; 0.5–0.8 moderate; < 0.5 weak; sign = direction.
   - r ≈ 0 means no LINEAR relation — a perfect curve can still hide there (his quadratic example).
3. **Pearson vs Spearman** (his Part 1 split):
   - **Pearson** — interval/ratio data, assumes bivariate normality & linearity, sensitive to outliers.
   - **Spearman r_s** — ranked/ordinal data or when outliers worry you; correlation of RANKS.
4. **Significance test for correlation**: is r far enough from 0 to believe ρ ≠ 0?
5. **Regression model**: population y = β₀ + β₁x + ε; sample estimate ŷ = b₀ + b₁x.
6. **Least squares**: choose b₀, b₁ to minimize Σ(y − ŷ)² — squared residuals.
7. **Interpretation**: b₁ = change in mean y per one-unit change in x; b₀ = mean y at x = 0 (only meaningful if x = 0 is in the data range).
8. **Prediction** = plug x into ŷ; **extrapolation** beyond the observed x range is invalid (asked explicitly: "explain why it would not be reasonable...").
9. **Variation decomposition**: SST = SSR + SSE → **R² = SSR/SST** = proportion of variation in y explained by x. For simple regression R² = r².
10. **Inference on the slope**: t-test of H₀: β₁ = 0 (no linear relationship).

---

## 3. Every formula + WHY + when

### 3.1 Pearson correlation (the formula on his exam sheet)
$$r=\frac{\sum xy - \frac{(\sum x)(\sum y)}{n}}{\sqrt{\left(\sum x^2-\frac{(\sum x)^2}{n}\right)\left(\sum y^2-\frac{(\sum y)^2}{n}\right)}}$$
- WHY: numerator = co-variation of x and y around their means; denominator scales by each variable's own variation, forcing the result into [−1, 1].
- Exam routine: build the 5-sum table (Σx, Σy, Σx², Σy², Σxy) — these sums are often worth marks on their own ("Find the summation for x, y, x², y², xy" = 5 marks in 2021/22 & 2023/24).

### 3.2 Spearman rank correlation
$$r_s = 1-\frac{6\sum d_i^2}{n(n^2-1)},\qquad d_i = (\text{rank } y_i) - (\text{rank } x_i)$$
- WHY: it's Pearson applied to ranks; the closed form needs only the rank differences.
- Ranking with ties: tied values share the average of the ranks they occupy (his judges example: two 8's at positions 2,3 → both ranked 2.5).

### 3.3 Significance test for correlation
$$t_0=\frac{r}{\sqrt{\dfrac{1-r^2}{n-2}}},\qquad df=n-2,\qquad H_0:\rho=0,\; H_1:\rho\neq 0$$
- WHY df = n−2: two parameters (the line's slope and intercept implicit in the linear model) are estimated.

### 3.4 Least-squares coefficients (exam-sheet form)
$$b_1=\frac{\sum xy-\frac{(\sum x)(\sum y)}{n}}{\sum x^2-\frac{(\sum x)^2}{n}},\qquad b_0=\bar{y}-b_1\bar{x}$$
- WHY b₀ = ȳ − b₁x̄: the least-squares line always passes through (x̄, ȳ).
- Same numerator as r → if you computed r first, recycle the sums.

### 3.5 Variation & R²
$$SST=\sum(y-\bar{y})^2,\quad SSE=\sum(y-\hat{y})^2,\quad SSR=\sum(\hat{y}-\bar{y})^2,\quad R^2=\frac{SSR}{SST}=r^2$$
- Interpretation sentence (memorize): "**R²×100% of the variation in y is explained by the variation in x.**"
- Standard error of estimate: $s_\varepsilon=\sqrt{\dfrac{SSE}{n-2}}$ (denominator n − k − 1 with k = 1).

### 3.6 Slope t-test
$$t_0=\frac{b_1-\beta_1}{s_{b_1}}=\frac{b_1-0}{s_{b_1}},\qquad df=n-2,\qquad s_{b_1}=\frac{s_\varepsilon}{\sqrt{\sum x^2-\frac{(\sum x)^2}{n}}}$$
- His recent exams GIVE you s_b1 ("given the estimator of the standard error of the slope (s_b1) is 0.07") → the test is 3 quick marks: t₀ = b₁/s_b1, compare to t(α/2, n−2), conclude "x affects y" or not.

### Which tool when (decision tree)
```
Two numeric variables...
├── "how strong is the relationship?"      → r (Pearson)  [ordinal/ranked data → Spearman]
├── "is the correlation significant?"      → t = r/√((1−r²)/(n−2)), df = n−2
├── "predict y from x" / "find the line"   → b₁ then b₀; ŷ = b₀ + b₁x
├── "% of variation explained"             → R² = SSR/SST = r²
└── "does x affect y?" (slope inference)   → t = b₁/s_b1, df = n−2
```

---

## 4. Fully worked example — exact past-final style

### 4A. Correlation + significance (2016/17 Q5, 10 marks — this question is also Exercise #4 in his slides)
*"X = weight of plastic usage, Y = household size, n = 8: X: 0.27, 1.41, 2.19, 2.83, 2.19, 1.81, 0.85, 3.05; Y: 2, 3, 3, 6, 4, 2, 1, 5."*

**(i) r (5 marks).** Build the sums: Σx = 14.60, Σy = 26, Σx² = 32.9632, Σy² = 104, Σxy = 56.80.
$$r=\frac{56.80-\frac{(14.60)(26)}{8}}{\sqrt{\left(32.9632-\frac{14.60^2}{8}\right)\left(104-\frac{26^2}{8}\right)}}=\frac{56.80-47.45}{\sqrt{(6.3182)(19.5)}}=\frac{9.35}{11.0997}=0.842$$
Strong positive linear relationship: larger households use more plastic.

**(ii) Significance test at 95% confidence (3 marks).**
H₀: ρ = 0 vs H₁: ρ ≠ 0; α = 0.05, df = 8 − 2 = 6.
$$t_0=\frac{0.842}{\sqrt{\frac{1-0.842^2}{6}}}=\frac{0.842}{\sqrt{0.04848}}=3.829$$
Critical t(0.025, 6) = 2.447. Since 3.829 > 2.447 → reject H₀ → significant linear correlation exists.

**(iii) Repeat at 99% (2 marks).** t(0.005, 6) = 3.707. Still 3.829 > 3.707 → decision UNCHANGED (reject H₀) — but only barely; note how raising confidence shrinks the rejection region.

### 4B. Regression + prediction + slope test (2023/24 Q5, 15 marks)
*"Engine volume x vs mileage y, n = 7: x: 97, 88, 105, 151, 140, 134, 118; y: 24, 21, 24, 25, 22, 23, 22."*

**(i) Sums (5m).** Σx = 833, Σy = 161, Σx² = 102,459, Σy² = 3,715, Σxy = 19,229.

**(ii) Least-squares equation (4m).**
$$b_1=\frac{19229-\frac{(833)(161)}{7}}{102459-\frac{833^2}{7}}=\frac{19229-19159}{102459-99127.857}=\frac{70}{3331.143}=0.021$$
$$b_0=\bar{y}-b_1\bar{x}=\frac{161}{7}-0.021\times\frac{833}{7}=23-0.021(119)=20.500$$
$$\boxed{\hat{y}=20.500+0.021x}$$

**(iii) Predict at x = 120 (1m).** ŷ = 20.500 + 0.021(120) = **23.021 km** (≈ 23.0 km).

**(iv) Slope test (his Q5b pattern, 3m).** For 6 patients (age t vs blood pressure p), the paper GIVES the fitted line p̂ = 50.728 + 1.216t and s_b1 = 0.07. Test at 95%:
H₀: β₁ = 0 vs H₁: β₁ ≠ 0; t₀ = 1.2163/0.07 = **17.375**; critical t(0.025, 4) = 2.776. 17.375 > 2.776 → reject H₀ → "the patient's age significantly affects blood pressure."

---

## 5. Top 5 traps

1. **Swapping x and y in regression.** y = the thing being predicted (dependent); x = predictor. "Regression of p on t" means p = y. r doesn't care about order; b₁ absolutely does.
2. **Sum-of-squares vs square-of-sum.** Σx² ≠ (Σx)². The formula uses BOTH — put (Σx)² only inside the correction terms. This is the #1 arithmetic killer; work in a 5-column table and re-add each column.
3. **Interpreting b₀ blindly.** b₀ is the predicted y at x = 0 — often physically meaningless (no house has 0 ft²; the 2022/23 exam asked "does the interpretation of b₀ make practical sense?" — expected answer: NO, x = 0 outside data range).
4. **Extrapolation.** Predicting at x far beyond the data (carbonation 100 mm, fertilizer 15 g) is invalid — the linear pattern is only evidenced inside the observed x range. Saying this in one sentence = full marks for that part.
5. **Causation claims.** r = 0.88 between anxiety and exam score does NOT mean anxiety causes low scores ("is it reasonable to conclude test anxiety caused poor performance?" — answer: no, correlation ≠ causation, possible lurking variables).

Bonus: **rounding discipline** — the cover sheet says 3 decimal points. Keep ≥ 4–5 decimals mid-calculation (especially b₁, which is small: 0.021), or your predicted value drifts.

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | Signal |
|---|---|
| "Draw (sketch) the scatterplot. Is there any relationship?" | plot points roughly to scale; state direction + strength |
| "calculate the correlation coefficient r" + "given Σx² = ..., Σy² = ..." | Pearson; use the given sums, only compute Σxy yourself |
| "Interpret the result" (after r) | sign + strength + context sentence |
| "Identify which correlation coefficient type is suitable... Justify" | scale data (interval/ratio) → Pearson; ranks/ordinal → Spearman |
| "ranking given by the manager" | Spearman: rank both variables, d = rank difference |
| "conduct hypothesis testing to know whether X and Y really correlate" | t = r/√((1−r²)/(n−2)), df = n−2 |
| "Find the summation for x, y, x², y², xy" | the 5 sums — 1 mark each, easy points |
| "Find the linear regression equation using the least-square method" | b₁ then b₀ then write ŷ = b₀ + b₁x |
| "Use the equation to estimate ... for x = ..." | plug in; check x is inside data range |
| "what will happen to y if x decreases (based on (b))" | use sign of r/b₁: positive → y decreases too |
| "How many percent of the variation in y is explained by x" | R² = r² (×100%) |
| "Does x affect y? Test using 95% confidence" + given s_b1 | slope t-test: t = b₁/s_b1 vs t(0.025, n−2) |
| "Find b₀ and b₁ on the R output" | read Coefficients column: (Intercept) = b₀, x-row = b₁ |

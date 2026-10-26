# CH 8 — One-Way ANOVA (Mastery)

> Source: `[2021] Chapter 8 ANOVA.pdf` + past finals.
> Exam weight: **the final question, 15–20 marks, in ALL 8 cataloged papers.** Always one-way ANOVA with EQUAL sample sizes (his syllabus explicitly excludes unequal sizes and two-way). This is the highest-value single skill in the paper.

---

## 1. WHY this exists (first principles)

You know how to compare TWO means (Ch 5.3). Now you have THREE or more groups: do 4 training methods produce different average performance? Do 3 flights differ in mean delay?

Why not just run t-tests on every pair? Two reasons:
1. **Error inflation**: 4 groups = 6 pairwise t-tests; at α = 0.05 each, the chance of at least one false alarm balloons (~26%).
2. **There's a smarter signal**: if all group means are truly equal, then the *spread BETWEEN the group means* should look like ordinary sampling noise — which we can predict from the *spread WITHIN the groups*.

So ANOVA (ANalysis Of VAriance) compares two estimates of the same population variance σ²:

$$F=\frac{\text{variance BETWEEN samples (treatment)}}{\text{variance WITHIN samples (error)}}=\frac{n\,s_{\bar{x}}^2}{s_p^2}$$

- If H₀ (all means equal) is true → both estimate σ² → F ≈ 1.
- If some mean is different → the between-groups estimate inflates → F ≫ 1 → reject.

That's why a test about MEANS is run by analyzing VARIANCES — and why it's always **right-tailed**.

**Data-analytics scenario:** comparing mean conversion across 3+ ad creatives, mean response time across server configurations, mean delivery delay across courier partners. ANOVA is the gatekeeper before you drill into which group differs.

---

## 2. Core concepts in dependency order

1. **Assumptions** (state them for theory marks): populations normal, equal variances, samples random & independent.
2. **Notation (his slides):** n = size of EACH sample; k = number of populations/treatments; s_x̄² = variance OF the k sample means; s_p² = pooled (mean) of the k sample variances.
3. **H₀: μ₁ = μ₂ = ... = μ_k** vs **H₁: at least one mean is different.** (Never write "all means are different".)
4. **Variance between samples** = n·s_x̄² ("variation due to treatment"). WHY multiply by n: means of samples of size n vary with variance σ²/n; scaling by n recovers an estimate of σ².
5. **Variance within samples** = s_p² = mean of the sample variances ("variation due to error") — equal n makes the pooled variance a plain average.
6. **F statistic** = ratio; **df₁ = k − 1 (numerator), df₂ = k(n − 1) (denominator)**.
7. Decision: F₀ > F(α; k−1, k(n−1)) → reject H₀.

---

## 3. His exact 8-step recipe (from the slides — reproduce it in the exam)

1. State H₀: μ₁ = μ₂ = ... = μ_k ; H₁: at least one mean differs.
2. For each group: find n, x̄ᵢ, sᵢ.
3. Variance between samples:
   a. Grand mean of the group means: x̄̄ = (Σ x̄ᵢ)/k
   b. SD of the means: $s_{\bar{x}}=\sqrt{\frac{\sum(\bar{x}_i-\bar{\bar{x}})^2}{k-1}}$
   c. Multiply: n·s_x̄²
4. Variance within samples: $s_p^2=\frac{s_1^2+s_2^2+\cdots+s_k^2}{k}$
5. Test statistic: F = n·s_x̄²/s_p²
6. df: numerator k − 1; denominator k(n − 1).
7. Critical value from F-table at α (always right tail).
8. Compare, decide, conclude in context.

---

## 4. Fully worked example — exact past-final style (2023/24 Q6, 20 marks)

*"Departure delay times (minutes) for 3 flights, 8 observations each. Same mean delay at α = 0.05?"*

| Flight | Data | s given |
|---|---|---|
| AB103 | −2, −1, −2, 2, −2, 0, −2, −3 | s₁ = 1.58 |
| AB112 | 19, −4, −5, −1, −4, 73, 0, 1 | s₂ = 26.64 |
| AB108 | 18, 60, 142, −1, −11, −1, 47, 13 | s₃ = 50.25 |

**(a-i) Means (3m).**
x̄₁ = (−2−1−2+2−2+0−2−3)/8 = −10/8 = **−1.25**
x̄₂ = (19−4−5−1−4+73+0+1)/8 = 79/8 = **9.875**
x̄₃ = (18+60+142−1−11−1+47+13)/8 = 267/8 = **33.375**

**(a-ii) Variance between samples (5m).**
Grand mean of means: x̄̄ = (−1.25 + 9.875 + 33.375)/3 = 42/3 = **14.0**
$$s_{\bar{x}}^2=\frac{(-1.25-14)^2+(9.875-14)^2+(33.375-14)^2}{3-1}=\frac{232.563+17.016+375.391}{2}=\frac{624.969}{2}=312.484$$
$$n\,s_{\bar{x}}^2 = 8\times312.484 = \mathbf{2499.875}$$

**(a-iii) Variance within samples (4m).**
$$s_p^2=\frac{1.58^2+26.64^2+50.25^2}{3}=\frac{2.496+709.690+2525.063}{3}=\frac{3237.249}{3}=\mathbf{1079.083}$$
(Using full-precision s values: 1079.25 — either accepted; differences come from the rounded s's given in the table.)

**(b) F-test at α = 0.05 (8m).**
1. H₀: μ₁ = μ₂ = μ₃ vs H₁: at least one mean delay differs.
2. F₀ = 2499.875/1079.083 = **2.317**
3. df₁ = k − 1 = 2; df₂ = k(n−1) = 3(8−1) = 21.
4. Critical value F(0.05; 2, 21) = **3.467** (F-table page for α = 0.05: column df₁ = 2, row df₂ = 21).
5. Since 2.317 < 3.467 → **fail to reject H₀**.
6. Conclusion: "At α = 0.05 there is insufficient evidence that the flights have different mean departure delay times." (Despite AB108 looking worse, the WITHIN-group spread — e.g. that 142 — is so large that the between-group differences are not statistically significant. This is exactly the lesson of ANOVA.)

---

## 5. Top 5 traps

1. **Denominator df wrong.** df₂ = k(n − 1) — e.g., 3 groups of 8 → 3×7 = 21, NOT 24 − 1 = 23 or n − 1 = 7. F(2,21) vs F(2,23) are different table rows.
2. **Forgetting to multiply by n.** Variance between = n·s_x̄², not s_x̄². Without the n, F shrinks and you'll wrongly fail to reject. (The n multiplies because each group mean is an average of n values.)
3. **Pooling SDs instead of variances.** s_p² averages the SQUARED s's: (s₁²+s₂²+...)/k. Averaging the s's and then squaring is wrong.
4. **Wrong H₁.** "At least one mean is different" — not "all means differ", not "μ₁ ≠ μ₂ ≠ μ₃". Also remember ANOVA never tells you WHICH group differs.
5. **Treating F like a two-tailed test.** Always right-tailed. And don't confuse this F (ANOVA) with the Ch 5.3 F-test for two variances — same table, different df logic and purpose.

Bonus: keep intermediate values to ≥ 3 decimals; the squares amplify rounding (his given s values are rounded, so your F may differ in the 2nd decimal from full precision — marking schemes accept both; SHOW your inputs).

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | Signal |
|---|---|
| "test the claim that the different types have the same mean" | one-way ANOVA |
| "Perform the analysis of variance (ANOVA)" | full 8-step recipe |
| "do these data provide evidence that the mean ... is not the same for all five ..." | ANOVA |
| "Find the mean x̄ and standard deviation s for each ..." | step 2 — itemized marks (3–6m) |
| "Calculate the variance between samples" | n·s_x̄² (find x̄̄ and s_x̄ first) |
| "Calculate the variance within samples" | s_p² = mean of variances |
| "Calculate the test statistics, F" | F = n·s_x̄²/s_p² |
| Table gives n, mean, SD per group (no raw data) | summary-statistics ANOVA — skip step 2, start at step 3 (2018/19 batteries; 2015/16 plagiarism) |
| "indicate whether or not the training differs significantly" | decision + context sentence |
| "Provide your evidence" | show F vs critical value comparison explicitly |
| "mice are sensitive to different colour" (α = 0.01) | ANOVA at α = 0.01 → F(0.01; df₁, df₂) column/page |

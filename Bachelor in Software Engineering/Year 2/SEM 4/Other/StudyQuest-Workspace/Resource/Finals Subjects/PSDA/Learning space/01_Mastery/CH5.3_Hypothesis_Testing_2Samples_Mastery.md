# CH 5.3 — Hypothesis Testing, Two Samples (Mastery)

> Source: `[2021] Chapter 5 (Part 3) Hypothesis Testing 2 Samples.pdf` + past finals.
> Exam weight: this IS Question 2 (20 marks) every year since 2021/22, and Q3 in older papers. **The paired t-test appeared in ALL 8 cataloged final papers — it is the single most guaranteed question in the exam.**

---

## 1. WHY this exists (first principles)

One-sample tests compare a sample against a fixed claimed number. Real analytics questions are usually **comparisons between two groups**: Does version B of the app satisfy users more than version A? Do smokers' heart rates vary more than non-smokers'? Did the tutoring program raise scores?

There is one giant fork in the road, and it decides the whole method:

- **Independent samples**: the two groups are different, unrelated subjects (50 users on Version A, 60 different users on Version B). Information lives in the difference of group means.
- **Dependent samples (matched pairs)**: the same subjects measured twice (each student before AND after tutoring), or naturally matched pairs (husband–wife). Information lives in the per-subject differences D — which kills person-to-person variation and makes the test far more sensitive.

**Data-analytics scenario:** A/B testing (independent), before/after deployment performance (paired), comparing variance of two ETL pipelines' run times (F-test). This chapter is the statistical core of experimentation.

---

## 2. Map of the chapter (dependency order)

```
TWO SAMPLES
├── Two PROPORTIONS                    → z with POOLED p̄
├── Two MEANS — independent
│   ├── σ₁, σ₂ KNOWN (or both n>30)   → z
│   └── σ₁, σ₂ UNKNOWN
│       ├── assume EQUAL variances    → pooled t,  df = n₁+n₂−2
│       └── assume UNEQUAL variances  → Welch t,   df = ν formula (round DOWN)
├── Two MEANS — dependent (pairs)      → paired t on D, df = n−1
└── Two VARIANCES / SDs                → F = s₁²/s₂², df = (n₁−1, n₂−1)
```

---

## 3. Every formula + WHY + when

### 3.1 Two proportions (z)
$$z_0=\frac{(\hat{p}_1-\hat{p}_2)-(p_1-p_2)}{\sqrt{\bar{p}\bar{q}\left(\frac{1}{n_1}+\frac{1}{n_2}\right)}},\qquad \bar{p}=\frac{x_1+x_2}{n_1+n_2},\; \bar{q}=1-\bar{p}$$
- WHY pooled p̄: under H₀ the two proportions are equal, so the best estimate of that common p uses ALL the data. (p₁ − p₂) in the numerator is 0 under H₀.
- Requirements: independent samples; ≥ 5 successes and ≥ 5 failures in each.

### 3.2 Two means, σ known (z)
$$z_0=\frac{\bar{x}_1-\bar{x}_2-\Delta_0}{\sqrt{\frac{\sigma_1^2}{n_1}+\frac{\sigma_2^2}{n_2}}}$$
- WHY add variances: Var(x̄₁ − x̄₂) = Var(x̄₁) + Var(x̄₂) for independent samples (variances ADD even when subtracting). Δ₀ is usually 0.

### 3.3 Two means, σ unknown, EQUAL variances assumed (pooled t)
$$t_0=\frac{\bar{x}_1-\bar{x}_2-\Delta_0}{s_p\sqrt{\frac{1}{n_1}+\frac{1}{n_2}}},\qquad s_p^2=\frac{(n_1-1)s_1^2+(n_2-1)s_2^2}{n_1+n_2-2},\qquad df=n_1+n_2-2$$
- WHY pool: if both populations share one σ², then s₁² and s₂² are two estimates of the same thing — average them, weighted by their degrees of freedom. You "spend" 2 df estimating 2 means → df = n₁+n₂−2.

### 3.4 Two means, σ unknown, UNEQUAL variances (Welch t)
$$t_0=\frac{\bar{x}_1-\bar{x}_2-\Delta_0}{\sqrt{\frac{s_1^2}{n_1}+\frac{s_2^2}{n_2}}},\qquad \nu=\frac{\left(\frac{s_1^2}{n_1}+\frac{s_2^2}{n_2}\right)^2}{\frac{(s_1^2/n_1)^2}{n_1-1}+\frac{(s_2^2/n_2)^2}{n_2-1}}$$
- WHY the ugly ν: there's no exact t here; ν is the approximation that makes the statistic behave like a t. **Round ν DOWN to the integer** (e.g., 13.2 → 13 in his arsenic slide example; 98.25 → 98 in the 2023/24 answer).
- WHEN: the question says "assume the variances are NOT equal" / "population variances are not equal".

### 3.5 Dependent samples (paired t) — THE guaranteed question
$$t_0=\frac{\bar{D}-\mu_D}{s_D/\sqrt{n}},\qquad \bar{D}=\frac{\sum D}{n},\qquad s_D=\sqrt{\frac{\sum D^2-\frac{(\sum D)^2}{n}}{n-1}},\qquad df=n-1$$
- D = difference per pair. **Fix the direction (e.g., D = before − after) and KEEP it.** μ_D = 0 usually (or a stated gap, e.g. "exceeds by more than 3" → μ_D = 3, as in 2015/16 Q2b).
- WHY: pairing converts a 2-sample problem into a 1-sample t-test on the D column. Subject-to-subject noise cancels.
- Sign logic with D = before − after: improvement (after bigger) → D negative → H₁: μ_D < 0. If you define D = after − before, improvement → H₁: μ_D > 0. Either is fine if consistent.

### 3.6 Two variances (F-test)
$$F_0=\frac{s_1^2}{s_2^2},\qquad df_1=n_1-1 \text{ (numerator)},\; df_2=n_2-1 \text{ (denominator)}$$
- WHY a ratio: if σ₁² = σ₂², the ratio of sample variances hovers around 1; a big ratio is evidence of inequality.
- **Table trick (his slides):** F tables only give right-tail values. Put the LARGER sample variance on top → the test becomes right-tailed. For a two-tailed test at α, compare against F(α/2, df₁, df₂) — only the right critical value.
- Requirements: both populations normal, samples independent.

---

## 4. Fully worked examples — exact past-final style (2023/24 Q2, 20 marks)

### 4A. Independent samples, variances unknown & unequal (10 marks)
*"Version A: n₁ = 50, x̄₁ = 4.2, s₁ = 0.8. Version B: n₂ = 60, x̄₂ = 4.5, s₂ = 0.7. Significant difference in satisfaction at α = 0.05?"*

**(i) Hypotheses (2m).** H₀: μ₁ = μ₂ (i.e., μ₁ − μ₂ = 0) vs H₁: μ₁ ≠ μ₂. Two-tailed.

**(ii) Test statistic (2m).** Both n > 30 but s given (not σ) and the paper provides the Welch formula → Welch:
$$t_0=\frac{4.2-4.5}{\sqrt{\frac{0.8^2}{50}+\frac{0.7^2}{60}}}=\frac{-0.3}{\sqrt{0.0128+0.008167}}=\frac{-0.3}{0.1448}=-2.072$$

**(iii) Degrees of freedom (2m).**
$$\nu=\frac{(0.0128+0.008167)^2}{\frac{0.0128^2}{49}+\frac{0.008167^2}{59}}=\frac{0.000440}{0.00000334+0.00000113}=98.25 \Rightarrow df=98$$

**(iv) Decision at α = 0.05 (4m).** Two-tailed critical value t(0.025, 98) ≈ 1.984 (table: use df = 100 row ≈ 1.984; df > 30 ⇒ z = 1.96 also accepted). Since |−2.072| = 2.072 > 1.984 → **reject H₀**. "There is a significant difference in mean customer satisfaction between Version A and Version B at α = 0.05."

### 4B. Paired t (10 marks)
*"Scores before tutoring: 72, 68, 75, 80, 78. After: 82, 85, 88, 90, 86. Does the program significantly improve scores, α = 0.05?"*

**(i) Hypotheses (1m).** D = before − after. Improvement ⇒ after > before ⇒ H₀: μ_D = 0 vs H₁: μ_D < 0 (left-tailed).

**(ii) Full test (9m).**

| Pair | Before | After | D | D² |
|---|---|---|---|---|
| 1 | 72 | 82 | −10 | 100 |
| 2 | 68 | 85 | −17 | 289 |
| 3 | 75 | 88 | −13 | 169 |
| 4 | 80 | 90 | −10 | 100 |
| 5 | 78 | 86 | −8 | 64 |
| Σ | | | **−58** | **722** |

$$\bar{D}=\frac{-58}{5}=-11.6,\qquad s_D=\sqrt{\frac{722-\frac{(-58)^2}{5}}{4}}=\sqrt{\frac{722-672.8}{4}}=\sqrt{12.3}=3.507$$
$$t_0=\frac{-11.6-0}{3.507/\sqrt{5}}=\frac{-11.6}{1.5684}=-7.396$$

Critical value: left tail, α = 0.05, df = 4 → −t(0.05,4) = **−2.132**. Since −7.396 < −2.132 → **reject H₀**. "At α = 0.05 there is sufficient evidence that the tutoring program significantly improves test scores."

### 4C. F-test on two variances (2022/23 Q2a — 10 marks)
*"Older adults: n₁ = 13, s₁ = 1.21. Younger: n₂ = 16, s₂ = 0.63. Difference in variability at α = 0.05?"*

H₀: σ₁² = σ₂² vs H₁: σ₁² ≠ σ₂² (two-tailed). Larger variance already on top:
$$F_0=\frac{1.21^2}{0.63^2}=\frac{1.4641}{0.3969}=3.689$$
Critical: F(α/2 = 0.025; df₁ = 12, df₂ = 15) = 2.96. Since 3.689 > 2.96 → **reject H₀**: variability differs between the two groups.

---

## 5. Top 5 traps

1. **Misclassifying paired vs independent.** Same subjects measured twice / "before and after" / matched pairs → PAIRED. Two different groups of people → independent. Using a 2-sample t on paired data is a structural zero.
2. **Pooled vs Welch: read the instruction.** His papers always tell you: "assume the two population variances are equal" → pooled; "are not equal" → Welch. No instruction + σ given → z. Don't freelance.
3. **Welch df errors.** Round ν DOWN (13.2 → 13). Denominator terms divide by n₁−1 and n₂−1, not n₁ and n₂.
4. **Two-proportion test without pooling.** The SE under H₀ uses pooled p̄ = (x₁+x₂)/(n₁+n₂). Using separate p̂'s in the SE is a method error (the separate form is only for CIs).
5. **Paired t: direction chaos.** Compute every D the same way; carry the negative sign through s_D (squares kill the sign, but ΣD keeps it); match H₁'s direction to your D definition. If t₀ is negative and the test is left-tailed, the critical value must also be negative.

Bonus: **F-test tail discipline** — put larger s² in the numerator and use α/2 for a two-tailed claim (his slides explicitly teach this trick).

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | Signal |
|---|---|
| "two independent samples" / two different groups described | independent-samples test |
| "before and after" / "each person measured twice" / paired table | paired t-test |
| "Assume that the population variances are equal" | pooled t, df = n₁+n₂−2 |
| "standard deviations for the two populations are not equal" | Welch t + ν formula |
| "population standard deviations ... are σ₁ = ..., σ₂ = ..." | two-sample z |
| "Is there a difference in the proportion of ..." | two-proportion z, pooled p̄ |
| "whether the variance ... is different from" / "varied more than" / "not producing as consistently" | F-test s₁²/s₂² |
| "Is there sufficient evidence that brand X lasts shorter than brand Y" | one-tailed (left if X−Y), pooled/Welch per instruction |
| "exceeds ... by more than 3" (paired) | μ_D = 3, not 0 |
| "test at 2.5% significance (95% CI)" wording (2021/22) | α as stated; ignore the parenthetical confusion, use α = 0.025 one-tail |
| "Calculate the degree of freedom" (its own marks) | Welch ν — show the formula, round down |
| "Determine the effectiveness of ... using a suitable t-test" | paired t (subjects measured twice) |

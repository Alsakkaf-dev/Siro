# CH 5.1 — Point Estimation & Interval Estimation (Mastery)

> Source: `[2021] Chapter 5 (Part 1) Point Estimate.pdf` + past finals 2015/16 → 2023/24.
> Exam weight: this topic IS Question 1 of the final, every single year (8–10 marks, sometimes inside a 25-mark Q1).

---

## 1. WHY this exists (first principles)

You almost never get to measure a whole population. You want the average yield of ALL wheat fields in a region — you can only afford to sample 15 fields. The number you compute from the sample (x̄ = 51.333 kg/acre) is your **point estimate**: the single best guess for the unknown population mean μ.

Problem: a single number carries **zero information about how wrong it might be**. A different sample of 15 fields would give a different x̄. So instead of saying "μ is 51.333", we say "we are 90% confident μ is between 50.051 and 52.616". That range is a **confidence interval (CI)** — a point estimate plus a **margin of error** that honestly reports the uncertainty.

**Data-analytics scenario:** you A/B test a new checkout page. 158 of 367 users click "buy" (p̂ = 0.431). Before telling your boss "43% conversion!", a CI tells you the truth: with 95% confidence the real conversion is anywhere from 38.0% to 48.1%. That width is what stops bad business decisions.

**The logic of "95% confident":** if you repeated the sampling procedure many times, 95% of the intervals you'd construct would capture the true parameter. The parameter is fixed; it's the interval that varies sample-to-sample.

---

## 2. Core concepts in dependency order

1. **Parameter** (population, unknown, Greek: μ, p, σ) vs **statistic** (sample, computed: x̄, p̂, s).
2. **Point estimate** = single-number best guess. Use x̄ for μ, p̂ for p, s for σ.
3. **Good estimator properties** (slides, and asked conceptually in 2015/16 Q1b):
   - **Unbiased**: its sampling distribution is centered at the true parameter (x̄ and p̂ are unbiased).
   - **Small standard error**: among unbiased estimators, prefer the one with the smallest spread → more precise.
4. **Sampling distribution** of x̄ / p̂: approximately normal for large n (Central Limit Theorem), centered at the parameter, with spread = **standard error (SE)**.
5. **Margin of error E** = (critical value) × SE.
6. **Confidence interval** = point estimate ± E.
7. **Confidence level ↔ α**: level = 1 − α. 95% CI → α = 0.05, split α/2 = 0.025 in each tail.

---

## 3. Every formula + the WHY + when

### 3.1 CI for a population proportion p
$$\hat{p} \pm z_{\alpha/2}\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}$$
- p̂ = x/n (successes ÷ sample size); q̂ = 1 − p̂.
- WHY z: for large n, the sampling distribution of p̂ is approximately normal (slide condition: np > 10 and n(1−p) > 10; exam-paper version: "at least 5 successes and 5 failures").
- WHY √(p̂q̂/n): that's the standard error of p̂ — the SD of the sampling distribution.

### 3.2 CI for a population mean μ — σ KNOWN (or n > 30)
$$\bar{x} \pm z_{\alpha/2}\frac{\sigma}{\sqrt{n}}$$
- WHY: when σ is known, (x̄ − μ)/(σ/√n) is exactly standard normal (or approx by CLT for n > 30).

### 3.3 CI for a population mean μ — σ UNKNOWN and n ≤ 30
$$\bar{x} \pm t_{\alpha/2,\,n-1}\frac{s}{\sqrt{n}}$$
- WHY t and not z: you replaced σ with the estimate s, which adds extra uncertainty. The t-distribution has fatter tails to pay for that. As df = n − 1 grows, t → z.
- df = n − 1 because s uses one degree of freedom estimating the mean.

### 3.4 Sample size determination (appeared 2017/18 Q1b)
$$n = \left(\frac{z_{\alpha/2}\,\sigma}{E}\right)^2 \quad\text{(mean)} \qquad n = \frac{z_{\alpha/2}^2\,\hat{p}\hat{q}}{E^2} \quad\text{(proportion)}$$
- WHY: solve E = z·SE for n. **Always round UP** (ceil), never down — rounding down would miss the target precision.

### THE z vs t DECISION TREE (memorize — his course's convention)

```
Estimating/testing a MEAN?
├── σ (population SD) KNOWN?  → use z
├── σ UNKNOWN but n > 30?     → use z with s   (course convention, per slides & formula card)
└── σ UNKNOWN and n ≤ 30?     → use t with df = n − 1  (data must be ~normal)

Estimating a PROPORTION? → always z (large-sample)
```

### Critical values to memorize (his "cut & keep handy" slide)
| Confidence level | α | α/2 | z critical |
|---|---|---|---|
| 90% | 0.10 | 0.05 | **1.645** |
| 95% | 0.05 | 0.025 | **1.96** |
| 98% | 0.02 | 0.01 | **2.33** |
| 99% | 0.01 | 0.005 | **2.575 (≈2.58)** |

---

## 4. Fully worked example — exact past-final style

**(2023/24 Final, Q1a — 7 marks.)** A study estimates average wheat yield per acre. 15 fields are sampled; yields (kg/acre):

| 50 | 55 | 48 | 52 | 49 | 56 | 53 | 47 | 51 | 50 | 54 | 52 | 48 | 50 | 55 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

**(i) Point estimate of μ (2 marks).**
$$\bar{x} = \frac{\sum x}{n} = \frac{770}{15} = 51.333 \text{ kg/acre}$$

**(ii) Construct & interpret a 90% CI for μ (5 marks).**

*Step 1 — Which formula?* σ unknown (we only have data), n = 15 ≤ 30 → **t-interval**, df = 15 − 1 = 14.

*Step 2 — Sample standard deviation.*
$$s = \sqrt{\frac{\sum(x-\bar{x})^2}{n-1}} = 2.820$$
(Calculator: enter the 15 values, use the s_x / σ_{n−1} key. Show the formula on paper.)

*Step 3 — t critical value (table lookup).* 90% → α = 0.10 → α/2 = 0.05 in each tail. In the t-table, row df = 14, column 0.05 (one tail): **t = 1.761**.

*Step 4 — Margin of error.*
$$E = t_{0.05,14}\cdot\frac{s}{\sqrt{n}} = 1.761 \times \frac{2.820}{\sqrt{15}} = 1.761 \times 0.728 = 1.282$$

*Step 5 — Interval.*
$$51.333 \pm 1.282 \;\Rightarrow\; (50.051,\; 52.616)$$

*Step 6 — Interpretation (write the sentence — it carries marks):* "We are 90% confident that the true mean wheat yield per acre lies between 50.051 and 52.616 kg/acre."

**Companion (proportion, 2022/23 Q1a):** 158 of 367 students actively use ChatGPT. p̂ = 158/367 = 0.431. SE = √(0.431×0.569/367) = 0.0259. 95% CI = 0.431 ± 1.96(0.0259) = 0.431 ± 0.051 = **(0.380, 0.481)**. "We are 95% confident the true proportion of active users is between 0.380 and 0.481."

---

## 5. Top 5 traps

1. **Using z when the question gives raw data with no σ and n ≤ 30.** If σ isn't stated as known, and n ≤ 30 → t. (Wheat example: t, NOT 1.645.)
2. **Wrong table column**: for a 90% CI you need t with 0.05 in ONE tail (some tables label by two-tail area — check whether the heading says "α one tail" or "α two tails").
3. **Dividing by n instead of √n** in the standard error. SE = s/√n.
4. **Forgetting the interpretation sentence.** "Construct AND interpret" = the sentence is worth ~1 mark every time. Template: "We are [C]% confident that the true [parameter in context] is between [lower] and [upper] [units]."
5. **Sample size: rounding down.** n = 62.35 → need n = 63. Also: bigger n → narrower interval; higher confidence → wider interval (conceptual marks in 2015/16 Q1a and 2017/18-S1 Q1c).

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | What you must do |
|---|---|
| "Calculate a point estimate of the population mean μ" | x̄ = Σx/n. Done. (Don't build an interval.) |
| "Compute a point estimate of the true proportion" | p̂ = x/n |
| "Construct and interpret a XX% confidence interval" | CI formula + the "we are XX% confident..." sentence |
| "standard deviation of ... is known to be / σ = ..." | z-interval (σ known) |
| "sample standard deviation was..." with n ≤ 30 | t-interval, df = n − 1 |
| "Estimate the mean ... with 99% confidence level" | CI, z or t per decision tree |
| "margin of error of 0.04" / "error within ±..." | sample size formula, round UP |
| "Which interval is smaller / based on larger sample? Explain" | width ∝ 1/√n: larger n → smaller E → narrower CI |
| "Which statistic would you recommend?" (sampling distribution figures) | pick unbiased (centered at parameter) + smallest standard error |

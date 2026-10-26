# ANSWERS — Drill CH5: Estimation & Hypothesis Testing

---

## P1 — CI for proportion

**(i)** p̂ = 132/400 = **0.330**

**(ii)** 95% → z = 1.96. SE = √(p̂q̂/n) = √(0.33×0.67/400) = √0.000553 = 0.0235.
E = 1.96 × 0.0235 = 0.046.
CI = 0.330 ± 0.046 = **(0.284, 0.376)**.
Interpretation: "We are 95% confident that the true proportion of all subscribers willing to pay for an ad-free tier is between 0.284 and 0.376."

---

## P2 — CI for mean (σ known) + sample size

**(i)** σ known → z. 90% → z = 1.645.
E = 1.645 × 1.2/√40 = 1.645 × 0.1897 = 0.312.
CI = 4.8 ± 0.312 = **(4.488, 5.112) minutes**.

**(ii)** n = (z·σ/E)² = (1.645 × 1.2/0.25)² = (7.896)² = 62.35 → round UP → **n = 63**.

---

## P3 — CI for mean (t)

**(i)** Σx = 417.5 → x̄ = 417.5/12 = **34.792 hours**.

**(ii)** σ unknown, n = 12 ≤ 30 → t with df = 11. s = 0.785 (from Σ(x−x̄)²/(n−1)).
t(0.025, 11) = 2.201.
E = 2.201 × 0.785/√12 = 2.201 × 0.2265 = 0.498.
CI = 34.792 ± 0.498 = **(34.293, 35.290)**.
"We are 95% confident the true mean battery life is between 34.293 and 35.290 hours."

---

## P4 — One-sample z-test (right-tailed)

1. H₀: μ = 200 vs H₁: μ > 200 (claim: "exceeds").
2. σ known → z: z₀ = (212 − 200)/(35/√50) = 12/4.950 = **2.424**.
3. Critical value: z(0.05) = 1.645.
4. 2.424 > 1.645 → **reject H₀**. (P-value = P(Z > 2.424) ≈ 0.008 ≤ 0.05.)
5. "At α = 0.05 there is sufficient evidence that the mean response time exceeds 200 ms — the claim is supported."

---

## P5 — One-sample t-test (two-tailed)

1. H₀: μ = 15 vs H₁: μ ≠ 15.
2. Σx = 141.5 → x̄ = 14.150; s = 1.184. σ unknown, n = 10 → t, df = 9.
3. t₀ = (14.150 − 15)/(1.184/√10) = −0.850/0.3745 = **−2.269**.
4. Critical: α = 0.01 two-tailed → t(0.005, 9) = 3.250 → reject if |t₀| > 3.250.
5. |−2.269| = 2.269 < 3.250 → **fail to reject H₀**.
6. "At α = 0.01 there is insufficient evidence that the mean session length differs from 15 minutes."

---

## P6 — χ² test on standard deviation (left-tailed)

**(i)** H₀: σ = 2.5 vs H₁: σ < 2.5 (claim: "less than").

**(ii)** χ²₀ = (n−1)s²/σ₀² = 19 × 1.9²/2.5² = 19 × 3.61/6.25 = 68.59/6.25 = **10.974**.

**(iii)** Left-tailed, α = 0.05, df = 19 → use the right-tail-0.95 column: χ²(0.95, 19) = **10.117**. Reject if χ²₀ < 10.117.

**(iv)** Sketch: right-skewed χ² curve, shade the LEFT tail below 10.117. Since 10.974 > 10.117, the statistic is NOT in the rejection region → **fail to reject H₀**. "At α = 0.05 there is insufficient evidence to support the claim that the standard deviation of delivery times is less than 2.5 days." (Close call — note how the left-tail lookup decided it.)

---

## P7 — Two-proportion z-test

1. H₀: p₁ = p₂ vs H₁: p₁ ≠ p₂ (two-tailed: "difference").
2. p̂₁ = 78/520 = 0.150; p̂₂ = 51/480 = 0.106.
3. Pooled: p̄ = (78+51)/(520+480) = 129/1000 = 0.129; q̄ = 0.871.
4. SE = √(0.129 × 0.871 × (1/520 + 1/480)) = √(0.112359 × 0.004006) = 0.0212.
5. z₀ = (0.150 − 0.106)/0.0212 = **2.062**.
6. Critical: α = 0.01 two-tailed → ±z(0.005) = ±2.576.
7. |2.062| < 2.576 → **fail to reject H₀**. "At α = 0.01 the sign-up proportions of designs A and B are not significantly different." (At α = 0.05 it WOULD be significant — α matters.)

---

## P8 — F-test for two variances

1. H₀: σ₁² = σ₂² vs H₁: σ₁² ≠ σ₂² (two-tailed: "variability differs").
2. Larger variance on top (already is): F₀ = s₁²/s₂² = 2.4²/1.3² = 5.76/1.69 = **3.408**.
3. df₁ = 10 − 1 = 9 (numerator), df₂ = 12 − 1 = 11 (denominator).
4. Two-tailed → use α/2 = 0.025 right tail: F(0.025; 9, 11) = 3.59.
5. 3.408 < 3.59 → **fail to reject H₀**. "At α = 0.05 there is insufficient evidence that the two teams' variability differs." (Borderline — exam-style trap where the obvious-looking difference isn't quite significant.)

---

## P9 — Pooled t-test (right-tailed)

1. H₀: μ₁ = μ₂ vs H₁: μ₁ > μ₂.
2. Pooled variance:
   s_p² = [(n₁−1)s₁² + (n₂−1)s₂²]/(n₁+n₂−2) = [11(26.01) + 9(21.16)]/20 = (286.11 + 190.44)/20 = 476.55/20 = 23.828 → s_p = 4.881.
3. t₀ = (42.3 − 37.8)/(4.881 × √(1/12 + 1/10)) = 4.5/(4.881 × √0.18333) = 4.5/(4.881 × 0.4282) = 4.5/2.090 = **2.153**.
4. df = 12 + 10 − 2 = 20; critical t(0.05, 20) = 1.725 (right tail).
5. 2.153 > 1.725 → **reject H₀**. "At α = 0.05 there is sufficient evidence that Hub A's mean delivery time is greater than Hub B's."

---

## P10 — Paired t-test (the guaranteed question)

1. Pairs (same pages measured twice) → paired t. D = before − after; "reduced" ⇒ after < before ⇒ D > 0 ⇒ H₀: μ_D = 0 vs H₁: μ_D > 0 (right-tailed).

2. Difference table:

| Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Σ |
|---|---|---|---|---|---|---|---|---|---|
| D | 0.6 | 0.2 | 0.9 | 0.3 | 0.2 | 0.9 | 0.5 | 0.3 | **3.9** |
| D² | 0.36 | 0.04 | 0.81 | 0.09 | 0.04 | 0.81 | 0.25 | 0.09 | **2.49** |

3. D̄ = 3.9/8 = 0.488.
   s_D = √[(ΣD² − (ΣD)²/n)/(n−1)] = √[(2.49 − 15.21/8)/7] = √[(2.49 − 1.901)/7] = √0.0841 = 0.290.
4. t₀ = (0.488 − 0)/(0.290/√8) = 0.488/0.1025 = **4.754**.
5. df = 7; critical t(0.05, 7) = 1.895 (right tail).
6. 4.754 > 1.895 → **reject H₀**.
7. "At α = 0.05 there is sufficient evidence that the optimization reduced mean page load time."

(If you defined D = after − before: D̄ = −0.488, H₁: μ_D < 0, t₀ = −4.754 vs critical −1.895 → identical conclusion. Direction consistency is what matters.)

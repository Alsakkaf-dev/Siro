# 05 — MOCK FINAL v1: COMPLETE MARKING-SCHEME SOLUTIONS

> Mark allocations shown the way his real schemes itemize them. ✓ = mark point.

---

## QUESTION 1 [10 MARKS]

### (a-i) Point estimate (2 m)
Σx = 469 ✓ → x̄ = 469/15 = **31.267 minutes** ✓

### (a-ii) 90% CI (5 m)
σ unknown, n = 15 ≤ 30 → t-interval, df = 14 ✓
s = 2.658 ✓ (Σ(x−x̄)² = 98.933; 98.933/14 = 7.067; √7.067 = 2.658)
t(0.05, 14) = 1.761 ✓
E = 1.761 × 2.658/√15 = 1.761 × 0.686 = 1.209 ✓
CI = 31.267 ± 1.209 = **(30.058, 32.476)**.
"We are 90% confident the true mean delivery time is between 30.058 and 32.476 minutes." ✓

### (b) One-sample z-test (3 m)
H₀: μ = 6 vs H₁: μ > 6 (right-tailed); σ known → z ✓
z₀ = (6.4 − 6)/(1.5/√45) = 0.4/0.2236 = **1.789** ✓
Critical z(0.05) = 1.645; 1.789 > 1.645 → reject H₀. "At α = 0.05 there is sufficient evidence that mean daily screen time exceeds 6 hours." ✓
(P-value = P(Z > 1.789) = 0.037 ≤ 0.05 — same decision.)

---

## QUESTION 2 [20 MARKS]

### (a-i) Hypotheses (2 m)
H₀: μ_X = μ_Y (μ_X − μ_Y = 0) ✓ H₁: μ_X ≠ μ_Y (two-tailed) ✓

### (a-ii) Test statistic — Welch (2 m)
s₁²/n₁ = 0.81/40 = 0.02025; s₂²/n₂ = 0.36/50 = 0.0072
t₀ = (3.9 − 4.3)/√(0.02025 + 0.0072) = −0.4/√0.02745 = −0.4/0.16568 = **−2.414** ✓✓

### (a-iii) Degrees of freedom (2 m)
ν = (0.02745)²/[(0.02025)²/39 + (0.0072)²/49]
= 0.0007535/(0.00001051 + 0.00000106) = 0.0007535/0.00001157 = 65.11 → **df = 65** (round down) ✓✓

### (a-iv) Decision at α = 0.05 (4 m)
Critical: t(0.025, 65) ≈ 1.997 (table row 60: 2.000 — accepted) ✓
|−2.414| = 2.414 > 1.997 → statistic in rejection region ✓ → **reject H₀** ✓
"There is a significant difference in mean satisfaction between Interface X and Interface Y at α = 0.05 (Y rated higher)." ✓

### (b-i) Hypotheses (1 m)
D = before − after. Course increases speed ⇒ after > before ⇒ H₀: μ_D = 0, H₁: μ_D < 0 ✓ (left-tailed)

### (b-ii) Paired t-test (9 m)

| Emp | Before | After | D | D² |
|---|---|---|---|---|
| 1 | 38 | 45 | −7 | 49 |
| 2 | 42 | 46 | −4 | 16 |
| 3 | 35 | 38 | −3 | 9 |
| 4 | 40 | 45 | −5 | 25 |
| 5 | 44 | 50 | −6 | 36 |
| 6 | 37 | 40 | −3 | 9 |
| Σ | | | **−28** | **144** |

✓✓ (D column; ΣD, ΣD²)
D̄ = −28/6 = −4.667 ✓
s_D = √[(144 − (−28)²/6)/5] = √[(144 − 130.667)/5] = √2.667 = 1.633 ✓✓
t₀ = (−4.667 − 0)/(1.633/√6) = −4.667/0.6667 = **−7.000** ✓
Critical: −t(0.05, 5) = −2.015 ✓
−7.000 < −2.015 → **reject H₀** ✓
"At α = 0.05 the typing course significantly increases typing speed." ✓

---

## QUESTION 3 [20 MARKS]

### (a-i) Hypotheses (1 m)
H₀: p₁ = p₂ = p₃ = p₄ = p₅ = 1/5 (visits equally distributed); H₁: at least one proportion differs ✓

### (a-ii) Expected + statistic (4 m)
n = 410+395+430+388+427 = 2050 → E = 2050/5 = **410** ✓

| Day | O | (O−E)²/E |
|---|---|---|
| Mon | 410 | 0.000 |
| Tue | 395 | 0.549 |
| Wed | 430 | 0.976 |
| Thu | 388 | 1.180 |
| Fri | 427 | 0.705 |

χ²₀ = **3.410** ✓✓✓

### (a-iii) Critical + conclusion (3 m)
df = 4; χ²(0.05, 4) = 9.488 ✓. 3.410 < 9.488 → fail to reject H₀ ✓. "The data are consistent with visits being equally distributed across weekdays (we cannot 'prove' equality — we fail to find evidence against it)." ✓

### (b-i) Hypotheses (2 m)
H₀: churn and subscription plan are independent ✓; H₁: churn and plan are related ✓

### (b-ii) Expected counts + statistic (7 m)
Row totals: 150, 170, 80; column totals: 85, 315; n = 400 ✓
e = (row×col)/n: Basic-churn 150×85/400 = 31.875; Basic-no 118.125; Standard-churn 36.125; Standard-no 133.875; Premium-churn 17.000; Premium-no 63.000 ✓✓ (all ≥ 5 ✓)

| Cell | O | E | (O−E)²/E |
|---|---|---|---|
| Basic, churn | 45 | 31.875 | 5.404 |
| Basic, no | 105 | 118.125 | 1.458 |
| Std, churn | 30 | 36.125 | 1.039 |
| Std, no | 140 | 133.875 | 0.280 |
| Prem, churn | 10 | 17.000 | 2.882 |
| Prem, no | 70 | 63.000 | 0.778 |

χ²₀ = **11.842** ✓✓✓

### (b-iii) Decision (3 m)
df = (3−1)(2−1) = 2 ✓; χ²(0.05, 2) = 5.991 ✓. 11.842 > 5.991 → **reject H₀**: churn is related to subscription plan (Basic churns above expectation, Premium below). ✓

---

## QUESTION 4 [15 MARKS]

### (a) Scatterplot (2 m)
Plot the 7 points (m on horizontal, q on vertical): clear downward drift ✓. Relationship: **negative** (more social-media hours ↔ lower sleep quality) ✓.

### (b) Correlation coefficient (11 m)
Sums: Σm = 40 ✓, Σq = 497 ✓, Σm² = 268 (given), Σq² = 35,811 (given), Σmq = 2,698 ✓✓ (compute: 168+240+370+438+455+496+531)
n = 7.
Numerator: Σmq − (Σm)(Σq)/n = 2698 − (40)(497)/7 = 2698 − 2840 = **−142.000** ✓✓
Denominator: √[(268 − 40²/7)(35811 − 497²/7)] = √[(268 − 228.571)(35811 − 35287)] = √[(39.429)(524.000)] ✓✓ = √20660.796 = 143.738 ✓
$$r = \frac{-142.000}{143.738} = \mathbf{-0.988}$$ ✓
Interpretation: very strong negative linear relationship between social-media hours and sleep quality. ✓

### (c) (2 m)
Since r is strongly negative, the variables move in opposite directions: if m decreases, q is expected to **increase** (better sleep quality) ✓✓. (Note: association, not proof of causation.)

---

## QUESTION 5 [15 MARKS]

### (a-i) Sums (5 m — 1 each)
Σx = 108 ✓ Σy = 311 ✓ Σx² = 2256 ✓ Σy² = 14381 ✓ Σxy = 4232 ✓
(Σxy: 232+400+416+656+704+864+960 = 4232)

### (a-ii) Least-squares equation (4 m)
b₁ = [4232 − (108)(311)/7]/[2256 − 108²/7] = (4232 − 4798.286)/(2256 − 1666.286) ✓
= −566.286/589.714 = **−0.960** ✓
x̄ = 108/7 = 15.429; ȳ = 311/7 = 44.429
b₀ = 44.429 − (−0.960)(15.429) = 44.429 + 14.812 = **59.241** ✓
(Full precision: b₁ = −0.96027, b₀ = 59.244 — both accepted at 3 d.p. discipline.)
$$\boxed{\hat{y} = 59.241 - 0.960x}$$ ✓

### (a-iii) Prediction at x = 20 (1 m)
ŷ = 59.241 − 0.960(20) = 59.241 − 19.200 = **40.041 ≈ 40.0 minutes** ✓ (full precision 40.039)

### (b-i) Sketch + direction (2 m)
Upward-sloping cloud of 6 points around the line ŷ = 62.4 + 0.95x ✓; positive relationship — older patients tend to have higher fasting glucose ✓.

### (b-ii) Slope test (3 m)
H₀: β₁ = 0 vs H₁: β₁ ≠ 0; df = n − 2 = 4 ✓
t₀ = b₁/s_b1 = 0.95/0.21 = **4.524** ✓
Critical t(0.025, 4) = 2.776. 4.524 > 2.776 → reject H₀: age significantly affects the glucose reading at the 95% confidence level ✓.

---

## QUESTION 6 [20 MARKS]

### (a-i) Means (3 m)
x̄₁ = (24+26+22+25+27+23+26+24)/8 = 197/8 = **24.625** ✓
x̄₂ = 244/8 = **30.500** ✓
x̄₃ = 208/8 = **26.000** ✓

### (a-ii) Variance between samples (5 m)
Grand mean of means: x̄̄ = (24.625 + 30.500 + 26.000)/3 = 81.125/3 = 27.042 ✓
s_x̄² = [(24.625−27.042)² + (30.500−27.042)² + (26.000−27.042)²]/(3−1) ✓
= [5.842 + 11.958 + 1.086]/2 = 18.886/2 = 9.443 ✓✓
Variance between = n·s_x̄² = 8 × 9.443 = **75.544** ✓ (full precision 75.542)

### (a-iii) Variance within samples (4 m)
s₁² = 1.685² = 2.839 ✓; s₂² = 1.604² = 2.573; s₃² = 1.309² = 1.713 ✓
s_p² = (2.839 + 2.573 + 1.713)/3 = 7.125/3 = **2.375** ✓✓

### (b) F-test at α = 0.05 (8 m)
1. H₀: μ₁ = μ₂ = μ₃ (same mean delivery time) ✓ H₁: at least one mean differs ✓
2. F₀ = 75.544/2.375 = **31.808** ✓✓ (full precision 31.807)
3. df₁ = k−1 = 2; df₂ = k(n−1) = 3×7 = 21 ✓
4. Critical F(0.05; 2, 21) = 3.467 ✓
5. 31.808 > 3.467 → **reject H₀** ✓
6. "At α = 0.05 there is sufficient evidence that the couriers do NOT all have the same mean delivery time (K2 is visibly slower)." ✓

---

## SELF-MARKING GUIDE

| Q | Marks | Your score |
|---|---|---|
| 1 | /10 | |
| 2 | /20 | |
| 3 | /20 | |
| 4 | /15 | |
| 5 | /15 | |
| 6 | /20 | |
| **Total** | **/100** | |

Score bands: 80+ exam-ready · 60–79 redo the drills for your weak chapters · <60 reread the relevant Mastery doc §4 worked example, then retry this mock cold in 48 h.

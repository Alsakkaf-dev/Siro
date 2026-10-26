# 04 — EMERGENCY FINAL REVIEW (one dense sheet)
### Aligned to the Triola formula card + the formula list printed in his exam papers

---

## A. MASTER DECISION TREE — "which test?"

```
WHAT is the question about?
│
├── ONE number claimed about ONE group
│   ├── mean μ ........ σ known OR n>30 → z = (x̄−μ₀)/(σ/√n)   [use s if σ unknown, n>30]
│   │                   σ unknown AND n≤30 → t = (x̄−μ₀)/(s/√n), df = n−1
│   ├── proportion p .. z = (p̂−p₀)/√(p₀q₀/n)
│   └── variance/SD ... χ² = (n−1)s²/σ₀², df = n−1   (NOT symmetric — watch tails)
│
├── COMPARING TWO groups
│   ├── same subjects twice (before/after, matched pairs)
│   │      → PAIRED t: t = (D̄−μ_D)/(s_D/√n), df = n−1
│   ├── two different groups, MEANS
│   │      ├── σ₁,σ₂ known (or both n>30) → z with √(σ₁²/n₁+σ₂²/n₂)
│   │      ├── "assume variances EQUAL"   → pooled t, df = n₁+n₂−2
│   │      └── "variances NOT equal"      → Welch t, df = ν (round DOWN)
│   ├── two PROPORTIONS → z with pooled p̄ = (x₁+x₂)/(n₁+n₂)
│   └── two VARIANCES   → F = s₁²/s₂² (larger on top), df = (n₁−1, n₂−1)
│
├── COUNTS in categories
│   ├── 1 variable vs claimed distribution → χ² GOF: E = n/k (equal) or n·p (claimed %), df = k−1
│   └── 2 variables related?               → χ² independence: e = (row)(col)/n, df = (r−1)(c−1)
│
├── TWO numeric variables
│   ├── strength of relationship → Pearson r  (ranks/ordinal → Spearman r_s)
│   ├── is correlation real?     → t = r/√((1−r²)/(n−2)), df = n−2
│   ├── predict y from x         → ŷ = b₀ + b₁x (least squares)
│   ├── % variation explained    → R² = SSR/SST = r²
│   └── does x affect y?         → t = b₁/s_b1, df = n−2
│
└── THREE OR MORE group means → one-way ANOVA: F = n·s_x̄²/s_p², df = (k−1, k(n−1))
```

**z vs t in one line:** σ known → z. σ unknown: n > 30 → z (course convention), n ≤ 30 → t.

---

## B. FORMULA QUICK-REFERENCE with variable definitions

### Confidence intervals
| What | Formula | Pieces |
|---|---|---|
| Mean, σ known / n>30 | x̄ ± z_{α/2}·σ/√n | x̄ sample mean; z_{α/2}: 1.645 (90%), 1.96 (95%), 2.575 (99%) |
| Mean, σ unknown, n≤30 | x̄ ± t_{α/2,n−1}·s/√n | s sample SD; df = n−1 |
| Proportion | p̂ ± z_{α/2}·√(p̂q̂/n) | p̂ = x/n, q̂ = 1−p̂ |
| Sample size (mean) | n = (z_{α/2}σ/E)² | E target margin; ROUND UP |
| Sample size (prop.) | n = z²p̂q̂/E² | no p̂? use 0.25 for p̂q̂ |

### One-sample tests
| Test | Statistic | df |
|---|---|---|
| Mean (z) | z₀ = (x̄−μ₀)/(σ/√n) | — |
| Mean (t) | t₀ = (x̄−μ₀)/(s/√n) | n−1 |
| Variance/SD | χ²₀ = (n−1)s²/σ₀² | n−1 |

### Two-sample tests
| Test | Statistic | Notes |
|---|---|---|
| 2 means, σ known | z₀ = (x̄₁−x̄₂−Δ₀)/√(σ₁²/n₁+σ₂²/n₂) | Δ₀ usually 0 |
| Pooled t | t₀ = (x̄₁−x̄₂−Δ₀)/(s_p√(1/n₁+1/n₂)); s_p² = [(n₁−1)s₁²+(n₂−1)s₂²]/(n₁+n₂−2) | df = n₁+n₂−2 |
| Welch t | t₀ = (x̄₁−x̄₂−Δ₀)/√(s₁²/n₁+s₂²/n₂) | ν = (A+B)²/[A²/(n₁−1)+B²/(n₂−1)], A = s₁²/n₁, B = s₂²/n₂; round DOWN |
| Paired t | t₀ = (D̄−μ_D)/(s_D/√n); s_D = √[(ΣD²−(ΣD)²/n)/(n−1)] | df = n−1; fix D direction |
| 2 proportions | z₀ = (p̂₁−p̂₂)/√(p̄q̄(1/n₁+1/n₂)); p̄ = (x₁+x₂)/(n₁+n₂) | pool under H₀ |
| 2 variances | F₀ = s₁²/s₂² (larger on top) | df = (n₁−1, n₂−1); two-tailed → α/2 right |

### Chi-square (counts)
χ² = Σ(O−E)²/E. GOF: E = n/k or n·pᵢ, df = k−1. Independence: e_ij = (rowᵢ·colⱼ)/n, df = (r−1)(c−1). Both ALWAYS right-tailed. Check all E ≥ 5.

### Correlation & regression
$$r=\frac{\sum xy - \frac{\sum x\sum y}{n}}{\sqrt{(\sum x^2-\frac{(\sum x)^2}{n})(\sum y^2-\frac{(\sum y)^2}{n})}}\qquad r_s = 1-\frac{6\sum d_i^2}{n(n^2-1)},\; d_i = \text{rank}(y_i)-\text{rank}(x_i)$$
$$b_1=\frac{\sum xy-\frac{\sum x\sum y}{n}}{\sum x^2-\frac{(\sum x)^2}{n}}\;(\text{same numerator as }r)\qquad b_0=\bar{y}-b_1\bar{x}\qquad \hat{y}=b_0+b_1x$$
Tests (both df = n−2): correlation t = r/√((1−r²)/(n−2)); slope t = b₁/s_b1.
R² = SSR/SST = r²; SST = SSR + SSE; sentence: "R²% of the variation in y is explained by x."

### ANOVA (equal n only — his syllabus)
1) x̄ᵢ, sᵢ per group → 2) x̄̄ = mean of means; s_x̄² = Σ(x̄ᵢ−x̄̄)²/(k−1) → 3) between = **n·s_x̄²** → 4) within = s_p² = (Σsᵢ²)/k → 5) **F = n·s_x̄²/s_p²** → 6) df = (k−1, k(n−1)) → 7) right-tail F table → 8) decide + sentence.

---

## C. TABLE-LOOKUP HOW-TOS

**z (Table A-2):** gives area to the LEFT of z. P(Z < −1.25) = 0.1056. Right-tail: 1 − Φ(z). Two-tail P-value: double one tail. Common criticals: 1.645 / 1.96 / 2.33 / 2.575.

**t:** row = df, column = one-tail area. 95% CI or two-tail α = 0.05 → column 0.025. One-tail α = 0.05 → column 0.05. Left-tail critical = negative of table value. Memorize feel: t(0.05,14) = 1.761; t(0.025,9) = 2.262; t(0.005,9) = 3.250.

**χ²:** row = df, column = area to the RIGHT. Right-tail α = 0.05, df 4 → 9.488. LEFT-tail α = 0.05 → use column 0.95 (e.g., df 19 → 10.117). Two-tail → columns α/2 and 1−α/2 (df 29, α=0.01 → 13.121 and 52.336).

**F:** separate page per α. Column = numerator df (df₁), row = denominator df (df₂). ANOVA df₁ = k−1, df₂ = k(n−1). Two-variance two-tail test → page α/2; force right-tail by putting bigger s² on top. Examples: F(0.05;2,21) = 3.467; F(0.05;3,16) = 3.239; F(0.01;2,12) = 6.927.

---

## D. THE 7-STEP HYPOTHESIS-TESTING TEMPLATE (apply mechanically to EVERY test)

> 1. **Parameter & claim.** "Let μ = mean ... . Claim: μ > 210."
> 2. **H₀ (with =) and H₁ (<, >, ≠)** → tail type.
> 3. **α** (from the question) and **test choice** (decision tree A).
> 4. **Critical value(s)** from the table (correct df, correct tail). Sketch + shade.
> 5. **Compute the test statistic** (3 d.p., show substitution line).
> 6. **Decision:** statistic in rejection region → "Reject H₀"; else "Fail to reject H₀". (Or compare P-value ≤ α.)
> 7. **Conclusion sentence in context:** "At α = 0.05, there is / is not sufficient evidence that [claim in words]."

### Conclusion sentence bank (copy these)
- CI: "We are 95% confident that the true [mean/proportion of ...] lies between [L] and [U]."
- Reject: "There is sufficient evidence at α = ... to conclude that [H₁ in context]."
- Fail to reject: "There is insufficient evidence at α = ... to conclude that [H₁]." (NEVER "H₀ is true/accepted".)
- Chi-square independence reject: "There is evidence of a relationship between [A] and [B]." (relationship ≠ causation)
- ANOVA reject: "At least one [group] mean differs significantly."
- R²: "[x]% of the variation in [y] is explained by the variation in [x-var]."

### Type I / II one-liner
Type I = reject a TRUE H₀ (prob α). Type II = fail to reject a FALSE H₀ (prob β).

---

## E. EXAM-DAY MICRO-CHECKLIST
1. 3 decimal points everywhere (cover-page rule).
2. √n not n in every standard error.
3. Paired data? → D column FIRST; keep one direction.
4. Welch ν: round DOWN. Sample size n: round UP.
5. χ² and F: right-tailed by default; only the variance χ² test can be left/two-tailed.
6. Bigger s² on top in F-test; α/2 if two-tailed.
7. df: t(n−1) | pooled(n₁+n₂−2) | r & slope(n−2) | GOF(k−1) | indep((r−1)(c−1)) | ANOVA(k−1, k(n−1)).
8. Write the interpretation sentence — every time, even if rushed.
9. Sketch = free marks (scatter, rejection region).
10. The formula list is at the back of the paper. Breathe, select, substitute.

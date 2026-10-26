# CH 5.2 — Hypothesis Testing, One Sample (Mastery)

> Source: `[2021] Chapter 5 (Part 2) Hypothesis Testing 1 Sample.pdf` + past finals.
> Exam weight: ~3–10 marks inside Q1/Q2 nearly every year (z-test on mean, t-test on mean, or χ² test on variance). The χ² variance test appeared in 4 of 8 cataloged papers — everyone forgets it; you won't.

---

## 1. WHY this exists (first principles)

Estimation (5.1) answers "what is the value?" Hypothesis testing answers a different business question: **"is this claim about the population believable, given my sample?"**

A stock analyst claims sector returns average more than 8%. You can't audit every stock. You sample 60, get x̄ = 9.2%. Is 9.2 "convincingly above 8", or just sampling luck? Hypothesis testing converts that into a court trial:

- **H₀ (null)**: the boring default — "nothing special, parameter = claimed value" (μ = 8). Innocent until proven guilty.
- **H₁ (alternative)**: what needs evidence (μ > 8).
- We measure how extreme our sample is **assuming H₀ is true**. If it's too extreme to be luck (beyond the critical value, or P-value ≤ α), we **reject H₀**. Otherwise we **fail to reject H₀** — we never "accept" or "prove" H₀.

**Data-analytics scenario:** your pipeline's latency SLA says σ ≤ some value; a model's conversion claim says p = 0.5; a sensor calibration says μ = 3 inches. Every monitoring alert you'll ever build is a hypothesis test with a threshold.

---

## 2. Core concepts in dependency order (his 4-step frame)

His slides hammer this structure — use it as your answer skeleton **every time**:

1. **Hypothesis statement** — H₀ always uses "=" (his slides: "the symbolic form of the null hypothesis is =". H₁ uses ≠, <, or >.
2. **Test statistic** — a standardized distance between sample and H₀.
3. **Significance level α** — probability of rejecting a true H₀ (Type I error). Common: 0.01, 0.05, 0.10.
4. **Decision rule + conclusion** — critical-region method or P-value method, then a sentence in context.

### Tail type (drives everything)
| H₁ | Test type | Rejection region |
|---|---|---|
| μ ≠ μ₀ | two-tailed | both tails, α/2 each |
| μ < μ₀ | left-tailed | left tail, area α |
| μ > μ₀ | right-tailed | right tail, area α |

### Decision criteria (two equivalent methods)
- **Critical region method** (most used in his marking schemes): reject H₀ if test statistic falls in the rejection region.
- **P-value method**: P-value = probability of a result at least this extreme if H₀ true. Reject if P-value ≤ α. Two-tailed: double the one-tail area.

### Type I / Type II errors (asked conceptually)
| | H₀ true | H₀ false |
|---|---|---|
| Reject H₀ | **Type I error (prob = α)** | correct |
| Fail to reject H₀ | correct | **Type II error (prob = β)** |

Memory hook: Type I = false alarm; Type II = missed detection.

---

## 3. The three one-sample tests + WHY + when

### 3.1 Test on a MEAN, σ known (or n > 30) → z
$$z_0 = \frac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}$$
WHY: with σ known the sampling distribution of x̄ is exactly normal with SD σ/√n; z measures "how many standard errors away from the claim".

### 3.2 Test on a MEAN, σ unknown and n ≤ 30 → t
$$t_0 = \frac{\bar{x}-\mu_0}{s/\sqrt{n}} \qquad df = n-1$$
WHY t: s is an estimate → extra noise → fatter tails. (His convention: if σ unknown but n > 30, use z with s.)

### 3.3 Test on a VARIANCE / STANDARD DEVIATION → χ²
$$\chi^2_0 = \frac{(n-1)s^2}{\sigma_0^2} \qquad df = n-1$$
WHY: under normality, (n−1)s²/σ² follows a chi-square distribution. Note the χ² distribution is **not symmetric** and starts at 0:
- Right-tailed test (H₁: σ > σ₀): reject if χ²₀ > χ²(α, n−1).
- Left-tailed test (H₁: σ < σ₀): reject if χ²₀ < χ²(1−α, n−1) — i.e., look up the **right-tail area 1−α** column. (His slide: "if it's left-tail 5%, use the number for right-tail 95%.")
- Two-tailed: reject if χ²₀ < χ²(1−α/2) or χ²₀ > χ²(α/2).

### One-sample test on a PROPORTION → z (in slides; rare in finals)
$$z_0 = \frac{\hat{p}-p_0}{\sqrt{\dfrac{p_0 q_0}{n}}}$$
WHY p₀q₀ (not p̂q̂): the test assumes H₀ true, so the SE is computed at the claimed p₀. (Appeared as the ketchup 2-period question 2018/19 in two-sample form.)

### One-sample decision tree
```
Claim about...
├── mean μ:  σ known or n>30 → z | σ unknown & n≤30 → t(n−1)
├── variance σ² / SD σ      → χ² = (n−1)s²/σ₀², df = n−1
└── proportion p            → z with SE = √(p₀q₀/n)
```

---

## 4. Fully worked examples — exact past-final style

### 4A. z-test on mean (2023/24 Q1b — 3 marks)
*"Analyst tests if mean stock return > 8%. n = 60, x̄ = 9.2%, σ = 3.5%, α = 0.05."*

1. **Hypotheses:** H₀: μ = 8 vs H₁: μ > 8 (right-tailed — "greater than").
2. **Test statistic** (σ known → z):
$$z_0 = \frac{9.2-8}{3.5/\sqrt{60}} = \frac{1.2}{0.4518} = 2.656$$
3. **Critical value:** right tail, α = 0.05 → z₀.₀₅ = 1.645.
4. **Decision:** 2.656 > 1.645 → test statistic is in the rejection region → **reject H₀**. (P-value = P(Z > 2.656) = 0.004 ≤ 0.05, same verdict.)
5. **Conclusion sentence:** "At α = 0.05 there is sufficient evidence that the mean return of this sector is greater than 8%."

### 4B. t-test on mean (2016/17 Q2b — 10 marks)
*"Test that average content of containers is 10 liters. Data (n = 10): 10.2, 9.7, 10.1, 10.3, 10.1, 9.8, 9.9, 10.4, 10.3, 9.8. α = 0.01, contents normal."*

1. H₀: μ = 10 vs H₁: μ ≠ 10 (two-tailed — "is 10 liters" challenged in either direction).
2. σ unknown, n = 10 ≤ 30 → t, df = 9.
3. Compute: Σx = 100.6 → x̄ = 10.060; s = 0.246.
4. $t_0 = \dfrac{10.060-10}{0.246/\sqrt{10}} = \dfrac{0.060}{0.0778} = 0.772$
5. Critical values: two-tailed α = 0.01 → α/2 = 0.005 each tail → t₀.₀₀₅,₉ = **3.250**. Reject if t₀ > 3.250 or t₀ < −3.250.
6. Decision: −3.250 < 0.772 < 3.250 → **fail to reject H₀**. "There is insufficient evidence at α = 0.01 to conclude the mean content differs from 10 liters."

### 4C. χ² test on variance (2022/23 Q1b — ~6 marks, his exact subparts)
*"30 staff sampled; time drinking coffee normal; s = 6 hours. At α = 0.01, is there enough evidence to reject the claim that the population variance is 35?"*

i) **Hypotheses:** H₀: σ² = 35 vs H₁: σ² ≠ 35 (two-tailed — "reject the claim that variance IS 35").
ii) **Test statistic:**
$$\chi^2_0 = \frac{(n-1)s^2}{\sigma_0^2} = \frac{29 \times 36}{35} = 29.829$$
iii) **Critical values:** df = 29, α/2 = 0.005 each side → lower χ²₀.₉₉₅,₂₉ = 13.121, upper χ²₀.₀₀₅,₂₉ = 52.336.
iv) **Sketch:** right-skewed curve, shade below 13.121 and above 52.336. Since 13.121 < 29.829 < 52.336 → **fail to reject H₀**: "insufficient evidence at α = 0.01 to reject the claim that the variance is 35 hours²."

---

## 5. Top 5 traps

1. **H₀ written with an inequality.** His slides are strict: H₀ uses "=" (e.g., H₀: μ = 8000 even when the worry is "less than"). H₁ carries <, >, ≠. Also illegitimate: hypotheses about statistics (H₀: x̄ = 4 is WRONG — hypotheses are about parameters μ, p, σ).
2. **Tail direction flipped.** "less than" → left tail → negative critical value; "increase/greater/more than" → right tail. Match the sign of your critical value to the tail.
3. **Variance vs SD confusion in χ² test.** If the claim gives σ (SD), square it for σ₀². If it gives variance, use it directly. (2022/23: "variance is at 35" → σ₀² = 35, don't square again.)
4. **χ² left-tail lookup.** Tables list right-tail areas. For left-tail α = 0.05 with df = 8 you need the column 0.95 → 2.733 (his police-response example). Failing this loses the whole conclusion.
5. **Concluding "accept H₀" / proving the null.** Write "fail to reject H₀ — insufficient evidence that ...". Marking schemes use this exact phrasing.

Bonus trap: **forgetting the context sentence.** Decision ("reject H₀") + interpretation ("there is sufficient evidence that mean > 210 sec") are TWO separate marks.

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | Signal |
|---|---|
| "Is there any reason to believe that μ < ...?" | one-sample mean test, left-tailed |
| "test the claim that the sample is from a population with mean greater than..." | right-tailed mean test |
| "Use a 0.05 significance level" / "at α = 0.01" | your α; find critical value before computing |
| "population standard deviation is / known σ" | z-test |
| "sample standard deviation", n ≤ 30, "assume normal" | t-test, df = n−1 |
| "test whether the true average ... is 58000" | two-tailed |
| "claims that the standard deviation ... is less than" | χ² test, left tail |
| "is there enough evidence to reject the claim that the population variance is..." | χ² test (check tail from wording; "is 35" → two-tailed) |
| "State the null and alternative hypothesis" | 1 mark: H₀ with =, H₁ with </> /≠ |
| "Find the critical value" | table lookup with correct α, tail, df |
| "Draw and shade the critical region" | sketch distribution + shade rejection area + mark CV |
| "What can you conclude from the test" | decision + sentence in context |
| "Interpret and proof his assumption with statistic" (2023/24 wording) | full 4-step hypothesis test |

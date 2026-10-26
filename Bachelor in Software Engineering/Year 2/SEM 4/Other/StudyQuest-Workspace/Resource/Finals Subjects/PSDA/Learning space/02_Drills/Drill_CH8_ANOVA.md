# Drill — CH8: One-Way ANOVA (6 problems)

> Modeled on the final question of every past paper (15–20 marks). Ramp: P1 lookups, P2 small raw-data, P3 summary stats, P4–P5 full exam scale, P6 theory. Answers: `Drill_CH8_ANOVA_ANSWERS.md`.

---

**P1 (degrees of freedom + F lookups — warm-up).**
For each design, give the numerator df, denominator df, and the critical F at the stated α:
(i) k = 3 groups, n = 5 per group, α = 0.05.
(ii) k = 4 groups, n = 6 per group, α = 0.05.
(iii) k = 3 groups, n = 8 per group, α = 0.01.
(iv) Why is the ANOVA F-test always right-tailed? (6 m)

**P2 (small raw data).**
Units produced per hour by machines A, B, C (4 runs each):

| A | 12 | 14 | 11 | 13 |
|---|---|---|---|---|
| **B** | 15 | 17 | 16 | 18 |
| **C** | 10 | 9 | 12 | 11 |

Test at α = 0.05 whether the machines have the same mean output. (10 m)

**P3 (summary statistics — style of 2018/19 Q5 / 2015/16 Q5).**
Four brands of SSD are tested in five servers each. Preliminary analysis indicates normal populations with equal standard deviations.

| Brand | n | Mean (TBW) | SD |
|---|---|---|---|
| A | 5 | 33.6 | 6.43 |
| B | 5 | 30.8 | 3.56 |
| C | 5 | 29.8 | 4.71 |
| D | 5 | 28.6 | 6.80 |

At the 5% significance level, does there appear to be a difference in mean endurance among the four brands? (12 m)

**P4 (raw data, 3 × 5, α = 0.01 — style of 2022/23 Q6 mice).**
Onboarding completion times (minutes) for three tutorial designs, 5 random users each:

| Design Red | 78 | 85 | 82 | 88 | 80 |
|---|---|---|---|---|---|
| **Design Green** | 72 | 70 | 75 | 68 | 74 |
| **Design Blue** | 85 | 90 | 88 | 92 | 86 |

(a) Find x̄ and s for each design. (6 m)
(b) Calculate the test statistic F. (10 m)
(c) At the 0.01 level of significance, do the designs differ in mean completion time? (4 m)

**P5 (raw data, 4 × 6 — style of 2021/22 Q6, full 20-marker).**
Mean response times (ms) for four server configurations, 6 load tests each:

| Config 1 | 210 | 225 | 218 | 232 | 205 | 221 |
|---|---|---|---|---|---|---|
| **Config 2** | 195 | 188 | 202 | 191 | 199 | 185 |
| **Config 3** | 240 | 252 | 238 | 247 | 255 | 242 |
| **Config 4** | 212 | 208 | 219 | 205 | 216 | 214 |

Perform the analysis of variance at the 0.05 level of significance and indicate whether the configurations differ significantly. (20 m)

**P6 (theory — short answers, the kind worth easy marks).**
(i) State the three assumptions of one-way ANOVA. (3 m)
(ii) Why do we not simply run a t-test on every pair of groups? (2 m)
(iii) If H₀ is rejected, can you tell WHICH mean differs? (1 m)
(iv) Your F₀ = 0.94. Without a table, what do you expect the decision to be, and why? (2 m)

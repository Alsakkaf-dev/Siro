# CH 6 — Chi-Square Test & Contingency Analysis (Mastery)

> Source: `[2021] Chapter 6 ChiSquare Test _ Contingency.pdf` + past finals.
> Exam weight: Question 3, 20 marks, EVERY year in the modern format. Always two parts: (a) goodness-of-fit, (b) test of independence. Appeared in 8/8 papers in some form.

---

## 1. WHY this exists (first principles)

Chapters 5's tests handle **numeric** data (means, variances). But a huge share of real data is **categorical**: which day a ticket arrived, which blood group, which plan a customer is on, churned vs stayed. You can't average "Monday". What you CAN do is **count** how many observations land in each category and ask:

- **Goodness-of-fit (one variable):** do my observed counts match a claimed distribution? ("Are support calls equal across all 7 days?" / "Is the M&M color mix really 30% brown, 20% yellow...?")
- **Test of independence (two variables):** are two categorical variables related? ("Does churn depend on subscription plan?" / "Is internet usage related to age group?")

The engine for both is the same beautiful idea: compute what the counts **should be if the claim were true** (expected counts E), then measure the total mismatch with observed counts O:

$$\chi^2 = \sum\frac{(O-E)^2}{E}$$

Small χ² → observed ≈ expected → claim is fine. Big χ² → too much mismatch to be luck → reject. Squaring makes every deviation positive (that's why the test is **always right-tailed**); dividing by E makes the mismatch relative (being off by 10 matters more when you expected 20 than when you expected 2000).

**Data-analytics scenario:** A/B/n experiment bucketing checks (are users split evenly across variants?), churn-vs-segment analysis, fraud-rule monitoring (does fraud rate depend on region?).

---

## 2. Core concepts in dependency order

1. **Multinomial experiment**: fixed n trials, independent, each trial lands in exactly one of k categories, constant probabilities. (His slides list these 4 conditions; worth 1–2 theory marks.)
2. **Observed count O** vs **expected count E**.
3. **Goodness-of-fit, equal frequencies**: E = n/k for every category.
4. **Goodness-of-fit, unequal frequencies**: E = n·p for each category's claimed proportion p.
5. **Two-way contingency table**: rows = levels of variable 1, columns = levels of variable 2.
6. **Expected count under independence**:
$$e_{ij}=\frac{(\text{row}_i\text{ total})\times(\text{col}_j\text{ total})}{\text{grand total}}$$
WHY: independence means P(row i AND col j) = P(row i)·P(col j); multiply joint probability by n.
7. **Degrees of freedom**: GOF → df = k − 1 (the counts must sum to n, killing one freedom). Independence → df = (r−1)(c−1) (row and column totals are fixed).
8. **Assumption check**: all expected counts ≥ 5 (state "e_ij ≥ 5 in all cells ✓" — it's in his marking scheme).

---

## 3. The two tests, side by side

| | Goodness-of-fit | Independence |
|---|---|---|
| Variables | 1 categorical, k levels | 2 categorical |
| H₀ | p₁ = p₂ = ... = p_k (equal) or "p's as claimed" | variables are independent / not related |
| H₁ | at least one proportion differs | variables are related (dependent) |
| E | n/k or n·pᵢ | (row total)(col total)/n |
| df | k − 1 | (r−1)(c−1) |
| Tail | always RIGHT | always RIGHT |
| Statistic | Σ(O−E)²/E | Σ(O−E)²/E |

---

## 4. Fully worked examples — exact past-final style (2023/24 Q3, 20 marks)

### 4A. Goodness-of-fit, equal frequencies (8 marks)
*"Reservations per weekday: Mon 30, Tue 25, Wed 35, Thu 28, Fri 40. Is the distribution uniform across weekdays? α = 0.05."*

**(i) Hypotheses (1m).**
H₀: p₁ = p₂ = p₃ = p₄ = p₅ = 1/5 (reservations equally distributed)
H₁: at least one proportion is different.

**(ii) Expected frequency and test statistic (4m).**
n = 30+25+35+28+40 = 158. E = n/k = 158/5 = **31.6** for every day.

| Day | O | E | (O−E)²/E |
|---|---|---|---|
| Mon | 30 | 31.6 | 0.081 |
| Tue | 25 | 31.6 | 1.379 |
| Wed | 35 | 31.6 | 0.366 |
| Thu | 28 | 31.6 | 0.410 |
| Fri | 40 | 31.6 | 2.233 |

$$\chi^2_0 = 0.081+1.379+0.366+0.410+2.233 = 4.468$$

**(iii) Critical value & conclusion (3m).** df = k − 1 = 4; χ²(0.05, 4) = **9.488** (chi-square table: row df=4, column 0.05). Since 4.468 < 9.488, the statistic is NOT in the rejection region → **fail to reject H₀**. "At α = 0.05, the data do not contradict the claim that reservations are equally distributed across the weekdays."

### 4B. Test of independence (12 marks)
*"159 adults: Internet usage (Never/Sometimes/Every day) × Age (25–64, 65+). Related at α = 0.01?"*

| Observed | 25–64 | 65+ | Row total |
|---|---|---|---|
| Never | 38 | 31 | 69 |
| Sometimes | 31 | 4 | 35 |
| Every day | 50 | 5 | 55 |
| **Col total** | **119** | **40** | **159** |

**(i) Hypotheses (2m).** H₀: age and internet usage are independent (no relationship). H₁: age and internet usage are related.

**(ii) Expected counts + statistic (7m).** e₁₁ = 69×119/159 = 51.642; e₁₂ = 69×40/159 = 17.358; e₂₁ = 35×119/159 = 26.195; e₂₂ = 35×40/159 = 8.805; e₃₁ = 55×119/159 = 41.164; e₃₂ = 55×40/159 = 13.836. (All ≥ 5 ✓)

| Cell | O | E | (O−E)²/E |
|---|---|---|---|
| Never, 25–64 | 38 | 51.642 | 3.604 |
| Never, 65+ | 31 | 17.358 | 10.722 |
| Sometimes, 25–64 | 31 | 26.195 | 0.881 |
| Sometimes, 65+ | 4 | 8.805 | 2.622 |
| Every day, 25–64 | 50 | 41.164 | 1.897 |
| Every day, 65+ | 5 | 13.836 | 5.642 |

$$\chi^2_0 = 25.368$$

**(iii) Decision at α = 0.01 (3m).** df = (3−1)(2−1) = 2; χ²(0.01, 2) = **9.210**. Since 25.368 > 9.210 → **reject H₀**. "At the 1% level there is sufficient evidence that a relationship exists between age and internet usage."

### 4C. GOF with UNEQUAL claimed proportions (2016/17 Q4a — 10 marks)
*"Blood groups claimed: O 44%, A 45%, B 8%, AB 3%. Sample of 187 donors: O 67, A 83, B 29, AB 8. Test at 95% confidence."*

H₀: p_O = 0.44, p_A = 0.45, p_B = 0.08, p_AB = 0.03 vs H₁: at least one differs.
E = n·p: E_O = 187(0.44) = 82.28; E_A = 187(0.45) = 84.15; E_B = 187(0.08) = 14.96; E_AB = 187(0.03) = 5.61.
Contributions: (67−82.28)²/82.28 = 2.838; (83−84.15)²/84.15 = 0.016; (29−14.96)²/14.96 = 13.177; (8−5.61)²/5.61 = 1.018.
χ²₀ = **17.048**; df = 3, χ²(0.05,3) = 7.815. 17.048 > 7.815 → reject H₀: the donor distribution differs from the claimed one (group B is hugely over-represented — its contribution 13.18 dominates).

---

## 5. Top 5 traps

1. **df confusion.** GOF: df = k − 1 (categories minus 1, NOT n − 1). Independence: df = (r−1)(c−1) — a 3×2 table has df = 2, not 5.
2. **Expected counts from observed proportions.** E comes from the CLAIM (n/k or n·p_claimed) or from row×col/n — never from "what looks close to O". And check Σ E = n as a sanity check.
3. **Using percentages as counts.** 2016/17 Q4b gave a table of percentages — convert thinking carefully; χ² needs COUNTS. If the row is "% within subject", the test statistic must still be computed on counts (the exam's table was effectively counts; just don't divide by 100 mid-way).
4. **Two-tailed thinking.** χ² GOF/independence tests are ALWAYS right-tailed — the squaring already counts deviations in both directions. Never halve α here.
5. **Conclusion without context.** "Reject H₀" alone loses the last mark. Add: "...there is evidence of a relationship between [var 1] and [var 2]" or "...the distribution is not uniform". Also remember independence ≠ no causality — his slides stress "does not show causality."

Bonus: when the raw data arrives as a LIST (2022/23 jogging question gives count rows), first **construct the contingency table** — that step alone was 2 marks.

---

## 6. Exam translator — phrase → procedure

| Phrase in his past papers | Signal |
|---|---|
| "equally distributed throughout the week" / "uniform across weekdays" / "same for each quarter" | GOF, E = n/k |
| "occur with equal proportions" | GOF equal |
| "distributed with the color percentages of ..." / "Theory predicts ... 56%, 19%, ..." | GOF unequal, E = n·p |
| "is there a preference for one of these types" | GOF equal |
| "test the claim that ... is independent of ..." | independence test |
| "whether there is relationship between X and Y" (categorical) | independence test |
| "do male and female inmates differ with respect to type of offense" | independence/homogeneity — same mechanics |
| "Construct the two-way contingency table" | build O table from listed counts first (marks!) |
| "test whether there is homogeneity among the shops" | same χ² independence mechanics |
| "Calculate the expected count and the test statistic" | show e_ij formula + full (O−E)²/E table |
| "faces a gender gap" (2021/22 president poll) | independence: gender × opinion |
| "If the resulting χ² value were 16, what conclusion..." | pure table lookup + compare: find χ²(α, k−1), compare, conclude |

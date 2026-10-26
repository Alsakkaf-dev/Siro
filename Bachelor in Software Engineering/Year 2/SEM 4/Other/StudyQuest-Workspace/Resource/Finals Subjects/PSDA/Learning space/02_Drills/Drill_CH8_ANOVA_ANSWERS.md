# ANSWERS — Drill CH8: One-Way ANOVA

---

## P1 — df and lookups

(i) df₁ = k−1 = 2; df₂ = k(n−1) = 3(4) = 12; F(0.05; 2, 12) = **3.885**.
(ii) df₁ = 3; df₂ = 4(5) = 20; F(0.05; 3, 20) = **3.098**.
(iii) df₁ = 2; df₂ = 3(7) = 21; F(0.01; 2, 21) = **5.780**.
(iv) Because F is a ratio of variances: if some mean differs, the between-group variance INFLATES, pushing F upward — only large F values are evidence against H₀. (Deviations in any direction increase, never decrease, the between-group variance.)

---

## P2 — Machines (3 × 4)

1. H₀: μ_A = μ_B = μ_C vs H₁: at least one mean differs.
2. Group stats: x̄_A = 12.5, s_A = 1.291; x̄_B = 16.5, s_B = 1.291; x̄_C = 10.5, s_C = 1.291. (Each s² = 1.667.)
3. Between: grand mean of means x̄̄ = (12.5+16.5+10.5)/3 = 13.167.
   s_x̄² = [(12.5−13.167)² + (16.5−13.167)² + (10.5−13.167)²]/2 = [0.444 + 11.111 + 7.111]/2 = 9.333.
   n·s_x̄² = 4 × 9.333 = **37.333**.
4. Within: s_p² = (1.667+1.667+1.667)/3 = **1.667**.
5. F₀ = 37.333/1.667 = **22.400**.
6. df = (2, 9); F(0.05; 2, 9) = **4.256**.
7. 22.400 > 4.256 → **reject H₀**: the machines do NOT have the same mean output (B clearly produces more, but ANOVA itself only says "not all equal").

---

## P3 — SSD brands (summary stats)

1. H₀: μ_A = μ_B = μ_C = μ_D vs H₁: at least one differs.
2. (Given.)
3. Between: x̄̄ = (33.6+30.8+29.8+28.6)/4 = 30.7.
   s_x̄² = [(33.6−30.7)² + (30.8−30.7)² + (29.8−30.7)² + (28.6−30.7)²]/3 = [8.41 + 0.01 + 0.81 + 4.41]/3 = 13.64/3 = 4.547.
   n·s_x̄² = 5 × 4.547 = **22.733**.
4. Within: s_p² = (6.43² + 3.56² + 4.71² + 6.80²)/4 = (41.345 + 12.674 + 22.184 + 46.24)/4 = 122.443/4 = **30.611**.
5. F₀ = 22.733/30.611 = **0.743**.
6. df = (3, 16); F(0.05; 3, 16) = **3.239**.
7. 0.743 < 3.239 → **fail to reject H₀**: no significant difference in mean endurance among the four brands. (F < 1 means groups differ LESS than their internal noise predicts.)

---

## P4 — Tutorial designs (3 × 5, α = 0.01)

**(a)**
Red: x̄₁ = (78+85+82+88+80)/5 = 413/5 = **82.6**; s₁ = **3.975** (s₁² = 15.8).
Green: x̄₂ = 359/5 = **71.8**; s₂ = **2.864** (s₂² = 8.2).
Blue: x̄₃ = 441/5 = **88.2**; s₃ = **2.864** (s₃² = 8.2).

**(b)**
x̄̄ = (82.6+71.8+88.2)/3 = 242.6/3 = 80.867.
s_x̄² = [(82.6−80.867)² + (71.8−80.867)² + (88.2−80.867)²]/2 = [3.004 + 82.210 + 53.773]/2 = 138.987/2 = 69.493.
Between: n·s_x̄² = 5 × 69.493 = **347.467**.
Within: s_p² = (15.8 + 8.2 + 8.2)/3 = 32.2/3 = **10.733**.
$$F_0 = \frac{347.467}{10.733} = \mathbf{32.373}$$

**(c)** df = (k−1, k(n−1)) = (2, 12); F(0.01; 2, 12) = **6.927**.
32.373 > 6.927 → **reject H₀** at the 1% level: the designs differ significantly in mean completion time (Green is fastest on its face — but formally ANOVA only establishes "not all equal").

---

## P5 — Server configs (4 × 6, 20-marker)

1. H₀: μ₁ = μ₂ = μ₃ = μ₄ vs H₁: at least one config's mean response differs. α = 0.05.

2. Group statistics:

| Config | Σx | x̄ | s | s² |
|---|---|---|---|---|
| 1 | 1311 | 218.500 | 9.854 | 97.100 |
| 2 | 1160 | 193.333 | 6.532 | 42.667 |
| 3 | 1474 | 245.667 | 6.831 | 46.667 |
| 4 | 1274 | 212.333 | 5.164 | 26.667 |

3. Between: x̄̄ = (218.500+193.333+245.667+212.333)/4 = 869.833/4 = 217.458.
   Deviations²: (1.042)² = 1.085; (−24.125)² = 582.016; (28.208)² = 795.709; (−5.125)² = 26.266. Sum = 1405.076.
   s_x̄² = 1405.076/3 = 468.359. → n·s_x̄² = 6 × 468.359 = **2810.153**.
4. Within: s_p² = (97.100+42.667+46.667+26.667)/4 = 213.100/4 = **53.275**.
5. F₀ = 2810.153/53.275 = **52.748**.
6. df = (3, 20); F(0.05; 3, 20) = **3.098**.
7. 52.748 > 3.098 → **reject H₀**: at α = 0.05 the server configurations differ significantly in mean response time.

---

## P6 — Theory

(i) Populations are (approximately) normally distributed; population variances are equal; samples are random and independent of each other.
(ii) Multiple pairwise t-tests inflate the overall Type I error (e.g., 6 tests at α = 0.05 each give a much larger family-wise false-alarm probability ≈ 26%); ANOVA tests all means simultaneously at one α.
(iii) No — ANOVA only concludes that at least one mean differs; identifying which one requires follow-up (post-hoc) comparisons (not in this syllabus).
(iv) Fail to reject H₀. Critical F values for any reasonable α and df are > 1; an F₀ below 1 means between-group variation is even smaller than within-group noise — no evidence of any mean difference.

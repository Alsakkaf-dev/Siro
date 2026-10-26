# ANSWERS — Drill CH7: Correlation & Regression

---

## P1 — Pearson r (warm-up)

**(i)** Σx = 26, Σy = 353, Σx² = 158, Σy² = 25,565, Σxy = 1,956. (n = 5)

**(ii)**
Numerator: Σxy − (Σx)(Σy)/n = 1956 − (26)(353)/5 = 1956 − 1835.6 = 120.4
Denominator: √[(158 − 26²/5)(25565 − 353²/5)] = √[(158 − 135.2)(25565 − 24921.8)] = √[(22.8)(643.2)] = √14664.96 = 121.099
r = 120.4/121.099 = **0.994**.
Very strong positive linear relationship — more hours studied is associated with higher quiz scores.

---

## P2 — Pearson r, n = 8

**(i)** Both variables are numeric, measured at the ratio level (RM amounts) → **Pearson** product-moment correlation. (Spearman would be for ranked/ordinal data.)

**(ii)** Σx = 44, Σy = 123, Σx² = 284, Σy² = 2,003, Σxy = 744. (n = 8)
Numerator: 744 − (44)(123)/8 = 744 − 676.5 = 67.5
Denominator: √[(284 − 44²/8)(2003 − 123²/8)] = √[(284 − 242)(2003 − 1891.125)] = √[(42)(111.875)] = √4698.75 = 68.547
r = 67.5/68.547 = **0.985**.

**(iii)** Very strong positive linear relationship: weeks with higher ad spend have higher sales. (Note: correlation does not prove the ads CAUSE the sales.)

---

## P3 — Spearman

**(i)** Rank usage, 1 = highest (7.30 → 1, 7.00 → 2, 6.83 → 3, 6.50 → 4, 5.73 → 5, 5.60 → 6, 5.20 → 7, 4.90 → 8):

| Feature | Manager rank x | Usage rank y | d = y − x | d² |
|---|---|---|---|---|
| A | 5 | 8 | 3 | 9 |
| B | 1 | 2 | 1 | 1 |
| C | 7 | 6 | −1 | 1 |
| D | 2 | 1 | −1 | 1 |
| E | 8 | 7 | −1 | 1 |
| F | 6 | 5 | −1 | 1 |
| G | 4 | 3 | −1 | 1 |
| H | 3 | 4 | 1 | 1 |
| | | | Σd² = | **16** |

$$r_s = 1 - \frac{6\sum d^2}{n(n^2-1)} = 1 - \frac{6(16)}{8(64-1)} = 1 - \frac{96}{504} = 1 - 0.190 = \mathbf{0.810}$$

**(ii)** r_s = 0.810 → strong positive rank agreement: features the manager ranks as more important do tend to have higher real usage. The intuition is largely correct (main miss: feature A).

---

## P4 — Significance of correlation

**(i)** H₀: ρ = 0 vs H₁: ρ ≠ 0; df = n − 2 = 10.
$$t_0 = \frac{r}{\sqrt{\frac{1-r^2}{n-2}}} = \frac{0.72}{\sqrt{\frac{1-0.5184}{10}}} = \frac{0.72}{\sqrt{0.04816}} = \frac{0.72}{0.21945} = \mathbf{3.281}$$
Critical t(0.025, 10) = 2.228. Since 3.281 > 2.228 → **reject H₀**: significant linear correlation exists at the 95% level.

**(ii)** At 99%: t(0.005, 10) = 3.169. Since 3.281 > 3.169 → still **reject H₀** — the decision does not change (but it is much closer; the margin shrinks from 1.05 to 0.11).

---

## P5 — Regression line

**(i)** Σx = 44, Σy = 34.5, Σx² = 370, Σy² = 183.47, Σxy = 251.1. (n = 7)

**(ii)**
$$b_1 = \frac{251.1 - \frac{(44)(34.5)}{7}}{370 - \frac{44^2}{7}} = \frac{251.1 - 216.857}{370 - 276.571} = \frac{34.243}{93.429} = 0.367$$
x̄ = 44/7 = 6.286; ȳ = 34.5/7 = 4.929.
$$b_0 = \bar{y} - b_1\bar{x} = 4.929 - 0.367(6.286) = 4.929 - 2.304 = 2.625$$
$$\boxed{\hat{y} = 2.625 + 0.367x}$$
(Interpretation: each extra year of experience adds ≈ RM 367/month; b₀ = entry-level baseline ≈ RM 2,625.)

**(iii)** ŷ(7) = 2.625 + 0.367(7) = 2.625 + 2.566 = **5.190** → ≈ RM 5,190/month.
(Full-precision b₁ = 0.36651 gives 5.190 as well — keep ≥ 4 decimals mid-way.)

---

## P6 — Prediction + extrapolation

**(i)** ŷ(25) = −35.857 + 8.018(25) = −35.857 + 200.446 = **164.589 ≈ 165 units**.

**(ii)** 40°C is far OUTSIDE the observed x range (18–30°C). The linear pattern is only supported within that range — beyond it the relationship may flatten or change (extrapolation). So the prediction ŷ(40) ≈ 285 would be unreliable and should not be used.

---

## P7 — R²

**(i)** SSR = SST − SSE = 13.434 − 0.884 = **12.550** (full precision 12.551).
R² = SSR/SST = 12.550/13.434 = **0.934**.

**(ii)** "About **93.4% of the variation in monthly salary is explained by the variation in years of experience**; the remaining 6.6% is due to other factors." (Check: r = √0.934 = 0.967, consistent with the strong r from this data.)

---

## P8 — Slope t-test

H₀: β₁ = 0 (no linear relationship) vs H₁: β₁ ≠ 0.
$$t_0 = \frac{b_1 - 0}{s_{b_1}} = \frac{8.018}{0.144} = \mathbf{55.68}$$
df = n − 2 = 5; critical t(0.025, 5) = 2.571.
55.68 > 2.571 → **reject H₀**: temperature has a statistically significant effect on iced-drink sales at the 95% confidence level.
(Computed from raw data t₀ = 55.52 — small difference comes from rounding s_b1; both accepted.)

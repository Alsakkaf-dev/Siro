# ANSWERS — Drill CH6: Chi-Square Tests

---

## P1 — GOF equal (help desk)

**(i)** H₀: p₁ = p₂ = p₃ = p₄ = p₅ = 1/5 (tickets equally distributed). H₁: at least one proportion differs.

**(ii)** n = 52+44+38+41+55 = 230 → E = 230/5 = **46** per day.

| Day | O | E | (O−E)²/E |
|---|---|---|---|
| Mon | 52 | 46 | 0.783 |
| Tue | 44 | 46 | 0.087 |
| Wed | 38 | 46 | 1.391 |
| Thu | 41 | 46 | 0.543 |
| Fri | 55 | 46 | 1.761 |

χ²₀ = **4.565**.

**(iii)** df = 5 − 1 = 4; χ²(0.05, 4) = **9.488**. Since 4.565 < 9.488 → **fail to reject H₀**: no evidence the tickets are unevenly distributed across weekdays.

---

## P2 — GOF equal (die)

H₀: p₁ = ... = p₆ = 1/6 (die fair); H₁: at least one differs.
E = 60/6 = 10 for every face.
χ²₀ = (8−10)²/10 + (13−10)²/10 + (7−10)²/10 + (12−10)²/10 + (11−10)²/10 + (9−10)²/10
= 0.4 + 0.9 + 0.9 + 0.4 + 0.1 + 0.1 = **2.800**.
df = 5; χ²(0.05, 5) = **11.070**. 2.800 < 11.070 → **fail to reject H₀**: no evidence the die is biased.

---

## P3 — GOF unequal (OS share)

H₀: p_And = 0.60, p_iOS = 0.25, p_Win = 0.10, p_Oth = 0.05. H₁: at least one proportion differs from the claim.

E = n·p: Android 500(0.6) = 300; iOS 125; Windows 50; Others 25.

| OS | O | E | (O−E)²/E |
|---|---|---|---|
| Android | 274 | 300 | 2.253 |
| iOS | 139 | 125 | 1.568 |
| Windows | 55 | 50 | 0.500 |
| Others | 32 | 25 | 1.960 |

χ²₀ = **6.281**. df = 4 − 1 = 3; χ²(0.05, 3) = **7.815**.
6.281 < 7.815 → **fail to reject H₀**: the data are consistent with the vendor's claimed split. (Note: lots of small deviations, none decisive.)

---

## P4 — Independence 2×2 (device × churn)

H₀: churn and device type are independent. H₁: they are related.

Expected: e_ij = (row × col)/n. e₁₁ = 200×105/400 = 52.5; e₁₂ = 200×295/400 = 147.5; e₂₁ = 52.5; e₂₂ = 147.5. (All ≥ 5 ✓)

| Cell | O | E | (O−E)²/E |
|---|---|---|---|
| Mobile, churn | 44 | 52.5 | 1.376 |
| Mobile, stay | 156 | 147.5 | 0.490 |
| Desktop, churn | 61 | 52.5 | 1.376 |
| Desktop, stay | 139 | 147.5 | 0.490 |

χ²₀ = **3.732**. df = (2−1)(2−1) = 1; χ²(0.05, 1) = **3.841**.
3.732 < 3.841 → **fail to reject H₀** (by a whisker): at α = 0.05 there is insufficient evidence that churn depends on device type. (Classic exam trap: looks significant, isn't — by 0.109.)

---

## P5 — Independence 2×3 at α = 0.01 (region × payment)

H₀: payment preference is independent of region. H₁: they are related.

Row totals: Urban 150, Rural 150. Column totals: 100, 100, 100. n = 300.
Every expected count: e_ij = 150×100/300 = **50**. (All ≥ 5 ✓)

| Cell | O | E | (O−E)²/E |
|---|---|---|---|
| Urban, e-wallet | 62 | 50 | 2.88 |
| Urban, card | 48 | 50 | 0.08 |
| Urban, transfer | 40 | 50 | 2.00 |
| Rural, e-wallet | 38 | 50 | 2.88 |
| Rural, card | 52 | 50 | 0.08 |
| Rural, transfer | 60 | 50 | 2.00 |

χ²₀ = **9.920**. df = (2−1)(3−1) = 2; χ²(0.01, 2) = **9.210**.
9.920 > 9.210 → **reject H₀**: at the 1% level there is evidence that payment preference is related to region (urban orders lean e-wallet, rural lean bank transfer).

---

## P6 — Independence 3×3 (shift × defect)

H₀: defect type is independent of shift. H₁: defect type and shift are related.

Row totals: 60, 60, 60. Column totals: Scratch 80, Dent 60, Misalignment 40. n = 180.
Expected per row (same for all three shifts): e_scratch = 60×80/180 = 26.667; e_dent = 60×60/180 = 20; e_mis = 60×40/180 = 13.333. (All ≥ 5 ✓)

| Cell | O | E | (O−E)²/E |
|---|---|---|---|
| Morning, scratch | 36 | 26.667 | 3.267 |
| Morning, dent | 14 | 20 | 1.800 |
| Morning, mis | 10 | 13.333 | 0.833 |
| Evening, scratch | 28 | 26.667 | 0.067 |
| Evening, dent | 22 | 20 | 0.200 |
| Evening, mis | 10 | 13.333 | 0.833 |
| Night, scratch | 16 | 26.667 | 4.267 |
| Night, dent | 24 | 20 | 0.800 |
| Night, mis | 20 | 13.333 | 3.333 |

χ²₀ = **15.400**. df = (3−1)(3−1) = 4; χ²(0.05, 4) = **9.488**.
15.400 > 9.488 → **reject H₀**: defect type depends on shift (night shift over-produces misalignment, under-produces scratches relative to expectation — see the largest contributions: 4.267 and 3.333).

# 05 — MOCK FINAL EXAM v1
### SCST1223 / SECI1143 — Probability & Statistical Data Analysis
### Format mirrors Final Examination Semester 2, 2023/2024 (6 questions, 100 marks)

**INSTRUCTIONS (as on the real cover page):**
i. Answer ALL questions.
ii. This paper consists of SIX (6) QUESTIONS.
iii. **DO ALL CALCULATIONS IN 3 DECIMAL POINTS.**
iv. Formula list + statistical tables are provided (back of real paper; use 04_Emergency_Final_Review here).
Time budget: 2.5–3 hours. Suggested pace ≈ 1.5 min/mark.

---

## QUESTION 1 [10 MARKS]

a) A food-delivery startup wants to estimate the mean delivery time in its campus zone. A random sample of 15 deliveries gives these times (minutes):

| Delivery | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Time | 32 | 28 | 35 | 30 | 33 | 29 | 31 | 34 | 27 | 36 | 30 | 32 | 28 | 33 | 31 |

   i) Calculate a point estimate of the population mean, μ. (2 marks)
   ii) Construct and interpret a 90% confidence interval for μ. (5 marks)

b) A digital-wellbeing researcher claims that students' mean daily screen time is more than 6 hours. A simple random sample of 45 students gives a sample mean of 6.4 hours. The population standard deviation is known to be 1.5 hours. Test the claim at a significance level of 0.05, and interpret the result. (3 marks)

---

## QUESTION 2 [20 MARKS]

a) A company compares user-satisfaction ratings of two mobile-app interfaces using two independent samples. The summary is in Table 2. Assume the population variances are NOT equal.

| | Number of users, nᵢ | Mean, x̄ᵢ | Standard deviation, sᵢ |
|---|---|---|---|
| Interface X | 40 | 3.9 | 0.9 |
| Interface Y | 50 | 4.3 | 0.6 |

   i) State the hypothesis statement. (2 marks)
   ii) Calculate the test statistic. (2 marks)
   iii) Calculate the degree of freedom. (2 marks)
   iv) Test at α = 0.05 whether there is a mean difference in satisfaction between the two interfaces. (4 marks)

b) Six employees take a typing course. Their typing speeds (words per minute) before and after are in Table 3.

| Employee | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Before | 38 | 42 | 35 | 40 | 44 | 37 |
| After | 45 | 46 | 38 | 45 | 50 | 40 |

   i) State the null and alternative hypotheses. (1 mark)
   ii) At α = 0.05, does the course significantly increase typing speed? (9 marks)

---

## QUESTION 3 [20 MARKS]

a) A web-analytics team checks whether visits to a documentation site are uniform across weekdays. One random week shows:

| Day | Monday | Tuesday | Wednesday | Thursday | Friday |
|---|---|---|---|---|---|
| Visits | 410 | 395 | 430 | 388 | 427 |

   i) State the hypotheses for this test. (1 mark)
   ii) Calculate the expected frequencies and the test statistic. (4 marks)
   iii) Find the critical value at α = 0.05. Do the data prove that visits are equally distributed across weekdays? (3 marks)

b) A SaaS company samples 400 customers and records subscription plan against churn within 12 months:

| | Churned | Did not churn |
|---|---|---|
| Basic | 45 | 105 |
| Standard | 30 | 140 |
| Premium | 10 | 70 |

   i) State the null and alternative hypotheses. (2 marks)
   ii) Calculate the expected counts and the test statistic. (7 marks)
   iii) At the 5% significance level, do the data provide sufficient evidence that churn is related to subscription plan? (3 marks)

---

## QUESTION 4 [15 MARKS]

Table 6 shows hours spent on social media per day (m) and a sleep-quality index (q, 0–100) for 7 students. An analysis must be conducted to understand the relationship between social-media hours and sleep quality.

| Student | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| m | 2 | 3 | 5 | 6 | 7 | 8 | 9 |
| q | 84 | 80 | 74 | 73 | 65 | 62 | 59 |

a) Draw (sketch) the scatterplot. Is there any relationship observed? If yes, determine whether the relationship is negative or positive. (2 marks)

b) Calculate the correlation coefficient for the data in Table 6, given Σm² = 268 and Σq² = 35,811. Interpret the result. (11 marks)

c) If a student reduces social-media hours m, what will happen to the sleep-quality index q, based on your finding in (b)? (2 marks)

---

## QUESTION 5 [15 MARKS]

a) A rendering farm studies the relationship between allocated memory (x, GB) and render time (y, minutes) for one standard scene on 7 nodes:

| Node | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Memory, x | 4 | 8 | 8 | 16 | 16 | 24 | 32 |
| Render time, y | 58 | 50 | 52 | 41 | 44 | 36 | 30 |

   i) Find the summation for x, y, x², y² and xy for the above data. (5 marks)
   ii) Find the linear regression equation using the least-squares method. (4 marks)
   iii) Use the linear regression equation to estimate the render time for a node with 20 GB memory. (1 mark)

b) Dr. Rahim monitors 6 patients. The linear regression between age (x, years) and fasting glucose (y, mg/dL) is estimated as **ŷ = 62.4 + 0.95x**, and the estimated standard error of the slope is s_b1 = 0.21.

   i) Sketch a scatter diagram consistent with this fitted line and interpret the direction of the relationship. (2 marks)
   ii) Does the patient's age affect the glucose reading? Test the hypothesis using a 95% confidence level. (3 marks)

---

## QUESTION 6 [20 MARKS]

Table 9 shows delivery times (minutes) for the SAME standard parcel route by three courier companies, 8 deliveries each. The objective is to ascertain whether mean delivery times vary significantly across couriers.

| Courier | Delivery times (minutes) | Std. dev., sᵢ |
|---|---|---|
| K1 | 24, 26, 22, 25, 27, 23, 26, 24 | s₁ = 1.685 |
| K2 | 30, 28, 32, 31, 29, 33, 30, 31 | s₂ = 1.604 |
| K3 | 25, 27, 24, 26, 28, 25, 27, 26 | s₃ = 1.309 |

Let x̄₁, x̄₂, x̄₃ be the means for K1, K2, K3.

a) Find:
   i) x̄ for each courier. (3 marks)
   ii) Variance between samples. (5 marks)
   iii) Variance within samples. (4 marks)

b) Use a 0.05 significance level to test the claim that the different couriers have the same mean delivery time. (8 marks)

--- END OF QUESTIONS ---

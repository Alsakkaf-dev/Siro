# Drill — CH5: Estimation & Hypothesis Testing (10 problems)

> Modeled on actual past-final questions (numbers changed, style kept). Ramp: P1–P3 easy (CI), P4–P6 medium (one-sample tests), P7–P10 exam-level (two-sample tests). Do all calculations to 3 decimal points, like the real paper. Answers with full workings: `Drill_CH5_Estimation_HypTesting_ANSWERS.md`.

---

**P1 (CI, proportion — style of 2022/23 Q1a).**
A streaming platform surveys a random sample of 400 subscribers; 132 say they would pay for an ad-free tier.
(i) Compute a point estimate of the true proportion of all subscribers willing to pay. (1 m)
(ii) Construct and interpret a 95% confidence interval for the true proportion. (4 m)

**P2 (CI, mean with σ known + sample size — style of 2017/18-S1 Q1 and 2017/18 Q1b).**
The mean daily coffee-counter wait time from a random sample of 40 customers is 4.8 minutes. The population standard deviation is known to be 1.2 minutes.
(i) Construct a 90% confidence interval for the population mean wait time. (4 m)
(ii) How large a sample is needed so that the 90% margin of error is at most 0.25 minutes? (3 m)

**P3 (CI, mean with t — style of 2023/24 Q1a).**
The battery life (hours) of 12 randomly selected laptops of one model:
34.2, 35.1, 33.8, 36.0, 34.9, 35.5, 33.5, 34.8, 35.2, 34.1, 35.8, 34.6
(i) Calculate a point estimate of μ. (2 m)
(ii) Construct and interpret a 95% confidence interval for μ. (5 m)

**P4 (one-sample z-test — style of 2023/24 Q1b).**
An SRE claims the mean API response time exceeds 200 ms after a config change. A random sample of 50 requests gives x̄ = 212 ms; the population standard deviation is known to be 35 ms. Test the claim at α = 0.05. (5 m)

**P5 (one-sample t-test — style of 2016/17 Q2b).**
A mobile app's product team claims the mean session length is 15 minutes. Sessions are normally distributed. A random sample of 10 sessions (minutes):
13.8, 16.2, 14.5, 12.9, 15.8, 13.2, 14.1, 12.5, 13.9, 14.6
Test at α = 0.01 whether the true mean session length is 15 minutes. (8 m)

**P6 (χ² test on σ — style of 2022/23 Q1b / police-response slide example).**
A logistics company claims the standard deviation of its delivery times is less than 2.5 days. A random sample of 20 deliveries has s = 1.9 days. Deliveries are normally distributed.
(i) State the null and alternative hypotheses. (1 m)
(ii) Calculate the test statistic. (2 m)
(iii) Find the critical value. (1 m)
(iv) Sketch the rejection region and state your conclusion at α = 0.05. (3 m)

**P7 (two-proportion z — style of 2021/22 Q2b).**
In an A/B test, 78 of 520 visitors shown page design A sign up, and 51 of 480 visitors shown design B sign up. Do the results indicate a significant difference in sign-up proportions between the two designs? Use α = 0.01. (6 m)

**P8 (F-test for two variances — style of 2022/23 Q2a).**
Two data-entry teams are compared for consistency. Team 1: n₁ = 10 records/hour samples, s₁ = 2.4. Team 2: n₂ = 12, s₂ = 1.3. Both populations normal. Test at α = 0.05 whether the variability differs between the two teams. (8 m)

**P9 (pooled t — style of 2021/22 Q2a / 2016/17 Q3a).**
A courier compares delivery times from two hubs. Hub A: n₁ = 12, x̄₁ = 42.3 min, s₁ = 5.1. Hub B: n₂ = 10, x̄₂ = 37.8 min, s₂ = 4.6. Assume normal populations with equal variances. Test at α = 0.05 whether Hub A's mean delivery time is GREATER than Hub B's. (8 m)

**P10 (paired t — style of the question that appears EVERY year).**
Page load times (seconds) for 8 pages, before and after a performance optimization:

| Page | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Before | 3.4 | 2.9 | 4.1 | 3.8 | 3.2 | 4.5 | 3.0 | 3.7 |
| After | 2.8 | 2.7 | 3.2 | 3.5 | 3.0 | 3.6 | 2.5 | 3.4 |

Is there sufficient evidence at α = 0.05 that the optimization REDUCED mean load time? (10 m)

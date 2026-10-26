# =====================================================================
# SCST1223  PROBABILITY & STATISTICAL DATA ANALYSIS  -  PROJECT PHASE 2
# Group 6  |  Topic: Health Impact of Caffeine on Sleep & Focus (UTM)
# -------------------------------------------------------------------
# This script reproduces every inferential result reported in
# "PSDA_Project2_Report.pdf". Run it from the folder that contains
# "caffeine_dataset.csv".  All five tests + figures are produced.
# =====================================================================

# ---- 0. Load data ----------------------------------------------------
data <- read.csv("caffeine_dataset.csv", na.strings = c("", "NA"),
                 stringsAsFactors = FALSE)

# Inferential tests use ONLY regular consumers (n = 55); non-consumers
# (n = 19) have no consumption measures and are filtered out.
cons <- subset(data, regular_consumer == "Yes")

# Ensure numeric type for the quantitative variables
num <- c("cups_per_day", "focus_score", "effect_duration_hr", "sleep_impact")
cons[num] <- lapply(cons[num], as.numeric)

# Order the consumption level factor for interpretable output / plots
cons$consumption_level <- factor(cons$consumption_level,
                                 levels = c("Low", "Moderate", "High"))

cat("Total respondents        :", nrow(data), "\n")
cat("Regular consumers (used) :", nrow(cons), "\n\n")

# ---- 1. Descriptive summary (consumers) ------------------------------
get_mode <- function(x){ ux <- unique(x); ux[which.max(tabulate(match(x, ux)))] }
desc <- data.frame(
  Variable = num,
  Mean   = sapply(cons[num], function(x) round(mean(x), 3)),
  Median = sapply(cons[num], median),
  Mode   = sapply(cons[num], get_mode),
  SD     = sapply(cons[num], function(x) round(sd(x), 3)),
  Min    = sapply(cons[num], min),
  Max    = sapply(cons[num], max),
  row.names = NULL)
cat("---------- Descriptive statistics (n = 55) ----------\n"); print(desc)

# =====================================================================
# TEST 1  |  TWO-SAMPLE t-TEST  (Welch)   focus_score ~ gender
#   H0: mu_Female = mu_Male      H1: mu_Female != mu_Male
# =====================================================================
cat("\n==================== TEST 1: Two-sample t-test ====================\n")
t1 <- t.test(focus_score ~ gender, data = cons)   # Welch by default
print(t1)
cat("Cohen's d =",
    round((mean(cons$focus_score[cons$gender=="Female"]) -
           mean(cons$focus_score[cons$gender=="Male"])) /
          sd(cons$focus_score), 3), "\n")

# =====================================================================
# TEST 2  |  PEARSON CORRELATION   cups_per_day  vs  sleep_impact
#   H0: rho = 0                  H1: rho != 0
# =====================================================================
cat("\n==================== TEST 2: Pearson correlation ====================\n")
t2 <- cor.test(cons$cups_per_day, cons$sleep_impact, method = "pearson")
print(t2)

# =====================================================================
# TEST 3  |  SIMPLE LINEAR REGRESSION   sleep_impact ~ cups_per_day
# =====================================================================
cat("\n==================== TEST 3: Linear regression ====================\n")
m3 <- lm(sleep_impact ~ cups_per_day, data = cons)
print(summary(m3))
cat("Predicted sleep impact at 2 cups:", round(predict(m3, data.frame(cups_per_day=2)),3), "\n")
cat("Predicted sleep impact at 5 cups:", round(predict(m3, data.frame(cups_per_day=5)),3), "\n")

# =====================================================================
# TEST 4  |  ONE-WAY ANOVA  effect_duration_hr ~ consumption_level
#   H0: mu_Low = mu_Moderate = mu_High
# =====================================================================
cat("\n==================== TEST 4: One-way ANOVA ====================\n")
m4 <- aov(effect_duration_hr ~ consumption_level, data = cons)
print(summary(m4))
cat("\nGroup means:\n")
print(tapply(cons$effect_duration_hr, cons$consumption_level, mean))
cat("\nTukey HSD post-hoc:\n"); print(TukeyHSD(m4))

# =====================================================================
# TEST 5  |  CHI-SQUARE GOODNESS-OF-FIT  caffeine_type ~ uniform
#   H0: all five caffeine types are equally preferred (each = 20%)
# =====================================================================
cat("\n==================== TEST 5: Goodness-of-fit ====================\n")
lvl <- c("Coffee-based","Tea-based","Energy Drink","Soda","Soft Drink")
obs <- table(factor(cons$caffeine_type, levels = lvl))
print(obs)
t5 <- chisq.test(as.numeric(obs), p = rep(1/5, 5))
print(t5)

# =====================================================================
# FIGURES  (base-R graphics, saved as PNG)
# =====================================================================
# Fig A - scatter + regression line (Correlation & Regression)
png("R_fig_corr_regression.png", width = 1000, height = 700, res = 150)
plot(jitter(cons$cups_per_day), jitter(cons$sleep_impact), pch = 19,
     col = "#4f81bd", xlab = "Cups of caffeine per day",
     ylab = "Sleep-quality impact (1-5)",
     main = "Caffeine Intake vs Sleep-Quality Impact")
abline(m3, col = "#c0392b", lwd = 2)
legend("topright", bty = "n",
       legend = c(sprintf("r = %.3f", cor(cons$cups_per_day, cons$sleep_impact)),
                  sprintf("R2 = %.3f", summary(m3)$r.squared), "p < 0.001"))
dev.off()

# Fig B - ANOVA boxplot
png("R_fig_anova_boxplot.png", width = 1000, height = 700, res = 150)
boxplot(effect_duration_hr ~ consumption_level, data = cons,
        col = c("#c6dbef","#9ecae1","#4f81bd"),
        xlab = "Consumption level", ylab = "Perceived effect duration (hours)",
        main = "Effect Duration by Consumption Level")
means <- tapply(cons$effect_duration_hr, cons$consumption_level, mean)
points(1:3, means, pch = 18, col = "#c0392b", cex = 1.6)
dev.off()

# Fig C - gender t-test boxplot
png("R_fig_ttest_gender.png", width = 900, height = 700, res = 150)
boxplot(focus_score ~ gender, data = cons, col = c("#f4b6c2","#9ecae1"),
        xlab = "Gender", ylab = "Focus level (1-10)",
        main = "Focus Level After Caffeine by Gender")
dev.off()

# Fig D - goodness-of-fit observed vs expected
png("R_fig_gof_caffeine.png", width = 1000, height = 700, res = 150)
bp <- barplot(rbind(as.numeric(obs), rep(sum(obs)/5, 5)), beside = TRUE,
        names.arg = lvl, col = c("#4f81bd","#bdbdbd"), las = 2,
        ylab = "Number of consumers",
        main = "Observed vs Expected Caffeine-Type Preference")
legend("topright", c("Observed","Expected"), fill = c("#4f81bd","#bdbdbd"), bty="n")
dev.off()

cat("\nAll tests complete. Figures saved as R_fig_*.png\n")

# CH3 MASTERY — Business Intelligence Front-End (Written-Exam Vocabulary + Stats Bridge)
**SCSP3213 Business Intelligence | Source: CH03_Business Intelligence FrontEnd.pdf**
**Why this matters: Ch3 was NOT in the quiz → fresh material for the written component. It also supplies the statistics vocabulary (mean/median/quartiles/box plot/skewness) that Alteryx's Field Summary and Tableau's Box Plot put on screen — so it bridges directly into the hands-on part.**

---

## 1. SELF-SERVICE BI (slide 2–3)

- **Top priority for many BI teams.** The vision: if users have **easy-to-use BI tools**, they can service themselves — asking the tough business questions that yield the most value — **without any assistance from IT**.
- Promised benefits: **no IT backlog of requests**; users act at **the fast pace business demands**.
- Reality check: success depends on **staffing, complexity, and tech savviness** of users.
- **Self-service BI continuum** — when evaluating the vision, consider four variables:
  1. the **use case**
  2. **sophistication of the users**
  3. **degree of IT involvement**
  4. **breadth of data sources**

> Exam phrasing tip: "Explain self-service BI and TWO factors that determine its success" → define vision + pick any two of the four continuum variables.

## 2. BUSINESS QUERY AND REPORTING (slides 4–9)

- **Business query & reporting tools** allow business users to **create queries and reports themselves without relying on IT**, most often used for **decision making and management** purposes. A key module for **self-service information access**.
- History: when BI emerged in the **early 1990s**, business query tools let users query **without knowing SQL** — unlocking relational data for non-programmers.
- **Fixed report vs ad-hoc query:**
  - *Ad-hoc:* a **one-off business question** that may never be posed again; often **exploratory** (find root cause, test a theory, consider changing a business model).
  - *Fixed:* standardized, repeated report.
  - **The iterative nature of BI:** a fixed report may lead to an ad-hoc query; an ad-hoc query may later become a fixed report → you need **flexible BI tools**.
- Two capabilities of a business query tool: (1) **getting to the data** (query) and (2) **presenting/formatting it** (reporting) — that's why "query" and "reporting" are used interchangeably.
- The data source can be a **data warehouse** or **direct access to an operational system**.
- **Business view / metadata layer** (KEY DEFINITION): hides the complexity of the physical database structure from the business user by:
  1. using **business terminology** rather than physical field names,
  2. **automatically connecting related tables via joins**,
  3. providing **metrics** that calculate and aggregate facts (revenue, no. of customers, no. of orders, average sales).
- In integrated BI platforms the business view is **common to all modules** (business query, reporting, analysis, dashboard).
- Risks of a POOR business view: users **build incorrect queries**; too much logic/calculations gets pushed **into individual reports and dashboards**.

## 3. VISUAL DATA DISCOVERY (slides 10–14)

- One of the **most rapidly growing** BI software segments.
- **Definition (memorize):** a tool that **speeds the time to insight** through the use of **visualizations, best practices in visual perception, and easy exploration**.
- Supports business agility and self-service BI through innovations such as **in-memory processing** and **mashing of multiple data sources**.
- Moves the focus of BI **from "what" to exploring "why", "where" and "when"**. Users may not know precisely what they're looking for — they **navigate and drill** within a data set to uncover details and patterns.
- Contrast example (classic 2-mark question):
  - Business query tool: *"What are my sales this month?"*
  - Visual data discovery: *"What are the **characteristics** of those customers with higher sales?"* (age, income, gender, location) — results rendered on a **geographic map or scatter plot**.
- Named tools: **Tableau**, TIBCO Spotfire, SAS Visual Analytics Explorer, MicroStrategy Visual Insight, SAP Lumira.

## 4. DASHBOARD (slides 15–18)

- **Definition (Few-style, recycled from Ch1 — learn verbatim):** a **visual display of the most important information** needed to achieve one or more objectives, **consolidated and arranged on a single screen** so the information can be **monitored at a glance**.
- **Performance dashboard:** a **multi-layered application** built on a BI and data integration infrastructure that enables organizations to **measure, monitor and manage** business performance more effectively.
- Car-dashboard analogy: multiple indicators in a highly visual way. A dashboard may be composed of:
  - a **map** color-coding where sales perform well/poorly,
  - a **trend line** tracking stock-outs,
  - a **cross tab** of top-selling products,
  - a **KPI with an arrow** showing if sales are on plan.
- **User-assembled vs IT-designed:** users ideally assemble their own (visual data discovery tools allow this); **IT-designed** is preferred for **operational dashboards** that access **source systems directly**, are **refreshed in real time**, and support **mission-critical operational tasks**.
- A key characteristic: dashboards present information from **multiple data sources**.

## 5. SCORECARDS (slides 19–21)

- Often used interchangeably with dashboards, **but different**:
  - A **scorecard** tracks a set of **KPIs compared to a forecast or target**.
  - A **dashboard** presents **multiple numbers in different ways**.
  - (Some dashboards also show metrics + targets with **visual traffic lighting**.)
- **Strategic scorecard / Balanced Scorecard** contains metrics from the **four key areas that drive business success**:
  1. **People**
  2. **Customers**
  3. **Financial**
  4. **Operations**
  - …and includes **strategy maps** showing how metrics relate to one another.

> Compare-question bank: dashboard vs report (Ch1), dashboard vs scorecard (Ch3), business query vs visual data discovery (Ch3). All three are proven professor patterns.

## 6. BUSINESS ANALYTICS — STATISTICAL MODELING (slides 22–end)

- **Statistics:** a collection of **mathematical techniques to characterize and interpret data**.
- **Descriptive statistics:** describing the data **as it is**.
- **Inferential statistics:** drawing inferences about the **population** based on **sample** data.
- Descriptive statistics for descriptive analytics: simple formulas, numerical aggregations, data tables and charts; summarizes data; patterns emerge; helps **characterize and validate** data; **does NOT allow conclusions beyond the sample**.

### Measures of Central Tendency
| Measure | Definition |
|---|---|
| **Arithmetic mean** | sum of values ÷ n |
| **Median** | the number in the middle (sorted) |
| **Mode** | the most frequent observation |

### Measures of Dispersion
| Measure | Definition |
|---|---|
| **Range** | Max − Min |
| **Variance (s²)** | Σ(xᵢ−x̄)² / (n−1) |
| **Standard deviation (s)** | √variance |
| **MAD** | Mean Absolute Deviation — average absolute deviation from the mean |
| **Quartiles** | values splitting sorted data into four parts (Q1, Q2=median, Q3) |

- **Box-and-Whiskers plot (box plot):** versatile/informative display of quartiles + whiskers; the course's go-to outlier visual (reappears in Alteryx Field Summary output and Tableau's box-and-whisker chart).

### Shape Properties
- **Histogram:** frequency chart showing the **distribution of ONE variable**; quantitative variables are **binned**.
- **Bar graph:** shows **comparison**, contains **multiple variables** that can be reordered.
  - (Histogram vs bar graph = distribution-of-one vs comparison-of-many. Quizzable.)
- **Skewness:** measure of **asymmetry** of the distribution.
- **Kurtosis:** the **peaked/tall/skinny** nature of the distribution.

### Tools that compute descriptive statistics (named on slides)
MS Excel (Data Analysis ToolPak), **Tableau, Power BI, Alteryx**, SPSS, SAS, R, Python.

---

## 7. RAPID-FIRE DRILL (cover the right column)

| Term | Answer |
|---|---|
| Self-service BI vision | Easy tools → users answer tough questions without IT; no backlog; business pace |
| Continuum variables | Use case, user sophistication, IT involvement, breadth of data sources |
| Business query tool | Lets users query via business terms with no SQL; metadata layer hides physical schema |
| Business view does 3 things | Business terminology; auto joins; pre-built metrics/aggregations |
| Ad-hoc vs fixed report | One-off exploratory question vs standardized repeated report; each can become the other |
| Visual data discovery | Speeds time to insight via visualizations, visual-perception best practice, easy exploration |
| VDD shifts BI from… | "what" → "why/where/when" |
| Dashboard | Most important info, one screen, at a glance |
| Performance dashboard | Multi-layered app on BI+integration infrastructure to measure/monitor/manage performance |
| Scorecard vs dashboard | KPIs vs forecast/target vs multiple numbers displayed many ways |
| Balanced scorecard areas | People, Customers, Financial, Operations (+ strategy maps) |
| Descriptive vs inferential | Describe data as-is vs infer about population from sample |
| Mean/median/mode | Average / middle / most frequent |
| Range / variance / SD / MAD | Max−min / avg squared deviation (n−1) / √variance / avg absolute deviation |
| Histogram vs bar graph | One variable's distribution (binned) vs comparison across variables |
| Skewness / kurtosis | Asymmetry / peakedness of distribution |

## 8. PREDICTED WRITTEN QUESTIONS
1. *Define self-service BI and discuss the factors of the self-service continuum.*
2. *Explain THREE functions of the business view (metadata layer) in a business query tool.*
3. *Differentiate a business query tool from a visual data discovery tool, with an example question each.*
4. *Differentiate dashboard and scorecard. Name the four areas of a balanced scorecard.*
5. *Given a small data set: compute mean, median, mode, range; sketch/interpret a box plot.* (Bridges to the hands-on part — she can also ask you to verify with Alteryx Field Summary.)
6. *Differentiate descriptive vs inferential statistics; histogram vs bar graph.*

# CH1–2 MASTERY — BI Foundations & Architecture (Written-Exam Vocabulary)
**SCSP3213 Business Intelligence | Source: CH01P1_BusinessIntelligence_Intro.pdf + CH02_Components of BI Architecture_2526s2.pdf**
**Status: Quiz already covered Ch1–2 → these are the professor's PROVEN question targets. Expect definition/short-answer recycling on the written part of the final.**

---

## 1. WHAT IS BUSINESS INTELLIGENCE — the 4 definitions the slides give

Learn ONE fluently, recognize all four (quiz-style "which source said..." is unlikely, but the phrasing below is what she rewards):

1. **Successful Business Intelligence (book):** BI is *a set of technologies and processes that allow people at all levels of an organization to access and analyze data.*
2. **Forrester:** BI is *a set of methods, processes, architectures, applications, and technologies that gather and transform raw data into meaningful and useful information* used to enable more effective **strategic, tactical, and operational** insights and decision-making.
3. **OLAP.com:** BI = technologies, applications and practices for the **collection, integration, analysis, and presentation** of business information. Purpose: support better decision making. *BI systems are data-driven Decision Support Systems (DSS).*
4. **TechTarget:** BI is *a technology-driven process for analysing data and presenting actionable information* that helps executives, managers and corporate end users make informed decisions.

**Memory hook:** Collect → Integrate → Analyze → Present → Decide. (That's also the BI General Process and the exam's mental model.)

### Evolution of BI (timeline — classic ordering question)
| Era | What appeared |
|---|---|
| 1980s | Executive Information Systems (EIS), Decision Support Systems (DSS) |
| 1990s | Data Warehousing (DW), Business Intelligence (BI) |
| 2000s | Dashboards & Scorecards, Performance Management |
| 2010++ | Analytics, Big Data, Personal BI, Data Science, Augmented BI |

- **Self-service BI:** approach enabling business users to access/work with corporate data **without a background in statistical analysis, BI or data mining** — filter, sort, analyze, visualize *without involving IT/BI teams*.

### BI vs Big Data (slide 10)
- BI transforms data to assist informed decisions; Big Data deals with data sets **too large or complex for traditional data-processing software**.
- **The 5 V's: Volume, Velocity, Variety, Veracity, Value.** (Quiz favourite — be able to name all five.)

### Common data problems (why BI is hard)
- **Structured (≈15%) vs unstructured (≈85%)** information (Butler Group); 80% of business runs on unstructured info (Gartner).
- **Information overloading** — too much data, varied formats, multiple conflicting copies.
- **Data is everywhere** — separate systems, internal + external; "**spreadmart**" (spreadsheet data mart) problem.
- **Difficulty of access** — technical or administrative barriers.
- **Don't have that data** — not collected; collecting is costly.

### Decision-making process (5 steps — slide 19, in order)
1. **Identify** a business problem.
2. **Seek information** about possible decisions and their likely effect.
3. **Evaluate** the alternatives and choose one.
4. **Implement** the decision in business operations.
5. **Monitor** the situation, gather data about the decision's impact, make changes if necessary.

Decisions can be based on: **facts/data, simulation (models), intuition/perception, group negotiation.**
Challenges: gap between data and knowledge; management by intuition; lack of feedback/alignment cycles; need for good analytical models.
Enhancement needed: **real-time/most recent data; business-user driven, agile, instant; exploratory and interactive.**

### Three levels of decision-making (Assignment 1 used this → high-probability written question)
| Level | Who | Horizon | Example |
|---|---|---|---|
| **Strategic** | Executives | Long-term | Enter a new market, open new branches |
| **Tactical** | Middle managers | Medium-term | Reallocate budget across campaigns |
| **Operational** | Operational staff | Day-to-day | Restock a product, reschedule a shift |

### BI General Process (5 stages)
**Data Gathering & Cleansing → Data Storage → Data Analysis/Analytics → Data Presentation (Reports & Dashboards)** — supporting decision-making.

- **Analytics:** a more systematic, automated, flexible process of data analysis for revealing insights — originally advanced statistical modelling (SAS/SPSS), now the entire domain of leveraging information = *reporting AND analysis*.
- **Report:** presentation of **detailed data** in defined layouts/formats; based on simple, direct queries (sorting, calculating, filtering, grouping, formatting). Geared to people who need **data**; purpose mainly printing/exporting. Traditional = tabular numbers and text.
- **Dashboard (Stephen Few):** *a visual-oriented display of the most important data and information needed to achieve defined goals and objectives, consolidated and arranged on a **single screen** so the information can be monitored **at a glance**.*
- Report vs Dashboard contrast: detail-oriented tabular vs visual, consolidated, glanceable. (Classic 2-mark compare question.)

### How BI provides value (Ch2 closing sections — short-essay fodder)
- **Management & control:** timely, flexible view (sales by region, expenses vs budget, inventory); drill into details when metrics are off target instead of "flying blind".
- **Improving performance:** revenue, margin, profitability, cost-to-serve; better campaign response rates; cross-selling; reducing accounts-receivable aging; plant gap analysis.
- **Operational BI:** differs in **level of detail** and **timeliness** (near-real-time, possibly direct to transaction system). **Embedded BI** = a report/nugget of information integrated inside an operational task (e.g., showing alternative sizes/colours when a product is out of stock).
- **Process improvement:** measure sub-process times, find bottlenecks (e.g., manufacturing-to-shipment).
- **Customer service:** Whirlpool warranty monitoring; United Airlines upgrade monitoring; Netflix first-choice DVD tracking.
- **Discovering new opportunities:** test theories, evaluate JVs/M&A, hotel capacity → time-share business.
- Caution: more data can SLOW decisions; BI provides value only **when used effectively by people**.

---

## 2. BI ARCHITECTURE (CH2) — the heart of the written exam

**Definition:** BI architecture is *the framework of technology, processes, and policies that collect, store, and analyze data to support strategic decision-making* — a blueprint for transforming raw data into actionable insights.

**Six components of current BI architecture (memorize the list):**
1. **Data Sources** — operational systems, CRM, ERP, third-party APIs.
2. **Data Integration (ETL/ELT)** — tools that move, clean, organize data.
3. **Data Storage** — data warehouses (Snowflake, Amazon Redshift, Google BigQuery) or data lakes.
4. **Semantic Layer** — maps complex data into business-friendly terms.
5. **Analytics & Reporting Layer** — dashboards, data visualization (Tableau, Power BI).
6. **Governance & Security** — data is trusted, secure, meets regulatory standards.

**ASCII picture to reproduce in answers:**
```
[Operational Systems / CRM / ERP / External & Social / Machine data]
        │  EXTRACT
        ▼
   [ ETL / ELT ]  ← transform = most time-consuming step
        │  LOAD
        ▼
[ Data Warehouse ] ──► [ Data Marts ] (subject subsets)
        │
   [ Semantic Layer ]  (business terms, hides physical schema)
        ▼
[ BI Front-End: query, reports, dashboards, visual discovery ]
        ▼
   [ Decisions ]      (Governance & Security wraps all layers)
```

### 2.1 Data Sources
- **Operational systems** = starting point for most quantitative data; also called **transaction processing systems, source systems, ERP systems**.
- Examples by module: manufacturing (production orders, raw material), sales (order entry), supply chain (shipment/fulfilment), accounting (invoices, payments).
- **If you don't capture data in the operational system, you can't analyse it.** Errors in source compound downstream.
- ERP vendors named: Oracle (e-Business Suite, PeopleSoft, J.D. Edwards, Siebel), SAP, Microsoft Dynamics GP.
- **Master data:** common set of reference tables (customer IDs, product codes, chart of accounts) shared across modules.
- **Additional source systems:** distributors (sales/inventory), advertisers, **click-stream web logs**, market prices from research firms, social data (Twitter/Facebook), **machine-generated/sensor/RFID** data.
- Whether extra data enters the central DW depends on: consistency of merging, how common the need is, business value, **politics**. Otherwise it lands in a **data mart or analytics sandbox**, or is combined in the front-end tool.

### 2.2 Data Integration — ETL (define precisely)
- **ETL = Extract, Transform, Load:** data is extracted from operational systems, transformed, and loaded into the data warehouse.
- **ELT** = newer ordering (Extract, Load, Transform).
- **Transform is the most time-consuming part**, especially with multiple disparate systems: fixing inconsistent codes (product/customer IDs), handling incomplete data, changing codes to meaningful terms (1 = not shipped → "not shipped").
- Packaged ETL solutions named: **Informatica PowerCenter, IBM InfoSphere DataStage, Oracle Data Integrator, Microsoft Integration Services (SSIS), open-source Talend.** (Alteryx is the course's hands-on ETL tool.)
- **Why not extract everything?** (3 reasons): (1) the ETL **time window** is small (global user base), (2) too much detail **hurts query performance**, (3) limited time/money/people force prioritization.
- **EIM (Enterprise Information Management)** = ETL tools + data modelling tools + data quality + data profiling + metadata management + **MDM**.

**Metadata = data about the data.**
- Examples: when extracted, when loaded, source system, physical table/field of origin, transformation rules, how something was calculated (revenue = price × quantity − discounts), what the item means in business context.
- **Technical metadata** = where data is extracted from/stored. **Business metadata** = business definitions and calculations. (Definition pair — very quizzable.)
- Metadata ensures a **common business terminology** (a salesperson's "revenue" vs finance's "revenue").

**Master Data Management (MDM):** the practice of defining and maintaining **consistent definitions of business entities** (customer, product) and data about them **across multiple IT systems** and possibly partner businesses. Includes mappings of different IDs that represent the same product, and hierarchies for aggregation.

### 2.3 Do I need a Data Warehouse? (4 justifications)
ERP alone does not deliver business insight. You want a separate DW when:
1. **Cross-subject / cross-functional analysis** (orders vs inventory across systems/modules).
2. **Summary/aggregated analysis** by time (month, quarter) or hierarchy (product groupings) — hierarchies often don't exist in transaction systems, and voluminous queries would slow data entry.
3. **Consistently fast reporting/analysis times.**
4. Different purpose & design → **DW queries are faster** than operational systems.

### 2.4 Data Storage — warehouse design (HIGH-YIELD definitions)

**Inmon vs Kimball (memorize verbatim-ish):**
- **Bill Inmon's paradigm:** the DW is **one part** of the overall BI system. An enterprise has **one data warehouse**; **data marts source their information from the DW**. In the DW, information is stored in **3rd normal form (3NF)**. (Top-down.)
- **Ralph Kimball's paradigm:** the DW is **the conglomerate of all data marts** within the enterprise. Information is **always stored in the dimensional model**. (Bottom-up.)

**Data mart:** a **subset of the data warehouse** for one subject area, OR a single subject area populated directly from multiple source systems. DW serves the **enterprise**; a data mart serves a **business unit/function/process/application**. An **independent data mart** skips the DW.

**Medallion Architecture** (data engineering, newer slide):
- **Bronze layer:** raw data ingestion from source systems (structured & unstructured).
- **Silver layer:** cleaned and validated data (missing-value handling, deduplication).
- **Gold layer:** curated, business-ready data optimized for analytics/reporting.
- Benefits: improved data quality & governance; scalable modular pipelines; supports BI/dashboards/advanced analytics.

**Fact & Dimension tables:**
- **Fact table:** contains **keys into the dimension tables** + **numeric information to analyse** (sales, inventory, calls) — the numbers are called **measures**. Can be millions of detailed rows = "**finer granularity**"; aggregate tables (DAILY_/MONTHLY_/YEARLY_SALES_FACT) improve performance.
- **Dimension tables:** allow analysis of measures **from different perspectives** (product, time, geography). Also called **lookup/reference tables**. They contain the textual context — the **who, what, where, when, how, why** — and often store **hierarchies redundantly (denormalized)** for ease of use and query performance.
- Dimension attributes supply **report filters and labels**; fact tables supply the **numeric values**.

**Four steps of dimensional modeling (Kimball):**
1. Identify the **process** being modeled.
2. Determine the **grain** at which facts will be stored.
3. Choose the **dimensions**.
4. Identify the numeric **measures** for the facts.

**Schemas (be able to sketch + one-line define):**
| Schema | Definition |
|---|---|
| **Star schema** | ONE fact table in the middle connected to a set of dimension tables. (One fact + its dimensions = a star.) |
| **Snowflake schema** | A refinement of star where **some dimensional hierarchy is normalized** into smaller dimension tables (e.g., location → city table). Used for extremely large dimensions. |
| **Fact constellation / Galaxy schema** | **Multiple fact tables share dimension tables** — a collection of stars. |

Star schema example fields (from slide 49): Sales Fact (time_key, item_key, branch_key, location_key, units_sold, dollars_sold, avg_sales) with Time, Item, Branch, Location dimensions.

**Why not ER modeling?** ER is for relational/OLTP design; DW needs a **concise, subject-oriented schema that facilitates data analysis** (dimensions & measures).

### 2.5 Technology platform
- Servers involved: **RDBMS server(s), ETL server(s), web server(s), BI server(s)** (queries, dashboards, reports).
- DW relational DBs: Oracle, SQL Server, IBM DB2; BI-specific: Teradata, Netezza, Greenplum, Actian ParAccel.
- **Analytic appliance:** combines **server + database + data storage** in one optimized system (IBM Netezza, EMC Greenplum, Teradata, HP Vertica, Oracle Exadata, SAP Sybase IQ; SAP HANA = in-memory DB).
- **Cloud BI:**
  - **IaaS** — third party provisions virtualized servers/storage/network; you deploy your own software (AWS, GoGrid, Rackspace).
  - **PaaS** — optimized software platform on top of IaaS (app servers, DB, BI software preconfigured).
  - **SaaS** — infrastructure + applications directly consumed by business users; subscribe and upload data.
  - Examples: Netflix DW on Amazon S3; FlightStats on AWS; Huntington Bank on MicroStrategy Cloud.

### 2.6 Semantic Layer
**Definition:** a piece of enterprise data architecture that **simplifies interactions between complex data storage systems and business users** — converts raw data into **meaningful business terms** through a user-friendly interface, letting users focus on analysis rather than the technicalities of retrieval.

### 2.7 Governance & Security
- **Data Governance:** the set of **processes and technologies used to ensure effective management and utilization of data** (analysts and **data stewards** enforce policies, promote correct usage).
- **BI Governance:** **extends** data governance to **all information consumers**, leveraging governance metadata to drive engagement and **data literacy**. Traditional data governance "stops at the shore of visualization"; BI governance covers data **and** visualization.
- **BI portal:** single pane of glass for all analytics; foundation of BI governance; can be stand-alone or alongside Data Catalog tools.

### 2.8 Retail case study vocabulary (slides 90–91)
- 100 stores × 5 states, ~60,000 **SKUs (stock keeping units)** per store.
- Best data captured at the **POS (point-of-sale) system** scanning barcodes = "consumer takeaway"; also back-door vendor deliveries.
- Management cares about **pricing and promotions** (temporary price reductions, ads, displays, coupons). Promotion visibility is key to analysis — this scenario is the lead-in to designing a dimensional model (grain = line item on a receipt).

---

## 3. RAPID-FIRE DEFINITION DRILL (cover the right column)

| Term | One-line answer |
|---|---|
| Business Intelligence | Technologies + processes that transform raw data into meaningful information for better decisions at all levels |
| DSS | Decision Support System — BI is a data-driven DSS |
| Self-service BI | Business users analyze/visualize data without IT or stats background |
| 5 V's of Big Data | Volume, Velocity, Variety, Veracity, Value |
| ETL | Extract from sources, Transform (clean/standardize), Load into DW |
| ELT | Extract, Load (first), Transform (inside target) |
| Metadata | Data about data (technical = origin/storage; business = definitions/calculations) |
| MDM | Maintaining consistent definitions of business entities across IT systems |
| Data warehouse | Central, subject-oriented store of integrated data for enterprise analysis |
| Data mart | Subject-area subset serving one business unit/function |
| Fact table | Keys to dimensions + numeric measures |
| Dimension table | Descriptive context (who/what/where/when/how/why); filters & labels |
| Grain | The level of detail at which facts are stored |
| Star schema | One fact table + surrounding dimension tables |
| Snowflake schema | Star with normalized dimension hierarchies |
| Fact constellation | Multiple fact tables sharing dimensions (galaxy) |
| Inmon | One enterprise DW in 3NF; marts fed from it (top-down) |
| Kimball | DW = union of dimensional data marts (bottom-up) |
| Medallion | Bronze raw → Silver clean → Gold business-ready |
| Semantic layer | Translates complex storage into business-friendly terms |
| Operational BI / Embedded BI | BI integrated into operational tasks; the supporting nugget = embedded BI |
| Spreadmart | Uncontrolled spreadsheet "data mart" causing conflicting copies |
| Data governance | Processes/technologies ensuring effective management & utilization of data |
| BI governance | Extends governance to all consumers incl. visualization, via BI portal |
| IaaS / PaaS / SaaS | Hardware rental / preconfigured platform / ready software subscription |
| Analytic appliance | Server + DB + storage combined in one optimized box |
| Report vs Dashboard | Detailed tabular data vs most-important info on one screen at a glance |

---

## 4. PREDICTED WRITTEN QUESTIONS (based on quiz history + Assignment 1 style)
1. *Define BI and explain how it supports the decision-making process (list the 5 steps).*
2. *Name and describe the six components of a BI architecture.* (Or: draw the architecture for scenario X — same skeleton as Assignment 1 Part 3: Data Source → Data Storage → Analysis → Decision.)
3. *Differentiate Inmon vs Kimball / star vs snowflake / fact vs dimension / data warehouse vs data mart / technical vs business metadata / report vs dashboard.* (Pick-two compare table.)
4. *Explain ETL; why is Transform the most time-consuming? Give 3 reasons why we do not extract everything.*
5. *Give the 4 reasons a company needs a data warehouse separate from its transaction system.*
6. *Explain the three levels of decision-making with one example decision each (for a given scenario).*
7. *State the 5 V's of Big Data.* / *List common data problems facing organizations.*
8. *Explain the Medallion architecture layers.*

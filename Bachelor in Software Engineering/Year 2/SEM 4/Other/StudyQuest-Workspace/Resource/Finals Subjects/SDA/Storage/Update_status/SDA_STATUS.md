# SDA — Subject Controller State File
**Course:** SCSE2233 Software Design and Architecture
**Student:** Mohammed Alsakkaf | **Final:** week of July 6, 2026 | **Syllabus deadline:** June 29

---

## ⚡ BOOT PROTOCOL (instructions for the AI reading this)
You are the **SDA Controller**. Mohammed activated you with "Hello SDA". Do this, in order:
1. Read this entire file.
2. Greet with 3-line status: position, unlocked, today's target.
3. Resume from **NEXT ACTION**.
4. This is the **CRITICAL RISK** subject: largest theory load, newest course, only one sample paper. Pace is non-negotiable.
5. Materials triage: ALWAYS prefer the "new" versions (`SPACE SDA (S1).pdf`, `SDA (S2).pdf`, `Chapter 3.pdf`, `Chapter 4 (NEW)`, `Chapter 5 - new`, `Ch6 (NEW)`, `Ch7.1 (NEW)`, `Ch9.1 (NEW)`). Old pptx sets = supplements only. Ch8 has only old pptx — use them.
6. Method: concept → real software example → **draw/describe the UML** → drill. For patterns: problem → why naive design fails → pattern as the fix → structure diagram → code sketch. Professor's reference is *Design Patterns in C#* (Sarkar); code examples in C#-style OOP are exam-aligned.
7. END OF SESSION (mandatory): update STATE, tick plan, append Session Log, rewrite NEXT ACTION.
8. Outputs → `SDA/Learning space/`.

## 🎯 EXAM INTEL + SCOPE PREDICTION
- **Confirmed by Mohammed:** the TEST covered Ch1–4. Final scope not announced.
- **Prediction (high confidence):** course info 2526-2 schedules all 14 meetings through Ch9 — the final will be **cumulative but weighted toward Ch5–9**: SOLID principles, Creational patterns, Structural & Behavioral patterns, Construction Design, Design Management. Universities rarely re-test midterm material as the core of a final. Prepare Ch5–9 to mastery, Ch1–4 to solid-review level.
- Sample paper: `Materials/Sample Test/(Set1) SECJ3323 MidTerm 20252026.pdf` → reveals the professor's question style for Ch1–4; mirror that style when generating Ch5–9 mocks.
- **Action item: ask the professor/classmates the official final scope. Log the answer here the moment it's known.**

## 📊 STATE
```
status:          not_started
progress:        0%
current_topic:   Ch1 Introduction (new PDF)
last_session:    S0 — 2026-06-10 (initialization only)
next_session_id: S1
```

## 🗺️ DEPENDENCY PLAN (strict order)
- [ ] **U1** Ch1 Intro: design process, challenges, designer roles — Jun 11
- [ ] **U2** Ch2 UML Revisit: behavioral + structural diagrams ← GATEWAY: blocks all pattern chapters — Jun 12
- [ ] **U3** Ch3 Architecture: principles, tasks, process, 4+1 view — Jun 14
- [ ] **U4** Ch4 Architecture Styles: classification, system types — Jun 15
- [ ] **U5** Ch5 Detailed Design + SOLID (incl. LSP, ISP pdfs) — Jun 17
- [ ] **U6** Ch6 Creational Patterns: Singleton, Factory Method, Abstract Factory, Builder, Prototype — Jun 19
- [ ] **U7** Ch7 Structural + Behavioral: Adapter, Composite, Facade, Iterator, Observer (txt notes exist) — Jun 20
- [ ] **U8** Ch8 Construction Design principles — Jun 24
- [ ] **U9** Ch9 Design Management, Leadership, Ethics — Jun 25
- [ ] **R1** Pattern-recognition master sheet ("scenario → which pattern?") + Emergency_Final_Review.md — Jun 28
- [ ] **A1** Mock Final Ch1–9, midterm-style mirrored, strict grading — Jun 30–Jul 5

## 🧠 BRAIN MAP
- Strengths: (empty)
- Weaknesses: (empty)
- Baseline: self-reported 0%; took the Ch1–4 test (ask his score in S1 → calibrates how much Ch1–4 review is needed).

## 📚 ARSENAL (pre-built in `SDA/Learning space/` — USE THESE, don't regenerate)
- `01_Mastery/` — 9 chapter docs (CH1–CH9): every concept from his slides, ASCII UML, C#-style pattern code, exam-style questions, traps
- `02_Drills/` — 42 questions in midterm verb style across 4 sets (Foundations, SOLID, Patterns, Construction/Mgmt) + full `_ANSWERS` with marking notes
- `03_Exam_Intelligence.md` — midterm sample autopsy + 25-row pattern-recognition master table + top-10 marks-per-hour skills
- `04_Emergency_Final_Review.md` — all 9 chapters in a 45-minute pass
- `05_Mock_Final_v1.md` + `_ANSWERS.md` — 100 marks, exact midterm section structure, Ch5–9 ≈66% weighted (Arena week)

## 🔥 OVERNIGHT INTEL (2026-06-11 build — the professor's style, decoded)
1. **Exam architecture (from his own 2025/26 midterm):** Section A) 10 MCQ ×2 · B) 3 structured ×16 with (a)(b)(c) sub-parts · C) one 32-mark scenario chained (a)–(g).
2. **Signature moves:** count-explicit verbs ("describe THREE…"), table-shaped 10-markers (4+1 views), **class-diagram→full-code questions worth 14+ marks**, and Section C scenario text that literally embeds answers in quotable phrases ("without altering existing logic" = OCP; "replace while preserving behavior" = LSP). UML drawn by hand is mandatory.
3. **Scope prediction: cumulative Ch1–9 weighted to Ch5–9 — 85% confidence** (CLO mapping + post-midterm meetings 6–14 are all SOLID/patterns/construction/management). Format confidence ~65% (one sample, but it's this year's own paper).
4. Known slide discrepancy: the Ch9 EVM example narrates "$6,333 over budget" where standard formulas give $3,333 — CH9 mastery teaches the textbook formulas and flags it. If it appears in the exam, show full working.

## ▶️ NEXT ACTION
**S1:** (1) Ask his Ch1–4 test score + whether official final scope is announced (log both here). (2) Walk through `03_Exam_Intelligence.md` — the embedded-answer trick in Section C changes how he reads questions. (3) Begin `CH1_Design_Process_Mastery.md` → first 4 questions of `Drill_CH1-4_Foundations.md`. Target: U1+U2 momentum, because Ch2 UML gates everything.

## 📜 SESSION LOG
- **S0 — 2026-06-10:** System initialized. Scope prediction logged (cumulative, Ch5–9 weighted). Material triage rule set (new > old).
- **S0.5 — 2026-06-11 (overnight build):** Full arsenal generated: 21 files. Midterm sample decoded (section architecture, signature verb patterns, embedded-answer scenarios). EVM slide discrepancy flagged.

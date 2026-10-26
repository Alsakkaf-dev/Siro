# CROSS — Subject Controller State File
**Course:** SCSM2223 Cross-Platform Application Development
**Student:** Mohammed Alsakkaf | **Final:** week of July 6, 2026 (FE = 30%) | **Syllabus deadline:** June 29

---

## ⚡ BOOT PROTOCOL (instructions for the AI reading this)
You are the **CROSS Controller**. Mohammed activated you with "Hello Cross". Do this, in order:
1. Read this entire file.
2. Greet with 3-line status: position, unlocked, today's target.
3. Resume from **NEXT ACTION**.
4. **Critical context:** Mohammed UNDERSTANDS this subject's concepts. His gap is **writing code from memory**. So this is retrieval training, not teaching from scratch. Minimal lecture, maximum drill.
5. Core method: **Broken Code Simulations** — show working snippets with critical lines deleted; he fills them; you grade character-precise (exact syntax matters in fill-in-the-blank exams). Escalate: missing 1 line → missing blocks → write whole function from a prompt.
6. Tech stack (NOT Java): HTML/CSS → JS (JSON/AJAX/Fetch/jQuery) → Vue.js → Node/Express → MySQL → JWT.
7. END OF SESSION (mandatory): update STATE, tick plan, append Session Log, rewrite NEXT ACTION.
8. Outputs (drill files like `Exam_Simulation_v1.js`, cheat sheets) → `Cross/Learning space/`.

## 📊 STATE
```
status:          not_started
progress:        0%
current_topic:   Ch1-5 fundamentals recall sweep
last_session:    S0 — 2026-06-10 (initialization only)
next_session_id: S1
```

## 🎯 EXAM INTEL (from the professor, via Mohammed)
- **Scope: ALL chapters (Ch1–13 per course info).**
- **Format: 30 marks MCQ + 70 marks = 5 structured questions** — code blocks with deleted lines to fill in correctly, "like the Java programming final" in style.
- Materials present: Ch1, 6, 7, 8, 9, 10, 11 slides + Labs 1–3 (Labs cover the Ch2–5 content: HTML/CSS/JS/JSON/AJAX/Fetch/jQuery).
- **GAPS: Ch12–13 materials missing** (per CI: Backend/Integration topics). Mohammed must pull these from eLearning or classmates. Ch2–5 have no slides — labs are the source.

## 🗺️ DEPENDENCY PLAN (strict order)
- [ ] **U1** Ch1 Web Landscape + Web Architecture (MCQ fodder, fast) — Jun 13
- [ ] **U2** Ch2–3 HTML/CSS recall drills (Lab 1 + 1B) — Jun 13
- [ ] **U3** Ch4–5 JS, JSON, AJAX, Fetch, jQuery (Lab 3 PDFs) — Jun 14
- [ ] **U4** Ch6 Vue Basics (directives, data binding, v-model, events) — Jun 17
- [ ] **U5** Ch7 Full Vue Apps (components, props, lifecycle) — Jun 18
- [ ] **U6** Ch8 Backend Node/Express (routes, middleware) — Jun 19
- [ ] **U7** Ch9 Server-Side (Ch9 slides + lab manual) — Jun 21
- [ ] **U8** Ch10 MySQL connection (queries from Node) — Jun 22
- [ ] **U9** Ch11 JWT & API security (sign/verify flow) — Jun 23
- [ ] **U10** Ch12–13 gap-fill (once materials sourced) — Jun 25
- [ ] **R1** Master cheat sheet: every syntax pattern likely to be blanked — Jun 26
- [ ] **A1** Mock Final: 30 MCQ + 5 broken-code structured questions, timed, strict grading — Jun 30–Jul 5

## 🧠 BRAIN MAP
- Strengths: conceptual understanding (self-reported — verify with diagnostics)
- Weaknesses: writing syntax from memory (the 70% zone)
- Baseline: comprehension OK, recall untested.

## 📚 ARSENAL (pre-built in `Cross/Learning space/` — USE THESE, don't regenerate)
- `01_Mastery/` — 7 stack-layer docs with ⚡-marked "most likely to be blanked" lines and annotated code from HIS course apps
- `02_Drills/` — 42 Broken-Code exercises across 5 sets (HTML/CSS/JS, Fetch/AJAX/JSON, Vue, Express/Slim routes, MySQL/JWT) + 40-MCQ bank, all with `_ANSWERS`
- `03_Exam_Intelligence.md` — predicted 5 structured questions with probabilities, 25 highest-probability blank targets, 12 traps
- `04_Emergency_Final_Review.md` — the syntax bible, stack-layer by stack-layer
- `05_Mock_Final_v1.md` + `_ANSWERS.md` — exact exam format: 30 MCQ + 5 structured ×14 marks (Arena week)

## 🔥 OVERNIGHT INTEL (2026-06-11 build — stack corrections, teach from this)
1. **⚠ THE COURSE RUNS TWO BACKENDS:** Express + mysql2 appears ONLY in Ch8 (Student Records). **Ch9–11 — including MySQL (Ch10 = PDO) and JWT (Ch11 = firebase/php-jwt, HS256) — are PHP Slim 4**, confirmed against the official course info. Node-only prep would forfeit large parts of the 70-mark section. Drills cover both stacks.
2. **Vue 3 Composition API ONLY** — CDN build with `const { createApp, ref } = Vue` + `setup()` in Ch6; `<script setup>` SFCs with Vite in Ch7+. Pinia stores are setup-function style. NEVER teach Options API.
3. **The professor reuses named app worlds** — Quick Notes, Kanban, WeatherNow, Profile Card, Todo SPA, Student Records, Books API — with signature idioms (event delegation, trim-then-guard, json() helper, role=admin delete). Exam blanks will be these exact lines; drills mirror them 1:1.
4. Ch5 has no slide deck (Lab 3 is the source — already integrated). Two Ch11 JWT PDFs are image-only scans; content was recovered from the pptx decks. Ch12–13 still missing (gap unchanged).

## ▶️ NEXT ACTION
**S1:** (1) Remind him: source Ch12–13 from eLearning. (2) Diagnostic: 5 exercises — one from each BrokenCode set — calibrates the Brain Map across the whole stack. (3) Then start `BrokenCode_Set3_Vue.md` (highest predicted exam weight) with `CH6_Vue_Basics_Mastery.md` open. Grade character-precise.

## 📜 SESSION LOG
- **S0 — 2026-06-10:** System initialized. Corrected subject identity (web stack, not Java). Exam format logged from professor's statement.
- **S0.5 — 2026-06-11 (overnight build):** Full arsenal generated: 23 files. Critical discoveries: dual backend (Express + PHP Slim), Vue 3 Composition API only, professor's recycled app worlds identified.

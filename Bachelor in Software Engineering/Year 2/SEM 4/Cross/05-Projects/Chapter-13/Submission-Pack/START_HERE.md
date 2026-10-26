# ✅ START HERE — Chapter 13 Submission Pack

**Course:** SCSM2223 — Cross-Platform Application Development
**Chapter 13:** Integration, Deployment & Mobile Wrapping
**What the lecturer (DR) actually grades:** a **5-minute screen-capture video** proving four things are live and connected — **MySQL DB → Slim API → Vue frontend → Capacitor mobile app**.

This pack contains the **complete, working code for all four layers** plus the exact steps and the **word-for-word video script** to record your submission. Nothing is missing — the backend that the lab said you "build on" (`Ch12_BooksAPI_Solution`) was not in the folder, so it has been **built in full** here and verified.

---

## 📁 What's in this folder

```
chapter_13_Cross/
├── START_HERE.md                 ← you are here (read this first)
├── SUBMISSION/
│   ├── VIDEO_SCRIPT.md           ← shot-by-shot 5–7 min recording script
│   ├── CHECKLIST.md              ← the DR's grading checklist + sign-off
│   ├── RUNBOOK.md                ← copy-paste commands to run the whole stack
│   ├── VERIFICATION_REPORT.md    ← what was machine-tested (all green)
│   └── intro_slide.html          ← ready-made video title slide (open, fill name, record)
├── Ch12_BooksAPI_Solution/       ← ★ NEW: the Slim 4 + JWT backend (complete)
│   ├── public/ src/ sql/ tests/  ← code, schema+seed, smoke tests
│   ├── Dockerfile  render.yaml   ← deploy the API as a public service
│   └── README.md
├── Ch13_FullStack_Solution/
│   ├── frontend/                 ← the Vue 3 + Vite + Capacitor app
│   └── deploy/DEPLOYMENT.md      ← detailed cloud deployment guide
├── Chapter13-VideoSubmission.pdf ← the DR's requirements (reference)
└── SCSM2223_Ch13_Lab_Manual.pdf  ← the lab manual (reference)
```

---

## 🎯 The 4 things your video must show (and where each is handled)

| # | Rubric section | Proof you record | Lives in |
|---|----------------|------------------|----------|
| 1 | **MySQL Database (Production)** | DB + tables + sample rows visible (phpMyAdmin / Workbench / terminal) | `Ch12_BooksAPI_Solution/sql/schema.sql` |
| 2 | **Slim API (Backend)** | API on a public URL; a **GET** (read) and a **POST/PUT** (write) returning JSON | `Ch12_BooksAPI_Solution/` |
| 3 | **Vue Frontend** | `npm run build`, `dist/` deployed, live URL loading data from the API | `Ch13_FullStack_Solution/frontend/` |
| 4 | **Capacitor Mobile** | `capacitor.config.json` correct; app running on an emulator and calling the API | `frontend/capacitor.config.json` |

---

## 🚀 Two ways to get there — pick one

### Path A — Full cloud deploy *(best marks: real public URLs)*
Recommended because the checklist explicitly says *"accessible via a public URL."*
1. **Database + API on Railway** (one project hosts both, free trial). 
2. **Frontend on Vercel** (free).
3. **Mobile** = Capacitor Android emulator pointing at the deployed API.

→ Full steps in **`Ch13_FullStack_Solution/deploy/DEPLOYMENT.md`**.

### Path B — Local "production-style" *(guaranteed, no accounts needed)*
The rubric literally allows showing the DB *"via phpMyAdmin"* and the API *"in browser or Postman."* You can record a complete, passing demo entirely on Laragon, and use a free tunnel (`ngrok` / `localtunnel`) for a public URL if you want to tick the "public URL" boxes.

→ Full steps in **`SUBMISSION/RUNBOOK.md`**.

> **Fastest realistic plan:** do **Path B first** to get a guaranteed working recording today, then optionally upgrade to **Path A** for the public URLs.

---

## ⏱️ 60-second overview of the flow

```
[ MySQL: books DB ]  ←PDO→  [ Slim API :8000 ]  ←HTTPS/JSON→  [ Vue dist/ ]  ←wrapped by→  [ Capacitor → Android WebView ]
   admin/member             JWT auth, /api/books            built with VITE_API_BASE_URL        same UI, native shell
   8 seeded books           GET read + POST/PUT write        = the public URL of the API
```

Seeded logins (password = `password`): `admin@books.test` (admin) · `member@books.test` (member).

---

## ▶️ Do this now

1. Read **`SUBMISSION/CHECKLIST.md`** — it's the exact rubric.
2. Follow **`SUBMISSION/RUNBOOK.md`** to bring the stack up.
3. Open **`SUBMISSION/VIDEO_SCRIPT.md`**, hit record, read the lines, click as directed.
4. Export MP4 → upload to the eLearning portal → done.

Everything has been built and verified end-to-end. You're recording a demo, not debugging a project.

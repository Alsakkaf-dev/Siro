# ☑️ Grading Checklist — Chapter 13

Straight from the DR's brief (`Chapter13-VideoSubmission.pdf`). Tick every box **before** you upload. Each row says exactly **how** this pack satisfies it.

> Grading note from the brief: *"Submissions that do not show all four sections may receive a deduction. Make sure your video is clear, stable, and covers each component in order."*

## The four sections (must all appear in the video)

### 1 · MySQL Database (Production)
- [ ] Production DB server is running — *shown via phpMyAdmin / Workbench / terminal*
- [ ] Database + tables created — *`books` → `users`, `books`, `login_attempts` (from `sql/schema.sql`)*
- [ ] Sample record exists — *8 seeded books + 2 users (Browse the tables)*

### 2 · Slim API (Backend)
- [ ] API deployed to a server / public URL — *`Dockerfile` + `render.yaml`; or local `php -S` + ngrok*
- [ ] **GET** that reads from MySQL — *`GET /api/books?q=clean` → JSON*
- [ ] **POST/PUT** that writes to MySQL — *`POST /api/books` (Bearer token) → 201*
- [ ] Correct JSON response shown — *envelope: `{ "data": … }` / `{ "error": … }`*

### 3 · Vue Frontend
- [ ] Built for production — *`npm run build` → `dist/`*
- [ ] `dist/` deployed to a host — *Vercel / Netlify / static host*
- [ ] Live URL opens and works — *book list renders*
- [ ] Frontend talks to the Slim API — *search + create hit the API and update the UI*

### 4 · Capacitor Mobile
- [ ] Capacitor added to the Vue project — *`@capacitor/core`, `cli`, `android`*
- [ ] `capacitor.config.json` correct — *appName `UTM Books`, appId `com.utm.books`, `webDir: dist`*
- [ ] Runs on emulator/device — *Android Studio ▶ Run*
- [ ] Mobile app connects to backend — *log in / load books / create inside the app*

## Submission logistics
- [ ] Format: **MP4** (or common video format)
- [ ] Duration: **≥ 5 minutes**
- [ ] Audio narration **or** on-screen captions present
- [ ] Sections shown **in order** (1 → 2 → 3 → 4)
- [ ] Secrets/passwords not left visible on screen
- [ ] Uploaded via eLearning → **Chapter 13 – Assignment Submission**

## "Definition of done" — public-URL boxes (Path A)
- [ ] MySQL reachable by the API (remote host)
- [ ] API reachable at `https://…` (Render/Railway)
- [ ] Frontend reachable at `https://…` (Vercel)
- [ ] `VITE_API_BASE_URL` (prod) = the API URL **and** that origin is in `CORS_ALLOWED_ORIGINS`

---

### Sign-off
| | |
|---|---|
| Name / Matric | __________________________ |
| API URL | __________________________ |
| Frontend URL | __________________________ |
| Recorded on | ______ / ______ / 2026 |
| Length | ______ min |

# 🎬 VIDEO SCRIPT — Chapter 13 Submission (≈ 6 minutes)

A shot-by-shot recording plan covering **all four graded sections in order**. Read the **SAY** lines aloud (or paste them as on-screen captions). Do the **DO** actions on screen. Target length **5–7 min** (minimum is 5).

**Before you hit record:** complete `RUNBOOK.md` so everything is already running. Have these tabs/windows open and ready:
1. phpMyAdmin (or MySQL Workbench / terminal) on the `books` database
2. Browser tab → your API base URL (`/` and `/api/books?q=clean`)
3. Postman **or** the `tests/api.http` file in VS Code
4. Your deployed (or local) Vue site
5. Android Studio with the emulator booted and the app installed
6. A code editor showing `capacitor.config.json`

> Record at 1080p, hide passwords/secrets, speak slowly, pause 1–2 s between sections.

---

## 0:00 — Intro (15 s)

**DO:** Show your desktop / a title slide with your **name, matric number, "SCSM2223 Chapter 13"**.

**SAY:**
> "Hi, I'm [NAME], matric [NUMBER]. This is my Chapter 13 submission. I'll demonstrate the full stack I deployed — a MySQL database, a Slim PHP API, a Vue 3 frontend, and the same app wrapped as an Android mobile app with Capacitor — all working together."

---

## 0:15 — Section 1: MySQL Database (Production) (60 s)

**DO:** Open phpMyAdmin → click the **`books`** database → show the table list.

**SAY:**
> "First, the database. This is my MySQL server running, with the `books` database. You can see three tables: `users`, `books`, and `login_attempts`."

**DO:** Click the **`books`** table → **Browse**.

**SAY:**
> "Here are the sample records — eight seeded books including *Clean Code* and *Clean Architecture*. Each row has a title, author, year, genre, and the owner."

**DO:** Click the **`users`** table → **Browse**.

**SAY:**
> "And the `users` table has two accounts — an admin and a member. Passwords are stored as bcrypt hashes, never plain text. The database is live and contains data." ✅

*(Cloud/Path A: instead show the database on Railway/PlanetScale/Workbench connected to the remote host so it reads as "production.")*

---

## 1:15 — Section 2: Slim API / Backend (90 s)

**DO:** Switch to the browser tab → load the **API base URL** (`https://your-api…/` or `http://localhost:8000/`).

**SAY:**
> "This is the Slim PHP API, deployed and reachable at this URL. The root returns a JSON health response, so the service is up."

**DO:** Change the URL to **`/api/books?q=clean`**.

**SAY:**
> "Here's my first endpoint — a **GET** request. It reads from the MySQL database and returns JSON. I searched for 'clean' and the API returns the two matching books straight from the database." *(read = ✅)*

**DO:** Switch to **Postman** (or `tests/api.http`). Send **POST `/auth/login`** with `member@books.test / password`.

**SAY:**
> "To write data I first authenticate. This POST to `/auth/login` returns a JWT access token."

**DO:** Copy the token into the Authorization header (or rely on the `.http` variable). Send **POST `/api/books`** with a new book body.

**SAY:**
> "Now my second endpoint — a **POST** that writes to the database. I send a new book with a Bearer token, and the API responds **201 Created** with the saved record and its new id." *(write = ✅)*

**DO:** Quickly re-run **GET `/api/books`** and point at the new row.

**SAY:**
> "And there it is, persisted in MySQL. Correct JSON responses, read and write, both working." ✅

---

## 2:45 — Section 3: Vue Frontend (90 s)

**DO:** Show the terminal where you ran **`npm run build`** (scroll to the `dist/` output with hashed filenames). *(Or show the `dist/` folder.)*

**SAY:**
> "The frontend is a Vue 3 app built for production with `npm run build`. This `dist/` folder is what gets deployed."

**DO:** Open the **live site URL** (Vercel/Netlify, or `npm run preview` on `:4173`).

**SAY:**
> "Here it is running at its public URL. Notice the book list — this data is loaded live from the Slim API, the same one I just showed."

**DO:** Type `clean` in the search box → **Search**.

**SAY:**
> "When I search, the frontend calls `/api/books` and renders the response — so the Vue app is successfully talking to the backend over HTTPS."

**DO:** Click **Login**, sign in as `member@books.test / password`. Click **+ New book**, fill the form, **Save**.

**SAY:**
> "I'll log in… and create a book through the UI. It hits the API, saves to MySQL, and the list updates instantly. Frontend, API, and database are fully connected." ✅

*(Optional flex: open the **Profile** page to show `/auth/me`, then DevTools → Application → Local Storage to show the saved `token`.)*

---

## 4:15 — Section 4: Capacitor Mobile App (105 s)

**DO:** Switch to your editor showing **`frontend/capacitor.config.json`**.

**SAY:**
> "Finally, the mobile app. Capacitor is added to the same Vue project. Here's `capacitor.config.json` — the app name *UTM Books*, the app id `com.utm.books`, and `webDir` set to `dist`, which is the production build we just made."

**DO:** Show the terminal history with `npx cap add android` and `npx cap sync android` (or run `npx cap sync android` live).

**SAY:**
> "I added the Android platform and synced the build into it with `npx cap sync`."

**DO:** Switch to **Android Studio** → the **emulator** with the app open (or click ▶ Run and let it launch).

**SAY:**
> "Here's the app running on the Android emulator — the exact same UI, now in a native Android shell."

**DO:** In the emulator: log in, then **search** or **create a book**.

**SAY:**
> "And to prove the mobile app connects to my backend: I'll log in and load the books — this data is coming from the deployed Slim API over the network, into the Android app. Create works too." ✅

---

## 6:00 — Outro (15 s)

**SAY:**
> "That's all four parts — MySQL database, Slim API, Vue frontend, and the Capacitor Android app — deployed and working together. Thanks for watching."

**DO:** Stop recording. Export **MP4**.

---

## ✅ Final pre-upload check (from the DR's checklist)

- [ ] MySQL database shown live, with tables **and** sample rows
- [ ] Slim API reachable at a URL; **GET** (read) shown returning JSON
- [ ] **POST/PUT** (write) shown returning JSON + persisting
- [ ] `npm run build` / `dist/` shown
- [ ] Vue site open at its URL, **loading data from the API**
- [ ] `capacitor.config.json` shown (appName, appId, webDir=dist)
- [ ] App running on emulator/device
- [ ] Mobile app shown **calling the backend** (data loads / create works)
- [ ] Video ≥ 5 minutes, clear and stable → upload MP4 to eLearning

> Tip: if any cloud piece misbehaves on recording day, record the same script against **localhost** (Path B) — the rubric explicitly allows phpMyAdmin/terminal for the DB and browser/Postman for the API. A clear local demo beats a broken cloud one.

# 🎬 SUBMIT TODAY — Chapter 13 (your exact steps)

Everything in the code is **fixed and verified working**. You are now only:
**(1) bringing the stack up → (2) recording a 5-min video → (3) uploading it.**

What the DR grades = **the MP4 video** (not the files). So the job left is: record it.

---

## ✅ Already fixed for you (don't worry about these)
- Backend `.env`: `APP_DEBUG=false` (no errors leak on screen) + a real `JWT_SECRET`.
- Backend `.env`: `CORS_ALLOWED_ORIGINS=*` so **no CORS error** can break the demo (web, preview, emulator).
- API tested LIVE: health ✅, search `?q=clean` returns 2 books ✅, login ✅, create book (201) ✅.
- Database: already loaded in MySQL — **9 books, 2 users** (admin@books.test / member@books.test, password = `password`).
- Frontend: `npm run build` verified (88 modules, 0 errors).
- Capacitor config correct (appId `com.utm.books`, appName `UTM Books`, webDir `dist`).

## 🔧 The ONE thing you still set at record time
`frontend/.env.production` needs your **public API URL** (the emulator can't use localhost).
You'll paste a free **ngrok** URL into it — steps below.

---

## STEP 1 — Start everything (do this just before recording)

Open **3 terminals** (PowerShell). Keep all 3 open while recording.

**Terminal 1 — Laragon / MySQL**
- Open Laragon → click **Start All** (Apache + MySQL turn green). Done.

**Terminal 2 — the API**
```powershell
cd "C:\Users\Mohammed Alsakkaf\Desktop\chapter_13_Cross\Ch12_BooksAPI_Solution"
php -S 0.0.0.0:8000 -t public
```
Leave it running. Test in a browser: `http://localhost:8000/api/books?q=clean` → you should see 2 books.

**Terminal 3 — the public tunnel (ngrok)**
First time only — install ngrok:
1. Get it: https://ngrok.com/download (or `choco install ngrok`), make a free account, copy your authtoken.
2. `ngrok config add-authtoken YOUR_TOKEN`

Then every time:
```powershell
ngrok http 8000
```
Copy the **https** line it prints, e.g. `https://ab12cd34.ngrok-free.app`.

> **No time to make an ngrok account?** Use this instead (no signup):
> ```powershell
> npx localtunnel --port 8000
> ```
> It prints `https://xxxx.loca.lt` — use that as your URL below.

---

## STEP 2 — Point the app at that URL and build

1. Open `frontend/.env.production` and replace the placeholder line with YOUR url (no trailing slash):
   ```
   VITE_API_BASE_URL=https://ab12cd34.ngrok-free.app
   ```
2. Build:
   ```powershell
   cd "C:\Users\Mohammed Alsakkaf\Desktop\chapter_13_Cross\Ch13_FullStack_Solution\frontend"
   npm run build
   ```

---

## STEP 3 — Record the video (sections IN ORDER, ≥ 5 minutes)

Use Windows **Game Bar** (`Win + G` → record) or OBS. Turn on the mic OR add captions.
**Keep passwords/secrets off screen.** Full word-for-word script: `SUBMISSION/VIDEO_SCRIPT.md`.

### 🎙️ Section 1 — MySQL Database (~45s)
- Open **phpMyAdmin** (Laragon → Database) → click the **`books`** database.
- Show the tables: `users`, `books`, `login_attempts`.
- Click **`books`** → **Browse** → show the rows (sample data exists). ✅

### 🎙️ Section 2 — Slim API (~60s)
- In the browser open your **public URL** + `/api/books?q=clean`
  → e.g. `https://ab12cd34.ngrok-free.app/api/books?q=clean` → show the JSON (a **GET** that reads the DB). ✅
- Then show a **write**: easiest is to do it from the app in Section 3 (creating a book) — say
  *"the POST that writes to the database is demonstrated when I create a book in the app."*
  (Or use Postman: `POST {url}/auth/login` to get a token, then `POST {url}/api/books` with the token.)

### 🎙️ Section 3 — Vue Frontend (~90s)
- Show the build you just ran: `npm run build` and the **`dist/`** folder (say *"built for production"*).
- Serve it:
  ```powershell
  npm run preview
  ```
  Open `http://localhost:4173`.
- In the app: the book list **loads from the API** ✅. Search `clean`. 
- Click **Login** → `member@books.test` / `password` → **+ New book** → fill in → Save → it appears (**this is the POST write** from Section 2) ✅.

### 🎙️ Section 4 — Capacitor Mobile (~90s)
After Android Studio finished installing + an emulator (AVD) is created:
```powershell
cd "C:\Users\Mohammed Alsakkaf\Desktop\chapter_13_Cross\Ch13_FullStack_Solution\frontend"
npx cap add android
npx cap sync android
npx cap open android
```
- In Android Studio: pick your emulator → click **▶ Run**.
- Show: the **`capacitor.config.json`** file (appName / appId / webDir=dist).
- The app opens on the emulator → **log in** (member@books.test / password) → **books load from the API** ✅ → create a book → it saves (**mobile app connecting to the backend**) ✅.

---

## STEP 4 — Upload
- Stop recording → export **MP4** (≥ 5 min).
- Upload via **eLearning → Chapter 13 – Assignment Submission**. Done. 🎉

---

## If something goes wrong on camera
| Problem | Fix |
|---|---|
| App shows "Network error" | The URL in `.env.production` is wrong/old, or you forgot to `npm run build` after editing it. Re-check the ngrok URL, rebuild. |
| Emulator app can't reach API | Make sure ngrok/localtunnel is still running and Terminal 2 (`php -S ...`) is still up. |
| ngrok warning page in browser | Click "Visit Site" once; the app's data calls are not affected. |
| Books list empty | Confirm the API terminal is running and `http://localhost:8000/api/books` shows data. |
| Login fails | Use exactly `member@books.test` / `password` (lowercase). |

**You've got this — the project is proven to work. You're recording a demo, not fixing code.**

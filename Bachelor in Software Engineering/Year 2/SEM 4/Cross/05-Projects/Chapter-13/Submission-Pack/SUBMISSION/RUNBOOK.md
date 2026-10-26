# 🛠️ RUNBOOK — bring the whole stack up

Copy-paste commands to run **MySQL → Slim API → Vue → Capacitor** locally, then (optionally) expose public URLs. Tested against the code in this pack.

> Windows paths assume **Laragon**. Run frontend commands in the `frontend/` folder and backend commands in the `Ch12_BooksAPI_Solution/` folder.

---

## 0. One-time prerequisites

| Tool | Check | Get it |
|------|-------|--------|
| PHP 8.1+ | `php -v` | bundled with Laragon |
| Composer | `composer -V` | bundled with Laragon |
| MySQL | Laragon → **Start All** | bundled with Laragon |
| Node 18+ | `node -v` | nodejs.org |
| Android Studio | optional | developer.android.com |

---

## 1. Database (MySQL)

Start Laragon → **Start All** (Apache + MySQL go green). Then load the schema + seed:

```bash
# from Ch12_BooksAPI_Solution/
mysql -u root < sql/schema.sql
```

(No CLI? Open **phpMyAdmin** from Laragon → *Import* → choose `sql/schema.sql` → *Go*.)

Verify:

```sql
USE books;
SHOW TABLES;             -- users, books, login_attempts
SELECT id,title,author,year FROM books;   -- 8 rows incl. "Clean Code"
SELECT email,role FROM users;             -- admin@/member@books.test
```

---

## 2. Backend (Slim API)

```bash
# from Ch12_BooksAPI_Solution/
composer install
copy .env.example .env          # macOS/Linux: cp .env.example .env
```

Now open `.env` in an editor and set two things:

1. **`JWT_SECRET`** — generate one and paste the printed value in:
   ```bash
   php -r "echo bin2hex(random_bytes(32));"   # copy the output into  JWT_SECRET=<here>
   ```
   *(The app still boots with the placeholder from `.env.example`, but use a real one.)*
2. **`CORS_ALLOWED_ORIGINS`** — must include your frontend origin(s):
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
   ```

Then start the API:

```bash
php -S localhost:8000 -t public
```

Smoke-test it (new terminal):

```bash
bash tests/smoke.sh             # expect: all PASS
# or just open in a browser:
#   http://localhost:8000/                 (health JSON)
#   http://localhost:8000/api/books?q=clean  (2 books)
```

The two **endpoints for the video** (read + write):

```bash
# GET (read from MySQL)
curl http://localhost:8000/api/books?q=clean

# POST (write to MySQL) — log in first to get a token
TOKEN=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"member@books.test","password":"password"}' \
  http://localhost:8000/auth/login | grep -o '"access_token":"[^"]*"' | sed 's/.*:"//;s/"//')

curl -X POST http://localhost:8000/api/books \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"My New Book","author":"Me","year":2026,"genre":"Demo"}'
```

---

## 3. Frontend (Vue 3 + Vite)

```bash
# from Ch13_FullStack_Solution/frontend/
npm install

# DEV mode (talks to http://localhost:8000 via .env.development)
npm run dev                      # http://localhost:5173

# PRODUCTION build (talks to .env.production)
#   set frontend/.env.production -> VITE_API_BASE_URL=<your API URL>
npm run build                    # outputs dist/
npm run preview                  # serves dist/ on http://localhost:4173
```

Walk through the lab's end-to-end test on `:5173`:
log in as `member@books.test / password` → search `clean` → **+ New book** (201) → edit your book (200) → try editing a book you don't own (Edit hidden / 403) → log in as `admin@books.test` → delete a book (200) → open **Profile**.

---

## 4. Mobile (Capacitor → Android)

```bash
# from Ch13_FullStack_Solution/frontend/
npm install @capacitor/core @capacitor/cli @capacitor/android

# IMPORTANT: build with the API URL the PHONE can reach (see note below)
npm run build

npx cap add android              # one-time, creates android/
npx cap sync android             # copies dist/ + plugins into android/
npx cap open android             # opens Android Studio -> click ▶ Run
```

`capacitor.config.json` is already correct:

```json
{ "appId": "com.utm.books", "appName": "UTM Books", "webDir": "dist",
  "server": { "androidScheme": "https" } }
```

**The phone/emulator cannot reach `localhost`.** Before `npm run build`, set `frontend/.env.production` `VITE_API_BASE_URL` to **either**:
- your **deployed API URL** (Path A — best), or
- your PC's **LAN IP**, e.g. `http://192.168.1.50:8000`, and start the API with `php -S 0.0.0.0:8000 -t public` (Path B), or
- an **ngrok** HTTPS tunnel (below).

---

## 5. (Optional) Public URLs without cloud accounts — tunnels

Get an instant public HTTPS URL for the API so the frontend/mobile can reach it and you can tick the "public URL" boxes:

```bash
# with the API running on :8000
npx ngrok http 8000
# -> https://xxxx.ngrok-free.app   (use this as VITE_API_BASE_URL, and add it to CORS_ALLOWED_ORIGINS)
```

For full managed cloud hosting (Railway / Render / Vercel), follow
**`Ch13_FullStack_Solution/deploy/DEPLOYMENT.md`**.

---

## Troubleshooting (fast)

| Symptom | Fix |
|---------|-----|
| CORS error in console | Add the frontend origin to `CORS_ALLOWED_ORIGINS` in `.env`, restart API |
| 401 on every call | Token not attached — re-login; check `Authorization: Bearer …` in DevTools |
| Network error | Wrong `VITE_API_BASE_URL`; rebuild after editing `.env.production` |
| `npm run build` import error | A view/component path is wrong/case-sensitive — paths in this pack are correct |
| Capacitor sync fails | Run `npx cap add android` first |
| Phone can't reach API | Use deployed URL, LAN IP, or ngrok (not `localhost`) |

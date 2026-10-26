# 🚀 Deployment Guide — Books Full-Stack (Ch13)

Deploy the full stack to **public URLs** so your video can tick the *"accessible via a public URL"* boxes:

```
MySQL (cloud)  →  Slim API (Docker web service)  →  Vue dist/ (Vercel)  →  Capacitor Android (points at the API URL)
```

Two backend recipes are given:
- **Recipe R — Railway** *(recommended: MySQL + API in one project)*
- **Recipe D — Render** *(API via Docker + external MySQL)*

Pick **one**. Frontend is **Vercel** either way. Total time ≈ 30–40 min the first time; everything is free-tier friendly.

---

## 0. Pre-flight

```bash
# Generate a production JWT secret (use the output, keep it secret):
php -r "echo bin2hex(random_bytes(32)).PHP_EOL;"
```

- [ ] `Ch12_BooksAPI_Solution/` pushed to its **own GitHub repo** (it already contains `Dockerfile` + `render.yaml`).
- [ ] `Ch13_FullStack_Solution/frontend/` pushed to a **separate GitHub repo**.
- [ ] `.env` is **not** committed (only `.env.example`). It's already in `.gitignore`.

---

## Recipe R — Railway (MySQL + API together) ★ recommended

### R1. Create the MySQL database
1. <https://railway.app> → **New Project** → **Provision MySQL**.
2. Open the MySQL service → **Variables** / **Connect** tab. Note `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`.
3. **Data** tab → **Query** (or connect with MySQL Workbench using those creds) → paste the contents of `Ch12_BooksAPI_Solution/sql/schema.sql` → run.
   - Tables `users`, `books`, `login_attempts` + seed data are created.

### R2. Deploy the API
1. Same project → **New** → **GitHub Repo** → pick the **backend** repo. Railway detects the `Dockerfile` and builds it.
2. The API service → **Variables** → add:
   ```
   APP_DEBUG=false
   DB_DRIVER=mysql
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASS=${{MySQL.MYSQLPASSWORD}}
   JWT_SECRET=<paste the 64-char secret>
   JWT_ISSUER=books-api
   JWT_TTL=3600
   CORS_ALLOWED_ORIGINS=http://localhost:5173
   ```
   *(The `${{MySQL.*}}` references pull live values from the DB service.)*
3. API service → **Settings** → **Networking** → **Generate Domain**. You get e.g. `https://books-api-production.up.railway.app`.
4. Test it: open `https://…/` (health JSON) and `https://…/api/books?q=clean` (2 books).

→ Skip Recipe D, go to **Frontend (Vercel)**.

---

## Recipe D — Render (Docker) + external MySQL

### D1. MySQL (Render has no MySQL — use one of these free options)
- **Railway MySQL** (just the DB part of Recipe R), or
- **Aiven for MySQL** (free plan), or
- **PlanetScale** (MySQL-compatible), or
- **clever-cloud** MySQL add-on.

Create the DB, then load the schema:
```bash
mysql -h <host> -P <port> -u <user> -p<password> <dbname> < Ch12_BooksAPI_Solution/sql/schema.sql
```

### D2. API on Render
1. <https://render.com> → **New** → **Blueprint** → select the backend repo (it contains `render.yaml`).
   *(Or **New → Web Service → Docker** and let it use the `Dockerfile`.)*
2. Set the env vars (Render generates `JWT_SECRET` automatically per `render.yaml`):
   ```
   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS   = your MySQL creds
   CORS_ALLOWED_ORIGINS                          = (set after the frontend deploys)
   APP_DEBUG=false
   ```
3. Deploy → note the URL, e.g. `https://books-api.onrender.com`.
4. Test `https://…/` and `https://…/api/books`.
   *(Free Render services sleep when idle; the first request after a nap takes ~30 s — load the URL once before recording.)*

---

## Frontend — Vercel

1. Set the production API URL in the repo: edit `frontend/.env.production`
   ```
   VITE_API_BASE_URL=https://<your-api-domain>
   ```
   Commit & push.
2. <https://vercel.com> → **Add New → Project** → import the **frontend** repo.
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - (Optional) add env var `VITE_API_BASE_URL` = your API URL (same value).
3. **Deploy** → you get `https://your-books.vercel.app`.

### Wire CORS (one-line gotcha)
Go back to the **API** env vars and set:
```
CORS_ALLOWED_ORIGINS=https://your-books.vercel.app,http://localhost:5173
```
Redeploy/restart the API. Open the Vercel site → the book list should load with **no CORS error** in the console.

> Netlify alternative: `npm i -g netlify-cli && npm run build && netlify deploy --prod --dir=dist`, then set `VITE_API_BASE_URL` in Site settings → Environment.

---

## Mobile — Capacitor Android (points at the deployed API)

Because the WebView talks to your **deployed** API (not localhost), build with the production URL **first**:

```bash
# from frontend/
# 1. frontend/.env.production -> VITE_API_BASE_URL=https://<your-api-domain>
npm run build

npm install @capacitor/core @capacitor/cli @capacitor/android   # if not already
npx cap add android        # one-time
npx cap sync android       # copies the fresh dist/ into android/
npx cap open android       # Android Studio -> ▶ Run on an emulator
```

In the emulator: log in (`member@books.test / password`), browse + create a book — it round-trips to the cloud API. ✅

### Optional: signed release APK
```bash
keytool -genkey -v -keystore release.keystore -alias books -keyalg RSA -keysize 2048 -validity 10000
# Android Studio → Build → Generate Signed Bundle / APK → APK → Release → pick keystore
```

---

## Verify the deployed stack

```bash
# from Ch12_BooksAPI_Solution/
bash tests/smoke.sh https://<your-api-domain>      # expect all PASS
```

Final checks:
- [ ] `https://<api>/` returns health JSON; `https://<api>/api/books` returns data.
- [ ] Vercel site loads books (no CORS error in console).
- [ ] Login + create/edit/delete work end-to-end on the deployed URLs.
- [ ] Android app (built with the prod URL) logs in and loads books.

---

## Post-launch (nice-to-have)
- Uptime check on `/api/health` (UptimeRobot / Better Stack).
- Daily DB backup.
- Rotate `JWT_SECRET` on suspected leak (invalidates all sessions).
- Set `APP_DEBUG=false` in production (already the default in the recipes).

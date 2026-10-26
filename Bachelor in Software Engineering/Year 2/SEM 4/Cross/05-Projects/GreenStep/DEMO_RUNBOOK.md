# GreenStep — Demo Runbook (Mohammed, Backend/API Lead)

## Why the website says "Failed to fetch"
The Vue frontend calls the API at `http://localhost:8080` (see Frontend/src/services/api.js).
"Failed to fetch" = the browser could NOT reach that API = **the PHP API server on :8080 is not running.**
(Also: the email you tried, `member@books.test`, is not a real account — use a seeded one below.)
CORS is `*` (open), so CORS is NOT the problem. MySQL is already running.

## Get it working (≈2 minutes)
1. **MySQL** — Laragon already running (green). If not: open Laragon → Start All.
2. **Database seeded?** In HeidiSQL, confirm the `greenstep` DB has a `User` table with rows.
   If empty/missing: run `Backend/sql/schema.sql` then `Backend/sql/seed.sql`.
3. **Start the API** — double-click **START_API.bat** (or in Laragon Terminal, in the Backend folder):
       php -S localhost:8080 -t public public\index.php
   Leave that window open. Verify in a browser: http://localhost:8080/api/health
   → should show:  {"success":true,"data":"ok"}
4. **Start the frontend** — double-click **START_FRONTEND.bat** (or in Frontend folder: `npm run dev`),
   then open the printed http://localhost:5173
5. **Log in with a REAL seeded account** (login = email):
   - User:   member@greenstep.com  /  password
   - Leader: leader@greenstep.com  /  password
   - Admin:  admin2@greenstep.com  /  password

## Postman demo (your backend part) — base URL http://localhost:8080
1. GET  /api/health                         → 200 {"success":true,"data":"ok"}
2. POST /api/auth/login
     Body → raw → JSON:
     { "email": "admin2@greenstep.com", "password": "password" }
   → 200, copy the "token" from the response.
3. GET  /api/dashboard
     Header → Authorization: Bearer <paste token>   → 200 with today/week/badges
4. (Admin power) GET /api/admin/stats            with the same Bearer token → 200
   GET /api/admin/users                          → list of users (RBAC)
Talking point: JWT is issued on login, verified by JwtAuthMiddleware on every
protected route; wrong/no token → 401, wrong role → 403. PDO prepared statements
(EMULATE_PREPARES=false) = SQL-injection safe. CO2 is computed server-side.

## The DEPLOYED (Netlify) site
It "Failed to fetch" because its build has no reachable API (VITE_API_URL not set to the
live Render HTTPS URL, or it points at localhost / http = mixed-content on an https page).
For the Dr's demo, use the LOCAL setup above — it's reliable.
To fix deployed later: Netlify → Site settings → Environment → set VITE_API_URL to the
Render API's https URL → redeploy.

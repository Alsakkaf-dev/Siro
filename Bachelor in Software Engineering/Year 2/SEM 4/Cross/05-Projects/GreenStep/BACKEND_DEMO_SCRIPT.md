# GreenStep — Backend/API Demo Script (Mohammed, Backend & API Lead)
Collection: "GreenStep API - RM2Z (SCSM2223)" · base http://localhost:8080 · ~5 min

## Before the Dr looks
- Keep the "GreenStep API - localhost:8080" window OPEN (that's the live server).
- In Postman, first run 1·Auth → Login (ADMIN) so the {{token}} variable is set.
- Response view = Pretty / JSON. Read the STATUS CODE aloud each time.

## OPENING (20s)
"I'm the Backend & API Lead. I built the server side in PHP Slim 4 — a stateless
REST API: 9 controllers, 33 endpoints, JWT auth with role-based access, a hardened
PDO data layer, and a server-side carbon-calculation engine. I'll test it live in Postman."

## ACT 0 — The API is alive (15s)
DO:  0·Health check → GET /api/health → Send
SEE: 200 OK  {"success":true,"data":"ok"}
SAY: "Health check confirms the API is up. Every response uses one uniform JSON
      envelope — a success flag plus data — so the Vue frontend parses them all the same way."

## ACT 1 — Auth & JWT (60s)
DO:  1·Auth → POST Login (ADMIN) → Send
SEE: 200 OK — token + user {role:"admin"} · Test Results 2/2 pass
SAY: "Login verifies the password with bcrypt via password_verify — timing-safe — then
      issues a stateless JSON Web Token signed with HS256. The token carries the user id
      and role as claims and expires in one hour. My test script auto-saves this token to a
      collection variable, so every protected request reuses it — no manual copy-paste."
(optional) DO: POST Register → Send → 201
SAY: "Registration enforces a server-side password policy — min 8 chars, one uppercase,
      one number — read live from the Settings table, not hard-coded."

## ACT 2 — Protected features + SERVER-SIDE CO2 (90s)  ← the star
DO:  2·User → POST /api/logs  (activity_type_id 1 = Car, amount 10 km) → Send → 201 {id}
SAY: "I log a daily activity: 10 km by car. Notice the client only sends the amount —
      it never calculates carbon."
DO:  2·User → GET /api/dashboard → Send → 200
SAY: "The SERVER computes everything: CO2 = amount × the DEFRA emission factor stored in
      the DB — 10 km × 0.17 = 1.7 kg — plus the 7-day trend, the logging streak, and automatic
      badge evaluation. All server-side, so the numbers are authoritative and tamper-proof."
DO:  GET /api/activity-types · GET /api/challenges · GET /api/badges  (quick)
SAY: "Activity-types is the emission-factor catalogue; challenges compute collective progress
      with a baseline-vs-during comparison; badges are awarded from JSON criteria."

## ACT 3 — Role-Based Access Control (45s)
DO:  3·Admin → GET /api/admin/stats → Send → 200 (total_users, challenges, badges)
DO:  3·Admin → GET /api/admin/users → Send → 200 (user list)
SAY: "With an admin token I reach the admin surface — stats, user management, emission
      factors, settings."
DO:  1·Auth → POST Login (USER) → Send   (token is now a normal user)
DO:  3·Admin → GET /api/admin/stats → Send → 403 FORBIDDEN
SAY: "Same admin route, but now with a standard-user token: 403 Forbidden. The
      JwtAuthMiddleware checks the role claim inside the token — a normal user physically
      cannot reach admin endpoints."

## ACT 4 — Security proofs (30s)
DO:  4·Security → GET /api/dashboard (NO token) → Send → 401 UNAUTHORIZED
SAY: "No token, no access — 401."
DO:  1·Auth → POST Login (WRONG password) → Send → 401
SAY: "Wrong password returns a generic 401 — identical whether the email exists or not —
      to block user-enumeration."
CAPSTONE: "And on the data layer every query uses PDO prepared statements with emulation
      disabled, so user input is never interpreted as SQL — my structural defense against
      SQL injection."

## CLOSE (15s)
"So: 9 controllers, 33 REST endpoints, stateless JWT + RBAC, bcrypt, PDO-hardened,
and an authoritative server-side carbon engine. Questions welcome."

## Q&A — likely questions + sharp answers
- How does JWT work? "A signed token issued at login. It carries claims — sub (user id),
  role, iat, exp. Every request sends it in the Authorization header; the middleware verifies
  the HS256 signature and expiry before the request reaches a controller. Stateless — no server session."
- 401 vs 403? "401 = not authenticated (missing/invalid/expired token). 403 = authenticated
  but the role claim isn't allowed."
- SQL-injection defense? "PDO prepared statements with ATTR_EMULATE_PREPARES = false — MySQL
  receives the query and the parameters separately, so input can never become SQL."
- Where is CO2 calculated? "Server-side, in SQL: amount × kg_co2_per_unit. Factors live in the
  DB and only an admin can change them — clients never compute footprints."
- How are badges awarded? "BadgeEvaluator reads each badge's criteria_json (total_logs /
  streak_days / category_logs) and INSERT IGNOREs into User_Badge when the threshold is met."
- Why Slim 4? "A lightweight PSR-7/PSR-15 micro-framework — fast, minimal, ideal for a focused REST API."
- Stolen token? "One-hour expiry limits the window; HTTPS in production; refresh/rotation is the next step."

## If something breaks
- Any protected call returns 401 mid-demo → just re-run Login (ADMIN); the token expired (1h).
- 'Failed to fetch' / connection error → the API window closed; double-click START_API.bat.
- Go slow. Read the status code. Let the green 200 (and the red 401/403) speak.

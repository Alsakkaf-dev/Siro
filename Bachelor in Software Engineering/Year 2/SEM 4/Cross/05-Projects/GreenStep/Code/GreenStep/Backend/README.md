# GreenStep — Backend API

PHP **Slim 4** RESTful API for GreenStep (Personal Carbon Footprint & Eco Lifestyle Tracker).
Stack: PHP 8.1+ · Slim 4 · PDO/MySQL · Firebase JWT.

> Maintained by **Mohammed Alsakkaf — Backend & API Lead**. Database schema & security policy are owned by **Member 3 — Database & Security Lead**.

## Project structure

```
Backend/
├── public/
│   └── index.php            # single entry point (front controller)
├── config/
│   └── settings.php         # env-driven config (db, jwt)
├── src/
│   ├── Database/
│   │   └── Database.php      # hardened PDO connection factory
│   ├── Middleware/
│   │   ├── CorsMiddleware.php
│   │   └── JwtAuthMiddleware.php   # verifies JWT + role gate
│   ├── Support/
│   │   ├── JsonResponse.php        # uniform success/error envelopes
│   │   ├── JsonErrorHandler.php    # exceptions -> JSON, never HTML
│   │   ├── BadgeEvaluator.php      # streak + badge criteria/awarding (shared)
│   │   └── ChallengeProgress.php   # collective baseline-vs-during progress
│   ├── Controllers/
│   │   ├── AuthController.php       # register + login (implemented)
│   │   ├── LogController.php        # activity logs (CRUD #1) + dashboard
│   │   ├── ChallengeController.php  # challenges (CRUD #2) + join + progress
│   │   ├── BadgeController.php      # badge catalogue (View all)
│   │   ├── TipController.php        # daily eco-tip
│   │   └── AdminController.php      # tips + emission factors (admin)
│   └── Routes/
│       └── Api.php          # the API contract, expressed in code
├── sql/
│   └── schema.sql           # minimal starter schema (Rawan owns final)
├── .env.example
├── .gitignore
└── composer.json
```

## Setup

```bash
cd Backend
composer install                 # restore dependencies into vendor/
cp .env.example .env             # then edit .env with your DB + JWT secret
php -r "echo bin2hex(random_bytes(32));"   # generate a JWT_SECRET, paste into .env
mysql -u root -p < sql/schema.sql          # create DB + tables (dev only)
composer start                   # serve at http://localhost:8080
```

Verify it's alive:

```bash
curl http://localhost:8080/api/health
# {"success":true,"data":"ok"}
```

## Response envelope

Every endpoint returns the same shape:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "message": "...", "details": "..." } }
```

## API contract

| Method | Route | Body | Access | Success |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | Public | 201 |
| POST | `/api/auth/login` | `{ email, password }` | Public | 200 |
| GET | `/api/logs` | — | User | 200 |
| POST | `/api/logs` | `{ activity_type_id, amount, logged_on }` | User | 201 |
| PUT | `/api/logs/{id}` | `{ activity_type_id, amount, logged_on }` | User | 200 |
| DELETE | `/api/logs/{id}` | — | User | 200 |
| GET | `/api/dashboard` | — | User | 200 |
| GET | `/api/tips/daily` | — | User | 200 |
| GET | `/api/badges` | — | User | 200 |
| GET | `/api/challenges` | — | User | 200 |
| GET | `/api/challenges/{id}` | — | User | 200 |
| POST | `/api/challenges/{id}/join` | — | User | 201 |
| POST | `/api/challenges` | `{ name, description, start_date, end_date, target_co2_reduction }` | Leader | 201 |
| PUT | `/api/challenges/{id}` | `{ name, description, target_co2_reduction }` | Leader | 200 |
| DELETE | `/api/challenges/{id}` | — | Leader | 200 |
| POST | `/api/admin/tips` | `{ title, body, category }` | Admin | 201 |
| PUT | `/api/admin/factors/{id}` | `{ kg_co2_per_unit }` | Admin | 200 |

Protected routes require an `Authorization: Bearer <token>` header.

> Rows below the original 14-route PR1 contract (`/api/badges`, `/api/challenges/{id}`)
> are additive gamification endpoints for the Streaks/Badges/Challenge-logic milestone.

## Gamification response shapes (for the frontend)

**`GET /api/badges`** — every badge with the caller's earned/locked status (powers
"Badges → View all"). Re-evaluates criteria first, so a just-earned badge shows up.

```json
{ "success": true, "data": [
  { "badge_id": 1, "name": "Eco Beginner", "image_url": "",
    "criteria": { "type": "total_logs", "threshold": 1 },
    "earned": true,  "awarded_on": "2026-06-09 10:00:00" },
  { "badge_id": 2, "name": "Green Streak", "image_url": "",
    "criteria": { "type": "streak_days", "threshold": 7 },
    "earned": false, "awarded_on": null }
] }
```

**`GET /api/challenges`** — each card now also carries collective progress:
`member_count`, `is_joined` (0/1), `collective_saved_kg`, `progress_pct` (0–100),
`days_left`.

**`GET /api/challenges/{id}`** — challenge detail + a ranked leaderboard:

```json
{ "success": true, "data": {
  "id": 1, "name": "Reduce 20% CO2 This Week", "description": "...",
  "start_date": "2026-06-01", "end_date": "2026-06-07",
  "target_co2_reduction": "20.00",
  "member_count": 15, "is_joined": 1,
  "collective_saved_kg": 9.0, "progress_pct": 45.0, "days_left": 4,
  "leaderboard": [
    { "user_id": 7, "name": "Lucy", "saved_kg": 3.2 },
    { "user_id": 9, "name": "Sam",  "saved_kg": 1.1 }
  ]
} }
```

Progress = baseline-vs-during reduction: footprint in the equal-length window *before*
the challenge minus footprint *during* it, summed across members, as a % of
`target_co2_reduction`. No schema change — computed from existing `Activity_Log` rows.

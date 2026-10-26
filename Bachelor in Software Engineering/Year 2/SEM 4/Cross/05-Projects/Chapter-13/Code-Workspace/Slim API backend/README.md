# Books API — SCSM2223 Chapter 12 (hardened backend)

A small, production-style **REST API** built with **Slim 4** and a **dependency-free HS256 JWT** layer. It is the backend that the Chapter 13 Vue 3 frontend (`../Ch13_FullStack_Solution/frontend`) consumes, and the API you deploy + demonstrate for the Chapter 13 video.

## Features

- **JWT auth** — register / login / `me`, `Authorization: Bearer <token>`.
- **Books CRUD** with **search** (`/api/books?q=`), **ownership** (members edit only their own books), and **role** rules (admins manage everything).
- **Hardened**: bcrypt password hashing, constant-time checks, login throttling (HTTP 429), strict validation (HTTP 422), env-driven CORS, no user enumeration, JSON error envelope.
- **Portable**: MySQL in production, optional SQLite for zero-config local testing — switch with one env var.
- **Deploy-ready**: `Dockerfile` + `render.yaml` included.

## Requirements

- PHP **8.1+** with `pdo_mysql` (Laragon ships this) and `mbstring`
- Composer
- MySQL 5.7+ / MariaDB (or SQLite for quick tests)

## Quick start (local, MySQL via Laragon)

```bash
# 1. Install PHP dependencies
composer install

# 2. Create the database + tables + seed data
mysql -u root < sql/schema.sql

# 3. Configure environment
cp .env.example .env          # Windows: copy .env.example .env
#   -> set a real JWT_SECRET:  php -r "echo bin2hex(random_bytes(32));"
#   -> make sure CORS_ALLOWED_ORIGINS includes http://localhost:5173

# 4. Run the API
php -S localhost:8000 -t public
```

Visit <http://localhost:8000/> → you should see a JSON health response.

### Seeded logins (password = `password`)

| Email               | Role   |
|---------------------|--------|
| `admin@books.test`  | admin  |
| `member@books.test` | member |

### Zero-config test mode (no MySQL)

```bash
# in .env
DB_DRIVER=sqlite
DB_NAME=./storage/books.sqlite
# then load the SQLite-flavoured schema once (see sql/schema.sqlite.sql)
```

## Verify everything works

```bash
bash tests/smoke.sh            # local
bash tests/smoke.sh https://your-api-url
```

The script logs in, creates/edits/deletes a book, and asserts the 200/401/403/422 status codes from the lab manual. You can also open `tests/api.http` in VS Code (REST Client) or import the requests into Postman for the demo.

## API reference

| Method | Path                | Auth        | Notes |
|-------:|---------------------|-------------|-------|
| GET    | `/`                 | public      | Health/info JSON |
| GET    | `/api/health`       | public      | DB connectivity check |
| POST   | `/auth/register`    | public      | `{ name, email, password }` → 201 |
| POST   | `/auth/login`       | public      | `{ email, password }` → `{ access_token, user }` |
| GET    | `/auth/me`          | **bearer**  | current user |
| GET    | `/api/books`        | public      | list; `?q=` searches title/author |
| GET    | `/api/books/{id}`   | public      | single book |
| POST   | `/api/books`        | **bearer**  | create (owner = you) → 201 |
| PUT    | `/api/books/{id}`   | **bearer**  | update (owner or admin) → 200 / 403 |
| DELETE | `/api/books/{id}`   | **bearer**  | delete (owner or admin) → 200 / 403 |

**Error envelope**: validation → `422 { "errors": { field: msg } }`; everything else → `4xx/5xx { "error": "message" }`.

## Project layout

```
Ch12_BooksAPI_Solution/
├── public/
│   ├── index.php          # front controller (bootstrap + middleware + run)
│   └── .htaccess          # Apache rewrite to index.php
├── src/
│   ├── settings.php       # .env loader + config
│   ├── routes.php         # all route definitions
│   ├── Support/           # Jwt, Database, Validator, Json
│   ├── Middleware/        # CorsMiddleware, JwtAuthMiddleware
│   └── Controllers/       # AuthController, BookController
├── sql/
│   ├── schema.sql         # MySQL schema + seed (canonical)
│   └── schema.sqlite.sql  # SQLite equivalent (optional local testing)
├── tests/                 # smoke.sh + api.http
├── Dockerfile             # PHP 8.2 + Apache production image
├── render.yaml            # Render blueprint
└── .env.example
```

## Deploy

See **`../Ch13_FullStack_Solution/deploy/DEPLOYMENT.md`** for the full walkthrough (database → API → frontend → mobile). In short: push this folder to GitHub, deploy as a Docker web service (Render/Railway), point the env vars at your MySQL, and set `CORS_ALLOWED_ORIGINS` to your frontend URL.

# Employee Directory — Chapter 8 Individual Assignment

A single-page **Employee Directory** with full CRUD, built with **Vue 3 (Composition API) + Axios** on the front-end and a **Node.js + Express + MySQL** REST API on the back-end.

- **Name:** Mohammed Al-Sakkaf
- **Matric Number:** _<REPLACE WITH YOUR MATRIC NO>_
- **Course:** Web Application Development — Chapter 8 (Connecting Vue to Backend)

---

## Architecture

```
Vue 3 (Vite, port 5174)  ⇄  Express API (port 3001)  ⇄  MySQL (port 3306)
```

The browser never talks to MySQL directly — every request goes through the Express API, which uses **prepared statements** (`?` placeholders) for all queries.

## Project structure

```
.
├── server/                 Express + MySQL backend
│   ├── package.json
│   ├── db.js               MySQL connection pool (mysql2)
│   └── index.js            REST routes + server-side validation
├── sql/
│   └── schema.sql          CREATE DATABASE + table + 7 seed rows
├── src/                    Vue 3 front-end
│   ├── main.js
│   ├── App.vue             parent — holds state, wires children
│   ├── api/employeeApi.js  single Axios instance + interceptors + CRUD
│   ├── assets/main.css
│   └── components/
│       ├── EmployeeForm.vue       Add / Edit form with validation
│       ├── EmployeeControls.vue   search + sort controls
│       └── EmployeeList.vue       table with RM formatting + status badges
├── index.html
├── package.json            front-end deps + scripts
├── vite.config.js          Vite dev server on :5174
└── test.http               REST Client requests for manual API testing
```

## Prerequisites

- **Laragon** (Full) with the **MySQL** service running (green light)
- **Node.js 18+** and **npm 9+**
- A modern browser with DevTools

## Setup & run

> You need **two terminals** — one for the API, one for Vite. MySQL runs under Laragon.

### 1. Create the database

Open **HeidiSQL** from Laragon (Database button) and run `sql/schema.sql`
(File → Load SQL file → select `sql/schema.sql` → press **F9**).
You should see the `employee_directory` database with a `employees` table of **7 rows**.

### 2. Install dependencies

```bash
# from the project root — front-end deps
npm install

# back-end deps
cd server
npm install
cd ..
```

### 3. Start the back-end API (terminal 1)

```bash
npm run server
# → API running at http://localhost:3001
```

### 4. Start the front-end (terminal 2)

```bash
npm run dev
# → http://localhost:5174
```

Open **http://localhost:5174**. You should see the 7 seeded employees and the active headcount.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/employees` | List all employees |
| GET | `/employees?q=ahmad` | Server-side search (name, empId, email, department) |
| GET | `/employees?sortBy=salary&order=desc` | Server-side sort (whitelisted columns only) |
| GET | `/employees/:id` | Single employee |
| POST | `/employees` | Create (validated, prepared statement) |
| PUT | `/employees/:id` | Update |
| DELETE | `/employees/:id` | Delete |

## Validation rules (client **and** server)

| Field | Rule |
|-------|------|
| Employee ID | Required, regex `^EMP[0-9]{3,5}$` (e.g. EMP001) |
| Name | Required, ≥ 3 characters |
| Email | Required, valid email pattern |
| Department | Required (dropdown: IT, HR, Finance, Marketing, Operations) |
| Position | Required |
| Hire Date | Required, cannot be in the future |
| Salary (RM) | Required, numeric, between 1,500 and 50,000 |

## Notes / decisions

- **Single Axios instance** (`src/api/employeeApi.js`) with request + response interceptors; components never call `axios` directly.
- **Server-side validation** mirrors the client rules and returns HTTP **400** with `{ errors: { field: msg } }`; the response interceptor surfaces these back onto the form. (This is the lab's "Extension C", attempted for robustness.)
- **Whitelisted sort** — the client can only sort by `name`, `hireDate`, `salary`, `empId`; arbitrary column names are rejected.
- **Salary** is formatted with `Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' })`.
- `empId` is locked while editing to preserve the unique key.
- `node_modules/` and `dist/` are excluded (recreated by `npm install`).

## Mapping to Chapter 8 Learning Outcomes

| LO | Where |
|----|-------|
| LO1 — Connect Vue to a backend | `employeeApi.js` baseURL + `server/` Express API |
| LO2 — Axios client | Single instance, request/response interceptors, async/await helpers |
| LO3 — Form handling | `EmployeeForm.vue` — v-model `.trim`/`.number`, `validate()`, inline errors |
| LO4 — Persistent CRUD + search/sort | `server/index.js` prepared statements, `?q=`, `?sortBy=` |

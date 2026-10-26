# CH8–9 Mastery — Backend: Axios + Express (Ch8) and REST + PHP Slim 4 (Ch9)

> ⚠️ **CRITICAL COURSE FACT**: the course has **TWO backends**, both examinable.
> - **Ch8** = Vue 3 + **Axios** frontend talking to a **Node.js + Express + mysql2** API (Student Records Manager lab, Employee Directory assignment).
> - **Ch9** = REST theory + **PHP Slim 4** API (Books API lab — in-memory/JSON file, no DB yet).
> The professor's blanks will come from BOTH code styles. Learn each in its own lane.

---

## 1. The Mental Model (5 lines)

1. **Client–server**: Vue (5173) sends HTTP with JSON bodies → API (Express on **3000** / Slim on **8000**) → only the API touches the DB. The browser **never** talks to MySQL directly.
2. **REST**: resources are plural nouns (`/students`, `/api/books/{id}`); verbs act on them: GET read, POST create (201), PUT replace, PATCH partial, DELETE remove; **stateless**; JSON payloads.
3. **Axios** over fetch because: auto-JSON, **rejects on 4xx/5xx**, interceptors, instances with baseURL/timeout. All calls live in one service module (`src/api/studentApi.js`) — components never import axios directly.
4. **Express** = `app.use(cors())` + `app.use(express.json())` + route handlers `app.get/post/put/delete(path, async (req, res) => {...})` + `app.listen(3000)`.
5. **Slim 4** = `AppFactory::create()` + middleware (JSON body parser, CORS, routing, error) + `$app->get('/books/{id}', fn(Request, Response, array $args))` returning a **PSR-7 immutable Response** (`withHeader`, `withStatus` — always `return` the new object).

---

## 2. REST + HTTP (shared theory, MCQ gold)

| Verb | Use | Properties | Example |
|---|---|---|---|
| GET | retrieve | **safe + idempotent** | GET /products |
| POST | create | **NOT idempotent** | POST /products → 201 |
| PUT | replace whole | idempotent | PUT /products/12 |
| PATCH | partial update | not idempotent (typically) | PATCH /products/12 |
| DELETE | remove | idempotent | DELETE /products/12 |

Status codes: **200 OK / 201 Created / 204 No Content / 301 / 304 / 400 Bad Request / 401 Unauthorized / 403 Forbidden / 404 Not Found / 409 Conflict (duplicate matricNo) / 500 Internal Server Error / 503**.

URI style: ✅ `GET /products/12`, `POST /products`, `GET /vendors/3/menu-items` · ❌ `/getAllProducts`, `/createProduct`, `GET /deleteProduct/12` (no verbs in URIs).

Idempotent = repeating the call gives the same result (POST creates a new record each time → not idempotent).

---

## 3. Ch8 — Axios (his exact patterns)

### 3.1 Fetch vs Axios (the comparison slide)
- fetch: built-in, but no auto-JSON, no reject on HTTP errors, no interceptors.
- axios: auto JSON parsing, **rejects on 4xx/5xx**, interceptors + instances, timeouts/cancellation, same API in browser & Node.

### 3.2 The instance (src/api/studentApi.js)
```js
import axios from 'axios'                          // npm install axios

const apiClient = axios.create({                   // ⚡ axios.create({...})
  baseURL: 'http://localhost:3000',                // ⚡ one place to change
  timeout: 5000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
})
export default apiClient
```

### 3.3 Interceptors
```js
apiClient.interceptors.request.use((config) => {   // ⚡ request interceptor
  console.log(`[API] ${config.method.toUpperCase()} ${config.url}`)
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`  // ⚡ attach JWT
  return config                                    // ⚡ must return config
})

apiClient.interceptors.response.use(
  (response) => response,                          // pass through
  (error) => {                                     // ⚡ central error handling
    if (error.response?.status === 401) location.href = '/login'
    return Promise.reject(error)                   // ⚡ keep rejecting
  }
)
```

### 3.4 CRUD helpers (the lab's export block)
```js
export const getStudents   = (params = {}) => apiClient.get('/students', { params })
export const getStudent    = (id) => apiClient.get(`/students/${id}`)        // ⚡ template literal
export const createStudent = (s)  => apiClient.post('/students', s)          // ⚡
export const updateStudent = (id, s) => apiClient.put(`/students/${id}`, s)  // ⚡
export const deleteStudent = (id) => apiClient.delete(`/students/${id}`)     // ⚡
```

### 3.5 Response object + 3-shape error handling
```js
const res = await apiClient.get('/students/1')
res.data      // ⚡ parsed JSON body — what you almost always want
res.status    // 200
res.headers   // res.config, res.request

try { ... } catch (err) {
  if (err.response) {        // ⚡ server answered with 4xx/5xx
    console.error(err.response.status, err.response.data)
  } else if (err.request) {  // ⚡ sent but no answer (server down)
    console.error('No response — is the server running?')
  } else {                   // setup error
    console.error(err.message)
  }
}
```

### 3.6 Loading data in a component (onMounted pattern)
```vue
<script setup>
import { ref, onMounted } from 'vue'               // ⚡ onMounted import
import { getStudents } from '../api/studentApi.js'

const students = ref([])
const loading  = ref(false)
const error    = ref('')

async function load() {
  loading.value = true
  try {
    const res = await getStudents()
    students.value = res.data                      // ⚡ .data → ref
  } catch (e) { error.value = 'Could not load.' }
  finally { loading.value = false }                // ⚡ finally clears the spinner
}
onMounted(load)                                    // ⚡ fetch on mount
</script>
```

### 3.7 Form handling (Ch8 part 3)
```vue
<form @submit.prevent="onSubmit">                  <!-- ⚡ .prevent stops reload -->
  <input v-model.trim="form.name" placeholder="Name" />
  <input v-model.number="form.gpa" type="number" step="0.01" />
  <button type="submit">Save</button>
</form>
```
v-model = `:value="name"` + `@input="name = $event.target.value"` under the hood.
Validation pattern (lab):
```js
const errors = ref({})
const matricRegex = /^[A-Z][0-9]{2}[A-Z]{2}[0-9]{4}$/   // ⚡ A21CS0001 format
function validate() {
  const e = {}
  if (!form.value.name.trim()) e.name = 'Name is required.'
  if (!matricRegex.test(form.value.matricNo)) e.matricNo = 'Format: A21CS0001'
  if (form.value.gpa < 0 || form.value.gpa > 4) e.gpa = 'GPA must be 0.00 – 4.00.'
  errors.value = e
  return Object.keys(e).length === 0               // ⚡ valid when error map empty
}
async function onSubmit() {
  if (!validate()) return                          // ⚡ guard before API call
  await createStudent(form.value)
}
```
Child form emits to parent: `const emit = defineEmits(['save', 'cancel'])` → `emit('save', {...form.value})`; parent `@save="handleSave"`.

---

## 4. Ch8 — Express + mysql2 server (server/index.js — THE most blankable file)

### 4.1 Setup commands
```bash
cd server && npm install express mysql2 cors      # ⚡ the 3 packages
node server/index.js                              # or: npm run server
```
- express = routing + JSON parsing; mysql2 = promise MySQL driver + prepared statements; cors = lets 5173 call 3000; nodemon = dev auto-restart.

### 4.2 The connection pool (server/db.js)
```js
const mysql = require('mysql2/promise')            // ⚡ /promise flavour

const pool = mysql.createPool({                    // ⚡ createPool NOT createConnection
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',                                    // Laragon default
  database: 'student_records',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
module.exports = pool
```
*Why pool:* reuses connections across requests; createConnection per call is slow under load.

### 4.3 App skeleton + routes
```js
const express = require('express')
const cors    = require('cors')
const pool    = require('./db')

const app = express()
app.use(cors())                                    // ⚡ allow requests from :5173
app.use(express.json())                            // ⚡ parse JSON bodies

app.get('/', (req, res) => res.json({ status: 'ok' }))   // health check

// READ list (+ search & whitelist sort)
app.get('/students', async (req, res) => {
  try {
    const { q, sortBy, order } = req.query          // ⚡ req.query
    let sql = 'SELECT * FROM students'
    const params = []
    if (q) {
      sql += ` WHERE name LIKE ? OR matricNo LIKE ? OR email LIKE ? OR course LIKE ?`
      const like = `%${q}%`                         // ⚡ %wildcards in the VALUE
      params.push(like, like, like, like)
    }
    const allowedSort = ['name', 'matricNo', 'gpa', 'year']  // ⚡ whitelist columns
    if (sortBy && allowedSort.includes(sortBy)) {
      const direction = order === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY ${sortBy} ${direction}`
    }
    const [rows] = await pool.query(sql, params)    // ⚡ destructure [rows]
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// READ one
app.get('/students/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM students WHERE id = ?', [req.params.id])  // ⚡ req.params.id + placeholder
  if (!rows.length) return res.status(404).json({ error: 'Not found' })  // ⚡ 404 guard
  res.json(rows[0])
})

// CREATE
app.post('/students', async (req, res) => {
  try {
    const { matricNo, name, course, faculty, gpa, email, year, active } = req.body  // ⚡ req.body destructure
    const [r] = await pool.query(
      `INSERT INTO students (matricNo, name, course, faculty, gpa, email, year, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,            // ⚡ 8 placeholders
      [matricNo, name, course, faculty, gpa, email, year, active ? 1 : 0]
    )
    res.status(201).json({ id: r.insertId, ...req.body })  // ⚡ 201 + insertId
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Matric number already exists' })  // ⚡ 409 duplicate
    }
    res.status(500).json({ error: 'Database error' })
  }
})

// UPDATE
app.put('/students/:id', async (req, res) => {
  const { matricNo, name, course, faculty, gpa, email, year, active } = req.body
  const [r] = await pool.query(
    `UPDATE students SET matricNo=?, name=?, course=?, faculty=?,
        gpa=?, email=?, year=?, active=? WHERE id=?`,        // ⚡ SET ... WHERE id=?
    [matricNo, name, course, faculty, gpa, email, year, active ? 1 : 0, req.params.id]
  )
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })  // ⚡ affectedRows
  res.json({ id: Number(req.params.id), ...req.body })
})

// DELETE
app.delete('/students/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id])
  if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
  res.json({ deleted: true })
})

const PORT = 3000
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`))  // ⚡ listen LAST
```
Common errors table: `ECONNREFUSED 127.0.0.1:3306` = MySQL not running; CORS error = forgot `app.use(cors())`; GPA "3.7500" = MySQL DECIMAL returns **strings** → `Number(s.gpa).toFixed(2)`.

---

## 5. Ch9 — PHP Slim 4 (Books API)

### 5.1 Setup (Composer on Laragon)
```bash
cd C:\laragon\www && mkdir books-api && cd books-api
composer init --name="utm/books-api" --no-interaction
composer require slim/slim:"4.*" slim/psr7        # ⚡ framework + PSR-7 implementation
composer require php-di/php-di                    # optional DI
php -S localhost:8000 -t public                   # ⚡ run dev server
```
composer.json autoload: `"autoload": { "psr-4": { "App\\": "src/" } }` → `composer dump-autoload`.
Folder layout: `public/index.php` (entry) + `public/.htaccess`, `src/routes.php`, `src/Controllers/BookController.php`, `src/Middleware/`, `src/Data/books.php`.

### 5.2 Hello Slim (public/index.php)
```php
<?php
use Psr\Http\Message\ResponseInterface as Response;          // ⚡ PSR-7 aliases
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';                 // ⚡ Composer autoload

$app = AppFactory::create();                                 // ⚡ build the app
$app->addRoutingMiddleware();                                // ⚡ enable dispatch
$app->addErrorMiddleware(true, true, true);                  // ⚡ add LAST (outermost layer)

$app->get('/', function (Request $req, Response $res) {
    $res->getBody()->write('Hello, Slim!');                  // ⚡ write to body
    return $res;                                             // ⚡ ALWAYS return the response
});

$app->run();                                                 // ⚡ start lifecycle
```
Middleware = **concentric onion**: last added runs first; request passes outside-in, response inside-out. That's why errorMiddleware is added last.

### 5.3 Routing patterns
```php
$app->get('/books/{id}', function (Request $r, Response $s, array $args) {  // ⚡ 3rd param = args
    $id = (int)$args['id'];                                  // ⚡ path param
    $s->getBody()->write(json_encode(['id' => $id]));
    return $s->withHeader('Content-Type', 'application/json');  // ⚡ withHeader returns NEW object
});

$app->group('/api', function ($g) use ($controller) {        // ⚡ route group
    $g->get   ('/books',      [$controller, 'index']);       // ⚡ [controller, 'method'] callable
    $g->get   ('/books/{id}', [$controller, 'show']);
    $g->post  ('/books',      [$controller, 'create']);
    $g->put   ('/books/{id}', [$controller, 'update']);
    $g->delete('/books/{id}', [$controller, 'delete']);
});
```

### 5.4 Reading inputs (3 sources)
```php
$id     = (int)$args['id'];                  // 1. path param (3rd argument)
$params = $r->getQueryParams();              // 2. ?q=...&limit=...  ⚡
$q      = $params['q'] ?? '';                //    null-coalescing default
$data   = $r->getParsedBody();               // 3. JSON body (needs JsonBodyParser middleware) ⚡
// or: $data = json_decode((string)$r->getBody(), true);     // manual decode → assoc array
```

### 5.5 JSON response helper (his convention)
```php
private function json(Response $res, $data, int $status = 200): Response {
    $res->getBody()->write(json_encode($data));              // ⚡ encode ONCE
    return $res
        ->withHeader('Content-Type', 'application/json')     // ⚡
        ->withStatus($status);                               // ⚡ immutable — return it
}
// 201 + Location header on create:
return $this->json($s, $book, 201)->withHeader('Location', '/api/books/' . $id);
```

### 5.6 Middleware (PSR-15) — JsonBodyParser & CORS
```php
final class JsonBodyParser implements MiddlewareInterface {
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface {
        if (stripos($request->getHeaderLine('Content-Type'), 'application/json') === 0) {
            $decoded = json_decode((string)$request->getBody(), true);    // ⚡
            $request = $request->withParsedBody(is_array($decoded) ? $decoded : []);  // ⚡
        }
        return $handler->handle($request);                   // ⚡ pass to next layer
    }
}

final class Cors implements MiddlewareInterface {
    public function process(... $request, ... $handler): ResponseInterface {
        if ($request->getMethod() === 'OPTIONS') {           // ⚡ preflight short-circuit
            return $this->withCors(new \Slim\Psr7\Response(204));
        }
        return $this->withCors($handler->handle($request));
    }
    private function withCors(ResponseInterface $r): ResponseInterface {
        return $r->withHeader('Access-Control-Allow-Origin', '*')
                 ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')  // ⚡ Authorization listed!
                 ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
}
```
Registration order in index.php:
```php
$app->add(new App\Middleware\JsonBodyParser());
$app->add(new App\Middleware\Cors());
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);
(require __DIR__ . '/../src/routes.php')($app);              // ⚡ routes file returns fn(App)
$app->run();
```

### 5.7 .htaccess (clean URLs)
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

---

## 6. Memorization anchors ⚡ (Ch8–9)

1. `const apiClient = axios.create({ baseURL: 'http://localhost:3000', timeout: 5000 })`
2. `apiClient.interceptors.request.use((config) => { ...; return config })`
3. `config.headers.Authorization = \`Bearer ${token}\``
4. `export const updateStudent = (id, s) => apiClient.put(\`/students/${id}\`, s)`
5. `err.response` vs `err.request` vs `err.message` (3 error shapes)
6. `onMounted(load)` + `students.value = res.data` + `finally { loading.value = false }`
7. `app.use(cors())` and `app.use(express.json())` — THE two middleware lines
8. `app.get('/students/:id', async (req, res) => { ... })` — route signature
9. `const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id])`
10. `res.status(201).json({ id: r.insertId, ...req.body })`
11. `if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })`
12. `mysql.createPool({ host, user, password, database, connectionLimit: 10 })`
13. `app.listen(3000, () => console.log(...))`
14. `composer require slim/slim:"4.*" slim/psr7`
15. `$app = AppFactory::create(); $app->addRoutingMiddleware(); $app->addErrorMiddleware(true, true, true);`
16. `$app->get('/books/{id}', function (Request $r, Response $s, array $args) {...})`
17. `$res->getBody()->write(json_encode($data));`
18. `return $res->withHeader('Content-Type','application/json')->withStatus(201);`
19. `$params = $r->getQueryParams();` / `$data = $r->getParsedBody();`
20. `$app->group('/api', function ($g) { $g->get('/books', [...]); });`

---

## 7. MCQ trivia (Ch8–9)

- Ports: Vue/Vite **5173**, Express/JSON-server **3000**, Slim dev **8000**, MySQL **3306**.
- Axios advantages: auto-JSON, rejects on 4xx/5xx, interceptors, instances, timeout/cancel, browser+Node.
- fetch needs: manual `response.json()`, manual `response.ok` check, manual error wiring.
- `response.data` = parsed body (the thing you want); the response envelope also has status/headers/config.
- Components should NEVER import axios directly — one service module per resource.
- CORS: server must allow the other origin; Express fix = `app.use(cors())`; Slim = CORS middleware with the three Access-Control headers; preflight = OPTIONS → 204.
- REST coined by **Roy Fielding (2000)**; stateless; uniform interface; resources = nouns.
- POST returns **201 Created** (+ Location header in Slim lab); DELETE often 200/204; validation failure 400; duplicate 409.
- Slim = **micro framework** on **PSR-7** (request/response) + **PSR-15** (middleware).
- Slim PSR-7 Response is **immutable** — `withHeader/withStatus` return a NEW object; forgetting to `return` it is his #1 pitfall.
- Middleware order: onion; **last added = first executed**; error middleware added last so it wraps everything.
- `getParsedBody()` returns null for JSON unless the JsonBodyParser middleware is registered.
- JSON Server (slides' earlier version): turns db.json into a fake REST API — replaced in the lab by Express+MySQL.
- Express middleware vs route: `app.use(fn)` runs for ALL requests; `app.get(path, fn)` only for GET on that path.
- mysql2 DECIMAL comes back as a **string** → `Number(s.gpa).toFixed(2)`.

---

## 8. Minimal-pair confusions (Ch8–9)

| A | B | Difference |
|---|---|---|
| `app.use()` | `app.get()` | middleware for all vs handler for GET+path |
| `req.params` | `req.query` | `/students/:id` path parts vs `?q=&sortBy=` string |
| `req.query` | `req.body` | URL ?pairs vs JSON payload (needs express.json()) |
| `res.json(x)` | `res.status(201).json(x)` | 200 default vs explicit code (status FIRST) |
| `insertId` | `affectedRows` | new PK after INSERT vs rows touched by UPDATE/DELETE |
| `createPool` | `createConnection` | reusable pool (course style) vs single connection |
| axios `err.response` | `err.request` | server replied 4xx/5xx vs no reply at all |
| `axios.get(url)` | `apiClient.get(path)` | raw vs instance with baseURL (course style) |
| PUT | PATCH | full replace (missing fields wiped) vs partial fields |
| `$args['id']` | `getQueryParams()['q']` | Slim path param vs query param |
| `withStatus` | `getStatusCode` | set (returns new) vs read |
| `$app->add(mw)` | `$app->addRoutingMiddleware()` | custom middleware vs built-in router |
| Express `cors()` | Slim Cors middleware | one-liner package vs hand-written PSR-15 class |
| `node server/index.js` | `php -S localhost:8000 -t public` | run Express vs run Slim |
| 401 | 403 | not authenticated vs authenticated-but-not-allowed |

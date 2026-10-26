# MOCK FINAL EXAMINATION v1 — SCSM2223 Cross-Platform Application Development

**Time allowed: 2 hours 30 minutes** | Total: 100 marks
**Section A: 30 MCQ × 1 mark = 30 marks** | **Section B: 5 structured questions × 14 marks = 70 marks**
Answer ALL questions. In Section B, write the EXACT missing code for each numbered blank.
Answers: `05_Mock_Final_v1_ANSWERS.md` — do not open until finished.

---

# SECTION A — Multiple Choice (30 marks)

**A1.** The "Write Once, Run Anywhere" concept is achieved in Java because:
A. Java compiles directly to each OS's machine code
B. Java source is compiled to bytecode that runs on any OS with a JVM
C. Java runs inside the browser
D. Java apps are interpreted line by line by the OS

**A2.** Which sequence describes the request-response cycle of a web application?
A. Browser → Database → Web Server → Browser
B. Client (browser) → HTTP request → Web server → Database → Response (HTML/JSON) → Client
C. Web server → Browser → Database
D. Database → HTTP → Browser

**A3.** A company builds an admin dashboard with real-time updates and API-driven architecture. The recommended approach is:
A. MPA, because it is server-driven
B. SPA, because the frontend renders the UI and the backend supplies JSON data
C. Static HTML pages
D. CGI scripts

**A4.** In the hybrid mobile technology stack, which tool generates the platform-specific project and compiles the APK/AAB?
A. Vite
B. Composer
C. Android Studio
D. HeidiSQL

**A5.** Which is NOT a front-end component in web architecture?
A. HTML
B. CSS
C. JavaScript
D. Web server

**A6.** In the contact form lab, every input must have a linked label. The correct linkage is:
A. `<label name="email">` with `<input name="email">`
B. `<label for="email">` with `<input id="email">`
C. `<label id="email">` with `<input for="email">`
D. Wrapping is forbidden; only placeholder text is allowed

**A7.** What does `html { font-size: 62.5%; }` accomplish in the CSS lab's reset?
A. Shrinks all text by 62.5%
B. Makes 1rem equal 10px for easy calculation
C. Disables zoom
D. Sets the viewport width

**A8.** With Flexbox, placing the site logo at the left edge and nav links at the right edge of the same row uses:
A. `justify-content: space-between`
B. `align-items: stretch`
C. `flex-direction: column`
D. `float: right`

**A9.** `auto-fit` differs from `auto-fill` in a CSS Grid because auto-fit:
A. Keeps empty tracks, leaving gaps
B. Collapses empty tracks so items stretch to fill the row
C. Only works with fixed pixel widths
D. Requires media queries

**A10.** The Quick Notes lab bans `innerHTML` when building note cards mainly because the lab wants you to:
A. Improve SEO
B. Practice the fundamental DOM API (createElement/textContent/appendChild) and avoid injection risks
C. Make the code shorter
D. Avoid CSS conflicts

**A11.** `notes.findIndex(n => n.id === id)` returns:
A. The matching note object
B. true or false
C. The index of the first match, or −1 if none
D. A filtered array

**A12.** Event delegation works because DOM events:
A. Are captured only by the clicked element
B. Bubble up from the target to its ancestors, so one parent listener can serve many children
C. Require one listener per button
D. Only fire on elements that existed at page load

**A13.** `confirm("Delete?")` returns:
A. A string
B. null
C. true if OK, false if Cancel
D. A Promise

**A14.** Which JSON value type is NOT allowed?
A. null
B. nested object
C. array
D. function

**A15.** In classic AJAX, `xhr.responseText` contains:
A. A parsed JavaScript object
B. The raw response body as a string (must be JSON.parse'd)
C. The HTTP status
D. The request headers

**A16.** What is the output order?
```js
console.log("1");
fetch(url).then(() => console.log("3"));
console.log("2");
```
A. 1, 3, 2 B. 3, 1, 2 C. 1, 2, 3 D. 2, 1, 3

**A17.** `response.json()` must be awaited because it:
A. Validates the HTTP status
B. Returns a Promise that resolves to the parsed body
C. Is synchronous but slow
D. Re-sends the request

**A18.** In jQuery, `$("#box").toggleClass("highlight")`:
A. Adds the class permanently
B. Removes the class permanently
C. Adds the class if absent, removes it if present
D. Toggles display:none

**A19.** The jQuery document-ready wrapper exists to:
A. Defer code until the DOM is fully loaded
B. Cache HTTP responses
C. Load jQuery from the CDN
D. Prevent CORS errors

**A20.** Vue's reactivity means:
A. You must call render() manually
B. Data changes automatically update the DOM
C. The DOM updates data automatically only
D. Components cannot share state

**A21.** Which line makes a Vue 3 CDN app actually appear inside `<div id="app">`?
A. `createApp(...).mount('#app')`
B. `Vue.render('#app')`
C. `app.start('#app')`
D. `setup('#app')`

**A22.** In a template, `{{ todos.length }}` works without `.value` because:
A. todos is not reactive
B. Vue auto-unwraps refs in templates
C. length is a static property
D. Templates run in PHP

**A23.** Which v-model modifier converts the bound value to a number?
A. `.lazy`
B. `.trim`
C. `.number`
D. `.int`

**A24.** A `<select>` bound with `v-model="country"` will:
A. Keep `country` in sync with the selected option
B. Only set country once on load
C. Require @change handlers
D. Not work with refs

**A25.** In the Ch7 project structure, route-level page components belong in:
A. `src/components/`
B. `src/views/`
C. `src/assets/`
D. `public/`

**A26.** `component: () => import('@/views/TodoDetailView.vue')` in a route definition enables:
A. Server-side rendering
B. Lazy loading — the view is fetched only when the route is first visited
C. Hot module replacement
D. Type checking

**A27.** Axios is configured once with a baseURL via:
A. `axios.config()`
B. `axios.create({ baseURL: ... })`
C. `new Axios(baseURL)`
D. `axios.baseURL = ...`

**A28.** In Express, `req.params` vs `req.query`: for `GET /students/7?sortBy=gpa`,
A. params.id is "7"… wait — params has what the route declares: for route `/students/:id`, `req.params.id === "7"` and `req.query.sortBy === "gpa"`
B. params.sortBy === "gpa" and query.id === "7"
C. Both are in req.body
D. Both are undefined

**A29.** In PDO, which call retrieves a single scalar such as the result of `SELECT COUNT(*)`?
A. `fetchAll()`
B. `fetchObject()`
C. `fetchColumn()`
D. `rowCount()`

**A30.** Which JWT claim set is correct?
A. sub = expiry, exp = subject
B. iss = issuer, sub = subject (user id), iat = issued-at, exp = expiry
C. iat = issuer, iss = issued-at
D. role is a registered claim defined by RFC

---

# SECTION B — Structured Questions (70 marks)

> Each code block has numbered blanks `____(n)____`. Write the exact missing code. 2 marks per blank.

---

## Question B1 (14 marks) — Vue Profile Card (Chapter 6)

The following single-file Vue 3 (CDN) app implements the lab's Interactive Profile Card: editable name, a skills list with add/remove, and a live skill count. Complete it.

```html
<div id="app">
  <section class="card">
    <h2>{{ name }}</h2>

    <ul class="skills">
      <li ____(1)____ :key="skill">
        {{ skill }}
        <button @click="removeSkill(i)">&times;</button>
      </li>
    </ul>

    <p v-if="skillCount === 0" class="muted">No skills yet.</p>
    <p ____(2)____ class="muted">Listed {{ skillCount }} skills.</p>
  </section>

  <section class="editor">
    <label>Name:
      <input ____(3)____ type="text">
    </label>
    <label>Add a skill:
      <input v-model="newSkill" ____(4)____ placeholder="e.g. Node.js">
    </label>
  </section>
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
  const { createApp, ref, computed } = Vue

  createApp({
    setup() {
      const name     = ref('Nur Aisyah')
      const skills   = ref(['Vue.js', 'JavaScript'])
      const newSkill = ref('')

      const skillCount = ____(5)____

      function addSkill() {
        const s = newSkill.value.trim()
        if (!s) return
        if (!skills.value.includes(s)) {
          ____(6)____
        }
        newSkill.value = ''
      }
      function removeSkill(index) {
        skills.value.splice(index, 1)
      }

      ____(7)____
    }
  }).mount('#app')
</script>
```

**Required behaviour:** the list renders with index access; the count message appears only when at least one skill exists; the name input live-updates the heading; pressing Enter in the skill input adds it; the count derives reactively from the array; new unique skills are stored; and the template can access every name and function used above.

---

## Question B2 (14 marks) — Todo SPA: Router + Store (Chapter 7)

Complete the router configuration and the Pinia store of the Todo SPA.

```js
// src/router/index.js
import { createRouter, ____(1)____ } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TodosView from '@/views/TodosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',      name: 'home',  component: HomeView },
    { path: '/todos', name: 'todos', component: TodosView },
    { path: '____(2)____', name: 'todo-detail',
      component: () => import('@/views/TodoDetailView.vue') }
  ]
})
export default router
```

```js
// src/stores/todos.js
import { ____(3)____ } from 'pinia'
import { ref, computed } from 'vue'

export const useTodosStore = defineStore('todos', () => {
  const items = ref([
    { id: 1, text: 'Finish Chapter 7 lab', done: false },
  ])

  const doneCount = computed(() => items.value.____(4)____.length)

  function add(text) {
    const clean = text.trim()
    if (!clean) return
    items.value.push({ id: ____(5)____, text: clean, done: false })
  }
  function toggle(id) {
    const t = items.value.____(6)____
    if (t) t.done = !t.done
  }
  return { items, doneCount, add, toggle }
})
```

```vue
<!-- src/views/TodoDetailView.vue (script only) -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTodosStore } from '@/stores/todos'

const route = useRoute()
const store = useTodosStore()
const todo = computed(() =>
  store.items.find(t => t.id === ____(7)____))
</script>
```

**Required behaviour:** the router uses HTML5 history; `/todos/42` shows the detail view, lazily loaded; the store counts completed todos; new todos get a unique timestamp id; toggle flips the matching todo; the detail page finds its todo even though URL params arrive as strings.

---

## Question B3 (14 marks) — Fetching Data (Chapters 4–5, 8)

Part (a): complete the WeatherNow-style fetch helper with proper error handling.

```js
async function getUser(id) {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`);

    if (____(1)____) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const user = ____(2)____;
    console.log("Name:", user.name);
  } catch (error) {
    console.log("Error:", error.message);
  }
}
```

Part (b): complete the fetch POST that creates a record.

```js
const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
  method: ____(3)____,
  headers: { "Content-Type": ____(4)____ },
  body: ____(5)____
});
```

Part (c): complete the Axios service module from the Student Records Manager.

```js
import axios from 'axios'

const apiClient = ____(6)____({
  baseURL: 'http://localhost:3000',
  timeout: 5000
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) ____(7)____ = `Bearer ${token}`
  return config
})

export const getStudents = () => apiClient.get('/students')
```

**Required behaviour:** (a) detects non-2xx responses and parses the body; (b) sends `newPost` as a JSON document; (c) builds a pre-configured client and attaches the saved JWT to every outgoing request.

---

## Question B4 (14 marks) — Express REST API (Chapter 8)

Complete the Student Records Manager's Express API.

```js
const express = require('express')
const cors    = require('cors')
const mysql   = require('mysql2/promise')

const pool = mysql.____(1)____({
  host: 'localhost', port: 3306, user: 'root',
  password: '', database: 'student_records',
  connectionLimit: 10
})

const app = express()
app.use(cors())
app.use(____(2)____)

// READ one
app.get('/students/:id', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM students WHERE id = ?', [____(3)____])
  if (!rows.length) return res.status(404).json({ error: 'Not found' })
  res.json(____(4)____)
})

// CREATE
app.post('/students', async (req, res) => {
  try {
    const { matricNo, name, gpa } = req.body
    const [r] = await pool.query(
      'INSERT INTO students (matricNo, name, gpa) VALUES (____(5)____)',
      [matricNo, name, gpa]
    )
    res.____(6)____.json({ id: r.insertId, ...req.body })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Matric number already exists' })
    }
    res.status(500).json({ error: 'Database error' })
  }
})

// DELETE
app.delete('/students/:id', async (req, res) => {
  const [r] = await pool.query('DELETE FROM students WHERE id = ?', [req.params.id])
  if (____(7)____) return res.status(404).json({ error: 'Not found' })
  res.json({ deleted: true })
})

app.listen(3000, () => console.log('API running at http://localhost:3000'))
```

**Required behaviour:** a reusable connection pool; JSON request bodies parsed; the path id bound safely; the single record returned (not the whole array); three positional placeholders; the created status with the new id; and a 404 when the delete touched nothing.

---

## Question B5 (14 marks) — Securing the Books API with JWT (Chapters 10–11)

Complete the login endpoint, the middleware, and the route protection (PHP Slim + firebase/php-jwt).

```php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ---- POST /auth/login ----
public function login(Request $r, Response $s): Response {
    $b = (array)$r->getParsedBody();
    $u = $this->users->findByEmail($b['email'] ?? '');

    if (!$u || !____(1)____($b['password'] ?? '', $u['password_hash'])) {
        return $this->json($s, ['error' => 'Invalid credentials'], ____(2)____);
    }

    $now = time();
    $payload = [
        'iss' => 'books-api',
        'sub' => (int)$u['id'],
        'iat' => $now,
        'exp' => ____(3)____,               // expire after JWT_TTL (3600) seconds
        'role'=> $u['role'],
    ];
    $token = JWT::____(4)____($payload, $_ENV['JWT_SECRET'], 'HS256');

    return $this->json($s, [
        'token_type' => 'Bearer', 'expires_in' => 3600, 'access_token' => $token,
    ]);
}
```

```php
// ---- AuthMiddleware ----
public function process(ServerRequestInterface $req, RequestHandlerInterface $h): ResponseInterface {
    $hdr = $req->getHeaderLine('Authorization');
    if (!preg_match('/^Bearer\s+(.+)$/i', $hdr, $m)) {
        return $this->fail('Missing or malformed token');     // 401
    }
    try {
        $payload = (array)JWT::decode($m[1], ____(5)____);
    } catch (\Throwable $e) {
        return $this->fail('Invalid or expired token');       // 401
    }
    $req = $req->withAttribute('auth', $payload);
    return $h->handle($req);
}
```

```php
// ---- routes.php: protect the write operations ----
$app->post('/auth/login', [$authCtrl, 'login']);              // public
$app->get ('/api/books',  [$bookCtrl, 'index']);              // public

$app->group('/api/books', function ($g) use ($bookCtrl) {
    $g->post  ('',      [$bookCtrl, 'create']);
    $g->put   ('/{id}', [$bookCtrl, 'update']);
    $g->delete('/{id}', [$bookCtrl, 'delete']);
})____(6)____;

// ---- inside BookController::delete(): only admins may delete ----
$auth = (array)$req->getAttribute('auth', []);
if (($auth['role'] ?? 'member') !== 'admin') {
    return $this->json($res, ['error' => 'Admins only'], ____(7)____);
}
```

**Required behaviour:** the login verifies the password attempt against the stored bcrypt hash and rejects bad credentials with the unauthenticated status; the token expires one hour after issue; it is signed with HS256; the middleware decodes with the same pinned secret/algorithm; the write routes all pass through the middleware; and an authenticated non-admin receives the authorization-failure status.

— END OF PAPER —

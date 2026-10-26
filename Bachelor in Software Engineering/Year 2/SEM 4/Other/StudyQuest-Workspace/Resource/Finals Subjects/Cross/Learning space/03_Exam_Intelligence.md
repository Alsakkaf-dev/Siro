# 03 — Exam Intelligence: SCSM2223 Final (Week of July 6, 2026)

## 0. Format (from the professor)
- **30 marks MCQ** — all chapters in scope, slides' terminology.
- **70 marks = 5 structured questions × 14 marks** — code blocks with deleted lines you must fill in **exactly** (his code, his variable names, his apps).
- Final exam weight: 30% of course grade (FE per course info). Passing FE threshold: 20% of final marks — but aim far higher.

## 1. The single most important strategic fact

**The course runs TWO backend stacks, and the official course info names the PHP one.**

| Layer | Chapter | Stack in HIS materials |
|---|---|---|
| Frontend | Ch6–7 | Vue 3 **Composition API** (CDN `setup()`/`return` in Ch6; `<script setup>` + Vite + Router + Pinia in Ch7) |
| HTTP client | Ch8 | **Axios** (instance + interceptors + service module) |
| Backend A | Ch8 lab/assignment | **Node.js + Express + mysql2** (Student Records Manager / Employee Directory) |
| Backend B | Ch9 | **PHP Slim 4** (Books API) — this is what the official course info lists |
| Database | Ch10 | **PDO + prepared statements** (Books API refactor) — named placeholders style |
| Security | Ch11 | **firebase/php-jwt (HS256)** + password_hash/verify + PSR-15 AuthMiddleware |

Implication: don't gamble on only one backend. The blanks in a "routes" question may be Express (`app.get('/students/:id', async (req, res) ...`) **or** Slim (`$app->get('/books/{id}', function (Request $r, Response $s, array $args) ...`). Learn both signatures cold — they're in the drills Set 4.

## 2. Predicted structure of the 5 structured questions (14 marks each)

Based on material emphasis (lab depth, repetition across slides+labs, and what is "blankable"):

| # | Predicted question | Probability | Likely source code | Blank style |
|---|---|---|---|---|
| S1 | **Vue app + directives** — complete a Profile-Card/mini-todo style CDN app (createApp/setup/ref/return/mount + v-model/v-for/:key/computed) | ~95% | Ch6 slides p.9 & 19, Ch6 lab | 5–7 line blanks in one HTML file |
| S2 | **Full Vue SPA piece** — TodoItem/TodosView with defineProps/defineEmits, router config or Pinia store | ~85% | Ch7 lab Steps 4–7 | blanks in .vue + router/index.js |
| S3 | **Fetch/Axios data flow** — async/await fetch with ok-check + POST options object, or Axios instance/interceptor + onMounted load | ~90% | Lab 3 / Ch8 Part 1–2 | blanks in async function |
| S4 | **Backend API routes** — Express CRUD handler (req.params/req.body/pool.query/status codes) or Slim route+handler+middleware | ~90% | Ch8 lab Part 3 / Ch9 lab Part D–E | blanks in route file |
| S5 | **Database + JWT** — PDO prepare/execute/lastInsertId/rowCount, or JWT login→issue→AuthMiddleware→role check | ~90% | Ch10 lab Part C / Ch11 lab Parts D–F | blanks in repository/middleware |

The five pillars (Vue, Express/Slim, MySQL, JWT, Fetch) map exactly onto S1–S5. Weighting justification:
- Ch6–8 received the most teaching time and have the most code per page (Vue appears in 3 chapters = expect TWO Vue-flavoured questions).
- Ch9–11 build ONE continuous artifact (Books API) — perfect exam material because each lab's code is self-contained and line-blankable.
- Lab rubrics emphasize exactly the things that make good blanks: directive names, route signatures, placeholder syntax, status codes, jwt encode/decode args.

## 3. The 25 highest-probability blank targets

Each of these is a line that (a) appears in his materials at least twice, (b) is short, and (c) breaks the program if wrong:

1. `const { createApp, ref, computed } = Vue`
2. `return { name, skills, addSkill, ... }` (the setup return object)
3. `.mount('#app')`
4. `count.value++` (script) vs `{{ count }}` (template)
5. `<li v-for="(skill, i) in skills" :key="skill">`
6. `<input v-model="newSkill" @keyup.enter="addSkill">`
7. `:class="{ dark: darkMode }"`
8. `computed(() => todos.value.filter(t => t.done).length)`
9. `defineProps({ todo: { type: Object, required: true } })`
10. `defineEmits(['toggle', 'remove'])` / `$emit('toggle', todo.id)`
11. `history: createWebHistory(...)` + `{ path: '/todos/:id', name: 'todo-detail', component: () => import('...') }`
12. `const route = useRoute()` → `route.params.id` (+ `Number(...)` conversion)
13. `export const useTodosStore = defineStore('todos', () => { ... })`
14. `app.use(createPinia())` / `app.use(router)` / `app.mount('#app')`
15. `if (!response.ok) throw new Error(...)` after `await fetch(url)`
16. `method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)`
17. `JSON.parse(...)` vs `JSON.stringify(...)` (incl. XHR `responseText`)
18. `axios.create({ baseURL: 'http://localhost:3000', timeout: 5000 })`
19. `config.headers.Authorization = \`Bearer ${token}\`` (request interceptor)
20. `app.use(cors())` + `app.use(express.json())`
21. `const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id])`
22. `res.status(201).json({ id: r.insertId, ...req.body })` / `if (!r.affectedRows) → 404`
23. `$stmt = $pdo->prepare('... WHERE id = :id'); $stmt->execute([':id' => $id]);` + `lastInsertId()` / `rowCount()`
24. `JWT::encode($payload, $secret, 'HS256')` / `JWT::decode($token, new Key($secret, 'HS256'))`
25. `password_hash($pw, PASSWORD_DEFAULT)` / `password_verify($pw, $row['password_hash'])` + `->add($auth)` on the protected group + `403` for non-admin delete

(Bonus near-misses: `@submit.prevent`, `onMounted(load)`, `res.data`, `getParsedBody()`, `withAttribute('auth', $payload)`, `preg_match('/^Bearer\s+(.+)$/i', ...)`.)

## 4. MCQ section forecast (30 marks)

Expect roughly: 4–5 architecture/Ch1 (MPA/SPA, hybrid, engines, 3-tier) · 4–5 HTML/CSS (scope, box-sizing, grid/flex, media queries) · 5–6 JS/JSON/fetch (parse/stringify, promise states, two-then, ok-check, status codes) · 6–7 Vue (definition trivia, ref/.value, directives, computed-vs-method, v-if-vs-v-show, :key, router/Pinia facts) · 4–5 backend (REST verbs/idempotency, status codes, Axios-vs-fetch, ports, CORS) · 3–4 DB (PDO options, prepared statements, lastInsertId/rowCount) · 3–4 JWT (3 parts, claims, HS256-vs-RS256, 401-vs-403, hashing).
Drill bank = `02_Drills/Drill_MCQ_Bank.md` (40 Qs in this distribution).

## 5. Trap list (where he expects students to slip)

1. Writing `count++` instead of `count.value++` in script code.
2. Forgetting the `return {...}` from `setup()` entirely — instant dead template.
3. `useRoute` vs `useRouter` swap.
4. Comparing `route.params.id === t.id` without `Number()` (string vs number).
5. fetch: forgetting `response.ok` check or the second `await response.json()`.
6. Axios: digging in `res` instead of `res.data`.
7. Express: forgetting `express.json()` then wondering why `req.body` is undefined; or writing `res.json().status(404)` (status must come first).
8. mysql2: forgetting `[rows]` destructuring or the `?` placeholder array.
9. PDO: reusing one named placeholder twice with EMULATE_PREPARES=false (HY093); calling `lastInsertId()` on the statement instead of the PDO object.
10. Slim: not RETURNING the response after `withHeader/withStatus` (immutable!).
11. JWT: `password_verify(hash, plain)` argument-order flip; 401 vs 403 confusion; forgetting `new Key(...)` in decode.
12. CORS: forgetting `Authorization` in Access-Control-Allow-Headers (breaks the JWT lab's preflight).

## 6. Ch12–13 placeholder (materials missing — student will source them)

Per the course info these cover:
- **Ch12 — Backend Security & Best Practices**: SQL Injection (already seeded in Ch10 — concatenation vs prepared statements, the `admin' --` demo), Cross-Site Scripting (XSS — Vue auto-escaping, textContent vs innerHTML), Data Tampering, Authentication vs Authorization recap. *Prediction*: mostly MCQ fodder + possibly one structured sub-part asking to FIX an injectable query or to explain why a JWT payload can't be trusted without signature verification. The Ch10/11 mastery docs already cover ~70% of the likely content.
- **Ch13 — Integration, Deployment & Mobile**: full-stack integration (Vue build → served with API), cloud deployment (the Ch7 lab already pointed at Netlify Drop / `npm run build` → `dist/`), and web-to-mobile cross-platform (Capacitor wrap — Ch1's hybrid architecture diagrams return here: WebView, plugins, Android Studio/Xcode, APK/IPA). *Prediction*: MCQ recycling of Ch1 hybrid-mobile slides + possibly `npm run build` / capacitor commands.
- **ACTION**: when he gets the Ch12–13 PDFs, extract any NEW code (e.g., capacitor CLI commands like `npx cap add android`, helmet/sanitization middleware) and append a section to `04_Emergency_Final_Review.md`. Everything else likely re-tests existing chapters.

## 7. Battle plan to exam day

1. **Weeks now → -14 days**: one mastery doc per day, then its drill set the next morning (active recall, write blanks by hand).
2. **-14 → -7 days**: drill sets 1–5 again to 100%; MCQ bank to 38+/40; redo every ⚡ line from memory on paper.
3. **-7 → -3 days**: take `05_Mock_Final_v1.md` under 2-hour exam conditions. Mark with the answer key. Re-drill every miss.
4. **-2 → 0 days**: only `04_Emergency_Final_Review.md` — the one-sheet syntax bible; hand-write the 25 blank targets once daily.
5. **In the exam**: structured questions first-pass: fill every blank you're sure of across all 5 questions, then return. The blanks are independent — a wrong (1) doesn't poison (2). Match HIS naming exactly (camelCase JS, $snake-less PHP, `:named` placeholders, `apiClient`, `useTodosStore`).

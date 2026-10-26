# 04 — EMERGENCY FINAL REVIEW: The Syntax Bible (one sheet, stack-layer by stack-layer)

> Last-48-hours sheet. Every snippet is exam-grade, in HIS style. ⚡ = highest-probability blank lines. Hand-write the ⚡ lines once per day.

---

## LAYER 0 — Architecture one-liners
MPA = server renders full pages, reload per action. SPA = one load, JS updates sections, server returns **JSON**. Hybrid mobile = SPA in a **WebView** wrapped by Capacitor/Cordova (bridge, plugins, packaging) built via Android Studio (APK) / Xcode (IPA). 3-tier = Presentation / Application / Data. Engines: Blink=Chrome/Edge, WebKit=Safari, Gecko=Firefox.
Ports: Vite **5173** · Express **3000** · Slim **8000** · MySQL **3306**.
Status codes: **200 OK · 201 Created · 204 · 400 Bad Request · 401 Unauthorized · 403 Forbidden · 404 Not Found · 409 Conflict · 500 Server Error**.
REST: GET read (safe+idempotent) · POST create (NOT idempotent, →201) · PUT replace (idempotent) · PATCH partial · DELETE (idempotent). Nouns in URIs: `/students/3` ✓, `/getStudent?id=3` ✗.

## LAYER 1 — HTML / CSS
```html
<!DOCTYPE html>
<meta name="viewport" content="width=device-width, initial-scale=1.0">  ⚡
<th scope="col" colspan="2">  /  <th scope="row">  ⚡   <caption> first child of <table>
<label for="email">Email</label> <input id="email" type="email" required>  ⚡
<input type="radio" name="gender" value="male">  <!-- same name = one group -->
```
```css
:root { --color-primary: #1a1a2e; --space-md: 1.5rem; }   h1 { color: var(--color-primary); }  ⚡
* { box-sizing: border-box; }  ⚡        html { font-size: 62.5%; }  /* 1rem=10px */
nav { display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 10; }  ⚡
.card-grid { display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }  ⚡
@media (min-width: 600px) { .card-grid { grid-template-columns: repeat(2, 1fr); } }  ⚡
tbody tr:nth-child(even) { background: #f1f5f9; }      img { max-width: 100%; height: auto; }
```
auto-fit collapses empty tracks / auto-fill keeps them. Mobile-first = min-width.

## LAYER 2 — JS / DOM / BOM (Quick Notes + Kanban style)
```js
const el = document.getElementById("notesContainer");  ⚡
const div = document.createElement("div");  ⚡
div.classList.add("note-item");   div.setAttribute("data-id", note.id);  ⚡
span.textContent = note.title;  ⚡        parent.appendChild(div);  ⚡
while (c.firstChild) { c.removeChild(c.firstChild); }   // clear w/o innerHTML  ⚡
btn.addEventListener("click", addNote);  ⚡
container.addEventListener("click", (e) => {            // EVENT DELEGATION ⚡
  const btn = e.target.closest('[data-action="delete"]');
  if (btn) deleteNoteById(parseInt(btn.getAttribute("data-id"), 10));
});
const i = notes.findIndex(n => n.id === id);  if (i !== -1) notes.splice(i, 1);  ⚡
alert("msg")  /  const ok = confirm("sure?")  /  const s = prompt("title:", old)  ⚡
window.innerWidth  /  window.addEventListener("resize", fn)  /  navigator.userAgent  ⚡
if (e.key === "Enter") addNote();  ⚡
```

## LAYER 3 — JSON / XHR / Fetch / jQuery
```js
const obj = JSON.parse(str);     const str2 = JSON.stringify(obj);  ⚡  (pretty: , null, 2)
// XHR (5 steps)
const xhr = new XMLHttpRequest();  ⚡
xhr.open("GET", url, true);  ⚡
xhr.onload = function() { if (xhr.status === 200) { const d = JSON.parse(xhr.responseText); } };  ⚡
xhr.onerror = function() {};      xhr.send();  ⚡
// XHR POST extras: xhr.setRequestHeader("Content-Type","application/json"); status 201; xhr.send(JSON.stringify(p));  ⚡
// Fetch GET (async/await — his recommended style)
async function getUser(id) {
  try {
    const response = await fetch(`https://.../users/${id}`);  ⚡
    if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);  ⚡
    const user = await response.json();  ⚡
  } catch (error) { console.log(error.message); }
}
// Fetch POST
await fetch(url, { method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newPost) });  ⚡
// Timeout
const controller = new AbortController();  ⚡
setTimeout(() => controller.abort(), 10000);
await fetch(url, { signal: controller.signal });
// jQuery
$(document).ready(function(){});  ⚡    $("#x").text("hi") .val() .attr("src",u) .append(h) .empty()
$("#searchBox").keyup(function(){ const q = $(this).val().toLowerCase().trim(); });  ⚡
$.get(url, function(data){});  ⚡
$.ajax({ url, method:"POST", contentType:"application/json", data: JSON.stringify(o),
         success: fn, error: fn });
$.getJSON(url).done(fn).fail(fn).always(fn);  ⚡
```
fetch: 2 thens because `.json()` returns a Promise; does NOT reject on 404. Promise states: pending/fulfilled/rejected.

## LAYER 4 — Vue 3 (Composition API — HIS style)
```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>  ⚡
<script>
const { createApp, ref, computed } = Vue  ⚡
createApp({
  setup() {  ⚡
    const newSkill = ref('')                       // .value in JS, bare in template ⚡
    const skills   = ref(['Vue.js'])
    const skillCount = computed(() => skills.value.length)  ⚡
    function addSkill() {
      const s = newSkill.value.trim(); if (!s) return
      if (!skills.value.includes(s)) skills.value.push(s)  ⚡
      newSkill.value = ''
    }
    function removeSkill(i) { skills.value.splice(i, 1) }
    watch(name, (newVal, oldVal) => {})            // new FIRST
    return { newSkill, skills, skillCount, addSkill, removeSkill }  ⚡ MUST RETURN
  }
}).mount('#app')  ⚡ LAST
</script>
```
Directives:
```html
{{ price * quantity }}                     <!-- expressions only, text only -->
<img :src="avatar">  <p :class="{ active: isActive }">  <button :disabled="!ok">  ⚡
<button @click="add">  <form @submit.prevent="save">  <input @keyup.enter="add">  ⚡
<input v-model="name">  v-model.trim  v-model.number   <input type="checkbox" v-model="dark">  ⚡
<p v-if="n === 0">none</p> <p v-else-if="n < 5">few</p> <p v-else>many</p>   v-show = display toggle
<li v-for="(t, i) in todos" :key="t.id">  ⚡  (never index as key if list reorders)
```
ref vs reactive: `user = reactive({age:21}); user.age = 22` (no .value). ref of object: `u.value.age = 22`.

## LAYER 5 — Vue SPA (Ch7)
```bash
npm create vue@latest   →  cd app  →  npm install  →  npm run dev   # :5173  ⚡
```
```js
// main.js ⚡
const app = createApp(App); app.use(createPinia()); app.use(router); app.mount('#app')
// router/index.js ⚡
import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',          name: 'home',  component: HomeView },
    { path: '/todos/:id', name: 'todo-detail',
      component: () => import('@/views/TodoDetailView.vue') },   // lazy ⚡
  ]
})
export default router
// in a view: const route = useRoute(); const id = route.params.id  ⚡  (string! Number() it)
//            const router = useRouter(); router.push('/todos')
// stores/todos.js ⚡
export const useTodosStore = defineStore('todos', () => {
  const items = ref([])
  const doneCount = computed(() => items.value.filter(t => t.done).length)
  function add(text) { const c = text.trim(); if (!c) return
    items.value.push({ id: Date.now(), text: c, done: false }) }
  function remove(id) { items.value = items.value.filter(t => t.id !== id) }  ⚡
  function toggle(id) { const t = items.value.find(t => t.id === id); if (t) t.done = !t.done }  ⚡
  return { items, doneCount, add, remove, toggle }
})
// component: const store = useTodosStore()
```
```vue
<script setup>  ⚡
defineProps({ todo: { type: Object, required: true } })  ⚡
defineEmits(['toggle', 'remove'])  ⚡    // template: @change="$emit('toggle', todo.id)"
const emit = defineEmits(['saved']); emit('saved', payload)
</script>
<style scoped>…</style>
<!-- parent: <TodoItem :todo="t" :key="t.id" @toggle="store.toggle" @remove="store.remove" /> -->
<!-- nav: <router-link to="/todos">  render: <router-view />  ⚡ -->
<!-- slots: child <slot name="title">default</slot> ; parent <template #title>…</template> -->
```

## LAYER 6 — Axios (Ch8)
```js
import axios from 'axios'
const apiClient = axios.create({ baseURL: 'http://localhost:3000', timeout: 5000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })  ⚡
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`  ⚡
  return config })
apiClient.interceptors.response.use(r => r, (err) => {
  if (err.response?.status === 401) location.href = '/login'
  return Promise.reject(err) })
export const getStudents   = () => apiClient.get('/students')
export const createStudent = (s) => apiClient.post('/students', s)  ⚡
export const updateStudent = (id, s) => apiClient.put(`/students/${id}`, s)  ⚡
export const deleteStudent = (id) => apiClient.delete(`/students/${id}`)
// component load:
const { data } = await getStudents(); students.value = data  ⚡  (res.data!)
onMounted(load)  ⚡    finally { loading.value = false }
// errors: err.response (4xx/5xx) / err.request (no answer) / err.message  ⚡
```

## LAYER 7 — Express + mysql2 (Ch8 server)
```js
const mysql = require('mysql2/promise')
const pool = mysql.createPool({ host:'localhost', port:3306, user:'root',
  password:'', database:'student_records', connectionLimit:10 })  ⚡
const app = express()
app.use(cors())  ⚡          app.use(express.json())  ⚡
app.get('/students', async (req, res) => {
  const { q, sortBy, order } = req.query  ⚡
  // LIKE: sql += ' WHERE name LIKE ?'; params.push(`%${q}%`)  ⚡  whitelist sort columns!
  const [rows] = await pool.query(sql, params)  ⚡
  res.json(rows) })
app.get('/students/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id])  ⚡
  if (!rows.length) return res.status(404).json({ error: 'Not found' })  ⚡
  res.json(rows[0]) })
app.post('/students', async (req, res) => {
  const { matricNo, name, ... } = req.body  ⚡
  const [r] = await pool.query('INSERT INTO students (...) VALUES (?, ?, ...)', [...])
  res.status(201).json({ id: r.insertId, ...req.body })  ⚡    // dup: err.code==='ER_DUP_ENTRY' → 409
})
app.put → UPDATE ... WHERE id=?  → if (!r.affectedRows) 404  ⚡
app.delete → 'DELETE FROM students WHERE id = ?' → res.json({ deleted: true })
app.listen(3000, () => console.log(`API running at http://localhost:${PORT}`))  ⚡
```

## LAYER 8 — Slim 4 (Ch9)
```php
composer require slim/slim:"4.*" slim/psr7        php -S localhost:8000 -t public  ⚡
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
$app = AppFactory::create();  ⚡
$app->add(new JsonBodyParser()); $app->add(new Cors());
$app->addRoutingMiddleware();  ⚡   $app->addErrorMiddleware(true, true, true);  // LAST added = outermost
$app->get('/books/{id}', function (Request $r, Response $s, array $args) {  ⚡
    $id = (int)$args['id'];  ⚡
    $s->getBody()->write(json_encode(['id' => $id]));  ⚡
    return $s->withHeader('Content-Type','application/json')->withStatus(200);  ⚡ // immutable — RETURN it
});
$app->group('/api', function ($g) use ($c) { $g->get('/books', [$c, 'index']); ... });  ⚡
$params = $r->getQueryParams();   $data = $r->getParsedBody();  ⚡
$app->run();
// CORS middleware: OPTIONS → 204; headers: Origin *, Headers 'Content-Type, Authorization', Methods list ⚡
```

## LAYER 9 — MySQL + PDO (Ch10)
```sql
CREATE TABLE books ( id INT AUTO_INCREMENT PRIMARY KEY,  ⚡
  title VARCHAR(200) NOT NULL, genre VARCHAR(80) NOT NULL DEFAULT 'Uncategorised',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP  ⚡
) ENGINE=InnoDB;     -- charset utf8mb4
SELECT ... WHERE title LIKE :q  (value '%q%') · ORDER BY id ASC · LIMIT n OFFSET (p-1)*n
SELECT COUNT(*) AS total FROM books;   GROUP BY faculty
```
```php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=books_api;charset=utf8mb4', 'root', '', [  ⚡
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,  ⚡
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,  ⚡
  PDO::ATTR_EMULATE_PREPARES => false ]);  ⚡
$stmt = $pdo->prepare('SELECT * FROM books WHERE id = :id');  ⚡
$stmt->execute([':id' => $id]);  ⚡
$row = $stmt->fetch();   $all = $stmt->fetchAll();   $n = $stmt->fetchColumn();  ⚡
$newId = (int)$pdo->lastInsertId();  ⚡        $stmt->rowCount() // UPDATE/DELETE → 404 check ⚡
// named placeholders UNIQUE when EMULATE_PREPARES=false (:q_title, :q_author — else HY093)
$pdo->beginTransaction(); ... $pdo->commit();  catch { $pdo->rollBack(); }  ⚡
```

## LAYER 10 — JWT (Ch11)
```
JWT = base64url(header).base64url(payload).signature  ⚡
header {alg:'HS256', typ:'JWT'} · claims: iss, sub(user id), iat, exp, role, email  ⚡
HS256 symmetric (one secret — this course) vs RS256 asymmetric. Signed ≠ encrypted: payload readable!
Bearer header: Authorization: Bearer <token>   · 401 = no/bad token · 403 = wrong role  ⚡
```
```php
composer require firebase/php-jwt          .env: JWT_SECRET / JWT_TTL=3600 / JWT_ISSUER=books-api
$hash = password_hash($plain, PASSWORD_DEFAULT);  ⚡           // register
if (password_verify($plain, $row['password_hash'])) {...}  ⚡  // login (plain, hash)
$payload = ['iss'=>$issuer, 'sub'=>$userId, 'iat'=>$now, 'exp'=>$now + $ttl, 'role'=>$u['role']];  ⚡
$token = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');  ⚡
$decoded = (array)JWT::decode($m[1], new Key($_ENV['JWT_SECRET'], 'HS256'));  ⚡
// AuthMiddleware:
$hdr = $req->getHeaderLine('Authorization');  ⚡
if (!preg_match('/^Bearer\s+(.+)$/i', $hdr, $m)) return $this->fail(...);  ⚡   // 401 + WWW-Authenticate: Bearer
$req = $req->withAttribute('auth', $payload);  return $h->handle($req);  ⚡
// routes: public GETs + /auth/register + /auth/login; protected:
$app->get('/auth/me', [$authCtrl,'me'])->add($auth);  ⚡
$app->group('/api/books', fn($g)=>...post/put/delete...)->add($auth);  ⚡
// admin-only delete:
$auth = (array)$req->getAttribute('auth', []);
if (($auth['role'] ?? 'member') !== 'admin') return $this->json($res, ['error'=>'Admins only'], 403);  ⚡
// login response: { token_type:'Bearer', expires_in:3600, access_token:'eyJ...' }
```

---

## THE 12 DEADLY TRAPS (read this the morning of the exam)
1. `count.value++` in script — bare `{{ count }}` in template.
2. `setup()` must `return` everything the template touches.
3. `useRoute()` reads params; `useRouter()` navigates.
4. `Number(route.params.id)` before `===` comparisons.
5. `if (!response.ok) throw` — fetch never rejects on 404.
6. Axios data is at `res.data`.
7. `res.status(201).json(...)` — status BEFORE json; Express needs `express.json()` for req.body.
8. mysql2: `const [rows] = await pool.query(sql, [vals])`.
9. PDO: `lastInsertId()` on $pdo, `rowCount()` on $stmt; unique named placeholders.
10. Slim PSR-7 is immutable — RETURN the response from `withHeader/withStatus`.
11. `password_verify(plain, hash)` — plain first. `JWT::decode` needs `new Key(secret, 'HS256')`.
12. 401 = unauthenticated, 403 = unauthorized (role). CORS allow-headers must include `Authorization`.

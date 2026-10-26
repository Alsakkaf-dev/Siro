# MOCK FINAL v1 — ANSWER KEY

## Section A — MCQ (1 mark each)

| Q | Ans | One-line rationale |
|---|-----|--------------------|
| A1 | B | Bytecode + JVM = platform independence. |
| A2 | B | Client → HTTP request → server → DB → response (HTML/JSON) → client. |
| A3 | B | Dashboard/real-time/API-driven = SPA per the Ch1 "when to use" slide. |
| A4 | C | Android Studio builds/compiles APK/AAB; Xcode does IPA. |
| A5 | D | The web server is backend; HTML/CSS/JS are frontend. |
| A6 | B | `for` attribute matches the input's `id`. |
| A7 | B | 62.5% of 16px = 10px → 1rem = 10px. |
| A8 | A | space-between pushes flex children to opposite ends. |
| A9 | B | auto-fit collapses empty tracks (cards stretch). |
| A10 | B | Lab constraint: pure DOM API practice + textContent is injection-safe. |
| A11 | C | findIndex → index or −1. |
| A12 | B | Bubbling lets a parent listener serve dynamic children. |
| A13 | C | confirm = boolean dialog. |
| A14 | D | JSON has no functions (nor undefined). |
| A15 | B | responseText is a raw string — parse it. |
| A16 | C | Sync logs 1, 2; the .then callback runs later → 3. |
| A17 | B | .json() returns a Promise resolving to the parsed body. |
| A18 | C | toggleClass adds-if-absent / removes-if-present. |
| A19 | A | $(document).ready defers until the DOM is parsed. |
| A20 | B | Reactivity: data drives the DOM automatically. |
| A21 | A | createApp(options).mount('#app'). |
| A22 | B | Templates auto-unwrap refs. |
| A23 | C | v-model.number casts to number. |
| A24 | A | v-model on select = two-way sync with the chosen option. |
| A25 | B | views/ = route-level pages; components/ = reusable pieces. |
| A26 | B | Arrow + import() = lazy-loaded route. |
| A27 | B | axios.create({ baseURL, timeout, headers }). |
| A28 | A | params = declared path segments; query = ?key=value pairs. |
| A29 | C | fetchColumn returns the single scalar. |
| A30 | B | iss/sub/iat/exp are the registered claims; role is a custom claim. |

**Section A total: /30**

---

## Section B — Structured (2 marks per blank)

### B1 — Vue Profile Card
| # | Answer | Why |
|---|--------|-----|
| 1 | `v-for="(skill, i) in skills"` | Item + index form — removeSkill(i) needs the index. |
| 2 | `v-else` | Complement of the `v-if="skillCount === 0"` branch. |
| 3 | `v-model="name"` | Two-way binding: input edits the heading live. |
| 4 | `@keyup.enter="addSkill"` | Enter key modifier triggers the add. |
| 5 | `computed(() => skills.value.length)` | Cached derived count; `.value` required in script. |
| 6 | `skills.value.push(s)` | Push into the ref's array via `.value`. |
| 7 | `return { name, skills, newSkill, skillCount, addSkill, removeSkill }` | Everything the template uses must be returned from setup(). |

### B2 — Router + Pinia store
| # | Answer | Why |
|---|--------|-----|
| 1 | `createWebHistory` | Second factory import used in the history option. |
| 2 | `/todos/:id` | `:id` declares the dynamic parameter. |
| 3 | `defineStore` | The Pinia store factory. |
| 4 | `filter(t => t.done)` | doneCount = completed items' array length. |
| 5 | `Date.now()` | The lab's unique-id generator. |
| 6 | `find(t => t.id === id)` | Locate the matching todo before flipping. |
| 7 | `Number(route.params.id)` | URL params are strings; ids are numbers — convert for `===`. |

### B3 — Fetch + Axios
| # | Answer | Why |
|---|--------|-----|
| 1 | `!response.ok` | fetch resolves on 404/500 — must check ok manually. |
| 2 | `await response.json()` | Body parsing is async too. |
| 3 | `"POST"` | Creating a resource. |
| 4 | `"application/json"` | Announces the payload format. |
| 5 | `JSON.stringify(newPost)` | Body must be a JSON string. |
| 6 | `axios.create` | Builds the configured instance. |
| 7 | `config.headers.Authorization` | The interceptor attaches `Bearer <token>` to that header. |

### B4 — Express REST API
| # | Answer | Why |
|---|--------|-----|
| 1 | `createPool` | One pool reused across requests (never createConnection per call). |
| 2 | `express.json()` | Parses application/json into req.body. |
| 3 | `req.params.id` | The `:id` path parameter, bound via placeholder. |
| 4 | `rows[0]` | Single-record endpoint returns the object, not the array. |
| 5 | `?, ?, ?` | Three positional placeholders matching the three values. |
| 6 | `status(201)` | Created — chained before .json(). |
| 7 | `!r.affectedRows` | Zero affected rows = nothing deleted = 404. |

### B5 — JWT on the Books API
| # | Answer | Why |
|---|--------|-----|
| 1 | `password_verify` | Checks the plain attempt against the bcrypt hash (plain first!). |
| 2 | `401` | Bad credentials = Unauthorized. |
| 3 | `$now + 3600` | exp = issued-at + TTL seconds. (Also accept `$now + (int)$_ENV['JWT_TTL']`.) |
| 4 | `encode` | JWT::encode(payload, secret, algorithm) signs the token. |
| 5 | `new Key($_ENV['JWT_SECRET'], 'HS256')` | decode requires the Key wrapper with pinned algorithm. |
| 6 | `->add($auth)` | Attaches AuthMiddleware to the whole write group. |
| 7 | `403` | Authenticated but wrong role = Forbidden (401 would mean no/invalid token). |

**Section B total: /70 — Paper total: /100**

---

## Self-marking guide
- Award the 2 marks only for an exact, runnable line (his variable names). Half-mark (1) yourself if the idea is right but syntax wrong (e.g., `skills.push(s)` missing `.value`) — in the real exam such slips usually lose the mark, so log every half-mark as a re-drill item.
- < 25/30 in Section A → re-run `02_Drills/Drill_MCQ_Bank.md`.
- Any structured question < 10/14 → redo the matching drill set (B1→Set 3, B2→Set 3, B3→Set 2, B4→Set 4, B5→Set 5) and re-write that mastery doc's ⚡ anchors by hand.

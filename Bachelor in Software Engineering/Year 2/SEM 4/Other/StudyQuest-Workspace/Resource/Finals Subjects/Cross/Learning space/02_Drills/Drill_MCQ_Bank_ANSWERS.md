# Drill MCQ Bank — ANSWERS + Rationale

| Q | Ans | Rationale |
|---|-----|-----------|
| 1 | B | The slides' definition verbatim: develop once, run on multiple OS/devices with minimal modification. |
| 2 | B | Java: source → compiler → **bytecode** → **JVM** → OS. "Write Once, Run Anywhere". |
| 3 | C | MPA = server-centric full reloads; SPA = one load, JS updates sections, backend provides JSON via API. |
| 4 | B | Hybrid = SPA (HTML/CSS/JS) loaded by a **WebView** inside a native Android/iOS container. |
| 5 | B | Wrapper roles slide: web-to-native bridge, WebView container, plugin management, packaging. They complement (not replace) Android Studio/Xcode. |
| 6 | C | Gecko = Firefox. Chrome/Edge = Blink; Safari = WebKit; Trident = old IE. |
| 7 | B | `scope="col"` governs the cells **below**; `scope="row"` governs cells to the right. |
| 8 | B | `box-sizing: border-box` makes padding+border part of declared width — the lab's reset. |
| 9 | B | auto-fit + minmax = responsive card grid; empty tracks collapse so cards stretch. |
| 10 | B | renderNotes() re-runs per change; listeners attached there would stack up — attach once in init(). |
| 11 | C | Single quotes are illegal in JSON — keys/strings need double quotes. |
| 12 | B | stringify converts object → JSON **string**. |
| 13 | B | Third open() argument = async flag; true = non-blocking. |
| 14 | B | First .then = Response envelope; `.json()` is async (returns a Promise) → data lands in the second .then. |
| 15 | B | fetch only rejects on network failure; 404/500 still resolve — hence the `response.ok` check. |
| 16 | B | Promise states: pending → fulfilled / rejected. |
| 17 | B | `.val()` is the jQuery getter/setter for form input values. |
| 18 | B | Vue slide: progressive framework for UIs, Evan You, 2014, MIT, vuejs.org. |
| 19 | B | setup() = Composition API entry point; whatever it returns is template-visible. |
| 20 | B | `.value` in script, auto-unwrapped in template — the #1 Vue trap. |
| 21 | B | v-bind → `:`; v-on → `@`. |
| 22 | C | v-if = DOM add/remove (rare toggles); v-show = display:none toggle (frequent). |
| 23 | B | Computed = cached, dependency-tracked; method re-runs every call. |
| 24 | B | `npm create vue@latest` — create-vue powered by Vite (replaces Vue CLI). |
| 25 | B | scoped rewrites selectors so CSS only matches this component's elements. |
| 26 | B | Mantra: props down, events up; shared state → Pinia. |
| 27 | B | useRoute() reads params; useRouter() navigates. (C is Options-API style, not the course's.) |
| 28 | B | Setup-store rule: only returned names are public. State is refs; it does NOT survive reload. |
| 29 | B | The slides' exact advantage list. Nothing bypasses CORS. |
| 30 | C | Axios puts the parsed body in `res.data`. |
| 31 | B | express.json() = body parser middleware for application/json. |
| 32 | B | err.request without err.response = request sent, nothing came back (server down/unreachable). |
| 33 | C | PUT is idempotent (same result if repeated). GET is safe+idempotent; POST is NOT idempotent; DELETE IS idempotent. |
| 34 | B | Slim = micro framework on PSR-7 + PSR-15. |
| 35 | B | PSR-7 immutability: withX() returns a NEW response — always return it. |
| 36 | B | Prepared statements separate code from data — the injection string is never executed as SQL. |
| 37 | B | The three sacred options: ERRMODE_EXCEPTION, FETCH_ASSOC, EMULATE_PREPARES=false. |
| 38 | B | lastInsertId() on the PDO connection; rowCount() on the statement. |
| 39 | A | header.payload.signature — each base64url encoded; signature = HMAC of the first two. |
| 40 | B | Valid token (authenticated) but insufficient role → **403 Forbidden**. 401 = missing/invalid token. |

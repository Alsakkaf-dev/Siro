# Drill MCQ Bank — 40 Questions (all chapters, slides' terminology)

> Mirrors the 30-mark MCQ section. Answers + rationale in `Drill_MCQ_Bank_ANSWERS.md`.
> Coverage: Ch1 (Q1–5) · Ch2–3 (Q6–10) · Ch4–5 (Q11–17) · Ch6 (Q18–23) · Ch7 (Q24–28) · Ch8 (Q29–32) · Ch9 (Q33–35) · Ch10 (Q36–38) · Ch11 (Q39–40).

---

**Q1.** Cross-platform application development refers to the ability to:
A. Compile separate codebases per operating system
B. Develop an application once and run it on multiple operating systems or devices with minimal modification
C. Run applications only inside the Java Virtual Machine
D. Convert desktop apps into mobile apps automatically

**Q2.** In the Java approach to cross-platform development, source code is compiled into ______ which runs on the ______.
A. machine code / operating system
B. bytecode / Java Virtual Machine
C. WebAssembly / browser
D. scripts / interpreter

**Q3.** Which statement correctly contrasts MPA and SPA?
A. MPA updates parts of the page; SPA reloads the entire page
B. MPA is client-centric; SPA is server-centric
C. MPA reloads the entire page per action; SPA loads once and updates sections via JS, with the backend returning JSON
D. MPA requires WebSockets; SPA requires CGI

**Q4.** In a hybrid mobile app, the SPA runs inside a:
A. JVM
B. WebView container provided by the native app
C. Docker container
D. Browser extension

**Q5.** Which of the following is the role of wrappers like Cordova / Capacitor / Ionic?
A. Compile JavaScript to Kotlin and Swift
B. Provide a web-to-native bridge, WebView container, plugin management and cross-platform packaging
C. Replace the need for Android Studio or Xcode entirely
D. Render HTML using the Gecko engine

**Q6.** Which pairing of browser to rendering engine is correct?
A. Chrome → WebKit
B. Safari → Blink
C. Firefox → Gecko
D. Edge → Trident

**Q7.** In an accessible HTML table, `scope="col"` on a `<th>` means:
A. The header applies to all cells to its right
B. The header applies to all cells below it in that column
C. The cell spans multiple columns
D. The column is sortable

**Q8.** Which CSS line makes padding and border count inside an element's declared width?
A. `margin: auto;`
B. `box-sizing: border-box;`
C. `display: block;`
D. `overflow: hidden;`

**Q9.** `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));` causes:
A. Exactly 260 columns
B. Cards of at least 260px that fill the row and wrap automatically, with empty tracks collapsing
C. A single column at all widths
D. Horizontal scrolling beyond 260px

**Q10.** In the Quick Notes lab, why must `addEventListener` calls NOT be placed inside `renderNotes()`?
A. Event listeners are forbidden inside functions
B. renderNotes() runs every time the list changes, so duplicate listeners would accumulate
C. The browser only allows one listener per page
D. renderNotes() runs before the DOM exists

**Q11.** Which of the following is INVALID JSON?
A. `{"name": "Ahmad", "age": 22}`
B. `[{"id": 1}, {"id": 2}]`
C. `{'name': 'Ahmad'}`
D. `{"active": true, "score": null}`

**Q12.** `JSON.stringify({a: 1})` returns:
A. A JavaScript object
B. The string `'{"a":1}'`
C. A Promise
D. `undefined`

**Q13.** In the XHR pattern, `xhr.open("GET", url, true)` — the third argument `true` means:
A. Use HTTPS
B. The request is asynchronous (non-blocking)
C. Send credentials
D. Parse JSON automatically

**Q14.** Why does a basic `fetch()` chain need TWO `.then()` calls?
A. The first retries failed requests
B. The first receives the Response object; `.json()` returns another Promise that resolves to the data in the second
C. Fetch requires one .then per HTTP header
D. The second .then handles errors

**Q15.** Which statement about fetch error behaviour is TRUE?
A. fetch rejects its promise on a 404 response
B. fetch rejects only on network failure; you must check `response.ok` for HTTP errors
C. fetch automatically retries 500 errors
D. fetch throws a SyntaxError on 401

**Q16.** A Promise can be in which three states?
A. open, closed, errored
B. pending, fulfilled, rejected
C. ready, loading, done
D. sync, async, await

**Q17.** In jQuery, which snippet correctly reads the value of a text input with id `nameInput`?
A. `$("#nameInput").text()`
B. `$("#nameInput").val()`
C. `$("#nameInput").html()`
D. `$("nameInput").value`

**Q18.** Vue.js is best described as:
A. A full server-side framework backed by Google
B. A progressive JavaScript framework for building user interfaces, created by Evan You
C. A CSS preprocessor
D. A database ORM backed by Meta

**Q19.** In the Composition API, what is `setup()`?
A. A lifecycle hook that runs on unmount
B. The entry point that declares reactive state and returns what the template can use
C. A method for registering global components
D. The function that mounts the app

**Q20.** Given `const count = ref(0)`, how do you increment it inside a JS function and render it in the template?
A. `count++` / `{{ count.value }}`
B. `count.value++` / `{{ count }}`
C. `count.value++` / `{{ count.value }}`
D. `count++` / `{{ count }}`

**Q21.** Which directive pair is correct?
A. `v-bind` shorthand is `@`, `v-on` shorthand is `:`
B. `v-bind` shorthand is `:`, `v-on` shorthand is `@`
C. Both shorten to `$`
D. Neither has a shorthand

**Q22.** v-if vs v-show — which is TRUE?
A. v-show removes the element from the DOM
B. v-if toggles `display:none`
C. v-if adds/removes the element from the DOM; v-show keeps it rendered and toggles CSS display
D. They are aliases

**Q23.** A computed property differs from a method because a computed property:
A. Cannot use reactive state
B. Is cached and re-evaluates only when its dependencies change
C. Runs on every DOM event
D. Must return a Promise

**Q24.** The command to scaffold a new Vue 3 project (the course's way) is:
A. `vue create my-app`
B. `npm create vue@latest`
C. `npx create-react-app`
D. `composer create-project vue/vue`

**Q25.** In a Single File Component, `<style scoped>` means:
A. Styles are inlined into the elements
B. The CSS only affects elements of this component
C. Styles load before the template
D. The CSS is global but minified

**Q26.** Component communication in Vue follows which direction rule?
A. Props up, events down
B. Props down (parent→child), events up (child→parent)
C. Everything through localStorage
D. Children mutate parent data directly

**Q27.** Inside a component, you need to READ the `:id` from `/todos/:id`. Which is correct?
A. `const router = useRouter(); router.params.id`
B. `const route = useRoute(); route.params.id`
C. `this.$route.query.id`
D. `import.meta.env.id`

**Q28.** In a Pinia setup-style store, which statement is TRUE?
A. State must be a plain object literal
B. Only the names returned from the setup function become the store's public API
C. Actions must be declared with the `actions:` option
D. Pinia state survives a full page reload by default

**Q29.** Why did the course choose Axios over fetch? Pick the TRUE advantage set.
A. Axios is built into the browser
B. Auto JSON parsing, rejects on 4xx/5xx, interceptors and instances
C. Axios works without promises
D. Axios bypasses CORS

**Q30.** After `const res = await apiClient.get('/students/1')`, the parsed record is in:
A. `res.body`
B. `res.json()`
C. `res.data`
D. `res.payload`

**Q31.** In Express, `app.use(express.json())` exists so that:
A. Responses are compressed
B. `req.body` contains the parsed JSON payload of incoming requests
C. Static files are served
D. CORS headers are added

**Q32.** An Axios error handler sees `err.response` is undefined but `err.request` exists. This means:
A. The server returned 404
B. The request was sent but no response arrived (e.g., API server down)
C. The request config was invalid
D. CORS succeeded

**Q33.** Which HTTP verb/property pairing is correct (REST)?
A. GET — not idempotent
B. POST — idempotent
C. PUT — idempotent
D. DELETE — unsafe and not idempotent

**Q34.** Slim 4 is described in the course as:
A. A full-stack framework with built-in ORM and admin panel
B. A PHP micro framework built on PSR-7 (request/response) and PSR-15 (middleware)
C. A Node.js routing library
D. A template engine

**Q35.** In Slim, `withHeader()` and `withStatus()` must be handled carefully because:
A. They mutate the response in place
B. The PSR-7 response is immutable — they return a NEW object which you must return
C. They only work inside middleware
D. They require the JSON extension

**Q36.** The biggest security reason to use `prepare()`/`execute()` with placeholders is:
A. Faster queries
B. The user's data is sent as parameters and never becomes part of the SQL string — preventing SQL injection
C. Smaller database size
D. Automatic input trimming

**Q37.** Which PDO option set is the course's standard?
A. ERRMODE_SILENT + FETCH_NUM + EMULATE_PREPARES=true
B. ERRMODE_EXCEPTION + FETCH_ASSOC + EMULATE_PREPARES=false
C. ERRMODE_WARNING + FETCH_BOTH
D. No options needed

**Q38.** After an INSERT and an UPDATE respectively, which calls report the new id and the number of changed rows?
A. `$stmt->insertId()` / `$pdo->rowCount()`
B. `$pdo->lastInsertId()` / `$stmt->rowCount()`
C. `$pdo->newId()` / `$stmt->affected()`
D. `$stmt->fetchColumn()` / `$pdo->count()`

**Q39.** A JWT consists of three base64url parts separated by dots:
A. header.payload.signature
B. secret.payload.checksum
C. issuer.subject.expiry
D. token.claims.hash

**Q40.** A logged-in member (role=member) sends a valid token with `DELETE /api/books/1`, which requires admin. The correct response is:
A. 401 Unauthorized
B. 403 Forbidden
C. 404 Not Found
D. 200 OK

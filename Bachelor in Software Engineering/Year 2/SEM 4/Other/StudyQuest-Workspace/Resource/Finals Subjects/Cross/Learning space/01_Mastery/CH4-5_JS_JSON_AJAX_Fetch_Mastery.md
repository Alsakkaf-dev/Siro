# CH4–5 Mastery — JSON, AJAX, Fetch API, jQuery & Async JavaScript

> Sources: Lab 3 hands-on (w4-lab-handons-json-ajax-fetch-jquery), Lab Exercise 3 (WeatherNow dashboard), Ch1 Web Architecture (async evolution). Ch5 (Event Loop/Promises) has no slide PDF in the folder, but its content is fully exercised inside Lab 3's Fetch/async-await material — master these patterns and Ch5 is covered.
> Example-app worlds the professor uses: **jsonplaceholder.typicode.com users/posts**, **User Card Directory**, **Live User Search (jQuery)**, **Country Info App**, **WeatherNow (Open-Meteo + WorldTimeAPI)**.

---

## 1. The Mental Model (5 lines)

1. **JSON** is the text format both sides exchange; `JSON.parse()` string→object, `JSON.stringify()` object→string. Keys in **double quotes**, no trailing commas, no functions/undefined.
2. **AJAX** = asking the server for data **in the background** without reloading the page (XHR is the classic object; status 200 = OK, 201 = Created).
3. **Fetch** is the modern promise-based replacement: first `.then` gets the **Response** (must call `.json()` — also async!), second `.then` gets the data. It does **NOT reject on 404** — check `response.ok` yourself.
4. **async/await** is sugar over promises: `await` pauses inside an `async` function; wrap in `try/catch`; `throw new Error(...)` on `!response.ok`.
5. **jQuery** = "Write Less, Do More": `$()` selects with CSS syntax, `.text()/.val()/.attr()/.append()` manipulate, `$.get()/$.ajax()` do AJAX, `$(document).ready()` waits for DOM.

---

## 2. JSON — every line he teaches

```json
{
  "name": "Ahmad Hafiz",
  "age": 22,
  "isEnrolled": true,
  "gpa": 3.8,
  "subjects": ["Math", "Physics", "Programming"],
  "address": { "city": "Johor Bahru", "country": "Malaysia" }
}
```
Rules (his 5): `{}` object, `[]` array, **keys = double-quoted strings**, values = string/number/boolean/null/array/object, comma-separated with **no trailing comma**.

```js
const jsonString = '{"name":"Ahmad","age":22}';
const student = JSON.parse(jsonString);            // ⚡ string → object
console.log(student.name);                         // Ahmad

const result = JSON.stringify({ name: "Siti", age: 21 }); // ⚡ object → string
JSON.stringify(myObject, null, 2);                 // pretty-print, 2-space indent
```
Classic wrong answers: single quotes `{'name':'Ahmad'}` ✗, trailing comma ✗, undefined/functions ✗.

---

## 3. Classic AJAX — XMLHttpRequest (5 steps, his numbering)

```js
const xhr = new XMLHttpRequest();                  // 1. create  ⚡
xhr.open("GET", "https://jsonplaceholder.typicode.com/users/1", true); // 2. configure ⚡ (true = async)

xhr.onload = function() {                          // 3. response handler ⚡
  if (xhr.status === 200) {                        // ⚡ 200 = OK
    const data = JSON.parse(xhr.responseText);     // ⚡ parse responseText
    console.log("Name:", data.name);
  } else {
    console.log("Error! Status:", xhr.status);
  }
};
xhr.onerror = function() {                         // 4. network error
  console.log("Network error occurred");
};
xhr.send();                                        // 5. send ⚡
```

**XHR POST** (the three extra lines):
```js
xhr.open("POST", url, true);
xhr.setRequestHeader("Content-Type", "application/json"); // ⚡ tell server the format
xhr.onload = function() { if (xhr.status === 201) { ... } }; // ⚡ 201 = Created
xhr.send(JSON.stringify(newPost));                 // ⚡ must stringify the body
```

**Async execution order demo (exam favourite):**
```js
console.log("1. Code starts");
xhr.onload = function() { console.log("3. Data received!"); };
xhr.send();
console.log("2. This runs BEFORE the data arrives");
// Output order: 1 → 2 → 3   (async = don't wait)
```

---

## 4. Promises (3 states) + Fetch

Promise states: **Pending → Fulfilled (.then) / Rejected (.catch)**.

### 4.1 Fetch GET — the two-.then dance
```js
fetch("https://jsonplaceholder.typicode.com/users/1")  // ⚡ fetch returns a Promise
  .then(function(response) {
    console.log(response.status);                  // 200
    return response.json();                        // ⚡ .json() ALSO returns a Promise
  })
  .then(function(data) {                           // ⚡ second .then has the actual data
    console.log("User name:", data.name);
  })
  .catch(function(error) {                         // network failures land here
    console.log("Something went wrong:", error);
  });
```
*Why two `.then`s:* first gives the **Response envelope** (status/headers); body must be read with `.json()`, which is async.

### 4.2 Fetch with async/await (his "recommended style")
```js
async function getUser(id) {                       // ⚡ async keyword
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`); // ⚡ await + template literal
    if (!response.ok) {                            // ⚡ fetch does NOT reject on 404 — check ok
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const user = await response.json();            // ⚡ await the json too
    console.log("Name:", user.name);
  } catch (error) {                                // ⚡ try/catch replaces .catch()
    console.log("Error:", error.message);
  }
}
getUser(1);
```

### 4.3 Fetch POST (the exam's #1 fetch pattern)
```js
const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
  method: "POST",                                  // ⚡
  headers: { "Content-Type": "application/json" }, // ⚡
  body: JSON.stringify(newPost)                    // ⚡ object → JSON string
});
const data = await response.json();
```

### 4.4 AbortController timeout (WeatherNow Task 4)
```js
const controller = new AbortController();          // ⚡
const timeoutId = setTimeout(() => controller.abort(), 10000);
const response = await fetch(url, { signal: controller.signal }); // ⚡ pass the signal
clearTimeout(timeoutId);
```

### 4.5 User Card mini-project core (DOM + fetch together)
```js
async function loadUsers() {
  status.textContent = "Loading...";
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");
    if (!response.ok) throw new Error("Failed to fetch users");
    const users = await response.json();
    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h3>${user.name}</h3><p>${user.email}</p>`; // (allowed in THIS lab)
      grid.appendChild(card);
    });
  } catch (error) {
    status.textContent = "Error: " + error.message;
  }
}
```

### 4.6 WeatherNow chained requests (geocode → forecast)
```js
// 1) city name → lat/lon
const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
const geoData = await geo.json();
if (!geoData.results || geoData.results.length === 0) { showError("City not found"); return; }
const { latitude, longitude } = geoData.results[0];
// 2) lat/lon → weather
const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
```

---

## 5. jQuery — everything he listed

### 5.1 Include + ready
```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script> <!-- jQuery BEFORE your script -->
```
```js
$(document).ready(function() { ... });             // ⚡ wait for DOM
$(function() { ... });                             // shorter, same thing
```

### 5.2 Selectors mirror CSS
`$("#myDiv")` `$(".card")` `$("p")` `$("ul li")` `$("input[type=text]")` `$(this)`

### 5.3 The method table (set vs get)
```js
$("#title").text();            $("#title").text("New Title");   // text get/set ⚡
$("#box").html("<b>Bold</b>"); // html set
$("#nameInput").val();         $("#nameInput").val("John");     // ⚡ form value
$("#flag").attr("src", url);                                    // ⚡ attribute
$("#box").css("color", "red");
$("#box").addClass("highlight").removeClass("x").toggleClass("y");
$("#box").hide(); .show(); .toggle(); .fadeIn(500); .fadeOut(500); .slideDown(300);
$("#results").append(cardHtml); .prepend(); .empty(); .remove(); // ⚡ append/empty
```

### 5.4 Events
```js
$("#submitBtn").click(function() {                 // ⚡
  const name = $("#nameInput").val();
  $("#output").text("Hello, " + name + "!");
});
$("#searchBox").keyup(function() {                 // ⚡ live search trigger
  const query = $(this).val().toLowerCase().trim();
});
$("#countryInput").keypress(function(e) {
  if (e.which === 13) $("#searchBtn").click();     // Enter key in jQuery = e.which === 13
});
$(".card").hover(fnIn, fnOut);
```

### 5.5 jQuery AJAX
```js
$.get("https://jsonplaceholder.typicode.com/users/1", function(data) {  // ⚡ $.get(url, callback)
  console.log(data.name);
});

$.ajax({
  url: "https://jsonplaceholder.typicode.com/posts",
  method: "POST",
  dataType: "json",
  contentType: "application/json",                 // ⚡ what we SEND
  data: JSON.stringify({ title: "jQuery AJAX Post", userId: 1 }),
  success: function(response) { console.log(response.id); },  // ⚡
  error: function(xhr, status, error) { console.log(error); }
});

// WeatherNow Task 3 requires promise-style chaining instead of callbacks:
$.getJSON(url)
  .done(function(data) { ... })                    // ⚡ success
  .fail(function() { ... })                        // failure
  .always(function() { console.log(Date.now()); });// runs either way
```

### 5.6 Live Search core (filter as you type)
```js
const matches = allUsers.filter(function(user) {
  return user.name.toLowerCase().includes(query) ||
         user.email.toLowerCase().includes(query); // ⚡ filter + includes
});
$("#results").empty();
matches.forEach(function(user) { $("#results").append(cardTemplate(user)); });
```

---

## 6. Memorization anchors ⚡ (Ch4–5)

1. `JSON.parse(jsonString)` / `JSON.stringify(obj)` / `JSON.stringify(obj, null, 2)`
2. `const xhr = new XMLHttpRequest();`
3. `xhr.open("GET", url, true);`
4. `xhr.onload = function() { if (xhr.status === 200) { JSON.parse(xhr.responseText) } }`
5. `xhr.setRequestHeader("Content-Type", "application/json");`
6. `xhr.send(JSON.stringify(newPost));`
7. `return response.json();` (and WHY: it returns another Promise)
8. `if (!response.ok) throw new Error(\`HTTP Error! Status: ${response.status}\`);`
9. `const response = await fetch(url);` + `const data = await response.json();`
10. `method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(x)`
11. `async function getUser(id) { try { ... } catch (error) { ... } }`
12. `const controller = new AbortController();` → `fetch(url, { signal: controller.signal })`
13. `$(document).ready(function() { ... });`
14. `$("#searchBox").keyup(...)` + `$(this).val()`
15. `$.get(url, function(data) { ... })`
16. `.done() / .fail() / .always()`
17. `$("#flag").attr("src", country.flags.png);` `$("#info").empty(); $("#info").append(...)`
18. `allUsers.filter(u => u.name.toLowerCase().includes(query))`
19. Status codes: 200 OK, 201 Created, 400, 401, 403, 404, 500
20. Output-order question: sync logs first, onload/then callbacks last.

---

## 7. MCQ trivia (Ch4–5)

- JSON = JavaScript Object Notation; most popular web data format; language-independent.
- JSON does NOT support: functions, undefined, comments, trailing commas, single quotes.
- AJAX = Asynchronous JavaScript And XML; updates part of the page without reload.
- XHR introduced by **Microsoft (IE5)**; foundation of AJAX.
- Fetch is **promise-based**, part of modern JS (ES6 era); async/await arrived **ES8/ES2017**.
- Fetch does **not** auto-parse JSON and does **not** reject on HTTP 4xx/5xx (only on network failure).
- A Promise has 3 states: **pending, fulfilled, rejected**.
- `.json()` returns a **Promise** — hence two `.then()` or two `await`s.
- 200 OK, 201 Created (after POST), 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error.
- jQuery motto: "Write Less, Do More"; `$` is the jQuery function; selectors mirror CSS.
- jQuery year 2006; Fetch 2015; XHR 1999; JSON 2001 (his comparison table).
- `$.get` = shorthand GET; `$.ajax` = full control; `$.getJSON` = GET expecting JSON.
- WebSockets = full-duplex, single long-lived TCP connection, server can push (chat/games/live feeds).
- Debounce (WeatherNow): wait 500ms after typing stops before firing the API call.

---

## 8. Minimal-pair confusions (Ch4–5)

| A | B | Difference |
|---|---|---|
| `JSON.parse` | `JSON.stringify` | string→object vs object→string |
| `xhr.onload` | `xhr.onerror` | got a response (any status) vs network failure |
| `response.ok` | `response.status` | boolean (200–299) vs the actual number |
| `.then(r => r.json())` | `.then(data => ...)` | envelope step vs data step |
| `fetch` rejects | axios rejects | fetch: network errors only; axios: also on 4xx/5xx |
| `async` | `await` | marks the function vs pauses on a promise inside it |
| `try/catch` | `.catch()` | async/await style vs promise-chain style |
| `$.get()` | `$.ajax()` | quick GET vs fully-configured request |
| `.done/.fail/.always` | `success:/error:` | chained promise-style vs config callbacks |
| `e.key === "Enter"` | `e.which === 13` | vanilla modern vs jQuery keypress |
| `.text()` | `.html()` | escapes vs parses HTML |
| `.val()` | `.text()` | form inputs vs other elements |
| `==` | `===` | coerces types vs strict (always use ===) |
| `setTimeout(fn, 0)` | sync code | still runs AFTER all sync code (event loop) |

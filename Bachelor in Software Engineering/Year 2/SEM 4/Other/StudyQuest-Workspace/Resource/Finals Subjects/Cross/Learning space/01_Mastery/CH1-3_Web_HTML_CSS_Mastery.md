# CH1–3 Mastery — Web Landscape, HTML, CSS, JavaScript & DOM

> Sources: Ch1 slides (Intro + Web Architecture), Lab 1 (HTML), Lab 1B (CSS), Lab 2 (Quick Notes Dashboard — DOM/BOM), Lab 2 Kanban Task Board.
> Exam style: the professor blanks **exact lines from his own lab code**. Lines marked ⚡ are the highest-probability blanks.

---

## 1. The Mental Model (5 lines)

1. **Cross-platform = develop once, run on many platforms.** Two approaches: runtime-based (Java/JVM — WORA) and **browser-based (web tech — this course)**.
2. **Web app = 3-tier**: Presentation (browser: HTML/CSS/JS) → Application (web server: business logic) → Data (MySQL etc.), joined by HTTP request/response and SQL/ORM.
3. **MPA = server-centric** (full page reload, server renders HTML); **SPA = client-centric** (one load, JS updates parts, server returns JSON via API). SPA enables **hybrid mobile** (SPA inside a WebView, wrapped by Cordova/Capacitor/Ionic).
4. **HTML = structure, CSS = presentation, JavaScript = behaviour**; the browser's rendering engine (Blink/WebKit/Gecko) parses and renders them.
5. **DOM** is the page as objects (document.\*), **BOM** is the browser as objects (window, navigator, alert/confirm/prompt). JS manipulates both.

---

## 2. Chapter 1 — Architecture facts the MCQs love

| Concept | The line to remember |
|---|---|
| Cross-platform definition | "Develop an application **once** and run it on **multiple OS/devices** with minimal modification" |
| Java approach | Source → Compiler → **Bytecode** → **JVM** → OS ("Write Once, Run Anywhere") |
| Web approach | Any device with a **browser** runs the app; no OS-specific compilation |
| 3-tier | Presentation / Application / **Data** tier |
| MPA | Each action = new HTTP request → **entire page reload**, server-side rendering, good for SEO/content sites |
| SPA | One initial load → JS updates sections, backend returns **JSON** via REST/AJAX, good for dashboards/interactive apps |
| Hybrid mobile | SPA inside a **WebView** in a native container; wrapper = **Cordova / Capacitor / Ionic** |
| Wrapper roles | Web-to-Native **Bridge**, WebView container, **Plugin** management, cross-platform **packaging** |
| Android Studio / Xcode | Build APK/AAB (Android), IPA (iOS); emulator; native plugin integration |
| Rendering engines | Blink = Chrome/Edge/Opera; WebKit = Safari; Gecko = Firefox; Trident = old IE |
| REST verbs ↔ CRUD | GET=Read, POST=Create, PUT=Update(replace), DELETE=Delete |
| Async evolution | **XHR → jQuery AJAX → Fetch API (ES6, promises) → async/await (ES8) → WebSockets** (full-duplex, real-time) |
| JSON vs XML | JSON = lightweight, easy to parse, modern; XML = verbose, legacy |

---

## 3. HTML patterns (Lab 1 — portfolio page)

### 3.1 Document anatomy + semantic landmarks
```html
<!DOCTYPE html>                                    <!-- HTML5 doctype — first line, always -->
<html lang="en">                                   <!-- lang for accessibility -->
<head>
  <meta charset="UTF-8">                           <!-- character encoding -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">  <!-- ⚡ required for responsive -->
  <title>My Portfolio</title>
</head>
<body>
  <header> ... <h1>Name</h1> ... </header>         <!-- landmark: page banner -->
  <nav> ... </nav>                                 <!-- landmark: navigation -->
  <main>
    <section id="about"> ... </section>            <!-- at least two sections -->
    <section id="skills"> ... </section>
  </main>
  <footer><address>email@x.com</address></footer>  <!-- address only inside footer here -->
</body>
</html>
```

### 3.2 Table with full semantics (his exact suggested structure)
```html
<table border="1" cellpadding="8" cellspacing="0">
  <caption>Year 2 Academic Results</caption>       <!-- ⚡ caption is FIRST child of table -->
  <thead>
    <tr>
      <th scope="col" colspan="2">Semester 1 &amp; 2</th>  <!-- ⚡ scope="col" + colspan -->
      <th scope="col">Credits</th>
      <th scope="col">Grade</th>
    </tr>
  </thead>
  <tbody> ... <th scope="row">...</th> ... </tbody> <!-- scope="row" for row headers -->
  <tfoot>
    <tr><td colspan="2">Total</td><td><strong>120</strong></td></tr>
  </tfoot>
</table>
```
*Why:* `scope` tells screen readers which cells a header governs; `thead/tbody/tfoot` give structure; `colspan` merges across columns, `rowspan` down rows.

### 3.3 Form essentials
```html
<form action="#" method="post">                    <!-- ⚡ method="post" -->
  <fieldset>
    <legend>Contact</legend>                       <!-- groups related controls -->
    <label for="fullname">Name</label>             <!-- ⚡ label's for = input's id -->
    <input type="text" id="fullname" name="fullname"
           placeholder="Your full name" required maxlength="60">
    <input type="email" id="em" name="em" required>
    <input type="number" min="0" max="4" step="0.01">
    <input type="date">  <input type="range">  <input type="tel">
    <select name="subject">
      <optgroup label="General">
        <option value="hi">Hi</option>
      </optgroup>
    </select>
    <textarea rows="3"></textarea>
    <!-- radio buttons share the SAME name to form a group ⚡ -->
    <input type="radio" name="gender" value="male">
    <input type="radio" name="gender" value="female">
    <button type="submit">Send</button>
  </fieldset>
</form>
```

### 3.4 Media + inline text trivia
```html
<figure>
  <img src="me.jpg" alt="Portrait of Mohammed" width="200" height="200" title="hover text">
  <figcaption>Me at UTM</figcaption>
</figure>
```
- `<strong>/<em>` = **semantic** importance/emphasis; `<b>/<i>` = visual only (screen readers differ).
- `<blockquote cite="url">` + `<cite>` attribute the source; `<abbr title="...">`, `<dfn>`, `<sup>/<sub>`, `<mark>`, `<small>`.
- Inline style attribute = **highest CSS specificity**: `style="border: 2px solid navy; padding: 6px;"`.

---

## 4. CSS patterns (Lab 1B)

### 4.1 Design tokens in :root + reset
```css
@import url('https://fonts.googleapis.com/...');   /* @import must be at the VERY TOP */

:root {                                            /* ⚡ design-token home */
  --color-primary: #1a1a2e;
  --font-heading: 'Playfair Display', serif;
  --space-md: 1.5rem;
}
* { box-sizing: border-box; }                      /* ⚡ padding counts inside width */
html { font-size: 62.5%; }                         /* 1rem = 10px trick */
body { margin: 0; padding: 0; }

h1 { color: var(--color-primary); }                /* ⚡ var() usage */
```

### 4.2 Flexbox nav (his exact recipe)
```css
nav {
  display: flex;                                   /* ⚡ */
  justify-content: space-between;                  /* ⚡ logo left, links right */
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  position: sticky; top: 0;                        /* ⚡ sticky nav needs top */
  z-index: 10;
}
nav a { transition: color 0.2s, background-color 0.2s; }
```

### 4.3 CSS Grid (two signature lines)
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); /* ⚡ THE card-grid line */
  gap: 1.5rem;
}
.layout { grid-template-columns: 1fr 280px; }      /* main + fixed sidebar */
.featured { grid-column: span 2; }                 /* span full width */
.card:hover { transform: translateY(-4px); transition: transform 0.2s; }
```
- **auto-fit** collapses empty tracks (cards stretch to fill); **auto-fill** keeps empty tracks (gaps remain). Use auto-fit for card grids.

### 4.4 Mobile-first media queries (his documented breakpoints)
```css
/* base = mobile (320px+) */
.card-grid { grid-template-columns: 1fr; }

@media (min-width: 600px) {                        /* ⚡ tablet */
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {                       /* ⚡ desktop */
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}
img { max-width: 100%; height: auto; }             /* responsive images */
```
*Mobile-first = base styles for small screens; `min-width` queries ADD complexity for larger.*

### 4.5 Pseudo-class/element polish
```css
a:link {} a:visited {} a:hover {} a:active {}       /* LVHA order */
input:focus { box-shadow: 0 0 0 3px var(--color-accent); } /* accessible focus */
tbody tr:nth-child(even) { background: #eee; }      /* ⚡ zebra rows */
li:first-child { border-top: none; }
blockquote::before { content: '"'; }                /* pseudo-element needs content */
button:active { transform: scale(0.97); }
```

---

## 5. JavaScript & DOM (Lab 2 — Quick Notes Dashboard + Kanban Board)

**Lab constraint to remember: NO `innerHTML` to build items — only `createElement / textContent / classList / setAttribute / appendChild / remove()`.**

### 5.1 State + cached DOM references
```js
let notes = [];                                    // each: { id, title, content }
let nextId = 1;                                    // unique id counter

const notesContainer = document.getElementById("notesContainer");  // ⚡ getElementById
const titleInput     = document.getElementById("noteTitle");
const addBtn         = document.getElementById("addNoteBtn");
```

### 5.2 The render pattern (clear → empty-state → build each)
```js
function renderNotes() {
  while (notesContainer.firstChild) {              // ⚡ clear WITHOUT innerHTML
    notesContainer.removeChild(notesContainer.firstChild);
  }
  if (notes.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.textContent = "No notes yet. Add your first note!";
    notesContainer.appendChild(emptyMsg);
    updateCounter();
    return;
  }
  notes.forEach(note => {
    const noteDiv = document.createElement("div"); // ⚡ createElement
    noteDiv.classList.add("note-item");            // ⚡ classList.add
    noteDiv.setAttribute("data-id", note.id);      // ⚡ setAttribute data-*

    const titleSpan = document.createElement("span");
    titleSpan.textContent = note.title;            // ⚡ textContent = safe text

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-action", "delete");
    deleteBtn.setAttribute("data-id", note.id);

    noteDiv.appendChild(titleSpan);                // ⚡ appendChild builds the tree
    noteDiv.appendChild(deleteBtn);
    notesContainer.appendChild(noteDiv);
  });
  updateCounter();
}
```

### 5.3 Add / delete with BOM dialogs
```js
function addNote() {
  const title = titleInput.value.trim();           // ⚡ .value + .trim()
  if (title === "") {
    alert("Title cannot be empty!");               // BOM alert()
    titleInput.focus();
    return;                                        // guard clause
  }
  notes.push({ id: nextId++, title, content: contentInput.value.trim() });
  renderNotes();
  titleInput.value = "";                           // clear input after add
  titleInput.focus();
}

function deleteNoteById(id) {
  const ok = confirm("Are you sure you want to delete this note?"); // ⚡ confirm returns true/false
  if (!ok) return;
  const index = notes.findIndex(n => n.id === id); // ⚡ findIndex
  if (index !== -1) {
    notes.splice(index, 1);                        // ⚡ splice(index, 1) removes one
    renderNotes();
  }
}
```

### 5.4 Event listeners + EVENT DELEGATION (his favourite pattern)
```js
addBtn.addEventListener("click", addNote);         // ⚡ addEventListener("click", fn)

// ONE listener on the container handles ALL dynamically-created buttons:
notesContainer.addEventListener("click", (e) => {
  const btn = e.target.closest('[data-action="delete"]');  // ⚡ closest() finds the button
  if (btn) {
    const id = parseInt(btn.getAttribute("data-id"), 10);  // ⚡ parseInt(..., 10)
    deleteNoteById(id);
  }
});
```
*Why delegation:* dynamically created buttons don't exist at page load; events **bubble up** to the parent. Never attach listeners inside `renderNotes()` (duplicates!).

Kanban variant (event.target version):
```js
todoList.addEventListener('click', function(event) {
  const action = event.target.getAttribute('data-action'); // 'edit' or 'delete'
  const idStr  = event.target.getAttribute('data-id');
  if (!action || !idStr) return;
  const taskId = parseInt(idStr, 10);
  if (action === 'delete') { deleteTask(taskId); }
  if (action === 'edit')   { editTask(taskId);   }
});
```

### 5.5 BOM features
```js
const w = window.innerWidth;                       // ⚡ viewport width (BOM)
const h = window.innerHeight;
windowSizeSpan.textContent = `${w} x ${h} px`;     // template literal

window.addEventListener("resize", updateWindowSize); // ⚡ resize on window
userAgentSpan.textContent = navigator.userAgent;     // ⚡ navigator = BOM object

const newTitle = prompt("New title:", found.title);  // prompt returns string or null
titleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { addNote(); }              // ⚡ e.key === "Enter"
});
```

### 5.6 Kanban filter pattern
```js
card.classList.toggle('is-hidden', condition);     // add if true, remove if false — NOT style.display
```

---

## 6. Memorization anchors ⚡ (most-likely blanks, Ch1–3)

1. `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
2. `<th scope="col">` / `<th scope="row">` / `colspan="2"`
3. `<label for="fullname">` ↔ `id="fullname"`
4. `* { box-sizing: border-box; }`
5. `display: flex; justify-content: space-between; align-items: center;`
6. `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));`
7. `@media (min-width: 600px) { ... }`
8. `tbody tr:nth-child(even)`
9. `document.getElementById("notesContainer")`
10. `document.createElement("div")` → `.classList.add("note-item")` → `.setAttribute("data-id", note.id)` → `.appendChild(...)`
11. `titleSpan.textContent = note.title;`
12. `while (container.firstChild) { container.removeChild(container.firstChild); }`
13. `addBtn.addEventListener("click", addNote);`
14. `e.target.closest('[data-action="delete"]')`
15. `parseInt(btn.getAttribute("data-id"), 10)`
16. `notes.findIndex(n => n.id === id)` + `notes.splice(index, 1)`
17. `const ok = confirm("...")` / `alert("...")` / `prompt("msg", default)`
18. `window.innerWidth` / `window.addEventListener("resize", fn)` / `navigator.userAgent`
19. `if (e.key === "Enter")`
20. `classList.toggle('is-hidden', condition)`

---

## 7. MCQ trivia bank (Ch1–3)

- WORA belongs to **Java** (bytecode on JVM).
- SPA returns **JSON data**, MPA returns **full HTML pages**.
- SEO-heavy content site → **MPA**; dashboard/admin → **SPA**.
- Hybrid mobile app loads the SPA inside a **WebView**; bridges JS to camera/GPS via **plugins**.
- Capacitor/Cordova/Ionic = **wrappers**; Android Studio/Xcode = build/test/package (APK/AAB vs IPA).
- Blink (Chrome/Edge), WebKit (Safari), Gecko (Firefox).
- HTML = structure, CSS = presentation, JS = behaviour; web server = server-side logic.
- `<strong>` is semantic; `<b>` is presentational.
- `caption` goes immediately after `<table>` opening tag.
- Inline `style=""` has the **highest specificity**.
- `auto-fit` collapses empty tracks; `auto-fill` keeps them.
- Mobile-first uses **min-width** queries.
- `html { font-size: 62.5%; }` makes 1rem = 10px.
- DOM = document objects; BOM = window/navigator/dialogs (alert, confirm, prompt).
- `confirm()` returns boolean; `prompt()` returns string or **null** (Cancel).
- `textContent` is XSS-safe; `innerHTML` parses HTML (banned in his labs for building items).
- Event delegation works because events **bubble** from target up to ancestors.
- `window.innerWidth` = viewport, not screen.
- `e.key === "Enter"` replaces legacy `e.keyCode === 13`.

---

## 8. Minimal-pair confusions (Ch1–3)

| A | B | Difference |
|---|---|---|
| `textContent` | `innerHTML` | text only (safe) vs parses HTML (injection risk; banned for cards) |
| `getElementById('x')` | `querySelector('#x')` | by id only vs any CSS selector (first match) |
| `appendChild` | `append` | his labs use appendChild (single node) |
| `remove()` | `removeChild(child)` | element removes itself vs parent removes child |
| `margin` | `padding` | outside the border vs inside the border |
| `justify-content` | `align-items` | main axis vs cross axis |
| `auto-fit` | `auto-fill` | collapse vs keep empty tracks |
| `min-width` | `max-width` media | mobile-first vs desktop-first |
| `:nth-child` | `:nth-of-type` | counts all siblings vs same-tag siblings |
| `::before` | `:hover` | pseudo-ELEMENT (needs content) vs pseudo-CLASS |
| `confirm()` | `prompt()` | boolean vs string/null |
| `window` | `navigator` | browser window (size, events) vs browser identity (userAgent) |
| `splice` | `slice` | mutates/removes vs copies |
| `e.target` | `e.currentTarget` | element clicked vs element with the listener |
| MPA | SPA | server-rendered full reload vs client-rendered JSON updates |
